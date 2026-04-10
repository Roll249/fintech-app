import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { query, queryOne } from '../../shared/db/index.js';
import { AuthRequest } from '../../shared/middleware/auth.middleware.js';

const router = Router();

const QR_SECRET = process.env.QR_SECRET || 'qr-secret-key-change-me';
const QR_EXPIRY_MINUTES = 5;

// QR Payload interfaces
interface BaseQRPayload {
  version: string;
  type: 'RECEIVE' | 'TRANSFER' | 'BILL';
  timestamp: number;
  signature?: string;
}

interface ReceiveQRPayload extends BaseQRPayload {
  type: 'RECEIVE';
  userId: string;
  amount?: number;
  message?: string;
  autoAllocate: boolean;
}

interface TransferQRPayload extends BaseQRPayload {
  type: 'TRANSFER';
  senderId: string;
  targetUserId: string;
  targetBankCode?: string;
  amount: number;
  description: string;
}

// Generate HMAC signature
function signPayload(payload: Omit<BaseQRPayload, 'signature'>): string {
  const payloadStr = JSON.stringify(payload);
  return crypto
    .createHmac('sha256', QR_SECRET)
    .update(payloadStr)
    .digest('hex');
}

// Verify HMAC signature
function verifySignature(payload: BaseQRPayload): boolean {
  const { signature, ...payloadWithoutSig } = payload;
  const expectedSig = signPayload(payloadWithoutSig as Omit<BaseQRPayload, 'signature'>);
  return signature === expectedSig;
}

// Generate QR payload for receiving money
async function generateReceiveQR(userId: string, message?: string, autoAllocate?: boolean): Promise<ReceiveQRPayload> {
  const payload: Omit<ReceiveQRPayload, 'signature'> = {
    version: '1.0',
    type: 'RECEIVE',
    userId,
    message,
    autoAllocate: autoAllocate ?? true,
    timestamp: Date.now(),
  };

  const signature = signPayload(payload);

  // Save to database
  await query(
    `INSERT INTO qr_codes (user_id, qr_type, payload, signature, expires_at)
     VALUES ($1, 'RECEIVE', $2, $3, NOW() + INTERVAL '${QR_EXPIRY_MINUTES} minutes')`,
    [userId, JSON.stringify(payload), signature]
  );

  return { ...payload, signature };
}

// Validation schemas
const generateReceiveQRSchema = z.object({
  message: z.string().optional(),
  autoAllocate: z.boolean().optional(),
  amount: z.number().positive().optional(),
});

const generateTransferQRSchema = z.object({
  targetUserId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string(),
  sourceFundId: z.string().uuid().optional(),
});

const processQRSchema = z.object({
  qrData: z.string().min(1),
  fundId: z.string().uuid().optional(),
});

// POST /api/v1/qr/generate-receive - Generate QR for receiving money
router.post('/generate-receive', async (req: AuthRequest, res: Response) => {
  try {
    const data = generateReceiveQRSchema.parse(req.body);
    const userId = req.user!.id;

    const qr = await generateReceiveQR(userId, data.message, data.autoAllocate);

    // Return as base64 encoded JSON
    const qrData = Buffer.from(JSON.stringify(qr)).toString('base64');

    res.json({
      success: true,
      data: {
        qrData,
        payload: qr,
        expiresAt: new Date(qr.timestamp + QR_EXPIRY_MINUTES * 60 * 1000).toISOString(),
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: error.errors,
      });
    }
    console.error('Generate receive QR error:', error);
    res.status(500).json({
      error: 'Không thể tạo QR nhận tiền',
    });
  }
});

