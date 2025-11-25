"""Gemini integration for ESG summary generation."""
import json
import requests
import time
import io
import google.generativeai as genai
from typing import Dict, List
from config import settings

# Configure Gemini SDK
genai.configure(api_key=settings.openai_api_key)


SYSTEM_PROMPT = """You are an ESG consultant producing concise, advisory, business-grade assessments for executives. Infer sector and material topics intelligently from the deck text and enrich with sector-specific context. Avoid generic boilerplate and invented KPIs. Use 'Insufficient evidence' only when the deck truly lacks support. Output in English."""

USER_PROMPT_TEMPLATE = """Context:
Extracted deck text (may be noisy):
<<<
{flat_slide_text}
>>>

Task:
1) Write three sections: "Strengths", "Weaknesses", "Action Plan (12 months)".
2) English only, consultative tone, executive-ready.
3) Concise bullets (<= 22 words), 5–9 bullets per section.
4) Add sector/materiality context; avoid generic ESG boilerplate.
5) Do not invent KPIs or numbers.

Return STRICT JSON:
{{
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "...", "..."],
  "action_plan": ["...", "...", "..."]
}}"""

# DEPRECATED: This is now overridden by user-selected prompts from the frontend.
# Kept as fallback if no prompt_text is provided to generate_esg_summary_from_pdf.
PDF_PROMPT = """Analyze this ESG factsheet PDF and produce a concise, executive-ready assessment.

Instructions:
1) Write three sections: "Strengths", "Weaknesses", "Action Plan (12 months)".
2) English only, consultative tone, business-grade quality.
3) Concise bullets (<= 22 words), 5–9 bullets per section.
4) Infer sector and material ESG topics from the content.
5) Add relevant sector-specific context.
6) Avoid generic boilerplate and invented KPIs.
7) Use 'Insufficient evidence' only when truly lacking support.

Return STRICT JSON:
{
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "...", "..."],
  "action_plan": ["...", "...", "..."]
}"""

# JSON output format instruction appended to all prompts
JSON_FORMAT_INSTRUCTION = """

Return STRICT JSON:
{
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "...", "..."],
  "action_plan": ["...", "...", "..."]
}"""


def generate_esg_summary(
    extracted_text: str,
    model: str = "gemini-3-pro-preview"
) -> Dict[str, any]:
    """
    Generate ESG summary using Google Gemini API.

    Args:
        extracted_text: Flattened text from PPTX
        model: Gemini model to use (default: gemini-2.5-flash)

    Returns:
        Dict with keys: strengths, weaknesses, action_plan, raw_output, model_name

    Raises:
        ValueError: If response cannot be parsed or API fails
    """
    api_key = settings.openai_api_key  # Using same env var for now
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    # Build prompt
    user_prompt = USER_PROMPT_TEMPLATE.format(flat_slide_text=extracted_text)

    # Prepare request payload for Gemini
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": SYSTEM_PROMPT},
                    {"text": user_prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2048,
            "responseMimeType": "application/json"
        }
    }

    # Call Gemini API
    try:
        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()

        # Extract response
        result = response.json()
        raw_output = result["candidates"][0]["content"]["parts"][0]["text"]

        # Parse JSON response
        try:
            parsed = json.loads(raw_output)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse Gemini response as JSON: {e}")

        # Validate structure
        if not all(key in parsed for key in ["strengths", "weaknesses", "action_plan"]):
            raise ValueError("Gemini response missing required keys")

        return {
            "strengths": parsed["strengths"],
            "weaknesses": parsed["weaknesses"],
            "action_plan": parsed["action_plan"],
            "raw_output": parsed,  # Store as dict for JSONB
            "model_name": model
        }

    except requests.exceptions.RequestException as e:
        raise ValueError(f"Gemini API request failed: {e}")
    except (KeyError, IndexError) as e:
        raise ValueError(f"Gemini API response format error: {e}")


def format_summary_for_pptx(
    strengths: List[str],
    weaknesses: List[str],
    action_plan: List[str]
) -> str:
    """
    Format summary bullets into markdown for PPTX insertion.
    
    Args:
        strengths: List of strength bullets
        weaknesses: List of weakness bullets
        action_plan: List of action plan bullets
    
    Returns:
        Formatted text with markdown headers and bullets
    """
    sections = []
    
    # Strengths section
    sections.append("**Strengths**")
    for bullet in strengths:
        sections.append(f"- {bullet}")
    
    sections.append("")  # Blank line
    
    # Weaknesses section
    sections.append("**Weaknesses**")
    for bullet in weaknesses:
        sections.append(f"- {bullet}")
    
    sections.append("")  # Blank line
    
    # Action Plan section
    sections.append("**Action Plan (12 months)**")
    for bullet in action_plan:
        sections.append(f"- {bullet}")
    
    return "\n".join(sections)


def format_bullets_as_text(bullets: List[str]) -> str:
    """
    Convert list of bullets to plain text with bullets.

    Args:
        bullets: List of bullet strings

    Returns:
        Formatted bullet text
    """
    return "\n".join(f"- {bullet}" for bullet in bullets)


