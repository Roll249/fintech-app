import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, queryOne, transaction } from '../../shared/db/index.js';
import { AuthRequest } from '../../shared/middleware/auth.middleware.js';

const router = Router();

// Validation schemas
const createBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  amountLimit: z.number().positive(),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('monthly'),
  alertThreshold: z.number().min(50).max(100).default(80),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const updateBudgetSchema = z.object({
  amountLimit: z.number().positive().optional(),
  alertThreshold: z.number().min(50).max(100).optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/v1/budgets - Get all budgets for user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const period = req.query.period as string;

    let whereClause = 'WHERE b.user_id = $1';
    const params: any[] = [userId];

    if (period) {
      whereClause += ' AND b.period = $2';
      params.push(period);
    }

    const budgets = await query<any>(
      `SELECT b.*,
              c.name as category_name,
              c.icon as category_icon,
              c.color as category_color,
              COALESCE(SUM(CASE WHEN t.type = 'expense' AND t.category_id = b.category_id THEN t.amount ELSE 0 END), 0) as spent,
              COUNT(t.id) as transaction_count
       FROM budgets b
       JOIN categories c ON c.id = b.category_id
       LEFT JOIN transactions t ON t.user_id = b.user_id AND t.category_id = b.category_id
         AND t.transaction_date >= b.start_date
         AND (b.end_date IS NULL OR t.transaction_date <= b.end_date)
       ${whereClause}
       GROUP BY b.id, c.name, c.icon, c.color
       ORDER BY b.created_at DESC`,
      params
    );

    res.json({
      success: true,
      data: budgets.map((b: any) => ({
        ...b,
        remaining: Math.max(0, parseInt(b.amount_limit) - parseInt(b.spent)),
        percentage: parseInt(b.amount_limit) > 0
          ? Math.min(100, (parseInt(b.spent) / parseInt(b.amount_limit)) * 100)
          : 0,
        isOverBudget: parseInt(b.spent) > parseInt(b.amount_limit),
        shouldAlert: parseInt(b.spent) / parseInt(b.amount_limit) * 100 >= parseInt(b.alert_threshold || 80)
      })),
    });
  } catch (error: any) {
    console.error('Get budgets error:', error);
    res.status(500).json({
      error: 'Không thể lấy danh sách ngân sách',
    });
  }
});

// GET /api/v1/budgets/summary - Get budget summary
router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const period = req.query.period as string || 'month';

    // Determine date range based on period
    let dateFilter = '';
    switch (period) {
      case 'daily':
        dateFilter = "AND t.transaction_date = CURRENT_DATE";
        break;
      case 'weekly':
        dateFilter = "AND t.transaction_date >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'monthly':
        dateFilter = "AND t.transaction_date >= DATE_TRUNC('month', CURRENT_DATE)";
        break;
      case 'yearly':
        dateFilter = "AND t.transaction_date >= DATE_TRUNC('year', CURRENT_DATE)";
        break;
    }

    const summary = await queryOne<any>(
      `SELECT
         COUNT(*) as total_budgets,
         COUNT(*) FILTER (WHERE CAST(b.amount_limit AS numeric) > 0 AND
           COALESCE((SELECT SUM(amount) FROM transactions WHERE user_id = b.user_id AND category_id = b.category_id ${dateFilter.replace('t.', '')}), 0) >= CAST(b.amount_limit AS numeric)) as budgets_exceeded,
         COUNT(*) FILTER (WHERE CAST(b.amount_limit AS numeric) > 0 AND
           COALESCE((SELECT SUM(amount) FROM transactions WHERE user_id = b.user_id AND category_id = b.category_id ${dateFilter.replace('t.', '')}), 0) >= CAST(b.amount_limit AS numeric) * b.alert_threshold / 100) as budgets_warning,
         COALESCE(SUM(CAST(b.amount_limit AS numeric)), 0) as total_limit,
         COALESCE((SELECT SUM(amount) FROM transactions t WHERE t.user_id = $1 AND t.type = 'expense' ${dateFilter}), 0) as total_spent
       FROM budgets b
       WHERE b.user_id = $1 AND b.is_active = true`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        totalBudgets: parseInt(summary.total_budgets) || 0,
        budgetsExceeded: parseInt(summary.budgets_exceeded) || 0,
        budgetsWarning: parseInt(summary.budgets_warning) || 0,
        totalLimit: parseInt(summary.total_limit) || 0,
        totalSpent: parseInt(summary.total_spent) || 0,
        remaining: (parseInt(summary.total_limit) || 0) - (parseInt(summary.total_spent) || 0),
        period,
      },
    });
  } catch (error: any) {
    console.error('Get budget summary error:', error);
    res.status(500).json({
      error: 'Không thể lấy tổng hợp ngân sách',
    });
  }
});

