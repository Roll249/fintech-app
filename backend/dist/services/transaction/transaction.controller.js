"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const db_js_1 = require("../../shared/db.js");
class TransactionController {
    async getTransactions(req, res) {
        try {
            const userId = req.user?.id;
            const { page = 1, pageSize = 20, accountId, categoryId, type, startDate, endDate, search } = req.query;
            const offset = (Number(page) - 1) * Number(pageSize);
            let queryStr = `
        SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1
      `;
            const params = [userId];
            let paramIndex = 2;
            if (accountId) {
                queryStr += ` AND t.account_id = $${paramIndex++}`;
                params.push(accountId);
            }
            if (categoryId) {
                queryStr += ` AND t.category_id = $${paramIndex++}`;
                params.push(categoryId);
            }
            if (type) {
                queryStr += ` AND t.type = $${paramIndex++}`;
                params.push(type);
            }
            if (startDate) {
                queryStr += ` AND t.date >= $${paramIndex++}`;
                params.push(startDate);
            }
            if (endDate) {
                queryStr += ` AND t.date <= $${paramIndex++}`;
                params.push(endDate);
            }
            if (search) {
                queryStr += ` AND (t.description ILIKE $${paramIndex} OR t.merchant_name ILIKE $${paramIndex++})`;
                params.push(`%${search}%`);
            }
            queryStr += ` ORDER BY t.date DESC, t.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
            params.push(Number(pageSize), offset);
            const result = await (0, db_js_1.query)(queryStr, params);
            res.json({
                items: result.rows.map(row => ({
                    id: row.id,
                    accountId: row.account_id,
                    amount: parseFloat(row.amount),
                    type: row.type,
                    category: {
                        id: row.category_id,
                        name: row.category_name,
                        icon: row.category_icon,
                        color: row.category_color,
                    },
                    description: row.description,
                    merchantName: row.merchant_name,
                    date: row.date,
                    isManual: row.is_manual,
                    tags: row.tags || [],
                    createdAt: row.created_at,
                })),
                page: Number(page),
                pageSize: Number(pageSize),
            });
        }
        catch (error) {
            console.error('Get transactions error:', error);
            res.status(500).json({ error: 'Failed to get transactions' });
        }
    }
    async getTransaction(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            const result = await (0, db_js_1.query)(`SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.id = $1 AND t.user_id = $2`, [id, userId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Transaction not found' });
            }
            const row = result.rows[0];
            res.json({
                id: row.id,
                accountId: row.account_id,
                amount: parseFloat(row.amount),
                type: row.type,
                category: {
                    id: row.category_id,
                    name: row.category_name,
                    icon: row.category_icon,
                    color: row.category_color,
                },
                description: row.description,
                merchantName: row.merchant_name,
                date: row.date,
                isManual: row.is_manual,
                tags: row.tags || [],
                createdAt: row.created_at,
            });
        }
        catch (error) {
            console.error('Get transaction error:', error);
            res.status(500).json({ error: 'Failed to get transaction' });
        }
    }
    async createTransaction(req, res) {
        try {
            const userId = req.user?.id;
            const { accountId, amount, type, categoryId, description, merchantName, date, tags } = req.body;
            const result = await (0, db_js_1.query)(`INSERT INTO transactions (user_id, account_id, amount, type, category_id, description, merchant_name, date, tags, is_manual)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
         RETURNING id`, [userId, accountId, amount, type, categoryId, description, merchantName, date, tags || []]);
            // Update account balance
            const balanceChange = type === 'income' ? amount : -amount;
            await (0, db_js_1.query)('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [balanceChange, accountId]);
            // TODO: Publish Kafka event for budget tracking
            // kafkaProducer.send({ topic: 'transaction.created', ... })
            res.status(201).json({ id: result.rows[0].id, message: 'Transaction created' });
        }
        catch (error) {
            console.error('Create transaction error:', error);
            res.status(500).json({ error: 'Failed to create transaction' });
        }
    }
    async updateTransaction(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            const { amount, type, categoryId, description, merchantName, date, tags } = req.body;
            const result = await (0, db_js_1.query)(`UPDATE transactions SET
           amount = COALESCE($1, amount),
           type = COALESCE($2, type),
           category_id = COALESCE($3, category_id),
           description = COALESCE($4, description),
           merchant_name = COALESCE($5, merchant_name),
           date = COALESCE($6, date),
           tags = COALESCE($7, tags)
         WHERE id = $8 AND user_id = $9
         RETURNING id`, [amount, type, categoryId, description, merchantName, date, tags, id, userId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Transaction not found' });
            }
            res.json({ message: 'Transaction updated' });
        }
        catch (error) {
            console.error('Update transaction error:', error);
            res.status(500).json({ error: 'Failed to update transaction' });
        }
    }
    async deleteTransaction(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            await (0, db_js_1.query)('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
            res.json({ message: 'Transaction deleted' });
        }
        catch (error) {
            console.error('Delete transaction error:', error);
            res.status(500).json({ error: 'Failed to delete transaction' });
        }
    }
    async getSummary(req, res) {
        try {
            const userId = req.user?.id;
            const { startDate, endDate } = req.query;
            const result = await (0, db_js_1.query)(`SELECT 
           type,
           SUM(amount) as total,
           COUNT(*) as count
         FROM transactions
         WHERE user_id = $1 AND date >= $2 AND date <= $3
         GROUP BY type`, [userId, startDate, endDate]);
            let totalIncome = 0, totalExpense = 0, transactionCount = 0;
            result.rows.forEach(row => {
                if (row.type === 'income')
                    totalIncome = parseFloat(row.total);
                if (row.type === 'expense')
                    totalExpense = parseFloat(row.total);
                transactionCount += parseInt(row.count);
            });
            res.json({
                totalIncome,
                totalExpense,
                netAmount: totalIncome - totalExpense,
                transactionCount,
            });
        }
        catch (error) {
            console.error('Get summary error:', error);
            res.status(500).json({ error: 'Failed to get summary' });
        }
    }
    async getRecent(req, res) {
        try {
            const userId = req.user?.id;
            const limit = Number(req.query.limit) || 10;
            const result = await (0, db_js_1.query)(`SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1
         ORDER BY t.date DESC, t.created_at DESC
         LIMIT $2`, [userId, limit]);
            res.json(result.rows.map(row => ({
                id: row.id,
                amount: parseFloat(row.amount),
                type: row.type,
                category: { id: row.category_id, name: row.category_name, icon: row.category_icon, color: row.category_color },
                description: row.description,
                merchantName: row.merchant_name,
                date: row.date,
            })));
        }
        catch (error) {
            console.error('Get recent error:', error);
            res.status(500).json({ error: 'Failed to get recent transactions' });
        }
    }
    async getCategories(req, res) {
        try {
            const userId = req.user?.id;
            const result = await (0, db_js_1.query)(`SELECT * FROM categories WHERE is_system = true OR user_id = $1 ORDER BY name`, [userId]);
            res.json(result.rows.map(row => ({
                id: row.id,
                name: row.name,
                icon: row.icon,
                color: row.color,
                type: row.type,
            })));
        }
        catch (error) {
            console.error('Get categories error:', error);
            res.status(500).json({ error: 'Failed to get categories' });
        }
    }
}
exports.TransactionController = TransactionController;
//# sourceMappingURL=transaction.controller.js.map