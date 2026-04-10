import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as authService from './auth.service.js';
import { ApiError } from '../../shared/middleware/error.middleware.js';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token không hợp lệ'),
});

// POST /api/v1/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data.email, data.password, data.name, data.phone);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: error.errors,
      });
    }
    console.error('Register error:', error);
    res.status(400).json({
      error: error.message || 'Đăng ký thất bại',
    });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data.email, data.password);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: error.errors,
      });
    }
    console.error('Login error:', error);
    res.status(401).json({
      error: error.message || 'Đăng nhập thất bại',
    });
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const data = refreshSchema.parse(req.body);
    const result = await authService.refreshAccessToken(data.refreshToken);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
      });
    }
    console.error('Refresh error:', error);
    res.status(401).json({
      error: error.message || 'Refresh token không hợp lệ',
    });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = authService.verifyAccessToken(token);
      const { refreshToken } = req.body;
      await authService.logout(decoded.userId, refreshToken);
    }

    res.json({
      success: true,
      message: 'Đăng xuất thành công',
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.json({
      success: true,
      message: 'Đăng xuất thành công',
    });
  }
});

export { router as authRouter };
