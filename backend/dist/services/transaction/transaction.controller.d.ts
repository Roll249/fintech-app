import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
export declare class TransactionController {
    getTransactions(req: AuthenticatedRequest, res: Response): Promise<void>;
    getTransaction(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createTransaction(req: AuthenticatedRequest, res: Response): Promise<void>;
    updateTransaction(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteTransaction(req: AuthenticatedRequest, res: Response): Promise<void>;
    getSummary(req: AuthenticatedRequest, res: Response): Promise<void>;
    getRecent(req: AuthenticatedRequest, res: Response): Promise<void>;
    getCategories(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=transaction.controller.d.ts.map