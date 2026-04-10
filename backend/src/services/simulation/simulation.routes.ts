import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../../shared/db/index.js';
import { AuthRequest } from '../../shared/middleware/auth.middleware.js';

const router = Router();

// Validation schemas
const triggerIncomingTransferSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive(),
  source: z.enum(['SALARY', 'BONUS', 'REFUND', 'OTHER']).default('OTHER'),
  description: z.string().default('Tiền vào tài khoản'),
  autoAllocate: z.boolean().default(true),
});

const triggerBudgetAlertSchema = z.object({
  userId: z.string().uuid(),
  budgetId: z.string().uuid().optional(),
  percentage: z.number().min(0).max(150).default(80),
  message: z.string().optional(),
});

const triggerFundGoalSchema = z.object({
  fundId: z.string().uuid(),
});

const createTestUsersSchema = z.object({
  count: z.number().int().min(1).max(100).default(30),
});

// GET /api/v1/simulation/users - Get all test users
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const users = await query<any>(
      `SELECT id, email, name, phone, role, is_active, created_at
       FROM users
       WHERE role = 'user'
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    console.error('Get simulation users error:', error);
    res.status(500).json({
      error: 'Không thể lấy danh sách người dùng',
    });
  }
});

// POST /api/v1/simulation/create-users - Create test users
router.post('/create-users', async (req: AuthRequest, res: Response) => {
  try {
    const { count } = createTestUsersSchema.parse(req.body);

    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash('Test123456', 12);

    const createdUsers: any[] = [];

    for (let i = 1; i <= count; i++) {
      const user = await queryOne<any>(
        `INSERT INTO users (email, password_hash, name, phone)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, email, name`,
        [`student${i}@university.edu`, passwordHash, `Sinh viên ${i}`, `09${String(i).padStart(8, '0')}`]
      );
      createdUsers.push(user);
    }

    // Create default funds for each user
    for (const user of createdUsers) {
      await query(
        `INSERT INTO funds (user_id, name, description, icon, color, priority)
         VALUES
           ($1, 'Quỹ Ăn uống', 'Chi tiêu ăn uống hàng ngày', 'restaurant', '#FF5722', 1),
           ($1, 'Quỹ Di chuyển', 'Chi phí đi lại', 'directions_car', '#2196F3', 2),
           ($1, 'Quỹ Tiết kiệm', 'Tiền tiết kiệm dài hạn', 'savings', '#4CAF50', 3),
           ($1, 'Quỹ Chi tiêu chung', 'Chi tiêu linh tinh', 'shopping_bag', '#9C27B0', 4)
         ON CONFLICT DO NOTHING`,
        [user.id]
      );
    }

    res.status(201).json({
      success: true,
      data: {
        created: createdUsers.length,
        defaultPassword: 'Test123456',
        users: createdUsers,
      },
    });
  } catch (error: any) {
    console.error('Create simulation users error:', error);
    res.status(500).json({
      error: 'Không thể tạo người dùng mô phỏng',
    });
  }
});

// POST /api/v1/simulation/incoming-transfer - Trigger simulated incoming transfer
router.post('/incoming-transfer', async (req: AuthRequest, res: Response) => {
  try {
    const data = triggerIncomingTransferSchema.parse(req.body);

    // Verify user exists
    const user = await queryOne<any>(
      'SELECT id, name FROM users WHERE id = $1 AND is_active = true',
      [data.userId]
    );

    if (!user) {
      return res.status(404).json({
        error: 'Người dùng không tồn tại',
      });
    }

    // Log simulation event
    const event = await queryOne<any>(
      `INSERT INTO simulation_events (user_id, event_type, payload, status)
       VALUES ($1, 'INCOMING_TRANSFER', $2, 'processed')
       RETURNING *`,
      [data.userId, JSON.stringify(data)]
    );

    // Create income transaction
    const transactionRef = `SIM${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

    const transaction = await queryOne<any>(
      `INSERT INTO transactions (user_id, type, amount, description, source, transaction_ref)
       VALUES ($1, 'income', $2, $3, $4, $5)
       RETURNING *`,
      [data.userId, data.amount, data.description, data.source, transactionRef]
    );

    // Process auto-allocation if enabled
    if (data.autoAllocate) {
      const rules = await query<any>(
        `SELECT * FROM allocation_rules
         WHERE user_id = $1 AND is_active = true
         ORDER BY priority`,
        [data.userId]
      );

      if (rules.length > 0) {
        let matchedRule = null;
        for (const rule of rules) {
          const conditions = rule.conditions;
          if (conditions.source && conditions.source !== data.source) continue;
          if (conditions.minAmount && data.amount < conditions.minAmount) continue;
          if (conditions.maxAmount && data.amount > conditions.maxAmount) continue;
          matchedRule = rule;
          break;
        }

        if (matchedRule) {
          // Process allocations
          const allocations = matchedRule.allocations;
          const results: any[] = [];

          for (const allocation of allocations) {
            const fund = await queryOne<any>(
              'SELECT id, name FROM funds WHERE id = $1 AND is_active = true',
              [allocation.fundId]
            );

            if (!fund) continue;

            let allocatedAmount = 0;
            if (allocation.type === 'PERCENTAGE') {
              allocatedAmount = Math.floor(data.amount * allocation.value / 100);
            } else {
              allocatedAmount = allocation.value;
            }

            await query(
              `INSERT INTO fund_contributions (fund_id, user_id, amount, type, note)
               VALUES ($1, $2, $3, 'deposit', $4)`,
              [allocation.fundId, data.userId, allocatedAmount, `${data.description} - Tự động phân bổ`]
            );

            results.push({
              fundId: allocation.fundId,
              fundName: fund.name,
              allocatedAmount,
            });
          }

          // Create notification
          await query(
            `INSERT INTO notifications (user_id, type, title, body, data)
             VALUES ($1, 'AUTO_ALLOCATION', 'Phân bổ tự động', $2, $3)`,
            [
              data.userId,
              `Số tiền ${parseInt(data.amount).toLocaleString('vi-VN')} VND đã được tự động phân bổ vào các quỹ`,
              JSON.stringify({ transactionId: transaction.id, allocations: results }),
            ]
          );
        }
      }
    }

    // Create notification for user
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'MONEY_RECEIVED', 'Nhận tiền', $2, $3)`,
      [
        data.userId,
        `Bạn nhận được ${parseInt(data.amount).toLocaleString('vi-VN')} VND từ ${data.source}`,
        JSON.stringify({
          transactionId: transaction.id,
          amount: data.amount,
          source: data.source,
        }),
      ]
    );

    res.json({
      success: true,
      data: {
        transaction,
        message: `Đã mô phỏng chuyển khoản ${parseInt(data.amount).toLocaleString('vi-VN')} VND cho ${user.name}`,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: error.errors,
      });
    }
    console.error('Trigger incoming transfer error:', error);
    res.status(500).json({
      error: 'Không thể mô phỏng chuyển khoản',
    });
  }
});

// POST /api/v1/simulation/budget-alert - Trigger budget warning
router.post('/budget-alert', async (req: AuthRequest, res: Response) => {
  try {
    const data = triggerBudgetAlertSchema.parse(req.body);

    // Verify user exists
    const user = await queryOne<any>(
      'SELECT id, name FROM users WHERE id = $1 AND is_active = true',
      [data.userId]
    );

    if (!user) {
      return res.status(404).json({
        error: 'Người dùng không tồn tại',
      });
    }

    // Create notification
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'BUDGET_ALERT', 'Cảnh báo ngân sách', $2, $3)`,
      [
        data.userId,
        data.message || `Bạn đã sử dụng ${data.percentage}% ngân sách tháng này!`,
        JSON.stringify({
          percentage: data.percentage,
          budgetId: data.budgetId,
        }),
      ]
    );

    res.json({
      success: true,
      data: {
        message: `Đã gửi cảnh báo ngân sách (${data.percentage}%) cho ${user.name}`,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: error.errors,
      });
    }
    console.error('Trigger budget alert error:', error);
    res.status(500).json({
      error: 'Không thể mô phỏng cảnh báo',
    });
  }
});

