import PyPDF2
from pathlib import Path
from typing import Dict, List

def extract_text_from_pdf(pdf_path: Path) -> str:
    """
    Extract all text from a PDF file.

    Args:
        pdf_path: Path to PDF file

    Returns:
        Extracted text as string
    """
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
    except Exception as e:
        return f"Error extracting text from {pdf_path.name}: {str(e)}"

def extract_source_pdfs_text(source_paths: List[Path]) -> Dict[int, str]:
    """
    Extract text from all 3 source PDFs.

    Args:
        source_paths: List of paths to source PDFs

    Returns:
        Dictionary mapping source number to extracted text
    """
    sources_text = {}
    for i, path in enumerate(source_paths, 1):
        text = extract_text_from_pdf(path)
        sources_text[i] = text
    return sources_text
