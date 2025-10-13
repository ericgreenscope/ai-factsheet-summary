"""PPTX text extraction and AI_SUMMARY shape manipulation."""
import io
from typing import Optional, List, Tuple
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN


def extract_text_from_pptx(pptx_bytes: bytes) -> str:
    """
    Extract all text from a PPTX file.
    
    Args:
        pptx_bytes: Binary PPTX data
    
    Returns:
        Flattened text from all slides
    """
    prs = Presentation(io.BytesIO(pptx_bytes))
    all_text = []
    
    for slide_idx, slide in enumerate(prs.slides):
        slide_text = []
        
        # Extract text from all shapes
        for shape in slide.shapes:
            if hasattr(shape, "text") and shape.text:
                slide_text.append(shape.text.strip())
            
            # Extract text from tables
            if shape.has_table:
                table = shape.table
                for row in table.rows:
                    for cell in row.cells:
                        if cell.text.strip():
                            slide_text.append(cell.text.strip())
        
        if slide_text:
            all_text.append(f"--- Slide {slide_idx + 1} ---\n" + "\n".join(slide_text))
    
    return "\n\n".join(all_text)


def find_ai_summary_shape(prs: Presentation) -> Optional[Tuple[int, object]]:
    """
    Find the shape with name or alt_text = "AI_SUMMARY".
    
    Args:
        prs: PowerPoint presentation object
    
    Returns:
        Tuple of (slide_index, shape) or None if not found
    """
    for slide_idx, slide in enumerate(prs.slides):
        for shape in slide.shapes:
            # Check shape name
            if hasattr(shape, "name") and shape.name == "AI_SUMMARY":
                return (slide_idx, shape)
            
            # Check alt text
            if hasattr(shape, "element") and hasattr(shape.element, "get"):
                alt_text = shape.element.get("descr", "")
                if alt_text == "AI_SUMMARY":
                    return (slide_idx, shape)
    
    return None


def insert_text_into_ai_summary(
    pptx_bytes: bytes,
    summary_text: str
) -> bytes:
    """
    Insert summary text into the AI_SUMMARY placeholder shape.
    
    Args:
        pptx_bytes: Original PPTX binary data
        summary_text: Formatted summary text to insert
    
    Returns:
        Modified PPTX binary data
    
    Raises:
        ValueError: If AI_SUMMARY shape not found
    """
    prs = Presentation(io.BytesIO(pptx_bytes))
    
    # Find the AI_SUMMARY shape
    result = find_ai_summary_shape(prs)
    if not result:
        raise ValueError("AI_SUMMARY shape not found in presentation")
    
    slide_idx, shape = result
    
    # Check if shape has text frame
    if not hasattr(shape, "text_frame"):
        raise ValueError("AI_SUMMARY shape does not support text")
    
    # Clear existing text and insert new summary
    text_frame = shape.text_frame
    text_frame.clear()
    
    # Add the summary text
    p = text_frame.paragraphs[0]
    p.text = summary_text
    p.font.size = Pt(11)  # Default font size
    
    # Save to bytes
    output = io.BytesIO()
    prs.save(output)
    output.seek(0)
    
    return output.read()


def truncate_text_for_llm(text: str, max_chars: int = 80000) -> str:
    """
    Truncate extracted text to fit within LLM context limits.
    
    Args:
        text: Full extracted text
        max_chars: Maximum character count (default ~80k for safety)
    
    Returns:
        Truncated text
    """
    if len(text) <= max_chars:
        return text
    
    # Truncate and add notice
    truncated = text[:max_chars]
    truncated += "\n\n[... Text truncated to fit context limit ...]"
    
    return truncated

