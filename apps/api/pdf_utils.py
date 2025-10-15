"""PDF conversion utilities for PPTX files."""
import subprocess
import tempfile
import os
from pathlib import Path
from typing import Union


def convert_pptx_to_pdf(pptx_bytes: bytes) -> bytes:
    """
    Convert PPTX file to PDF using LibreOffice.

    Args:
        pptx_bytes: PPTX file content as bytes

    Returns:
        PDF file content as bytes

    Raises:
        RuntimeError: If conversion fails
    """
    # Create temporary directory for conversion
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)

        # Write PPTX to temp file
        pptx_path = temp_path / "input.pptx"
        pptx_path.write_bytes(pptx_bytes)

        # Convert using LibreOffice
        try:
            result = subprocess.run(
                [
                    "soffice",
                    "--headless",
                    "--convert-to", "pdf",
                    "--outdir", str(temp_path),
                    str(pptx_path)
                ],
                capture_output=True,
                text=True,
                timeout=60,
                check=True
            )

            # Check if PDF was created
            pdf_path = temp_path / "input.pdf"
            if not pdf_path.exists():
                raise RuntimeError(f"PDF conversion failed: {result.stderr}")

            # Read and return PDF bytes
            return pdf_path.read_bytes()

        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"LibreOffice conversion failed: {e.stderr}")
        except subprocess.TimeoutExpired:
            raise RuntimeError("PDF conversion timed out after 60 seconds")
        except Exception as e:
            raise RuntimeError(f"Unexpected error during PDF conversion: {str(e)}")


def is_libreoffice_available() -> bool:
    """
    Check if LibreOffice is installed and available.

    Returns:
        True if LibreOffice is available, False otherwise
    """
    try:
        result = subprocess.run(
            ["soffice", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False
