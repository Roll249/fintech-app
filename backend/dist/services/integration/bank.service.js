"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankService = exports.SUPPORTED_BANKS = void 0;
const db_js_1 = require("../../shared/db.js");
const index_js_1 = require("../../config/index.js");
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
exports.SUPPORTED_BANKS = [
    {
        code: 'vcb',
        name: 'Vietcombank',
        oauthUrl: 'https://api.vietcombank.com.vn/oauth/authorize',
        apiUrl: 'https://api.vietcombank.com.vn/v1',
    },
    {
        code: 'tcb',
        name: 'Techcombank',
        oauthUrl: 'https://api.techcombank.com.vn/oauth/authorize',
        apiUrl: 'https://api.techcombank.com.vn/v1',
    },
    {
        code: 'mb',
        name: 'MB Bank',
        oauthUrl: 'https://api.mbbank.com.vn/oauth/authorize',
        apiUrl: 'https://api.mbbank.com.vn/v1',
    },
    {
        code: 'vpb',
        name: 'VPBank',
        oauthUrl: 'https://api.vpbank.com.vn/oauth/authorize',
        apiUrl: 'https://api.vpbank.com.vn/v1',
    },
    {
        code: 'acb',
        name: 'ACB',
        oauthUrl: 'https://api.acb.com.vn/oauth/authorize',
        apiUrl: 'https://api.acb.com.vn/v1',
    },
];
class BankService {
    getBankByCode(code) {
        return exports.SUPPORTED_BANKS.find(bank => bank.code === code);
    }
    async processWebhookPayload(bankCode, payload) {
        const { eventId, eventType, accountNumber, balance, transactions } = payload;
        // Check for duplicate event (idempotency)
        const existingEvent = await (0, db_js_1.query)('SELECT id FROM bank_webhook_events WHERE event_id = $1 AND bank_code = $2', [eventId, bankCode]);
        if (existingEvent.rows.length > 0) {
            return { processed: false, message: 'Event already processed' };
        }
        // Store webhook event for idempotency
        await (0, db_js_1.query)(`INSERT INTO bank_webhook_events (id, bank_code, event_id, event_type, payload, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`, [(0, uuid_1.v4)(), bankCode, eventId, eventType, JSON.stringify(payload)]);
        // Find linked account by account number and bank code
        const accountResult = await (0, db_js_1.query)('SELECT id, user_id FROM accounts WHERE account_number = $1 AND bank_code = $2', [accountNumber, bankCode]);
        if (accountResult.rows.length === 0) {
            return { processed: false, message: 'Account not found' };
        }
        const account = accountResult.rows[0];
        // Process based on event type
        switch (eventType) {
            case 'transaction.created':
            case 'transactions.sync':
                if (transactions && transactions.length > 0) {
                    await this.createTransactionsFromBank(account.id, account.user_id, transactions);
                }
                break;
            case 'balance.updated':
                if (balance !== undefined) {
                    await this.syncAccountBalance(account.id, balance);
                }
                break;
            case 'account.sync':
                if (transactions && transactions.length > 0) {
                    await this.createTransactionsFromBank(account.id, account.user_id, transactions);
                }
                if (balance !== undefined) {
                    await this.syncAccountBalance(account.id, balance);
                }
                break;
            default:
                console.log(`Unknown event type: ${eventType}`);
        }
        // Mark event as processed
        await (0, db_js_1.query)('UPDATE bank_webhook_events SET processed_at = NOW(), status = $1 WHERE event_id = $2 AND bank_code = $3', ['processed', eventId, bankCode]);
        return { processed: true, message: 'Webhook processed successfully' };
    }
    async createTransactionsFromBank(accountId, userId, transactions) {
        let createdCount = 0;
        for (const tx of transactions) {
            // Check for duplicate transaction by external_id
            const existingTx = await (0, db_js_1.query)('SELECT id FROM transactions WHERE external_id = $1 AND account_id = $2', [tx.externalId, accountId]);
            if (existingTx.rows.length > 0) {
                continue; // Skip duplicate
            }
            // Create transaction
            await (0, db_js_1.query)(`INSERT INTO transactions (
          id, user_id, account_id, external_id, amount, type, description, 
          merchant_name, date, is_manual, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, $10, NOW())`, [
                (0, uuid_1.v4)(),
                userId,
                accountId,
                tx.externalId,
                tx.amount,
                tx.type,
                tx.description,
                tx.merchantName || null,
                tx.date,
                tx.metadata ? JSON.stringify(tx.metadata) : null,
            ]);
            // Update account balance
            const balanceChange = tx.type === 'income' ? tx.amount : -tx.amount;
            await (0, db_js_1.query)('UPDATE accounts SET balance = balance + $1, updated_at = NOW() WHERE id = $2', [balanceChange, accountId]);
            createdCount++;
        }
        return createdCount;
    }
    async syncAccountBalance(accountId, balance) {
        await (0, db_js_1.query)('UPDATE accounts SET balance = $1, last_synced_at = NOW(), updated_at = NOW() WHERE id = $2', [balance, accountId]);
    }
    generateOAuthUrl(bankCode, accountId, redirectUrl) {
        const bank = this.getBankByCode(bankCode);
        if (!bank) {
            return null;
        }
        const state = this.generateOAuthState(accountId);
        const clientId = this.getBankClientId(bankCode);
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUrl,
            response_type: 'code',
            scope: 'accounts transactions balance',
            state,
        });
        return `${bank.oauthUrl}?${params.toString()}`;
    }
    generateOAuthState(accountId) {
        const payload = {
            accountId,
            timestamp: Date.now(),
            nonce: (0, uuid_1.v4)(),
        };
        const stateStr = JSON.stringify(payload);
        const hmac = crypto_1.default.createHmac('sha256', index_js_1.config.jwt.secret);
        hmac.update(stateStr);
        const signature = hmac.digest('hex');
        return Buffer.from(`${stateStr}.${signature}`).toString('base64');
    }
    verifyOAuthState(state) {
        try {
            const decoded = Buffer.from(state, 'base64').toString('utf8');
            const [payloadStr, signature] = decoded.split('.');
            if (!payloadStr || !signature) {
                return { valid: false };
            }
            // Verify signature
            const hmac = crypto_1.default.createHmac('sha256', index_js_1.config.jwt.secret);
            hmac.update(payloadStr);
            const expectedSignature = hmac.digest('hex');
            if (signature !== expectedSignature) {
                return { valid: false };
            }
            const payload = JSON.parse(payloadStr);
            // Check timestamp (valid for 10 minutes)
            const maxAge = 10 * 60 * 1000;
            if (Date.now() - payload.timestamp > maxAge) {
                return { valid: false };
            }
            return { valid: true, accountId: payload.accountId };
        }
        catch (error) {
            return { valid: false };
        }
    }
    getBankClientId(bankCode) {
        // In production, these would come from environment variables
        const clientIds = {
            vcb: process.env.VCB_CLIENT_ID || 'vcb_client_id',
            tcb: process.env.TCB_CLIENT_ID || 'tcb_client_id',
            mb: process.env.MB_CLIENT_ID || 'mb_client_id',
            vpb: process.env.VPB_CLIENT_ID || 'vpb_client_id',
            acb: process.env.ACB_CLIENT_ID || 'acb_client_id',
        };
        return clientIds[bankCode] || '';
    }
    getBankWebhookSecret(bankCode) {
        // In production, these would come from environment variables
        const secrets = {
            vcb: process.env.VCB_WEBHOOK_SECRET || 'vcb_webhook_secret',
            tcb: process.env.TCB_WEBHOOK_SECRET || 'tcb_webhook_secret',
            mb: process.env.MB_WEBHOOK_SECRET || 'mb_webhook_secret',
            vpb: process.env.VPB_WEBHOOK_SECRET || 'vpb_webhook_secret',
            acb: process.env.ACB_WEBHOOK_SECRET || 'acb_webhook_secret',
        };
        return secrets[bankCode] || '';
    }
    async storeOAuthTokens(accountId, bankCode, accessToken, refreshToken, expiresIn) {
        const expiresAt = new Date(Date.now() + expiresIn * 1000);
        await (0, db_js_1.query)(`UPDATE accounts 
       SET bank_access_token = $1, 
           bank_refresh_token = $2, 
           bank_token_expires_at = $3,
           connection_status = 'connected',
           updated_at = NOW()
       WHERE id = $4`, [accessToken, refreshToken, expiresAt, accountId]);
    }
    async getConnectionStatus(accountId, userId) {
        const result = await (0, db_js_1.query)(`SELECT connection_status, last_synced_at, bank_code, bank_token_expires_at
       FROM accounts
       WHERE id = $1 AND user_id = $2`, [accountId, userId]);
        if (result.rows.length === 0) {
            return null;
        }
        const account = result.rows[0];
        const bank = account.bank_code ? this.getBankByCode(account.bank_code) : null;
        // Check if token is expired
        let status = account.connection_status || 'disconnected';
        if (status === 'connected' && account.bank_token_expires_at) {
            const expiresAt = new Date(account.bank_token_expires_at);
            if (expiresAt < new Date()) {
                status = 'token_expired';
            }
        }
        return {
            connected: status === 'connected',
            status,
            lastSyncedAt: account.last_synced_at,
            bankCode: account.bank_code,
            bankName: bank?.name || null,
        };
    }
}
exports.BankService = BankService;
//# sourceMappingURL=bank.service.js.map