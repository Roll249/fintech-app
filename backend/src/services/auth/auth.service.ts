import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '../../shared/db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me';
const ACCESS_TOKEN_EXPIRY = '1d';
const REFRESH_TOKEN_EXPIRY = '30d';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  is_active: boolean;
  created_at: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export async function register(
  email: string,
  password: string,
  name: string,
  phone?: string
): Promise<AuthTokens> {
  // Check if user exists
  const existing = await queryOne<User>(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (existing) {
    throw new Error('Email đã được sử dụng');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const user = await queryOne<User>(
    `INSERT INTO users (email, password_hash, name, phone)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, name, phone, role, is_active`,
    [email.toLowerCase(), passwordHash, name, phone || null]
  );

  if (!user) {
    throw new Error('Không thể tạo người dùng');
  }

  // Generate tokens
  return generateTokens(user);
}

export async function login(
  email: string,
  password: string
): Promise<AuthTokens> {
  // Find user
  const user = await queryOne<User>(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (!user) {
    throw new Error('Email hoặc mật khẩu không đúng');
  }

  if (!user.is_active) {
    throw new Error('Tài khoản đã bị vô hiệu hóa');
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    throw new Error('Email hoặc mật khẩu không đúng');
  }

  // Generate tokens
  return generateTokens(user);
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;

    const user = await queryOne<User>(
      'SELECT id, email, name, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

    // Verify refresh token exists and not revoked
    const tokenRecord = await queryOne(
      `SELECT id FROM refresh_tokens
       WHERE token = $1 AND user_id = $2 AND revoked = false AND expires_at > NOW()`,
      [refreshToken, user.id]
    );

    if (!tokenRecord) {
      throw new Error('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    return {
      accessToken,
      expiresIn: 86400, // 1 day in seconds
    };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token đã hết hạn, vui lòng đăng nhập lại');
    }
    throw new Error('Refresh token không hợp lệ');
  }
}

export async function logout(userId: string, refreshToken?: string): Promise<void> {
  if (refreshToken) {
    // Revoke specific refresh token
    await query(
      `UPDATE refresh_tokens
       SET revoked = true, revoked_at = NOW()
       WHERE token = $1 AND user_id = $2`,
      [refreshToken, userId]
    );
  } else {
    // Revoke all refresh tokens for user
    await query(
      `UPDATE refresh_tokens
       SET revoked = true, revoked_at = NOW()
       WHERE user_id = $1 AND revoked = false`,
      [userId]
    );
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  return queryOne<User>(
    `SELECT id, email, name, phone, avatar_url, role, is_active, created_at
     FROM users WHERE id = $1`,
    [userId]
  );
}

function generateTokens(user: User): AuthTokens {
  const accessToken = jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  // Save refresh token to database
  query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
    [user.id, refreshToken]
  ).catch(console.error);

  return {
    accessToken,
    refreshToken,
    expiresIn: 86400, // 1 day in seconds
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

export function verifyAccessToken(token: string): { userId: string } {
  return jwt.verify(token, JWT_SECRET) as any;
}
