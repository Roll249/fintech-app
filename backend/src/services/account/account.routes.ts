import { Router } from 'express';
import { AccountController } from './account.controller.js';

export const accountRouter = Router();
const controller = new AccountController();

accountRouter.get('/', controller.getAccounts);
accountRouter.get('/summary', controller.getSummary);
accountRouter.get('/banks', controller.getSupportedBanks);
accountRouter.get('/:id', controller.getAccount);
accountRouter.get('/:id/transactions', controller.getAccountTransactions);
accountRouter.get('/:id/sync-history', controller.getSyncHistory);
accountRouter.post('/connect', controller.connectAccount);
accountRouter.delete('/:id', controller.disconnectAccount);
accountRouter.post('/:id/sync', controller.syncAccount);
accountRouter.post('/:id/oauth/refresh', controller.refreshOAuth);
accountRouter.post('/:id/generate-test-transactions', controller.generateTestTransactions);
