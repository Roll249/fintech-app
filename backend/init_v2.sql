-- =====================================================
-- FINTECH APP V2 - COMPLETE DATABASE SCHEMA
-- =====================================================
-- Phiên bản mới với:
-- - Simulated Banks (10 ngân hàng)
-- - Allocation Rules cho tự động chia tiền
-- - QR Code System
-- - Fund Management nâng cao
-- - Simulation Commands
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- REFRESH TOKENS
-- =====================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PASSWORD RESET TOKENS
-- =====================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SIMULATED BANKS (10 ngân hàng)
-- =====================================================
CREATE TABLE IF NOT EXISTS simulated_banks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    logo_url TEXT,
    color VARCHAR(20),
    qr_prefix VARCHAR(20),
    mock_balance DECIMAL(15, 0) DEFAULT 10000000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SIMULATED BANK ACCOUNTS (tài khoản trong mỗi ngân hàng)
-- =====================================================
CREATE TABLE IF NOT EXISTS simulated_bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bank_id UUID REFERENCES simulated_banks(id) ON DELETE CASCADE,
    account_number VARCHAR(50) NOT NULL,
    account_holder VARCHAR(255) NOT NULL,
    balance DECIMAL(15, 0) DEFAULT 10000000,
    currency VARCHAR(10) DEFAULT 'VND',
    mock_access_token TEXT,
    mock_refresh_token TEXT,
    token_expires_at TIMESTAMP,
    last_synced_at TIMESTAMP,
    is_connected BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, bank_id, account_number)
);

-- =====================================================
-- SIMULATED BANK TRANSACTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS simulated_bank_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_account_id UUID REFERENCES simulated_bank_accounts(id) ON DELETE CASCADE,
    transaction_ref VARCHAR(50) UNIQUE,
    amount DECIMAL(15, 0) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('IN', 'OUT')),
    description TEXT,
    counterparty_account VARCHAR(50),
    counterparty_name VARCHAR(255),
    transaction_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- USER ACCOUNTS (tài khoản chính trong app)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bank_account_id UUID REFERENCES simulated_bank_accounts(id) ON DELETE SET NULL,
    account_type VARCHAR(20) DEFAULT 'primary' CHECK (account_type IN ('primary', 'savings')),
    balance DECIMAL(15, 0) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'VND',
    name VARCHAR(100) DEFAULT 'Tài khoản chính',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, bank_account_id)
);

-- =====================================================
-- TRANSACTION CATEGORIES
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(20),
    type VARCHAR(20) CHECK (type IN ('income', 'expense', 'transfer')),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- FUNDS (quỹ tiết kiệm/chi tiêu)
-- =====================================================
CREATE TABLE IF NOT EXISTS funds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(15, 0),
    current_amount DECIMAL(15, 0) DEFAULT 0,
    icon VARCHAR(50) DEFAULT 'savings',
    color VARCHAR(20) DEFAULT '#4CAF50',
    fund_type VARCHAR(20) DEFAULT 'PERSONAL' CHECK (fund_type IN ('PERSONAL', 'GROUP')),
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- FUND MEMBERS (thành viên quỹ nhóm)
-- =====================================================
CREATE TABLE IF NOT EXISTS fund_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    contribution DECIMAL(15, 0) DEFAULT 0,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fund_id, user_id)
);

-- =====================================================
-- FUND CONTRIBUTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS fund_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 0) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('deposit', 'withdraw')),
    source_transaction_id UUID,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ALLOCATION RULES (quy tắc tự động chia tiền)
-- =====================================================
CREATE TABLE IF NOT EXISTS allocation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    priority INTEGER DEFAULT 1,
    conditions JSONB NOT NULL DEFAULT '{}',
    allocations JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ALLOCATION RULES CONDITIONS STRUCTURE:
-- {
--   "minAmount": 100000,
--   "maxAmount": 10000000,
--   "source": "SALARY" | "BANK_TRANSFER" | "QR_RECEIVE" | "OTHER"
-- }

-- ALLOCATION RULES ALLOCATIONS STRUCTURE:
-- [
--   { "fundId": "uuid", "type": "PERCENTAGE", "value": 30 },
--   { "fundId": "uuid", "type": "FIXED", "value": 500000 }
-- ]

-- =====================================================
-- APP TRANSACTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount DECIMAL(15, 0) NOT NULL,
    category_id UUID REFERENCES categories(id),
    description TEXT,
    fund_id UUID REFERENCES funds(id) ON DELETE SET NULL,
    counterparty_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    counterparty_name VARCHAR(255),
    source VARCHAR(50) DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'QR_RECEIVE', 'QR_SEND', 'BANK_TRANSFER', 'SALARY', 'AUTO_ALLOCATION')),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    transaction_ref VARCHAR(50) UNIQUE,
    metadata JSONB DEFAULT '{}',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- QR CODES (lịch sử QR đã tạo)
