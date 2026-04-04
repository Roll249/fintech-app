import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { requireAdmin } from './admin.middleware.js';

export const adminRouter = Router();
const controller = new AdminController();

// All admin routes require admin role
adminRouter.use(requireAdmin);

// User management
adminRouter.get('/users', controller.getUsers);
adminRouter.get('/users/:id', controller.getUser);
adminRouter.put('/users/:id/status', controller.updateUserStatus);
adminRouter.post('/users/:id/reset-password', controller.resetUserPassword);

// Dashboard
adminRouter.get('/dashboard', controller.getDashboard);
adminRouter.get('/dashboard/ocr-stats', controller.getOcrStats);

// Notifications
adminRouter.post('/notifications/broadcast', controller.broadcastNotification);

// Funds
adminRouter.get('/funds', controller.getFunds);

// Audit logs
adminRouter.get('/audit-logs', controller.getAuditLogs);
