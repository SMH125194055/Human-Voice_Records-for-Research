# Voice Recording Web App

A web application for recording voice samples with user authentication and form submission.

## Features

- User authentication via email
- Voice recording functionality
- Form submission with voice data
- Real-time audio preview
- Secure data storage with Supabase

## Tech Stack

- **Frontend**: React.js with TypeScript
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Audio Processing**: Web Audio API

## Project Structure

```
├── frontend/          # React application
├── backend/           # FastAPI server
├── docs/             # Documentation
└── README.md         # This file
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- Supabase account

### Frontend Setup

1. Navigate to the frontend directory
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start development server: `npm start`

### Backend Setup

1. Navigate to the backend directory
2. Create virtual environment: `python -m venv venv`
3. Activate virtual environment
4. Install dependencies: `pip install -r requirements.txt`
5. Set up environment variables
6. Start server: `uvicorn main:app --reload`

## Environment Variables

### Frontend (.env)
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_URL=http://localhost:8000
```

### Backend (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
DATABASE_URL=your_database_url
```

## API Endpoints

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /recordings/upload` - Upload voice recording
- `GET /recordings/user/{user_id}` - Get user recordings
- `GET /recordings/{recording_id}` - Get specific recording

## Usage

1. Register/Login with email
2. Fill out the form with required information
3. Record your voice using the microphone
4. Preview and submit the recording
5. View your submitted recordings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
