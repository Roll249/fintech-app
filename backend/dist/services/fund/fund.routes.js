"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fundRouter = void 0;
const express_1 = require("express");
const fund_controller_js_1 = require("./fund.controller.js");
exports.fundRouter = (0, express_1.Router)();
const controller = new fund_controller_js_1.FundController();
exports.fundRouter.get('/', controller.getFunds);
exports.fundRouter.get('/:id', controller.getFund);
exports.fundRouter.post('/', controller.createFund);
exports.fundRouter.put('/:id', controller.updateFund);
exports.fundRouter.delete('/:id', controller.deleteFund);
exports.fundRouter.post('/:id/contribute', controller.contribute);
exports.fundRouter.post('/:id/withdraw', controller.withdraw);
exports.fundRouter.get('/:id/contributions', controller.getContributions);
exports.fundRouter.post('/:id/invite', controller.inviteMember);
exports.fundRouter.delete('/:id/members/:userId', controller.removeMember);
//# sourceMappingURL=fund.routes.js.map