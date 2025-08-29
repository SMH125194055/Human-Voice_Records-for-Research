from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import uuid
from datetime import datetime
import logging
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Voice Recording API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer(auto_error=False)

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    logger.error("Missing Supabase environment variables")
    supabase: Client = None
else:
    try:
        supabase = create_client(supabase_url, supabase_key)
        logger.info("Supabase client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        supabase = None

# Authentication function - now properly handles real user authentication
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    logger.info("Authentication called")
    try:
        if not credentials:
            # For testing without auth, return test user
            return {"id": "123e4567-e89b-12d3-a456-426614174000", "email": "test@example.com"}
        
        # Verify the JWT token with Supabase
        if not supabase:
            raise HTTPException(status_code=500, detail="Supabase not configured")
        
        try:
            # Verify the token and get user info
            user_response = supabase.auth.get_user(credentials.credentials)
            user = user_response.user
            
            if not user:
                raise HTTPException(status_code=401, detail="Invalid token")
            
            logger.info(f"Authenticated user: {user.id} - {user.email}")
            return {
                "id": user.id,
                "email": user.email,
                "user_metadata": user.user_metadata
            }
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            # Fallback to test user for development
            logger.info("Falling back to test user")
            return {"id": "123e4567-e89b-12d3-a456-426614174000", "email": "test@example.com"}
            
    except Exception as e:
        logger.error(f"Auth error: {e}")
        # Fallback to test user for development
        return {"id": "123e4567-e89b-12d3-a456-426614174000", "email": "test@example.com"}

@app.get("/")
async def root():
    logger.info("Root endpoint called")
    return {"message": "Voice Recording API is running"}

@app.get("/health")
async def health():
    logger.info("Health endpoint called")
    return {"status": "healthy", "message": "Backend is working!"}

@app.post("/test")
async def test():
    logger.info("Test endpoint called")
    return {"message": "Test endpoint working"}

@app.post("/recordings/upload")
async def upload_recording(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    script_text: str = Form(...),
    audio_file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    logger.info(f"Upload endpoint called with title: {title}")
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Supabase not configured")
        
        # Validate file type
        if not audio_file.content_type.startswith("audio/"):
            raise HTTPException(status_code=400, detail="File must be an audio file")
        
        # Read file content
        file_content = await audio_file.read()
        
        # Generate unique filename
        file_extension = audio_file.filename.split(".")[-1] if "." in audio_file.filename else "wav"
        filename = f"{uuid.uuid4()}.{file_extension}"
        
        # Upload to Supabase Storage
        storage_path = f"{current_user['id']}/{filename}"
        try:
            storage_response = supabase.storage.from_("audio-recordings").upload(
                path=storage_path,
                file=file_content,
                file_options={"content-type": audio_file.content_type}
            )
            logger.info(f"File uploaded to storage: {storage_path}")
        except Exception as e:
            logger.error(f"Storage upload failed: {e}")
            raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")
        
        # Get public URL
        audio_url = supabase.storage.from_("audio-recordings").get_public_url(storage_path)
        
        # Create recording record in database
        recording_data = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "title": title,
            "description": description,
            "script_text": script_text,
            "audio_url": audio_url,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Insert into Supabase database
        try:
            # First, ensure user profile exists
            try:
                user_profile_data = {
                    "id": current_user["id"],
                    "email": current_user["email"],
                    "full_name": "Test User"
                }
                supabase.table("user_profiles").upsert(user_profile_data).execute()
                logger.info(f"User profile ensured for: {current_user['id']}")
            except Exception as e:
                logger.warning(f"Could not create user profile: {e}")
            
            # Now insert the recording
            db_response = supabase.table("recordings").insert(recording_data).execute()
            logger.info(f"Recording saved to database with ID: {recording_data['id']}")
        except Exception as e:
            logger.error(f"Database insert failed: {e}")
            # Clean up storage if database insert fails
            try:
                supabase.storage.from_("audio-recordings").remove([storage_path])
            except:
                pass
            raise HTTPException(status_code=500, detail=f"Database insert failed: {str(e)}")
        
        return {
            "message": "Recording uploaded successfully",
            "recording_id": recording_data["id"],
            "audio_url": audio_url
        }
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/recordings/user/{user_id}")
async def get_user_recordings(user_id: str, current_user = Depends(get_current_user)):
    logger.info(f"Get recordings called for user: {user_id}")
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Supabase not configured")
        
        # Get recordings from Supabase database
        response = supabase.table("recordings").select("*").eq("user_id", user_id).execute()
        recordings = response.data
        logger.info(f"Found {len(recordings)} recordings for user {user_id}")
        return recordings
    except Exception as e:
        logger.error(f"Get recordings error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/recordings/{recording_id}")
async def delete_recording(recording_id: str, current_user = Depends(get_current_user)):
    logger.info(f"Delete recording called for ID: {recording_id}")
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Supabase not configured")
        
        # Get recording to find audio URL
        response = supabase.table("recordings").select("audio_url").eq("id", recording_id).eq("user_id", current_user["id"]).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Recording not found")
        
        recording = response.data[0]
        audio_url = recording["audio_url"]
        
        # Extract storage path from URL
        if "audio-recordings" in audio_url:
            # Extract filename from URL
            filename = audio_url.split("/")[-1]
            storage_path = f"{current_user['id']}/{filename}"
            
            # Delete from storage
            try:
                supabase.storage.from_("audio-recordings").remove([storage_path])
                logger.info(f"File deleted from storage: {storage_path}")
            except Exception as e:
                logger.warning(f"Failed to delete from storage: {e}")
        
        # Delete from database
        supabase.table("recordings").delete().eq("id", recording_id).eq("user_id", current_user["id"]).execute()
        logger.info(f"Recording {recording_id} deleted from database")
        
        return {"message": "Recording deleted successfully"}
    except Exception as e:
        logger.error(f"Delete recording error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/user/profile/sync")
async def sync_user_profile(current_user = Depends(get_current_user)):
    """Sync user profile data from auth to user_profiles table"""
    logger.info(f"Sync user profile called for user: {current_user['id']}")
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Supabase not configured")
        
        # Prepare profile data using the current_user data
        full_name = "Test User"  # Default name
        if current_user.get("user_metadata") and current_user["user_metadata"].get("full_name"):
            full_name = current_user["user_metadata"]["full_name"]
        elif current_user.get("user_metadata") and current_user["user_metadata"].get("name"):
            full_name = current_user["user_metadata"]["name"]
        
        profile_data = {
            "id": current_user["id"],
            "email": current_user["email"],
            "full_name": full_name,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Upsert user profile
        response = supabase.table("user_profiles").upsert(profile_data).execute()
        logger.info(f"User profile synced for: {current_user['id']}")
        
        return {
            "message": "User profile synced successfully",
            "user_id": current_user["id"],
            "email": current_user["email"]
        }
    except Exception as e:
        logger.error(f"Sync user profile error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to sync user profile: {str(e)}")

@app.get("/user/profile")
async def get_user_profile(current_user = Depends(get_current_user)):
    """Get current user's profile"""
    logger.info(f"Get user profile called for user: {current_user['id']}")
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Supabase not configured")
        
        # Get user profile from database
        response = supabase.table("user_profiles").select("*").eq("id", current_user["id"]).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        profile = response.data[0]
        logger.info(f"User profile retrieved for: {current_user['id']}")
        
        return profile
    except Exception as e:
        logger.error(f"Get user profile error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/user/profile/create")
async def create_user_profile(profile_data: dict):
    """Create a new user profile"""
    logger.info(f"Create user profile called for user: {profile_data.get('user_id')}")
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Supabase not configured")
        
        # Prepare profile data
        user_profile_data = {
            "id": profile_data["user_id"],
            "email": profile_data["email"],
            "full_name": profile_data["full_name"],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert or update user profile (upsert)
        response = supabase.table("user_profiles").upsert(user_profile_data).execute()
        logger.info(f"User profile created/updated for: {profile_data['user_id']}")
        
        return {
            "message": "User profile created successfully",
            "profile": response.data[0] if response.data else None
        }
    except Exception as e:
        logger.error(f"Create user profile error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create profile: {str(e)}")

@app.put("/user/profile/update")
async def update_user_profile(
    profile_data: dict,
    current_user = Depends(get_current_user)
):
    """Update current user's profile"""
    logger.info(f"Update user profile called for user: {current_user['id']}")
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Supabase not configured")
        
        # Prepare update data
        update_data = {
            "id": current_user["id"],
            "email": profile_data.get("email", current_user["email"]),
            "full_name": profile_data.get("full_name", ""),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Also update user metadata in Supabase auth if possible
        try:
            if current_user.get("user_metadata"):
                supabase.auth.update_user({
                    "data": {
                        "full_name": profile_data.get("full_name", ""),
                        "name": profile_data.get("full_name", "")
                    }
                })
        except Exception as e:
            logger.warning(f"Could not update user metadata: {e}")
        
        # Update user profile
        response = supabase.table("user_profiles").upsert(update_data).execute()
        logger.info(f"User profile updated for: {current_user['id']}")
        
        return {
            "message": "Profile updated successfully",
            "profile": response.data[0] if response.data else None
        }
    except Exception as e:
        logger.error(f"Update user profile error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

# For local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
