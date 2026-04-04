"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountController = void 0;
const db_js_1 = require("../../shared/db.js");
const SUPPORTED_BANKS = [
    { code: 'VCB', name: 'Vietcombank', logoUrl: '/banks/vcb.png', supported: true },
    { code: 'TCB', name: 'Techcombank', logoUrl: '/banks/tcb.png', supported: true },
    { code: 'VPB', name: 'VPBank', logoUrl: '/banks/vpb.png', supported: true },
    { code: 'ACB', name: 'ACB', logoUrl: '/banks/acb.png', supported: true },
    { code: 'MBB', name: 'MB Bank', logoUrl: '/banks/mbb.png', supported: true },
    { code: 'TPB', name: 'TPBank', logoUrl: '/banks/tpb.png', supported: true },
];
const DEMO_MERCHANTS = [
    'Grab', 'VinMart', 'Circle K', 'Highland Coffee', 'Shopee', 'Lazada',
    'Tiki', 'BigC', 'Lotte Mart', 'Co.opmart', 'Phuc Long', 'The Coffee House'
];
const DEMO_CATEGORIES = ['food', 'transport', 'shopping', 'entertainment', 'utilities', 'groceries'];
class AccountController {
    async getAccounts(req, res) {
        try {
            const userId = req.user?.id;
            const result = await (0, db_js_1.query)(`SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
            res.json(result.rows.map(row => ({
                id: row.id,
                userId: row.user_id,
                bankCode: row.bank_code,
                bankName: row.bank_name,
                accountNumber: row.account_number,
                accountName: row.account_name,
                balance: parseFloat(row.balance),
                currency: row.currency,
                type: row.type,
                status: row.status,
                lastSyncedAt: row.last_synced_at,
                createdAt: row.created_at,
            })));
        }
        catch (error) {
            console.error('Get accounts error:', error);
            res.status(500).json({ error: 'Failed to get accounts' });
        }
    }
    async getAccount(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            const result = await (0, db_js_1.query)('SELECT * FROM accounts WHERE id = $1 AND user_id = $2', [id, userId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Account not found' });
            }
            const row = result.rows[0];
            res.json({
                id: row.id,
                userId: row.user_id,
                bankCode: row.bank_code,
                bankName: row.bank_name,
                accountNumber: row.account_number,
                accountName: row.account_name,
                balance: parseFloat(row.balance),
                currency: row.currency,
                type: row.type,
                status: row.status,
                lastSyncedAt: row.last_synced_at,
                createdAt: row.created_at,
            });
        }
        catch (error) {
            console.error('Get account error:', error);
            res.status(500).json({ error: 'Failed to get account' });
        }
    }
    async connectAccount(req, res) {
        try {
            const userId = req.user?.id;
            const { bankCode, accountNumber, accountName, type = 'checking' } = req.body;
            const bank = SUPPORTED_BANKS.find(b => b.code === bankCode);
            if (!bank) {
                return res.status(400).json({ error: 'Unsupported bank' });
            }
            // Simulate initial balance (for demo)
            const initialBalance = Math.floor(Math.random() * 50000000) + 1000000;
            const result = await (0, db_js_1.query)(`INSERT INTO accounts (user_id, bank_code, bank_name, account_number, account_name, balance, type, status, last_synced_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW())
         RETURNING *`, [userId, bankCode, bank.name, accountNumber, accountName || 'Primary Account', initialBalance, type]);
            const row = result.rows[0];
            res.status(201).json({
                id: row.id,
                bankCode: row.bank_code,
                bankName: row.bank_name,
                accountNumber: row.account_number,
                balance: parseFloat(row.balance),
                status: row.status,
            });
        }
        catch (error) {
            console.error('Connect account error:', error);
            res.status(500).json({ error: 'Failed to connect account' });
        }
    }
    async disconnectAccount(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            await (0, db_js_1.query)(`UPDATE accounts SET status = 'disconnected' WHERE id = $1 AND user_id = $2`, [id, userId]);
            res.json({ message: 'Account disconnected' });
        }
        catch (error) {
            console.error('Disconnect account error:', error);
            res.status(500).json({ error: 'Failed to disconnect account' });
        }
    }
    async syncAccount(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            // Verify account exists
            const accountCheck = await (0, db_js_1.query)('SELECT * FROM accounts WHERE id = $1 AND user_id = $2', [id, userId]);
            if (accountCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Account not found' });
            }
            const syncStartTime = new Date();
            let syncStatus = 'success';
            let errorMessage = null;
            let transactionsFound = 0;
            try {
                // Generate simulated transactions (demo mode)
                const numTransactions = Math.floor(Math.random() * 5) + 1;
                for (let i = 0; i < numTransactions; i++) {
                    const isExpense = Math.random() > 0.3;
                    const amount = Math.floor(Math.random() * 500000) + 10000;
                    const merchant = DEMO_MERCHANTS[Math.floor(Math.random() * DEMO_MERCHANTS.length)];
                    const category = DEMO_CATEGORIES[Math.floor(Math.random() * DEMO_CATEGORIES.length)];
                    const daysAgo = Math.floor(Math.random() * 7);
                    const txDate = new Date();
                    txDate.setDate(txDate.getDate() - daysAgo);
                    await (0, db_js_1.query)(`INSERT INTO transactions (user_id, account_id, amount, type, description, merchant_name, date, is_manual)
             VALUES ($1, $2, $3, $4, $5, $6, $7, false)
             ON CONFLICT DO NOTHING`, [userId, id, amount, isExpense ? 'expense' : 'income',
                        `${isExpense ? 'Payment at' : 'Income from'} ${merchant}`, merchant, txDate]);
                    transactionsFound++;
                }
                // Update balance based on transactions
                const balanceChange = Math.floor(Math.random() * 1000000) - 500000;
                await (0, db_js_1.query)(`UPDATE accounts SET 
             balance = balance + $1, 
             last_synced_at = NOW() 
           WHERE id = $2 AND user_id = $3`, [balanceChange, id, userId]);
            }
            catch (syncError) {
                syncStatus = 'failed';
                errorMessage = syncError.message;
            }
            // Record sync history
            await (0, db_js_1.query)(`INSERT INTO account_sync_history (account_id, sync_status, transactions_found, error_message, started_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`, [id, syncStatus, transactionsFound, errorMessage, syncStartTime]);
            // Get updated account
            const result = await (0, db_js_1.query)('SELECT * FROM accounts WHERE id = $1', [id]);
            res.json({
                message: 'Account synced',
                balance: parseFloat(result.rows[0].balance),
                lastSyncedAt: result.rows[0].last_synced_at,
                transactionsFound,
                syncStatus,
            });
        }
        catch (error) {
            console.error('Sync account error:', error);
            res.status(500).json({ error: 'Failed to sync account' });
        }
    }
    async getAccountTransactions(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            const { page = 1, pageSize = 20, startDate, endDate, type } = req.query;
            const offset = (Number(page) - 1) * Number(pageSize);
            // Verify account ownership
            const accountCheck = await (0, db_js_1.query)('SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [id, userId]);
            if (accountCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Account not found' });
            }
            let queryStr = `
        SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.account_id = $1 AND t.user_id = $2
      `;
            const params = [id, userId];
            let paramIndex = 3;
            if (startDate) {
                queryStr += ` AND t.date >= $${paramIndex}`;
                params.push(startDate);
                paramIndex++;
            }
            if (endDate) {
                queryStr += ` AND t.date <= $${paramIndex}`;
                params.push(endDate);
                paramIndex++;
            }
            if (type) {
                queryStr += ` AND t.type = $${paramIndex}`;
                params.push(type);
                paramIndex++;
            }
            queryStr += ` ORDER BY t.date DESC, t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(Number(pageSize), offset);
            const result = await (0, db_js_1.query)(queryStr, params);
            // Get total count
            let countQuery = `SELECT COUNT(*) FROM transactions WHERE account_id = $1 AND user_id = $2`;
            const countParams = [id, userId];
            let countParamIndex = 3;
            if (startDate) {
                countQuery += ` AND date >= $${countParamIndex}`;
                countParams.push(startDate);
                countParamIndex++;
            }
            if (endDate) {
                countQuery += ` AND date <= $${countParamIndex}`;
                countParams.push(endDate);
                countParamIndex++;
            }
            if (type) {
                countQuery += ` AND type = $${countParamIndex}`;
                countParams.push(type);
            }
            const countResult = await (0, db_js_1.query)(countQuery, countParams);
            res.json({
                items: result.rows.map(row => ({
                    id: row.id,
                    accountId: row.account_id,
                    amount: parseFloat(row.amount),
                    type: row.type,
                    category: row.category_id ? {
                        id: row.category_id,
                        name: row.category_name,
                        icon: row.category_icon,
                        color: row.category_color,
                    } : null,
                    description: row.description,
                    merchantName: row.merchant_name,
                    date: row.date,
                    isManual: row.is_manual,
                    createdAt: row.created_at,
                })),
                page: Number(page),
                pageSize: Number(pageSize),
                totalItems: parseInt(countResult.rows[0].count),
                totalPages: Math.ceil(parseInt(countResult.rows[0].count) / Number(pageSize)),
            });
        }
        catch (error) {
            console.error('Get account transactions error:', error);
            res.status(500).json({ error: 'Failed to get account transactions' });
        }
    }
    async getSyncHistory(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            const { page = 1, pageSize = 20 } = req.query;
            const offset = (Number(page) - 1) * Number(pageSize);
            // Verify account ownership
            const accountCheck = await (0, db_js_1.query)('SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [id, userId]);
            if (accountCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Account not found' });
            }
            const result = await (0, db_js_1.query)(`SELECT * FROM account_sync_history 
         WHERE account_id = $1 
         ORDER BY started_at DESC 
         LIMIT $2 OFFSET $3`, [id, Number(pageSize), offset]);
            const countResult = await (0, db_js_1.query)('SELECT COUNT(*) FROM account_sync_history WHERE account_id = $1', [id]);
            res.json({
                items: result.rows.map(row => ({
                    id: row.id,
                    accountId: row.account_id,
                    syncStatus: row.sync_status,
                    transactionsFound: row.transactions_found,
                    errorMessage: row.error_message,
                    startedAt: row.started_at,
                    completedAt: row.completed_at,
                })),
                page: Number(page),
                pageSize: Number(pageSize),
                totalItems: parseInt(countResult.rows[0].count),
                totalPages: Math.ceil(parseInt(countResult.rows[0].count) / Number(pageSize)),
            });
        }
        catch (error) {
            console.error('Get sync history error:', error);
            res.status(500).json({ error: 'Failed to get sync history' });
        }
    }
    async refreshOAuth(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            // Verify account ownership
            const accountCheck = await (0, db_js_1.query)('SELECT * FROM accounts WHERE id = $1 AND user_id = $2', [id, userId]);
            if (accountCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Account not found' });
            }
            // Simulate OAuth token refresh (in production, this would call bank API)
            const newExpiresAt = new Date();
            newExpiresAt.setDate(newExpiresAt.getDate() + 30);
            await (0, db_js_1.query)(`UPDATE accounts SET 
           oauth_token_expires_at = $1,
           status = 'active'
         WHERE id = $2 AND user_id = $3`, [newExpiresAt, id, userId]);
            // Record in sync history
            await (0, db_js_1.query)(`INSERT INTO account_sync_history (account_id, sync_status, transactions_found, started_at, completed_at)
         VALUES ($1, 'oauth_refreshed', 0, NOW(), NOW())`, [id]);
            res.json({
                message: 'OAuth token refreshed',
                expiresAt: newExpiresAt,
                status: 'active',
            });
        }
        catch (error) {
            console.error('Refresh OAuth error:', error);
            res.status(500).json({ error: 'Failed to refresh OAuth token' });
        }
    }
    async getSummary(req, res) {
        try {
            const userId = req.user?.id;
            const result = await (0, db_js_1.query)(`SELECT 
           SUM(balance) as total_balance,
           COUNT(*) as total_accounts,
           type,
           SUM(balance) as type_balance
         FROM accounts 
         WHERE user_id = $1 AND status = 'active'
         GROUP BY type`, [userId]);
            const accountsByType = {};
            let totalBalance = 0;
            let totalAccounts = 0;
            result.rows.forEach(row => {
                accountsByType[row.type] = parseFloat(row.type_balance);
                totalBalance += parseFloat(row.type_balance);
                totalAccounts += parseInt(row.count || '0');
            });
            res.json({
                totalBalance,
                totalAccounts,
                accountsByType,
            });
        }
        catch (error) {
            console.error('Get summary error:', error);
            res.status(500).json({ error: 'Failed to get summary' });
        }
    }
    async getSupportedBanks(req, res) {
        res.json(SUPPORTED_BANKS);
    }
}
exports.AccountController = AccountController;
//# sourceMappingURL=account.controller.js.map