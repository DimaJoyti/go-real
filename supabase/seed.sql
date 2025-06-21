-- Seed data for GoReal Platform
-- This file contains sample data for development and testing

-- Insert sample profiles (these will be created automatically when users sign up)
-- We'll insert them manually for testing purposes
INSERT INTO profiles (id, email, username, full_name, bio, role, avatar_url) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@goreal.com', 'admin', 'Platform Admin', 'Platform administrator', 'admin', 'https://via.placeholder.com/150'),
  ('550e8400-e29b-41d4-a716-446655440002', 'creator1@goreal.com', 'filmcreator', 'Alex Johnson', 'Passionate filmmaker and challenge enthusiast', 'creator', 'https://via.placeholder.com/150'),
  ('550e8400-e29b-41d4-a716-446655440003', 'creator2@goreal.com', 'propowner', 'Sarah Chen', 'Real estate investor and property developer', 'creator', 'https://via.placeholder.com/150'),
  ('550e8400-e29b-41d4-a716-446655440004', 'user1@goreal.com', 'challenger', 'Mike Davis', 'Love taking on new challenges and creating content', 'user', 'https://via.placeholder.com/150'),
  ('550e8400-e29b-41d4-a716-446655440005', 'user2@goreal.com', 'investor', 'Emma Wilson', 'Interested in real estate NFTs and fractional ownership', 'user', 'https://via.placeholder.com/150');

-- Insert sample challenges
INSERT INTO challenges (id, title, description, creator_id, start_date, end_date, reward_amount, reward_type, status, rules, tags, image_url, max_participants) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', '30-Day Fitness Challenge', 'Complete a 30-day fitness journey and document your progress with daily videos', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW() + INTERVAL '30 days', 500.00, 'token', 'active', ARRAY['Post daily workout videos', 'Minimum 20 minutes per session', 'Include progress measurements'], ARRAY['fitness', 'health', 'lifestyle'], 'https://via.placeholder.com/400x300', 100),
  ('650e8400-e29b-41d4-a716-446655440002', 'Short Film Competition', 'Create a 5-minute short film on the theme of "Future Cities"', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW() + INTERVAL '60 days', 1000.00, 'nft', 'active', ARRAY['Maximum 5 minutes duration', 'Original content only', 'Theme: Future Cities'], ARRAY['film', 'creativity', 'competition'], 'https://via.placeholder.com/400x300', 50),
  ('650e8400-e29b-41d4-a716-446655440003', 'Sustainable Living Challenge', 'Document your journey to reduce carbon footprint for 21 days', '550e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '10 days', NOW() + INTERVAL '11 days', 250.00, 'points', 'active', ARRAY['Daily documentation required', 'Focus on practical changes', 'Share tips with community'], ARRAY['sustainability', 'environment', 'lifestyle'], 'https://via.placeholder.com/400x300', 200),
  ('650e8400-e29b-41d4-a716-446655440004', 'Photography Marathon', 'Take and share one photo every day for 14 days with a specific theme', '550e8400-e29b-41d4-a716-446655440001', NOW() + INTERVAL '7 days', NOW() + INTERVAL '21 days', 300.00, 'badge', 'draft', ARRAY['One photo per day', 'Follow daily themes', 'Original photography only'], ARRAY['photography', 'art', 'creativity'], 'https://via.placeholder.com/400x300', 150);

-- Insert challenge participations
INSERT INTO challenge_participations (challenge_id, user_id, status, score, submission_url, submission_description) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'submitted', 85, 'https://example.com/fitness-video-1', 'Completed 25 days of the fitness challenge with consistent progress'),
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 'joined', NULL, NULL, NULL),
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 'joined', NULL, NULL, NULL),
  ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'submitted', 92, 'https://example.com/sustainability-doc', 'Reduced carbon footprint by 40% through various lifestyle changes'),
  ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', 'completed', 78, 'https://example.com/sustainability-final', 'Successfully completed the 21-day challenge');

-- Insert sample films
INSERT INTO films (id, title, description, creator_id, video_url, thumbnail_url, duration, genre, rating, view_count, like_count, status, is_public, challenge_id) VALUES
  ('750e8400-e29b-41d4-a716-446655440001', 'Morning Workout Routine', 'My daily morning workout routine that keeps me energized', '550e8400-e29b-41d4-a716-446655440004', 'https://example.com/workout-video.mp4', 'https://via.placeholder.com/400x300', 1200, ARRAY['fitness', 'lifestyle'], 4.5, 1250, 89, 'published', true, '650e8400-e29b-41d4-a716-446655440001'),
  ('750e8400-e29b-41d4-a716-446655440002', 'Future City Concept', 'A short film exploring what cities might look like in 2050', '550e8400-e29b-41d4-a716-446655440002', 'https://example.com/future-city.mp4', 'https://via.placeholder.com/400x300', 300, ARRAY['sci-fi', 'documentary'], 4.8, 2100, 156, 'published', true, '650e8400-e29b-41d4-a716-446655440002'),
  ('750e8400-e29b-41d4-a716-446655440003', 'Zero Waste Kitchen', 'Tips and tricks for maintaining a zero waste kitchen', '550e8400-e29b-41d4-a716-446655440005', 'https://example.com/zero-waste.mp4', 'https://via.placeholder.com/400x300', 900, ARRAY['lifestyle', 'education'], 4.2, 890, 67, 'published', true, '650e8400-e29b-41d4-a716-446655440003'),
  ('750e8400-e29b-41d4-a716-446655440004', 'Urban Photography Tips', 'How to capture stunning urban landscapes', '550e8400-e29b-41d4-a716-446655440002', 'https://example.com/photography-tips.mp4', 'https://via.placeholder.com/400x300', 720, ARRAY['education', 'photography'], 4.6, 1560, 112, 'published', true, NULL),
  ('750e8400-e29b-41d4-a716-446655440005', 'Real Estate Investment 101', 'Beginner guide to real estate investment', '550e8400-e29b-41d4-a716-446655440003', 'https://example.com/investment-guide.mp4', 'https://via.placeholder.com/400x300', 1800, ARRAY['education', 'finance'], 4.7, 3200, 245, 'published', true, NULL);

