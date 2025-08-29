-- Supabase Storage Setup for Audio Files
-- Run this in your Supabase SQL Editor

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio-recordings',
    'audio-recordings',
    true,
    52428800, -- 50MB limit
    ARRAY['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the audio bucket
CREATE POLICY "Users can upload their own audio files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'audio-recordings' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own audio files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'audio-recordings' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own audio files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'audio-recordings' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own audio files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'audio-recordings' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

