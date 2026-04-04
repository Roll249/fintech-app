"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationController = void 0;
const db_js_1 = require("../../shared/db.js");
const bank_service_js_1 = require("./bank.service.js");
const uuid_1 = require("uuid");
const bankService = new bank_service_js_1.BankService();
class IntegrationController {
    /**
     * Handle incoming bank webhook callbacks.
     * Verifies HMAC signature (done by middleware) and processes transactions.
     */
    async handleBankWebhook(req, res) {
        try {
            const bankCode = req.params.bankCode;
            const payload = req.body;
            // Validate payload structure
            if (!payload.eventId || !payload.eventType) {
                return res.status(400).json({ error: 'Invalid webhook payload' });
            }
            console.log(`Received webhook from ${bankCode}: ${payload.eventType}`);
            // Process the webhook payload
            const result = await bankService.processWebhookPayload(bankCode, payload);
            if (!result.processed) {
                // Return 200 even for duplicates to acknowledge receipt
                return res.status(200).json({
                    acknowledged: true,
                    message: result.message,
                });
            }
            res.status(200).json({
                acknowledged: true,
                message: result.message,
            });
        }
        catch (error) {
            console.error('Bank webhook error:', error);
            // Return 500 to signal bank to retry
            res.status(500).json({ error: 'Webhook processing failed' });
        }
    }
    /**
     * Initialize OAuth flow with a bank.
     * Generates OAuth URL and returns it to the client.
     */
    async initBankOAuth(req, res) {
        try {
            const userId = req.user?.id;
            const { bankCode } = req.params;
            const { accountId, redirectUrl } = req.body;
            // Validate bank code
            const bank = bankService.getBankByCode(bankCode);
            if (!bank) {
                return res.status(400).json({ error: 'Unsupported bank' });
            }
            // Validate account belongs to user
            if (accountId) {
                const accountResult = await (0, db_js_1.query)('SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [accountId, userId]);
                if (accountResult.rows.length === 0) {
                    return res.status(404).json({ error: 'Account not found' });
                }
            }
            // Use provided redirect URL or default
            const callbackUrl = redirectUrl || `${req.protocol}://${req.get('host')}/api/integration/banks/${bankCode}/oauth/callback`;
            // Generate OAuth URL with state
            const oauthUrl = bankService.generateOAuthUrl(bankCode, accountId || (0, uuid_1.v4)(), // Use temp ID if no account yet
            callbackUrl);
            if (!oauthUrl) {
                return res.status(500).json({ error: 'Failed to generate OAuth URL' });
            }
            res.json({
                oauthUrl,
                bankCode,
                bankName: bank.name,
            });
        }
        catch (error) {
            console.error('Init OAuth error:', error);
            res.status(500).json({ error: 'Failed to initialize OAuth flow' });
        }
    }
    /**
     * Handle OAuth callback from bank.
     * Exchanges authorization code for tokens and stores them.
     */
    async handleBankOAuthCallback(req, res) {
        try {
            const { bankCode } = req.params;
            const { code, state, error: oauthError, error_description } = req.query;
            // Handle OAuth errors
            if (oauthError) {
                console.error('OAuth error from bank:', oauthError, error_description);
                return res.redirect(`/oauth/error?error=${encodeURIComponent(String(oauthError))}&message=${encodeURIComponent(String(error_description || ''))}`);
            }
            if (!code || !state) {
                return res.status(400).json({ error: 'Missing code or state parameter' });
            }
            // Verify state
            const stateVerification = bankService.verifyOAuthState(String(state));
            if (!stateVerification.valid) {
                return res.status(400).json({ error: 'Invalid or expired state' });
            }
            const accountId = stateVerification.accountId;
            // Exchange code for tokens (in production, this would call the bank's token endpoint)
            const tokenResponse = await this.exchangeCodeForTokens(bankCode, String(code));
            if (!tokenResponse) {
                return res.status(500).json({ error: 'Failed to exchange code for tokens' });
            }
            // Store tokens
            await bankService.storeOAuthTokens(accountId, bankCode, tokenResponse.access_token, tokenResponse.refresh_token, tokenResponse.expires_in);
            // Update account with bank code if not set
            await (0, db_js_1.query)('UPDATE accounts SET bank_code = $1, updated_at = NOW() WHERE id = $2 AND bank_code IS NULL', [bankCode, accountId]);
            // Redirect to success page
            res.redirect(`/oauth/success?bank=${bankCode}`);
        }
        catch (error) {
            console.error('OAuth callback error:', error);
            res.redirect('/oauth/error?error=callback_failed');
        }
    }
    /**
     * Exchange authorization code for access tokens.
     * In production, this would make an HTTP request to the bank's token endpoint.
     */
    async exchangeCodeForTokens(bankCode, code) {
        const bank = bankService.getBankByCode(bankCode);
        if (!bank) {
            return null;
        }
        // In production, this would be an actual HTTP request:
        // const response = await fetch(`${bank.apiUrl}/oauth/token`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     grant_type: 'authorization_code',
        //     code,
        //     client_id: process.env[`${bankCode.toUpperCase()}_CLIENT_ID`],
        //     client_secret: process.env[`${bankCode.toUpperCase()}_CLIENT_SECRET`],
        //   }),
        // });
        // For now, return mock tokens for development
        return {
            access_token: `mock_access_${bankCode}_${Date.now()}`,
            refresh_token: `mock_refresh_${bankCode}_${Date.now()}`,
            expires_in: 3600, // 1 hour
        };
    }
    /**
     * Get bank connection status for an account.
     */
    async getBankConnectionStatus(req, res) {
        try {
            const userId = req.user?.id;
            const { bankCode } = req.params;
            const { accountId } = req.query;
            // Validate bank code
            const bank = bankService.getBankByCode(bankCode);
            if (!bank) {
                return res.status(400).json({ error: 'Unsupported bank' });
            }
            if (!accountId) {
                return res.status(400).json({ error: 'Account ID is required' });
            }
            // Get connection status
            const status = await bankService.getConnectionStatus(String(accountId), userId);
            if (!status) {
                return res.status(404).json({ error: 'Account not found' });
            }
            res.json(status);
        }
        catch (error) {
            console.error('Get connection status error:', error);
            res.status(500).json({ error: 'Failed to get connection status' });
        }
    }
    /**
     * Get list of supported banks.
     */
    async getSupportedBanks(_req, res) {
        res.json(bank_service_js_1.SUPPORTED_BANKS.map(bank => ({
            code: bank.code,
            name: bank.name,
        })));
    }
}
exports.IntegrationController = IntegrationController;
//# sourceMappingURL=integration.controller.js.map