// GET /api/v1/budgets/:id - Get budget details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const budget = await queryOne<any>(
      `SELECT b.*,
              c.name as category_name,
              c.icon as category_icon,
              c.color as category_color
       FROM budgets b
       JOIN categories c ON c.id = b.category_id
       WHERE b.id = $1 AND b.user_id = $2`,
      [id, userId]
    );

    if (!budget) {
      return res.status(404).json({
        error: 'Ngân sách không tồn tại',
      });
    }

    // Get recent transactions for this budget
    const transactions = await query<any>(
      `SELECT t.*, c.name as category_name
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1 AND t.category_id = $2
         AND t.transaction_date >= $3
         AND ($4::date IS NULL OR t.transaction_date <= $4)
       ORDER BY t.transaction_date DESC
       LIMIT 50`,
      [userId, budget.category_id, budget.start_date, budget.end_date]
    );

    const totalSpent = transactions.reduce((sum: number, t: any) => sum + parseInt(t.amount), 0);

    res.json({
      success: true,
      data: {
        ...budget,
        spent: totalSpent,
        remaining: Math.max(0, parseInt(budget.amount_limit) - totalSpent),
        percentage: parseInt(budget.amount_limit) > 0
          ? Math.min(100, (totalSpent / parseInt(budget.amount_limit)) * 100)
          : 0,
        transactions,
      },
    });
  } catch (error: any) {
    console.error('Get budget error:', error);
    res.status(500).json({
      error: 'Không thể lấy thông tin ngân sách',
    });
  }
});

// POST /api/v1/budgets - Create budget
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createBudgetSchema.parse(req.body);
    const userId = req.user!.id;

    // Check if budget already exists for this category
    const existing = await queryOne<any>(
      `SELECT id FROM budgets WHERE user_id = $1 AND category_id = $2 AND period = $3 AND is_active = true`,
      [userId, data.categoryId, data.period]
    );

    if (existing) {
      return res.status(409).json({
        error: 'Ngân sách cho danh mục này đã tồn tại',
      });
    }

    // Calculate date range based on period
    let startDate = new Date().toISOString().split('T')[0];
    let endDate = '';

    switch (data.period) {
      case 'daily':
        startDate = new Date().toISOString().split('T')[0];
        endDate = startDate;
        break;
      case 'weekly':
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        startDate = weekStart.toISOString().split('T')[0];
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        endDate = weekEnd.toISOString().split('T')[0];
        break;
      case 'monthly':
        const monthStart = new Date();
        monthStart.setDate(1);
        startDate = monthStart.toISOString().split('T')[0];
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        endDate = monthEnd.toISOString().split('T')[0];
        break;
      case 'yearly':
        const yearStart = new Date();
        yearStart.setMonth(0, 1);
        startDate = yearStart.toISOString().split('T')[0];
        const yearEnd = new Date(yearStart);
        yearEnd.setFullYear(yearEnd.getFullYear() + 1);
        yearEnd.setDate(0);
        endDate = yearEnd.toISOString().split('T')[0];
        break;
    }

    const budget = await queryOne<any>(
      `INSERT INTO budgets (user_id, category_id, amount_limit, period, start_date, end_date, alert_threshold)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, data.categoryId, data.amountLimit, data.period, data.startDate || startDate, data.endDate || endDate, data.alertThreshold]
    );

    res.status(201).json({
      success: true,
      data: budget,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dữ liệu không h���p lệ',
        details: error.errors,
      });
    }
    console.error('Create budget error:', error);
    res.status(500).json({
      error: 'Không thể tạo ngân sách',
    });
  }
});

// PUT /api/v1/budgets/:id - Update budget
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateBudgetSchema.parse(req.body);
    const userId = req.user!.id;

    // Verify ownership
    const existing = await queryOne<any>(
      'SELECT id FROM budgets WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (!existing) {
      return res.status(404).json({
        error: 'Ngân sách không tồn tại',
      });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.amountLimit !== undefined) {
      updates.push(`amount_limit = $${paramIndex++}`);
      values.push(data.amountLimit);
    }
    if (data.alertThreshold !== undefined) {
      updates.push(`alert_threshold = $${paramIndex++}`);
      values.push(data.alertThreshold);
    }
    if (data.period !== undefined) {
      updates.push(`period = $${paramIndex++}`);
      values.push(data.period);
    }
    if (data.startDate !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      values.push(data.startDate);
    }
    if (data.endDate !== undefined) {
      updates.push(`end_date = $${paramIndex++}`);
      values.push(data.endDate);
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

    values.push(id);
    const budget = await queryOne<any>(
      `UPDATE budgets SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    res.json({
      success: true,
      data: budget,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: error.errors,
      });
    }
    console.error('Update budget error:', error);
    res.status(500).json({
      error: 'Không thể cập nhật ngân sách',
    });
  }
});

