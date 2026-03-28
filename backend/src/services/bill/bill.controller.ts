import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../shared/db.js';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
import { OcrService } from './ocr.service.js';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../../config/index.js';

const ocrService = new OcrService();

export class BillController {
  async getBills(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { page = 1, pageSize = 20, status } = req.query;
      const offset = (Number(page) - 1) * Number(pageSize);

      let queryStr = `
        SELECT id, image_url, ocr_confidence, merchant_name, total_amount, 
               bill_date, status, created_at
        FROM bills 
        WHERE user_id = $1
      `;
      const params: any[] = [userId];

      if (status) {
        queryStr += ' AND status = $2';
        params.push(status);
      }

      queryStr += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(Number(pageSize), offset);

      const result = await query(queryStr, params);

      // Get total count
      const countResult = await query(
        'SELECT COUNT(*) FROM bills WHERE user_id = $1' + (status ? ' AND status = $2' : ''),
        status ? [userId, status] : [userId]
      );

      res.json({
        items: result.rows.map(row => ({
          id: row.id,
          imageUrl: row.image_url,
          ocrConfidence: row.ocr_confidence,
          merchantName: row.merchant_name,
          totalAmount: row.total_amount,
          billDate: row.bill_date,
          status: row.status,
          createdAt: row.created_at,
        })),
        page: Number(page),
        pageSize: Number(pageSize),
        totalItems: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / Number(pageSize)),
      });
    } catch (error) {
      console.error('Get bills error:', error);
      res.status(500).json({ error: 'Failed to get bills' });
    }
  }

  async getBill(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const result = await query(
        `SELECT * FROM bills WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Bill not found' });
      }

      const bill = result.rows[0];
      res.json({
        id: bill.id,
        imageUrl: bill.image_url,
        ocrResult: bill.ocr_raw_text ? {
          rawText: bill.ocr_raw_text,
          confidence: bill.ocr_confidence,
          extractedData: {
            merchantName: bill.merchant_name,
            totalAmount: bill.total_amount,
            date: bill.bill_date,
            items: bill.items || [],
          }
        } : null,
        status: bill.status,
        merchantName: bill.merchant_name,
        totalAmount: bill.total_amount,
        date: bill.bill_date,
        items: bill.items || [],
        linkedTransactionId: bill.linked_transaction_id,
        createdAt: bill.created_at,
      });
    } catch (error) {
      console.error('Get bill error:', error);
      res.status(500).json({ error: 'Failed to get bill' });
    }
  }

  async uploadBill(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      // Save file
      const uploadDir = config.upload.dir;
      await fs.mkdir(uploadDir, { recursive: true });
      
      const filename = `${uuidv4()}-${Date.now()}.jpg`;
      const filepath = path.join(uploadDir, filename);
      await fs.writeFile(filepath, file.buffer);

      const imageUrl = `/uploads/${filename}`;

      // Create bill record with pending status
      const result = await query(
        `INSERT INTO bills (user_id, image_url, status) 
         VALUES ($1, $2, 'processing') 
         RETURNING id`,
        [userId, imageUrl]
      );

      const billId = result.rows[0].id;

      // Process OCR asynchronously
      this.processOcr(billId, file.buffer).catch(err => {
        console.error('OCR processing error:', err);
      });

      res.status(201).json({
        id: billId,
        imageUrl,
        status: 'processing',
        message: 'Bill uploaded. OCR processing started.',
      });
    } catch (error) {
      console.error('Upload bill error:', error);
      res.status(500).json({ error: 'Failed to upload bill' });
    }
  }

  private async processOcr(billId: string, imageBuffer: Buffer) {
    try {
      console.log(`Processing OCR for bill ${billId}...`);
      
      // Run OCR
      const ocrResult = await ocrService.processImage(imageBuffer);
      
      // Parse bill data from OCR text
      const parsedData = ocrService.parseBillText(ocrResult.text);

      // Update bill record
      await query(
        `UPDATE bills SET 
           ocr_raw_text = $1,
           ocr_confidence = $2,
           merchant_name = $3,
           total_amount = $4,
           bill_date = $5,
           items = $6,
           status = 'completed'
         WHERE id = $7`,
        [
          ocrResult.text,
          ocrResult.confidence,
          parsedData.merchantName,
          parsedData.totalAmount,
          parsedData.date,
          JSON.stringify(parsedData.items),
          billId
        ]
      );

      console.log(`OCR completed for bill ${billId}`);
    } catch (error) {
      console.error(`OCR failed for bill ${billId}:`, error);
      await query(
        `UPDATE bills SET status = 'failed' WHERE id = $1`,
        [billId]
      );
    }
  }

  async updateBill(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { merchantName, totalAmount, date, items } = req.body;

      const result = await query(
        `UPDATE bills SET 
           merchant_name = COALESCE($1, merchant_name),
           total_amount = COALESCE($2, total_amount),
           bill_date = COALESCE($3, bill_date),
           items = COALESCE($4, items),
           status = 'edited'
         WHERE id = $5 AND user_id = $6
         RETURNING *`,
        [merchantName, totalAmount, date, items ? JSON.stringify(items) : null, id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Bill not found' });
      }

      res.json({ message: 'Bill updated', bill: result.rows[0] });
    } catch (error) {
      console.error('Update bill error:', error);
      res.status(500).json({ error: 'Failed to update bill' });
    }
  }

  async deleteBill(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      await query('DELETE FROM bills WHERE id = $1 AND user_id = $2', [id, userId]);
      res.json({ message: 'Bill deleted' });
    } catch (error) {
      console.error('Delete bill error:', error);
      res.status(500).json({ error: 'Failed to delete bill' });
    }
  }

  async reprocessBill(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const result = await query(
        'SELECT image_url FROM bills WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Bill not found' });
      }

      // Update status to processing
      await query('UPDATE bills SET status = $1 WHERE id = $2', ['processing', id]);

      // Read image file and reprocess
      const imagePath = path.join(config.upload.dir, path.basename(result.rows[0].image_url));
      const imageBuffer = await fs.readFile(imagePath);
      
      this.processOcr(id, imageBuffer).catch(err => {
        console.error('Reprocess OCR error:', err);
      });

      res.json({ message: 'Reprocessing started' });
    } catch (error) {
      console.error('Reprocess bill error:', error);
      res.status(500).json({ error: 'Failed to reprocess bill' });
    }
  }

  async createTransactionFromBill(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { accountId, categoryId } = req.body;

      // Get bill data
      const billResult = await query(
        'SELECT merchant_name, total_amount, bill_date FROM bills WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (billResult.rows.length === 0) {
        return res.status(404).json({ error: 'Bill not found' });
      }

      const bill = billResult.rows[0];

      // Create transaction
      const txResult = await query(
        `INSERT INTO transactions (user_id, account_id, amount, type, category_id, description, merchant_name, date, is_manual)
         VALUES ($1, $2, $3, 'expense', $4, $5, $6, $7, false)
         RETURNING id`,
        [userId, accountId, bill.total_amount, categoryId, `Bill: ${bill.merchant_name}`, bill.merchant_name, bill.bill_date]
      );

      // Link transaction to bill
      await query(
        'UPDATE bills SET linked_transaction_id = $1 WHERE id = $2',
        [txResult.rows[0].id, id]
      );

      res.status(201).json({
        transactionId: txResult.rows[0].id,
        message: 'Transaction created from bill',
      });
    } catch (error) {
      console.error('Create transaction from bill error:', error);
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  }
}
