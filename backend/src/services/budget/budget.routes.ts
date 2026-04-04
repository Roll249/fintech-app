import { Router } from 'express';
import { BudgetController } from './budget.controller.js';

export const budgetRouter = Router();
const controller = new BudgetController();

budgetRouter.get('/', controller.getBudgets);
budgetRouter.get('/summary', controller.getSummary);
budgetRouter.get('/alerts', controller.getAlerts);
budgetRouter.get('/suggestions', controller.getSuggestions);
budgetRouter.get('/:id', controller.getBudget);
budgetRouter.post('/', controller.createBudget);
budgetRouter.put('/:id', controller.updateBudget);
budgetRouter.delete('/:id', controller.deleteBudget);
budgetRouter.post('/:id/reset', controller.resetBudget);
