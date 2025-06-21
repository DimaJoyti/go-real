-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE films ENABLE ROW LEVEL SECURITY;
ALTER TABLE film_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE film_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Challenges policies
CREATE POLICY "Challenges are viewable by everyone" ON challenges
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create challenges" ON challenges
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own challenges" ON challenges
    FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own challenges" ON challenges
    FOR DELETE USING (auth.uid() = creator_id);

-- Challenge participations policies
CREATE POLICY "Challenge participations are viewable by everyone" ON challenge_participations
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join challenges" ON challenge_participations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own participations" ON challenge_participations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own participations" ON challenge_participations
    FOR DELETE USING (auth.uid() = user_id);

-- Films policies
CREATE POLICY "Public films are viewable by everyone" ON films
    FOR SELECT USING (is_public = true OR auth.uid() = creator_id);

CREATE POLICY "Authenticated users can create films" ON films
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own films" ON films
    FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own films" ON films
    FOR DELETE USING (auth.uid() = creator_id);

-- Film likes policies
CREATE POLICY "Film likes are viewable by everyone" ON film_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like films" ON film_likes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own likes" ON film_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Film comments policies
CREATE POLICY "Film comments are viewable by everyone" ON film_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment on films" ON film_comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own comments" ON film_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON film_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Properties policies
CREATE POLICY "Properties are viewable by everyone" ON properties
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create properties" ON properties
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own properties" ON properties
    FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own properties" ON properties
    FOR DELETE USING (auth.uid() = creator_id);

-- Property shares policies
CREATE POLICY "Property shares are viewable by everyone" ON property_shares
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can buy property shares" ON property_shares
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own shares" ON property_shares
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own shares" ON property_shares
    FOR DELETE USING (auth.uid() = owner_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- User follows policies
CREATE POLICY "User follows are viewable by everyone" ON user_follows
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can follow others" ON user_follows
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" ON user_follows
    FOR DELETE USING (auth.uid() = follower_id);

-- Admin policies (for users with admin role)
CREATE POLICY "Admins can do everything on profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can do everything on challenges" ON challenges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can do everything on films" ON films
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can do everything on properties" ON properties
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is creator
CREATE OR REPLACE FUNCTION is_creator(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND role IN ('creator', 'admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
