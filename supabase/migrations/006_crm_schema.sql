-- CRM Schema Migration for GoReal Platform
-- This migration adds comprehensive CRM functionality including leads, clients, projects, sales, and financial management

-- Create additional custom types for CRM
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost', 'inactive');
CREATE TYPE lead_source AS ENUM ('website', 'referral', 'social_media', 'advertisement', 'walk_in', 'phone', 'email', 'event', 'other');
CREATE TYPE client_type AS ENUM ('individual', 'corporate', 'investor', 'developer');
CREATE TYPE project_status AS ENUM ('planning', 'approved', 'under_construction', 'completed', 'on_hold', 'cancelled');
CREATE TYPE unit_status AS ENUM ('available', 'reserved', 'sold', 'blocked');
CREATE TYPE sale_status AS ENUM ('draft', 'pending', 'approved', 'completed', 'cancelled');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'overdue');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');

-- Extend user roles for CRM
ALTER TYPE user_role ADD VALUE 'employee';
ALTER TYPE user_role ADD VALUE 'manager';
ALTER TYPE user_role ADD VALUE 'client';

-- Companies/Organizations table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    registration_number TEXT,
    tax_id TEXT,
    industry TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    address JSONB, -- {street, city, state, country, postal_code}
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company_name TEXT,
    designation TEXT,
    source lead_source DEFAULT 'other',
    status lead_status DEFAULT 'new',
    assigned_to UUID REFERENCES profiles(id),
    budget_min DECIMAL(15,2),
    budget_max DECIMAL(15,2),
    requirements TEXT,
    notes TEXT,
    last_contact_date TIMESTAMP WITH TIME ZONE,
    next_follow_up TIMESTAMP WITH TIME ZONE,
    score INTEGER DEFAULT 0, -- Lead scoring 0-100
    tags TEXT[],
    custom_fields JSONB,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table (converted leads or direct clients)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id), -- Link to user profile if they have an account
    lead_id UUID REFERENCES leads(id), -- Original lead if converted
    company_id UUID REFERENCES companies(id),
    client_type client_type DEFAULT 'individual',
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    alternate_phone TEXT,
    date_of_birth DATE,
    anniversary_date DATE,
    address JSONB,
    emergency_contact JSONB,
    kyc_documents TEXT[], -- Array of document URLs
    is_verified BOOLEAN DEFAULT false,
    credit_limit DECIMAL(15,2),
    assigned_to UUID REFERENCES profiles(id),
    tags TEXT[],
    custom_fields JSONB,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Societies/Developments table
CREATE TABLE societies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    developer_name TEXT,
    location TEXT NOT NULL,
    address JSONB,
    total_area DECIMAL(10,2), -- in sq ft or acres
    total_units INTEGER,
    amenities TEXT[],
    description TEXT,
    images TEXT[],
    brochure_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table (within societies)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    project_type TEXT, -- residential, commercial, mixed
    status project_status DEFAULT 'planning',
    start_date DATE,
    expected_completion DATE,
    actual_completion DATE,
    total_units INTEGER,
    available_units INTEGER,
    sold_units INTEGER DEFAULT 0,
    blocked_units INTEGER DEFAULT 0,
    base_price DECIMAL(15,2),
    price_per_sqft DECIMAL(10,2),
    description TEXT,
    specifications TEXT,
    floor_plans TEXT[], -- URLs to floor plan images
    images TEXT[],
    videos TEXT[],
    brochure_url TEXT,
    rera_number TEXT,
    approvals JSONB, -- Various government approvals
    amenities TEXT[],
    nearby_facilities JSONB,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory/Units table
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    unit_number TEXT NOT NULL,
    floor_number INTEGER,
    tower_block TEXT,
    unit_type TEXT, -- 1BHK, 2BHK, 3BHK, etc.
    carpet_area DECIMAL(8,2),
    built_up_area DECIMAL(8,2),
    super_built_up_area DECIMAL(8,2),
    facing TEXT, -- North, South, East, West
    status unit_status DEFAULT 'available',
    base_price DECIMAL(15,2),
    final_price DECIMAL(15,2),
    price_per_sqft DECIMAL(10,2),
    parking_slots INTEGER DEFAULT 0,
    balconies INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    floor_plan_url TEXT,
    features TEXT[],
    reserved_by UUID REFERENCES clients(id),
    reserved_until TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, unit_number)
);

