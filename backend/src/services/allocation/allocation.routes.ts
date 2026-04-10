import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../../shared/db/index.js';
import { AuthRequest } from '../../shared/middleware/auth.middleware.js';

const router = Router();

// Validation schemas
const createRuleSchema = z.object({
  name: z.string().min(1).max(100),
  priority: z.number().int().min(1).default(1),
  conditions: z.object({
    minAmount: z.number().min(0).optional(),
    maxAmount: z.number().positive().optional(),
    source: z.enum(['SALARY', 'BANK_TRANSFER', 'QR_RECEIVE', 'OTHER']).optional(),
  }).default({}),
  allocations: z.array(z.object({
    fundId: z.string().uuid(),
    type: z.enum(['PERCENTAGE', 'FIXED']),
    value: z.number().positive(),
  })).min(1),
  isActive: z.boolean().default(true),
});

const updateRuleSchema = createRuleSchema.partial();

// GET /api/v1/allocations - Get all allocation rules
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const rules = await query<any>(
      `SELECT ar.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'fundId', f.id,
                    'fundName', f.name,
                    'type', allocation.value->>'type',
                    'value', (allocation.value->>'value')::numeric
                  )
                ) FILTER (WHERE f.id IS NOT NULL),
                '[]'
              ) as fund_allocations
       FROM allocation_rules ar
       LEFT JOIN LATERAL json_array_elements(ar.allocations) AS allocation ON true
       LEFT JOIN funds f ON f.id = (allocation.value->>'fundId')::uuid AND f.user_id = $1
       WHERE ar.user_id = $1
       GROUP BY ar.id
       ORDER BY ar.priority, ar.created_at`,
      [userId]
    );

    res.json({
      success: true,
      data: rules,
    });
  } catch (error: any) {
    console.error('Get allocation rules error:', error);
    res.status(500).json({
      error: 'Không thể lấy danh sách quy tắc phân bổ',
    });
  }
});

// POST /api/v1/allocations - Create allocation rule
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createRuleSchema.parse(req.body);
    const userId = req.user!.id;

    // Validate all fund IDs exist and belong to user
    for (const alloc of data.allocations) {
      const fund = await queryOne<any>(
        'SELECT id FROM funds WHERE id = $1 AND user_id = $2',
        [alloc.fundId, userId]
      );
      if (!fund) {
        return res.status(400).json({
          error: `Quỹ ${alloc.fundId} không tồn tại`,
        });
      }
    }

    const rule = await queryOne<any>(
      `INSERT INTO allocation_rules (user_id, name, priority, conditions, allocations, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId,
        data.name,
        data.priority,
        JSON.stringify(data.conditions),
        JSON.stringify(data.allocations),
        data.isActive,
      ]
    );

    res.status(201).json({
      success: true,
      data: rule,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: error.errors,
      });
    }
    console.error('Create allocation rule error:', error);
    res.status(500).json({
      error: 'Không thể tạo quy tắc phân bổ',
    });
  }
});

// PUT /api/v1/allocations/:id - Update allocation rule
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateRuleSchema.parse(req.body);
    const userId = req.user!.id;

    // Verify ownership
    const existing = await queryOne<any>(
      'SELECT id FROM allocation_rules WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (!existing) {
      return res.status(404).json({
        error: 'Quy tắc không tồn tại',
      });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      values.push(data.priority);
    }
    if (data.conditions !== undefined) {
      updates.push(`conditions = $${paramIndex++}`);
      values.push(JSON.stringify(data.conditions));
    }
    if (data.allocations !== undefined) {
      // Validate all fund IDs
      for (const alloc of data.allocations) {
        const fund = await queryOne<any>(
          'SELECT id FROM funds WHERE id = $1 AND user_id = $2',
          [alloc.fundId, userId]
        );
        if (!fund) {
          return res.status(400).json({
            error: `Quỹ ${alloc.fundId} không tồn tại`,
          });
        }
      }
      updates.push(`allocations = $${paramIndex++}`);
      values.push(JSON.stringify(data.allocations));
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

    const rule = await queryOne<any>(
      `UPDATE allocation_rules SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    res.json({
      success: true,
      data: rule,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: error.errors,
      });
    }
    console.error('Update allocation rule error:', error);
    res.status(500).json({
      error: 'Không thể cập nhật quy tắc phân bổ',
    });
  }
});

