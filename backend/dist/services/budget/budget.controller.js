"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetController = void 0;
const db_js_1 = require("../../shared/db.js");
class BudgetController {
    async getBudgets(req, res) {
        try {
            const userId = req.user?.id;
            const { period } = req.query;
            let queryStr = `
        SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color
        FROM budgets b
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE b.user_id = $1
      `;
            const params = [userId];
            if (period) {
                queryStr += ' AND b.period = $2';
                params.push(period);
            }
            queryStr += ' ORDER BY b.created_at DESC';
            const result = await (0, db_js_1.query)(queryStr, params);
            res.json(result.rows.map(row => {
                const spent = parseFloat(row.spent);
                const limit = parseFloat(row.amount_limit);
                return {
                    id: row.id,
                    userId: row.user_id,
                    categoryId: row.category_id,
                    category: {
                        id: row.category_id,
                        name: row.category_name,
                        icon: row.category_icon,
                        color: row.category_color,
                        type: 'expense',
                    },
                    limit,
                    spent,
                    remaining: limit - spent,
                    period: row.period,
                    startDate: row.start_date,
                    endDate: row.end_date,
                    alertThreshold: row.alert_threshold,
                    isExceeded: spent > limit,
                    createdAt: row.created_at,
                };
            }));
        }
        catch (error) {
            console.error('Get budgets error:', error);
            res.status(500).json({ error: 'Failed to get budgets' });
        }
    }
    async getBudget(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            const result = await (0, db_js_1.query)(`SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color
         FROM budgets b
         LEFT JOIN categories c ON b.category_id = c.id
         WHERE b.id = $1 AND b.user_id = $2`, [id, userId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Budget not found' });
            }
            const row = result.rows[0];
            const spent = parseFloat(row.spent);
            const limit = parseFloat(row.amount_limit);
            res.json({
                id: row.id,
                categoryId: row.category_id,
                category: {
                    id: row.category_id,
                    name: row.category_name,
                    icon: row.category_icon,
                    color: row.category_color,
                },
                limit,
                spent,
                remaining: limit - spent,
                period: row.period,
                startDate: row.start_date,
                endDate: row.end_date,
                alertThreshold: row.alert_threshold,
                isExceeded: spent > limit,
            });
        }
        catch (error) {
            console.error('Get budget error:', error);
            res.status(500).json({ error: 'Failed to get budget' });
        }
    }
    async createBudget(req, res) {
        try {
            const userId = req.user?.id;
            const { categoryId, limit, period = 'monthly', alertThreshold = 80 } = req.body;
            // Calculate period dates
            const now = new Date();
            let startDate, endDate;
            switch (period) {
                case 'weekly':
                    startDate = new Date(now.setDate(now.getDate() - now.getDay()));
                    endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + 6);
                    break;
                case 'yearly':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear(), 11, 31);
                    break;
                case 'monthly':
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            }
            // Auto-calculate spent from existing transactions in date range
            const spentResult = await (0, db_js_1.query)(`SELECT COALESCE(SUM(amount), 0) as total_spent
         FROM transactions
         WHERE user_id = $1 AND category_id = $2 AND type = 'expense'
           AND date >= $3 AND date <= $4`, [userId, categoryId, startDate, endDate]);
            const initialSpent = parseFloat(spentResult.rows[0].total_spent) || 0;
            const result = await (0, db_js_1.query)(`INSERT INTO budgets (user_id, category_id, amount_limit, spent, period, start_date, end_date, alert_threshold)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`, [userId, categoryId, limit, initialSpent, period, startDate, endDate, alertThreshold]);
            res.status(201).json({
                id: result.rows[0].id,
                message: 'Budget created',
                spent: initialSpent,
                remaining: limit - initialSpent,
            });
        }
        catch (error) {
            console.error('Create budget error:', error);
            res.status(500).json({ error: 'Failed to create budget' });
        }
    }
    async updateBudget(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            const { limit, alertThreshold } = req.body;
            const result = await (0, db_js_1.query)(`UPDATE budgets SET
           amount_limit = COALESCE($1, amount_limit),
           alert_threshold = COALESCE($2, alert_threshold)
         WHERE id = $3 AND user_id = $4
         RETURNING id`, [limit, alertThreshold, id, userId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Budget not found' });
            }
            res.json({ message: 'Budget updated' });
        }
        catch (error) {
            console.error('Update budget error:', error);
            res.status(500).json({ error: 'Failed to update budget' });
        }
    }
    async deleteBudget(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            await (0, db_js_1.query)('DELETE FROM budgets WHERE id = $1 AND user_id = $2', [id, userId]);
            res.json({ message: 'Budget deleted' });
        }
        catch (error) {
            console.error('Delete budget error:', error);
            res.status(500).json({ error: 'Failed to delete budget' });
        }
    }
    async getSummary(req, res) {
        try {
            const userId = req.user?.id;
            const result = await (0, db_js_1.query)(`SELECT 
           SUM(amount_limit) as total_budget,
           SUM(spent) as total_spent,
           COUNT(*) as budget_count,
           SUM(CASE WHEN spent > amount_limit THEN 1 ELSE 0 END) as exceeded_count
         FROM budgets
         WHERE user_id = $1`, [userId]);
            const row = result.rows[0];
            const totalBudget = parseFloat(row.total_budget) || 0;
            const totalSpent = parseFloat(row.total_spent) || 0;
            const adherence = totalBudget > 0 ? Math.max(0, 100 - (totalSpent / totalBudget * 100)) : 100;
            res.json({
                totalBudget,
                totalSpent,
                totalRemaining: totalBudget - totalSpent,
                budgetCount: parseInt(row.budget_count) || 0,
                exceededCount: parseInt(row.exceeded_count) || 0,
                healthScore: Math.round(adherence),
            });
        }
        catch (error) {
            console.error('Get summary error:', error);
            res.status(500).json({ error: 'Failed to get summary' });
        }
    }
    async getAlerts(req, res) {
        try {
            const userId = req.user?.id;
            const result = await (0, db_js_1.query)(`SELECT b.*, c.name as category_name
         FROM budgets b
         LEFT JOIN categories c ON b.category_id = c.id
         WHERE b.user_id = $1 AND (b.spent >= b.amount_limit * b.alert_threshold / 100)
         ORDER BY (b.spent / b.amount_limit) DESC`, [userId]);
            res.json(result.rows.map(row => {
                const spent = parseFloat(row.spent);
                const limit = parseFloat(row.amount_limit);
                const percentage = Math.round(spent / limit * 100);
                return {
                    budgetId: row.id,
                    categoryName: row.category_name,
                    alertType: spent > limit ? 'exceeded' : 'warning',
                    percentage,
                    message: spent > limit
                        ? `You have exceeded your ${row.category_name} budget by ${percentage - 100}%`
                        : `You have used ${percentage}% of your ${row.category_name} budget`,
                    createdAt: new Date().toISOString(),
                };
            }));
        }
        catch (error) {
            console.error('Get alerts error:', error);
            res.status(500).json({ error: 'Failed to get alerts' });
        }
    }
    async getSuggestions(req, res) {
        try {
            const userId = req.user?.id;
            // Get spending from past 3 months grouped by category
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            const spendingResult = await (0, db_js_1.query)(`SELECT 
           t.category_id,
           c.name as category_name,
           c.icon as category_icon,
           c.color as category_color,
           COUNT(*) as transaction_count,
           SUM(t.amount) as total_spent,
           AVG(t.amount) as avg_transaction,
           MIN(t.amount) as min_transaction,
           MAX(t.amount) as max_transaction
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1 
           AND t.type = 'expense'
           AND t.date >= $2
         GROUP BY t.category_id, c.name, c.icon, c.color
         ORDER BY total_spent DESC`, [userId, threeMonthsAgo]);
            // Get existing budgets to exclude from suggestions
            const existingBudgets = await (0, db_js_1.query)('SELECT category_id FROM budgets WHERE user_id = $1', [userId]);
            const existingCategoryIds = existingBudgets.rows.map(r => r.category_id);
            const suggestions = spendingResult.rows
                .filter(row => row.category_id && !existingCategoryIds.includes(row.category_id))
                .map(row => {
                const totalSpent = parseFloat(row.total_spent);
                const monthlyAvg = totalSpent / 3;
                // Suggest a budget 10% higher than monthly average for breathing room
                const suggestedLimit = Math.ceil(monthlyAvg * 1.1 / 10000) * 10000;
                return {
                    categoryId: row.category_id,
                    category: {
                        id: row.category_id,
                        name: row.category_name,
                        icon: row.category_icon,
                        color: row.category_color,
                    },
                    monthlyAverage: Math.round(monthlyAvg),
                    suggestedLimit,
                    transactionCount: parseInt(row.transaction_count),
                    totalSpentLast3Months: totalSpent,
                    reasoning: `Based on your spending of ${totalSpent.toLocaleString()} VND over the last 3 months ` +
                        `(average ${Math.round(monthlyAvg).toLocaleString()} VND/month), ` +
                        `we suggest a monthly budget of ${suggestedLimit.toLocaleString()} VND.`,
                };
            });
            res.json({
                suggestions,
                analysisperiod: {
                    start: threeMonthsAgo.toISOString(),
                    end: new Date().toISOString(),
                    months: 3,
                },
            });
        }
        catch (error) {
            console.error('Get suggestions error:', error);
            res.status(500).json({ error: 'Failed to get budget suggestions' });
        }
    }
    async resetBudget(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            const result = await (0, db_js_1.query)(`UPDATE budgets SET spent = 0
         WHERE id = $1 AND user_id = $2
         RETURNING id, amount_limit`, [id, userId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Budget not found' });
            }
            res.json({
                message: 'Budget reset successfully',
                id: result.rows[0].id,
                spent: 0,
                remaining: parseFloat(result.rows[0].amount_limit),
            });
        }
        catch (error) {
            console.error('Reset budget error:', error);
            res.status(500).json({ error: 'Failed to reset budget' });
        }
    }
}
exports.BudgetController = BudgetController;
//# sourceMappingURL=budget.controller.js.map