import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
export declare class BillController {
    getBills(req: AuthenticatedRequest, res: Response): Promise<void>;
    getBill(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    uploadBill(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    private processOcr;
    updateBill(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteBill(req: AuthenticatedRequest, res: Response): Promise<void>;
    reprocessBill(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createTransactionFromBill(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    setReminder(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteReminder(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getReminders(req: AuthenticatedRequest, res: Response): Promise<void>;
    setupAutoPay(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=bill.controller.d.ts.map