"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    message;
    code;
    constructor(statusCode, message, code) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.code = code;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: {
                code: err.code || 'ERROR',
                message: err.message,
            },
        });
    }
    // Validation errors (from Zod)
    if (err.name === 'ZodError') {
        return res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: err.errors,
            },
        });
    }
    // Database errors
    if (err.code === '23505') {
        return res.status(409).json({
            error: {
                code: 'DUPLICATE_ENTRY',
                message: 'Resource already exists',
            },
        });
    }
    // Default error
    return res.status(500).json({
        error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
        },
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.middleware.js.map