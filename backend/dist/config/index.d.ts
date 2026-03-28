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
    };
    smtp: {
        host: string;
        port: number;
        user: string | undefined;
        pass: string | undefined;
    };
};
//# sourceMappingURL=index.d.ts.map