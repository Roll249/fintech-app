import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
        details: (err as any).errors,
      },
    });
  }
  
  // Database errors
  if ((err as any).code === '23505') {
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
