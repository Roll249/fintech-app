"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueService = exports.QueueService = void 0;
const db_js_1 = require("../../shared/db.js");
const uuid_1 = require("uuid");
class QueueService {
    isProcessing = false;
    processInterval = null;
    /**
     * Add a job to the queue
     */
    async enqueue(type, payload, options = {}) {
        const id = (0, uuid_1.v4)();
        const scheduledAt = options.scheduledAt || new Date();
        const maxAttempts = options.maxAttempts || 3;
        await (0, db_js_1.query)(`INSERT INTO job_queue (id, type, payload, scheduled_at, max_attempts)
       VALUES ($1, $2, $3, $4, $5)`, [id, type, JSON.stringify(payload), scheduledAt, maxAttempts]);
        console.log(`📋 Job enqueued: ${type} (${id})`);
        return id;
    }
    /**
     * Get next pending job
     */
    async dequeue() {
        const result = await (0, db_js_1.query)(`UPDATE job_queue
       SET status = 'processing', started_at = NOW(), attempts = attempts + 1
       WHERE id = (
         SELECT id FROM job_queue
         WHERE status IN ('pending', 'retry')
         AND scheduled_at <= NOW()
         ORDER BY scheduled_at ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING *`);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        return {
            id: row.id,
            type: row.type,
            payload: row.payload,
            status: row.status,
            attempts: row.attempts,
            maxAttempts: row.max_attempts,
            scheduledAt: row.scheduled_at,
            startedAt: row.started_at,
        };
    }
    /**
     * Mark job as completed
     */
    async complete(jobId) {
        await (0, db_js_1.query)(`UPDATE job_queue SET status = 'completed', completed_at = NOW() WHERE id = $1`, [jobId]);
        console.log(`✅ Job completed: ${jobId}`);
    }
    /**
     * Mark job as failed
     */
    async fail(jobId, error, canRetry = true) {
        const result = await (0, db_js_1.query)(`SELECT attempts, max_attempts FROM job_queue WHERE id = $1`, [jobId]);
        if (result.rows.length === 0)
            return;
        const { attempts, max_attempts } = result.rows[0];
        const shouldRetry = canRetry && attempts < max_attempts;
        if (shouldRetry) {
            // Exponential backoff: 1min, 5min, 15min
            const backoffMinutes = Math.pow(attempts, 2) * 1;
            const nextAttempt = new Date(Date.now() + backoffMinutes * 60 * 1000);
            await (0, db_js_1.query)(`UPDATE job_queue 
         SET status = 'retry', error_message = $1, scheduled_at = $2
         WHERE id = $3`, [error, nextAttempt, jobId]);
            console.log(`🔄 Job retry scheduled: ${jobId} at ${nextAttempt.toISOString()}`);
        }
        else {
            await (0, db_js_1.query)(`UPDATE job_queue 
         SET status = 'failed', error_message = $1, completed_at = NOW()
         WHERE id = $2`, [error, jobId]);
            console.log(`❌ Job failed: ${jobId} - ${error}`);
        }
    }
    /**
     * Get job status
     */
    async getJob(jobId) {
        const result = await (0, db_js_1.query)(`SELECT * FROM job_queue WHERE id = $1`, [jobId]);
        if (result.rows.length === 0)
            return null;
        const row = result.rows[0];
        return {
            id: row.id,
            type: row.type,
            payload: row.payload,
            status: row.status,
            attempts: row.attempts,
            maxAttempts: row.max_attempts,
            scheduledAt: row.scheduled_at,
            startedAt: row.started_at,
            completedAt: row.completed_at,
            errorMessage: row.error_message,
        };
    }
    /**
     * Get pending jobs count
     */
    async getPendingCount() {
        const result = await (0, db_js_1.query)(`SELECT COUNT(*) as count FROM job_queue WHERE status IN ('pending', 'retry')`);
        return parseInt(result.rows[0].count);
    }
    /**
     * Clean up old completed/failed jobs
     */
    async cleanup(olderThanDays = 7) {
        const result = await (0, db_js_1.query)(`DELETE FROM job_queue 
       WHERE status IN ('completed', 'failed') 
       AND completed_at < NOW() - INTERVAL '1 day' * $1`, [olderThanDays]);
        return result.rowCount || 0;
    }
}
exports.QueueService = QueueService;
// Singleton instance
exports.queueService = new QueueService();
//# sourceMappingURL=queue.service.js.map