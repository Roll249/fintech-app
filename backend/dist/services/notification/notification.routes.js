"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRouter = void 0;
const express_1 = require("express");
const notification_controller_js_1 = require("./notification.controller.js");
exports.notificationRouter = (0, express_1.Router)();
const controller = new notification_controller_js_1.NotificationController();
exports.notificationRouter.get('/', controller.getNotifications);
exports.notificationRouter.get('/summary', controller.getSummary);
exports.notificationRouter.get('/preferences', controller.getPreferences);
exports.notificationRouter.put('/preferences', controller.updatePreferences);
exports.notificationRouter.get('/:id', controller.getNotification);
exports.notificationRouter.put('/:id/read', controller.markAsRead);
exports.notificationRouter.put('/read-all', controller.markAllAsRead);
exports.notificationRouter.delete('/:id', controller.deleteNotification);
exports.notificationRouter.post('/devices', controller.registerDevice);
//# sourceMappingURL=notification.routes.js.map