// POST /api/v1/qr/generate-transfer - Generate QR for transferring money
router.post('/generate-transfer', async (req: AuthRequest, res: Response) => {
  try {
    const data = generateTransferQRSchema.parse(req.body);
    const senderId = req.user!.id;

    // Verify target user exists
    const targetUser = await queryOne<any>(
      'SELECT id, name FROM users WHERE id = $1 AND is_active = true',
      [data.targetUserId]
    );

    if (!targetUser) {
      return res.status(404).json({
        error: 'Người nhận không tồn tại',
      });
    }

    const payload: Omit<TransferQRPayload, 'signature'> = {
      version: '1.0',
      type: 'TRANSFER',
      senderId,
      targetUserId: data.targetUserId,
      amount: data.amount,
      description: data.description,
      timestamp: Date.now(),
    };

    const signature = signPayload(payload);

    // Save to database
    await query(
      `INSERT INTO qr_codes (user_id, qr_type, payload, signature, amount, expires_at)
       VALUES ($1, 'TRANSFER', $2, $3, $4, NOW() + INTERVAL '${QR_EXPIRY_MINUTES} minutes')`,
      [senderId, JSON.stringify(payload), signature, data.amount]
    );

    const qr: TransferQRPayload = { ...payload, signature };
    const qrData = Buffer.from(JSON.stringify(qr)).toString('base64');

    res.json({
      success: true,
      data: {
        qrData,
        payload: {
          ...qr,
          targetUserName: targetUser.name,
        },
        expiresAt: new Date(payload.timestamp + QR_EXPIRY_MINUTES * 60 * 1000).toISOString(),
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: error.errors,
      });
    }
    console.error('Generate transfer QR error:', error);
    res.status(500).json({
      error: 'Không thể tạo QR chuyển tiền',
    });
  }
});

// POST /api/v1/qr/process - Process scanned QR code
router.post('/process', async (req: AuthRequest, res: Response) => {
  try {
    const { qrData } = req.body;
    const userId = req.user!.id;

    if (!qrData) {
      return res.status(400).json({
        error: 'Dữ liệu QR không hợp lệ',
      });
    }

    // Decode QR data
    let payload: BaseQRPayload;
    try {
      const decoded = Buffer.from(qrData, 'base64').toString('utf8');
      payload = JSON.parse(decoded);
    } catch (e) {
      return res.status(400).json({
        error: 'Không thể giải mã QR code',
      });
    }

    // Verify signature
    if (!verifySignature(payload)) {
      return res.status(400).json({
        error: 'QR code không hợp lệ hoặc đã bị sửa đổi',
      });
    }

    // Check expiry (5 minutes)
    const fiveMinutesAgo = Date.now() - QR_EXPIRY_MINUTES * 60 * 1000;
    if (payload.timestamp < fiveMinutesAgo) {
      return res.status(400).json({
        error: 'QR code đã hết hạn',
        code: 'QR_EXPIRED',
      });
    }

    // Handle different QR types
    if (payload.type === 'RECEIVE') {
      const receivePayload = payload as ReceiveQRPayload;

      // User is trying to receive money - check if it's their own QR
      if (receivePayload.userId === userId) {
        return res.status(400).json({
          error: 'Không thể nhận tiền từ chính mình',
        });
      }

      // Get sender info
      const sender = await queryOne<any>(
        'SELECT id, name FROM users WHERE id = $1',
        [receivePayload.userId]
      );

      return res.json({
        success: true,
        data: {
          type: 'RECEIVE_QR',
          canReceive: true,
          senderName: sender?.name || 'Người dùng',
          amount: receivePayload.amount,
          message: receivePayload.message,
          autoAllocate: receivePayload.autoAllocate,
        },
      });
    }

    if (payload.type === 'TRANSFER') {
      const transferPayload = payload as TransferQRPayload;

      // User is the sender - this is a QR to request money
      if (transferPayload.senderId === userId) {
        return res.status(400).json({
          error: 'QR này không dành cho bạn',
        });
      }

      // User is the target - confirm they want to pay
      if (transferPayload.targetUserId !== userId) {
        return res.status(400).json({
          error: 'QR không hợp lệ cho người dùng này',
        });
      }

      // Get sender info
      const sender = await queryOne<any>(
        'SELECT id, name FROM users WHERE id = $1',
        [transferPayload.senderId]
      );

      return res.json({
        success: true,
        data: {
          type: 'TRANSFER_QR',
          canPay: true,
          senderName: sender?.name || 'Người dùng',
          amount: transferPayload.amount,
          description: transferPayload.description,
        },
      });
    }

    return res.status(400).json({
      error: 'Loại QR không được hỗ trợ',
    });
  } catch (error: any) {
    console.error('Process QR error:', error);
    res.status(500).json({
      error: 'Không thể xử lý QR code',
    });
  }
});

