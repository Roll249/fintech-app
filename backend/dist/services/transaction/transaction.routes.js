"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionRouter = void 0;
const express_1 = require("express");
const transaction_controller_js_1 = require("./transaction.controller.js");
exports.transactionRouter = (0, express_1.Router)();
const controller = new transaction_controller_js_1.TransactionController();
exports.transactionRouter.get('/', controller.getTransactions);
exports.transactionRouter.get('/summary', controller.getSummary);
exports.transactionRouter.get('/recent', controller.getRecent);
exports.transactionRouter.get('/categories', controller.getCategories);
exports.transactionRouter.get('/:id', controller.getTransaction);
exports.transactionRouter.post('/', controller.createTransaction);
exports.transactionRouter.put('/:id', controller.updateTransaction);
exports.transactionRouter.delete('/:id', controller.deleteTransaction);
//# sourceMappingURL=transaction.routes.js.map