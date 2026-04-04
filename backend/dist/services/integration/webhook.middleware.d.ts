import { Request, Response, NextFunction } from 'express';
export interface WebhookRequest extends Request {
    rawBody?: string;
    bankCode?: string;
}
/**
 * Middleware to verify bank webhook signatures using HMAC-SHA256.
 * Expects:
 * - X-Bank-Signature header: HMAC signature
 * - X-Bank-Timestamp header: Request timestamp
 * - bankCode from route params
 *
 * Signature is computed as: HMAC-SHA256(timestamp + "." + body, secret)
 */
export declare const verifyBankSignature: (bankCode: string) => (req: WebhookRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware factory that extracts bankCode from route params
 */
export declare const verifyBankSignatureFromParams: () => (req: WebhookRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware to capture raw request body for signature verification.
 * Must be used before body parsing middleware.
 */
export declare const captureRawBody: (req: WebhookRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=webhook.middleware.d.ts.map