"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Import routers
const user_routes_js_1 = require("./services/user/user.routes.js");
const account_routes_js_1 = require("./services/account/account.routes.js");
const transaction_routes_js_1 = require("./services/transaction/transaction.routes.js");
const budget_routes_js_1 = require("./services/budget/budget.routes.js");
const bill_routes_js_1 = require("./services/bill/bill.routes.js");
const fund_routes_js_1 = require("./services/fund/fund.routes.js");
const notification_routes_js_1 = require("./services/notification/notification.routes.js");
const report_routes_js_1 = require("./services/report/report.routes.js");
const error_middleware_js_1 = require("./shared/middleware/error.middleware.js");
const auth_middleware_js_1 = require("./shared/middleware/auth.middleware.js");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Public routes (no auth required)
app.use('/api/v1/auth', user_routes_js_1.userRouter);
// Protected routes (auth required)
app.use('/api/v1/users', auth_middleware_js_1.authMiddleware, user_routes_js_1.userRouter);
app.use('/api/v1/accounts', auth_middleware_js_1.authMiddleware, account_routes_js_1.accountRouter);
app.use('/api/v1/transactions', auth_middleware_js_1.authMiddleware, transaction_routes_js_1.transactionRouter);
app.use('/api/v1/budgets', auth_middleware_js_1.authMiddleware, budget_routes_js_1.budgetRouter);
app.use('/api/v1/bills', auth_middleware_js_1.authMiddleware, bill_routes_js_1.billRouter);
app.use('/api/v1/funds', auth_middleware_js_1.authMiddleware, fund_routes_js_1.fundRouter);
app.use('/api/v1/notifications', auth_middleware_js_1.authMiddleware, notification_routes_js_1.notificationRouter);
app.use('/api/v1/reports', auth_middleware_js_1.authMiddleware, report_routes_js_1.reportRouter);
// Error handling
app.use(error_middleware_js_1.errorHandler);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});
app.listen(PORT, () => {
    console.log(`🚀 Fintech Backend running on port ${PORT}`);
    console.log(`📚 API: http://localhost:${PORT}/api/v1`);
    console.log(`❤️  Health: http://localhost:${PORT}/health`);
});
exports.default = app;
//# sourceMappingURL=index.js.map