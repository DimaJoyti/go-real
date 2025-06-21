-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']), -- 5MB limit
    ('challenge-images', 'challenge-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']), -- 10MB limit
    ('films', 'films', true, 524288000, ARRAY['video/mp4', 'video/webm', 'video/quicktime']), -- 500MB limit
    ('film-thumbnails', 'film-thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']), -- 5MB limit
    ('property-images', 'property-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']), -- 10MB limit
    ('property-documents', 'property-documents', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']); -- 50MB limit

-- Storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage policies for challenge images bucket
CREATE POLICY "Challenge images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'challenge-images');

CREATE POLICY "Authenticated users can upload challenge images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'challenge-images' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update challenge images they uploaded" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'challenge-images' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete challenge images they uploaded" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'challenge-images' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage policies for films bucket
CREATE POLICY "Films are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'films');

CREATE POLICY "Authenticated users can upload films" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'films' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update films they uploaded" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'films' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete films they uploaded" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'films' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage policies for film thumbnails bucket
CREATE POLICY "Film thumbnails are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'film-thumbnails');

CREATE POLICY "Authenticated users can upload film thumbnails" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'film-thumbnails' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update film thumbnails they uploaded" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'film-thumbnails' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete film thumbnails they uploaded" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'film-thumbnails' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage policies for property images bucket
CREATE POLICY "Property images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'property-images' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update property images they uploaded" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'property-images' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete property images they uploaded" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'property-images' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage policies for property documents bucket (private)
CREATE POLICY "Property documents are accessible to property owners and admins" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'property-documents' 
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('admin', 'super_admin')
            )
            OR EXISTS (
                SELECT 1 FROM property_shares ps
                JOIN properties p ON ps.property_id = p.id
                WHERE ps.owner_id = auth.uid()
                AND (storage.foldername(name))[2] = p.id::text
            )
        )
    );

CREATE POLICY "Property owners can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'property-documents' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Property owners can update their documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'property-documents' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Property owners can delete their documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'property-documents' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Admin policies for storage
CREATE POLICY "Admins can do everything on storage" ON storage.objects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );
