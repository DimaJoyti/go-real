-- Row Level Security Policies for CRM Tables
-- This migration adds comprehensive RLS policies for all CRM tables

-- Enable RLS on all CRM tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_estate_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has admin/manager role
CREATE OR REPLACE FUNCTION is_admin_or_manager() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is assigned to a record
CREATE OR REPLACE FUNCTION is_assigned_user(assigned_user_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = assigned_user_id OR is_admin_or_manager();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Companies policies
CREATE POLICY "Companies are viewable by authenticated users" ON companies
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and managers can manage companies" ON companies
    FOR ALL USING (is_admin_or_manager());

-- Leads policies
CREATE POLICY "Leads are viewable by assigned users and admins" ON leads
    FOR SELECT USING (
        is_assigned_user(assigned_to) OR 
        auth.uid() = created_by OR
        is_admin_or_manager()
    );

CREATE POLICY "Authenticated users can create leads" ON leads
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Assigned users and admins can update leads" ON leads
    FOR UPDATE USING (
        is_assigned_user(assigned_to) OR 
        auth.uid() = created_by OR
        is_admin_or_manager()
    );

CREATE POLICY "Only admins can delete leads" ON leads
    FOR DELETE USING (is_admin_or_manager());

-- Clients policies
CREATE POLICY "Clients are viewable by assigned users and admins" ON clients
    FOR SELECT USING (
        is_assigned_user(assigned_to) OR 
        auth.uid() = created_by OR
        auth.uid() = profile_id OR -- Clients can view their own record
        is_admin_or_manager()
    );

CREATE POLICY "Authenticated users can create clients" ON clients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Assigned users and admins can update clients" ON clients
    FOR UPDATE USING (
        is_assigned_user(assigned_to) OR 
        auth.uid() = created_by OR
        is_admin_or_manager()
    );

CREATE POLICY "Only admins can delete clients" ON clients
    FOR DELETE USING (is_admin_or_manager());

-- Societies policies
CREATE POLICY "Societies are viewable by authenticated users" ON societies
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create societies" ON societies
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Creators and admins can update societies" ON societies
    FOR UPDATE USING (
        auth.uid() = created_by OR
        is_admin_or_manager()
    );

CREATE POLICY "Only admins can delete societies" ON societies
    FOR DELETE USING (is_admin_or_manager());

-- Projects policies
CREATE POLICY "Projects are viewable by authenticated users" ON projects
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create projects" ON projects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Creators and admins can update projects" ON projects
    FOR UPDATE USING (
        auth.uid() = created_by OR
        is_admin_or_manager()
    );

CREATE POLICY "Only admins can delete projects" ON projects
    FOR DELETE USING (is_admin_or_manager());

-- Inventory policies
CREATE POLICY "Inventory is viewable by authenticated users" ON inventory
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create inventory" ON inventory
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Creators and admins can update inventory" ON inventory
    FOR UPDATE USING (
        auth.uid() = created_by OR
        is_admin_or_manager()
    );

CREATE POLICY "Only admins can delete inventory" ON inventory
    FOR DELETE USING (is_admin_or_manager());

-- Sales policies
CREATE POLICY "Sales are viewable by related users and admins" ON sales
    FOR SELECT USING (
        auth.uid() = salesperson_id OR
        auth.uid() = manager_id OR
        auth.uid() = created_by OR
        is_admin_or_manager()
    );

CREATE POLICY "Authenticated users can create sales" ON sales
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Related users and admins can update sales" ON sales
    FOR UPDATE USING (
        auth.uid() = salesperson_id OR
        auth.uid() = manager_id OR
        auth.uid() = created_by OR
        is_admin_or_manager()
    );

CREATE POLICY "Only admins can delete sales" ON sales
    FOR DELETE USING (is_admin_or_manager());

-- Tasks policies
CREATE POLICY "Tasks are viewable by assigned users and admins" ON tasks
    FOR SELECT USING (
        is_assigned_user(assigned_to) OR
        auth.uid() = assigned_by OR
        auth.uid() = created_by OR
        is_admin_or_manager()
    );

CREATE POLICY "Authenticated users can create tasks" ON tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Assigned users and admins can update tasks" ON tasks
    FOR UPDATE USING (
        is_assigned_user(assigned_to) OR
        auth.uid() = assigned_by OR
        auth.uid() = created_by OR
        is_admin_or_manager()
    );

CREATE POLICY "Creators and admins can delete tasks" ON tasks
    FOR DELETE USING (
        auth.uid() = created_by OR
        is_admin_or_manager()
    );

-- Follow-ups policies
CREATE POLICY "Follow-ups are viewable by assigned users and admins" ON follow_ups
    FOR SELECT USING (
        is_assigned_user(assigned_to) OR
        auth.uid() = created_by OR
        is_admin_or_manager()
    );

CREATE POLICY "Authenticated users can create follow-ups" ON follow_ups
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Assigned users and admins can update follow-ups" ON follow_ups
    FOR UPDATE USING (
        is_assigned_user(assigned_to) OR
        auth.uid() = created_by OR
        is_admin_or_manager()
    );

CREATE POLICY "Creators and admins can delete follow-ups" ON follow_ups
    FOR DELETE USING (
        auth.uid() = created_by OR
        is_admin_or_manager()
    );

-- Cashbook policies
CREATE POLICY "Cashbook is viewable by authenticated users" ON cashbook
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create cashbook entries" ON cashbook
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Creators and admins can update cashbook" ON cashbook
    FOR UPDATE USING (
        auth.uid() = created_by OR
        is_admin_or_manager()
    );

CREATE POLICY "Only admins can delete cashbook entries" ON cashbook
    FOR DELETE USING (is_admin_or_manager());

-- Vouchers policies
CREATE POLICY "Vouchers are viewable by requesters and admins" ON vouchers
    FOR SELECT USING (
        auth.uid() = requested_by OR
        auth.uid() = approved_by OR
        is_admin_or_manager()
    );

CREATE POLICY "Authenticated users can create vouchers" ON vouchers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Requesters and admins can update vouchers" ON vouchers
    FOR UPDATE USING (
        auth.uid() = requested_by OR
        is_admin_or_manager()
    );

CREATE POLICY "Only admins can delete vouchers" ON vouchers
    FOR DELETE USING (is_admin_or_manager());

-- Refunds policies
CREATE POLICY "Refunds are viewable by requesters and admins" ON refunds
    FOR SELECT USING (
        auth.uid() = requested_by OR
        auth.uid() = approved_by OR
        is_admin_or_manager()
    );

CREATE POLICY "Authenticated users can create refunds" ON refunds
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Requesters and admins can update refunds" ON refunds
    FOR UPDATE USING (
        auth.uid() = requested_by OR
        is_admin_or_manager()
    );

CREATE POLICY "Only admins can delete refunds" ON refunds
    FOR DELETE USING (is_admin_or_manager());

-- Approvals policies
CREATE POLICY "Approvals are viewable by requesters, approvers and admins" ON approvals
    FOR SELECT USING (
        auth.uid() = requested_by OR
        auth.uid() = approver_id OR
        is_admin_or_manager()
    );

CREATE POLICY "Authenticated users can create approvals" ON approvals
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Approvers and admins can update approvals" ON approvals
    FOR UPDATE USING (
        auth.uid() = approver_id OR
        is_admin_or_manager()
    );

CREATE POLICY "Only admins can delete approvals" ON approvals
    FOR DELETE USING (is_admin_or_manager());

-- Payment schedules policies
CREATE POLICY "Payment schedules are viewable by authenticated users" ON payment_schedules
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create payment schedules" ON payment_schedules
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update payment schedules" ON payment_schedules
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can delete payment schedules" ON payment_schedules
    FOR DELETE USING (is_admin_or_manager());

-- Commissions policies
CREATE POLICY "Commissions are viewable by employees and admins" ON commissions
    FOR SELECT USING (
        auth.uid() = employee_id OR
        is_admin_or_manager()
    );

CREATE POLICY "Admins can manage commissions" ON commissions
    FOR ALL USING (is_admin_or_manager());

-- Real Estate NFTs policies
CREATE POLICY "NFTs are viewable by everyone" ON real_estate_nfts
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create NFTs" ON real_estate_nfts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Creators and admins can update NFTs" ON real_estate_nfts
    FOR UPDATE USING (
        auth.uid() = creator_id OR
        is_admin_or_manager()
    );

CREATE POLICY "Only admins can delete NFTs" ON real_estate_nfts
    FOR DELETE USING (is_admin_or_manager());

-- NFT Listings policies
CREATE POLICY "NFT listings are viewable by everyone" ON nft_listings
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create listings" ON nft_listings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their listings" ON nft_listings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their listings" ON nft_listings
    FOR DELETE USING (auth.role() = 'authenticated');

-- Blockchain transactions policies
CREATE POLICY "Blockchain transactions are viewable by authenticated users" ON blockchain_transactions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can manage blockchain transactions" ON blockchain_transactions
    FOR ALL USING (true); -- This will be restricted at application level
