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
import { errorHandler } from './shared/middleware/error.middleware.js';
import { authMiddleware } from './shared/middleware/auth.middleware.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes (no auth required)
app.use('/api/v1/auth', userRouter);

// Protected routes (auth required)
app.use('/api/v1/users', authMiddleware, userRouter);
app.use('/api/v1/accounts', authMiddleware, accountRouter);
app.use('/api/v1/transactions', authMiddleware, transactionRouter);
app.use('/api/v1/budgets', authMiddleware, budgetRouter);
app.use('/api/v1/bills', authMiddleware, billRouter);
app.use('/api/v1/funds', authMiddleware, fundRouter);
app.use('/api/v1/notifications', authMiddleware, notificationRouter);
app.use('/api/v1/reports', authMiddleware, reportRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Fintech Backend running on port ${PORT}`);
  console.log(`📚 API: http://localhost:${PORT}/api/v1`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
});

export default app;
