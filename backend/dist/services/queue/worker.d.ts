export declare class QueueWorker {
    private handlers;
    private isRunning;
    private pollInterval;
    constructor();
    private registerHandlers;
    /**
     * Start the worker
     */
    start(pollIntervalMs?: number): void;
    /**
     * Stop the worker
     */
    stop(): void;
    /**
     * Process pending jobs
     */
    private processJobs;
    /**
     * Process a single job
     */
    private processNextJob;
    /**
     * Handle bank sync job
     */
    private handleBankSync;
    /**
     * Handle OCR processing job
     */
    private handleOcrProcess;
    /**
     * Handle push notification job
     */
    private handlePushNotification;
    /**
     * Handle email sending job
     */
    private handleEmailSend;
    /**
     * Handle report generation job
     */
    private handleReportGenerate;
    /**
     * Handle bill reminder job
     */
    private handleBillReminder;
    /**
     * Handle budget alert job
     */
    private handleBudgetAlert;
}
export declare const queueWorker: QueueWorker;
//# sourceMappingURL=worker.d.ts.map