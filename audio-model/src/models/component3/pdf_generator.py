from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime
from typing import Dict, List
from . import config

def generate_summary_pdf(
    iteration: int,
    keywords: List[str],
    description: str,
    healthcare_fields: List[Dict],
    devices: List[Dict],
    urgency: Dict,
    sources: List[Dict],
    output_filename: str = None
) -> str:
    """
    Generate summary PDF for Component 3 output.

    Args:
        iteration: Current iteration number
        keywords: List of keywords from Component 2
        description: Patient description from Component 2
        healthcare_fields: List of relevant healthcare specialties
        devices: List of recommended devices
        urgency: Urgency assessment dictionary
        sources: List of source articles
        output_filename: Optional custom filename

    Returns:
        Path to generated PDF file
    """
    if not output_filename:
        output_filename = f"{iteration}_3_output.pdf"

    filepath = config.OUTPUT_DIR / output_filename

    # Create PDF document
    doc = SimpleDocTemplate(str(filepath), pagesize=letter,
                           topMargin=0.75*inch, bottomMargin=0.75*inch)

    story = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor='darkblue',
        spaceAfter=30,
        alignment=TA_CENTER
    )

    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor='darkblue',
        spaceAfter=12,
        spaceBefore=12
    )

    # Title
    title = Paragraph("MEDICAL RESEARCH SUMMARY", title_style)
    story.append(title)

    # Metadata
    metadata = Paragraph(f"""
        <b>Iteration:</b> {iteration}<br/>
        <b>Component:</b> 3<br/>
        <b>Date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    """, styles['Normal'])
    story.append(metadata)
    story.append(Spacer(1, 0.5 * inch))

    # Divider
    story.append(Paragraph("━" * 80, styles['Normal']))
    story.append(Spacer(1, 0.3 * inch))

    # Patient Summary
    story.append(Paragraph("PATIENT SUMMARY", heading_style))
    story.append(Paragraph(f"<b>Keywords:</b> {', '.join(keywords)}", styles['Normal']))
    story.append(Spacer(1, 0.1 * inch))
    story.append(Paragraph(f"<b>Description:</b> {description}", styles['Normal']))
    story.append(Spacer(1, 0.3 * inch))

    # Divider
    story.append(Paragraph("━" * 80, styles['Normal']))
    story.append(Spacer(1, 0.3 * inch))

    # Healthcare Fields
    story.append(Paragraph("RELATED HEALTHCARE FIELDS", heading_style))
    for field in healthcare_fields:
        story.append(Paragraph(
            f"• <b>{field['specialty']}:</b> {field['explanation']}",
            styles['Normal']
        ))
        story.append(Spacer(1, 0.1 * inch))
    story.append(Spacer(1, 0.2 * inch))

    # Divider
    story.append(Paragraph("━" * 80, styles['Normal']))
    story.append(Spacer(1, 0.3 * inch))

    # Devices
    story.append(Paragraph("DEVICES NEEDED FOR DIAGNOSIS AND TREATMENT", heading_style))
    for device in devices:
        story.append(Paragraph(
            f"• <b>{device['name']}:</b> {device['purpose']}",
            styles['Normal']
        ))
        story.append(Spacer(1, 0.1 * inch))
    story.append(Spacer(1, 0.2 * inch))

    # Divider
    story.append(Paragraph("━" * 80, styles['Normal']))
    story.append(Spacer(1, 0.3 * inch))

    # Urgency Assessment
    story.append(Paragraph("URGENCY LEVEL ASSESSMENT", heading_style))
    story.append(Paragraph(f"<b>Level:</b> {urgency['level']}", styles['Normal']))
    story.append(Spacer(1, 0.1 * inch))
    story.append(Paragraph(f"<b>Reasoning:</b> {urgency['reasoning']}", styles['Normal']))
    story.append(Spacer(1, 0.1 * inch))
    story.append(Paragraph(f"<b>Recommended timeframe:</b> {urgency['timeframe']}", styles['Normal']))
    story.append(Spacer(1, 0.3 * inch))

    # Divider
    story.append(Paragraph("━" * 80, styles['Normal']))
    story.append(Spacer(1, 0.3 * inch))

    # Sources
    story.append(Paragraph("SOURCES", heading_style))
    for i, source in enumerate(sources, 1):
        source_text = f"[{i}] {source['title']}. "
        source_text += f"{source.get('authors', 'Unknown authors')}. "
        source_text += f"{source.get('journal', 'Unknown journal')} ({source.get('year', 'N/A')}). "
        if source.get('doi'):
            source_text += f"DOI: {source['doi']}"

        story.append(Paragraph(source_text, styles['Normal']))
        story.append(Spacer(1, 0.15 * inch))

    # Build PDF
    doc.build(story)

    return str(filepath)
