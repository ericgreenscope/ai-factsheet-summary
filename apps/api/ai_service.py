"""OpenAI integration for ESG summary generation."""
import json
from typing import Dict, List
from openai import OpenAI
from config import settings


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


def generate_esg_summary(
    extracted_text: str,
    model: str = None
) -> Dict[str, any]:
    """
    Generate ESG summary using OpenAI API.
    
    Args:
        extracted_text: Flattened text from PPTX
        model: OpenAI model to use (default from settings)
    
    Returns:
        Dict with keys: strengths, weaknesses, action_plan, raw_output, model_name
    
    Raises:
        ValueError: If response cannot be parsed
    """
    if model is None:
        model = settings.openai_model
    
    client = OpenAI(api_key=settings.openai_api_key)
    
    # Build user prompt
    user_prompt = USER_PROMPT_TEMPLATE.format(flat_slide_text=extracted_text)
    
    # Call OpenAI API
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.2,
        response_format={"type": "json_object"}
    )
    
    # Extract response
    raw_output = response.choices[0].message.content
    
    # Parse JSON response
    try:
        parsed = json.loads(raw_output)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse OpenAI response as JSON: {e}")
    
    # Validate structure
    if not all(key in parsed for key in ["strengths", "weaknesses", "action_plan"]):
        raise ValueError("OpenAI response missing required keys")
    
    return {
        "strengths": parsed["strengths"],
        "weaknesses": parsed["weaknesses"],
        "action_plan": parsed["action_plan"],
        "raw_output": json.loads(raw_output),  # Store as dict for JSONB
        "model_name": model
    }


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

