-- CRM Seed Data for GoReal Platform
-- This migration adds comprehensive sample data for CRM functionality

-- Insert additional profiles for CRM roles
INSERT INTO profiles (id, email, username, full_name, role, bio, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'manager@goreal.com', 'manager1', 'Sarah Manager', 'manager', 'Sales manager with 10+ years experience', true),
('550e8400-e29b-41d4-a716-446655440011', 'employee1@goreal.com', 'employee1', 'John Employee', 'employee', 'Sales executive specializing in residential properties', true),
('550e8400-e29b-41d4-a716-446655440012', 'employee2@goreal.com', 'employee2', 'Lisa Sales', 'employee', 'Commercial property specialist', true),
('550e8400-e29b-41d4-a716-446655440013', 'client1@goreal.com', 'client1', 'Michael Brown', 'client', 'Property investor and entrepreneur', true),
('550e8400-e29b-41d4-a716-446655440014', 'client2@goreal.com', 'client2', 'Emma Davis', 'client', 'First-time home buyer', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample companies
INSERT INTO companies (id, name, registration_number, industry, website, phone, email, address) VALUES
('450e8400-e29b-41d4-a716-446655440001', 'Tech Innovations Ltd', 'REG123456', 'Technology', 'https://techinnovations.com', '+1-555-0101', 'info@techinnovations.com', '{"street": "123 Tech Street", "city": "San Francisco", "state": "CA", "country": "USA", "postal_code": "94105"}'),
('450e8400-e29b-41d4-a716-446655440002', 'Green Energy Corp', 'REG789012', 'Energy', 'https://greenenergy.com', '+1-555-0102', 'contact@greenenergy.com', '{"street": "456 Green Ave", "city": "Austin", "state": "TX", "country": "USA", "postal_code": "73301"}'),
('450e8400-e29b-41d4-a716-446655440003', 'Urban Developers Inc', 'REG345678', 'Real Estate', 'https://urbandevelopers.com', '+1-555-0103', 'info@urbandevelopers.com', '{"street": "789 Urban Plaza", "city": "New York", "state": "NY", "country": "USA", "postal_code": "10001"}');

-- Insert sample leads
INSERT INTO leads (id, name, email, phone, company_name, source, status, assigned_to, budget_min, budget_max, requirements, created_by) VALUES
('350e8400-e29b-41d4-a716-446655440001', 'Robert Johnson', 'robert.j@email.com', '+1-555-1001', 'Johnson Enterprises', 'website', 'new', '550e8400-e29b-41d4-a716-446655440011', 300000, 500000, 'Looking for 2-3 BHK apartment in downtown area', '550e8400-e29b-41d4-a716-446655440010'),
('350e8400-e29b-41d4-a716-446655440002', 'Lisa Chen', 'lisa.chen@email.com', '+1-555-1002', 'Chen Holdings', 'referral', 'qualified', '550e8400-e29b-41d4-a716-446655440012', 800000, 1200000, 'Commercial space for tech startup', '550e8400-e29b-41d4-a716-446655440010'),
('350e8400-e29b-41d4-a716-446655440003', 'David Wilson', 'david.w@email.com', '+1-555-1003', NULL, 'social_media', 'contacted', '550e8400-e29b-41d4-a716-446655440011', 200000, 400000, 'First-time home buyer', '550e8400-e29b-41d4-a716-446655440010'),
('350e8400-e29b-41d4-a716-446655440004', 'Jennifer Martinez', 'jennifer.m@email.com', '+1-555-1004', 'Martinez Corp', 'advertisement', 'proposal', '550e8400-e29b-41d4-a716-446655440012', 1500000, 2500000, 'Office space for expanding business', '550e8400-e29b-41d4-a716-446655440010'),
('350e8400-e29b-41d4-a716-446655440005', 'Thomas Anderson', 'thomas.a@email.com', '+1-555-1005', NULL, 'walk_in', 'negotiation', '550e8400-e29b-41d4-a716-446655440011', 600000, 900000, 'Investment property for rental income', '550e8400-e29b-41d4-a716-446655440010');

-- Insert sample clients (converted leads and direct clients)
INSERT INTO clients (id, lead_id, name, email, phone, client_type, address, assigned_to, created_by) VALUES
('250e8400-e29b-41d4-a716-446655440001', NULL, 'Michael Brown', 'michael.b@email.com', '+1-555-2001', 'individual', '{"street": "789 Oak Street", "city": "New York", "state": "NY", "country": "USA", "postal_code": "10001"}', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440010'),
('250e8400-e29b-41d4-a716-446655440002', NULL, 'Emma Davis', 'emma.d@email.com', '+1-555-2002', 'investor', '{"street": "321 Pine Avenue", "city": "Los Angeles", "state": "CA", "country": "USA", "postal_code": "90210"}', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440010'),
('250e8400-e29b-41d4-a716-446655440003', '350e8400-e29b-41d4-a716-446655440002', 'Lisa Chen', 'lisa.chen@email.com', '+1-555-1002', 'corporate', '{"street": "456 Business Blvd", "city": "Seattle", "state": "WA", "country": "USA", "postal_code": "98101"}', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440010');

-- Insert sample societies
INSERT INTO societies (id, name, developer_name, location, total_area, total_units, amenities, created_by) VALUES
('150e8400-e29b-41d4-a716-446655440001', 'Green Valley Heights', 'Premium Developers', 'North Bangalore', 25.5, 500, ARRAY['Swimming Pool', 'Gym', 'Clubhouse', 'Children Play Area', 'Security', '24/7 Power Backup'], '550e8400-e29b-41d4-a716-446655440010'),
('150e8400-e29b-41d4-a716-446655440002', 'Sunset Residency', 'Elite Constructions', 'South Mumbai', 15.2, 300, ARRAY['Rooftop Garden', 'Parking', 'Elevator', 'Power Backup', 'Water Supply', 'CCTV Surveillance'], '550e8400-e29b-41d4-a716-446655440010'),
('150e8400-e29b-41d4-a716-446655440003', 'Tech Park Plaza', 'Urban Developers Inc', 'Gurgaon', 35.8, 200, ARRAY['Business Center', 'Conference Rooms', 'Cafeteria', 'Parking', 'High-Speed Internet'], '550e8400-e29b-41d4-a716-446655440010');

-- Insert sample projects
INSERT INTO projects (id, society_id, name, project_type, status, total_units, available_units, base_price, price_per_sqft, created_by) VALUES
('050e8400-e29b-41d4-a716-446655440001', '150e8400-e29b-41d4-a716-446655440001', 'Tower A - Premium Apartments', 'residential', 'under_construction', 150, 120, 4500000, 4500, '550e8400-e29b-41d4-a716-446655440010'),
('050e8400-e29b-41d4-a716-446655440002', '150e8400-e29b-41d4-a716-446655440001', 'Tower B - Luxury Villas', 'residential', 'planning', 50, 50, 8500000, 5500, '550e8400-e29b-41d4-a716-446655440010'),
('050e8400-e29b-41d4-a716-446655440003', '150e8400-e29b-41d4-a716-446655440002', 'Sunset Commercial Complex', 'commercial', 'approved', 100, 85, 12000000, 8000, '550e8400-e29b-41d4-a716-446655440010'),
('050e8400-e29b-41d4-a716-446655440004', '150e8400-e29b-41d4-a716-446655440003', 'Tech Park Office Spaces', 'commercial', 'completed', 80, 25, 15000000, 10000, '550e8400-e29b-41d4-a716-446655440010');

-- Insert sample inventory
INSERT INTO inventory (id, project_id, unit_number, floor_number, unit_type, carpet_area, built_up_area, super_built_up_area, facing, status, base_price, final_price, created_by) VALUES
('950e8400-e29b-41d4-a716-446655440001', '050e8400-e29b-41d4-a716-446655440001', 'A-101', 1, '2BHK', 850.00, 1000.00, 1200.00, 'North', 'available', 4200000, 4200000, '550e8400-e29b-41d4-a716-446655440010'),
('950e8400-e29b-41d4-a716-446655440002', '050e8400-e29b-41d4-a716-446655440001', 'A-102', 1, '3BHK', 1200.00, 1400.00, 1650.00, 'South', 'available', 6300000, 6300000, '550e8400-e29b-41d4-a716-446655440010'),
('950e8400-e29b-41d4-a716-446655440003', '050e8400-e29b-41d4-a716-446655440001', 'A-201', 2, '2BHK', 850.00, 1000.00, 1200.00, 'East', 'reserved', 4300000, 4300000, '550e8400-e29b-41d4-a716-446655440010'),
('950e8400-e29b-41d4-a716-446655440004', '050e8400-e29b-41d4-a716-446655440002', 'B-V01', 0, 'Villa', 2500.00, 3000.00, 3500.00, 'West', 'available', 8500000, 8500000, '550e8400-e29b-41d4-a716-446655440010'),
('950e8400-e29b-41d4-a716-446655440005', '050e8400-e29b-41d4-a716-446655440003', 'C-101', 1, 'Office', 1500.00, 1800.00, 2000.00, 'North', 'sold', 12000000, 11500000, '550e8400-e29b-41d4-a716-446655440010');

-- Insert sample sales
INSERT INTO sales (id, sale_number, client_id, inventory_id, salesperson_id, manager_id, total_amount, final_amount, booking_amount, status, created_by) VALUES
('850e8400-e29b-41d4-a716-446655440001', 'SAL202400001', '250e8400-e29b-41d4-a716-446655440001', '950e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440010', 4300000, 4300000, 500000, 'pending', '550e8400-e29b-41d4-a716-446655440011'),
('850e8400-e29b-41d4-a716-446655440002', 'SAL202400002', '250e8400-e29b-41d4-a716-446655440002', '950e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440010', 4200000, 4000000, 400000, 'approved', '550e8400-e29b-41d4-a716-446655440011'),
('850e8400-e29b-41d4-a716-446655440003', 'SAL202400003', '250e8400-e29b-41d4-a716-446655440003', '950e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440010', 12000000, 11500000, 1000000, 'completed', '550e8400-e29b-41d4-a716-446655440012');

-- Insert sample tasks
INSERT INTO tasks (id, title, description, assigned_to, assigned_by, related_to_type, related_to_id, status, priority, due_date, created_by) VALUES
('750e8400-e29b-41d4-a716-446655440001', 'Follow up with Robert Johnson', 'Call to discuss property requirements and schedule site visit', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440010', 'lead', '350e8400-e29b-41d4-a716-446655440001', 'pending', 'high', NOW() + INTERVAL '2 days', '550e8400-e29b-41d4-a716-446655440010'),
('750e8400-e29b-41d4-a716-446655440002', 'Prepare sales agreement', 'Draft sales agreement for Michael Brown', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440010', 'sale', '850e8400-e29b-41d4-a716-446655440001', 'in_progress', 'urgent', NOW() + INTERVAL '1 day', '550e8400-e29b-41d4-a716-446655440010'),
('750e8400-e29b-41d4-a716-446655440003', 'Site visit with Lisa Chen', 'Show commercial properties to potential client', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440010', 'lead', '350e8400-e29b-41d4-a716-446655440002', 'completed', 'medium', NOW() - INTERVAL '1 day', '550e8400-e29b-41d4-a716-446655440010'),
('750e8400-e29b-41d4-a716-446655440004', 'Update project status', 'Update Tower A construction progress', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440010', 'project', '050e8400-e29b-41d4-a716-446655440001', 'pending', 'low', NOW() + INTERVAL '7 days', '550e8400-e29b-41d4-a716-446655440010');

-- Insert sample follow-ups
INSERT INTO follow_ups (id, lead_id, assigned_to, follow_up_date, follow_up_type, status, notes, created_by) VALUES
('650e8400-e29b-41d4-a716-446655440001', '350e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', NOW() + INTERVAL '1 day', 'call', 'scheduled', 'Initial discussion about requirements', '550e8400-e29b-41d4-a716-446655440010'),
('650e8400-e29b-41d4-a716-446655440002', '350e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', NOW() + INTERVAL '3 days', 'site_visit', 'scheduled', 'Show commercial properties', '550e8400-e29b-41d4-a716-446655440010'),
('650e8400-e29b-41d4-a716-446655440003', '350e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440011', NOW() - INTERVAL '2 days', 'email', 'completed', 'Sent property brochures and pricing', '550e8400-e29b-41d4-a716-446655440010'),
('650e8400-e29b-41d4-a716-446655440004', '350e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440011', NOW() + INTERVAL '5 days', 'meeting', 'scheduled', 'Final negotiation meeting', '550e8400-e29b-41d4-a716-446655440010');

-- Insert sample cashbook entries
INSERT INTO cashbook (id, transaction_number, transaction_type, category, description, amount, payment_method, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'TXN202400001', 'income', 'booking', 'Booking amount received from Michael Brown', 500000, 'bank_transfer', '550e8400-e29b-41d4-a716-446655440011'),
('550e8400-e29b-41d4-a716-446655440002', 'TXN202400002', 'expense', 'marketing', 'Digital marketing campaign for Q4', 25000, 'card', '550e8400-e29b-41d4-a716-446655440010'),
('550e8400-e29b-41d4-a716-446655440003', 'TXN202400003', 'income', 'commission', 'Commission from Emma Davis sale', 120000, 'bank_transfer', '550e8400-e29b-41d4-a716-446655440011'),
('550e8400-e29b-41d4-a716-446655440004', 'TXN202400004', 'expense', 'utilities', 'Office electricity and water bills', 8500, 'bank_transfer', '550e8400-e29b-41d4-a716-446655440010'),
('550e8400-e29b-41d4-a716-446655440005', 'TXN202400005', 'income', 'sale', 'Final payment from Lisa Chen', 10500000, 'bank_transfer', '550e8400-e29b-41d4-a716-446655440012');

-- Insert sample vouchers
INSERT INTO vouchers (id, voucher_number, voucher_type, party_name, amount, description, status, requested_by) VALUES
('450e8400-e29b-41d4-a716-446655440001', 'VOU202400001', 'payment', 'Office Supplies Inc', 15000, 'Office furniture and supplies for new branch', 'pending', '550e8400-e29b-41d4-a716-446655440011'),
('450e8400-e29b-41d4-a716-446655440002', 'VOU202400002', 'receipt', 'Michael Brown', 500000, 'Booking amount received for A-201', 'approved', '550e8400-e29b-41d4-a716-446655440011'),
('450e8400-e29b-41d4-a716-446655440003', 'VOU202400003', 'payment', 'Marketing Agency Ltd', 50000, 'Social media marketing campaign', 'approved', '550e8400-e29b-41d4-a716-446655440010'),
('450e8400-e29b-41d4-a716-446655440004', 'VOU202400004', 'journal', 'Commission Adjustment', 5000, 'Adjustment for overpaid commission', 'pending', '550e8400-e29b-41d4-a716-446655440010');

-- Insert sample payment schedules
INSERT INTO payment_schedules (id, sale_id, installment_number, due_date, amount, description, status) VALUES
('350e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', 1, NOW() + INTERVAL '30 days', 1000000, 'First installment - 30 days', 'pending'),
('350e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440001', 2, NOW() + INTERVAL '90 days', 1000000, 'Second installment - 90 days', 'pending'),
('350e8400-e29b-41d4-a716-446655440003', '850e8400-e29b-41d4-a716-446655440001', 3, NOW() + INTERVAL '180 days', 1800000, 'Final installment - 180 days', 'pending'),
('350e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440002', 1, NOW() + INTERVAL '15 days', 800000, 'First installment - 15 days', 'pending'),
('350e8400-e29b-41d4-a716-446655440005', '850e8400-e29b-41d4-a716-446655440002', 2, NOW() + INTERVAL '60 days', 2800000, 'Final installment - 60 days', 'pending');

-- Insert sample commissions
INSERT INTO commissions (id, sale_id, employee_id, commission_type, commission_rate, commission_amount, status) VALUES
('250e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', 'primary', 2.5, 107500, 'pending'),
('250e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440011', 'primary', 3.0, 120000, 'paid'),
('250e8400-e29b-41d4-a716-446655440003', '850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440012', 'primary', 2.0, 230000, 'paid'),
('250e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010', 'manager', 0.5, 21500, 'pending'),
('250e8400-e29b-41d4-a716-446655440005', '850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440010', 'manager', 0.5, 57500, 'paid');

-- Insert sample real estate NFTs
INSERT INTO real_estate_nfts (id, property_id, token_id, contract_address, name, description, total_value, token_supply, price_per_token, creator_id) VALUES
('850e8400-e29b-41d4-a716-446655440001', '950e8400-e29b-41d4-a716-446655440001', 1001, '0x1234567890123456789012345678901234567890', 'Green Valley Heights A-101 NFT', 'Fractional ownership of premium 2BHK apartment in Green Valley Heights', 4200000, 100, 42000, '550e8400-e29b-41d4-a716-446655440010'),
('850e8400-e29b-41d4-a716-446655440002', '950e8400-e29b-41d4-a716-446655440002', 1002, '0x1234567890123456789012345678901234567890', 'Green Valley Heights A-102 NFT', 'Fractional ownership of luxury 3BHK apartment in Green Valley Heights', 6300000, 150, 42000, '550e8400-e29b-41d4-a716-446655440010'),
('850e8400-e29b-41d4-a716-446655440003', '950e8400-e29b-41d4-a716-446655440004', 1003, '0x1234567890123456789012345678901234567890', 'Green Valley Villa B-V01 NFT', 'Fractional ownership of luxury villa in Green Valley Heights', 8500000, 200, 42500, '550e8400-e29b-41d4-a716-446655440010');

-- Insert sample notifications for CRM activities
INSERT INTO notifications (user_id, type, title, message, data) VALUES
('550e8400-e29b-41d4-a716-446655440011', 'system', 'New Lead Assigned', 'You have been assigned a new lead: Robert Johnson', '{"lead_id": "350e8400-e29b-41d4-a716-446655440001"}'),
('550e8400-e29b-41d4-a716-446655440011', 'system', 'Task Due Soon', 'Task "Follow up with Robert Johnson" is due in 2 days', '{"task_id": "750e8400-e29b-41d4-a716-446655440001"}'),
('550e8400-e29b-41d4-a716-446655440012', 'system', 'Sale Completed', 'Congratulations! Your sale to Lisa Chen has been completed', '{"sale_id": "850e8400-e29b-41d4-a716-446655440003"}'),
('550e8400-e29b-41d4-a716-446655440010', 'system', 'Voucher Pending Approval', 'Voucher VOU202400001 is pending your approval', '{"voucher_id": "450e8400-e29b-41d4-a716-446655440001"}'),
('550e8400-e29b-41d4-a716-446655440013', 'property', 'New Property Available', 'A new property matching your criteria has been listed', '{"property_id": "950e8400-e29b-41d4-a716-446655440001"}');

-- Update challenge counts
UPDATE challenges SET current_participants = (
    SELECT COUNT(*) FROM challenge_participations 
    WHERE challenge_participations.challenge_id = challenges.id
);

-- Update film view and like counts
UPDATE films SET 
    view_count = FLOOR(RANDOM() * 5000) + 100,
    like_count = FLOOR(RANDOM() * 500) + 10
WHERE view_count = 0;
