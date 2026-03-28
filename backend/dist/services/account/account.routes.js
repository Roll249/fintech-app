"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountRouter = void 0;
const express_1 = require("express");
const account_controller_js_1 = require("./account.controller.js");
exports.accountRouter = (0, express_1.Router)();
const controller = new account_controller_js_1.AccountController();
exports.accountRouter.get('/', controller.getAccounts);
exports.accountRouter.get('/summary', controller.getSummary);
exports.accountRouter.get('/banks', controller.getSupportedBanks);
exports.accountRouter.get('/:id', controller.getAccount);
exports.accountRouter.post('/connect', controller.connectAccount);
exports.accountRouter.delete('/:id', controller.disconnectAccount);
exports.accountRouter.post('/:id/sync', controller.syncAccount);
//# sourceMappingURL=account.routes.js.map