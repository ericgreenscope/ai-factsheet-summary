"""FastAPI main application for ESG Factsheet AI."""
import uuid
import io
import traceback
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from supabase import create_client, Client
from openpyxl import Workbook

from config import settings
from storage import upload_file_to_storage, download_file_from_storage, get_signed_url
from pptx_utils import extract_text_from_pptx, insert_text_into_ai_summary, truncate_text_for_llm, insert_markdown_into_ai_summary
from ai_service import generate_esg_summary, generate_esg_summary_from_pdf, format_summary_for_pptx, format_bullets_as_text


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
    analysis_text_final: str
    editor_notes: Optional[str] = None


class AnalyzeRequest(BaseModel):
    prompt: str


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
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Expose all headers
)


# Global exception handler to ensure CORS headers are present on errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions with proper CORS headers."""
    error_detail = str(exc)
    print(f"Unhandled exception: {error_detail}")
    print(traceback.format_exc())
    
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {error_detail}"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
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
    Upload PPTX and PDF file pairs.

    The user should upload both files at once:
    - PPTX file: Used for regenerating output with AI summary
    - PDF file: Used for AI analysis (preserves visual elements)

    Files are matched by base filename (e.g., "report.pptx" and "report.pdf").

    Args:
        files: List of files (must include both .pptx and .pdf)
        company_name: Optional company name

    Returns:
        List of created file records
    """
    # Group files by base name
    file_pairs = {}

    for file in files:
        filename = file.filename

        # Get base name without extension
        if filename.endswith('.pptx'):
            base_name = filename[:-5]  # Remove .pptx
            file_type = 'pptx'
        elif filename.endswith('.pdf'):
            base_name = filename[:-4]  # Remove .pdf
            file_type = 'pdf'
        else:
            raise HTTPException(status_code=400, detail=f"File {filename} must be .pptx or .pdf")

        if base_name not in file_pairs:
            file_pairs[base_name] = {}

        file_pairs[base_name][file_type] = file

    # Validate all pairs have both PPTX and PDF
    for base_name, pair in file_pairs.items():
        if 'pptx' not in pair:
            raise HTTPException(status_code=400, detail=f"Missing PPTX file for '{base_name}'")
        if 'pdf' not in pair:
            raise HTTPException(status_code=400, detail=f"Missing PDF file for '{base_name}'")

    # Process each pair
    results = []

    for base_name, pair in file_pairs.items():
        pptx_file = pair['pptx']
        pdf_file = pair['pdf']

        # Generate file ID
        file_id = str(uuid.uuid4())

        # Read both files
        pptx_data = await pptx_file.read()
        pdf_data = await pdf_file.read()

        # Upload PPTX to storage (original)
        try:
            pptx_storage_path = upload_file_to_storage(
                get_supabase_client(),
                file_id,
                pptx_data,
                folder="original",
                extension=".pptx"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload PPTX {pptx_file.filename}: {str(e)}")

        # Upload PDF to storage (for AI analysis)
        try:
            pdf_storage_path = upload_file_to_storage(
                get_supabase_client(),
                file_id,
                pdf_data,
                folder="pdf",
                extension=".pdf"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload PDF {pdf_file.filename}: {str(e)}")

        # Insert file record with both paths
        file_record = {
            "id": file_id,
            "company_name": company_name,
            "original_filename": pptx_file.filename,
            "storage_path_original": pptx_storage_path,
            "storage_path_pdf": pdf_storage_path,
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
async def analyze_file(file_id: str, request: AnalyzeRequest):
    """
    Analyze a PPTX file and generate AI summary.
    
    Args:
        file_id: UUID of the file
        request: AnalyzeRequest containing the prompt text
    
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

        # Check if PDF was uploaded
        if not file_record.get("storage_path_pdf"):
            raise HTTPException(status_code=400, detail="No PDF file uploaded for this factsheet. Please upload both PPTX and PDF files.")

        # Download PDF from storage
        pdf_bytes = download_file_from_storage(get_supabase_client(), file_record["storage_path_pdf"])

        # Generate AI summary from PDF with user-provided prompt
        pdf_filename = file_record.get("original_filename", "factsheet.pdf").replace(".pptx", ".pdf")
        summary = generate_esg_summary_from_pdf(
            pdf_bytes,
            file_name=pdf_filename,
            prompt_text=request.prompt
        )

        # Create suggestion record with freeform analysis text
        suggestion_record = {
            "id": str(uuid.uuid4()),
            "file_id": file_id,
            "model_name": summary["model_name"],
            "raw_model_output": summary["raw_output"],
            "analysis_text": summary["analysis_text"]
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
        "analysis_text_final": review.analysis_text_final,
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
        
        # Use the final analysis text directly
        analysis_text = review["analysis_text_final"]
        
        # Download original PPTX
        pptx_bytes = download_file_from_storage(get_supabase_client(), file_record["storage_path_original"])
        
        # Insert text into AI_SUMMARY shape
        try:
            regenerated_pptx = insert_markdown_into_ai_summary(pptx_bytes, analysis_text)
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
    download_url_pdf = None

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

    if file_record.get("storage_path_pdf"):
        try:
            download_url_pdf = get_signed_url(get_supabase_client(), file_record["storage_path_pdf"])
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
        "download_url_regenerated": download_url_regenerated,
        "download_url_pdf": download_url_pdf
    }


# List all files endpoint
@app.get("/files")
async def list_files():
    """
    List all files with basic info.
    
    Returns:
        List of file records
    """
    try:
        print("Fetching files from Supabase...")
        supabase = get_supabase_client()
        print(f"Supabase client obtained: {supabase is not None}")
        
        response = supabase.table("files").select("*").order("created_at", desc=True).execute()
        print(f"Files fetched: {len(response.data) if response.data else 0} records")
        
        return response.data if response.data else []
    except Exception as e:
        print(f"Error fetching files: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch files: {str(e)}")


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
    headers = ["File ID", "Company Name", "Filename", "Analysis", "Created At"]
    ws.append(headers)
    
    # Data rows
    for review in reviews_response.data:
        file_info = review.get("files", {})
        row = [
            review["file_id"],
            file_info.get("company_name", ""),
            file_info.get("original_filename", ""),
            review["analysis_text_final"],
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

