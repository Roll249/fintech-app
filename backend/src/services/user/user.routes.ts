import { Router } from 'express';
import { UserController } from './user.controller.js';

export const userRouter = Router();
const controller = new UserController();

// Auth routes (public)
userRouter.post('/login', controller.login);
userRouter.post('/register', controller.register);
userRouter.post('/refresh', controller.refreshToken);
userRouter.post('/forgot-password', controller.forgotPassword);
userRouter.post('/reset-password', controller.resetPassword);
userRouter.post('/oauth/google', controller.googleOAuth);
userRouter.get('/verify-email/:token', controller.verifyEmail);

// User routes (protected - auth middleware applied in index.ts)
userRouter.get('/me', controller.getCurrentUser);
userRouter.put('/me', controller.updateProfile);
userRouter.put('/me/password', controller.changePassword);
userRouter.post('/logout', controller.logout);
userRouter.post('/resend-verification', controller.resendVerification);
userRouter.delete('/me', controller.deleteAccount);
