import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { BankService } from './bank.service.js';

const bankService = new BankService();

const MAX_TIMESTAMP_DIFF_MS = 5 * 60 * 1000; // 5 minutes

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
export const verifyBankSignature = (bankCode: string) => {
  return (req: WebhookRequest, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers['x-bank-signature'] as string;
      const timestamp = req.headers['x-bank-timestamp'] as string;

      if (!signature) {
        return res.status(401).json({ error: 'Missing X-Bank-Signature header' });
      }

      if (!timestamp) {
        return res.status(401).json({ error: 'Missing X-Bank-Timestamp header' });
      }

      // Validate timestamp is within acceptable range
      const timestampMs = parseInt(timestamp, 10);
      if (isNaN(timestampMs)) {
        return res.status(401).json({ error: 'Invalid timestamp format' });
      }

      const now = Date.now();
      const diff = Math.abs(now - timestampMs);

      if (diff > MAX_TIMESTAMP_DIFF_MS) {
        return res.status(401).json({ error: 'Request timestamp is too old or in the future' });
      }

      // Get the secret for this bank
      const secret = bankService.getBankWebhookSecret(bankCode);
      if (!secret) {
        console.error(`No webhook secret configured for bank: ${bankCode}`);
        return res.status(500).json({ error: 'Bank configuration error' });
      }

      // Get raw body for signature verification
      const rawBody = req.rawBody || JSON.stringify(req.body);

      // Compute expected signature: HMAC-SHA256(timestamp + "." + body, secret)
      const payload = `${timestamp}.${rawBody}`;
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

      // Constant-time comparison to prevent timing attacks
      const signatureBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      if (signatureBuffer.length !== expectedBuffer.length) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Attach bank code to request for downstream handlers
      req.bankCode = bankCode;

      next();
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return res.status(500).json({ error: 'Signature verification failed' });
    }
  };
};

/**
 * Middleware factory that extracts bankCode from route params
 */
export const verifyBankSignatureFromParams = () => {
  return (req: WebhookRequest, res: Response, next: NextFunction) => {
    const bankCode = req.params.bankCode;

    if (!bankCode) {
      return res.status(400).json({ error: 'Missing bank code' });
    }

    // Validate bank code exists
    const bank = bankService.getBankByCode(bankCode);
    if (!bank) {
      return res.status(400).json({ error: 'Unsupported bank' });
    }

    // Use the verifyBankSignature middleware with extracted bankCode
    return verifyBankSignature(bankCode)(req, res, next);
  };
};

/**
 * Middleware to capture raw request body for signature verification.
 * Must be used before body parsing middleware.
 */
export const captureRawBody = (req: WebhookRequest, res: Response, next: NextFunction) => {
  let data = '';

  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    data += chunk;
  });

  req.on('end', () => {
    req.rawBody = data;
    try {
      req.body = data ? JSON.parse(data) : {};
    } catch (e) {
      req.body = {};
    }
    next();
  });
};
