import { Response, Request } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../shared/db.js';
import { config } from '../../config/index.js';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';

// Helper function for audit logging
async function logAudit(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string | null,
  oldValue: any,
  newValue: any,
  req: Request
) {
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  await query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_value, new_value, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      userId,
      action,
      resourceType,
      resourceId,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      ipAddress,
      userAgent,
    ]
  );
}

// Generate a random temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export class AdminController {
  async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const { page = 1, pageSize = 20, search, status } = req.query;
      const offset = (Number(page) - 1) * Number(pageSize);

      let queryStr = `
        SELECT id, email, name, phone, role, status, avatar_url, created_at, updated_at
        FROM users
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (search) {
        queryStr += ` AND (email ILIKE $${paramIndex} OR name ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (status) {
        queryStr += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      // Get total count
      const countResult = await query(
        queryStr.replace('SELECT id, email, name, phone, role, status, avatar_url, created_at, updated_at', 'SELECT COUNT(*)'),
        params
      );
      const total = parseInt(countResult.rows[0].count);

      // Add pagination
      queryStr += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(Number(pageSize), offset);

      const result = await query(queryStr, params);

      res.json({
        items: result.rows.map(row => ({
          id: row.id,
          email: row.email,
          name: row.name,
          phone: row.phone,
          role: row.role,
          status: row.status,
          avatarUrl: row.avatar_url,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  }

  async getUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const userResult = await query(
        `SELECT id, email, name, phone, role, status, avatar_url, created_at, updated_at
         FROM users WHERE id = $1`,
        [id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userResult.rows[0];

      // Get user statistics
      const statsResult = await query(
        `SELECT
           (SELECT COUNT(*) FROM transactions WHERE user_id = $1) as transaction_count,
           (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = $1 AND type = 'income') as total_income,
           (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = $1 AND type = 'expense') as total_expense,
           (SELECT COUNT(*) FROM accounts WHERE user_id = $1) as account_count,
           (SELECT COUNT(*) FROM bills WHERE user_id = $1) as bill_count`,
        [id]
      );

      const stats = statsResult.rows[0];

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        stats: {
          transactionCount: parseInt(stats.transaction_count),
          totalIncome: parseFloat(stats.total_income),
          totalExpense: parseFloat(stats.total_expense),
          accountCount: parseInt(stats.account_count),
          billCount: parseInt(stats.bill_count),
        },
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  }

  async updateUserStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const adminId = req.user?.id;
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!status || !['active', 'locked'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be "active" or "locked"' });
      }

      // Get current user status
      const currentResult = await query(
        'SELECT status, email, name FROM users WHERE id = $1',
        [id]
      );

      if (currentResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const oldStatus = currentResult.rows[0].status;

      // Update status
      await query(
        'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2',
        [status, id]
      );

      // Log audit
      await logAudit(
        adminId!,
        status === 'locked' ? 'USER_LOCKED' : 'USER_UNLOCKED',
        'user',
        id,
        { status: oldStatus },
        { status, reason },
        req
      );

      res.json({ message: `User ${status === 'locked' ? 'locked' : 'unlocked'} successfully` });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({ error: 'Failed to update user status' });
    }
  }

  async resetUserPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const adminId = req.user?.id;
      const { id } = req.params;

      // Check if user exists
      const userResult = await query('SELECT email, name FROM users WHERE id = $1', [id]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Generate temporary password
      const tempPassword = generateTempPassword();
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      // Update password
      await query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [passwordHash, id]
      );

      // Revoke all refresh tokens for this user
      await query('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [id]);

      // Log audit
      await logAudit(
        adminId!,
        'PASSWORD_RESET',
        'user',
        id,
        null,
        { resetBy: adminId },
        req
      );

      res.json({
        message: 'Password reset successfully',
        tempPassword,
        userEmail: userResult.rows[0].email,
      });
    } catch (error) {
      console.error('Reset user password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }

  async getDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      // Get total users
      const usersResult = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'active') as active,
          COUNT(*) FILTER (WHERE status = 'locked') as locked,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_last_30_days
        FROM users
      `);

      // Get transaction stats
      const transactionsResult = await query(`
        SELECT 
          COUNT(*) as total,
          COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) as total_income,
          COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) as total_expense,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as last_30_days
        FROM transactions
      `);

      // Get bill stats
      const billsResult = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'paid') as paid,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'overdue') as overdue
        FROM bills
      `);

      // Get OCR stats
      const ocrResult = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE ocr_status = 'success') as success,
          COUNT(*) FILTER (WHERE ocr_status = 'failed') as failed
        FROM bills WHERE ocr_status IS NOT NULL
      `);

      const ocrTotal = parseInt(ocrResult.rows[0].total) || 0;
      const ocrSuccess = parseInt(ocrResult.rows[0].success) || 0;
      const ocrSuccessRate = ocrTotal > 0 ? (ocrSuccess / ocrTotal) * 100 : 0;

      const users = usersResult.rows[0];
      const transactions = transactionsResult.rows[0];
      const bills = billsResult.rows[0];

      res.json({
        users: {
          total: parseInt(users.total),
          active: parseInt(users.active),
          locked: parseInt(users.locked),
          newLast30Days: parseInt(users.new_last_30_days),
        },
        transactions: {
          total: parseInt(transactions.total),
          totalIncome: parseFloat(transactions.total_income),
          totalExpense: parseFloat(transactions.total_expense),
          last30Days: parseInt(transactions.last_30_days),
        },
        bills: {
          total: parseInt(bills.total),
          paid: parseInt(bills.paid),
          pending: parseInt(bills.pending),
          overdue: parseInt(bills.overdue),
        },
        ocr: {
          total: ocrTotal,
          success: ocrSuccess,
          failed: parseInt(ocrResult.rows[0].failed) || 0,
          successRate: Math.round(ocrSuccessRate * 100) / 100,
        },
      });
    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json({ error: 'Failed to get dashboard' });
    }
  }

  async getOcrStats(req: AuthenticatedRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      let dateFilter = '';
      const params: any[] = [];

      if (startDate) {
        params.push(startDate);
        dateFilter += ` AND created_at >= $${params.length}`;
      }
      if (endDate) {
        params.push(endDate);
        dateFilter += ` AND created_at <= $${params.length}`;
      }

      // Get daily OCR stats
      const dailyResult = await query(
        `SELECT 
           DATE(created_at) as date,
           COUNT(*) FILTER (WHERE ocr_status = 'success') as success,
           COUNT(*) FILTER (WHERE ocr_status = 'failed') as failed,
           COUNT(*) as total
         FROM bills 
         WHERE ocr_status IS NOT NULL ${dateFilter}
         GROUP BY DATE(created_at)
         ORDER BY date DESC
         LIMIT 30`,
        params
      );

      // Get overall stats for the period
      const overallResult = await query(
        `SELECT 
           COUNT(*) FILTER (WHERE ocr_status = 'success') as success,
           COUNT(*) FILTER (WHERE ocr_status = 'failed') as failed,
           COUNT(*) as total,
           AVG(CASE WHEN ocr_status = 'success' THEN 1 ELSE 0 END) * 100 as success_rate
         FROM bills 
         WHERE ocr_status IS NOT NULL ${dateFilter}`,
        params
      );

      const overall = overallResult.rows[0];

      res.json({
        daily: dailyResult.rows.map(row => ({
          date: row.date,
          success: parseInt(row.success),
          failed: parseInt(row.failed),
          total: parseInt(row.total),
          successRate: parseInt(row.total) > 0
            ? Math.round((parseInt(row.success) / parseInt(row.total)) * 100 * 100) / 100
            : 0,
        })),
        overall: {
          success: parseInt(overall.success) || 0,
          failed: parseInt(overall.failed) || 0,
          total: parseInt(overall.total) || 0,
          successRate: Math.round((parseFloat(overall.success_rate) || 0) * 100) / 100,
        },
      });
    } catch (error) {
      console.error('Get OCR stats error:', error);
      res.status(500).json({ error: 'Failed to get OCR stats' });
    }
  }

  async broadcastNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const adminId = req.user?.id;
      const { title, body, type = 'system', data } = req.body;

      if (!title || !body) {
        return res.status(400).json({ error: 'Title and body are required' });
      }

      // Get all active users
      const usersResult = await query(
        "SELECT id FROM users WHERE status = 'active'"
      );

      if (usersResult.rows.length === 0) {
        return res.json({ message: 'No active users to notify', count: 0 });
      }

      // Batch insert notifications
      const userIds = usersResult.rows.map(row => row.id);
      const values = userIds
        .map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`)
        .join(', ');
      
      const params = userIds.flatMap(userId => [
        userId,
        type,
        title,
        body,
        data ? JSON.stringify(data) : null,
      ]);

      await query(
        `INSERT INTO notifications (user_id, type, title, body, data) VALUES ${values}`,
        params
      );

      // Log audit
      await logAudit(
        adminId!,
        'BROADCAST_NOTIFICATION',
        'notification',
        null,
        null,
        { title, body, type, recipientCount: userIds.length },
        req
      );

      res.json({
        message: 'Notification broadcast successfully',
        count: userIds.length,
      });
    } catch (error) {
      console.error('Broadcast notification error:', error);
      res.status(500).json({ error: 'Failed to broadcast notification' });
    }
  }

  async getFunds(req: AuthenticatedRequest, res: Response) {
    try {
      const { page = 1, pageSize = 20, status } = req.query;
      const offset = (Number(page) - 1) * Number(pageSize);

      let queryStr = `
        SELECT f.*, u.name as owner_name, u.email as owner_email,
               (SELECT COUNT(*) FROM fund_members WHERE fund_id = f.id) as member_count
        FROM funds f
        JOIN users u ON f.owner_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (status) {
        queryStr += ` AND f.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      // Get total count
      const countQuery = queryStr.replace(
        /SELECT f\.\*, u\.name as owner_name.*member_count/,
        'SELECT COUNT(*)'
      );
      const countResult = await query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Add pagination
      queryStr += ` ORDER BY f.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(Number(pageSize), offset);

      const result = await query(queryStr, params);

      res.json({
        items: result.rows.map(row => ({
          id: row.id,
          name: row.name,
          description: row.description,
          targetAmount: parseFloat(row.target_amount),
          currentAmount: parseFloat(row.current_amount),
          progress: parseFloat(row.current_amount) / parseFloat(row.target_amount),
          coverImageUrl: row.cover_image_url,
          ownerId: row.owner_id,
          owner: { id: row.owner_id, name: row.owner_name, email: row.owner_email },
          memberCount: parseInt(row.member_count),
          status: row.status,
          deadline: row.deadline,
          createdAt: row.created_at,
        })),
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      });
    } catch (error) {
      console.error('Get funds error:', error);
      res.status(500).json({ error: 'Failed to get funds' });
    }
  }

  async getAuditLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        page = 1,
        pageSize = 20,
        userId,
        action,
        resourceType,
        startDate,
        endDate,
      } = req.query;
      const offset = (Number(page) - 1) * Number(pageSize);

      let queryStr = `
        SELECT al.*, u.name as user_name, u.email as user_email
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (userId) {
        queryStr += ` AND al.user_id = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
      }

      if (action) {
        queryStr += ` AND al.action = $${paramIndex}`;
        params.push(action);
        paramIndex++;
      }

      if (resourceType) {
        queryStr += ` AND al.resource_type = $${paramIndex}`;
        params.push(resourceType);
        paramIndex++;
      }

      if (startDate) {
        queryStr += ` AND al.created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        queryStr += ` AND al.created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      // Get total count
      const countQuery = queryStr.replace(
        /SELECT al\.\*, u\.name as user_name, u\.email as user_email/,
        'SELECT COUNT(*)'
      );
      const countResult = await query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Add pagination
      queryStr += ` ORDER BY al.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(Number(pageSize), offset);

      const result = await query(queryStr, params);

      res.json({
        items: result.rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          user: row.user_id ? { id: row.user_id, name: row.user_name, email: row.user_email } : null,
          action: row.action,
          resourceType: row.resource_type,
          resourceId: row.resource_id,
          oldValue: row.old_value,
          newValue: row.new_value,
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          createdAt: row.created_at,
        })),
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ error: 'Failed to get audit logs' });
    }
  }
}
