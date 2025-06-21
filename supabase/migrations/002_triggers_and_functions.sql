-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenge_participations_updated_at BEFORE UPDATE ON challenge_participations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_films_updated_at BEFORE UPDATE ON films
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_film_comments_updated_at BEFORE UPDATE ON film_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_shares_updated_at BEFORE UPDATE ON property_shares
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update challenge participant count
CREATE OR REPLACE FUNCTION update_challenge_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE challenges 
        SET current_participants = current_participants + 1
        WHERE id = NEW.challenge_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE challenges 
        SET current_participants = current_participants - 1
        WHERE id = OLD.challenge_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for challenge participant count
CREATE TRIGGER challenge_participation_count_insert
    AFTER INSERT ON challenge_participations
    FOR EACH ROW EXECUTE FUNCTION update_challenge_participant_count();

CREATE TRIGGER challenge_participation_count_delete
    AFTER DELETE ON challenge_participations
    FOR EACH ROW EXECUTE FUNCTION update_challenge_participant_count();

-- Function to update film like count
CREATE OR REPLACE FUNCTION update_film_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE films 
        SET like_count = like_count + 1
        WHERE id = NEW.film_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE films 
        SET like_count = like_count - 1
        WHERE id = OLD.film_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for film like count
CREATE TRIGGER film_like_count_insert
    AFTER INSERT ON film_likes
    FOR EACH ROW EXECUTE FUNCTION update_film_like_count();

CREATE TRIGGER film_like_count_delete
    AFTER DELETE ON film_likes
    FOR EACH ROW EXECUTE FUNCTION update_film_like_count();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type notification_type,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (p_user_id, p_type, p_title, p_message, p_data)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user stats
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS TABLE(
    challenges_created INTEGER,
    challenges_participated INTEGER,
    films_created INTEGER,
    properties_created INTEGER,
    total_likes_received INTEGER,
    followers_count INTEGER,
    following_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM challenges WHERE creator_id = p_user_id),
        (SELECT COUNT(*)::INTEGER FROM challenge_participations WHERE user_id = p_user_id),
        (SELECT COUNT(*)::INTEGER FROM films WHERE creator_id = p_user_id),
        (SELECT COUNT(*)::INTEGER FROM properties WHERE creator_id = p_user_id),
        (SELECT COALESCE(SUM(f.like_count), 0)::INTEGER FROM films f WHERE f.creator_id = p_user_id),
        (SELECT COUNT(*)::INTEGER FROM user_follows WHERE following_id = p_user_id),
        (SELECT COUNT(*)::INTEGER FROM user_follows WHERE follower_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

-- Function to get trending challenges
CREATE OR REPLACE FUNCTION get_trending_challenges(p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
    id UUID,
    title TEXT,
    description TEXT,
    creator_id UUID,
    current_participants INTEGER,
    reward_amount DECIMAL,
    reward_type reward_type,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.description,
        c.creator_id,
        c.current_participants,
        c.reward_amount,
        c.reward_type,
        c.image_url,
        c.created_at
    FROM challenges c
    WHERE c.status = 'active'
    ORDER BY c.current_participants DESC, c.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get user feed (films from followed users)
CREATE OR REPLACE FUNCTION get_user_feed(p_user_id UUID, p_limit INTEGER DEFAULT 20, p_offset INTEGER DEFAULT 0)
RETURNS TABLE(
    id UUID,
    title TEXT,
    description TEXT,
    creator_id UUID,
    creator_username TEXT,
    creator_avatar_url TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    duration INTEGER,
    view_count INTEGER,
    like_count INTEGER,
    is_liked BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.title,
        f.description,
        f.creator_id,
        p.username,
        p.avatar_url,
        f.video_url,
        f.thumbnail_url,
        f.duration,
        f.view_count,
        f.like_count,
        EXISTS(SELECT 1 FROM film_likes fl WHERE fl.film_id = f.id AND fl.user_id = p_user_id) as is_liked,
        f.created_at
    FROM films f
    JOIN profiles p ON f.creator_id = p.id
    WHERE f.status = 'published' 
    AND f.is_public = true
    AND (
        f.creator_id IN (SELECT following_id FROM user_follows WHERE follower_id = p_user_id)
        OR f.creator_id = p_user_id
    )
    ORDER BY f.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
