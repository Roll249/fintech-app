"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetRouter = void 0;
const express_1 = require("express");
const budget_controller_js_1 = require("./budget.controller.js");
exports.budgetRouter = (0, express_1.Router)();
const controller = new budget_controller_js_1.BudgetController();
exports.budgetRouter.get('/', controller.getBudgets);
exports.budgetRouter.get('/summary', controller.getSummary);
exports.budgetRouter.get('/alerts', controller.getAlerts);
exports.budgetRouter.get('/suggestions', controller.getSuggestions);
exports.budgetRouter.get('/:id', controller.getBudget);
exports.budgetRouter.post('/', controller.createBudget);
exports.budgetRouter.put('/:id', controller.updateBudget);
exports.budgetRouter.delete('/:id', controller.deleteBudget);
exports.budgetRouter.post('/:id/reset', controller.resetBudget);
//# sourceMappingURL=budget.routes.js.map