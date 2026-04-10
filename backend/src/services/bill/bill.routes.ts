import { Router, Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../../shared/db/index.js';
import { AuthRequest } from '../../shared/middleware/auth.middleware.js';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// POST /api/v1/bills/upload - Upload and process bill image
router.post('/upload', upload.single('image'), async (req: req & { file?: Express.Multer.File }, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Process image
    const processedImage = await sharp(req.file.buffer)
      .resize(1200, 1600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const imageId = uuidv4();
    const imagePath = `uploads/bills/${imageId}.jpg`;

    // Save processed image
    const fs = await import('fs');
    const path = await import('path');

    const uploadDir = path.resolve(process.cwd(), 'uploads/bills');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    fs.writeFileSync(
      path.resolve(process.cwd(), imagePath),
      processedImage
    );

    // Create bill record
    const bill = await queryOne<any>(
      `INSERT INTO bills (user_id, image_url, status, bill_type)
       VALUES ($1, $2, 'processing', 'unknown')
       RETURNING *`,
      [userId, `/${imagePath}`]
    );

    // Simulate OCR processing (in production, this would call Google Vision API)
    // For now, we'll return a mock result with a simulated delay
    setTimeout(async () => {
      try {
        // Mock OCR result
        const mockOcrResult = {
          merchantName: generateRandomMerchant(),
          totalAmount: Math.floor(Math.random() * 500000) + 50000,
          billDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          taxAmount: Math.floor(Math.random() * 50000),
          ocrConfidence: 0.85 + Math.random() * 0.15,
        };

        // Update bill with OCR result
        await query(
          `UPDATE bills SET
             ocr_raw_text = $1,
             merchant_name = $2,
             total_amount = $3,
             bill_date = $4,
             tax_amount = $5,
             ocr_confidence = $6,
             status = 'completed',
             ocr_provider = 'simulated'
           WHERE id = $7`,
          [
            JSON.stringify(mockOcrResult),
            mockOcrResult.merchantName,
            mockOcrResult.totalAmount,
            mockOcrResult.billDate,
            mockOcrResult.taxAmount,
            mockOcrResult.ocrConfidence,
            bill.id,
          ]
        );

        // Create transaction from bill
        const transaction = await queryOne<any>(
          `INSERT INTO transactions (user_id, type, amount, description, merchant_name, source)
           VALUES ($1, 'expense', $2, $3, $4, 'MANUAL')
           RETURNING *`,
          [userId, mockOcrResult.totalAmount, `Hóa đơn ${mockOcrResult.merchantName}`, mockOcrResult.merchantName]
        );

        // Update bill with transaction
        await query(
          'UPDATE bills SET linked_transaction_id = $1 WHERE id = $2',
          [transaction.id, bill.id]
        );
      } catch (error) {
        console.error('OCR processing error:', error);
        await query(
          "UPDATE bills SET status = 'failed', ocr_error_code = 'PROCESSING_ERROR' WHERE id = $1",
          [bill.id]
        );
      }
    }, 2000);

    res.status(201).json({
      success: true,
      data: {
        id: bill.id,
        status: 'processing',
        message: 'Bill is being processed. Please check back in a few seconds.',
      },
    });
  } catch (error: any) {
    console.error('Upload bill error:', error);
    res.status(500).json({
      error: 'Không thể xử lý hóa đơn',
    });
  }
});

// GET /api/v1/bills - Get user's bills
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string;

    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE b.user_id = $1';
    const params: any[] = [userId];

    if (status) {
      whereClause += ' AND b.status = $2';
      params.push(status);
    }

    const bills = await query<any>(
      `SELECT b.*, t.id as transaction_id, t.amount as transaction_amount, t.description as transaction_description
       FROM bills b
       LEFT JOIN transactions t ON t.id = b.linked_transaction_id
       ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    );

    const totalResult = await queryOne<any>(
      `SELECT COUNT(*) as total FROM bills ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: bills,
      pagination: {
        page,
        pageSize,
        totalItems: parseInt(totalResult.total),
        totalPages: Math.ceil(parseInt(totalResult.total) / pageSize),
      },
    });
  } catch (error: any) {
    console.error('Get bills error:', error);
    res.status(500).json({
      error: 'Không thể lấy danh sách hóa đơn',
    });
  }
});

// GET /api/v1/bills/:id - Get bill details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const bill = await queryOne<any>(
      `SELECT b.*, t.id as transaction_id, t.amount as transaction_amount, t.description as transaction_description
       FROM bills b
       LEFT JOIN transactions t ON t.id = b.linked_transaction_id
       WHERE b.id = $1 AND b.user_id = $2`,
      [id, userId]
    );

    if (!bill) {
      return res.status(404).json({
        error: 'Hóa đơn không tồn tại',
      });
    }

    res.json({
      success: true,
      data: bill,
    });
  } catch (error: any) {
    console.error('Get bill error:', error);
    res.status(500).json({
      error: 'Không thể lấy thông tin hóa đơn',
    });
  }
});

