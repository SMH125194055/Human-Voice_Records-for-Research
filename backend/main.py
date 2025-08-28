from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
import os
import uuid
from datetime import datetime
import aiofiles
from supabase import create_client, Client
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

app = FastAPI(title="Voice Recording API", version="1.0.0")

# CORS middleware - Update for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://your-frontend-domain.vercel.app",  # Update this with your Vercel domain
        "https://*.vercel.app"  # Allow all Vercel subdomains
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase configuration
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Security
security = HTTPBearer()

# Pydantic models
class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class RecordingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    script_text: str

class RecordingResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    script_text: str
    audio_url: str
    created_at: datetime

# Authentication functions
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        # Verify JWT token with Supabase
        user = supabase.auth.get_user(credentials.credentials)
        return user.user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Routes
@app.get("/")
async def root():
    return {"message": "Voice Recording API is running"}

@app.post("/auth/register")
async def register(user_data: UserCreate):
    try:
        # Create user in Supabase
        response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "name": user_data.name
                }
            }
        })
        
        # Create user profile in database
        supabase.table("user_profiles").insert({
            "id": response.user.id,
            "email": user_data.email,
            "name": user_data.name,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
        return {"message": "User registered successfully", "user_id": response.user.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login")
async def login(user_data: UserLogin):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password
        })
        
        return {
            "access_token": response.session.access_token,
            "user": {
                "id": response.user.id,
                "email": response.user.email
            }
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/recordings/upload")
async def upload_recording(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    script_text: str = Form(...),
    audio_file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    try:
        # Validate file type
        if not audio_file.content_type.startswith("audio/"):
            raise HTTPException(status_code=400, detail="File must be an audio file")
        
        # Generate unique filename
        file_extension = audio_file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_extension}"
        
        # For Vercel, we'll store files in Supabase Storage instead of local filesystem
        # This is a simplified version - in production, use Supabase Storage
        audio_url = f"/uploads/{filename}"  # This will need to be updated for Supabase Storage
        
        # Save recording metadata to database
        recording_data = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.id,
            "title": title,
            "description": description,
            "script_text": script_text,
            "audio_url": audio_url,
            "created_at": datetime.utcnow().isoformat()
        }
        
        supabase.table("recordings").insert(recording_data).execute()
        
        return {
            "message": "Recording uploaded successfully",
            "recording_id": recording_data["id"],
            "audio_url": recording_data["audio_url"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recordings/user/{user_id}", response_model=List[RecordingResponse])
async def get_user_recordings(user_id: str, current_user = Depends(get_current_user)):
    try:
        # Ensure user can only access their own recordings
        if current_user.id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        response = supabase.table("recordings").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        
        recordings = []
        for record in response.data:
            recordings.append(RecordingResponse(**record))
        
        return recordings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recordings/{recording_id}", response_model=RecordingResponse)
async def get_recording(recording_id: str, current_user = Depends(get_current_user)):
    try:
        response = supabase.table("recordings").select("*").eq("id", recording_id).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Recording not found")
        
        # Ensure user can only access their own recordings
        if response.data["user_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return RecordingResponse(**response.data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/recordings/{recording_id}")
async def delete_recording(recording_id: str, current_user = Depends(get_current_user)):
    try:
        # Get recording to check ownership
        response = supabase.table("recordings").select("*").eq("id", recording_id).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Recording not found")
        
        if response.data["user_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete from database
        supabase.table("recordings").delete().eq("id", recording_id).execute()
        
        return {"message": "Recording deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# For Vercel deployment
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
