import { Response } from 'express';
import { query } from '../../shared/db.js';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
import { firebaseService } from './firebase.service.js';
import { NotificationType, NotificationTypeValue } from './notification.types.js';

const MAX_DEVICES_PER_USER = 5;

export class NotificationController {
  async getNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { page = 1, pageSize = 20, unreadOnly } = req.query;
      const offset = (Number(page) - 1) * Number(pageSize);

      let queryStr = 'SELECT * FROM notifications WHERE user_id = $1';
      const params: any[] = [userId];

      if (unreadOnly === 'true') {
        queryStr += ' AND is_read = false';
      }

      queryStr += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
      params.push(Number(pageSize), offset);

      const result = await query(queryStr, params);

      res.json({
        items: result.rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          type: row.type,
          title: row.title,
          body: row.body,
          data: row.data,
          isRead: row.is_read,
          createdAt: row.created_at,
        })),
        page: Number(page),
        pageSize: Number(pageSize),
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: 'Failed to get notifications' });
    }
  }

  async getNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const result = await query(
        'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      const row = result.rows[0];
      res.json({
        id: row.id,
        type: row.type,
        title: row.title,
        body: row.body,
        data: row.data,
        isRead: row.is_read,
        createdAt: row.created_at,
      });
    } catch (error) {
      console.error('Get notification error:', error);
      res.status(500).json({ error: 'Failed to get notification' });
    }
  }

  async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      await query(
        'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      res.json({ message: 'Marked as read' });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ error: 'Failed to mark as read' });
    }
  }

  async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      await query(
        'UPDATE notifications SET is_read = true WHERE user_id = $1',
        [userId]
      );

      res.json({ message: 'All marked as read' });
    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({ error: 'Failed to mark all as read' });
    }
  }

  async deleteNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      await query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [id, userId]);
      res.json({ message: 'Notification deleted' });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  }

  async getSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      const unreadResult = await query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
        [userId]
      );

      const recentResult = await query(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
        [userId]
      );

      res.json({
        unreadCount: parseInt(unreadResult.rows[0].count),
        recentNotifications: recentResult.rows.map(row => ({
          id: row.id,
          type: row.type,
          title: row.title,
          body: row.body,
          isRead: row.is_read,
          createdAt: row.created_at,
        })),
      });
    } catch (error) {
      console.error('Get summary error:', error);
      res.status(500).json({ error: 'Failed to get summary' });
    }
  }

  async getPreferences(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      const result = await query(
        'SELECT * FROM notification_preferences WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        // Return defaults
        return res.json({
          userId,
          pushEnabled: true,
          emailEnabled: true,
          transactionAlerts: true,
          budgetAlerts: true,
          fundUpdates: true,
          marketingEmails: false,
        });
      }

      const row = result.rows[0];
      res.json({
        userId: row.user_id,
        pushEnabled: row.push_enabled,
        emailEnabled: row.email_enabled,
        transactionAlerts: row.transaction_alerts,
        budgetAlerts: row.budget_alerts,
        fundUpdates: row.fund_updates,
        marketingEmails: row.marketing_emails,
        quietHoursStart: row.quiet_hours_start,
        quietHoursEnd: row.quiet_hours_end,
      });
    } catch (error) {
      console.error('Get preferences error:', error);
      res.status(500).json({ error: 'Failed to get preferences' });
    }
  }

  async updatePreferences(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const prefs = req.body;

      await query(
        `INSERT INTO notification_preferences (user_id, push_enabled, email_enabled, transaction_alerts, budget_alerts, fund_updates, marketing_emails, quiet_hours_start, quiet_hours_end)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (user_id) DO UPDATE SET
           push_enabled = COALESCE($2, notification_preferences.push_enabled),
           email_enabled = COALESCE($3, notification_preferences.email_enabled),
           transaction_alerts = COALESCE($4, notification_preferences.transaction_alerts),
           budget_alerts = COALESCE($5, notification_preferences.budget_alerts),
           fund_updates = COALESCE($6, notification_preferences.fund_updates),
           marketing_emails = COALESCE($7, notification_preferences.marketing_emails),
           quiet_hours_start = COALESCE($8, notification_preferences.quiet_hours_start),
           quiet_hours_end = COALESCE($9, notification_preferences.quiet_hours_end)`,
        [
          userId,
          prefs.pushEnabled,
          prefs.emailEnabled,
          prefs.transactionAlerts,
          prefs.budgetAlerts,
          prefs.fundUpdates,
          prefs.marketingEmails,
          prefs.quietHoursStart,
          prefs.quietHoursEnd,
        ]
      );

      res.json({ message: 'Preferences updated' });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  }

  async registerDevice(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { fcmToken, deviceType, deviceName } = req.body;

      if (!fcmToken) {
        return res.status(400).json({ error: 'FCM token is required' });
      }

      // Upsert token - update last_used_at if exists, insert if not
      await query(
        `INSERT INTO device_tokens (user_id, fcm_token, device_type, device_name, last_used_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (fcm_token) DO UPDATE SET
           user_id = $1,
           device_type = COALESCE($3, device_tokens.device_type),
           device_name = COALESCE($4, device_tokens.device_name),
           last_used_at = NOW()`,
        [userId, fcmToken, deviceType || 'unknown', deviceName || 'Unknown Device']
      );

      // Check device count and remove oldest if exceeding limit
      const countResult = await query(
        'SELECT COUNT(*) FROM device_tokens WHERE user_id = $1',
        [userId]
      );
      const deviceCount = parseInt(countResult.rows[0].count);

      if (deviceCount > MAX_DEVICES_PER_USER) {
        // Remove oldest devices (keep only MAX_DEVICES_PER_USER)
        await query(
          `DELETE FROM device_tokens
           WHERE user_id = $1
           AND id NOT IN (
             SELECT id FROM device_tokens
             WHERE user_id = $1
             ORDER BY last_used_at DESC
             LIMIT $2
           )`,
          [userId, MAX_DEVICES_PER_USER]
        );
        console.log(`Removed excess devices for user ${userId}`);
      }

      res.json({ message: 'Device registered successfully' });
    } catch (error) {
      console.error('Register device error:', error);
      res.status(500).json({ error: 'Failed to register device' });
    }
  }

  async unregisterDevice(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      const result = await query(
        'DELETE FROM device_tokens WHERE user_id = $1 AND fcm_token = $2',
        [userId, token]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Device token not found' });
      }

      res.json({ message: 'Device unregistered successfully' });
    } catch (error) {
      console.error('Unregister device error:', error);
      res.status(500).json({ error: 'Failed to unregister device' });
    }
  }

  async clearAllNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      const result = await query('DELETE FROM notifications WHERE user_id = $1', [userId]);

      res.json({
        message: 'All notifications cleared',
        deletedCount: result.rowCount,
      });
    } catch (error) {
      console.error('Clear all notifications error:', error);
      res.status(500).json({ error: 'Failed to clear notifications' });
    }
  }

  // Helper method to create notification (used by other services)
  static async createNotification(
    userId: string,
    type: string,
    title: string,
    body: string,
    data?: any
  ) {
    const result = await query(
      `INSERT INTO notifications (user_id, type, title, body, data) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, type, title, body, data ? JSON.stringify(data) : null]
    );
    const notificationId = result.rows[0]?.id;

    // Send push notification
    await NotificationController.sendPushNotification(userId, notificationId, type, title, body, data);

    return notificationId;
  }

  // Check if current time is within quiet hours
  private static isInQuietHours(quietStart?: string, quietEnd?: string): boolean {
    if (!quietStart || !quietEnd) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = quietStart.split(':').map(Number);
    const [endHour, endMin] = quietEnd.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  // Check if notification type is allowed based on preferences
  private static isNotificationTypeAllowed(type: string, prefs: any): boolean {
    switch (type) {
      case NotificationType.TRANSACTION:
        return prefs.transaction_alerts !== false;
      case NotificationType.BUDGET_WARNING:
      case NotificationType.BUDGET_EXCEEDED:
        return prefs.budget_alerts !== false;
      case NotificationType.FUND_CONTRIBUTION:
      case NotificationType.FUND_INVITE:
        return prefs.fund_updates !== false;
      case NotificationType.SYSTEM:
        return true; // System notifications always allowed
      default:
        return true;
    }
  }

  // Send push notification with preference checks
  private static async sendPushNotification(
    userId: string,
    notificationId: string,
    type: string,
    title: string,
    body: string,
    data?: any
  ) {
    try {
      // Get user preferences
      const prefsResult = await query(
        'SELECT * FROM notification_preferences WHERE user_id = $1',
        [userId]
      );
      const prefs = prefsResult.rows[0] || { push_enabled: true };

      // Check if push is enabled
      if (prefs.push_enabled === false) {
        await NotificationController.logDeliveryStatus(notificationId, userId, 'skipped', 'push_disabled');
        return;
      }

      // Check quiet hours
      if (NotificationController.isInQuietHours(prefs.quiet_hours_start, prefs.quiet_hours_end)) {
        await NotificationController.logDeliveryStatus(notificationId, userId, 'skipped', 'quiet_hours');
        return;
      }

      // Check if notification type is allowed
      if (!NotificationController.isNotificationTypeAllowed(type, prefs)) {
        await NotificationController.logDeliveryStatus(notificationId, userId, 'skipped', 'type_disabled');
        return;
      }

      // Send push notification
      const pushData: { [key: string]: string } = {
        notificationId,
        type,
        ...(data ? { payload: JSON.stringify(data) } : {}),
      };

      const result = await firebaseService.sendToUser(userId, { title, body }, pushData);

      // Log delivery status
      const status = result.successCount > 0 ? 'delivered' : 'failed';
      const reason = result.failureCount > 0 ? `${result.failureCount} failures` : undefined;
      await NotificationController.logDeliveryStatus(
        notificationId,
        userId,
        status,
        reason,
        result.successCount,
        result.failureCount
      );
    } catch (error) {
      console.error('Send push notification error:', error);
      await NotificationController.logDeliveryStatus(notificationId, userId, 'failed', String(error));
    }
  }

  // Log push notification delivery status
  private static async logDeliveryStatus(
    notificationId: string,
    userId: string,
    status: string,
    reason?: string,
    successCount?: number,
    failureCount?: number
  ) {
    try {
      await query(
        `INSERT INTO push_delivery_log (notification_id, user_id, status, reason, success_count, failure_count)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [notificationId, userId, status, reason || null, successCount || 0, failureCount || 0]
      );
    } catch (error) {
      // Log table might not exist yet, don't fail the notification
      console.error('Failed to log delivery status:', error);
    }
  }
}

// Re-export notification types for convenience
export { NotificationType } from './notification.types.js';
