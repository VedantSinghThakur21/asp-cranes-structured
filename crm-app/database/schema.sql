-- ASP Cranes CRM Database Schema
-- Production-ready SQL schema for ASP Cranes CRM application

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "hstore";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search optimization

-- ========== FUNCTIONS ==========

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- ========== USERS & AUTHENTICATION ==========

-- Create users table
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    uid VARCHAR(50) PRIMARY KEY DEFAULT 'usr_' || SUBSTRING(uuid_generate_v4()::text FROM 1 FOR 8),
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'sales_agent', 'operations_manager', 'operator', 'support')),
    avatar VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at
CREATE TRIGGER update_users_updated_at 
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create authentication tokens table for JWT refresh tokens
CREATE TABLE IF NOT EXISTS auth_tokens (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(uid) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    device_info JSONB
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expiry ON auth_tokens(expires_at);

-- ========== CUSTOMERS ==========

-- Create customers table
DROP TABLE IF EXISTS customers CASCADE;
CREATE TABLE customers (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'cust_' || SUBSTRING(uuid_generate_v4()::text FROM 1 FOR 8),
    name VARCHAR(100) NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    type VARCHAR(50) CHECK (type IN ('construction', 'property_developer', 'manufacturing', 'government', 'other')),
    designation VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at
CREATE TRIGGER update_customers_updated_at 
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create contacts table (additional customer contacts)
DROP TABLE IF EXISTS contacts CASCADE;
CREATE TABLE contacts (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'cont_' || SUBSTRING(uuid_generate_v4()::text FROM 1 FOR 8),
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at and index
CREATE TRIGGER update_contacts_updated_at 
BEFORE UPDATE ON contacts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_contacts_customer_id ON contacts(customer_id);

-- ========== LEADS ==========

-- Create leads table
DROP TABLE IF EXISTS leads CASCADE;
CREATE TABLE leads (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'lead_' || SUBSTRING(uuid_generate_v4()::text FROM 1 FOR 8),
    customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(100),
    email VARCHAR(255) NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone VARCHAR(20) NOT NULL,
    address VARCHAR(255),
    service_needed TEXT NOT NULL,
    site_location TEXT NOT NULL,
    start_date DATE NOT NULL,
    rental_days INTEGER NOT NULL CHECK (rental_days > 0),
    shift_timing VARCHAR(50),
    status VARCHAR(20) NOT NULL CHECK (status IN ('new', 'in_process', 'qualified', 'unqualified', 'lost', 'converted')),
    source VARCHAR(20) CHECK (source IN ('website', 'referral', 'direct', 'social', 'email', 'phone', 'other')),
    assigned_to VARCHAR(50) NOT NULL REFERENCES users(uid) ON DELETE SET NULL,
    designation VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    files JSONB,
    notes TEXT
);

-- Create trigger for updated_at and indexes
CREATE TRIGGER update_leads_updated_at 
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- ========== DEALS ==========

-- Create deals table
DROP TABLE IF EXISTS deals CASCADE;
CREATE TABLE deals (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'deal_' || SUBSTRING(uuid_generate_v4()::text FROM 1 FOR 8),
    lead_id VARCHAR(50) REFERENCES leads(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    value NUMERIC(12, 2) NOT NULL CHECK (value >= 0),
    stage VARCHAR(20) NOT NULL CHECK (stage IN ('qualification', 'proposal', 'negotiation', 'won', 'lost')),
    created_by VARCHAR(50) NOT NULL REFERENCES users(uid) ON DELETE SET NULL,
    assigned_to VARCHAR(50) NOT NULL REFERENCES users(uid) ON DELETE SET NULL,
    probability INTEGER CHECK (probability BETWEEN 0 AND 100),
    expected_close_date DATE,
    customer_contact JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at and indexes
CREATE TRIGGER update_deals_updated_at 
BEFORE UPDATE ON deals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_deals_customer_id ON deals(customer_id);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_created_by ON deals(created_by);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);

-- ========== EQUIPMENT ==========

-- Create equipment table
DROP TABLE IF EXISTS equipment CASCADE;
CREATE TABLE equipment (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'equ_' || SUBSTRING(uuid_generate_v4()::text FROM 1 FOR 8),
    equipment_id VARCHAR(50) UNIQUE NOT NULL, -- Business identifier (e.g., EQ0001)
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('mobile_crane', 'tower_crane', 'crawler_crane', 'pick_and_carry_crane')),
    manufacturing_date DATE NOT NULL, -- manufacturing date
    registration_date DATE NOT NULL, -- registration date
    max_lifting_capacity NUMERIC(10, 2) NOT NULL CHECK (max_lifting_capacity > 0), -- in tons
    unladen_weight NUMERIC(10, 2) NOT NULL CHECK (unladen_weight > 0), -- in tons
    base_rate_micro NUMERIC(10, 2) CHECK (base_rate_micro >= 0),
    base_rate_small NUMERIC(10, 2) CHECK (base_rate_small >= 0),
    base_rate_monthly NUMERIC(10, 2) CHECK (base_rate_monthly >= 0),
    base_rate_yearly NUMERIC(10, 2) CHECK (base_rate_yearly >= 0),
    running_cost_per_km NUMERIC(10, 2) CHECK (running_cost_per_km >= 0),
    running_cost NUMERIC(10, 2) CHECK (running_cost >= 0),
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at and indexes
CREATE TRIGGER update_equipment_updated_at 
BEFORE UPDATE ON equipment
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);

-- ========== QUOTATIONS ==========

-- Create quotation templates table
CREATE TABLE IF NOT EXISTS quotation_templates (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'qtpl_' || SUBSTRING(uuid_generate_v4()::text FROM 1 FOR 8),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(50) NOT NULL REFERENCES users(uid) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at
CREATE TRIGGER update_quotation_templates_updated_at 
BEFORE UPDATE ON quotation_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_quotation_templates_created_by ON quotation_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_quotation_templates_is_default ON quotation_templates(is_default);

-- Create quotations table
DROP TABLE IF EXISTS quotations CASCADE;
CREATE TABLE quotations (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'quot_' || SUBSTRING(uuid_generate_v4()::text FROM 1 FOR 8),
    quotation_number VARCHAR,
    deal_id VARCHAR(50) REFERENCES deals(id) ON DELETE SET NULL,
    lead_id VARCHAR(50) REFERENCES leads(id) ON DELETE SET NULL,
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    machine_type VARCHAR(100) NOT NULL,
    order_type VARCHAR(50) NOT NULL CHECK (order_type IN ('micro', 'small', 'monthly', 'yearly')),
    number_of_days INTEGER NOT NULL CHECK (number_of_days > 0),
    working_hours INTEGER NOT NULL CHECK (working_hours > 0),
    food_resources INTEGER NOT NULL DEFAULT 0 CHECK (food_resources >= 0),
    accom_resources INTEGER NOT NULL DEFAULT 0 CHECK (accom_resources >= 0),
    site_distance NUMERIC(10, 2) NOT NULL CHECK (site_distance >= 0),
    usage VARCHAR(20) NOT NULL CHECK (usage IN ('normal', 'heavy')),
    risk_factor VARCHAR(20) NOT NULL CHECK (risk_factor IN ('low', 'medium', 'high')),
    shift VARCHAR(20) NOT NULL CHECK (shift IN ('single', 'double')),
    day_night VARCHAR(20) NOT NULL CHECK (day_night IN ('day', 'night')),
    mob_demob NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (mob_demob >= 0),
    mob_relaxation NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (mob_relaxation >= 0),
    extra_charge NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (extra_charge >= 0),
    other_factors_charge NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (other_factors_charge >= 0),
    billing VARCHAR(20) NOT NULL CHECK (billing IN ('gst', 'non_gst')),
    include_gst BOOLEAN NOT NULL DEFAULT TRUE,
    sunday_working VARCHAR(10) NOT NULL CHECK (sunday_working IN ('yes', 'no')),
    customer_contact JSONB NOT NULL,
    incidental_charges TEXT[],
    other_factors TEXT[],
    total_rent NUMERIC(12, 2) NOT NULL CHECK (total_rent >= 0),
    total_cost NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
    working_cost NUMERIC(12, 2) CHECK (working_cost >= 0),
    mob_demob_cost NUMERIC(12, 2) CHECK (mob_demob_cost >= 0),
    food_accom_cost NUMERIC(12, 2) CHECK (food_accom_cost >= 0),
    usage_load_factor NUMERIC(10, 2) CHECK (usage_load_factor >= 0),
    risk_adjustment NUMERIC(10, 2) CHECK (risk_adjustment >= 0),
    gst_amount NUMERIC(10, 2) CHECK (gst_amount >= 0),
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    created_by VARCHAR(50) NOT NULL REFERENCES users(uid) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
    template_id VARCHAR(50) REFERENCES quotation_templates(id) ON DELETE SET NULL,
    terms_conditions TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Business logic constraints
    CONSTRAINT quotation_must_have_deal_or_lead CHECK (deal_id IS NOT NULL OR lead_id IS NOT NULL)
);

-- Create trigger for updated_at and indexes
CREATE TRIGGER update_quotations_updated_at 
BEFORE UPDATE ON quotations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_lead_id ON quotations(lead_id);
CREATE INDEX IF NOT EXISTS idx_quotations_deal_id ON quotations(deal_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_order_type ON quotations(order_type);
CREATE INDEX IF NOT EXISTS idx_quotations_created_by ON quotations(created_by);

-- Create quotation machines junction table
DROP TABLE IF EXISTS quotation_machines CASCADE;
CREATE TABLE quotation_machines (
    id SERIAL PRIMARY KEY,
    quotation_id VARCHAR(50) NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    equipment_id VARCHAR(50) NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    base_rate NUMERIC(10, 2) NOT NULL CHECK (base_rate >= 0),
    running_cost_per_km NUMERIC(10, 2) CHECK (running_cost_per_km >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quotation_machines_quotation_id ON quotation_machines(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_machines_equipment_id ON quotation_machines(equipment_id);

-- ========== JOBS ==========

-- Create jobs table
DROP TABLE IF EXISTS jobs CASCADE;
CREATE TABLE jobs (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'job_' || SUBSTRING(uuid_generate_v4()::text FROM 1 FOR 8),
    title VARCHAR(255) NOT NULL,
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    deal_id VARCHAR(50) REFERENCES deals(id) ON DELETE SET NULL,
    lead_id VARCHAR(50) REFERENCES leads(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')),
    scheduled_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start_date TIMESTAMP WITH TIME ZONE,
    actual_end_date TIMESTAMP WITH TIME ZONE,
    location TEXT NOT NULL,
    notes TEXT,
    created_by VARCHAR(50) NOT NULL REFERENCES users(uid) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at and indexes
CREATE TRIGGER update_jobs_updated_at 
BEFORE UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_deal_id ON jobs(deal_id);
CREATE INDEX IF NOT EXISTS idx_jobs_lead_id ON jobs(lead_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_start_date ON jobs(scheduled_start_date);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_end_date ON jobs(scheduled_end_date);

-- ========== OPERATORS ==========

-- Create operators table
DROP TABLE IF EXISTS operators CASCADE;
CREATE TABLE operators (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'op_' || SUBSTRING(uuid_generate_v4()::text FROM 1 FOR 8),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone VARCHAR(50) NOT NULL,
    specialization VARCHAR(100),
    experience INTEGER CHECK (experience >= 0),
    certifications TEXT[],
    availability VARCHAR(50) DEFAULT 'available' CHECK (availability IN ('available', 'assigned', 'on_leave', 'inactive')),
    user_id VARCHAR(50) REFERENCES users(uid) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at and indexes
CREATE TRIGGER update_operators_updated_at 
BEFORE UPDATE ON operators
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_operators_availability ON operators(availability);
CREATE INDEX IF NOT EXISTS idx_operators_user_id ON operators(user_id);

-- Create site assessments table
DROP TABLE IF EXISTS site_assessments CASCADE;
CREATE TABLE site_assessments (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'sa_' || SUBSTRING(uuid_generate_v4()::text FROM 1 FOR 8),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    job_id VARCHAR(50) REFERENCES jobs(id) ON DELETE SET NULL,
    location TEXT NOT NULL,
    constraints TEXT[],
    notes TEXT,
    images TEXT[],
    videos TEXT[],
    created_by VARCHAR(50) NOT NULL REFERENCES users(uid) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at and indexes
CREATE TRIGGER update_site_assessments_updated_at 
BEFORE UPDATE ON site_assessments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_site_assessments_customer_id ON site_assessments(customer_id);
CREATE INDEX IF NOT EXISTS idx_site_assessments_job_id ON site_assessments(job_id);
CREATE INDEX IF NOT EXISTS idx_site_assessments_created_by ON site_assessments(created_by);

-- Remove duplicate foreign key constraint (already handled in table definition above)
-- ALTER TABLE site_assessments 
-- ADD CONSTRAINT fk_site_assessments_job_id 
-- FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL;

-- Create job equipment junction table
DROP TABLE IF EXISTS job_equipment CASCADE;
CREATE TABLE job_equipment (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(50) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    equipment_id VARCHAR(50) NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_equipment_job_id ON job_equipment(job_id);
CREATE INDEX IF NOT EXISTS idx_job_equipment_equipment_id ON job_equipment(equipment_id);

-- Create job operators junction table
DROP TABLE IF EXISTS job_operators CASCADE;
CREATE TABLE job_operators (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(50) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    operator_id VARCHAR(50) NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_operators_job_id ON job_operators(job_id);
CREATE INDEX IF NOT EXISTS idx_job_operators_operator_id ON job_operators(operator_id);

-- ========== SERVICES ==========

-- Create services table
DROP TABLE IF EXISTS services CASCADE;
CREATE TABLE services (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'srv_' || SUBSTRING(uuid_generate_v4()::text FROM 1 FOR 8),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    base_price NUMERIC(12, 2) CHECK (base_price >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at
CREATE TRIGGER update_services_updated_at 
BEFORE UPDATE ON services
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- ========== NOTIFICATIONS ==========

-- Create notifications table
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'notif_' || SUBSTRING(uuid_generate_v4()::text FROM 1 FOR 8),
    user_id VARCHAR(50) NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference_id VARCHAR(50),
    reference_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ========== AUDIT LOGS ==========

-- Create audit logs table
DROP TABLE IF EXISTS audit_logs CASCADE;
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(uid) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    changes JSONB NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_id ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ========== CONFIGURATION ==========

-- Create config table
DROP TABLE IF EXISTS config CASCADE;
CREATE TABLE config (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'cfg_' || SUBSTRING(uuid_generate_v4()::text FROM 1 FOR 8),
    name VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at
CREATE TRIGGER update_config_updated_at 
BEFORE UPDATE ON config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== DEFAULT DATA ==========

-- Insert default quotation config
INSERT INTO config (name, value)
VALUES ('quotation', '{
  "orderTypeLimits": {
    "micro": { "minDays": 1, "maxDays": 10 },
    "small": { "minDays": 11, "maxDays": 25 },
    "monthly": { "minDays": 26, "maxDays": 365 },
    "yearly": { "minDays": 366, "maxDays": 3650 }
  }
}')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for full text search on common search fields
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_email_trgm ON customers USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_leads_customer_name_trgm ON leads USING gin (customer_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_leads_email_trgm ON leads USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_equipment_name_trgm ON equipment USING gin (name gin_trgm_ops);

-- ========== DATA INTEGRITY CONSTRAINTS ==========

-- Additional business rule constraints

-- Ensure quotations have valid start/end date relationships
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_quotation_days_positive' 
        AND table_name = 'quotations'
    ) THEN
        ALTER TABLE quotations ADD CONSTRAINT check_quotation_days_positive 
        CHECK (number_of_days > 0 AND working_hours > 0);
    END IF;
END $$;

-- Ensure jobs have valid date relationships
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_job_dates' 
        AND table_name = 'jobs'
    ) THEN
        ALTER TABLE jobs ADD CONSTRAINT check_job_dates 
        CHECK (scheduled_end_date >= scheduled_start_date);
    END IF;
END $$;

-- Ensure jobs have valid actual dates if provided
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_job_actual_dates' 
        AND table_name = 'jobs'
    ) THEN
        ALTER TABLE jobs ADD CONSTRAINT check_job_actual_dates 
        CHECK (actual_end_date IS NULL OR actual_start_date IS NULL OR actual_end_date >= actual_start_date);
    END IF;
END $$;

-- Ensure equipment capacity and weight constraints make sense
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_equipment_capacity_weight' 
        AND table_name = 'equipment'
    ) THEN
        ALTER TABLE equipment ADD CONSTRAINT check_equipment_capacity_weight 
        CHECK (max_lifting_capacity > 0 AND unladen_weight > 0);
    END IF;
END $$;

-- Ensure deals have realistic probability
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_deal_probability' 
        AND table_name = 'deals'
    ) THEN
        ALTER TABLE deals ADD CONSTRAINT check_deal_probability 
        CHECK (probability IS NULL OR (probability >= 0 AND probability <= 100));
    END IF;
END $$;

-- Ensure leads have future start dates for new leads
-- (Commented out as it might be too restrictive for existing data)
-- ALTER TABLE leads ADD CONSTRAINT check_lead_start_date 
-- CHECK (status = 'converted' OR start_date >= CURRENT_DATE);

-- Performance optimization indexes
CREATE INDEX IF NOT EXISTS idx_deals_value ON deals(value);
CREATE INDEX IF NOT EXISTS idx_quotations_total_cost ON quotations(total_cost);
CREATE INDEX IF NOT EXISTS idx_equipment_lifting_capacity ON equipment(max_lifting_capacity);
CREATE INDEX IF NOT EXISTS idx_jobs_dates ON jobs(scheduled_start_date, scheduled_end_date);

-- Additional foreign key performance indexes
CREATE INDEX IF NOT EXISTS idx_quotation_machines_quotation_equipment ON quotation_machines(quotation_id, equipment_id);
CREATE INDEX IF NOT EXISTS idx_job_equipment_job_equipment ON job_equipment(job_id, equipment_id);
CREATE INDEX IF NOT EXISTS idx_job_operators_job_operator ON job_operators(job_id, operator_id);
