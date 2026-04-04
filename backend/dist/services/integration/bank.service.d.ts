export interface SupportedBank {
    code: string;
    name: string;
    oauthUrl: string;
    apiUrl: string;
}
export interface BankTransaction {
    externalId: string;
    amount: number;
    type: 'income' | 'expense';
    description: string;
    merchantName?: string;
    date: string;
    metadata?: Record<string, any>;
}
export interface WebhookPayload {
    eventId: string;
    eventType: string;
    accountNumber?: string;
    balance?: number;
    transactions?: BankTransaction[];
    timestamp: string;
}
export declare const SUPPORTED_BANKS: SupportedBank[];
export declare class BankService {
    getBankByCode(code: string): SupportedBank | undefined;
    processWebhookPayload(bankCode: string, payload: WebhookPayload): Promise<{
        processed: boolean;
        message: string;
    }>;
    createTransactionsFromBank(accountId: string, userId: string, transactions: BankTransaction[]): Promise<number>;
    syncAccountBalance(accountId: string, balance: number): Promise<void>;
    generateOAuthUrl(bankCode: string, accountId: string, redirectUrl: string): string | null;
    private generateOAuthState;
    verifyOAuthState(state: string): {
        valid: boolean;
        accountId?: string;
    };
    private getBankClientId;
    getBankWebhookSecret(bankCode: string): string;
    storeOAuthTokens(accountId: string, bankCode: string, accessToken: string, refreshToken: string, expiresIn: number): Promise<void>;
    getConnectionStatus(accountId: string, userId: string): Promise<{
        connected: boolean;
        status: string;
        lastSyncedAt: string | null;
        bankCode: string | null;
        bankName: string | null;
    } | null>;
}
//# sourceMappingURL=bank.service.d.ts.map