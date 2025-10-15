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
{{
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "...", "..."],
  "action_plan": ["...", "...", "..."]
}}"""


def generate_esg_summary(
    extracted_text: str,
    model: str = "gemini-2.5-flash"
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
    Upload PDF to Gemini File API using official SDK.

    Args:
        pdf_bytes: PDF file content as bytes
        display_name: Display name for the file

    Returns:
        Uploaded file object

    Raises:
        ValueError: If upload fails
    """
    try:
        # Create a file-like object from bytes
        pdf_file = io.BytesIO(pdf_bytes)
        pdf_file.name = display_name

        # Upload file using SDK
        uploaded_file = genai.upload_file(pdf_file, mime_type="application/pdf", display_name=display_name)

        # Wait for file to be processed
        max_retries = 10
        for i in range(max_retries):
            file_status = genai.get_file(uploaded_file.name)

            if file_status.state.name == "ACTIVE":
                return uploaded_file
            elif file_status.state.name == "FAILED":
                raise ValueError(f"File processing failed: {file_status.error}")

            # Wait before retrying
            time.sleep(2)

        raise ValueError("File processing timeout - file did not become ACTIVE")

    except Exception as e:
        raise ValueError(f"Failed to upload PDF to Gemini: {e}")


def generate_esg_summary_from_pdf(
    pdf_bytes: bytes,
    file_name: str = "factsheet.pdf",
    model_name: str = "gemini-2.5-flash"
) -> Dict[str, any]:
    """
    Generate ESG summary from PDF using Gemini File API with official SDK.

    Args:
        pdf_bytes: PDF file content as bytes
        file_name: Display name for the PDF file
        model_name: Gemini model to use (default: gemini-2.5-flash)

    Returns:
        Dict with keys: strengths, weaknesses, action_plan, raw_output, model_name

    Raises:
        ValueError: If response cannot be parsed or API fails
    """
    try:
        # Upload PDF to Gemini
        uploaded_file = upload_pdf_to_gemini(pdf_bytes, file_name)

        # Initialize model
        model = genai.GenerativeModel(
            model_name=model_name,
            generation_config={
                "temperature": 0.2,
                "max_output_tokens": 2048,
                "response_mime_type": "application/json"
            }
        )

        # Generate content with PDF and prompts
        prompt = f"{SYSTEM_PROMPT}\n\n{PDF_PROMPT}"
        response = model.generate_content([uploaded_file, prompt])

        # Parse response
        raw_text = response.text

        try:
            parsed = json.loads(raw_text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse Gemini response as JSON: {e}. Raw response: {raw_text[:500]}")

        # Validate structure
        if not all(key in parsed for key in ["strengths", "weaknesses", "action_plan"]):
            raise ValueError(f"Gemini response missing required keys. Got: {list(parsed.keys())}")

        return {
            "strengths": parsed["strengths"],
            "weaknesses": parsed["weaknesses"],
            "action_plan": parsed["action_plan"],
            "raw_output": parsed,
            "model_name": model_name
        }

    except Exception as e:
        raise ValueError(f"Failed to generate ESG summary from PDF: {e}")

