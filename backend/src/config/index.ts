export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://fintech:fintech123@localhost:5433/fintech_db',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string,
    refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as string,
  },
  
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
  },
  
  ocr: {
    lang: process.env.TESSERACT_LANG || 'vie+eng',
    provider: process.env.OCR_PROVIDER || 'tesseract', // 'google_vision' | 'tesseract'
    fallbackEnabled: process.env.OCR_FALLBACK_ENABLED !== 'false',
    confidenceThreshold: parseInt(process.env.OCR_CONFIDENCE_THRESHOLD || '60', 10),
    autoAcceptThreshold: parseInt(process.env.OCR_AUTO_ACCEPT_THRESHOLD || '85', 10),
  },
  
  vision: {
    enabled: process.env.GOOGLE_VISION_ENABLED === 'true' || process.env.VISION_ENABLED !== 'false',
    projectId: process.env.GOOGLE_PROJECT_ID,
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    maxRetries: parseInt(process.env.VISION_MAX_RETRIES || '2', 10),
    timeoutMs: parseInt(process.env.VISION_TIMEOUT_MS || '30000', 10),
    confidenceThreshold: parseInt(process.env.OCR_CONFIDENCE_THRESHOLD || '60', 10),
  },
  
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    databaseUrl: process.env.FIREBASE_DATABASE_URL,
  },
  
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'noreply@fintechapp.com',
  },
  
  bank: {
    webhookSecret: process.env.BANK_WEBHOOK_SECRET || 'dev-webhook-secret',
    syncIntervalMinutes: parseInt(process.env.BANK_SYNC_INTERVAL_MINUTES || '5', 10),
    oauthClientId: process.env.BANK_OAUTH_CLIENT_ID,
    oauthClientSecret: process.env.BANK_OAUTH_CLIENT_SECRET,
  },
  
  chart: {
    provider: process.env.CHART_PROVIDER || 'quickchart', // 'quickchart' | 'chartcuterie'
    apiUrl: process.env.QUICKCHART_API_URL || 'https://quickchart.io',
    cacheTtlSeconds: parseInt(process.env.CHART_CACHE_TTL || '3600', 10),
  },
  
  queue: {
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5', 10),
    maxRetries: parseInt(process.env.QUEUE_MAX_RETRIES || '3', 10),
  },
  
  security: {
    maxDevicesPerUser: parseInt(process.env.MAX_DEVICES_PER_USER || '5', 10),
    passwordResetExpireMinutes: parseInt(process.env.PASSWORD_RESET_EXPIRE_MINUTES || '60', 10),
    webhookTimestampToleranceSeconds: parseInt(process.env.WEBHOOK_TIMESTAMP_TOLERANCE || '300', 10),
  },
};