-- Insert film likes
INSERT INTO film_likes (film_id, user_id) VALUES
  ('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'),
  ('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003'),
  ('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005'),
  ('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),
  ('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004'),
  ('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002'),
  ('750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003'),
  ('750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001');

-- Insert film comments
INSERT INTO film_comments (film_id, user_id, content) VALUES
  ('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Great workout routine! I''ve been following this for a week now.'),
  ('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Love the energy! What time do you usually do this workout?'),
  ('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Incredible vision of the future! The cinematography is stunning.'),
  ('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 'This gives me hope for sustainable urban development.'),
  ('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Such practical tips! Already implementing some of these.'),
  ('750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'Perfect for beginners like me. Thanks for the clear explanations!');

-- Insert sample properties
INSERT INTO properties (id, name, address, property_type, total_value, creator_id, status, images, metadata) VALUES
  ('850e8400-e29b-41d4-a716-446655440001', 'Downtown Luxury Condo', '123 Main St, New York, NY 10001', 'residential', 750000.00, '550e8400-e29b-41d4-a716-446655440003', 'listed', ARRAY['https://via.placeholder.com/600x400', 'https://via.placeholder.com/600x400'], '{"bedrooms": 2, "bathrooms": 2, "square_feet": 1200, "year_built": 2020, "amenities": ["gym", "rooftop", "concierge"]}'),
  ('850e8400-e29b-41d4-a716-446655440002', 'Commercial Office Space', '456 Business Ave, San Francisco, CA 94105', 'commercial', 1200000.00, '550e8400-e29b-41d4-a716-446655440003', 'listed', ARRAY['https://via.placeholder.com/600x400', 'https://via.placeholder.com/600x400'], '{"square_feet": 5000, "floors": 2, "parking_spaces": 10, "year_built": 2018}'),
  ('850e8400-e29b-41d4-a716-446655440003', 'Suburban Family Home', '789 Oak Street, Austin, TX 78701', 'residential', 450000.00, '550e8400-e29b-41d4-a716-446655440002', 'listed', ARRAY['https://via.placeholder.com/600x400', 'https://via.placeholder.com/600x400'], '{"bedrooms": 4, "bathrooms": 3, "square_feet": 2500, "year_built": 2015, "amenities": ["pool", "garden", "garage"]}'),
  ('850e8400-e29b-41d4-a716-446655440004', 'Industrial Warehouse', '321 Industrial Blvd, Chicago, IL 60601', 'industrial', 2000000.00, '550e8400-e29b-41d4-a716-446655440001', 'draft', ARRAY['https://via.placeholder.com/600x400'], '{"square_feet": 25000, "loading_docks": 8, "ceiling_height": 30, "year_built": 2010}');

-- Insert property shares (fractional ownership)
INSERT INTO property_shares (property_id, owner_id, shares, total_shares, purchase_price, purchase_date) VALUES
  ('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 6000, 10000, 450000.00, NOW() - INTERVAL '30 days'),
  ('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 2500, 10000, 187500.00, NOW() - INTERVAL '15 days'),
  ('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 1500, 10000, 112500.00, NOW() - INTERVAL '5 days'),
  ('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 8000, 10000, 960000.00, NOW() - INTERVAL '45 days'),
  ('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 2000, 10000, 240000.00, NOW() - INTERVAL '20 days');

-- Insert user follows (social connections)
INSERT INTO user_follows (follower_id, following_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003'),
  ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003'),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003'),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002');

-- Insert sample notifications
INSERT INTO notifications (user_id, type, title, message, data) VALUES
  ('550e8400-e29b-41d4-a716-446655440004', 'challenge', 'New Challenge Available!', 'A new photography challenge has been created that you might be interested in.', '{"challenge_id": "650e8400-e29b-41d4-a716-446655440004"}'),
  ('550e8400-e29b-41d4-a716-446655440004', 'film', 'Your film received a like!', 'Someone liked your "Morning Workout Routine" video.', '{"film_id": "750e8400-e29b-41d4-a716-446655440001"}'),
  ('550e8400-e29b-41d4-a716-446655440005', 'property', 'Property Share Purchase Confirmed', 'Your purchase of shares in Downtown Luxury Condo has been confirmed.', '{"property_id": "850e8400-e29b-41d4-a716-446655440001", "shares": 1500}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'system', 'Welcome to GoReal Platform!', 'Thank you for joining our community of creators and challengers.', '{}'),
  ('550e8400-e29b-41d4-a716-446655440003', 'challenge', 'Challenge Completed!', 'Congratulations! Your Sustainable Living Challenge has been completed successfully.', '{"challenge_id": "650e8400-e29b-41d4-a716-446655440003"}');

-- Update challenge participant counts (this will be handled by triggers in real usage)
UPDATE challenges SET current_participants = (
  SELECT COUNT(*) FROM challenge_participations WHERE challenge_id = challenges.id
);

-- Update film like counts (this will be handled by triggers in real usage)
UPDATE films SET like_count = (
  SELECT COUNT(*) FROM film_likes WHERE film_id = films.id
);

-- Add some additional SQL functions for testing
CREATE OR REPLACE FUNCTION increment_film_views(film_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE films SET view_count = view_count + 1 WHERE id = film_id;
END;
$$ LANGUAGE plpgsql;

-- Refresh the materialized views if any exist
-- (None in our current schema, but good practice)

COMMIT;
