import { Router, Request, Response } from 'express';
import { query, queryOne } from '../../shared/db/index.js';
import { AuthRequest } from '../../shared/middleware/auth.middleware.js';

const router = Router();

// GET /api/v1/notifications - Get user notifications
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE user_id = $1';
    if (unreadOnly) {
      whereClause += ' AND is_read = false';
    }

    const notifications = await query<any>(
      `SELECT * FROM notifications
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, pageSize, offset]
    );

    const totalResult = await queryOne<any>(
      `SELECT COUNT(*) as total FROM notifications ${whereClause}`,
      [userId]
    );

    const unreadCount = await queryOne<any>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({
      success: true,
      data: notifications,
      unreadCount: parseInt(unreadCount.count),
      pagination: {
        page,
        pageSize,
        totalItems: parseInt(totalResult.total),
        totalPages: Math.ceil(parseInt(totalResult.total) / pageSize),
      },
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Không thể lấy danh sách thông báo',
    });
  }
});

// GET /api/v1/notifications/summary - Get notification summary
router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const summary = await queryOne<any>(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE is_read = false) as unread,
         COUNT(*) FILTER (WHERE is_read = false AND type = 'TRANSFER_RECEIVED') as transfer_notifications,
         COUNT(*) FILTER (WHERE is_read = false AND type = 'BUDGET_ALERT') as budget_alerts
       FROM notifications WHERE user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('Get notification summary error:', error);
    res.status(500).json({
      error: 'Không thể lấy tổng hợp thông báo',
    });
  }
});

// PATCH /api/v1/notifications/:id/read - Mark notification as read
router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result === 0) {
      return res.status(404).json({
        error: 'Thông báo không tồn tại',
      });
    }

    res.json({
      success: true,
      message: 'Đã đánh dấu đã đọc',
    });
  } catch (error: any) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      error: 'Không thể cập nhật thông báo',
    });
  }
});

// PATCH /api/v1/notifications/read-all - Mark all notifications as read
router.patch('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    await query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({
      success: true,
      message: 'Đã đánh dấu tất cả đã đọc',
    });
  } catch (error: any) {
    console.error('Mark all read error:', error);
    res.status(500).json({
      error: 'Không thể cập nhật thông báo',
    });
  }
});

// DELETE /api/v1/notifications/:id - Delete notification
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result === 0) {
      return res.status(404).json({
        error: 'Thông báo không tồn tại',
      });
    }

    res.json({
      success: true,
      message: 'Xóa thông báo thành công',
    });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      error: 'Không thể xóa thông báo',
    });
  }
});

// DELETE /api/v1/notifications - Clear all notifications
router.delete('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    await query(
      'DELETE FROM notifications WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'Xóa tất cả thông báo thành công',
    });
  } catch (error: any) {
    console.error('Clear notifications error:', error);
    res.status(500).json({
      error: 'Không thể xóa thông báo',
    });
  }
});

// POST /api/v1/notifications/register-device - Register FCM device token
router.post('/register-device', async (req: AuthRequest, res: Response) => {
  try {
    const { fcmToken, platform, deviceName, appVersion } = req.body;
    const userId = req.user!.id;

    if (!fcmToken) {
      return res.status(400).json({
        error: 'FCM token là bắt buộc',
      });
    }

    await query(
      `INSERT INTO device_tokens (user_id, fcm_token, platform, device_name, app_version)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, fcm_token)
       DO UPDATE SET last_used_at = NOW(), is_active = true`,
      [userId, fcmToken, platform || 'android', deviceName || null, appVersion || null]
    );

    res.json({
      success: true,
      message: 'Đăng ký thiết bị thành công',
    });
  } catch (error: any) {
    console.error('Register device error:', error);
    res.status(500).json({
      error: 'Không thể đăng ký thiết bị',
    });
  }
});

export { router as notificationRouter };
