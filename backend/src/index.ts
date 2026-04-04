import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routers
import { userRouter } from './services/user/user.routes.js';
import { accountRouter } from './services/account/account.routes.js';
import { transactionRouter } from './services/transaction/transaction.routes.js';
import { budgetRouter } from './services/budget/budget.routes.js';
import { billRouter } from './services/bill/bill.routes.js';
import { fundRouter } from './services/fund/fund.routes.js';
import { notificationRouter } from './services/notification/notification.routes.js';
import { reportRouter } from './services/report/report.routes.js';
import { adminRouter } from './services/admin/admin.routes.js';
import { integrationRouter } from './services/integration/integration.routes.js';
import { errorHandler } from './shared/middleware/error.middleware.js';
import { authMiddleware, adminMiddleware } from './shared/middleware/auth.middleware.js';

// Import queue worker and scheduler
import { queueWorker } from './services/queue/index.js';
import { schedulerService } from './services/scheduler/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Public routes (no auth required)
app.use('/api/v1/auth', userRouter);

// Integration routes (webhook endpoints - use HMAC auth)
app.use('/api/v1/integrations', integrationRouter);

// Protected routes (auth required)
app.use('/api/v1/users', authMiddleware, userRouter);
app.use('/api/v1/accounts', authMiddleware, accountRouter);
app.use('/api/v1/transactions', authMiddleware, transactionRouter);
app.use('/api/v1/budgets', authMiddleware, budgetRouter);
app.use('/api/v1/bills', authMiddleware, billRouter);
app.use('/api/v1/funds', authMiddleware, fundRouter);
app.use('/api/v1/notifications', authMiddleware, notificationRouter);
app.use('/api/v1/reports', authMiddleware, reportRouter);

// Admin routes (admin auth required)
app.use('/api/v1/admin', authMiddleware, adminMiddleware, adminRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Fintech Backend running on port ${PORT}`);
  console.log(`📚 API: http://localhost:${PORT}/api/v1`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
  
  // Start queue worker
  if (process.env.ENABLE_QUEUE_WORKER !== 'false') {
    queueWorker.start();
    console.log('📋 Queue worker started');
  }
  
  // Start scheduler
  if (process.env.ENABLE_SCHEDULER !== 'false') {
    schedulerService.start();
    console.log('⏰ Scheduler started');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  queueWorker.stop();
  schedulerService.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
