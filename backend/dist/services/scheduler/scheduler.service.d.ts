export interface ScheduledTask {
    name: string;
    cronExpression: string;
    handler: () => Promise<void>;
    enabled: boolean;
}
export declare class SchedulerService {
    private tasks;
    private intervals;
    private isRunning;
    constructor();
    private registerTasks;
    /**
     * Start the scheduler
     */
    start(): void;
    /**
     * Stop the scheduler
     */
    stop(): void;
    /**
     * Convert cron expression to milliseconds interval (simplified)
     */
    private cronToInterval;
    /**
     * Schedule bank sync for all active accounts
     */
    private scheduleBankSync;
    /**
     * Process pending bill reminders
     */
    private processBillReminders;
    /**
     * Check budget alerts
     */
    private checkBudgetAlerts;
    /**
     * Generate monthly reports for all users
     */
    private generateMonthlyReports;
    /**
     * Clean up expired tokens
     */
    private cleanupExpiredTokens;
    /**
     * Clean up old jobs from queue
     */
    private cleanupOldJobs;
    /**
     * Send fund contribution reminders
     */
    private sendFundReminders;
    /**
     * Run a task manually
     */
    runTask(taskName: string): Promise<void>;
    /**
     * Get task list
     */
    getTasks(): {
        name: string;
        enabled: boolean;
        isRunning: boolean;
    }[];
}
export declare const schedulerService: SchedulerService;
//# sourceMappingURL=scheduler.service.d.ts.map