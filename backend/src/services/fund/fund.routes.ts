import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, queryOne, transaction } from '../../shared/db/index.js';
import { AuthRequest } from '../../shared/middleware/auth.middleware.js';

const router = Router();

// Validation schemas
const createFundSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  targetAmount: z.number().positive().optional(),
  icon: z.string().default('savings'),
  color: z.string().default('#4CAF50'),
});

const updateFundSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  targetAmount: z.number().positive().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
});

const contributeSchema = z.object({
  fundId: z.string().uuid(),
  amount: z.number().positive(),
  type: z.enum(['deposit', 'withdraw']),
  note: z.string().optional(),
});

const transferToFundSchema = z.object({
  fundId: z.string().uuid(),
  amount: z.number().positive(),
  note: z.string().optional(),
});

// GET /api/v1/funds - Get all funds for user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const funds = await query<any>(
      `SELECT f.*,
              (SELECT SUM(amount) FROM fund_contributions WHERE fund_id = f.id AND type = 'deposit') -
              (SELECT SUM(amount) FROM fund_contributions WHERE fund_id = f.id AND type = 'withdraw') as current_amount
       FROM funds f
       WHERE f.user_id = $1 AND f.is_active = true
       ORDER BY f.priority, f.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: funds,
    });
  } catch (error: any) {
    console.error('Get funds error:', error);
    res.status(500).json({
      error: 'Không thể lấy danh sách quỹ',
    });
  }
});

// GET /api/v1/funds/:id - Get fund details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const fund = await queryOne<any>(
      `SELECT f.*,
              (SELECT SUM(amount) FROM fund_contributions WHERE fund_id = f.id AND type = 'deposit') -
              (SELECT SUM(amount) FROM fund_contributions WHERE fund_id = f.id AND type = 'withdraw') as current_amount
       FROM funds f
       WHERE f.id = $1 AND f.user_id = $2`,
      [id, userId]
    );

    if (!fund) {
      return res.status(404).json({
        error: 'Quỹ không tồn tại',
      });
    }

    // Get recent contributions
    const contributions = await query<any>(
      `SELECT fc.*, u.name as user_name
       FROM fund_contributions fc
       JOIN users u ON u.id = fc.user_id
       WHERE fc.fund_id = $1
       ORDER BY fc.created_at DESC
       LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...fund,
        contributions,
      },
    });
  } catch (error: any) {
    console.error('Get fund error:', error);
    res.status(500).json({
      error: 'Không thể lấy thông tin quỹ',
    });
  }
});

// POST /api/v1/funds - Create new fund
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createFundSchema.parse(req.body);
    const userId = req.user!.id;

    const fund = await queryOne<any>(
      `INSERT INTO funds (user_id, name, description, target_amount, icon, color)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, data.name, data.description || null, data.targetAmount || null, data.icon, data.color]
    );

    res.status(201).json({
      success: true,
      data: fund,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: error.errors,
      });
    }
    console.error('Create fund error:', error);
    res.status(500).json({
      error: 'Không thể tạo quỹ',
    });
  }
});

// PUT /api/v1/funds/:id - Update fund
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateFundSchema.parse(req.body);
    const userId = req.user!.id;

    // Check ownership
    const existing = await queryOne<any>(
      'SELECT id FROM funds WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (!existing) {
      return res.status(404).json({
        error: 'Quỹ không tồn tại',
      });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.targetAmount !== undefined) {
      updates.push(`target_amount = $${paramIndex++}`);
      values.push(data.targetAmount);
    }
    if (data.icon !== undefined) {
      updates.push(`icon = $${paramIndex++}`);
      values.push(data.icon);
    }
    if (data.color !== undefined) {
      updates.push(`color = $${paramIndex++}`);
      values.push(data.color);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(data.isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Không có trường nào được cập nhật',
      });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const fund = await queryOne<any>(
      `UPDATE funds SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    res.json({
      success: true,
      data: fund,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: error.errors,
      });
    }
    console.error('Update fund error:', error);
    res.status(500).json({
      error: 'Không thể cập nhật quỹ',
    });
  }
});

// DELETE /api/v1/funds/:id - Delete fund
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await query(
      `UPDATE funds SET is_active = false, updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result === 0) {
      return res.status(404).json({
        error: 'Quỹ không tồn tại',
      });
    }

    res.json({
      success: true,
      message: 'Xóa quỹ thành công',
    });
  } catch (error: any) {
    console.error('Delete fund error:', error);
    res.status(500).json({
      error: 'Không thể xóa quỹ',
    });
  }
});

// POST /api/v1/funds/contribute - Add contribution to fund
router.post('/contribute', async (req: AuthRequest, res: Response) => {
  try {
    const data = contributeSchema.parse(req.body);
    const userId = req.user!.id;

    // Verify fund ownership
    const fund = await queryOne<any>(
      'SELECT * FROM funds WHERE id = $1 AND user_id = $2 AND is_active = true',
      [data.fundId, userId]
    );

    if (!fund) {
      return res.status(404).json({
        error: 'Quỹ không tồn tại',
      });
    }

    // Check balance for withdrawal
    if (data.type === 'withdraw') {
      const currentAmount = await queryOne<any>(
        `SELECT COALESCE(
          (SELECT SUM(amount) FROM fund_contributions WHERE fund_id = $1 AND type = 'deposit') -
          (SELECT SUM(amount) FROM fund_contributions WHERE fund_id = $1 AND type = 'withdraw'),
          0
        ) as balance`,
        [data.fundId]
      );

      if (currentAmount.balance < data.amount) {
        return res.status(400).json({
          error: 'Số dư quỹ không đủ',
        });
      }
    }

    // Create contribution
    const contribution = await queryOne<any>(
      `INSERT INTO fund_contributions (fund_id, user_id, amount, type, note)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.fundId, userId, data.amount, data.type, data.note || null]
    );

    // Create transaction record
    const transactionRef = `FUND${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

    await query(
      `INSERT INTO transactions (user_id, type, amount, description, fund_id, source, transaction_ref)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        data.type === 'deposit' ? 'expense' : 'income',
        data.amount,
        data.note || (data.type === 'deposit' ? 'Nạp tiền vào quỹ' : 'Rút tiền từ quỹ'),
        data.fundId,
        data.type === 'deposit' ? 'MANUAL' : 'AUTO_ALLOCATION',
        transactionRef,
      ]
    );

    res.status(201).json({
      success: true,
      data: contribution,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: error.errors,
      });
    }
    console.error('Contribute error:', error);
    res.status(500).json({
      error: 'Không thể thực hiện giao dịch quỹ',
    });
  }
});

export { router as fundRouter };
