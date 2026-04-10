import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne } from '../db/index.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Không tìm thấy token xác thực',
        code: 'AUTH_REQUIRED'
      });
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';

    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token đã hết hạn',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({
        error: 'Token không hợp lệ',
        code: 'INVALID_TOKEN'
      });
    }

    // Verify user still exists and is active
    const user = await queryOne(
      'SELECT id, email, name, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({
        error: 'Người dùng không tồn tại',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        error: 'Tài khoản đã bị vô hiệu hóa',
        code: 'USER_INACTIVE'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Lỗi xác thực',
      code: 'AUTH_ERROR'
    });
  }
}

export async function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Chưa đăng nhập',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Không có quyền truy cập',
      code: 'FORBIDDEN'
    });
  }

  next();
}
