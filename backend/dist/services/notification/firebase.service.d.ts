import admin from 'firebase-admin';
import { PushNotification, PushData, SendResult } from './notification.types.js';
declare class FirebaseService {
    private initialized;
    private get FIREBASE_PROJECT_ID();
    private get FIREBASE_CLIENT_EMAIL();
    private get FIREBASE_PRIVATE_KEY();
    initializeFirebase(): boolean;
    sendPushNotification(tokens: string[], notification: PushNotification, data?: PushData): Promise<SendResult>;
    handleSendResult(result: admin.messaging.BatchResponse, tokens: string[]): SendResult;
    private removeInvalidTokens;
    sendToUser(userId: string, notification: PushNotification, data?: PushData): Promise<SendResult>;
}
export declare const firebaseService: FirebaseService;
export {};
//# sourceMappingURL=firebase.service.d.ts.map