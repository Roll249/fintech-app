import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../../shared/db/index.js';
import { AuthRequest } from '../../shared/middleware/auth.middleware.js';

const router = Router();

// Validation schemas
const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive(),
  categoryId: z.string().uuid().optional(),
  description: z.string().optional(),
  fundId: z.string().uuid().optional(),
  counterpartyUserId: z.string().uuid().optional(),
  counterpartyName: z.string().optional(),
  source: z.enum(['MANUAL', 'QR_RECEIVE', 'QR_SEND', 'BANK_TRANSFER', 'SALARY', 'AUTO_ALLOCATION']).default('MANUAL'),
  transactionDate: z.string().datetime().optional(),
});

const transferSchema = z.object({
  targetUserId: z.string().uuid(),
  amount: z.number().positive(),
  sourceFundId: z.string().uuid().optional(),
  description: z.string().optional(),
  qrSignature: z.string().optional(),
});

// GET /api/v1/transactions - Get transactions with pagination
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const type = req.query.type as string;
    const fundId = req.query.fundId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE t.user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (type) {
      whereClause += ` AND t.type = $${paramIndex++}`;
      params.push(type);
    }

    if (fundId) {
      whereClause += ` AND t.fund_id = $${paramIndex++}`;
      params.push(fundId);
    }

    if (startDate) {
      whereClause += ` AND t.transaction_date >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND t.transaction_date <= $${paramIndex++}`;
      params.push(endDate);
    }

    const transactions = await query<any>(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
              f.name as fund_name, f.color as fund_color,
              u.name as counterparty_user_name
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       LEFT JOIN funds f ON f.id = t.fund_id
       LEFT JOIN users u ON u.id = t.counterparty_user_id
       ${whereClause}
       ORDER BY t.transaction_date DESC, t.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, pageSize, offset]
    );

    const totalResult = await queryOne<any>(
      `SELECT COUNT(*) as total FROM transactions t ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        pageSize,
        totalItems: parseInt(totalResult.total),
        totalPages: Math.ceil(parseInt(totalResult.total) / pageSize),
      },
    });
  } catch (error: any) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      error: 'Không thể lấy danh sách giao dịch',
    });
  }
});

// GET /api/v1/transactions/summary - Get transaction summary
router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const period = req.query.period as string || 'month';

    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "AND t.transaction_date >= NOW() - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND t.transaction_date >= NOW() - INTERVAL '30 days'";
        break;
      case 'year':
        dateFilter = "AND t.transaction_date >= NOW() - INTERVAL '365 days'";
        break;
    }

    const summary = await queryOne<any>(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
         COALESCE(SUM(CASE WHEN type = 'transfer' THEN amount ELSE 0 END), 0) as total_transfer,
         COUNT(*) as total_transactions
       FROM transactions t
       WHERE t.user_id = $1 ${dateFilter}`,
      [userId]
    );

    // Get category breakdown for expenses
    const categoryBreakdown = await query<any>(
      `SELECT c.id, c.name, c.icon, c.color,
              COALESCE(SUM(t.amount), 0) as total
       FROM categories c
       LEFT JOIN transactions t ON t.category_id = c.id AND t.type = 'expense' AND t.user_id = $1 ${dateFilter}
       WHERE c.is_system = true
       GROUP BY c.id, c.name, c.icon, c.color
       HAVING COALESCE(SUM(t.amount), 0) > 0
       ORDER BY total DESC
       LIMIT 5`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        ...summary,
        net_balance: parseInt(summary.total_income) - parseInt(summary.total_expense),
        category_breakdown: categoryBreakdown,
      },
    });
  } catch (error: any) {
    console.error('Get summary error:', error);
    res.status(500).json({
      error: 'Không thể lấy tổng kết',
    });
  }
});

// GET /api/v1/transactions/:id - Get single transaction
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const transaction = await queryOne<any>(
      `SELECT t.*, c.name as category_name, c.icon as category_icon,
              f.name as fund_name, f.color as fund_color
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       LEFT JOIN funds f ON f.id = t.fund_id
       WHERE t.id = $1 AND t.user_id = $2`,
      [id, userId]
    );

    if (!transaction) {
      return res.status(404).json({
        error: 'Giao dịch không tồn tại',
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      error: 'Không thể lấy thông tin giao dịch',
    });
  }
});

