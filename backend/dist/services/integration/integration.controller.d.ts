import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
import { WebhookRequest } from './webhook.middleware.js';
export declare class IntegrationController {
    /**
     * Handle incoming bank webhook callbacks.
     * Verifies HMAC signature (done by middleware) and processes transactions.
     */
    handleBankWebhook(req: WebhookRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Initialize OAuth flow with a bank.
     * Generates OAuth URL and returns it to the client.
     */
    initBankOAuth(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Handle OAuth callback from bank.
     * Exchanges authorization code for tokens and stores them.
     */
    handleBankOAuthCallback(req: Request, res: Response): Promise<void | Response<any, Record<string, any>>>;
    /**
     * Exchange authorization code for access tokens.
     * In production, this would make an HTTP request to the bank's token endpoint.
     */
    private exchangeCodeForTokens;
    /**
     * Get bank connection status for an account.
     */
    getBankConnectionStatus(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get list of supported banks.
     */
    getSupportedBanks(_req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=integration.controller.d.ts.map