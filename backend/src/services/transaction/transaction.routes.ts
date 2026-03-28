import { Router } from 'express';
import { TransactionController } from './transaction.controller.js';

export const transactionRouter = Router();
const controller = new TransactionController();

transactionRouter.get('/', controller.getTransactions);
transactionRouter.get('/summary', controller.getSummary);
transactionRouter.get('/recent', controller.getRecent);
transactionRouter.get('/categories', controller.getCategories);
transactionRouter.get('/:id', controller.getTransaction);
transactionRouter.post('/', controller.createTransaction);
transactionRouter.put('/:id', controller.updateTransaction);
transactionRouter.delete('/:id', controller.deleteTransaction);
