# 🚀 Vercel Deployment Guide

## Overview
This guide will help you deploy your Voice Recording Web App to Vercel.

## Architecture
- **Frontend**: React app deployed on Vercel
- **Backend**: FastAPI deployed on Vercel
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (for audio files)

## Step 1: Set Up Supabase

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com/)
   - Create new project
   - Run the SQL commands from `docs/supabase-setup.md`

2. **Get API Keys**:
   - Project URL
   - anon public key
   - service_role secret key

## Step 2: Deploy Backend to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy Backend**:
   ```bash
   cd backend
   vercel
   ```

3. **Set Environment Variables**:
   - Go to Vercel Dashboard > Your Project > Settings > Environment Variables
   - Add:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_KEY`: Your Supabase service role key

4. **Note the Backend URL**: You'll get a URL like `https://your-backend.vercel.app`

## Step 3: Deploy Frontend to Vercel

1. **Update Frontend Environment**:
   - Update `frontend/.env` with your Supabase credentials
   - Update `REACT_APP_API_URL` with your backend URL

2. **Deploy Frontend**:
   ```bash
   cd frontend
   vercel
   ```

3. **Set Environment Variables**:
   - Go to Vercel Dashboard > Your Project > Settings > Environment Variables
   - Add:
     - `REACT_APP_SUPABASE_URL`: Your Supabase project URL
     - `REACT_APP_SUPABASE_ANON_KEY`: Your Supabase anon key
     - `REACT_APP_API_URL`: Your backend URL

## Step 4: Configure Supabase for Production

1. **Update Authentication Settings**:
   - Go to Supabase Dashboard > Authentication > Settings
   - Add your Vercel domain to Site URL and Redirect URLs

2. **Set up Supabase Storage** (for audio files):
   - Go to Storage in Supabase Dashboard
   - Create bucket called `audio-recordings`
   - Set to private
   - Add storage policies (see `docs/supabase-setup.md`)

## Step 5: Update CORS Settings

1. **Update Backend CORS**:
   - In `backend/main.py`, update the `allow_origins` list with your Vercel domain
   - Redeploy backend if needed

## Step 6: Test Your Deployment

1. **Test Frontend**: Visit your Vercel frontend URL
2. **Test Registration**: Try creating a new account
3. **Test Recording**: Try recording and uploading audio
4. **Check Database**: Verify data appears in Supabase

## Environment Variables Summary

### Frontend (.env)
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
REACT_APP_API_URL=https://your-backend.vercel.app
```

### Backend (Vercel Environment Variables)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key
```

## Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Check that your frontend domain is in the backend CORS settings
   - Verify environment variables are set correctly

2. **Authentication Errors**:
   - Check Supabase credentials
   - Verify redirect URLs in Supabase settings

3. **File Upload Issues**:
   - Set up Supabase Storage properly
   - Check storage policies

4. **Build Errors**:
   - Check that all dependencies are in package.json
   - Verify Node.js version compatibility

## Production Considerations

1. **Custom Domain**: Set up custom domain in Vercel
2. **SSL**: Vercel provides SSL automatically
3. **CDN**: Vercel provides global CDN
4. **Monitoring**: Use Vercel Analytics
5. **Backups**: Set up Supabase backups

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
