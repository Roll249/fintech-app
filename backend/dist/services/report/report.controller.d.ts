import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
export declare class ReportController {
    getReports(req: AuthenticatedRequest, res: Response): Promise<void>;
    getReport(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    generateReport(req: AuthenticatedRequest, res: Response): Promise<void>;
    private generateReportAsync;
    private generatePdf;
    getDownloadUrl(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteReport(req: AuthenticatedRequest, res: Response): Promise<void>;
    getMonthlyReport(req: AuthenticatedRequest, res: Response): Promise<void>;
    getYearlyReport(req: AuthenticatedRequest, res: Response): Promise<void>;
    private calculateSummary;
    getTrends(req: AuthenticatedRequest, res: Response): Promise<void>;
    getInsights(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=report.controller.d.ts.map