import admin from 'firebase-admin';
import { query } from '../../shared/db.js';
import { PushNotification, PushData, SendResult } from './notification.types.js';

class FirebaseService {
  private initialized = false;

  // Firebase credentials from environment
  private get FIREBASE_PROJECT_ID(): string | undefined {
    return process.env.FIREBASE_PROJECT_ID;
  }

  private get FIREBASE_CLIENT_EMAIL(): string | undefined {
    return process.env.FIREBASE_CLIENT_EMAIL;
  }

  private get FIREBASE_PRIVATE_KEY(): string | undefined {
    // Private key may have escaped newlines in env var
    const key = process.env.FIREBASE_PRIVATE_KEY;
    return key ? key.replace(/\\n/g, '\n') : undefined;
  }

  initializeFirebase(): boolean {
    if (this.initialized) {
      return true;
    }

    if (!this.FIREBASE_PROJECT_ID || !this.FIREBASE_CLIENT_EMAIL || !this.FIREBASE_PRIVATE_KEY) {
      console.warn('Firebase credentials not configured. Push notifications disabled.');
      return false;
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.FIREBASE_PROJECT_ID,
          clientEmail: this.FIREBASE_CLIENT_EMAIL,
          privateKey: this.FIREBASE_PRIVATE_KEY,
        }),
      });
      this.initialized = true;
      console.log('🔥 Firebase initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      return false;
    }
  }

  async sendPushNotification(
    tokens: string[],
    notification: PushNotification,
    data?: PushData
  ): Promise<SendResult> {
    if (!this.initialized) {
      if (!this.initializeFirebase()) {
        return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
      }
    }

    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'fintech_notifications',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      return this.handleSendResult(response, tokens);
    } catch (error) {
      console.error('Push notification error:', error);
      return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
    }
  }

  handleSendResult(
    result: admin.messaging.BatchResponse,
    tokens: string[]
  ): SendResult {
    const invalidTokens: string[] = [];

    result.responses.forEach((response, index) => {
      if (!response.success && response.error) {
        const errorCode = response.error.code;
        // These error codes indicate the token is no longer valid
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    // Remove invalid tokens from database
    if (invalidTokens.length > 0) {
      this.removeInvalidTokens(invalidTokens).catch((err) =>
        console.error('Failed to remove invalid tokens:', err)
      );
    }

    return {
      successCount: result.successCount,
      failureCount: result.failureCount,
      invalidTokens,
    };
  }

  private async removeInvalidTokens(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;

    const placeholders = tokens.map((_, i) => `$${i + 1}`).join(', ');
    await query(`DELETE FROM device_tokens WHERE fcm_token IN (${placeholders})`, tokens);
    console.log(`Removed ${tokens.length} invalid FCM tokens`);
  }

  async sendToUser(
    userId: string,
    notification: PushNotification,
    data?: PushData
  ): Promise<SendResult> {
    try {
      // Get all tokens for this user
      const result = await query(
        'SELECT fcm_token FROM device_tokens WHERE user_id = $1',
        [userId]
      );

      const tokens = result.rows.map((row) => row.fcm_token);

      if (tokens.length === 0) {
        return { successCount: 0, failureCount: 0, invalidTokens: [] };
      }

      return await this.sendPushNotification(tokens, notification, data);
    } catch (error) {
      console.error('Send to user error:', error);
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }
  }
}

export const firebaseService = new FirebaseService();