-- =====================================================
CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    qr_type VARCHAR(20) NOT NULL CHECK (qr_type IN ('RECEIVE', 'TRANSFER', 'BILL')),
    payload JSONB NOT NULL,
    signature VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 0),
    expires_at TIMESTAMP,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP,
    used_transaction_id UUID REFERENCES transactions(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INSUFFICIENT FUND EVENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS insufficient_fund_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id),
    requested_amount DECIMAL(15, 0) NOT NULL,
    available_amount DECIMAL(15, 0) NOT NULL,
    shortfall_amount DECIMAL(15, 0) NOT NULL,
    primary_fund_id UUID REFERENCES funds(id),
    secondary_fund_id UUID REFERENCES funds(id),
    secondary_amount DECIMAL(15, 0),
    user_decision VARCHAR(50) CHECK (user_decision IN ('AUTO_TOPUP', 'MANUAL_TOPUP', 'DECLINED', 'PENDING')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- DEVICE TOKENS (FCM)
-- =====================================================
CREATE TABLE IF NOT EXISTS device_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- =====================================================
-- SIMULATION EVENTS LOG (cho admin trigger events)
-- =====================================================
CREATE TABLE IF NOT EXISTS simulation_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- =====================================================
-- AUDIT LOGS
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_fund_id ON transactions(fund_id);
CREATE INDEX idx_funds_user_id ON funds(user_id);
CREATE INDEX idx_fund_members_user_id ON fund_members(user_id);
CREATE INDEX idx_fund_members_fund_id ON fund_members(fund_id);
CREATE INDEX idx_fund_contributions_fund_id ON fund_contributions(fund_id);
CREATE INDEX idx_fund_contributions_user_id ON fund_contributions(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_allocation_rules_user_id ON allocation_rules(user_id);
CREATE INDEX idx_simulated_bank_accounts_user_id ON simulated_bank_accounts(user_id);
CREATE INDEX idx_simulated_bank_transactions_account_id ON simulated_bank_transactions(bank_account_id);
CREATE INDEX idx_qr_codes_user_id ON qr_codes(user_id);
CREATE INDEX idx_qr_codes_signature ON qr_codes(signature);
CREATE INDEX idx_simulation_events_user_id ON simulation_events(user_id);
CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert 10 simulated banks
INSERT INTO simulated_banks (code, name, logo_url, color, qr_prefix, mock_balance) VALUES
    ('VCB', 'Vietcombank', '/assets/banks/vcb.png', '#E31837', '970436', 10000000),
    ('VTB', 'VietinBank', '/assets/banks/vtb.png', '#00A651', '970415', 10000000),
    ('BIDV', 'BIDV', '/assets/banks/bidv.png', '#FFD700', '970418', 10000000),
    ('TPB', 'TPBank', '/assets/banks/tpb.png', '#FF6600', '970423', 10000000),
    ('ACB', 'ACB', '/assets/banks/acb.png', '#003366', '970416', 10000000),
    ('MB', 'MBBank', '/assets/banks/mb.png', '#660099', '970422', 10000000),
    ('SHB', 'SHB', '/assets/banks/shb.png', '#996633', '970429', 10000000),
    ('OCB', 'OCB', '/assets/banks/ocb.png', '#003399', '970448', 10000000),
    ('HDB', 'HDBank', '/assets/banks/hdb.png', '#00CC66', '970437', 10000000),
    ('VIB', 'VIB', '/assets/banks/vib.png', '#CC0033', '970441', 10000000)
ON CONFLICT (code) DO NOTHING;

-- Insert default categories
INSERT INTO categories (name, icon, color, type, is_system) VALUES
    ('Ăn uống', 'restaurant', '#FF5722', 'expense', true),
    ('Di chuyển', 'directions_car', '#2196F3', 'expense', true),
    ('Mua sắm', 'shopping_bag', '#E91E63', 'expense', true),
    ('Giải trí', 'movie', '#9C27B0', 'expense', true),
    ('Hóa đơn', 'receipt', '#607D8B', 'expense', true),
    ('Sức khỏe', 'local_hospital', '#4CAF50', 'expense', true),
    ('Giáo dục', 'school', '#3F51B5', 'expense', true),
    ('Du lịch', 'flight', '#00BCD4', 'expense', true),
    ('Lương', 'account_balance_wallet', '#4CAF50', 'income', true),
    ('Đầu tư', 'trending_up', '#8BC34A', 'income', true),
    ('Quà tặng', 'card_giftcard', '#FF9800', 'income', true),
    ('Chuyển tiền', 'swap_horiz', '#9E9E9E', 'transfer', true),
    ('Khác', 'more_horiz', '#9E9E9E', 'expense', true)
ON CONFLICT DO NOTHING;

-- Create admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role) VALUES
    ('admin@fintechapp.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Admin', 'admin')
ON CONFLICT (email) DO NOTHING;
