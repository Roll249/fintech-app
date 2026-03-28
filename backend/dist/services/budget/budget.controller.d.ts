import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
export declare class BudgetController {
    getBudgets(req: AuthenticatedRequest, res: Response): Promise<void>;
    getBudget(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createBudget(req: AuthenticatedRequest, res: Response): Promise<void>;
    updateBudget(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteBudget(req: AuthenticatedRequest, res: Response): Promise<void>;
    getSummary(req: AuthenticatedRequest, res: Response): Promise<void>;
    getAlerts(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=budget.controller.d.ts.map