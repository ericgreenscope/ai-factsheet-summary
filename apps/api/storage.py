"""Supabase Storage utilities for upload/download and signed URLs."""
import io
from typing import BinaryIO
from supabase import Client
from config import settings


BUCKET_NAME = "factsheets"


def upload_file_to_storage(
    supabase: Client,
    file_id: str,
    file_data: bytes,
    folder: str = "original",
    extension: str = ".pptx"
) -> str:
    """
    Upload a file to Supabase Storage.

    Args:
        supabase: Supabase client
        file_id: UUID of the file
        file_data: Binary file data
        folder: "original", "regenerated", or "pdf"
        extension: File extension (default ".pptx")

    Returns:
        Storage path (e.g., "factsheets/original/{file_id}.pptx")
    """
    path = f"{folder}/{file_id}{extension}"

    # Determine content type based on extension
    content_types = {
        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".pdf": "application/pdf"
    }
    content_type = content_types.get(extension, "application/octet-stream")

    # Upload file to storage
    supabase.storage.from_(BUCKET_NAME).upload(
        path=path,
        file=file_data,
        file_options={"content-type": content_type}
    )

    return f"{BUCKET_NAME}/{path}"


def download_file_from_storage(
    supabase: Client,
    storage_path: str
) -> bytes:
    """
    Download a file from Supabase Storage.
    
    Args:
        supabase: Supabase client
        storage_path: Full storage path (e.g., "factsheets/original/{file_id}.pptx")
    
    Returns:
        Binary file data
    """
    # Remove bucket name if present in path
    if storage_path.startswith(f"{BUCKET_NAME}/"):
        storage_path = storage_path[len(BUCKET_NAME) + 1:]
    
    response = supabase.storage.from_(BUCKET_NAME).download(storage_path)
    return response


def get_signed_url(
    supabase: Client,
    storage_path: str,
    expires_in: int = 3600
) -> str:
    """
    Generate a signed URL for downloading a file.
    
    Args:
        supabase: Supabase client
        storage_path: Full storage path
        expires_in: URL expiry time in seconds (default 1 hour)
    
    Returns:
        Signed download URL
    """
    # Remove bucket name if present in path
    if storage_path.startswith(f"{BUCKET_NAME}/"):
        storage_path = storage_path[len(BUCKET_NAME) + 1:]
    
    response = supabase.storage.from_(BUCKET_NAME).create_signed_url(
        path=storage_path,
        expires_in=expires_in
    )
    
    return response.get("signedURL", "")

