import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../shared/db.js';
import { config } from '../../config/index.js';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';

const jwtOptions: SignOptions = { expiresIn: '7d' };

export class UserController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, name, phone } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password and name are required' });
      }

      // Check if user exists
      const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const result = await query(
        `INSERT INTO users (email, password_hash, name, phone) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, name, phone, role, created_at`,
        [email, passwordHash, name, phone]
      );

      const user = result.rows[0];

      // Generate tokens
      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        jwtOptions
      );

      const refreshToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, refreshToken, expiresAt]
      );

      res.status(201).json({
        accessToken,
        refreshToken,
        expiresIn: 7 * 24 * 60 * 60,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await query(
        'SELECT id, email, password_hash, name, phone, role FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        jwtOptions
      );

      const refreshToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, refreshToken, expiresAt]
      );

      res.json({
        accessToken,
        refreshToken,
        expiresIn: 7 * 24 * 60 * 60,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      const result = await query(
        `SELECT rt.user_id, u.email, u.role 
         FROM refresh_tokens rt 
         JOIN users u ON rt.user_id = u.id
         WHERE rt.token = $1 AND rt.expires_at > NOW() AND rt.revoked = false`,
        [refreshToken]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
      }

      const { user_id, email, role } = result.rows[0];

      // Generate new access token
      const accessToken = jwt.sign(
        { id: user_id, email, role },
        config.jwt.secret,
        jwtOptions
      );

      res.json({
        accessToken,
        expiresIn: 7 * 24 * 60 * 60,
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({ error: 'Token refresh failed' });
    }
  }

  async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      const result = await query(
        'SELECT id, email, name, phone, role, avatar_url, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { name, phone, avatarUrl } = req.body;

      const result = await query(
        `UPDATE users SET 
           name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           avatar_url = COALESCE($3, avatar_url),
           updated_at = NOW()
         WHERE id = $4
         RETURNING id, email, name, phone, role, avatar_url`,
        [name, phone, avatarUrl, userId]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  async logout(req: AuthenticatedRequest, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await query(
          'UPDATE refresh_tokens SET revoked = true WHERE token = $1',
          [refreshToken]
        );
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' });
      }

      const result = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 12);
      await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newPasswordHash, userId]);

      // Revoke all refresh tokens
      await query('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [userId]);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
}
