import { Router } from 'express';
import { FundController } from './fund.controller.js';

export const fundRouter = Router();
const controller = new FundController();

fundRouter.get('/', controller.getFunds);
fundRouter.get('/:id', controller.getFund);
fundRouter.get('/:id/export', controller.exportFund);
fundRouter.post('/', controller.createFund);
fundRouter.put('/:id', controller.updateFund);
fundRouter.delete('/:id', controller.deleteFund);
fundRouter.post('/:id/contribute', controller.contribute);
fundRouter.post('/:id/withdraw', controller.withdraw);
fundRouter.get('/:id/contributions', controller.getContributions);
fundRouter.post('/:id/invite', controller.inviteMember);
fundRouter.post('/:id/reminder', controller.setContributionReminder);
fundRouter.post('/:id/leave', controller.leaveFund);
fundRouter.put('/:id/members/:userId/role', controller.changeRole);
fundRouter.delete('/:id/members/:userId', controller.removeMember);