-- Sales table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_number TEXT UNIQUE NOT NULL, -- Auto-generated sale number
    client_id UUID REFERENCES clients(id) NOT NULL,
    inventory_id UUID REFERENCES inventory(id) NOT NULL,
    salesperson_id UUID REFERENCES profiles(id),
    manager_id UUID REFERENCES profiles(id),
    sale_date DATE DEFAULT CURRENT_DATE,
    status sale_status DEFAULT 'draft',
    total_amount DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    final_amount DECIMAL(15,2) NOT NULL,
    booking_amount DECIMAL(15,2),
    payment_plan JSONB, -- Payment schedule details
    commission_rate DECIMAL(5,2), -- Commission percentage
    commission_amount DECIMAL(15,2),
    agreement_date DATE,
    possession_date DATE,
    registration_date DATE,
    notes TEXT,
    documents TEXT[], -- Agreement, receipts, etc.
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES profiles(id),
    assigned_by UUID REFERENCES profiles(id),
    related_to_type TEXT, -- 'lead', 'client', 'sale', 'project'
    related_to_id UUID, -- ID of the related entity
    status task_status DEFAULT 'pending',
    priority task_priority DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    tags TEXT[],
    attachments TEXT[],
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follow-ups table
CREATE TABLE follow_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id),
    client_id UUID REFERENCES clients(id),
    assigned_to UUID REFERENCES profiles(id),
    follow_up_date TIMESTAMP WITH TIME ZONE NOT NULL,
    follow_up_type TEXT, -- call, email, meeting, site_visit
    status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled, rescheduled
    notes TEXT,
    outcome TEXT,
    next_follow_up TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cashbook/Financial transactions table
