"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRouter = void 0;
const express_1 = require("express");
const report_controller_js_1 = require("./report.controller.js");
exports.reportRouter = (0, express_1.Router)();
const controller = new report_controller_js_1.ReportController();
exports.reportRouter.get('/', controller.getReports);
exports.reportRouter.get('/trends', controller.getTrends);
exports.reportRouter.get('/insights', controller.getInsights);
exports.reportRouter.get('/monthly/:year/:month', controller.getMonthlyReport);
exports.reportRouter.get('/yearly/:year', controller.getYearlyReport);
exports.reportRouter.get('/:id', controller.getReport);
exports.reportRouter.post('/generate', controller.generateReport);
exports.reportRouter.get('/:id/download', controller.getDownloadUrl);
exports.reportRouter.delete('/:id', controller.deleteReport);
//# sourceMappingURL=report.routes.js.map