"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureRawBody = exports.integrationRouter = void 0;
const express_1 = require("express");
const integration_controller_js_1 = require("./integration.controller.js");
const auth_middleware_js_1 = require("../../shared/middleware/auth.middleware.js");
const webhook_middleware_js_1 = require("./webhook.middleware.js");
Object.defineProperty(exports, "captureRawBody", { enumerable: true, get: function () { return webhook_middleware_js_1.captureRawBody; } });
exports.integrationRouter = (0, express_1.Router)();
const controller = new integration_controller_js_1.IntegrationController();
// Public routes (no auth, uses HMAC signature verification)
// Note: captureRawBody must be used when this router is mounted before body parser
exports.integrationRouter.post('/banks/:bankCode/callback', (0, webhook_middleware_js_1.verifyBankSignatureFromParams)(), controller.handleBankWebhook.bind(controller));
// OAuth callback - no auth required (comes from bank redirect)
exports.integrationRouter.get('/banks/:bankCode/oauth/callback', controller.handleBankOAuthCallback.bind(controller));
// Protected routes (auth required)
exports.integrationRouter.post('/banks/:bankCode/oauth/init', auth_middleware_js_1.authMiddleware, controller.initBankOAuth.bind(controller));
exports.integrationRouter.get('/banks/:bankCode/status', auth_middleware_js_1.authMiddleware, controller.getBankConnectionStatus.bind(controller));
// Utility route - list supported banks
exports.integrationRouter.get('/banks', controller.getSupportedBanks.bind(controller));
//# sourceMappingURL=integration.routes.js.map