// POST /api/v1/simulation/fund-goal - Trigger fund goal reached
router.post('/fund-goal', async (req: AuthRequest, res: Response) => {
  try {
    const data = triggerFundGoalSchema.parse(req.body);

    // Get fund info
    const fund = await queryOne<any>(
      `SELECT f.*, u.name as owner_name
       FROM funds f
       JOIN users u ON u.id = f.user_id
       WHERE f.id = $1`,
      [data.fundId]
    );

    if (!fund) {
      return res.status(404).json({
        error: 'Quỹ không tồn tại',
      });
    }

    // Create notification
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'FUND_GOAL_REACHED', 'Đạt mục tiêu quỹ!', $2, $3)`,
      [
        fund.user_id,
        `Chúc mừng! Quỹ "${fund.name}" đã đạt mục tiêu ${parseInt(fund.target_amount).toLocaleString('vi-VN')} VND!`,
        JSON.stringify({
          fundId: fund.id,
          fundName: fund.name,
          targetAmount: fund.target_amount,
          currentAmount: fund.current_amount,
        }),
      ]
    );

    res.json({
      success: true,
      data: {
        message: `Đã gửi thông báo đạt mục tiêu quỹ cho ${fund.owner_name}`,
      },
    });
  } catch (error: any) {
    console.error('Trigger fund goal error:', error);
    res.status(500).json({
      error: 'Không thể mô phỏng thông báo quỹ',
    });
  }
});

// GET /api/v1/simulation/stats - Get simulation stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await queryOne<any>(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'user' AND created_at > NOW() - INTERVAL '24 hours') as new_users_24h,
        (SELECT COUNT(*) FROM transactions) as total_transactions,
        (SELECT COUNT(*) FROM transactions WHERE created_at > NOW() - INTERVAL '24 hours') as transactions_24h,
        (SELECT COUNT(*) FROM funds) as total_funds,
        (SELECT COUNT(*) FROM notifications) as total_notifications,
        (SELECT COUNT(*) FROM simulated_banks) as total_banks,
        (SELECT COUNT(*) FROM simulation_events WHERE created_at > NOW() - INTERVAL '24 hours') as simulation_events_24h
    `);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Get simulation stats error:', error);
    res.status(500).json({
      error: 'Không thể lấy thống kê',
    });
  }
});

export { router as simulationRouter };
