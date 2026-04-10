import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Lỗi server nội bộ';
  const code = err.code || 'INTERNAL_ERROR';

  // Don't leak stack trace in production
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    error: message,
    code,
    ...(isProduction ? {} : { stack: err.stack }),
    timestamp: new Date().toISOString(),
    path: req.path,
  });
}

export class ApiError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || this.getDefaultCode(statusCode);
  }

  private getDefaultCode(statusCode: number): string {
    switch (statusCode) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 422: return 'UNPROCESSABLE_ENTITY';
      case 429: return 'TOO_MANY_REQUESTS';
      default: return 'INTERNAL_ERROR';
    }
  }

  static badRequest(message: string = 'Yêu cầu không hợp lệ') {
    return new ApiError(400, message, 'BAD_REQUEST');
  }

  static unauthorized(message: string = 'Chưa đăng nhập') {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Không có quyền truy cập') {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(message: string = 'Không tìm thấy') {
    return new ApiError(404, message, 'NOT_FOUND');
  }

  static conflict(message: string = 'Xung đột dữ liệu') {
    return new ApiError(409, message, 'CONFLICT');
  }

  static internal(message: string = 'Lỗi server') {
    return new ApiError(500, message, 'INTERNAL_ERROR');
  }
}
