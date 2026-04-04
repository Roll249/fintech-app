-- Initialize database schema for Fintech App

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OAuth accounts table (for Google, GitHub, etc.)
CREATE TABLE IF NOT EXISTS oauth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

-- Bank accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bank_code VARCHAR(20) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'VND',
    type VARCHAR(20) DEFAULT 'checking' CHECK (type IN ('checking', 'savings', 'credit', 'investment')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'pending', 'error')),
    -- OAuth/Open Banking fields
    oauth_access_token TEXT,
    oauth_refresh_token TEXT,
    oauth_expires_at TIMESTAMP,
    external_account_id VARCHAR(100),
    last_synced_at TIMESTAMP,
    sync_error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Account sync history table
CREATE TABLE IF NOT EXISTS account_sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('success', 'failed', 'partial')),
    transactions_synced INTEGER DEFAULT 0,
    balance_before DECIMAL(15, 2),
    balance_after DECIMAL(15, 2),
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Transaction categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(20),
    type VARCHAR(20) CHECK (type IN ('income', 'expense', 'transfer')),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    category_id UUID REFERENCES categories(id),
    description TEXT,
    merchant_name VARCHAR(255),
    date DATE NOT NULL,
    is_manual BOOLEAN DEFAULT false,
    tags TEXT[],
    -- External transaction ID for deduplication (from bank sync)
    external_id VARCHAR(100),
    external_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    amount_limit DECIMAL(15, 2) NOT NULL,
    spent DECIMAL(15, 2) DEFAULT 0,
    period VARCHAR(20) DEFAULT 'monthly' CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    alert_threshold INTEGER DEFAULT 80,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bills table (for OCR)
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    ocr_raw_text TEXT,
    ocr_confidence DECIMAL(5, 2),
    merchant_name VARCHAR(255),
    total_amount DECIMAL(15, 2),
    bill_date DATE,
    items JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'edited', 'needs_review')),
    linked_transaction_id UUID REFERENCES transactions(id),
    -- OCR metadata
    ocr_provider VARCHAR(20) CHECK (ocr_provider IN ('google_vision', 'tesseract', 'manual')),
    ocr_attempts INTEGER DEFAULT 0,
    ocr_error_code VARCHAR(50),
    bill_type VARCHAR(30) CHECK (bill_type IN ('receipt', 'invoice', 'utility', 'restaurant', 'supermarket', 'ecommerce', 'unknown')),
    -- Additional extracted data
    tax_amount DECIMAL(15, 2),
    subtotal DECIMAL(15, 2),
    discount_amount DECIMAL(15, 2),
    payment_method VARCHAR(20),
    merchant_address TEXT,
    merchant_phone VARCHAR(20),
    merchant_tax_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bill reminders table
CREATE TABLE IF NOT EXISTS bill_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    remind_at TIMESTAMP NOT NULL,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recurring bills / auto-pay setup
CREATE TABLE IF NOT EXISTS recurring_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    merchant_name VARCHAR(255) NOT NULL,
    expected_amount DECIMAL(15, 2),
    category_id UUID REFERENCES categories(id),
    frequency VARCHAR(20) CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    next_due_date DATE,
    auto_pay_enabled BOOLEAN DEFAULT false,
    remind_days_before INTEGER DEFAULT 3,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Funds table (group savings)
CREATE TABLE IF NOT EXISTS funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) DEFAULT 0,
    cover_image_url TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'closed')),
    deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fund members table
CREATE TABLE IF NOT EXISTS fund_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    contribution DECIMAL(15, 2) DEFAULT 0,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fund_id, user_id)
);

-- Fund contributions table
CREATE TABLE IF NOT EXISTS fund_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('deposit', 'withdraw')),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    push_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    transaction_alerts BOOLEAN DEFAULT true,
    budget_alerts BOOLEAN DEFAULT true,
    fund_updates BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    quiet_hours_start TIME,
    quiet_hours_end TIME
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) CHECK (type IN ('monthly', 'yearly', 'custom')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
    summary JSONB,
    download_url TEXT,
    chart_urls JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Device tokens for FCM push notifications
CREATE TABLE IF NOT EXISTS device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    fcm_token VARCHAR(500) NOT NULL,
    platform VARCHAR(20) CHECK (platform IN ('android', 'ios', 'web')),
    device_name VARCHAR(100),
    app_version VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, fcm_token)
);

-- Push notification delivery log
CREATE TABLE IF NOT EXISTS push_delivery_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    device_token_id UUID REFERENCES device_tokens(id) ON DELETE SET NULL,
    fcm_message_id VARCHAR(255),
    status VARCHAR(20) CHECK (status IN ('sent', 'delivered', 'failed', 'invalid_token')),
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System settings (for admin)
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bank webhook events (for idempotency)
CREATE TABLE IF NOT EXISTS bank_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_code VARCHAR(20) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(50),
    payload JSONB,
    signature VARCHAR(255),
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bank_code, event_id)
);

