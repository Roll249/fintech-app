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
    registerDevice(req: AuthenticatedRequest, res: Response): Promise<void>;
    static createNotification(userId: string, type: string, title: string, body: string, data?: any): Promise<void>;
}
//# sourceMappingURL=notification.controller.d.ts.map