// POST /api/v1/qr/confirm-transfer - Confirm transfer from QR
router.post('/confirm-transfer', async (req: AuthRequest, res: Response) => {
  try {
    const { qrData, fundId } = req.body;
    const userId = req.user!.id;

    if (!qrData) {
      return res.status(400).json({
        error: 'Dữ liệu QR không hợp lệ',
      });
    }

    // Decode and verify QR
    let payload: BaseQRPayload;
    try {
      const decoded = Buffer.from(qrData, 'base64').toString('utf8');
      payload = JSON.parse(decoded);
    } catch (e) {
      return res.status(400).json({
        error: 'Không thể giải mã QR code',
      });
    }

    if (!verifySignature(payload) || payload.type !== 'TRANSFER') {
      return res.status(400).json({
        error: 'QR code không hợp lệ',
      });
    }

    const transferPayload = payload as TransferQRPayload;

    // Verify user is the target
    if (transferPayload.targetUserId !== userId) {
      return res.status(403).json({
        error: 'Bạn không phải là người nhận',
      });
    }

    // Check fund balance if fundId provided
    let deductedFromFund = false;
    if (fundId) {
      const fund = await queryOne<any>(
        `SELECT f.*,
          COALESCE(
            (SELECT SUM(amount) FROM fund_contributions WHERE fund_id = f.id AND type = 'deposit') -
            (SELECT SUM(amount) FROM fund_contributions WHERE fund_id = f.id AND type = 'withdraw'),
            0
          ) as current_amount
         FROM funds f
         WHERE f.id = $1 AND f.user_id = $2 AND f.is_active = true`,
        [fundId, userId]
      );

      if (!fund) {
        return res.status(404).json({
          error: 'Quỹ không tồn tại',
        });
      }

      if (fund.current_amount < transferPayload.amount) {
        // Record insufficient fund event
        await query(
          `INSERT INTO insufficient_fund_events
           (user_id, requested_amount, available_amount, shortfall_amount, primary_fund_id, user_decision)
           VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
          [userId, transferPayload.amount, fund.current_amount, transferPayload.amount - fund.current_amount, fundId]
        );

        return res.status(400).json({
          error: `Quỹ "${fund.name}" không đủ tiền`,
          code: 'INSUFFICIENT_FUND',
          shortfall: transferPayload.amount - fund.current_amount,
          fundId,
          fundName: fund.name,
        });
      }

      // Deduct from fund
      await query(
        `INSERT INTO fund_contributions (fund_id, user_id, amount, type, note)
         VALUES ($1, $2, $3, 'withdraw', $4)`,
        [fundId, userId, transferPayload.amount, transferPayload.description]
      );
      deductedFromFund = true;
    }

    // Get sender info
    const sender = await queryOne<any>(
      'SELECT id, name FROM users WHERE id = $1',
      [transferPayload.senderId]
    );

    // Create transaction
    const transactionRef = `QRPAY${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

    const transaction = await queryOne<any>(
      `INSERT INTO transactions
       (user_id, type, amount, description, fund_id, counterparty_user_id, counterparty_name, source, transaction_ref)
       VALUES ($1, 'expense', $2, $3, $4, $5, $6, 'QR_SEND', $7)
       RETURNING *`,
      [userId, transferPayload.amount, transferPayload.description, fundId || null, transferPayload.senderId, sender?.name || '', transactionRef]
    );

    // Create income transaction for sender
    await query(
      `INSERT INTO transactions
       (user_id, type, amount, description, counterparty_user_id, counterparty_name, source, transaction_ref)
       VALUES ($1, 'income', $2, $3, $4, $5, 'QR_RECEIVE', $6)`,
      [transferPayload.senderId, transferPayload.amount, transferPayload.description, userId, req.user!.name, `QRPAY${transactionRef}`]
    );

    // Notify sender
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'TRANSFER_RECEIVED', 'Nhận tiền', $2, $3)`,
      [
        transferPayload.senderId,
        `${req.user!.name} đã thanh toán cho bạn ${parseInt(transferPayload.amount).toLocaleString('vi-VN')} VND`,
        JSON.stringify({
          amount: transferPayload.amount,
          fromUserId: userId,
          fromUserName: req.user!.name,
        }),
      ]
    );

    // Mark QR as used
    await query(
      `UPDATE qr_codes SET is_used = true, used_at = NOW(), used_transaction_id = $1 WHERE signature = $2`,
      [transaction.id, payload.signature]
    );

    res.json({
      success: true,
      data: {
        transaction,
        deductedFromFund,
        fundId: deductedFromFund ? fundId : null,
      },
    });
  } catch (error: any) {
    console.error('Confirm transfer error:', error);
    res.status(500).json({
      error: 'Không thể xác nhận chuyển tiền',
    });
  }
});

export { router as qrRouter };
