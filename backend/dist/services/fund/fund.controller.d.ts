import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
export declare class FundController {
    getFunds(req: AuthenticatedRequest, res: Response): Promise<void>;
    getFund(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createFund(req: AuthenticatedRequest, res: Response): Promise<void>;
    updateFund(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteFund(req: AuthenticatedRequest, res: Response): Promise<void>;
    contribute(req: AuthenticatedRequest, res: Response): Promise<void>;
    withdraw(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getContributions(req: AuthenticatedRequest, res: Response): Promise<void>;
    inviteMember(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    removeMember(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=fund.controller.d.ts.map