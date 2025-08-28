#!/bin/bash

echo "🎤 Voice Recording Web App Setup"
echo "================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Setup Frontend
echo "📦 Setting up Frontend..."
cd frontend

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating frontend .env file..."
    cp env.example .env
    echo "⚠️  Please update frontend/.env with your Supabase credentials"
fi

cd ..

# Setup Backend
echo "🐍 Setting up Backend..."
cd backend

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing backend dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating backend .env file..."
    cp env.example .env
    echo "⚠️  Please update backend/.env with your Supabase credentials"
fi

# Create uploads directory
mkdir -p uploads

cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Set up your Supabase project (see docs/supabase-setup.md)"
echo "2. Update environment variables in frontend/.env and backend/.env"
echo "3. Start the backend server: cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo "4. Start the frontend: cd frontend && npm start"
echo ""
echo "📚 For detailed setup instructions, see the README.md file"
