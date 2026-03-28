import { Router } from 'express';
import { AccountController } from './account.controller.js';

export const accountRouter = Router();
const controller = new AccountController();

accountRouter.get('/', controller.getAccounts);
accountRouter.get('/summary', controller.getSummary);
accountRouter.get('/banks', controller.getSupportedBanks);
accountRouter.get('/:id', controller.getAccount);
accountRouter.post('/connect', controller.connectAccount);
accountRouter.delete('/:id', controller.disconnectAccount);
accountRouter.post('/:id/sync', controller.syncAccount);
