"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const admin_controller_js_1 = require("./admin.controller.js");
const admin_middleware_js_1 = require("./admin.middleware.js");
exports.adminRouter = (0, express_1.Router)();
const controller = new admin_controller_js_1.AdminController();
// All admin routes require admin role
exports.adminRouter.use(admin_middleware_js_1.requireAdmin);
// User management
exports.adminRouter.get('/users', controller.getUsers);
exports.adminRouter.get('/users/:id', controller.getUser);
exports.adminRouter.put('/users/:id/status', controller.updateUserStatus);
exports.adminRouter.post('/users/:id/reset-password', controller.resetUserPassword);
// Dashboard
exports.adminRouter.get('/dashboard', controller.getDashboard);
exports.adminRouter.get('/dashboard/ocr-stats', controller.getOcrStats);
// Notifications
exports.adminRouter.post('/notifications/broadcast', controller.broadcastNotification);
// Funds
exports.adminRouter.get('/funds', controller.getFunds);
// Audit logs
exports.adminRouter.get('/audit-logs', controller.getAuditLogs);
//# sourceMappingURL=admin.routes.js.map