// DELETE /api/v1/budgets/:id - Delete budget
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await query(
      'UPDATE budgets SET is_active = false WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result === 0) {
      return res.status(404).json({
        error: 'Ngân sách không tồn tại',
      });
    }

    res.json({
      success: true,
      message: 'Xóa ngân sách thành công',
    });
  } catch (error: any) {
    console.error('Delete budget error:', error);
    res.status(500).json({
      error: 'Không thể xóa ngân sách',
    });
  }
});

// POST /api/v1/budgets/check-alerts - Check and create budget alerts
router.post('/check-alerts', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get budgets that are at or above alert threshold
    const budgets = await query<any>(
      `SELECT b.*,
              c.name as category_name,
              c.icon as category_icon,
              c.color as category_color,
              COALESCE((SELECT SUM(amount) FROM transactions t WHERE t.user_id = b.user_id AND t.category_id = b.category_id AND t.transaction_date >= b.start_date AND (b.end_date IS NULL OR t.transaction_date <= b.end_date)), 0) as spent
       FROM budgets b
       JOIN categories c ON c.id = b.category_id
       WHERE b.user_id = $1 AND b.is_active = true`,
      [userId]
    );

    const alerts: any[] = [];

    for (const budget of budgets) {
      const percentage = parseInt(budget.amount_limit) > 0
        ? (parseInt(budget.spent) / parseInt(budget.amount_limit)) * 100
        : 0;

      if (percentage >= parseInt(budget.alert_threshold)) {
        // Check if alert already sent recently
        const existingAlert = await queryOne<any>(
          `SELECT id FROM notifications
           WHERE user_id = $1 AND type = 'BUDGET_ALERT'
             AND created_at > NOW() - INTERVAL '1 day'
             AND data->>'categoryId' = $2`,
          [userId, budget.category_id]
        );

        if (!existingAlert) {
          // Create alert notification
          let message = '';
          if (percentage >= 100) {
            message = `Ngân sách "${budget.category_name}" đã vượt! Đã chi ${parseInt(budget.spent).toLocaleString('vi-VN')} VND / ${parseInt(budget.amount_limit).toLocaleString('vi-VN')} VND`;
          } else {
            message = `Ngân sách "${budget.category_name}" đã sử dụng ${Math.round(percentage)}%. Đã chi ${parseInt(budget.spent).toLocaleString('vi-VN')} VND / ${parseInt(budget.amount_limit).toLocaleString('vi-VN')} VND`;
          }

          await query(
            `INSERT INTO notifications (user_id, type, title, body, data)
             VALUES ($1, 'BUDGET_ALERT', 'Cảnh báo ngân sách', $2, $3)`,
            [userId, message, JSON.stringify({
              categoryId: budget.category_id,
              budgetId: budget.id,
              percentage: Math.round(percentage),
              spent: parseInt(budget.spent),
              limit: parseInt(budget.amount_limit)
            })]
          );

          alerts.push({
            categoryId: budget.category_id,
            categoryName: budget.category_name,
            percentage: Math.round(percentage),
            spent: parseInt(budget.spent),
            limit: parseInt(budget.amount_limit)
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        alertsSent: alerts.length,
        alerts
      },
    });
  } catch (error: any) {
    console.error('Check budget alerts error:', error);
    res.status(500).json({
      error: 'Không thể kiểm tra cảnh báo ngân sách',
    });
  }
});

export { router as budgetRouter };