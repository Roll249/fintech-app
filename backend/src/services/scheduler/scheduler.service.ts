import { query } from '../../shared/db.js';
import { queueService } from '../queue/queue.service.js';
import { config } from '../../config/index.js';

export interface ScheduledTask {
  name: string;
  cronExpression: string;
  handler: () => Promise<void>;
  enabled: boolean;
}

export class SchedulerService {
  private tasks: ScheduledTask[] = [];
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  constructor() {
    this.registerTasks();
  }

  private registerTasks(): void {
    // Bank sync - every 5 minutes
    this.tasks.push({
      name: 'bank_sync',
      cronExpression: '*/5 * * * *',
      handler: this.scheduleBankSync.bind(this),
      enabled: true,
    });

    // Bill reminders - every minute
    this.tasks.push({
      name: 'bill_reminders',
      cronExpression: '* * * * *',
      handler: this.processBillReminders.bind(this),
      enabled: true,
    });

    // Budget alerts - every hour
    this.tasks.push({
      name: 'budget_alerts',
      cronExpression: '0 * * * *',
      handler: this.checkBudgetAlerts.bind(this),
      enabled: true,
    });

    // Monthly reports - 1st of each month at 9 AM
    this.tasks.push({
      name: 'monthly_reports',
      cronExpression: '0 9 1 * *',
      handler: this.generateMonthlyReports.bind(this),
      enabled: true,
    });

    // Token cleanup - daily at 3 AM
    this.tasks.push({
      name: 'token_cleanup',
      cronExpression: '0 3 * * *',
      handler: this.cleanupExpiredTokens.bind(this),
      enabled: true,
    });

    // Job queue cleanup - daily at 4 AM
    this.tasks.push({
      name: 'job_cleanup',
      cronExpression: '0 4 * * *',
      handler: this.cleanupOldJobs.bind(this),
      enabled: true,
    });

    // Fund contribution reminders - daily at 10 AM
    this.tasks.push({
      name: 'fund_reminders',
      cronExpression: '0 10 * * *',
      handler: this.sendFundReminders.bind(this),
      enabled: true,
    });
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ Scheduler already running');
      return;
    }

    this.isRunning = true;
    console.log('⏰ Scheduler started');

