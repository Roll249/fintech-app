export type JobType = 'bank_sync' | 'ocr_process' | 'push_notification' | 'email_send' | 'report_generate' | 'bill_reminder' | 'budget_alert';
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
export declare class QueueService {
    private isProcessing;
    private processInterval;
    /**
     * Add a job to the queue
     */
    enqueue(type: JobType, payload: Record<string, any>, options?: {
        scheduledAt?: Date;
        maxAttempts?: number;
    }): Promise<string>;
    /**
     * Get next pending job
     */
    dequeue(): Promise<Job | null>;
    /**
     * Mark job as completed
     */
    complete(jobId: string): Promise<void>;
    /**
     * Mark job as failed
     */
    fail(jobId: string, error: string, canRetry?: boolean): Promise<void>;
    /**
     * Get job status
     */
    getJob(jobId: string): Promise<Job | null>;
    /**
     * Get pending jobs count
     */
    getPendingCount(): Promise<number>;
    /**
     * Clean up old completed/failed jobs
     */
    cleanup(olderThanDays?: number): Promise<number>;
}
export declare const queueService: QueueService;
//# sourceMappingURL=queue.service.d.ts.map