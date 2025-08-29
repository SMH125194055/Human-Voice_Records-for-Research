# Development Guide

This guide provides detailed instructions for developing and running the Voice Recording Web App.

## Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **Git**
- **Supabase account**

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Human-Voice_Records-for-Research
   ```

2. **Run the setup script**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Set up Supabase**
   - Follow the instructions in `docs/supabase-setup.md`
   - Update environment variables in both frontend and backend

4. **Start the application**
   ```bash
   # Terminal 1: Start backend
   cd backend
   source venv/bin/activate
   uvicorn main:app --reload --host 0.0.0.0 --port 8000

   # Terminal 2: Start frontend
   cd frontend
   npm start
   ```

## Project Structure

```
├── frontend/                 # React TypeScript application
│   ├── public/              # Static files
│   ├── src/                 # Source code
│   │   ├── components/      # React components
│   │   │   ├── auth/        # Authentication components
│   │   │   └── ...          # Other components
│   │   ├── contexts/        # React contexts
│   │   └── ...              # Other source files
│   ├── package.json         # Frontend dependencies
│   └── tailwind.config.js   # Tailwind CSS configuration
├── backend/                  # FastAPI Python application
│   ├── main.py              # Main FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── uploads/             # Audio file storage
├── docs/                    # Documentation
└── README.md               # Project overview
```

## Development Workflow

### Frontend Development

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**
   ```bash
   npm start
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

### Backend Development

1. **Set up virtual environment**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start development server**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Run tests**
   ```bash
   pytest
   ```

## Environment Variables

### Frontend (.env)
```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_URL=http://localhost:8000
```

### Backend (.env)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
DATABASE_URL=your_database_url
```

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Recordings
- `POST /recordings/upload` - Upload voice recording
- `GET /recordings/user/{user_id}` - Get user recordings
- `GET /recordings/{recording_id}` - Get specific recording
- `DELETE /recordings/{recording_id}` - Delete recording

## Key Features

### Voice Recording
- **Microphone Access**: Uses Web Audio API for browser-based recording
- **Real-time Preview**: Play recorded audio before submission
- **File Upload**: Secure file upload to backend
- **Form Validation**: Client-side validation with react-hook-form

### Authentication
- **Supabase Auth**: Email/password authentication
- **JWT Tokens**: Secure API access
- **Protected Routes**: React Router with authentication guards

### Database
- **PostgreSQL**: Supabase database
- **Row Level Security**: User data isolation
- **Automatic User Profiles**: Trigger-based profile creation

## Development Tips

### Frontend
1. **Component Structure**: Use functional components with TypeScript
2. **State Management**: Use React hooks and context for state
3. **Styling**: Use Tailwind CSS for consistent styling
4. **Error Handling**: Implement proper error boundaries and user feedback

### Backend
1. **API Design**: Follow RESTful conventions
2. **Validation**: Use Pydantic models for request/response validation
3. **Error Handling**: Implement proper HTTP status codes and error messages
4. **Security**: Use JWT tokens and proper authentication

### Database
1. **Migrations**: Use Supabase migrations for schema changes
2. **Indexing**: Add indexes for frequently queried columns
3. **Security**: Enable RLS and create appropriate policies

## Testing

### Frontend Testing
```bash
cd frontend
npm test
```

### Backend Testing
```bash
cd backend
source venv/bin/activate
pytest
```

## Deployment

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to your preferred hosting service (Vercel, Netlify, etc.)
3. Update environment variables for production

### Backend Deployment
1. Deploy to your preferred hosting service (Railway, Heroku, etc.)
2. Set up environment variables
3. Configure CORS for your frontend domain

### Database
1. Use Supabase production instance
2. Set up proper backup and monitoring
3. Configure production environment variables

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS configuration in backend
   - Verify frontend URL is allowed

2. **Authentication Issues**
   - Verify Supabase credentials
   - Check JWT token expiration

3. **File Upload Issues**
   - Check file size limits
   - Verify upload directory permissions

4. **Database Connection**
   - Verify Supabase connection string
   - Check database schema and policies

### Debug Mode

Enable debug mode for more detailed logging:

```bash
# Backend
uvicorn main:app --reload --log-level debug

# Frontend
REACT_APP_DEBUG=true npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Resources

- [React Documentation](https://reactjs.org/docs/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)


