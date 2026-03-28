import { Response } from 'express';
import { query } from '../../shared/db.js';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
import PDFDocument from 'pdfkit';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../../config/index.js';

export class ReportController {
  async getReports(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { page = 1, pageSize = 20, type } = req.query;
      const offset = (Number(page) - 1) * Number(pageSize);

      let queryStr = 'SELECT * FROM reports WHERE user_id = $1';
      const params: any[] = [userId];

      if (type) {
        queryStr += ' AND type = $2';
        params.push(type);
      }

      queryStr += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(Number(pageSize), offset);

      const result = await query(queryStr, params);

      res.json({
        items: result.rows.map(row => ({
          id: row.id,
          type: row.type,
          startDate: row.start_date,
          endDate: row.end_date,
          status: row.status,
          downloadUrl: row.download_url,
          createdAt: row.created_at,
        })),
        page: Number(page),
        pageSize: Number(pageSize),
      });
    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({ error: 'Failed to get reports' });
    }
  }

  async getReport(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const result = await query(
        'SELECT * FROM reports WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }

      const row = result.rows[0];
      res.json({
        id: row.id,
        type: row.type,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        summary: row.summary,
        downloadUrl: row.download_url,
        createdAt: row.created_at,
      });
    } catch (error) {
      console.error('Get report error:', error);
      res.status(500).json({ error: 'Failed to get report' });
    }
  }

  async generateReport(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { type, startDate, endDate } = req.body;

      // Create report record
      const result = await query(
        `INSERT INTO reports (user_id, type, start_date, end_date, status)
         VALUES ($1, $2, $3, $4, 'generating')
         RETURNING id`,
        [userId, type, startDate, endDate]
      );

      const reportId = result.rows[0].id;

      // Generate report asynchronously
      this.generateReportAsync(reportId, userId!, startDate, endDate).catch(err => {
        console.error('Report generation error:', err);
      });

      res.status(201).json({
        id: reportId,
        status: 'generating',
        message: 'Report generation started',
      });
    } catch (error) {
      console.error('Generate report error:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  }

  private async generateReportAsync(reportId: string, userId: string, startDate: string, endDate: string) {
    try {
      console.log(`Generating report ${reportId}...`);

      // Fetch data
      const transactionResult = await query(
        `SELECT type, SUM(amount) as total, COUNT(*) as count
         FROM transactions
         WHERE user_id = $1 AND date >= $2 AND date <= $3
         GROUP BY type`,
        [userId, startDate, endDate]
      );

      const categoryResult = await query(
        `SELECT c.name, SUM(t.amount) as total, COUNT(*) as count
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1 AND t.date >= $2 AND t.date <= $3 AND t.type = 'expense'
         GROUP BY c.name
         ORDER BY total DESC
         LIMIT 10`,
        [userId, startDate, endDate]
      );

      let totalIncome = 0, totalExpense = 0;
      transactionResult.rows.forEach(row => {
        if (row.type === 'income') totalIncome = parseFloat(row.total);
        if (row.type === 'expense') totalExpense = parseFloat(row.total);
      });

      const summary = {
        totalIncome,
        totalExpense,
        netSavings: totalIncome - totalExpense,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100) : 0,
        topExpenseCategories: categoryResult.rows.map(row => ({
          name: row.name,
          amount: parseFloat(row.total),
          count: parseInt(row.count),
        })),
      };

      // Generate PDF
      const pdfPath = await this.generatePdf(reportId, summary, startDate, endDate);

      // Update report record
      await query(
        `UPDATE reports SET
           status = 'completed',
           summary = $1,
           download_url = $2
         WHERE id = $3`,
        [JSON.stringify(summary), pdfPath, reportId]
      );

      console.log(`Report ${reportId} completed`);
    } catch (error) {
      console.error(`Report ${reportId} failed:`, error);
      await query(
        `UPDATE reports SET status = 'failed' WHERE id = $1`,
        [reportId]
      );
    }
  }

  private async generatePdf(reportId: string, summary: any, startDate: string, endDate: string): Promise<string> {
    const uploadDir = config.upload.dir;
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `report-${reportId}.pdf`;
    const filepath = path.join(uploadDir, filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const stream = require('fs').createWriteStream(filepath);

      doc.pipe(stream);

      // Title
      doc.fontSize(24).text('Financial Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
      doc.moveDown(2);

      // Summary
      doc.fontSize(16).text('Summary', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Total Income: ${summary.totalIncome.toLocaleString('vi-VN')} VND`);
      doc.text(`Total Expense: ${summary.totalExpense.toLocaleString('vi-VN')} VND`);
      doc.text(`Net Savings: ${summary.netSavings.toLocaleString('vi-VN')} VND`);
      doc.text(`Savings Rate: ${summary.savingsRate.toFixed(1)}%`);
      doc.moveDown(2);

      // Top Categories
      doc.fontSize(16).text('Top Expense Categories', { underline: true });
      doc.moveDown();
      doc.fontSize(12);

      summary.topExpenseCategories.forEach((cat: any, i: number) => {
        doc.text(`${i + 1}. ${cat.name}: ${cat.amount.toLocaleString('vi-VN')} VND (${cat.count} transactions)`);
      });

      doc.end();

      stream.on('finish', () => resolve(`/uploads/${filename}`));
      stream.on('error', reject);
    });
  }

  async getDownloadUrl(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const result = await query(
        'SELECT download_url FROM reports WHERE id = $1 AND user_id = $2 AND status = $3',
        [id, userId, 'completed']
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Report not found or not ready' });
      }

      res.json({
        downloadUrl: result.rows[0].download_url,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    } catch (error) {
      console.error('Get download URL error:', error);
      res.status(500).json({ error: 'Failed to get download URL' });
    }
  }

  async deleteReport(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      await query('DELETE FROM reports WHERE id = $1 AND user_id = $2', [id, userId]);
      res.json({ message: 'Report deleted' });
    } catch (error) {
      console.error('Delete report error:', error);
      res.status(500).json({ error: 'Failed to delete report' });
    }
  }

  async getMonthlyReport(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { year, month } = req.params;

      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

      const summary = await this.calculateSummary(userId!, startDate, endDate);
      res.json(summary);
    } catch (error) {
      console.error('Get monthly report error:', error);
      res.status(500).json({ error: 'Failed to get monthly report' });
    }
  }

  async getYearlyReport(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { year } = req.params;

      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const summary = await this.calculateSummary(userId!, startDate, endDate);
      res.json(summary);
    } catch (error) {
      console.error('Get yearly report error:', error);
      res.status(500).json({ error: 'Failed to get yearly report' });
    }
  }

  private async calculateSummary(userId: string, startDate: string, endDate: string) {
    const transactionResult = await query(
      `SELECT type, SUM(amount) as total
       FROM transactions
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       GROUP BY type`,
      [userId, startDate, endDate]
    );

    let totalIncome = 0, totalExpense = 0;
    transactionResult.rows.forEach(row => {
      if (row.type === 'income') totalIncome = parseFloat(row.total) || 0;
      if (row.type === 'expense') totalExpense = parseFloat(row.total) || 0;
    });

    return {
      totalIncome,
      totalExpense,
      netSavings: totalIncome - totalExpense,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100) : 0,
    };
  }

  async getTrends(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const months = Number(req.query.months) || 6;

      const result = await query(
        `SELECT 
           TO_CHAR(date, 'YYYY-MM') as month,
           type,
           SUM(amount) as total
         FROM transactions
         WHERE user_id = $1 AND date >= NOW() - INTERVAL '${months} months'
         GROUP BY TO_CHAR(date, 'YYYY-MM'), type
         ORDER BY month`,
        [userId]
      );

      const trends: Record<string, { income: number; expense: number; savings: number }> = {};

      result.rows.forEach(row => {
        if (!trends[row.month]) {
          trends[row.month] = { income: 0, expense: 0, savings: 0 };
        }
        if (row.type === 'income') {
          trends[row.month].income = parseFloat(row.total);
        } else if (row.type === 'expense') {
          trends[row.month].expense = parseFloat(row.total);
        }
      });

      Object.keys(trends).forEach(month => {
        trends[month].savings = trends[month].income - trends[month].expense;
      });

      res.json(Object.entries(trends).map(([month, data]) => ({
        month,
        ...data,
      })));
    } catch (error) {
      console.error('Get trends error:', error);
      res.status(500).json({ error: 'Failed to get trends' });
    }
  }

  async getInsights(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      // Simple insights based on spending patterns
      const insights = [];

      // Compare this month to last month
      const thisMonthResult = await query(
        `SELECT SUM(amount) as total FROM transactions 
         WHERE user_id = $1 AND type = 'expense' AND date >= DATE_TRUNC('month', NOW())`,
        [userId]
      );

      const lastMonthResult = await query(
        `SELECT SUM(amount) as total FROM transactions 
         WHERE user_id = $1 AND type = 'expense' 
         AND date >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
         AND date < DATE_TRUNC('month', NOW())`,
        [userId]
      );

      const thisMonth = parseFloat(thisMonthResult.rows[0].total) || 0;
      const lastMonth = parseFloat(lastMonthResult.rows[0].total) || 0;

      if (lastMonth > 0) {
        const change = ((thisMonth - lastMonth) / lastMonth) * 100;
        if (change > 10) {
          insights.push({
            type: 'spending_increase',
            title: 'Spending Increased',
            description: `Your spending this month is ${change.toFixed(0)}% higher than last month.`,
            value: change,
            trend: 'up',
          });
        } else if (change < -10) {
          insights.push({
            type: 'spending_decrease',
            title: 'Great Job Saving!',
            description: `Your spending this month is ${Math.abs(change).toFixed(0)}% lower than last month.`,
            value: Math.abs(change),
            trend: 'down',
          });
        }
      }

      res.json(insights);
    } catch (error) {
      console.error('Get insights error:', error);
      res.status(500).json({ error: 'Failed to get insights' });
    }
  }
}
