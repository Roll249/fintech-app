"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const db_js_1 = require("../../shared/db.js");
const index_js_1 = require("../../config/index.js");
const jwtOptions = { expiresIn: '7d' };
class UserController {
    async register(req, res) {
        try {
            const { email, password, name, phone } = req.body;
            if (!email || !password || !name) {
                return res.status(400).json({ error: 'Email, password and name are required' });
            }
            // Check if user exists
            const existing = await (0, db_js_1.query)('SELECT id FROM users WHERE email = $1', [email]);
            if (existing.rows.length > 0) {
                return res.status(409).json({ error: 'Email already registered' });
            }
            // Hash password
            const passwordHash = await bcryptjs_1.default.hash(password, 12);
            // Create user
            const result = await (0, db_js_1.query)(`INSERT INTO users (email, password_hash, name, phone) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, name, phone, role, created_at`, [email, passwordHash, name, phone]);
            const user = result.rows[0];
            // Generate tokens
            const accessToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, index_js_1.config.jwt.secret, jwtOptions);
            const refreshToken = (0, uuid_1.v4)();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);
            await (0, db_js_1.query)('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [user.id, refreshToken, expiresAt]);
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
        }
        catch (error) {
            console.error('Register error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }
            const result = await (0, db_js_1.query)('SELECT id, email, password_hash, name, phone, role FROM users WHERE email = $1', [email]);
            if (result.rows.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            const user = result.rows[0];
            // Verify password
            const isValid = await bcryptjs_1.default.compare(password, user.password_hash);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            // Generate tokens
            const accessToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, index_js_1.config.jwt.secret, jwtOptions);
            const refreshToken = (0, uuid_1.v4)();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);
            await (0, db_js_1.query)('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [user.id, refreshToken, expiresAt]);
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
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({ error: 'Refresh token is required' });
            }
            const result = await (0, db_js_1.query)(`SELECT rt.user_id, u.email, u.role 
         FROM refresh_tokens rt 
         JOIN users u ON rt.user_id = u.id
         WHERE rt.token = $1 AND rt.expires_at > NOW() AND rt.revoked = false`, [refreshToken]);
            if (result.rows.length === 0) {
                return res.status(401).json({ error: 'Invalid or expired refresh token' });
            }
            const { user_id, email, role } = result.rows[0];
            // Generate new access token
            const accessToken = jsonwebtoken_1.default.sign({ id: user_id, email, role }, index_js_1.config.jwt.secret, jwtOptions);
            res.json({
                accessToken,
                expiresIn: 7 * 24 * 60 * 60,
            });
        }
        catch (error) {
            console.error('Refresh token error:', error);
            res.status(500).json({ error: 'Token refresh failed' });
        }
    }
    async getCurrentUser(req, res) {
        try {
            const userId = req.user?.id;
            const result = await (0, db_js_1.query)('SELECT id, email, name, phone, role, avatar_url, created_at FROM users WHERE id = $1', [userId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(result.rows[0]);
        }
        catch (error) {
            console.error('Get current user error:', error);
            res.status(500).json({ error: 'Failed to get user' });
        }
    }
    async updateProfile(req, res) {
        try {
            const userId = req.user?.id;
            const { name, phone, avatarUrl } = req.body;
            const result = await (0, db_js_1.query)(`UPDATE users SET 
           name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           avatar_url = COALESCE($3, avatar_url),
           updated_at = NOW()
         WHERE id = $4
         RETURNING id, email, name, phone, role, avatar_url`, [name, phone, avatarUrl, userId]);
            res.json(result.rows[0]);
        }
        catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ error: 'Failed to update profile' });
        }
    }
    async logout(req, res) {
        try {
            const { refreshToken } = req.body;
            if (refreshToken) {
                await (0, db_js_1.query)('UPDATE refresh_tokens SET revoked = true WHERE token = $1', [refreshToken]);
            }
            res.json({ message: 'Logged out successfully' });
        }
        catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({ error: 'Logout failed' });
        }
    }
    async changePassword(req, res) {
        try {
            const userId = req.user?.id;
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ error: 'Current and new password are required' });
            }
            const result = await (0, db_js_1.query)('SELECT password_hash FROM users WHERE id = $1', [userId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            const isValid = await bcryptjs_1.default.compare(currentPassword, result.rows[0].password_hash);
            if (!isValid) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }
            const newPasswordHash = await bcryptjs_1.default.hash(newPassword, 12);
            await (0, db_js_1.query)('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newPasswordHash, userId]);
            // Revoke all refresh tokens
            await (0, db_js_1.query)('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [userId]);
            res.json({ message: 'Password changed successfully' });
        }
        catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ error: 'Failed to change password' });
        }
    }
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }
            // Check if user exists (but don't reveal this to the client)
            const userResult = await (0, db_js_1.query)('SELECT id FROM users WHERE email = $1', [email]);
            if (userResult.rows.length > 0) {
                const userId = userResult.rows[0].id;
                const resetToken = (0, uuid_1.v4)();
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 1);
                await (0, db_js_1.query)(`INSERT INTO password_reset_tokens (user_id, token, expires_at)
           VALUES ($1, $2, $3)`, [userId, resetToken, expiresAt]);
                // TODO: Send email with reset link containing resetToken
                console.log(`Password reset token for ${email}: ${resetToken}`);
            }
            // Always return same response to prevent email enumeration
            res.json({ message: 'If email exists, reset link sent' });
        }
        catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({ error: 'Failed to process request' });
        }
    }
    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                return res.status(400).json({ error: 'Token and new password are required' });
            }
            // Validate token exists, not expired, and not used
            const tokenResult = await (0, db_js_1.query)(`SELECT user_id FROM password_reset_tokens 
         WHERE token = $1 AND expires_at > NOW() AND used = false`, [token]);
            if (tokenResult.rows.length === 0) {
                return res.status(400).json({ error: 'Invalid or expired reset token' });
            }
            const userId = tokenResult.rows[0].user_id;
            // Update password
            const newPasswordHash = await bcryptjs_1.default.hash(newPassword, 12);
            await (0, db_js_1.query)('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newPasswordHash, userId]);
            // Mark token as used
            await (0, db_js_1.query)('UPDATE password_reset_tokens SET used = true WHERE token = $1', [token]);
            // Revoke all refresh tokens
            await (0, db_js_1.query)('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [userId]);
            res.json({ message: 'Password reset successfully' });
        }
        catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({ error: 'Failed to reset password' });
        }
    }
    async googleOAuth(req, res) {
        try {
            const { idToken } = req.body;
            if (!idToken) {
                return res.status(400).json({ error: 'ID token is required' });
            }
            // TODO: Verify Google ID token using google-auth-library
            // const { OAuth2Client } = require('google-auth-library');
            // const client = new OAuth2Client(config.google.clientId);
            // const ticket = await client.verifyIdToken({
            //   idToken,
            //   audience: config.google.clientId,
            // });
            // const payload = ticket.getPayload();
            // Mock verification for now
            const mockPayload = {
                sub: 'google_' + idToken.substring(0, 10),
                email: `user_${idToken.substring(0, 6)}@gmail.com`,
                name: 'Google User',
                email_verified: true,
            };
            const googleId = mockPayload.sub;
            const email = mockPayload.email;
            const name = mockPayload.name;
            // Check if OAuth account exists
            const oauthResult = await (0, db_js_1.query)(`SELECT u.id, u.email, u.name, u.phone, u.role 
         FROM oauth_accounts oa 
         JOIN users u ON oa.user_id = u.id 
         WHERE oa.provider = 'google' AND oa.provider_user_id = $1`, [googleId]);
            let user;
            if (oauthResult.rows.length > 0) {
                user = oauthResult.rows[0];
            }
            else {
                // Check if user with email exists
                const existingUser = await (0, db_js_1.query)('SELECT id, email, name, phone, role FROM users WHERE email = $1', [email]);
                if (existingUser.rows.length > 0) {
                    user = existingUser.rows[0];
                    // Link OAuth account
                    await (0, db_js_1.query)(`INSERT INTO oauth_accounts (user_id, provider, provider_user_id)
             VALUES ($1, 'google', $2)`, [user.id, googleId]);
                }
                else {
                    // Create new user
                    const newUserResult = await (0, db_js_1.query)(`INSERT INTO users (email, name, email_verified)
             VALUES ($1, $2, true)
             RETURNING id, email, name, phone, role`, [email, name]);
                    user = newUserResult.rows[0];
                    // Create OAuth account link
                    await (0, db_js_1.query)(`INSERT INTO oauth_accounts (user_id, provider, provider_user_id)
             VALUES ($1, 'google', $2)`, [user.id, googleId]);
                }
            }
            // Generate tokens
            const accessToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, index_js_1.config.jwt.secret, jwtOptions);
            const refreshToken = (0, uuid_1.v4)();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);
            await (0, db_js_1.query)('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [user.id, refreshToken, expiresAt]);
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
        }
        catch (error) {
            console.error('Google OAuth error:', error);
            res.status(500).json({ error: 'OAuth authentication failed' });
        }
    }
    async verifyEmail(req, res) {
        try {
            const { token } = req.params;
            if (!token) {
                return res.status(400).json({ error: 'Verification token is required' });
            }
            // Validate token exists and not already verified
            const tokenResult = await (0, db_js_1.query)(`SELECT user_id FROM email_verification_tokens 
         WHERE token = $1 AND verified = false AND expires_at > NOW()`, [token]);
            if (tokenResult.rows.length === 0) {
                return res.status(400).json({ error: 'Invalid or expired verification token' });
            }
            const userId = tokenResult.rows[0].user_id;
            // Mark token as verified
            await (0, db_js_1.query)('UPDATE email_verification_tokens SET verified = true WHERE token = $1', [token]);
            // Update user email_verified field
            await (0, db_js_1.query)('UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1', [userId]);
            res.json({ message: 'Email verified successfully' });
        }
        catch (error) {
            console.error('Verify email error:', error);
            res.status(500).json({ error: 'Failed to verify email' });
        }
    }
    async resendVerification(req, res) {
        try {
            const userId = req.user?.id;
            // Check if already verified
            const userResult = await (0, db_js_1.query)('SELECT email, email_verified FROM users WHERE id = $1', [userId]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            if (userResult.rows[0].email_verified) {
                return res.status(400).json({ error: 'Email already verified' });
            }
            // Generate new verification token
            const verificationToken = (0, uuid_1.v4)();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);
            await (0, db_js_1.query)(`INSERT INTO email_verification_tokens (user_id, token, expires_at)
         VALUES ($1, $2, $3)`, [userId, verificationToken, expiresAt]);
            // TODO: Send verification email
            console.log(`Verification token for user ${userId}: ${verificationToken}`);
            res.json({ message: 'Verification email sent' });
        }
        catch (error) {
            console.error('Resend verification error:', error);
            res.status(500).json({ error: 'Failed to resend verification' });
        }
    }
    async deleteAccount(req, res) {
        try {
            const userId = req.user?.id;
            // Soft delete: anonymize user data
            const anonymizedEmail = `deleted_${(0, uuid_1.v4)()}@deleted.local`;
            await (0, db_js_1.query)(`UPDATE users SET 
           email = $1,
           name = 'Deleted User',
           phone = NULL,
           password_hash = NULL,
           avatar_url = NULL,
           deleted_at = NOW(),
           updated_at = NOW()
         WHERE id = $2`, [anonymizedEmail, userId]);
            // Revoke all refresh tokens
            await (0, db_js_1.query)('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [userId]);
            // Invalidate all password reset tokens
            await (0, db_js_1.query)('UPDATE password_reset_tokens SET used = true WHERE user_id = $1', [userId]);
            // Invalidate all email verification tokens
            await (0, db_js_1.query)('UPDATE email_verification_tokens SET verified = true WHERE user_id = $1', [userId]);
            res.json({ message: 'Account deleted successfully' });
        }
        catch (error) {
            console.error('Delete account error:', error);
            res.status(500).json({ error: 'Failed to delete account' });
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map