def upload_pdf_to_gemini(pdf_bytes: bytes, display_name: str = "factsheet.pdf"):
    """
    Upload PDF to Gemini File API using resumable upload protocol.

    Args:
        pdf_bytes: PDF file content as bytes
        display_name: Display name for the file

    Returns:
        Uploaded file object with name and uri

    Raises:
        ValueError: If upload fails
    """
    try:
        api_key = settings.openai_api_key
        base_url = "https://generativelanguage.googleapis.com"

        # Step 1: Initial resumable upload request with metadata
        num_bytes = len(pdf_bytes)
        initial_headers = {
            "X-Goog-Upload-Protocol": "resumable",
            "X-Goog-Upload-Command": "start",
            "X-Goog-Upload-Header-Content-Length": str(num_bytes),
            "X-Goog-Upload-Header-Content-Type": "application/pdf",
            "Content-Type": "application/json"
        }

        metadata = {
            "file": {
                "display_name": display_name
            }
        }

        initial_url = f"{base_url}/upload/v1beta/files?key={api_key}"
        initial_response = requests.post(
            initial_url,
            headers=initial_headers,
            json=metadata,
            timeout=30
        )
        initial_response.raise_for_status()

        # Get upload URL from response headers
        upload_url = initial_response.headers.get("X-Goog-Upload-URL")
        if not upload_url:
            raise ValueError("Failed to get upload URL from initial response")

        # Step 2: Upload the actual file bytes
        upload_headers = {
            "Content-Length": str(num_bytes),
            "X-Goog-Upload-Offset": "0",
            "X-Goog-Upload-Command": "upload, finalize"
        }

        upload_response = requests.post(
            upload_url,
            headers=upload_headers,
            data=pdf_bytes,
            timeout=120
        )
        upload_response.raise_for_status()

        uploaded_file = upload_response.json()
        file_name = uploaded_file.get("file", {}).get("name")

        if not file_name:
            raise ValueError("Failed to get file name from upload response")

        # Wait for file to be processed
        max_retries = 20
        for i in range(max_retries):
            # Check file status
            status_url = f"{base_url}/v1beta/{file_name}?key={api_key}"
            status_response = requests.get(status_url, timeout=10)
            status_response.raise_for_status()

            file_status = status_response.json()
            state = file_status.get("state")

            if state == "ACTIVE":
                return file_status
            elif state == "FAILED":
                raise ValueError(f"File processing failed: {file_status.get('error', 'Unknown error')}")

            # Wait before retrying - exponential backoff
            time.sleep(min(2 ** (i // 3), 10))

        raise ValueError("File processing timeout - file did not become ACTIVE")

    except requests.exceptions.RequestException as e:
        raise ValueError(f"Failed to upload PDF to Gemini: {e}")
    except Exception as e:
        raise ValueError(f"Failed to upload PDF to Gemini: {e}")


def generate_esg_summary_from_pdf(
    pdf_bytes: bytes,
    file_name: str = "factsheet.pdf",
    model_name: str = "gemini-3-pro-preview",
    prompt_text: str = None
) -> Dict[str, any]:
    """
    Generate ESG summary from PDF using REST API.

    Args:
        pdf_bytes: PDF file content as bytes
        file_name: Display name for the PDF file
        model_name: Gemini model to use (default: gemini-2.5-flash)
        prompt_text: User-provided prompt for analysis (if None, uses default PDF_PROMPT)

    Returns:
        Dict with keys: analysis_text, raw_output, model_name

    Raises:
        ValueError: If response cannot be parsed or API fails
    """
    try:
        # Upload PDF to Gemini
        uploaded_file = upload_pdf_to_gemini(pdf_bytes, file_name)

        # Use provided prompt or fall back to default
        if prompt_text is None:
            prompt_text = PDF_PROMPT

        # Use the prompt text directly
        final_prompt = prompt_text

        api_key = settings.openai_api_key
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "file_data": {
                                "mime_type": "application/pdf",
                                "file_uri": uploaded_file.get("uri")
                            }
                        },
                        {
                            "text": final_prompt
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 8192,
                "responseMimeType": "text/plain"
            }
        }

        response = requests.post(url, json=payload, timeout=120)
        response.raise_for_status()

        result = response.json()

        # Extract response with better error handling
        try:
            candidates = result.get("candidates", [])
            if not candidates:
                raise ValueError(f"No candidates in response. Full response: {json.dumps(result)[:500]}")

            content = candidates[0].get("content", {})
            parts = content.get("parts", [])
            if not parts:
                raise ValueError(f"No parts in response content. Content: {json.dumps(content)[:500]}")

            analysis_text = parts[0].get("text", "")
            if not analysis_text:
                raise ValueError(f"No text in response parts. Parts: {json.dumps(parts)[:500]}")

        except (KeyError, IndexError) as e:
            raise ValueError(f"Error extracting response: {e}. Full response: {json.dumps(result)[:500]}")

        return {
            "analysis_text": analysis_text,
            "raw_output": result,
            "model_name": model_name
        }

    except Exception as e:
        raise ValueError(f"Failed to generate ESG summary from PDF: {e}")

