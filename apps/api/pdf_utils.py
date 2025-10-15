"""PDF conversion utilities for PPTX files using CloudConvert API."""
import io
import time
import cloudconvert
from config import settings


def convert_pptx_to_pdf(pptx_bytes: bytes) -> bytes:
    """
    Convert PPTX file to PDF using CloudConvert API.

    This creates a high-quality PDF with all visual elements preserved:
    - Charts and graphs
    - Images and pictures
    - Slide layouts and formatting
    - Colors and design elements

    Args:
        pptx_bytes: PPTX file content as bytes

    Returns:
        PDF file content as bytes

    Raises:
        RuntimeError: If conversion fails or API key is missing
    """
    try:
        # Check API key
        if not settings.cloudconvert_api_key:
            raise RuntimeError("CloudConvert API key not configured. Set CLOUDCONVERT_API_KEY environment variable.")

        # Initialize CloudConvert client
        cloudconvert.configure(api_key=settings.cloudconvert_api_key, sandbox=False)

        # Create a job
        job = cloudconvert.Job.create(payload={
            "tasks": {
                "upload-my-file": {
                    "operation": "import/upload"
                },
                "convert-my-file": {
                    "operation": "convert",
                    "input": "upload-my-file",
                    "output_format": "pdf",
                    "some_other_option": "value"
                },
                "export-my-file": {
                    "operation": "export/url",
                    "input": "convert-my-file"
                }
            }
        })

        # Upload PPTX file
        upload_task_id = job['tasks'][0]['id']
        upload_task = cloudconvert.Task.find(id=upload_task_id)
        cloudconvert.Task.upload(file_name='presentation.pptx', task=upload_task, file=io.BytesIO(pptx_bytes))

        # Wait for job to complete
        job = cloudconvert.Job.wait(id=job['id'])

        # Check for errors
        if job['status'] == 'error':
            error_message = "CloudConvert job failed"
            for task in job.get('tasks', []):
                if task.get('status') == 'error':
                    error_message = task.get('message', error_message)
                    break
            raise RuntimeError(f"CloudConvert conversion failed: {error_message}")

        # Download the converted PDF
        export_task = None
        for task in job['tasks']:
            if task.get('name') == 'export-my-file':
                export_task = task
                break

        if not export_task or not export_task.get('result', {}).get('files'):
            raise RuntimeError("CloudConvert conversion completed but no output file found")

        # Get download URL
        file_info = export_task['result']['files'][0]
        file_response = cloudconvert.download(filename=file_info['filename'], url=file_info['url'])

        # Read PDF content
        pdf_bytes = file_response.read()

        return pdf_bytes

    except cloudconvert.exceptions.APIError as e:
        raise RuntimeError(f"CloudConvert API error: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"PDF conversion failed: {str(e)}")


def is_conversion_available() -> bool:
    """
    Check if PDF conversion is available.

    Returns:
        True if CloudConvert API key is configured, False otherwise
    """
    return bool(settings.cloudconvert_api_key)