// DELETE /api/v1/allocations/:id - Delete allocation rule
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await query(
      'DELETE FROM allocation_rules WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result === 0) {
      return res.status(404).json({
        error: 'Quy tắc không tồn tại',
      });
    }

    res.json({
      success: true,
      message: 'Xóa quy tắc thành công',
    });
  } catch (error: any) {
    console.error('Delete allocation rule error:', error);
    res.status(500).json({
      error: 'Không thể xóa quy tắc phân bổ',
    });
  }
});

// POST /api/v1/allocations/process - Process auto-allocation for incoming money
router.post('/process', async (req: AuthRequest, res: Response) => {
  try {
    const { amount, source, description } = req.body;
    const userId = req.user!.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Số tiền không hợp lệ',
      });
    }

    // Get active allocation rules
    const rules = await query<any>(
      `SELECT * FROM allocation_rules
       WHERE user_id = $1 AND is_active = true
       ORDER BY priority`,
      [userId]
    );

    if (rules.length === 0) {
      return res.json({
        success: true,
        data: {
          allocated: false,
          message: 'Không có quy tắc phân bổ nào được kích hoạt',
        },
      });
    }

    // Find matching rule
    let matchedRule = null;
    for (const rule of rules) {
      const conditions = rule.conditions;

      if (conditions.source && conditions.source !== source) {
        continue;
      }
      if (conditions.minAmount && amount < conditions.minAmount) {
        continue;
      }
      if (conditions.maxAmount && amount > conditions.maxAmount) {
        continue;
      }

      matchedRule = rule;
      break;
    }

    if (!matchedRule) {
      return res.json({
        success: true,
        data: {
          allocated: false,
          message: 'Không có quy tắc phù hợp với số tiền này',
        },
      });
    }

    // Process allocations
    const allocations = matchedRule.allocations;
    const results: any[] = [];
    let remainingAmount = amount;

    for (const allocation of allocations) {
      if (remainingAmount <= 0) break;

      let allocatedAmount = 0;

      if (allocation.type === 'PERCENTAGE') {
        allocatedAmount = Math.floor(amount * allocation.value / 100);
      } else {
        allocatedAmount = Math.min(allocation.value, remainingAmount);
      }

      // Check fund balance
      const fund = await queryOne<any>(
        `SELECT f.*,
          COALESCE(
            (SELECT SUM(amount) FROM fund_contributions WHERE fund_id = f.id AND type = 'deposit') -
            (SELECT SUM(amount) FROM fund_contributions WHERE fund_id = f.id AND type = 'withdraw'),
            0
          ) as current_amount
         FROM funds f WHERE f.id = $1 AND f.is_active = true`,
        [allocation.fundId]
      );

      if (!fund) continue;

      // Allocate (add to fund)
      await query(
        `INSERT INTO fund_contributions (fund_id, user_id, amount, type, note)
         VALUES ($1, $2, $3, 'deposit', $4)`,
        [allocation.fundId, userId, allocatedAmount, `Tự động phân bổ: ${description || 'Nhận tiền'}`]
      );

      results.push({
        fundId: allocation.fundId,
        fundName: fund.name,
        allocatedAmount,
        type: allocation.type,
        value: allocation.value,
      });

      remainingAmount -= allocatedAmount;
    }

    // Create transaction record
    const transactionRef = `ALLOC${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

    await query(
      `INSERT INTO transactions (user_id, type, amount, description, source, transaction_ref)
       VALUES ($1, 'income', $2, $3, 'AUTO_ALLOCATION', $4)`,
      [userId, amount, `Nhận tiền (tự động phân bổ: ${description || 'không có mô tả'})`, transactionRef]
    );

    res.json({
      success: true,
      data: {
        allocated: true,
        ruleName: matchedRule.name,
        results,
        remainingAmount,
      },
    });
  } catch (error: any) {
    console.error('Process allocation error:', error);
    res.status(500).json({
      error: 'Không thể xử lý phân bổ tự động',
    });
  }
});

export { router as allocationRouter };