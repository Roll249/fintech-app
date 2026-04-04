import { Router } from 'express';
import { NotificationController } from './notification.controller.js';

export const notificationRouter = Router();
const controller = new NotificationController();

notificationRouter.get('/', controller.getNotifications);
notificationRouter.get('/summary', controller.getSummary);
notificationRouter.get('/preferences', controller.getPreferences);
notificationRouter.put('/preferences', controller.updatePreferences);
notificationRouter.delete('/', controller.clearAllNotifications);
notificationRouter.get('/:id', controller.getNotification);
notificationRouter.put('/:id/read', controller.markAsRead);
notificationRouter.put('/read-all', controller.markAllAsRead);
notificationRouter.delete('/:id', controller.deleteNotification);
notificationRouter.post('/devices', controller.registerDevice);
notificationRouter.delete('/devices/:token', controller.unregisterDevice);
