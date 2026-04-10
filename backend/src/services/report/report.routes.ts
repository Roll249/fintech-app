import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../../shared/db/index.js';
import { AuthRequest } from '../../shared/middleware/auth.middleware.js';

const router = Router();

// GET /api/v1/reports/summary - Get financial summary
router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const period = req.query.period as string || 'month';

    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "AND t.transaction_date >= NOW() - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND t.transaction_date >= NOW() - INTERVAL '30 days'";
        break;
      case 'year':
        dateFilter = "AND t.transaction_date >= NOW() - INTERVAL '365 days'";
        break;
      default:
        dateFilter = "AND t.transaction_date >= DATE_TRUNC('month', CURRENT_DATE)";
    }

    // Overall summary
    const summary = await queryOne<any>(
      `SELECT
         COALESCE(SUM(CASE WHEN t.type = 'income' THEN CAST(t.amount AS numeric) ELSE 0 END), 0) as total_income,
         COALESCE(SUM(CASE WHEN t.type = 'expense' THEN CAST(t.amount AS numeric) ELSE 0 END), 0) as total_expense,
         COALESCE(SUM(CASE WHEN t.type = 'transfer' THEN CAST(t.amount AS numeric) ELSE 0 END), 0) as total_transfer,
         COUNT(*) as total_transactions
       FROM transactions t
       WHERE t.user_id = $1 ${dateFilter}`,
      [userId]
    );

    // Category breakdown for expenses
    const categoryBreakdown = await query<any>(
      `SELECT
         c.id,
         c.name,
         c.icon,
         c.color,
         COALESCE(SUM(CAST(t.amount AS numeric)), 0) as total,
         COUNT(t.id) as count
       FROM categories c
       LEFT JOIN transactions t ON t.category_id = c.id
         AND t.type = 'expense'
         AND t.user_id = $1
         ${dateFilter}
       WHERE c.is_system = true
       GROUP BY c.id, c.name, c.icon, c.color
       HAVING COALESCE(SUM(CAST(t.amount AS numeric)), 0) > 0
       ORDER BY total DESC`,
      [userId]
    );

    // Top funds
    const fundsSummary = await query<any>(
      `SELECT
         f.id,
         f.name,
         f.color,
         COALESCE(SUM(CASE WHEN fc.type = 'deposit' THEN CAST(fc.amount AS numeric) ELSE 0 END), 0) -
         COALESCE(SUM(CASE WHEN fc.type = 'withdraw' THEN CAST(fc.amount AS numeric) ELSE 0 END), 0) as current_amount,
         COUNT(fc.id) as contribution_count
       FROM funds f
       LEFT JOIN fund_contributions fc ON fc.fund_id = f.id
       WHERE f.user_id = $1 AND f.is_active = true
       GROUP BY f.id, f.name, f.color
       ORDER BY current_amount DESC`,
      [userId]
    );

    // Daily spending trend (last 7 days)
    const dailyTrend = await query<any>(
      `SELECT
         DATE(t.transaction_date) as date,
         COALESCE(SUM(CASE WHEN t.type = 'income' THEN CAST(t.amount AS numeric) ELSE 0 END), 0) as income,
         COALESCE(SUM(CASE WHEN t.type = 'expense' THEN CAST(t.amount AS numeric) ELSE 0 END), 0) as expense
       FROM transactions t
       WHERE t.user_id = $1
         AND t.transaction_date >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(t.transaction_date)
       ORDER BY date`,
      [userId]
    );

    // Monthly comparison (current month vs last month)
    const monthlyComparison = await queryOne<any>(
      `SELECT
         COALESCE(SUM(CASE WHEN t.type = 'income' AND t.transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
           THEN CAST(t.amount AS numeric) ELSE 0 END), 0) as current_month_income,
         COALESCE(SUM(CASE WHEN t.type = 'expense' AND t.transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
           THEN CAST(t.amount AS numeric) ELSE 0 END), 0) as current_month_expense,
         COALESCE(SUM(CASE WHEN t.type = 'income' AND t.transaction_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
           AND t.transaction_date < DATE_TRUNC('month', CURRENT_DATE)
           THEN CAST(t.amount AS numeric) ELSE 0 END), 0) as last_month_income,
         COALESCE(SUM(CASE WHEN t.type = 'expense' AND t.transaction_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
           AND t.transaction_date < DATE_TRUNC('month', CURRENT_DATE)
           THEN CAST(t.amount AS numeric) ELSE 0 END), 0) as last_month_expense
       FROM transactions t
       WHERE t.user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        summary: {
          totalIncome: parseInt(summary.total_income) || 0,
          totalExpense: parseInt(summary.total_expense) || 0,
          totalTransfer: parseInt(summary.total_transfer) || 0,
          netBalance: (parseInt(summary.total_income) || 0) - (parseInt(summary.total_expense) || 0),
          totalTransactions: parseInt(summary.total_transactions) || 0,
        },
        categoryBreakdown: categoryBreakdown.map((c: any) => ({
          ...c,
          total: parseInt(c.total) || 0,
          percentage: (parseInt(summary.total_expense) || 0) > 0
            ? Math.round((parseInt(c.total) || 0) / parseInt(summary.total_expense) * 100)
            : 0
        })),
        fundsSummary: fundsSummary.map((f: any) => ({
          ...f,
          current_amount: parseInt(f.current_amount) || 0
        })),
        dailyTrend: dailyTrend.map((d: any) => ({
          date: d.date,
          income: parseInt(d.income) || 0,
          expense: parseInt(d.expense) || 0
        })),
        monthlyComparison: {
          currentMonth: {
            income: parseInt(monthlyComparison.current_month_income) || 0,
            expense: parseInt(monthlyComparison.current_month_expense) || 0
          },
          lastMonth: {
            income: parseInt(monthlyComparison.last_month_income) || 0,
            expense: parseInt(monthlyComparison.last_month_expense) || 0
          },
          incomeChange: calculatePercentageChange(
            parseInt(monthlyComparison.last_month_income) || 0,
            parseInt(monthlyComparison.current_month_income) || 0
          ),
          expenseChange: calculatePercentageChange(
            parseInt(monthlyComparison.last_month_expense) || 0,
            parseInt(monthlyComparison.current_month_expense) || 0
          )
        }
      },
    });
  } catch (error: any) {
    console.error('Get report summary error:', error);
    res.status(500).json({
      error: 'Không thể lấy báo cáo tổng hợp',
    });
  }
});

// GET /api/v1/reports/category-breakdown - Get spending by category
router.get('/category-breakdown', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const period = req.query.period as string || 'month';
    const limit = parseInt(req.query.limit as string) || 10;

    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "AND t.transaction_date >= NOW() - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND t.transaction_date >= NOW() - INTERVAL '30 days'";
        break;
      case 'year':
        dateFilter = "AND t.transaction_date >= NOW() - INTERVAL '365 days'";
        break;
    }

    const breakdown = await query<any>(
      `SELECT
         c.id,
         c.name,
         c.icon,
         c.color,
         c.type,
         COALESCE(SUM(CAST(t.amount AS numeric)), 0) as total,
         COUNT(t.id) as transaction_count,
         AVG(CAST(t.amount AS numeric)) as average
       FROM categories c
       LEFT JOIN transactions t ON t.category_id = c.id
         AND t.user_id = $1
         ${dateFilter}
       WHERE c.is_system = true
       GROUP BY c.id, c.name, c.icon, c.color, c.type
       HAVING COALESCE(SUM(CAST(t.amount AS numeric)), 0) > 0
       ORDER BY total DESC
       LIMIT $2`,
      [userId, limit]
    );

    const total = breakdown.reduce((sum: number, c: any) => sum + parseInt(c.total), 0);

    res.json({
      success: true,
      data: breakdown.map((c: any) => ({
        ...c,
        total: parseInt(c.total) || 0,
        average: Math.round(parseInt(c.average) || 0),
        percentage: total > 0 ? Math.round((parseInt(c.total) || 0) / total * 100) : 0
      })),
    });
  } catch (error: any) {
    console.error('Get category breakdown error:', error);
    res.status(500).json({
      error: 'Không thể lấy phân tích theo danh mục',
    });
  }
});

// GET /api/v1/reports/monthly - Get monthly report
router.get('/monthly', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const months = parseInt(req.query.months as string) || 6;

    const monthlyData = await query<any>(
      `SELECT
         TO_CHAR(t.transaction_date, 'YYYY-MM') as month,
         COALESCE(SUM(CASE WHEN t.type = 'income' THEN CAST(t.amount AS numeric) ELSE 0 END), 0) as income,
         COALESCE(SUM(CASE WHEN t.type = 'expense' THEN CAST(t.amount AS numeric) ELSE 0 END), 0) as expense
       FROM transactions t
       WHERE t.user_id = $1
         AND t.transaction_date >= NOW() - INTERVAL '${months} months'
       GROUP BY TO_CHAR(t.transaction_date, 'YYYY-MM')
       ORDER BY month`,
      [userId]
    );

    // Top spending categories per month
    const categoryByMonth = await query<any>(
      `SELECT
         TO_CHAR(t.transaction_date, 'YYYY-MM') as month,
         c.name,
         c.color,
         COALESCE(SUM(CAST(t.amount AS numeric)), 0) as total
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1
         AND t.type = 'expense'
         AND t.transaction_date >= NOW() - INTERVAL '${months} months'
       GROUP BY TO_CHAR(t.transaction_date, 'YYYY-MM'), c.name, c.color
       ORDER BY month, total DESC`,
      [userId]
    );

    // Group categories by month
    const groupedCategories: Record<string, any[]> = {};
    for (const row of categoryByMonth) {
      if (!groupedCategories[row.month]) {
        groupedCategories[row.month] = [];
      }
      groupedCategories[row.month].push({
        name: row.name,
        color: row.color,
        total: parseInt(row.total)
      });
    }

    res.json({
      success: true,
      data: {
        monthly: monthlyData.map((m: any) => ({
          month: m.month,
          income: parseInt(m.income) || 0,
          expense: parseInt(m.expense) || 0,
          net: (parseInt(m.income) || 0) - (parseInt(m.expense) || 0)
        })),
        topCategoriesByMonth: groupedCategories
      },
    });
  } catch (error: any) {
    console.error('Get monthly report error:', error);
    res.status(500).json({
      error: 'Không thể lấy báo cáo hàng tháng',
    });
  }
});

// GET /api/v1/reports/trends - Get spending trends
router.get('/trends', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Daily spending for last 30 days
    const dailySpending = await query<any>(
      `SELECT
         DATE(t.transaction_date) as date,
         COALESCE(SUM(CAST(t.amount AS numeric)), 0) as total,
         COUNT(t.id) as count
       FROM transactions t
       WHERE t.user_id = $1
         AND t.type = 'expense'
         AND t.transaction_date >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(t.transaction_date)
       ORDER BY date`,
      [userId]
    );

    // Average spending by day of week
    const weeklyPattern = await query<any>(
      `SELECT
         EXTRACT(DOW FROM t.transaction_date) as day_of_week,
         AVG(CAST(t.amount AS numeric)) as average,
         COUNT(*) as count
       FROM transactions t
       WHERE t.user_id = $1
         AND t.type = 'expense'
         AND t.transaction_date >= NOW() - INTERVAL '90 days'
       GROUP BY EXTRACT(DOW FROM t.transaction_date)
       ORDER BY day_of_week`,
      [userId]
    );

    // Spending by time of day
    const timeOfDay = await query<any>(
      `SELECT
         CASE
           WHEN EXTRACT(HOUR FROM t.transaction_date) < 6 THEN '深夜 (0-6h)'
           WHEN EXTRACT(HOUR FROM t.transaction_date) < 12 THEN '上午 (6-12h)'
           WHEN EXTRACT(HOUR FROM t.transaction_date) < 18 THEN '下午 (12-18h)'
           ELSE '晚上 (18-24h)'
         END as time_period,
         COALESCE(SUM(CAST(t.amount AS numeric)), 0) as total
       FROM transactions t
       WHERE t.user_id = $1
         AND t.type = 'expense'
         AND t.transaction_date >= NOW() - INTERVAL '30 days'
       GROUP BY time_period
       ORDER BY total DESC`,
      [userId]
    );

    // Top merchants/places
    const topPlaces = await query<any>(
      `SELECT
         t.merchant_name,
         COALESCE(SUM(CAST(t.amount AS numeric)), 0) as total,
         COUNT(t.id) as count
       FROM transactions t
       WHERE t.user_id = $1
         AND t.type = 'expense'
         AND t.merchant_name IS NOT NULL
         AND t.transaction_date >= NOW() - INTERVAL '30 days'
       GROUP BY t.merchant_name
       ORDER BY total DESC
       LIMIT 10`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        dailySpending: dailySpending.map((d: any) => ({
          date: d.date,
          total: parseInt(d.total),
          count: parseInt(d.count)
        })),
        weeklyPattern: weeklyPattern.map((w: any) => ({
          dayOfWeek: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][parseInt(w.day_of_week)],
          average: Math.round(parseInt(w.average)),
          count: parseInt(w.count)
        })),
        timeOfDay: timeOfDay.map((t: any) => ({
          period: t.time_period,
          total: parseInt(t.total)
        })),
        topPlaces: topPlaces.map((p: any) => ({
          name: p.merchant_name,
          total: parseInt(p.total),
          count: parseInt(p.count)
        }))
      },
    });
  } catch (error: any) {
    console.error('Get trends error:', error);
    res.status(500).json({
      error: 'Không thể lấy xu hướng chi tiêu',
    });
  }
});

function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return Math.round(((newValue - oldValue) / oldValue) * 100);
}

export { router as reportRouter };