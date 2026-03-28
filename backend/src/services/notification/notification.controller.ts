import { Response } from 'express';
import { query } from '../../shared/db.js';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';

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
      // TODO: Store FCM token for push notifications
      const { fcmToken, deviceType, deviceName } = req.body;
      console.log('Device registered:', { fcmToken: fcmToken?.substring(0, 20), deviceType, deviceName });
      res.json({ message: 'Device registered' });
    } catch (error) {
      console.error('Register device error:', error);
      res.status(500).json({ error: 'Failed to register device' });
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
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data) VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, body, data ? JSON.stringify(data) : null]
    );
    // TODO: Send push notification via Firebase
  }
}
