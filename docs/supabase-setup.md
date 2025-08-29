# Supabase Setup Guide

This guide will help you set up Supabase for the Voice Recording Web App.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `voice-recording-app`
   - Database Password: Choose a strong password
   - Region: Select closest to your users
5. Click "Create new project"

## 2. Database Schema

Run the following SQL commands in your Supabase SQL Editor:

### Create Tables

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recordings table
CREATE TABLE recordings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    script_text TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_recordings_user_id ON recordings(user_id);
CREATE INDEX idx_recordings_created_at ON recordings(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Recordings policies
CREATE POLICY "Users can view own recordings" ON recordings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recordings" ON recordings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recordings" ON recordings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recordings" ON recordings
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'User'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## 3. Configure Authentication

1. Go to Authentication > Settings in your Supabase dashboard
2. Configure the following settings:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000/login`
   - **Enable Email Confirmations**: Optional (recommended for production)

## 4. Get API Keys

1. Go to Settings > API in your Supabase dashboard
2. Copy the following values:
   - **Project URL**: Use this as `SUPABASE_URL`
   - **anon public**: Use this as `REACT_APP_SUPABASE_ANON_KEY`
   - **service_role secret**: Use this as `SUPABASE_KEY` (backend only)

## 5. Environment Variables

### Frontend (.env)
```env
REACT_APP_SUPABASE_URL=your_project_url
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
REACT_APP_API_URL=http://localhost:8000
```

### Backend (.env)
```env
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_service_role_key
DATABASE_URL=your_database_url
```

## 6. Storage Setup (Optional)

If you want to store audio files in Supabase Storage instead of local filesystem:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `audio-recordings`
3. Set the bucket to private
4. Create storage policies:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload audio files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'audio-recordings' AND
        auth.role() = 'authenticated'
    );

-- Allow users to view their own files
CREATE POLICY "Users can view own audio files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'audio-recordings' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to delete their own files
CREATE POLICY "Users can delete own audio files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'audio-recordings' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
```

## 7. Testing the Setup

1. Start your backend server
2. Start your frontend application
3. Try to register a new user
4. Verify that the user profile is created in the database
5. Test recording and uploading functionality

## 8. Production Considerations

For production deployment:

1. Update Site URL and Redirect URLs in Supabase settings
2. Use environment-specific API keys
3. Set up proper CORS policies
4. Configure email templates for authentication
5. Set up monitoring and logging
6. Consider using Supabase Storage for audio files instead of local storage

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure your frontend URL is added to the allowed origins in Supabase
2. **Authentication Errors**: Verify your API keys are correct
3. **Database Errors**: Check that all tables and policies are created correctly
4. **File Upload Issues**: Ensure storage bucket and policies are configured properly

### Useful Commands

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Check user profiles
SELECT * FROM user_profiles;

-- Check recordings
SELECT * FROM recordings;
```