-- Job queue for async processing (optional, if not using external queue)
CREATE TABLE IF NOT EXISTS job_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retry')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Merchants database (for OCR matching)
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    normalized_name VARCHAR(255) NOT NULL,
    aliases TEXT[],
    category_id UUID REFERENCES categories(id),
    logo_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_external_id ON transactions(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_fund_members_user_id ON fund_members(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX idx_bills_user_id ON bills(user_id);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bill_reminders_remind_at ON bill_reminders(remind_at) WHERE is_sent = false;
CREATE INDEX idx_job_queue_status ON job_queue(status, scheduled_at);
CREATE INDEX idx_bank_webhook_events_processed ON bank_webhook_events(processed, created_at);
CREATE INDEX idx_merchants_normalized_name ON merchants(normalized_name);
CREATE INDEX idx_account_sync_history_account_id ON account_sync_history(account_id);

-- Insert default categories
INSERT INTO categories (name, icon, color, type, is_system) VALUES
('Food & Dining', 'restaurant', '#FF5722', 'expense', true),
('Transportation', 'directions_car', '#2196F3', 'expense', true),
('Shopping', 'shopping_bag', '#E91E63', 'expense', true),
('Entertainment', 'movie', '#9C27B0', 'expense', true),
('Bills & Utilities', 'receipt', '#607D8B', 'expense', true),
('Health', 'local_hospital', '#4CAF50', 'expense', true),
('Education', 'school', '#3F51B5', 'expense', true),
('Travel', 'flight', '#00BCD4', 'expense', true),
('Salary', 'account_balance_wallet', '#4CAF50', 'income', true),
('Investment', 'trending_up', '#8BC34A', 'income', true),
('Gift', 'card_giftcard', '#FF9800', 'income', true),
('Other Income', 'attach_money', '#CDDC39', 'income', true),
('Transfer', 'swap_horiz', '#9E9E9E', 'transfer', true);

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
('ocr_provider', '"google_vision"', 'Primary OCR provider: google_vision or tesseract'),
('ocr_fallback_enabled', 'true', 'Enable fallback to Tesseract when Vision fails'),
('ocr_confidence_threshold', '60', 'Minimum confidence score to auto-accept OCR results'),
('push_enabled', 'true', 'Enable push notifications globally'),
('email_enabled', 'true', 'Enable email notifications globally'),
('bank_sync_interval_minutes', '5', 'Interval for bank data sync polling'),
('max_devices_per_user', '5', 'Maximum FCM devices per user');

-- Insert common merchants for OCR matching
INSERT INTO merchants (name, normalized_name, aliases) VALUES
('Circle K', 'circle_k', ARRAY['CircleK', 'CIRCLE K VIETNAM']),
('Vinmart', 'vinmart', ARRAY['VinMart', 'VINMART', 'Vinmart+']),
('Co.opmart', 'coopmart', ARRAY['Coopmart', 'CO.OPMART', 'Co-opmart']),
('Big C', 'big_c', ARRAY['BigC', 'BIG C', 'Big C Việt Nam']),
('Lotte Mart', 'lotte_mart', ARRAY['LotteMart', 'LOTTE MART']),
('GrabFood', 'grabfood', ARRAY['Grab Food', 'GRABFOOD']),
('ShopeeFood', 'shopeefood', ARRAY['Shopee Food', 'SHOPEEFOOD']),
('Highlands Coffee', 'highlands_coffee', ARRAY['HIGHLANDS COFFEE', 'Highlands']),
('The Coffee House', 'the_coffee_house', ARRAY['THE COFFEE HOUSE', 'TCH']),
('Starbucks', 'starbucks', ARRAY['STARBUCKS', 'Starbucks Coffee']),
('Phuc Long', 'phuc_long', ARRAY['PHUC LONG', 'Phúc Long']),
('McDonald''s', 'mcdonalds', ARRAY['McDonalds', 'MCDONALDS', 'Mcdonald''s']),
('KFC', 'kfc', ARRAY['Kentucky Fried Chicken']),
('Lotteria', 'lotteria', ARRAY['LOTTERIA']),
('Pizza Hut', 'pizza_hut', ARRAY['PIZZA HUT', 'PizzaHut']),
('Điện Máy Xanh', 'dien_may_xanh', ARRAY['DIEN MAY XANH', 'DMX']),
('Thế Giới Di Động', 'the_gioi_di_dong', ARRAY['THE GIOI DI DONG', 'TGDD']),
('FPT Shop', 'fpt_shop', ARRAY['FPTSHOP', 'FPT SHOP']),
('Pharmacity', 'pharmacity', ARRAY['PHARMACITY']),
('Long Châu', 'long_chau', ARRAY['LONG CHAU', 'Nhà Thuốc Long Châu']);

-- Create admin user (password: admin123 - should be changed)
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@fintechapp.com', '$2a$10$rQnM1.xG8LxhwF5Xx5Xt8.Y3z0V2WQZJ1qK3mN5pR7tU9vX1yZ3A', 'System Admin', 'admin')
ON CONFLICT (email) DO NOTHING;