// POST /api/v1/transactions - Create new transaction
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createTransactionSchema.parse(req.body);
    const userId = req.user!.id;

    // Generate transaction reference
    const transactionRef = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

    const transaction = await queryOne<any>(
      `INSERT INTO transactions
       (user_id, type, amount, category_id, description, fund_id, counterparty_user_id, counterparty_name, source, transaction_ref, transaction_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        userId,
        data.type,
        data.amount,
        data.categoryId || null,
        data.description || null,
        data.fundId || null,
        data.counterpartyUserId || null,
        data.counterpartyName || null,
        data.source,
        transactionRef,
        data.transactionDate || new Date().toISOString(),
      ]
    );

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: error.errors,
      });
    }
    console.error('Create transaction error:', error);
    res.status(500).json({
      error: 'Không thể tạo giao dịch',
    });
  }
});

// POST /api/v1/transactions/transfer - Transfer between users
router.post('/transfer', async (req: AuthRequest, res: Response) => {
  try {
    const data = transferSchema.parse(req.body);
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

    if (targetUser.id === senderId) {
      return res.status(400).json({
        error: 'Không thể chuyển tiền cho chính mình',
      });
    }

    // Check fund balance if sourceFundId provided
    if (data.sourceFundId) {
      const fund = await queryOne<any>(
        `SELECT f.*,
          COALESCE(
            (SELECT SUM(amount) FROM fund_contributions WHERE fund_id = f.id AND type = 'deposit') -
            (SELECT SUM(amount) FROM fund_contributions WHERE fund_id = f.id AND type = 'withdraw'),
            0
          ) as current_amount
         FROM funds f
         WHERE f.id = $1 AND f.user_id = $2 AND f.is_active = true`,
        [data.sourceFundId, senderId]
      );

      if (!fund) {
        return res.status(404).json({
          error: 'Quỹ nguồn không tồn tại',
        });
      }

      if (fund.current_amount < data.amount) {
        // Check if shortfall is significant
        const shortfall = data.amount - fund.current_amount;

        // Record insufficient fund event
        await query(
          `INSERT INTO insufficient_fund_events
           (user_id, requested_amount, available_amount, shortfall_amount, primary_fund_id, user_decision)
           VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
          [senderId, data.amount, fund.current_amount, shortfall, data.sourceFundId]
        );

        return res.status(400).json({
          error: `Quỹ "${fund.name}" không đủ tiền. Số dư: ${fund.current_amount.toLocaleString('vi-VN')} VND`,
          code: 'INSUFFICIENT_FUND',
          shortfall,
          fundId: data.sourceFundId,
          fundName: fund.name,
          availableAmount: fund.current_amount,
          requestedAmount: data.amount,
        });
      }

      // Deduct from fund
      await query(
        `INSERT INTO fund_contributions (fund_id, user_id, amount, type, note)
         VALUES ($1, $2, $3, 'withdraw', $4)`,
        [data.sourceFundId, senderId, data.amount, data.description || 'Chuyển tiền']
      );
    }

    // Generate transaction references
    const senderRef = `SEND${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
    const receiverRef = `RECV${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

    // Create sender transaction
    const senderTx = await queryOne<any>(
      `INSERT INTO transactions
       (user_id, type, amount, description, fund_id, counterparty_user_id, counterparty_name, source, transaction_ref)
       VALUES ($1, 'expense', $2, $3, $4, $5, $6, 'QR_SEND', $7)
       RETURNING *`,
      [senderId, data.amount, data.description || 'Chuyển tiền', data.sourceFundId || null, targetUser.id, targetUser.name, senderRef]
    );

    // Create receiver transaction
    await query(
      `INSERT INTO transactions
       (user_id, type, amount, description, counterparty_user_id, counterparty_name, source, transaction_ref)
       VALUES ($1, 'income', $2, $3, $4, $5, 'QR_RECEIVE', $6)`,
      [targetUser.id, data.amount, data.description || 'Nhận tiền', senderId, req.user!.name, receiverRef]
    );

    // Create notification for receiver
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'TRANSFER_RECEIVED', 'Nhận tiền', $2, $3)`,
      [
        targetUser.id,
        `${req.user!.name} ��ã chuyển cho bạn ${parseInt(data.amount).toLocaleString('vi-VN')} VND`,
        JSON.stringify({
          transactionId: senderTx.id,
          senderId,
          senderName: req.user!.name,
          amount: data.amount,
        }),
      ]
    );

    res.status(201).json({
      success: true,
      data: senderTx,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: error.errors,
      });
    }
    console.error('Transfer error:', error);
    res.status(500).json({
      error: 'Không thể thực hiện chuyển tiền',
    });
  }
});

// DELETE /api/v1/transactions/:id - Delete transaction
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result === 0) {
      return res.status(404).json({
        error: 'Giao dịch không tồn tại',
      });
    }

    res.json({
      success: true,
      message: 'Xóa giao dịch thành công',
    });
  } catch (error: any) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      error: 'Không thể xóa giao dịch',
    });
  }
});

export { router as transactionRouter };
