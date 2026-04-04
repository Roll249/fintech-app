import { query } from '../../shared/db.js';
import { v4 as uuidv4 } from 'uuid';

export type JobType = 
  | 'bank_sync'
  | 'ocr_process'
  | 'push_notification'
  | 'email_send'
  | 'report_generate'
  | 'bill_reminder'
  | 'budget_alert';

export interface Job {
  id: string;
  type: JobType;
  payload: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retry';
  attempts: number;
  maxAttempts: number;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export class QueueService {
  private isProcessing = false;
  private processInterval: NodeJS.Timeout | null = null;

  /**
   * Add a job to the queue
   */
  async enqueue(
    type: JobType,
    payload: Record<string, any>,
    options: {
      scheduledAt?: Date;
      maxAttempts?: number;
    } = {}
  ): Promise<string> {
    const id = uuidv4();
    const scheduledAt = options.scheduledAt || new Date();
    const maxAttempts = options.maxAttempts || 3;

    await query(
      `INSERT INTO job_queue (id, type, payload, scheduled_at, max_attempts)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, type, JSON.stringify(payload), scheduledAt, maxAttempts]
    );

    console.log(`📋 Job enqueued: ${type} (${id})`);
    return id;
  }

  /**
   * Get next pending job
   */
  async dequeue(): Promise<Job | null> {
    const result = await query(
      `UPDATE job_queue
       SET status = 'processing', started_at = NOW(), attempts = attempts + 1
       WHERE id = (
         SELECT id FROM job_queue
         WHERE status IN ('pending', 'retry')
         AND scheduled_at <= NOW()
         ORDER BY scheduled_at ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING *`
    );

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
  async complete(jobId: string): Promise<void> {
    await query(
      `UPDATE job_queue SET status = 'completed', completed_at = NOW() WHERE id = $1`,
      [jobId]
    );
    console.log(`✅ Job completed: ${jobId}`);
  }

  /**
   * Mark job as failed
   */
  async fail(jobId: string, error: string, canRetry: boolean = true): Promise<void> {
    const result = await query(
      `SELECT attempts, max_attempts FROM job_queue WHERE id = $1`,
      [jobId]
    );

    if (result.rows.length === 0) return;

    const { attempts, max_attempts } = result.rows[0];
    const shouldRetry = canRetry && attempts < max_attempts;

    if (shouldRetry) {
      // Exponential backoff: 1min, 5min, 15min
      const backoffMinutes = Math.pow(attempts, 2) * 1;
      const nextAttempt = new Date(Date.now() + backoffMinutes * 60 * 1000);

      await query(
        `UPDATE job_queue 
         SET status = 'retry', error_message = $1, scheduled_at = $2
         WHERE id = $3`,
        [error, nextAttempt, jobId]
      );
      console.log(`🔄 Job retry scheduled: ${jobId} at ${nextAttempt.toISOString()}`);
    } else {
      await query(
        `UPDATE job_queue 
         SET status = 'failed', error_message = $1, completed_at = NOW()
         WHERE id = $2`,
        [error, jobId]
      );
      console.log(`❌ Job failed: ${jobId} - ${error}`);
    }
  }

  /**
   * Get job status
   */
  async getJob(jobId: string): Promise<Job | null> {
    const result = await query(`SELECT * FROM job_queue WHERE id = $1`, [jobId]);
    
    if (result.rows.length === 0) return null;

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
  async getPendingCount(): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM job_queue WHERE status IN ('pending', 'retry')`
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Clean up old completed/failed jobs
   */
  async cleanup(olderThanDays: number = 7): Promise<number> {
    const result = await query(
      `DELETE FROM job_queue 
       WHERE status IN ('completed', 'failed') 
       AND completed_at < NOW() - INTERVAL '1 day' * $1`,
      [olderThanDays]
    );
    return result.rowCount || 0;
  }
}

// Singleton instance
export const queueService = new QueueService();
