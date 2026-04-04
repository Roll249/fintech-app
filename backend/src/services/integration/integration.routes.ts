import { Router } from 'express';
import { IntegrationController } from './integration.controller.js';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { verifyBankSignatureFromParams, captureRawBody } from './webhook.middleware.js';

export const integrationRouter = Router();
const controller = new IntegrationController();

// Public routes (no auth, uses HMAC signature verification)
// Note: captureRawBody must be used when this router is mounted before body parser
integrationRouter.post(
  '/banks/:bankCode/callback',
  verifyBankSignatureFromParams(),
  controller.handleBankWebhook.bind(controller)
);

// OAuth callback - no auth required (comes from bank redirect)
integrationRouter.get(
  '/banks/:bankCode/oauth/callback',
  controller.handleBankOAuthCallback.bind(controller)
);

// Protected routes (auth required)
integrationRouter.post(
  '/banks/:bankCode/oauth/init',
  authMiddleware,
  controller.initBankOAuth.bind(controller)
);

integrationRouter.get(
  '/banks/:bankCode/status',
  authMiddleware,
  controller.getBankConnectionStatus.bind(controller)
);

// Utility route - list supported banks
integrationRouter.get(
  '/banks',
  controller.getSupportedBanks.bind(controller)
);

// Export captureRawBody for use in main app when mounting this router
export { captureRawBody };
