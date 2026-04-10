import { Router, Response } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../../shared/db/index.js';
import { AuthRequest } from '../../shared/middleware/auth.middleware.js';

const router = Router();

// Validation schemas
const resetUserSchema = z.object({
  userId: z.string().uuid().optional(), // If not provided, reset current user
  deleteAll: z.boolean().optional(), // Only for admin, delete all demo data
});

const createDemoDataSchema = z.object({
  userId: z.string().uuid().optional(),
  createForAll: z.boolean().optional(), // Only for admin
});

// POST /api/v1/demo/reset - Reset demo data for a user
router.post('/reset', async (req: AuthRequest, res: Response) => {
  try {
    const data = resetUserSchema.parse(req.body);
    const isAdmin = req.user?.role === 'admin';
    
    let targetUserId = data.userId;
    
    // If not admin, can only reset own data
    if (!isAdmin) {
      targetUserId = req.user?.id;
    }
    
    if (!targetUserId) {
      return res.status(400).json({
        error: 'User ID is required',
      });
    }

    // Verify user exists
    const user = await queryOne<any>(
      'SELECT id, name FROM users WHERE id = $1',
      [targetUserId]
    );

    if (!user) {
      return res.status(404).json({
        error: 'Người dùng không tồn tại',
      });
    }

    // Reset all demo data for this user
    await query('BEGIN');
    
    try {
      // Delete in correct order (respecting foreign keys)
      await query(`DELETE FROM insufficient_fund_events WHERE user_id = $1`, [targetUserId]);
      await query(`DELETE FROM fund_contributions WHERE user_id = $1`, [targetUserId]);
      await query(`DELETE FROM allocation_rules WHERE user_id = $1`, [targetUserId]);
      await query(`DELETE FROM qr_codes WHERE user_id = $1`, [targetUserId]);
      await query(`DELETE FROM notifications WHERE user_id = $1`, [targetUserId]);
      await query(`DELETE FROM simulated_bank_transactions WHERE bank_account_id IN (SELECT id FROM simulated_bank_accounts WHERE user_id = $1)`, [targetUserId]);
      await query(`DELETE FROM simulated_bank_accounts WHERE user_id = $1`, [targetUserId]);
      await query(`DELETE FROM transactions WHERE user_id = $1`, [targetUserId]);
      await query(`DELETE FROM budgets WHERE user_id = $1`, [targetUserId]);
      await query(`DELETE FROM bills WHERE user_id = $1`, [targetUserId]);
      await query(`DELETE FROM reports WHERE user_id = $1`, [targetUserId]);
      await query(`DELETE FROM fund_members WHERE user_id = $1`, [targetUserId]);
      await query(`DELETE FROM funds WHERE user_id = $1`, [targetUserId]);
      
      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

    res.json({
      success: true,
      data: {
        message: `Đã reset demo data cho ${user.name}`,
        userId: targetUserId,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: error.errors,
      });
    }
    console.error('Reset demo data error:', error);
    res.status(500).json({
      error: 'Không thể reset demo data',
    });
  }
});

// POST /api/v1/demo/create-defaults - Create default demo data for a user
router.post('/create-defaults', async (req: AuthRequest, res: Response) => {
  try {
    const data = createDemoDataSchema.parse(req.body);
    const isAdmin = req.user?.role === 'admin';
    
    let targetUserId = data.userId;

    if (!isAdmin) {
      targetUserId = req.user?.id;
    }

    if (!targetUserId) {
      return res.status(400).json({
        error: 'User ID is required',
      });
    }

    // Verify user exists
    const user = await queryOne<any>(
      'SELECT id, name FROM users WHERE id = $1',
      [targetUserId]
    );

    if (!user) {
      return res.status(404).json({
        error: 'Người dùng không tồn tại',
      });
    }

    // Check if user already has funds
    const existingFunds = await query(
      'SELECT id FROM funds WHERE user_id = $1',
      [targetUserId]
    );

    if (existingFunds.length > 0) {
      return res.status(400).json({
        error: 'Người dùng đã có quỹ, không thể tạo demo data mới',
      });
    }

    // Create default funds for user
    const funds = await query<any>(
      `INSERT INTO funds (user_id, name, description, icon, color, priority, target_amount, current_amount)
       VALUES
         ($1, 'Quỹ Ăn uống', 'Chi tiêu ăn uống hàng ngày', 'restaurant', '#FF5722', 1, 5000000, 0),
         ($1, 'Quỹ Di chuyển', 'Chi phí đi lại', 'directions_car', '#2196F3', 2, 2000000, 0),
         ($1, 'Quỹ Tiết kiệm', 'Tiền tiết kiệm dài hạn', 'savings', '#4CAF50', 3, 10000000, 0),
         ($1, 'Quỹ Chi tiêu chung', 'Chi tiêu linh tinh', 'shopping_bag', '#9C27B0', 4, 3000000, 0)
       RETURNING id, name`,
      [targetUserId]
    );

    // Create default allocation rule
    if (funds.length >= 4) {
      await query(
        `INSERT INTO allocation_rules (user_id, name, conditions, allocations, priority, is_active)
         VALUES ($1, 'Chia lương', $2, $3, 1, true)`,
        [
          targetUserId,
          JSON.stringify({ source: 'SALARY' }),
          JSON.stringify([
            { fundId: funds[0].id, type: 'PERCENTAGE', value: 30 }, // 30% ăn uống
            { fundId: funds[1].id, type: 'PERCENTAGE', value: 10 }, // 10% di chuyển
            { fundId: funds[2].id, type: 'PERCENTAGE', value: 30 }, // 30% tiết kiệm
            { fundId: funds[3].id, type: 'PERCENTAGE', value: 30 }, // 30% chi tiêu chung
          ])
        ]
      );
    }

    // Create welcome notification
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'SYSTEM', 'Chào mừng', $2, $3)`,
      [
        targetUserId,
        'Chào mừng bạn đến với Fintech App! Hãy bắt đầu quản lý tài chính của bạn.',
        JSON.stringify({ welcome: true }),
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        message: `Đã tạo demo data cho ${user.name}`,
        userId: targetUserId,
        fundsCreated: funds.length,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: error.errors,
      });
    }
    console.error('Create demo defaults error:', error);
    res.status(500).json({
      error: 'Không thể tạo demo data',
    });
  }
});

// POST /api/v1/demo/reset-all - Reset ALL demo data (admin only)
router.post('/reset-all', async (req: AuthRequest, res: Response) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({
        error: 'Chỉ admin mới có quyền thực hiện thao tác này',
      });
    }

    await query('BEGIN');
    
    try {
      // Reset all demo data (keep users)
      await query(`DELETE FROM insufficient_fund_events`);
      await query(`DELETE FROM fund_contributions`);
      await query(`DELETE FROM allocation_rules`);
      await query(`DELETE FROM qr_codes`);
      await query(`DELETE FROM notifications`);
      await query(`DELETE FROM simulated_bank_transactions`);
      await query(`DELETE FROM simulated_bank_accounts`);
      await query(`DELETE FROM transactions`);
      await query(`DELETE FROM budgets`);
      await query(`DELETE FROM bills`);
      await query(`DELETE FROM reports`);
      await query(`DELETE FROM fund_members`);
      await query(`DELETE FROM funds`);
      
      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

    res.json({
      success: true,
      data: {
        message: 'Đã reset toàn bộ demo data',
      },
    });
  } catch (error: any) {
    console.error('Reset all demo data error:', error);
    res.status(500).json({
      error: 'Không thể reset demo data',
    });
  }
});

// GET /api/v1/demo/status - Get demo data status for current user
router.get('/status', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }

    const stats = await queryOne<any>(`
      SELECT
        (SELECT COUNT(*) FROM funds WHERE user_id = $1) as total_funds,
        (SELECT COUNT(*) FROM transactions WHERE user_id = $1) as total_transactions,
        (SELECT COUNT(*) FROM notifications WHERE user_id = $1) as total_notifications,
        (SELECT COUNT(*) FROM allocation_rules WHERE user_id = $1) as total_allocation_rules,
        (SELECT COUNT(*) FROM budgets WHERE user_id = $1) as total_budgets,
        (SELECT COUNT(*) FROM bills WHERE user_id = $1) as total_bills,
        (SELECT COALESCE(SUM(current_amount), 0) FROM funds WHERE user_id = $1) as total_fund_balance
    `, [userId]);

    res.json({
      success: true,
      data: {
        userId,
        ...stats,
        hasDemoData: stats.total_funds > 0,
      },
    });
  } catch (error: any) {
    console.error('Get demo status error:', error);
    res.status(500).json({
      error: 'Không thể lấy trạng thái demo data',
    });
  }
});

export { router as demoRouter };
