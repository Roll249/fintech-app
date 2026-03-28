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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'edited')),
    linked_transaction_id UUID REFERENCES transactions(id),
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_fund_members_user_id ON fund_members(user_id);

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
