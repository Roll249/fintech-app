import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../../shared/db/index.js';

const router = Router();

// Validation schemas
const connectBankSchema = z.object({
  userId: z.string().uuid(),
  bankCode: z.string().min(2).max(10),
  accountNumber: z.string().min(5).max(50),
  accountHolder: z.string().min(2),
});

const transferSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().optional(),
});

// GET /api/v1/banks - List all simulated banks
router.get('/', async (req: Request, res: Response) => {
  try {
    const banks = await query<any>(
      `SELECT id, code, name, logo_url, color, qr_prefix, mock_balance, is_active
       FROM simulated_banks
       WHERE is_active = true
       ORDER BY name`
    );

    res.json({
      success: true,
      data: banks,
    });
  } catch (error: any) {
    console.error('Get banks error:', error);
    res.status(500).json({
      error: 'Không thể lấy danh sách ngân hàng',
    });
  }
});

// GET /api/v1/banks/:code - Get bank details
router.get('/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const bank = await queryOne<any>(
      `SELECT id, code, name, logo_url, color, qr_prefix, mock_balance, is_active
       FROM simulated_banks
       WHERE code = $1`,
      [code]
    );

    if (!bank) {
      return res.status(404).json({
        error: 'Ngân hàng không tồn tại',
      });
    }

    res.json({
      success: true,
      data: bank,
    });
  } catch (error: any) {
    console.error('Get bank error:', error);
    res.status(500).json({
      error: 'Không thể lấy thông tin ngân hàng',
    });
  }
});

// POST /api/v1/banks/connect - Connect bank account (simulated OAuth)
router.post('/connect', async (req: Request, res: Response) => {
  try {
    const data = connectBankSchema.parse(req.body);

    // Get bank info
    const bank = await queryOne<any>(
      'SELECT * FROM simulated_banks WHERE code = $1',
      [data.bankCode]
    );

    if (!bank) {
      return res.status(404).json({
        error: 'Ngân hàng không tồn tại',
      });
    }

    // Check if already connected
    const existing = await queryOne<any>(
      `SELECT id FROM simulated_bank_accounts
       WHERE user_id = $1 AND bank_id = $2 AND account_number = $3`,
      [data.userId, bank.id, data.accountNumber]
    );

    if (existing) {
      return res.status(409).json({
        error: 'Tài khoản ngân hàng đã được kết nối',
      });
    }

    // Create simulated bank account
    const result = await queryOne<any>(
      `INSERT INTO simulated_bank_accounts
       (user_id, bank_id, account_number, account_holder, balance, is_connected)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, account_number, account_holder, balance, currency`,
      [data.userId, bank.id, data.accountNumber, data.accountHolder, bank.mock_balance]
    );

    // Create user account link
    await query(
      `INSERT INTO user_accounts (user_id, bank_account_id, balance, name)
       VALUES ($1, $2, $3, $4)`,
      [data.userId, result.id, bank.mock_balance, `Tài khoản ${bank.name}`]
    );

    res.status(201).json({
      success: true,
      data: {
        ...result,
        bank: {
          code: bank.code,
          name: bank.name,
          logo_url: bank.logo_url,
          color: bank.color,
        },
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: error.errors,
      });
    }
    console.error('Connect bank error:', error);
    res.status(500).json({
      error: 'Không thể kết nối ngân hàng',
    });
  }
});

// GET /api/v1/banks/:code/balance - Get balance (simulated)
router.get('/:code/balance', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { userId } = req.query;

    const bank = await queryOne<any>(
      'SELECT * FROM simulated_banks WHERE code = $1',
      [code]
    );

    if (!bank) {
      return res.status(404).json({
        error: 'Ngân hàng không tồn tại',
      });
    }

    if (!userId) {
      return res.status(400).json({
        error: 'userId là bắt buộc',
      });
    }

    const account = await queryOne<any>(
      `SELECT balance FROM simulated_bank_accounts
       WHERE user_id = $1 AND bank_id = $2`,
      [userId, bank.id]
    );

    if (!account) {
      return res.status(404).json({
        error: 'Chưa kết nối tài khoản ngân hàng này',
      });
    }

    res.json({
      success: true,
      data: {
        balance: account.balance,
        currency: 'VND',
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Get balance error:', error);
    res.status(500).json({
      error: 'Không thể lấy số dư',
    });
  }
});

// POST /api/v1/banks/transfer - Simulated bank transfer
router.post('/transfer', async (req: Request, res: Response) => {
  try {
    const data = transferSchema.parse(req.body);

    // Get source account
    const fromAccount = await queryOne<any>(
      `SELECT sba.*, sb.name as bank_name
       FROM simulated_bank_accounts sba
       JOIN simulated_banks sb ON sb.id = sba.bank_id
       WHERE sba.id = $1`,
      [data.fromAccountId]
    );

    if (!fromAccount) {
      return res.status(404).json({
        error: 'Tài khoản nguồn không tồn tại',
      });
    }

    if (fromAccount.balance < data.amount) {
      return res.status(400).json({
        error: 'Số dư không đủ',
      });
    }

    // Get destination account
    const toAccount = await queryOne<any>(
      `SELECT sba.*, sb.name as bank_name
       FROM simulated_bank_accounts sba
       JOIN simulated_banks sb ON sb.id = sba.bank_id
       WHERE sba.id = $1`,
      [data.toAccountId]
    );

    if (!toAccount) {
      return res.status(404).json({
        error: 'Tài khoản đích không tồn tại',
      });
    }

    // Process transfer
    const transactionRef = `BNK${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

    // Update source balance
    await query(
      `UPDATE simulated_bank_accounts
       SET balance = balance - $1
       WHERE id = $2`,
      [data.amount, data.fromAccountId]
    );

    // Update destination balance
    await query(
      `UPDATE simulated_bank_accounts
       SET balance = balance + $1
       WHERE id = $2`,
      [data.amount, data.toAccountId]
    );

    // Record transactions
    await query(
      `INSERT INTO simulated_bank_transactions
       (bank_account_id, transaction_ref, amount, type, description, counterparty_account, counterparty_name, transaction_date)
       VALUES ($1, $2, $3, 'OUT', $4, $5, $6, NOW())`,
      [data.fromAccountId, transactionRef, data.amount, data.description || '', toAccount.account_number, toAccount.account_holder]
    );

    await query(
      `INSERT INTO simulated_bank_transactions
       (bank_account_id, transaction_ref, amount, type, description, counterparty_account, counterparty_name, transaction_date)
       VALUES ($1, $2, $3, 'IN', $4, $5, $6, NOW())`,
      [data.toAccountId, transactionRef, data.amount, data.description || '', fromAccount.account_number, fromAccount.account_holder]
    );

    res.json({
      success: true,
      data: {
        transactionRef,
        fromBalance: fromAccount.balance - data.amount,
        toBalance: toAccount.balance + data.amount,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: error.errors,
      });
    }
    console.error('Bank transfer error:', error);
    res.status(500).json({
      error: 'Không thể thực hiện chuyển khoản',
    });
  }
});

export { router as bankRouter };