// PATCH /api/v1/bills/:id - Update bill (edit OCR result)
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { merchantName, totalAmount, billDate, billType, notes } = req.body;

    // Verify ownership
    const existing = await queryOne<any>(
      'SELECT id FROM bills WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (!existing) {
      return res.status(404).json({
        error: 'Hóa đơn không tồn tại',
      });
    }

    const updates: string[] = ['status = $1'];
    const values: any[] = ['edited'];
    let paramIndex = 2;

    if (merchantName !== undefined) {
      updates.push(`merchant_name = $${paramIndex++}`);
      values.push(merchantName);
    }
    if (totalAmount !== undefined) {
      updates.push(`total_amount = $${paramIndex++}`);
      values.push(totalAmount);
    }
    if (billDate !== undefined) {
      updates.push(`bill_date = $${paramIndex++}`);
      values.push(billDate);
    }
    if (billType !== undefined) {
      updates.push(`bill_type = $${paramIndex++}`);
      values.push(billType);
    }

    values.push(id);

    const bill = await queryOne<any>(
      `UPDATE bills SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    // Update linked transaction if exists
    if (totalAmount !== undefined) {
      await query(
        'UPDATE transactions SET amount = $1, description = $2 WHERE id = (SELECT linked_transaction_id FROM bills WHERE id = $3)',
        [totalAmount, `Hóa đơn ${merchantName || bill.merchant_name}`, id]
      );
    }

    res.json({
      success: true,
      data: bill,
    });
  } catch (error: any) {
    console.error('Update bill error:', error);
    res.status(500).json({
      error: 'Không thể cập nhật hóa đơn',
    });
  }
});

// DELETE /api/v1/bills/:id - Delete bill
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await query(
      'DELETE FROM bills WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result === 0) {
      return res.status(404).json({
        error: 'Hóa đơn không tồn tại',
      });
    }

    res.json({
      success: true,
      message: 'Xóa hóa đơn thành công',
    });
  } catch (error: any) {
    console.error('Delete bill error:', error);
    res.status(500).json({
      error: 'Không thể xóa hóa đơn',
    });
  }
});

// GET /api/v1/bills/stats - Get bill statistics
router.get('/stats/overview', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const stats = await queryOne<any>(
      `SELECT
         COUNT(*) as total_bills,
         COUNT(*) FILTER (WHERE status = 'completed') as processed_bills,
         COUNT(*) FILTER (WHERE status = 'pending') as pending_bills,
         COUNT(*) FILTER (WHERE status = 'failed') as failed_bills,
         COUNT(*) FILTER (WHERE status = 'needs_review') as review_bills,
         COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0) as total_amount,
         AVG(ocr_confidence) FILTER (WHERE status = 'completed') as avg_confidence
       FROM bills
       WHERE user_id = $1
         AND created_at >= NOW() - INTERVAL '30 days'`,
      [userId]
    );

    // Top merchants
    const topMerchants = await query<any>(
      `SELECT merchant_name, COUNT(*) as count, SUM(total_amount) as total
       FROM bills
       WHERE user_id = $1 AND merchant_name IS NOT NULL AND status = 'completed'
         AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY merchant_name
       ORDER BY total DESC
       LIMIT 5`,
      [userId]
    );

    // Bill type distribution
    const typeDistribution = await query<any>(
      `SELECT bill_type, COUNT(*) as count
       FROM bills
       WHERE user_id = $1 AND status = 'completed'
         AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY bill_type
       ORDER BY count DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        totalBills: parseInt(stats.total_bills) || 0,
        processedBills: parseInt(stats.processed_bills) || 0,
        pendingBills: parseInt(stats.pending_bills) || 0,
        failedBills: parseInt(stats.failed_bills) || 0,
        reviewBills: parseInt(stats.review_bills) || 0,
        totalAmount: parseInt(stats.total_amount) || 0,
        avgConfidence: Math.round((parseFloat(stats.avg_confidence) || 0) * 100),
        topMerchants: topMerchants.map((m: any) => ({
          name: m.merchant_name,
          count: parseInt(m.count),
          total: parseInt(m.total)
        })),
        typeDistribution: typeDistribution.map((t: any) => ({
          type: t.bill_type,
          count: parseInt(t.count)
        }))
      },
    });
  } catch (error: any) {
    console.error('Get bill stats error:', error);
    res.status(500).json({
      error: 'Không thể lấy thống kê hóa đơn',
    });
  }
});

// Helper function to generate random merchant
function generateRandomMerchant(): string {
  const merchants = [
    'Nhà hàng Phúc Lợi', 'Cửa hàng Tiện lợi ABC', 'Siêu thị BigC',
    'Quán Cơm Gà', 'Cà Phê Highlands', 'Pizza Hut',
    'KFC Vietnam', 'McDonald\'s', 'Circle K',
    'Vinmart+', 'Co.opmart', 'Điện máy Xanh',
    'Thế Giới Di Động', 'FPT Shop', 'Pharmacity',
    'Nhà thuốc Long Châu', 'GrabFood', 'ShopeeFood',
  ];
  return merchants[Math.floor(Math.random() * merchants.length)];
}

export { router as billRouter };