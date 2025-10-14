"""FastAPI main application for ESG Factsheet AI."""
import uuid
import io
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from supabase import create_client, Client
from openpyxl import Workbook

from config import settings
from storage import upload_file_to_storage, download_file_from_storage, get_signed_url
from pptx_utils import extract_text_from_pptx, insert_text_into_ai_summary, truncate_text_for_llm
from ai_service import generate_esg_summary, format_summary_for_pptx, format_bullets_as_text


# Initialize FastAPI app
app = FastAPI(
    title="ESG Factsheet AI",
    description="API for ESG factsheet analysis and regeneration",
    version="1.0.0"
)

# CORS middleware
# CORS middleware will be added after app creation

# Initialize Supabase client
# Initialize Supabase client lazily to avoid import-time issues
_supabase_client = None

def get_supabase_client() -> Client:
    """Get Supabase client, creating it if necessary."""
    global _supabase_client
    if _supabase_client is None:
        try:
            _supabase_client = create_client(
                settings.supabase_url,
                settings.supabase_service_role_key
            )
        except Exception as e:
            print(f"Supabase client creation error: {e}")
            # Try alternative initialization
            from supabase import create_client as create_supabase_client
            _supabase_client = create_supabase_client(
                settings.supabase_url,
                settings.supabase_service_role_key
            )
    return _supabase_client

# Supabase client is now accessed via get_supabase_client()


# Pydantic models
class ReviewRequest(BaseModel):
    suggestion_id: str
    strengths_final: str
    weaknesses_final: str
    action_plan_final: str
    editor_notes: Optional[str] = None


class FileResponse(BaseModel):
    id: str
    company_name: Optional[str]
    original_filename: str
    created_at: str
    suggestion: Optional[dict] = None
    review: Optional[dict] = None
    jobs: List[dict] = []
    download_url_original: Optional[str] = None
    download_url_regenerated: Optional[str] = None


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/healthz")
async def health_check():
    """Health check endpoint."""
    return {"ok": True, "service": "esg-factsheet-ai"}


