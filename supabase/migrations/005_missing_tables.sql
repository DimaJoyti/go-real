-- Add missing tables for film bookmarks and comment likes

-- Film bookmarks table (for saving films)
CREATE TABLE film_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    film_id UUID REFERENCES films(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(film_id, user_id)
);

-- Film comment likes table (for liking comments)
CREATE TABLE film_comment_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID REFERENCES film_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_film_bookmarks_film_id ON film_bookmarks(film_id);
CREATE INDEX idx_film_bookmarks_user_id ON film_bookmarks(user_id);
CREATE INDEX idx_film_comment_likes_comment_id ON film_comment_likes(comment_id);
CREATE INDEX idx_film_comment_likes_user_id ON film_comment_likes(user_id);

-- Enable Row Level Security
ALTER TABLE film_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE film_comment_likes ENABLE ROW LEVEL SECURITY;

-- Film bookmarks policies
CREATE POLICY "Film bookmarks are viewable by owner" ON film_bookmarks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can bookmark films" ON film_bookmarks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" ON film_bookmarks
    FOR DELETE USING (auth.uid() = user_id);

-- Film comment likes policies
CREATE POLICY "Film comment likes are viewable by everyone" ON film_comment_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like comments" ON film_comment_likes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment likes" ON film_comment_likes
    FOR DELETE USING (auth.uid() = user_id);
