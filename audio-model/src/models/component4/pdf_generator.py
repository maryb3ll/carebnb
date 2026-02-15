import fitz  # PyMuPDF
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List

def truncate_at_sentence(text: str, max_length: int) -> str:
    """
    Truncate text to fit within max_length, ensuring the last sentence is complete.

    Args:
        text: The text to truncate
        max_length: Maximum character length

    Returns:
        Truncated text ending at a complete sentence
    """
    if len(text) <= max_length:
        return text

    # Find all sentence endings up to max_length
    truncated = text[:max_length]

    # Look for sentence boundaries (. ! ?) followed by space or end
    sentences = re.split(r'([.!?])\s+', truncated)

    # Rebuild up to last complete sentence
    result = ""
    for i in range(0, len(sentences) - 1, 2):
        if i + 1 < len(sentences):
            sentence = sentences[i] + sentences[i + 1]
            if len(result + sentence) <= max_length:
                result += sentence + " "

    return result.strip()

def estimate_text_height(text: str, width: int, fontsize: float, lineheight: float) -> float:
    """
    Estimate the height needed for text in a textbox.

    Args:
        text: The text content
        width: Width of the textbox in points
        fontsize: Font size in points
        lineheight: Line height multiplier

    Returns:
        Estimated height in points
    """
    # Rough estimate: average character width is ~0.5 * fontsize
    chars_per_line = int(width / (fontsize * 0.5))
    num_lines = max(1, len(text) / chars_per_line)

    # Add extra lines for manual line breaks
    num_lines += text.count('\n')

    # Calculate height
    line_height_pts = fontsize * lineheight
    return num_lines * line_height_pts

def generate_final_summary_pdf(
    iteration: int,
    keywords: List[str],
    transcript_summary: str,
    patient_summary: str,
    soap: Dict,
    healthcare_fields: List[Dict],
    devices: List[Dict],
    urgency: Dict,
    output_path: Path
) -> Path:
    """
    Generate the final patient evaluation summary PDF using template.

    Args:
        iteration: Current iteration number
        keywords: List of medical keywords
        transcript_summary: Summary of the transcript
        patient_summary: Patient-friendly summary
        soap: SOAP assessment (Subjective, Objective, Assessment, Plan)
        healthcare_fields: List of relevant specialties
        devices: List of diagnostic devices
        urgency: Urgency assessment
        output_path: Where to save the PDF

    Returns:
        Path to generated PDF
    """
    # Template path
    template_path = Path(__file__).parent / "patient_eval_template.pdf"

    # Open template
    doc = fitz.open(str(template_path))

    # Clean contents for optimization
    for page_num in range(len(doc)):
        page = doc[page_num]
        page.clean_contents()

    # Font settings
    fontsize = 9.5
    lineheight = 1.4
    fontname = "helv"

    # Prepare content
    keywords_text = ', '.join([k for k in keywords if len(k) < 50])

    # Format healthcare fields
    fields_text = ""
    for field in healthcare_fields:
        fields_text += f"- {field['specialty']}: {field['explanation']}\n\n"
    fields_text = fields_text.strip()

    # Format devices
    devices_text = ""
    for device in devices:
        devices_text += f"- {device['name']}: {device['purpose']}\n\n"
    devices_text = devices_text.strip()

    # Format urgency
    urgency_text = f"Level: {urgency['level']}\n\nJustification: {urgency['justification']}\n\nRecommended Action: {urgency['recommended_action']}"

    # Define replacements with smart height limits
    # Heights are calculated based on template spacing to prevent overflow
    replacements = {
        "[key words here separate different key words with comma]": {
            "content": keywords_text,
            "max_height": 53,  # Updated from template analysis
            "max_chars": 500
        },
        "[summary insert here]": {
            "content": transcript_summary,
            "max_height": 102,  # Updated from template analysis
            "max_chars": 900
        },
        "[Patient Summary Here]": {
            "content": patient_summary,
            "max_height": 194,  # Updated from template analysis
            "max_chars": 1800
        },
        "[Insert SOAP subjective component here]": {
            "content": soap["subjective"],
            "max_height": 60,  # Updated from template analysis
            "max_chars": 550
        },
        "[Insert SOAP objective component here]": {
            "content": soap["objective"],
            "max_height": 60,  # Updated from template analysis
            "max_chars": 550
        },
        "[Insert SOAP assessment component here]": {
            "content": soap["assessment"],
            "max_height": 60,  # Updated from template analysis
            "max_chars": 550
        },
        "[Insert SOAP plan component here]": {
            "content": soap["plan"],
            "max_height": 101,  # Updated from template analysis (to page end)
            "max_chars": 900
        },
        "[Insert Related Healthcare Fields here]": {
            "content": fields_text,
            "max_height": 225,  # Updated from template analysis
            "max_chars": 2000
        },
        "[Insert devices needed here]": {
            "content": devices_text,
            "max_height": 224,  # Updated from template analysis
            "max_chars": 2000
        },
        "[Insert urgency level here]": {
            "content": urgency_text,
            "max_height": 291,  # Updated from template analysis (to page end)
            "max_chars": 2500
        }
    }

    # Process each page
    for page_num in range(len(doc)):
        page = doc[page_num]
        page_width = page.rect.width
        page_height = page.rect.height

        # Replace each placeholder
        for placeholder, settings in replacements.items():
            instances = page.search_for(placeholder)

            if instances:
                for rect in instances:
                    # Get content and constraints
                    content = settings["content"]
                    max_height = settings["max_height"]
                    max_chars = settings["max_chars"]

                    # Calculate available width
                    width = page_width - rect.x0 - 50  # Leave 50pt right margin

                    # Estimate if text will fit
                    estimated_height = estimate_text_height(content, width, fontsize, lineheight)

                    # If text is too long, truncate at sentence boundary
                    if estimated_height > max_height or len(content) > max_chars:
                        content = truncate_at_sentence(content, max_chars)

                    # Redact placeholder
                    page.add_redact_annot(rect)
                    page.apply_redactions()

                    # Create rectangle for content
                    expanded_rect = fitz.Rect(
                        rect.x0,
                        rect.y0,
                        rect.x0 + width,
                        rect.y0 + max_height
                    )

                    # Insert text with proper formatting
                    page.insert_textbox(
                        expanded_rect,
                        content,
                        fontsize=fontsize,
                        fontname=fontname,
                        lineheight=lineheight,
                        align=fitz.TEXT_ALIGN_LEFT
                    )

    # Save to output path
    doc.save(str(output_path))
    doc.close()

    return output_path
