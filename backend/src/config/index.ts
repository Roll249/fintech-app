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
  },
  
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};
