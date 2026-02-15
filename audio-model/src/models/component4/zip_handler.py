import zipfile
from pathlib import Path
from typing import List

def create_final_zip(
    summary_pdf: Path,
    highlighted_sources: List[Path],
    output_zip: Path
) -> Path:
    """
    Create ZIP file containing final summary and highlighted source PDFs.

    Args:
        summary_pdf: Path to final summary PDF
        highlighted_sources: List of paths to highlighted source PDFs
        output_zip: Path where ZIP should be saved

    Returns:
        Path to created ZIP file
    """
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add summary PDF
        zipf.write(summary_pdf, summary_pdf.name)

        # Add all highlighted source PDFs
        for source_pdf in highlighted_sources:
            zipf.write(source_pdf, source_pdf.name)

    return output_zip
