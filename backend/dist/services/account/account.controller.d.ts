import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
export declare class AccountController {
    getAccounts(req: AuthenticatedRequest, res: Response): Promise<void>;
    getAccount(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    connectAccount(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    disconnectAccount(req: AuthenticatedRequest, res: Response): Promise<void>;
    syncAccount(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getSummary(req: AuthenticatedRequest, res: Response): Promise<void>;
    getSupportedBanks(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=account.controller.d.ts.map