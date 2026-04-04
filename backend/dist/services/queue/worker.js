"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueWorker = exports.QueueWorker = void 0;
const queue_service_js_1 = require("./queue.service.js");
const db_js_1 = require("../../shared/db.js");
const index_js_1 = require("../../config/index.js");
class QueueWorker {
    handlers = new Map();
    isRunning = false;
    pollInterval = null;
    constructor() {
        this.registerHandlers();
    }
    registerHandlers() {
        // Register job handlers
        this.handlers.set('bank_sync', this.handleBankSync.bind(this));
        this.handlers.set('ocr_process', this.handleOcrProcess.bind(this));
        this.handlers.set('push_notification', this.handlePushNotification.bind(this));
        this.handlers.set('email_send', this.handleEmailSend.bind(this));
        this.handlers.set('report_generate', this.handleReportGenerate.bind(this));
        this.handlers.set('bill_reminder', this.handleBillReminder.bind(this));
        this.handlers.set('budget_alert', this.handleBudgetAlert.bind(this));
    }
    /**
     * Start the worker
     */
    start(pollIntervalMs = 5000) {
        if (this.isRunning) {
            console.log('⚠️ Worker already running');
            return;
        }
        this.isRunning = true;
        console.log('🚀 Queue worker started');
        // Process jobs in a loop
        this.pollInterval = setInterval(async () => {
            await this.processJobs();
        }, pollIntervalMs);
        // Initial run
        this.processJobs();
    }
    /**
     * Stop the worker
     */
    stop() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        this.isRunning = false;
        console.log('🛑 Queue worker stopped');
    }
    /**
     * Process pending jobs
     */
    async processJobs() {
        const concurrency = index_js_1.config.queue.concurrency;
        const promises = [];
        for (let i = 0; i < concurrency; i++) {
            promises.push(this.processNextJob());
        }
        await Promise.allSettled(promises);
    }
    /**
     * Process a single job
     */
    async processNextJob() {
        try {
            const job = await queue_service_js_1.queueService.dequeue();
            if (!job)
                return;
            console.log(`🔧 Processing job: ${job.type} (${job.id})`);
            const handler = this.handlers.get(job.type);
            if (!handler) {
                await queue_service_js_1.queueService.fail(job.id, `No handler for job type: ${job.type}`, false);
                return;
            }
            try {
                await handler(job.payload);
                await queue_service_js_1.queueService.complete(job.id);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                await queue_service_js_1.queueService.fail(job.id, errorMessage);
            }
        }
        catch (error) {
            console.error('Job processing error:', error);
        }
    }
    // ==================== Job Handlers ====================
    /**
     * Handle bank sync job
     */
    async handleBankSync(payload) {
        const { accountId } = payload;
        console.log(`🏦 Syncing bank account: ${accountId}`);
        // Get account
        const accountResult = await (0, db_js_1.query)(`SELECT * FROM accounts WHERE id = $1 AND status = 'active'`, [accountId]);
        if (accountResult.rows.length === 0) {
            throw new Error('Account not found or inactive');
        }
        const account = accountResult.rows[0];
        // Record sync start
        const syncResult = await (0, db_js_1.query)(`INSERT INTO account_sync_history (account_id, status, balance_before)
       VALUES ($1, 'success', $2)
       RETURNING id`, [accountId, account.balance]);
        const syncId = syncResult.rows[0].id;
        try {
            // Simulate bank API call - generate random transactions
            const transactionCount = Math.floor(Math.random() * 4); // 0-3 transactions
            let newBalance = parseFloat(account.balance);
            for (let i = 0; i < transactionCount; i++) {
                const isExpense = Math.random() > 0.3;
                const amount = Math.floor(Math.random() * 500000) + 10000; // 10k - 510k
                const type = isExpense ? 'expense' : 'income';
                const externalId = `BANK_${account.bank_code}_${Date.now()}_${i}`;
                // Check for duplicate
                const existing = await (0, db_js_1.query)(`SELECT id FROM transactions WHERE external_id = $1`, [externalId]);
                if (existing.rows.length === 0) {
                    // Create transaction
                    await (0, db_js_1.query)(`INSERT INTO transactions (account_id, user_id, amount, type, description, date, external_id)
             VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6)`, [accountId, account.user_id, amount, type, `Bank sync: ${type}`, externalId]);
                    newBalance = isExpense ? newBalance - amount : newBalance + amount;
                }
            }
            // Update account balance
            await (0, db_js_1.query)(`UPDATE accounts SET balance = $1, last_synced_at = NOW() WHERE id = $2`, [newBalance, accountId]);
            // Update sync history
            await (0, db_js_1.query)(`UPDATE account_sync_history 
         SET status = 'success', transactions_synced = $1, balance_after = $2, completed_at = NOW()
         WHERE id = $3`, [transactionCount, newBalance, syncId]);
            console.log(`✅ Bank sync completed: ${transactionCount} transactions`);
        }
        catch (error) {
            await (0, db_js_1.query)(`UPDATE account_sync_history 
         SET status = 'failed', error_message = $1, completed_at = NOW()
         WHERE id = $2`, [error instanceof Error ? error.message : 'Unknown error', syncId]);
            throw error;
        }
    }
    /**
     * Handle OCR processing job
     */
    async handleOcrProcess(payload) {
        const { billId } = payload;
        console.log(`📄 Processing OCR for bill: ${billId}`);
        // Update attempts count
        await (0, db_js_1.query)(`UPDATE bills SET ocr_attempts = ocr_attempts + 1 WHERE id = $1`, [billId]);
        // TODO: Call actual OCR service
        // For now, simulate OCR processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Simulated OCR result
        const simulatedResult = {
            merchantName: 'Simulated Merchant',
            totalAmount: Math.floor(Math.random() * 500000) + 50000,
            billDate: new Date().toISOString().split('T')[0],
            confidence: Math.floor(Math.random() * 30) + 70,
        };
        const status = simulatedResult.confidence >= index_js_1.config.ocr.confidenceThreshold
            ? 'completed'
            : 'needs_review';
        await (0, db_js_1.query)(`UPDATE bills SET 
        status = $1,
        merchant_name = $2,
        total_amount = $3,
        bill_date = $4,
        ocr_confidence = $5,
        ocr_provider = 'tesseract'
       WHERE id = $6`, [status, simulatedResult.merchantName, simulatedResult.totalAmount,
            simulatedResult.billDate, simulatedResult.confidence, billId]);
        console.log(`✅ OCR completed for bill: ${billId}`);
    }
    /**
     * Handle push notification job
     */
    async handlePushNotification(payload) {
        const { userId, title, body, data } = payload;
        console.log(`📱 Sending push notification to user: ${userId}`);
        // Get user's device tokens
        const tokensResult = await (0, db_js_1.query)(`SELECT fcm_token FROM device_tokens WHERE user_id = $1 AND is_active = true`, [userId]);
        if (tokensResult.rows.length === 0) {
            console.log(`⚠️ No device tokens for user: ${userId}`);
            return;
        }
        // TODO: Send via Firebase
        // For now, just log
        console.log(`📱 Would send to ${tokensResult.rows.length} devices:`, { title, body });
        // Update last_used_at for tokens
        const tokens = tokensResult.rows.map(r => r.fcm_token);
        await (0, db_js_1.query)(`UPDATE device_tokens SET last_used_at = NOW() WHERE fcm_token = ANY($1)`, [tokens]);
    }
    /**
     * Handle email sending job
     */
    async handleEmailSend(payload) {
        const { to, subject, html } = payload;
        console.log(`📧 Sending email to: ${to}`);
        // TODO: Implement actual email sending via nodemailer
        // For now, just log
        console.log(`📧 Would send email:`, { to, subject });
    }
    /**
     * Handle report generation job
     */
    async handleReportGenerate(payload) {
        const { reportId } = payload;
        console.log(`📊 Generating report: ${reportId}`);
        // Update status to generating
        await (0, db_js_1.query)(`UPDATE reports SET status = 'generating' WHERE id = $1`, [reportId]);
        try {
            // Get report details
            const reportResult = await (0, db_js_1.query)(`SELECT * FROM reports WHERE id = $1`, [reportId]);
            if (reportResult.rows.length === 0) {
                throw new Error('Report not found');
            }
            const report = reportResult.rows[0];
            // Calculate summary
            const summaryResult = await (0, db_js_1.query)(`SELECT 
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
          COUNT(*) as transaction_count
         FROM transactions 
         WHERE user_id = $1 AND date BETWEEN $2 AND $3`, [report.user_id, report.start_date, report.end_date]);
            const summary = {
                totalIncome: parseFloat(summaryResult.rows[0].total_income),
                totalExpense: parseFloat(summaryResult.rows[0].total_expense),
                netSavings: parseFloat(summaryResult.rows[0].total_income) - parseFloat(summaryResult.rows[0].total_expense),
                transactionCount: parseInt(summaryResult.rows[0].transaction_count),
            };
            // Update report
            await (0, db_js_1.query)(`UPDATE reports SET status = 'completed', summary = $1 WHERE id = $2`, [JSON.stringify(summary), reportId]);
            console.log(`✅ Report generated: ${reportId}`);
        }
        catch (error) {
            await (0, db_js_1.query)(`UPDATE reports SET status = 'failed' WHERE id = $1`, [reportId]);
            throw error;
        }
    }
    /**
     * Handle bill reminder job
     */
    async handleBillReminder(payload) {
        const { reminderId } = payload;
        console.log(`🔔 Processing bill reminder: ${reminderId}`);
        const reminderResult = await (0, db_js_1.query)(`SELECT br.*, b.merchant_name, b.total_amount, b.bill_date
       FROM bill_reminders br
       JOIN bills b ON br.bill_id = b.id
       WHERE br.id = $1 AND br.is_sent = false`, [reminderId]);
        if (reminderResult.rows.length === 0) {
            console.log(`⚠️ Reminder not found or already sent: ${reminderId}`);
            return;
        }
        const reminder = reminderResult.rows[0];
        // Create notification
        await (0, db_js_1.query)(`INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'bill_reminder', $2, $3, $4)`, [
            reminder.user_id,
            reminder.title,
            `Bill from ${reminder.merchant_name}: ${reminder.total_amount?.toLocaleString()} VND`,
            JSON.stringify({ billId: reminder.bill_id })
        ]);
        // Enqueue push notification
        await queue_service_js_1.queueService.enqueue('push_notification', {
            userId: reminder.user_id,
            title: reminder.title,
            body: `Bill from ${reminder.merchant_name}: ${reminder.total_amount?.toLocaleString()} VND`,
            data: { type: 'bill_reminder', billId: reminder.bill_id }
        });
        // Mark as sent
        await (0, db_js_1.query)(`UPDATE bill_reminders SET is_sent = true, sent_at = NOW() WHERE id = $1`, [reminderId]);
        console.log(`✅ Bill reminder sent: ${reminderId}`);
    }
    /**
     * Handle budget alert job
     */
    async handleBudgetAlert(payload) {
        const { budgetId } = payload;
        console.log(`💰 Processing budget alert: ${budgetId}`);
        const budgetResult = await (0, db_js_1.query)(`SELECT b.*, c.name as category_name
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.id = $1`, [budgetId]);
        if (budgetResult.rows.length === 0) {
            throw new Error('Budget not found');
        }
        const budget = budgetResult.rows[0];
        const percentage = (budget.spent / budget.amount_limit) * 100;
        const isExceeded = percentage >= 100;
        const isWarning = percentage >= budget.alert_threshold;
        if (!isWarning && !isExceeded) {
            console.log(`✅ Budget ${budgetId} is within limits`);
            return;
        }
        const notificationType = isExceeded ? 'budget_exceeded' : 'budget_warning';
        const title = isExceeded
            ? `Budget Exceeded: ${budget.category_name}`
            : `Budget Warning: ${budget.category_name}`;
        const body = `You've spent ${percentage.toFixed(0)}% of your ${budget.category_name} budget`;
        // Create notification
        await (0, db_js_1.query)(`INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, $2, $3, $4, $5)`, [budget.user_id, notificationType, title, body, JSON.stringify({ budgetId })]);
        // Enqueue push notification
        await queue_service_js_1.queueService.enqueue('push_notification', {
            userId: budget.user_id,
            title,
            body,
            data: { type: notificationType, budgetId }
        });
        console.log(`✅ Budget alert sent: ${budgetId} (${percentage.toFixed(0)}%)`);
    }
}
exports.QueueWorker = QueueWorker;
// Singleton instance
exports.queueWorker = new QueueWorker();
//# sourceMappingURL=worker.js.map