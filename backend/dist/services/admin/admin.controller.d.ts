import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
export declare class AdminController {
    getUsers(req: AuthenticatedRequest, res: Response): Promise<void>;
    getUser(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    resetUserPassword(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getDashboard(req: AuthenticatedRequest, res: Response): Promise<void>;
    getOcrStats(req: AuthenticatedRequest, res: Response): Promise<void>;
    broadcastNotification(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getFunds(req: AuthenticatedRequest, res: Response): Promise<void>;
    getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=admin.controller.d.ts.map