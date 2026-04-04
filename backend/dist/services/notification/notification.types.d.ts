export declare const NotificationType: {
    readonly TRANSACTION: "transaction";
    readonly BUDGET_WARNING: "budget_warning";
    readonly BUDGET_EXCEEDED: "budget_exceeded";
    readonly FUND_CONTRIBUTION: "fund_contribution";
    readonly FUND_INVITE: "fund_invite";
    readonly BILL_REMINDER: "bill_reminder";
    readonly REPORT_READY: "report_ready";
    readonly SYSTEM: "system";
};
export type NotificationTypeValue = (typeof NotificationType)[keyof typeof NotificationType];
export interface PushNotification {
    title: string;
    body: string;
}
export interface PushData {
    [key: string]: string;
}
export interface SendResult {
    successCount: number;
    failureCount: number;
    invalidTokens: string[];
}
export interface DeviceToken {
    id: string;
    userId: string;
    fcmToken: string;
    deviceType: string;
    deviceName: string;
    lastUsedAt: Date;
    createdAt: Date;
}
export interface NotificationPreferences {
    userId: string;
    pushEnabled: boolean;
    emailEnabled: boolean;
    transactionAlerts: boolean;
    budgetAlerts: boolean;
    fundUpdates: boolean;
    marketingEmails: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
}
//# sourceMappingURL=notification.types.d.ts.map