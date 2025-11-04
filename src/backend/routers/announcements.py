"""
Announcements endpoints for the High School Management System API
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId
import re

from ..database import announcements_collection, teachers_collection, verify_password

router = APIRouter(
    prefix="/announcements",
    tags=["announcements"]
)

# Security scheme
security = HTTPBearer()

class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=2000)
    start_date: Optional[str] = None  # ISO format date string
    expiration_date: str = Field(...)  # ISO format date string, required

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    message: Optional[str] = Field(None, min_length=1, max_length=2000)
    start_date: Optional[str] = None  # ISO format date string
    expiration_date: Optional[str] = None  # ISO format date string

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user from token (username:password base64)"""
    import base64
    try:
        decoded = base64.b64decode(credentials.credentials).decode('utf-8')
    except (base64.binascii.Error, UnicodeDecodeError):
        raise HTTPException(status_code=401, detail="Invalid token encoding")
    try:
        username, password = decoded.split(':', 1)
    except ValueError:
        raise HTTPException(status_code=401, detail="Token format invalid")
    try:
        teacher = teachers_collection.find_one({"_id": username})
    except Exception:
        raise HTTPException(status_code=500, detail="Database error during authentication")
    if not teacher or not verify_password(teacher.get("password", ""), password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return teacher

def validate_date(date_str: str) -> bool:
    """Validate ISO date string format"""
    try:
        datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return True
    except ValueError:
        return False

@router.get("", response_model=List[dict])
def get_announcements():
    """
    Get all active announcements (not expired)
    """
    now = datetime.utcnow()

    # Find announcements that are active (not expired and past start date if set)
    query = {
        "expiration_date": {"$gt": now.isoformat()}
    }

    announcements = []
    for announcement in announcements_collection.find(query):
        # Convert ObjectId to string for JSON serialization
        announcement["_id"] = str(announcement["_id"])
        announcements.append(announcement)

    # Sort by creation date (newest first)
    announcements.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    return announcements

@router.get("/all", response_model=List[dict])
def get_all_announcements(current_user: dict = Depends(get_current_user)):
    """
    Get all announcements (requires authentication)
    """
    announcements = []
    for announcement in announcements_collection.find():
        # Convert ObjectId to string for JSON serialization
        announcement["_id"] = str(announcement["_id"])
        announcements.append(announcement)

    # Sort by creation date (newest first)
    announcements.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    return announcements

@router.post("", response_model=dict)
def create_announcement(
    announcement: AnnouncementCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new announcement (requires authentication)
    """
    # Validate dates
    if announcement.start_date and not validate_date(announcement.start_date):
        raise HTTPException(status_code=400, detail="Invalid start_date format")

    if not validate_date(announcement.expiration_date):
        raise HTTPException(status_code=400, detail="Invalid expiration_date format")

    # Create announcement document
    announcement_doc = {
        "title": announcement.title,
        "message": announcement.message,
        "start_date": announcement.start_date,
        "expiration_date": announcement.expiration_date,
        "created_by": current_user["username"],
        "created_at": datetime.utcnow().isoformat()
    }

    # Insert into database
    result = announcements_collection.insert_one(announcement_doc)

    # Return the created announcement with ID
    announcement_doc["_id"] = str(result.inserted_id)
    return announcement_doc

@router.put("/{announcement_id}", response_model=dict)
def update_announcement(
    announcement_id: str,
    announcement: AnnouncementUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update an existing announcement (requires authentication)
    """
    # Validate ObjectId
    try:
        obj_id = ObjectId(announcement_id)
    except Exception as e:
        from bson.errors import InvalidId
        if isinstance(e, InvalidId):
            raise HTTPException(status_code=400, detail="Invalid announcement ID")
        else:
            raise
        if isinstance(e, InvalidId):
            raise HTTPException(status_code=400, detail="Invalid announcement ID")
        else:
            raise

    # Check if announcement exists
    existing = announcements_collection.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Announcement not found")

    # Validate dates if provided
    if announcement.start_date is not None and not validate_date(announcement.start_date):
        raise HTTPException(status_code=400, detail="Invalid start_date format")

    if announcement.expiration_date is not None and not validate_date(announcement.expiration_date):
        raise HTTPException(status_code=400, detail="Invalid expiration_date format")

    # Build update document
    update_doc = {}
    if announcement.title is not None:
        update_doc["title"] = announcement.title
    if announcement.message is not None:
        update_doc["message"] = announcement.message
    if announcement.start_date is not None:
        update_doc["start_date"] = announcement.start_date
    if announcement.expiration_date is not None:
        update_doc["expiration_date"] = announcement.expiration_date

    if not update_doc:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Update in database
    result = announcements_collection.update_one(
        {"_id": obj_id},
        {"$set": update_doc}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to update announcement")

    # Return updated announcement
    updated = announcements_collection.find_one({"_id": obj_id})
    updated["_id"] = str(updated["_id"])
    return updated

@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete an announcement (requires authentication)
    """
    # Validate ObjectId
    try:
        obj_id = ObjectId(announcement_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid announcement ID")

    # Check if announcement exists
    existing = announcements_collection.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Announcement not found")

    # Delete from database
    result = announcements_collection.delete_one({"_id": obj_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete announcement")

    return {"message": "Announcement deleted successfully"}