import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
export declare class UserController {
    register(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    login(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    refreshToken(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateProfile(req: AuthenticatedRequest, res: Response): Promise<void>;
    logout(req: AuthenticatedRequest, res: Response): Promise<void>;
    changePassword(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=user.controller.d.ts.map