    // Simple interval-based scheduling (for production, use node-cron)
    for (const task of this.tasks) {
      if (!task.enabled) continue;

      const intervalMs = this.cronToInterval(task.cronExpression);
      
      const interval = setInterval(async () => {
        console.log(`⏰ Running scheduled task: ${task.name}`);
        try {
          await task.handler();
        } catch (error) {
          console.error(`Scheduled task error (${task.name}):`, error);
        }
      }, intervalMs);

      this.intervals.set(task.name, interval);
      console.log(`📅 Scheduled: ${task.name} (every ${intervalMs / 1000}s)`);
    }
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      console.log(`🛑 Stopped: ${name}`);
    }
    this.intervals.clear();
    this.isRunning = false;
    console.log('⏰ Scheduler stopped');
  }

  /**
   * Convert cron expression to milliseconds interval (simplified)
   */
  private cronToInterval(cron: string): number {
    const parts = cron.split(' ');
    
    // Very simplified parsing - in production use node-cron
    if (cron.startsWith('*/')) {
      const minutes = parseInt(parts[0].substring(2));
      return minutes * 60 * 1000;
    }
    
    if (cron === '* * * * *') {
      return 60 * 1000; // Every minute
    }
    
    if (parts[0] === '0' && parts[1] === '*') {
      return 60 * 60 * 1000; // Every hour
    }
    
    if (parts[0] === '0' && parts[1].match(/^\d+$/)) {
      return 24 * 60 * 60 * 1000; // Daily
    }

    // Default: every hour
    return 60 * 60 * 1000;
  }

  // ==================== Task Handlers ====================

  /**
   * Schedule bank sync for all active accounts
   */
  private async scheduleBankSync(): Promise<void> {
    const accounts = await query(
      `SELECT id FROM accounts WHERE status = 'active'`
    );

    for (const account of accounts.rows) {
      await queueService.enqueue('bank_sync', { accountId: account.id });
    }

    console.log(`📅 Scheduled bank sync for ${accounts.rows.length} accounts`);
  }

  /**
   * Process pending bill reminders
   */
  private async processBillReminders(): Promise<void> {
    const reminders = await query(
      `SELECT id FROM bill_reminders 
       WHERE is_sent = false AND remind_at <= NOW()`
    );

    for (const reminder of reminders.rows) {
      await queueService.enqueue('bill_reminder', { reminderId: reminder.id });
    }

    if (reminders.rows.length > 0) {
      console.log(`📅 Processing ${reminders.rows.length} bill reminders`);
    }
  }

  /**
   * Check budget alerts
   */
  private async checkBudgetAlerts(): Promise<void> {
    // First, update spent amounts based on transactions
    await query(`
      UPDATE budgets b
      SET spent = COALESCE((
        SELECT SUM(t.amount)
        FROM transactions t
        WHERE t.user_id = b.user_id
        AND t.category_id = b.category_id
        AND t.type = 'expense'
        AND t.date BETWEEN b.start_date AND b.end_date
      ), 0)
    `);

    // Find budgets at or above alert threshold
    const budgets = await query(`
      SELECT id FROM budgets
      WHERE (spent / amount_limit * 100) >= alert_threshold
      AND end_date >= CURRENT_DATE
    `);

    for (const budget of budgets.rows) {
      await queueService.enqueue('budget_alert', { budgetId: budget.id });
    }

    console.log(`📅 Checked ${budgets.rows.length} budgets for alerts`);
  }

  /**
   * Generate monthly reports for all users
   */
  private async generateMonthlyReports(): Promise<void> {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const users = await query(`SELECT id FROM users WHERE role = 'user'`);

    for (const user of users.rows) {
      // Check if report already exists
      const existing = await query(
        `SELECT id FROM reports 
         WHERE user_id = $1 AND type = 'monthly' 
         AND start_date = $2 AND end_date = $3`,
        [user.id, lastMonth.toISOString().split('T')[0], lastMonthEnd.toISOString().split('T')[0]]
      );

      if (existing.rows.length === 0) {
        const reportResult = await query(
          `INSERT INTO reports (user_id, type, start_date, end_date, status)
           VALUES ($1, 'monthly', $2, $3, 'pending')
           RETURNING id`,
          [user.id, lastMonth.toISOString().split('T')[0], lastMonthEnd.toISOString().split('T')[0]]
        );

        await queueService.enqueue('report_generate', { reportId: reportResult.rows[0].id });
      }
    }

    console.log(`📅 Scheduled monthly reports for ${users.rows.length} users`);
  }

  /**
   * Clean up expired tokens
   */
  private async cleanupExpiredTokens(): Promise<void> {
    // Clean refresh tokens
    const refreshResult = await query(
      `DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = true`
    );

    // Clean password reset tokens
    const passwordResult = await query(
      `DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = true`
    );

    // Clean email verification tokens
    const emailResult = await query(
      `DELETE FROM email_verification_tokens WHERE expires_at < NOW()`
    );

    console.log(`🧹 Cleaned up tokens: ${refreshResult.rowCount} refresh, ${passwordResult.rowCount} password, ${emailResult.rowCount} email`);
  }

  /**
   * Clean up old jobs from queue
   */
  private async cleanupOldJobs(): Promise<void> {
    const deleted = await queueService.cleanup(7);
    console.log(`🧹 Cleaned up ${deleted} old jobs`);
  }

  /**
   * Send fund contribution reminders
   */
  private async sendFundReminders(): Promise<void> {
    // Find funds with deadlines approaching (within 7 days)
    const funds = await query(`
      SELECT f.id, f.name, f.target_amount, f.current_amount, f.deadline,
             fm.user_id
      FROM funds f
      JOIN fund_members fm ON f.id = fm.fund_id
      WHERE f.status = 'active'
      AND f.deadline IS NOT NULL
      AND f.deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      AND f.current_amount < f.target_amount
    `);

    for (const fund of funds.rows) {
      const remaining = fund.target_amount - fund.current_amount;
      const daysLeft = Math.ceil((new Date(fund.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      await query(
        `INSERT INTO notifications (user_id, type, title, body, data)
         VALUES ($1, 'fund_contribution', $2, $3, $4)`,
        [
          fund.user_id,
          `Fund Reminder: ${fund.name}`,
          `${daysLeft} days left! Still need ${remaining.toLocaleString()} VND to reach the goal.`,
          JSON.stringify({ fundId: fund.id })
        ]
      );

      await queueService.enqueue('push_notification', {
        userId: fund.user_id,
        title: `Fund Reminder: ${fund.name}`,
        body: `${daysLeft} days left! Still need ${remaining.toLocaleString()} VND.`,
        data: { type: 'fund_contribution', fundId: fund.id }
      });
    }

    if (funds.rows.length > 0) {
      console.log(`📅 Sent ${funds.rows.length} fund contribution reminders`);
    }
  }

  /**
   * Run a task manually
   */
  async runTask(taskName: string): Promise<void> {
    const task = this.tasks.find(t => t.name === taskName);
    if (!task) {
      throw new Error(`Task not found: ${taskName}`);
    }

    console.log(`🔧 Running task manually: ${taskName}`);
    await task.handler();
  }

  /**
   * Get task list
   */
  getTasks(): { name: string; enabled: boolean; isRunning: boolean }[] {
    return this.tasks.map(t => ({
      name: t.name,
      enabled: t.enabled,
      isRunning: this.intervals.has(t.name),
    }));
  }
}

// Singleton instance
export const schedulerService = new SchedulerService();
