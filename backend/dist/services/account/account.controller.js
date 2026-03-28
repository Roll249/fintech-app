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
            // Simulate balance change
            const balanceChange = Math.floor(Math.random() * 1000000) - 500000;
            const result = await (0, db_js_1.query)(`UPDATE accounts SET 
           balance = balance + $1, 
           last_synced_at = NOW() 
         WHERE id = $2 AND user_id = $3
         RETURNING *`, [balanceChange, id, userId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Account not found' });
            }
            res.json({
                message: 'Account synced',
                balance: parseFloat(result.rows[0].balance),
                lastSyncedAt: result.rows[0].last_synced_at,
            });
        }
        catch (error) {
            console.error('Sync account error:', error);
            res.status(500).json({ error: 'Failed to sync account' });
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