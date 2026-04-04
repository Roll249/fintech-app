import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
export declare class NotificationController {
    getNotifications(req: AuthenticatedRequest, res: Response): Promise<void>;
    getNotification(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    markAsRead(req: AuthenticatedRequest, res: Response): Promise<void>;
    markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void>;
    deleteNotification(req: AuthenticatedRequest, res: Response): Promise<void>;
    getSummary(req: AuthenticatedRequest, res: Response): Promise<void>;
    getPreferences(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updatePreferences(req: AuthenticatedRequest, res: Response): Promise<void>;
    registerDevice(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    unregisterDevice(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    clearAllNotifications(req: AuthenticatedRequest, res: Response): Promise<void>;
    static createNotification(userId: string, type: string, title: string, body: string, data?: any): Promise<any>;
    private static isInQuietHours;
    private static isNotificationTypeAllowed;
    private static sendPushNotification;
    private static logDeliveryStatus;
}
export { NotificationType } from './notification.types.js';
//# sourceMappingURL=notification.controller.d.ts.map