CREATE TABLE cashbook (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_number TEXT UNIQUE NOT NULL,
    transaction_date DATE DEFAULT CURRENT_DATE,
    transaction_type transaction_type NOT NULL,
    category TEXT, -- rent, utilities, marketing, commission, etc.
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method TEXT, -- cash, bank_transfer, cheque, card
    reference_number TEXT,
    related_to_type TEXT, -- 'sale', 'expense', 'commission'
    related_to_id UUID,
    account_head TEXT,
    voucher_number TEXT,
    attachments TEXT[],
    approved_by UUID REFERENCES profiles(id),
    approval_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vouchers table
CREATE TABLE vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_number TEXT UNIQUE NOT NULL,
    voucher_type TEXT, -- payment, receipt, journal, contra
    voucher_date DATE DEFAULT CURRENT_DATE,
    party_name TEXT,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    payment_method TEXT,
    bank_details JSONB,
    status approval_status DEFAULT 'pending',
    requested_by UUID REFERENCES profiles(id),
    approved_by UUID REFERENCES profiles(id),
    approval_date TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    attachments TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refunds table
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    refund_number TEXT UNIQUE NOT NULL,
    sale_id UUID REFERENCES sales(id),
    client_id UUID REFERENCES clients(id) NOT NULL,
    original_amount DECIMAL(15,2) NOT NULL,
    refund_amount DECIMAL(15,2) NOT NULL,
    refund_reason TEXT NOT NULL,
    deduction_amount DECIMAL(15,2) DEFAULT 0,
    deduction_reason TEXT,
    refund_date DATE,
    payment_method TEXT,
    bank_details JSONB,
    status approval_status DEFAULT 'pending',
    requested_by UUID REFERENCES profiles(id),
    approved_by UUID REFERENCES profiles(id),
    approval_date TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    documents TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Approvals table (generic approval workflow)
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    approval_type TEXT NOT NULL, -- voucher, refund, discount, etc.
    related_table TEXT NOT NULL,
    related_id UUID NOT NULL,
    requested_by UUID REFERENCES profiles(id),
    approver_id UUID REFERENCES profiles(id),
    status approval_status DEFAULT 'pending',
    request_data JSONB,
    approval_notes TEXT,
    rejection_reason TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment schedules table
CREATE TABLE payment_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    status payment_status DEFAULT 'pending',
    paid_amount DECIMAL(15,2) DEFAULT 0,
    paid_date DATE,
    payment_method TEXT,
    transaction_reference TEXT,
    late_fee DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commissions table
CREATE TABLE commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES profiles(id),
    commission_type TEXT, -- primary, secondary, team_lead, manager
    commission_rate DECIMAL(5,2),
    commission_amount DECIMAL(15,2),
    status payment_status DEFAULT 'pending',
    paid_date DATE,
    payment_reference TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real Estate NFTs table (enhanced from existing properties)
CREATE TABLE real_estate_nfts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES inventory(id), -- Link to actual property
    token_id BIGINT UNIQUE NOT NULL,
    contract_address TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    metadata_uri TEXT,
    property_address TEXT,
    property_type property_type,
    total_value DECIMAL(15,2),
    token_supply INTEGER,
    price_per_token DECIMAL(15,2),
    currency TEXT DEFAULT 'ETH',
    owner_address TEXT,
    creator_id UUID REFERENCES profiles(id),
    is_listed BOOLEAN DEFAULT false,
    royalty_percentage DECIMAL(5,2) DEFAULT 0,
    attributes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NFT Listings table (marketplace)
CREATE TABLE nft_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nft_id UUID REFERENCES real_estate_nfts(id) ON DELETE CASCADE,
    seller_address TEXT NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'ETH',
    quantity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active', -- active, sold, cancelled, expired
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blockchain transactions table
CREATE TABLE blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_hash TEXT UNIQUE NOT NULL,
    block_number BIGINT,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    value DECIMAL(20,8),
    gas_used BIGINT,
    gas_price DECIMAL(20,8),
    transaction_type TEXT, -- mint, transfer, purchase, list
    related_table TEXT,
    related_id UUID,
    status TEXT DEFAULT 'pending', -- pending, confirmed, failed
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for optimal performance
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_is_active ON companies(is_active);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_created_by ON leads(created_by);
CREATE INDEX idx_leads_next_follow_up ON leads(next_follow_up);
CREATE INDEX idx_leads_tags ON leads USING GIN(tags);

CREATE INDEX idx_clients_client_type ON clients(client_type);
CREATE INDEX idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX idx_clients_company_id ON clients(company_id);
CREATE INDEX idx_clients_profile_id ON clients(profile_id);
CREATE INDEX idx_clients_lead_id ON clients(lead_id);

CREATE INDEX idx_societies_location ON societies(location);
CREATE INDEX idx_societies_is_active ON societies(is_active);
CREATE INDEX idx_societies_created_by ON societies(created_by);

CREATE INDEX idx_projects_society_id ON projects(society_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_by ON projects(created_by);

CREATE INDEX idx_inventory_project_id ON inventory(project_id);
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_inventory_unit_type ON inventory(unit_type);
CREATE INDEX idx_inventory_reserved_by ON inventory(reserved_by);

CREATE INDEX idx_sales_client_id ON sales(client_id);
CREATE INDEX idx_sales_inventory_id ON sales(inventory_id);
CREATE INDEX idx_sales_salesperson_id ON sales(salesperson_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_sale_date ON sales(sale_date);

CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_related_to ON tasks(related_to_type, related_to_id);

CREATE INDEX idx_follow_ups_lead_id ON follow_ups(lead_id);
CREATE INDEX idx_follow_ups_client_id ON follow_ups(client_id);
CREATE INDEX idx_follow_ups_assigned_to ON follow_ups(assigned_to);
CREATE INDEX idx_follow_ups_follow_up_date ON follow_ups(follow_up_date);

CREATE INDEX idx_cashbook_transaction_date ON cashbook(transaction_date);
CREATE INDEX idx_cashbook_transaction_type ON cashbook(transaction_type);
CREATE INDEX idx_cashbook_created_by ON cashbook(created_by);
CREATE INDEX idx_cashbook_related_to ON cashbook(related_to_type, related_to_id);

CREATE INDEX idx_vouchers_status ON vouchers(status);
CREATE INDEX idx_vouchers_requested_by ON vouchers(requested_by);
CREATE INDEX idx_vouchers_voucher_date ON vouchers(voucher_date);

CREATE INDEX idx_refunds_sale_id ON refunds(sale_id);
CREATE INDEX idx_refunds_client_id ON refunds(client_id);
CREATE INDEX idx_refunds_status ON refunds(status);

CREATE INDEX idx_approvals_approval_type ON approvals(approval_type);
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_related_to ON approvals(related_table, related_id);
CREATE INDEX idx_approvals_requested_by ON approvals(requested_by);
CREATE INDEX idx_approvals_approver_id ON approvals(approver_id);

CREATE INDEX idx_payment_schedules_sale_id ON payment_schedules(sale_id);
CREATE INDEX idx_payment_schedules_due_date ON payment_schedules(due_date);
CREATE INDEX idx_payment_schedules_status ON payment_schedules(status);

CREATE INDEX idx_commissions_sale_id ON commissions(sale_id);
CREATE INDEX idx_commissions_employee_id ON commissions(employee_id);
CREATE INDEX idx_commissions_status ON commissions(status);

CREATE INDEX idx_real_estate_nfts_property_id ON real_estate_nfts(property_id);
CREATE INDEX idx_real_estate_nfts_token_id ON real_estate_nfts(token_id);
CREATE INDEX idx_real_estate_nfts_creator_id ON real_estate_nfts(creator_id);
CREATE INDEX idx_real_estate_nfts_is_listed ON real_estate_nfts(is_listed);

CREATE INDEX idx_nft_listings_nft_id ON nft_listings(nft_id);
CREATE INDEX idx_nft_listings_status ON nft_listings(status);
CREATE INDEX idx_nft_listings_seller_address ON nft_listings(seller_address);

CREATE INDEX idx_blockchain_transactions_hash ON blockchain_transactions(transaction_hash);
CREATE INDEX idx_blockchain_transactions_status ON blockchain_transactions(status);
CREATE INDEX idx_blockchain_transactions_related_to ON blockchain_transactions(related_table, related_id);

-- Add constraints and triggers
ALTER TABLE inventory ADD CONSTRAINT check_positive_areas
    CHECK (carpet_area > 0 AND built_up_area > 0 AND super_built_up_area > 0);

ALTER TABLE sales ADD CONSTRAINT check_positive_amounts
    CHECK (total_amount > 0 AND final_amount > 0 AND discount_amount >= 0);

ALTER TABLE payment_schedules ADD CONSTRAINT check_positive_payment_amount
    CHECK (amount > 0 AND paid_amount >= 0);

-- Auto-generate unique numbers for sales, vouchers, refunds
CREATE OR REPLACE FUNCTION generate_sale_number() RETURNS TEXT AS $$
BEGIN
    RETURN 'SAL' || TO_CHAR(NOW(), 'YYYY') || LPAD(NEXTVAL('sale_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE sale_number_seq START 1;
CREATE SEQUENCE voucher_number_seq START 1;
CREATE SEQUENCE refund_number_seq START 1;
CREATE SEQUENCE transaction_number_seq START 1;

-- Triggers for auto-generating numbers
CREATE OR REPLACE FUNCTION set_sale_number() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sale_number IS NULL THEN
        NEW.sale_number := generate_sale_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_sale_number
    BEFORE INSERT ON sales
    FOR EACH ROW EXECUTE FUNCTION set_sale_number();
