import { Router } from 'express';
import { ReportController } from './report.controller.js';

export const reportRouter = Router();
const controller = new ReportController();

reportRouter.get('/', controller.getReports);
reportRouter.get('/trends', controller.getTrends);
reportRouter.get('/insights', controller.getInsights);
reportRouter.get('/monthly/:year/:month', controller.getMonthlyReport);
reportRouter.get('/yearly/:year', controller.getYearlyReport);
reportRouter.get('/:id', controller.getReport);
reportRouter.post('/generate', controller.generateReport);
reportRouter.get('/:id/download', controller.getDownloadUrl);
reportRouter.delete('/:id', controller.deleteReport);
