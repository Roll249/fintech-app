// Notification types enum
export const NotificationType = {
  TRANSACTION: 'transaction',
  BUDGET_WARNING: 'budget_warning',
  BUDGET_EXCEEDED: 'budget_exceeded',
  FUND_CONTRIBUTION: 'fund_contribution',
  FUND_INVITE: 'fund_invite',
  BILL_REMINDER: 'bill_reminder',
  REPORT_READY: 'report_ready',
  SYSTEM: 'system',
} as const;

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
