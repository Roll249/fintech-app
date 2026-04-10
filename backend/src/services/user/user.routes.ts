import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../../shared/db/index.js';
import { AuthRequest } from '../../shared/middleware/auth.middleware.js';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(10).max(20).optional(),
  avatar_url: z.string().url().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

// GET /api/v1/users/me - Get current user profile
router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await queryOne<any>(
      `SELECT id, email, name, phone, avatar_url, role, is_active, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        error: 'Người dùng không tồn tại',
      });
    }

    // Get user stats
    const stats = await queryOne<any>(
      `SELECT
         COALESCE((SELECT SUM(amount) FROM transactions WHERE user_id = $1 AND type = 'income'), 0) as total_income,
         COALESCE((SELECT SUM(amount) FROM transactions WHERE user_id = $1 AND type = 'expense'), 0) as total_expense,
         COALESCE((SELECT COUNT(*) FROM funds WHERE user_id = $1 AND is_active = true), 0) as total_funds,
         COALESCE((SELECT SUM(current_amount) FROM funds WHERE user_id = $1 AND is_active = true), 0) as total_fund_amount
       `,
      [userId]
    );

    // Get connected banks
    const banks = await query<any>(
      `SELECT sb.code, sb.name, sb.logo_url, sb.color, sba.balance
       FROM simulated_bank_accounts sba
       JOIN simulated_banks sb ON sb.id = sba.bank_id
       WHERE sba.user_id = $1 AND sba.is_connected = true`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        ...user,
        stats: {
          totalIncome: parseInt(stats.total_income) || 0,
          totalExpense: parseInt(stats.total_expense) || 0,
          netBalance: (parseInt(stats.total_income) || 0) - (parseInt(stats.total_expense) || 0),
          totalFunds: parseInt(stats.total_funds) || 0,
          totalFundAmount: parseInt(stats.total_fund_amount) || 0,
        },
        connectedBanks: banks,
      },
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Không thể lấy thông tin người dùng',
    });
  }
});

// PUT /api/v1/users/me - Update current user profile
router.put('/me', async (req: AuthRequest, res: Response) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const userId = req.user!.id;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(data.phone);
    }
    if (data.avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramIndex++}`);
      values.push(data.avatar_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Không có trường nào được cập nhật',
      });
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const user = await queryOne<any>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, name, phone, avatar_url`,
      values
    );

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: error.errors,
      });
    }
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Không thể cập nhật thông tin',
    });
  }
});

// POST /api/v1/users/me/password - Change password
router.post('/me/password', async (req: AuthRequest, res: Response) => {
  try {
    const data = changePasswordSchema.parse(req.body);
    const userId = req.user!.id;

    // Get current user
    const user = await queryOne<any>(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        error: 'Người dùng không tồn tại',
      });
    }

    // Verify current password
    const isValid = await bcrypt.compare(data.currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(400).json({
        error: 'Mật khẩu hiện tại không đúng',
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(data.newPassword, 12);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );

    // Revoke all refresh tokens
    await query(
      'UPDATE refresh_tokens SET revoked = true, revoked_at = NOW() WHERE user_id = $1 AND revoked = false',
      [userId]
    );

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: error.errors,
      });
    }
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Không thể đổi mật khẩu',
    });
  }
});

// DELETE /api/v1/users/me - Delete account
router.delete('/me', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Soft delete - just mark as inactive
    await query(
      'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1',
      [userId]
    );

    // Revoke all tokens
    await query(
      'UPDATE refresh_tokens SET revoked = true, revoked_at = NOW() WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'Tài khoản đã được vô hiệu hóa',
    });
  } catch (error: any) {
    console.error('Delete account error:', error);
    res.status(500).json({
      error: 'Không thể xóa tài khoản',
    });
  }
});

export { router as userRouter };
