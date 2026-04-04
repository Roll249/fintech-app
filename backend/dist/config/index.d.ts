export declare const config: {
    port: number;
    nodeEnv: string;
    database: {
        url: string;
    };
    redis: {
        url: string;
    };
    kafka: {
        brokers: string[];
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    upload: {
        dir: string;
        maxFileSize: number;
    };
    ocr: {
        lang: string;
        provider: string;
        fallbackEnabled: boolean;
        confidenceThreshold: number;
        autoAcceptThreshold: number;
    };
    vision: {
        enabled: boolean;
        projectId: string | undefined;
        clientEmail: string | undefined;
        privateKey: string | undefined;
        maxRetries: number;
        timeoutMs: number;
        confidenceThreshold: number;
    };
    firebase: {
        projectId: string | undefined;
        clientEmail: string | undefined;
        privateKey: string | undefined;
        databaseUrl: string | undefined;
    };
    smtp: {
        host: string;
        port: number;
        user: string | undefined;
        pass: string | undefined;
        from: string;
    };
    bank: {
        webhookSecret: string;
        syncIntervalMinutes: number;
        oauthClientId: string | undefined;
        oauthClientSecret: string | undefined;
    };
    chart: {
        provider: string;
        apiUrl: string;
        cacheTtlSeconds: number;
    };
    queue: {
        concurrency: number;
        maxRetries: number;
    };
    security: {
        maxDevicesPerUser: number;
        passwordResetExpireMinutes: number;
        webhookTimestampToleranceSeconds: number;
    };
};
//# sourceMappingURL=index.d.ts.map