import { Response } from 'express';
import { query } from '../../shared/db.js';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';

export class TransactionController {
  async getTransactions(req: AuthenticatedRequest, res: Response) {
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
      const params: any[] = [userId];
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

      const result = await query(queryStr, params);

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
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: 'Failed to get transactions' });
    }
  }

  async getTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const result = await query(
        `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.id = $1 AND t.user_id = $2`,
        [id, userId]
      );

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
    } catch (error) {
      console.error('Get transaction error:', error);
      res.status(500).json({ error: 'Failed to get transaction' });
    }
  }

  async createTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { accountId, amount, type, categoryId, description, merchantName, date, tags } = req.body;

      const result = await query(
        `INSERT INTO transactions (user_id, account_id, amount, type, category_id, description, merchant_name, date, tags, is_manual)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
         RETURNING id`,
        [userId, accountId, amount, type, categoryId, description, merchantName, date, tags || []]
      );

      // Update account balance
      const balanceChange = type === 'income' ? amount : -amount;
      await query(
        'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
        [balanceChange, accountId]
      );

      // Get category name for notification
      let categoryName = 'Khác';
      if (categoryId) {
        const categoryResult = await query('SELECT name FROM categories WHERE id = $1', [categoryId]);
        if (categoryResult.rows.length > 0) {
          categoryName = categoryResult.rows[0].name;
        }
      }

      // Create in-app notification
      const notifTitle = type === 'income' ? 'Thu nhập mới' : 'Chi tiêu mới';
      const notifBody = type === 'income'
        ? `+${Number(amount).toLocaleString('vi-VN')} VND - ${description || categoryName}`
        : `-${Number(amount).toLocaleString('vi-VN')} VND - ${description || categoryName}`;

      await query(
        `INSERT INTO notifications (user_id, type, title, body, data)
         VALUES ($1, 'transaction', $2, $3, $4)`,
        [
          userId,
          notifTitle,
          notifBody,
          JSON.stringify({ transactionId: result.rows[0].id, type, amount })
        ]
      );

      // Check budget alerts
      if (type === 'expense' && categoryId) {
        const budgetResult = await query(
          `SELECT id, amount_limit, alert_threshold FROM budgets 
           WHERE user_id = $1 AND category_id = $2 AND is_active = true`,
          [userId, categoryId]
        );

        if (budgetResult.rows.length > 0) {
          const budget = budgetResult.rows[0];
          
          // Calculate current spent
          const spentResult = await query(
            `SELECT COALESCE(SUM(amount), 0) as spent FROM transactions 
             WHERE user_id = $1 AND category_id = $2 AND type = 'expense'
             AND date >= date_trunc('month', CURRENT_DATE)`,
            [userId, categoryId]
          );
          
          const spent = parseFloat(spentResult.rows[0].spent);
          const percentage = (spent / budget.amount_limit) * 100;

          // Send budget alert if threshold exceeded
          if (percentage >= budget.alert_threshold) {
            const alertTitle = percentage >= 100 ? 'Vượt ngân sách!' : 'Cảnh báo ngân sách';
            const alertBody = `Bạn đã chi ${percentage.toFixed(0)}% ngân sách ${categoryName}`;

            await query(
              `INSERT INTO notifications (user_id, type, title, body, data)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                userId,
                percentage >= 100 ? 'budget_exceeded' : 'budget_warning',
                alertTitle,
                alertBody,
                JSON.stringify({ budgetId: budget.id, percentage, spent, limit: budget.amount_limit })
              ]
            );
          }
        }
      }

      res.status(201).json({ id: result.rows[0].id, message: 'Transaction created' });
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  }

  async updateTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { amount, type, categoryId, description, merchantName, date, tags } = req.body;

      const result = await query(
        `UPDATE transactions SET
           amount = COALESCE($1, amount),
           type = COALESCE($2, type),
           category_id = COALESCE($3, category_id),
           description = COALESCE($4, description),
           merchant_name = COALESCE($5, merchant_name),
           date = COALESCE($6, date),
           tags = COALESCE($7, tags)
         WHERE id = $8 AND user_id = $9
         RETURNING id`,
        [amount, type, categoryId, description, merchantName, date, tags, id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json({ message: 'Transaction updated' });
    } catch (error) {
      console.error('Update transaction error:', error);
      res.status(500).json({ error: 'Failed to update transaction' });
    }
  }

  async deleteTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      await query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
      res.json({ message: 'Transaction deleted' });
    } catch (error) {
      console.error('Delete transaction error:', error);
      res.status(500).json({ error: 'Failed to delete transaction' });
    }
  }

  async getSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { startDate, endDate } = req.query;

      const result = await query(
        `SELECT 
           type,
           SUM(amount) as total,
           COUNT(*) as count
         FROM transactions
         WHERE user_id = $1 AND date >= $2 AND date <= $3
         GROUP BY type`,
        [userId, startDate, endDate]
      );

      let totalIncome = 0, totalExpense = 0, transactionCount = 0;
      result.rows.forEach(row => {
        if (row.type === 'income') totalIncome = parseFloat(row.total);
        if (row.type === 'expense') totalExpense = parseFloat(row.total);
        transactionCount += parseInt(row.count);
      });

      res.json({
        totalIncome,
        totalExpense,
        netAmount: totalIncome - totalExpense,
        transactionCount,
      });
    } catch (error) {
      console.error('Get summary error:', error);
      res.status(500).json({ error: 'Failed to get summary' });
    }
  }

  async getRecent(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const limit = Number(req.query.limit) || 10;

      const result = await query(
        `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1
         ORDER BY t.date DESC, t.created_at DESC
         LIMIT $2`,
        [userId, limit]
      );

      res.json(result.rows.map(row => ({
        id: row.id,
        amount: parseFloat(row.amount),
        type: row.type,
        category: { id: row.category_id, name: row.category_name, icon: row.category_icon, color: row.category_color },
        description: row.description,
        merchantName: row.merchant_name,
        date: row.date,
      })));
    } catch (error) {
      console.error('Get recent error:', error);
      res.status(500).json({ error: 'Failed to get recent transactions' });
    }
  }

  async getCategories(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      const result = await query(
        `SELECT * FROM categories WHERE is_system = true OR user_id = $1 ORDER BY name`,
        [userId]
      );

      res.json(result.rows.map(row => ({
        id: row.id,
        name: row.name,
        icon: row.icon,
        color: row.color,
        type: row.type,
      })));
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: 'Failed to get categories' });
    }
  }
}
