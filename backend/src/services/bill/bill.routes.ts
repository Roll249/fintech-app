import { Router } from 'express';
import multer from 'multer';
import { BillController } from './bill.controller.js';

export const billRouter = Router();
const controller = new BillController();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Routes
billRouter.get('/', controller.getBills);
billRouter.get('/:id', controller.getBill);
billRouter.post('/upload', upload.single('image'), controller.uploadBill);
billRouter.put('/:id', controller.updateBill);
billRouter.delete('/:id', controller.deleteBill);
billRouter.post('/:id/reprocess', controller.reprocessBill);
billRouter.post('/:id/create-transaction', controller.createTransactionFromBill);