# Upload endpoint
@app.post("/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    company_name: Optional[str] = Form(None)
):
    """
    Upload multiple PPTX files.
    
    Args:
        files: List of PPTX files
        company_name: Optional company name
    
    Returns:
        List of created file records
    """
    results = []
    
    for file in files:
        # Validate file type
        if not file.filename.endswith('.pptx'):
            raise HTTPException(status_code=400, detail=f"File {file.filename} is not a PPTX")
        
        # Generate file ID
        file_id = str(uuid.uuid4())
        
        # Read file data
        file_data = await file.read()
        
        # Upload to Supabase Storage
        try:
            storage_path = upload_file_to_storage(
                get_supabase_client(),
                file_id,
                file_data,
                folder="original"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload {file.filename}: {str(e)}")

        # Insert file record
        file_record = {
            "id": file_id,
            "company_name": company_name,
            "original_filename": file.filename,
            "storage_path_original": storage_path,
            "language": "en"
        }

        try:
            response = get_supabase_client().table("files").insert(file_record).execute()
            created_file = response.data[0] if response.data else file_record
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create file record: {str(e)}")
        
        results.append(created_file)
    
    return results


# Analyze endpoint
@app.post("/analyze/{file_id}")
async def analyze_file(file_id: str):
    """
    Analyze a PPTX file and generate AI summary.
    
    Args:
        file_id: UUID of the file
    
    Returns:
        Created suggestion record
    """
    # Create job record
    job_id = str(uuid.uuid4())
    job_record = {
        "id": job_id,
        "file_id": file_id,
        "type": "ANALYZE",
        "status": "RUNNING"
    }
    
    try:
        get_supabase_client().table("jobs").insert(job_record).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")
    
    try:
        # Get file record
        file_response = get_supabase_client().table("files").select("*").eq("id", file_id).execute()
        if not file_response.data:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_record = file_response.data[0]
        
        # Download PPTX from storage
        pptx_bytes = download_file_from_storage(get_supabase_client(), file_record["storage_path_original"])
        
        # Extract text
        extracted_text = extract_text_from_pptx(pptx_bytes)
        
        # Truncate if needed
        extracted_text = truncate_text_for_llm(extracted_text)
        
        # Generate AI summary
        summary = generate_esg_summary(extracted_text)
        
        # Create suggestion record
        suggestion_record = {
            "id": str(uuid.uuid4()),
            "file_id": file_id,
            "model_name": summary["model_name"],
            "raw_model_output": summary["raw_output"],
            "strengths": format_bullets_as_text(summary["strengths"]),
            "weaknesses": format_bullets_as_text(summary["weaknesses"]),
            "action_plan": format_bullets_as_text(summary["action_plan"])
        }
        
        suggestion_response = get_supabase_client().table("suggestions").insert(suggestion_record).execute()
        created_suggestion = suggestion_response.data[0] if suggestion_response.data else suggestion_record
        
        # Update job status
        get_supabase_client().table("jobs").update({"status": "SUCCEEDED"}).eq("id", job_id).execute()
        
        return created_suggestion
        
    except Exception as e:
        # Update job status to failed
        get_supabase_client().table("jobs").update({
            "status": "FAILED",
            "error": str(e)
        }).eq("id", job_id).execute()
        
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# Review endpoint
@app.post("/review/{file_id}")
async def save_review(file_id: str, review: ReviewRequest):
    """
    Save or update a review draft.
    
    Args:
        file_id: UUID of the file
        review: Review data
    
    Returns:
        Created/updated review record
    """
    # Check if review already exists for this file
    existing_response = get_supabase_client().table("reviews").select("*").eq("file_id", file_id).execute()
    
    review_data = {
        "file_id": file_id,
        "suggestion_id": review.suggestion_id,
        "strengths_final": review.strengths_final,
        "weaknesses_final": review.weaknesses_final,
        "action_plan_final": review.action_plan_final,
        "editor_notes": review.editor_notes,
        "status": "DRAFT"
    }
    
    if existing_response.data:
        # Update existing review
        review_id = existing_response.data[0]["id"]
        response = get_supabase_client().table("reviews").update(review_data).eq("id", review_id).execute()
    else:
        # Create new review
        review_data["id"] = str(uuid.uuid4())
        response = get_supabase_client().table("reviews").insert(review_data).execute()
    
    return response.data[0] if response.data else review_data


# Approve endpoint
@app.post("/approve/{file_id}")
async def approve_and_regenerate(file_id: str):
    """
    Approve review and regenerate PPTX with AI summary.
    
    Args:
        file_id: UUID of the file
    
    Returns:
        Updated file record with regenerated path
    """
    # Create job record
    job_id = str(uuid.uuid4())
    job_record = {
        "id": job_id,
        "file_id": file_id,
        "type": "REGENERATE",
        "status": "RUNNING"
    }
    
    try:
        get_supabase_client().table("jobs").insert(job_record).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")
    
    try:
        # Get file record
        file_response = get_supabase_client().table("files").select("*").eq("id", file_id).execute()
        if not file_response.data:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_record = file_response.data[0]
        
        # Get latest review
        review_response = get_supabase_client().table("reviews").select("*").eq("file_id", file_id).execute()
        if not review_response.data:
            raise HTTPException(status_code=404, detail="No review found for this file")
        
        review = review_response.data[0]
        
        # Parse bullets (split by newlines and remove "- " prefix)
        def parse_bullets(text: str) -> List[str]:
            lines = [line.strip() for line in text.split('\n') if line.strip()]
            return [line.lstrip('- ').strip() for line in lines]
        
        strengths = parse_bullets(review["strengths_final"])
        weaknesses = parse_bullets(review["weaknesses_final"])
        action_plan = parse_bullets(review["action_plan_final"])
        
        # Format summary text
        summary_text = format_summary_for_pptx(strengths, weaknesses, action_plan)
        
        # Download original PPTX
        pptx_bytes = download_file_from_storage(get_supabase_client(), file_record["storage_path_original"])
        
        # Insert text into AI_SUMMARY shape
        try:
            regenerated_pptx = insert_text_into_ai_summary(pptx_bytes, summary_text)
        except ValueError as e:
            # Update job status to failed
            get_supabase_client().table("jobs").update({
                "status": "FAILED",
                "error": str(e)
            }).eq("id", job_id).execute()
            raise HTTPException(status_code=400, detail=str(e))
        
        # Upload regenerated PPTX
        storage_path_regenerated = upload_file_to_storage(
            get_supabase_client(),
            file_id,
            regenerated_pptx,
            folder="regenerated"
        )
        
        # Update file record
        get_supabase_client().table("files").update({
            "storage_path_regenerated": storage_path_regenerated
        }).eq("id", file_id).execute()
        
        # Mark review as approved
        get_supabase_client().table("reviews").update({"status": "APPROVED"}).eq("id", review["id"]).execute()
        
        # Update job status
        get_supabase_client().table("jobs").update({"status": "SUCCEEDED"}).eq("id", job_id).execute()
        
        # Return updated file record
        updated_file = get_supabase_client().table("files").select("*").eq("id", file_id).execute()
        return updated_file.data[0] if updated_file.data else file_record
        
    except HTTPException:
        raise
    except Exception as e:
        # Update job status to failed
        get_supabase_client().table("jobs").update({
            "status": "FAILED",
            "error": str(e)
        }).eq("id", job_id).execute()
        
        raise HTTPException(status_code=500, detail=f"Regeneration failed: {str(e)}")


# Get single file endpoint
@app.get("/file/{file_id}")
async def get_file(file_id: str):
    """
    Get file details with suggestions, reviews, and download URLs.
    
    Args:
        file_id: UUID of the file
    
    Returns:
        File record with merged data
    """
    # Get file record
    file_response = get_supabase_client().table("files").select("*").eq("id", file_id).execute()
    if not file_response.data:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_record = file_response.data[0]
    
    # Get latest suggestion
    suggestion_response = get_supabase_client().table("suggestions").select("*").eq("file_id", file_id).order("created_at", desc=True).limit(1).execute()
    suggestion = suggestion_response.data[0] if suggestion_response.data else None
    
    # Get latest review
    review_response = get_supabase_client().table("reviews").select("*").eq("file_id", file_id).order("updated_at", desc=True).limit(1).execute()
    review = review_response.data[0] if review_response.data else None
    
    # Get jobs
    jobs_response = get_supabase_client().table("jobs").select("*").eq("file_id", file_id).order("created_at", desc=True).execute()
    jobs = jobs_response.data if jobs_response.data else []
    
    # Generate signed URLs
    download_url_original = None
    download_url_regenerated = None
    
    if file_record.get("storage_path_original"):
        try:
            download_url_original = get_signed_url(get_supabase_client(), file_record["storage_path_original"])
        except:
            pass
    
    if file_record.get("storage_path_regenerated"):
        try:
            download_url_regenerated = get_signed_url(get_supabase_client(), file_record["storage_path_regenerated"])
        except:
            pass
    
    return {
        "id": file_record["id"],
        "company_name": file_record.get("company_name"),
        "original_filename": file_record["original_filename"],
        "created_at": file_record["created_at"],
        "suggestion": suggestion,
        "review": review,
        "jobs": jobs,
        "download_url_original": download_url_original,
        "download_url_regenerated": download_url_regenerated
    }


# List all files endpoint
@app.get("/files")
async def list_files():
    """
    List all files with basic info.
    
    Returns:
        List of file records
    """
    response = get_supabase_client().table("files").select("*").order("created_at", desc=True).execute()
    return response.data if response.data else []


# Export to Excel endpoint
@app.get("/export/excel")
async def export_to_excel():
    """
    Export all approved summaries to Excel.
    
    Returns:
        Excel file download
    """
    # Get all approved reviews with file info
    reviews_response = get_supabase_client().table("reviews").select("*, files(*)").eq("status", "APPROVED").execute()
    
    if not reviews_response.data:
        raise HTTPException(status_code=404, detail="No approved reviews found")
    
    # Create workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "ESG Summaries"
    
    # Headers
    headers = ["File ID", "Company Name", "Filename", "Strengths", "Weaknesses", "Action Plan", "Created At"]
    ws.append(headers)
    
    # Data rows
    for review in reviews_response.data:
        file_info = review.get("files", {})
        row = [
            review["file_id"],
            file_info.get("company_name", ""),
            file_info.get("original_filename", ""),
            review["strengths_final"],
            review["weaknesses_final"],
            review["action_plan_final"],
            review["created_at"]
        ]
        ws.append(row)
    
    # Save to bytes
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    # Return as streaming response
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=esg_summaries_{datetime.now().strftime('%Y%m%d')}.xlsx"
        }
    )

