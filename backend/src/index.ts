import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// MIDDLEWARE
// =====================================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));

// CORS - Allow all origins for mobile app
app.use(cors({
  origin: '*', // Allow all for mobile app development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Request logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { error: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
});
app.use('/api/', limiter);

// =====================================================
// ROUTES IMPORT
// =====================================================

// Auth routes
import { authRouter } from './services/auth/auth.routes.js';

// User routes
import { userRouter } from './services/user/user.routes.js';

// Bank routes
import { bankRouter } from './services/bank/bank.routes.js';

// Fund routes
import { fundRouter } from './services/fund/fund.routes.js';

// Transaction routes
import { transactionRouter } from './services/transaction/transaction.routes.js';

// QR routes
import { qrRouter } from './services/qr/qr.routes.js';

// Allocation routes
import { allocationRouter } from './services/allocation/allocation.routes.js';

// Notification routes
import { notificationRouter } from './services/notification/notification.routes.js';

// Budget routes
import { budgetRouter } from './services/budget/budget.routes.js';

// Report routes
import { reportRouter } from './services/report/report.routes.js';

// Bill routes
import { billRouter } from './services/bill/bill.routes.js';

// Simulation routes (admin only)
import { simulationRouter } from './services/simulation/simulation.routes.js';

// Middleware
import { errorHandler } from './shared/middleware/error.middleware.js';
import { authMiddleware, adminMiddleware } from './shared/middleware/auth.middleware.js';

// =====================================================
// ROUTES DEFINITION
// =====================================================

// Health check - Public
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});

// API version info - Public
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'Fintech App API',
    version: '2.0.0',
    description: 'Financial Management API with Bank Simulation',
  });
});

// Auth routes - Public
app.use('/api/v1/auth', authRouter);

// Bank simulation - Public (for testing/demo)
app.use('/api/v1/banks', bankRouter);

// Protected routes - Require authentication
app.use('/api/v1/users', authMiddleware, userRouter);
app.use('/api/v1/funds', authMiddleware, fundRouter);
app.use('/api/v1/transactions', authMiddleware, transactionRouter);
app.use('/api/v1/qr', authMiddleware, qrRouter);
app.use('/api/v1/allocations', authMiddleware, allocationRouter);
app.use('/api/v1/notifications', authMiddleware, notificationRouter);
app.use('/api/v1/budgets', authMiddleware, budgetRouter);
app.use('/api/v1/reports', authMiddleware, reportRouter);
app.use('/api/v1/bills', authMiddleware, billRouter);

// Admin routes - Require admin role
app.use('/api/v1/simulation', authMiddleware, adminMiddleware, simulationRouter);

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Không tìm th��y endpoint', code: 'NOT_FOUND' });
});

// Global error handler
app.use(errorHandler);

// =====================================================
// START SERVER
// =====================================================

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('===========================================');
  console.log('🚀 Fintech App Backend v2.0.0');
  console.log('===========================================');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`📚 API:    http://localhost:${PORT}/api/v1`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
  console.log('===========================================');

  // Check environment
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  WARNING: JWT_SECRET not set in environment!');
  }
  if (!process.env.QR_SECRET) {
    console.warn('⚠️  WARNING: QR_SECRET not set in environment!');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
