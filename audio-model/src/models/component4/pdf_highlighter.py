import fitz  # PyMuPDF
from pathlib import Path
from typing import List

def highlight_pdf_passages(input_pdf_path: Path, output_pdf_path: Path, passages: List[str]) -> bool:
    """
    Add yellow highlights to PDF for specific relevant passages.

    Args:
        input_pdf_path: Path to input PDF
        output_pdf_path: Path to save highlighted PDF
        passages: List of specific text passages to highlight (AI-selected)

    Returns:
        bool: True if successful
    """
    try:
        # Open the PDF
        doc = fitz.open(str(input_pdf_path))

        highlight_count = 0
        highlights_per_page = {}

        # Process each passage
        for passage in passages:
            # Skip very short passages
            if len(passage) < 8:  # Require at least 8 characters for meaningful phrases
                continue

            # Clean up passage
            passage_clean = passage.strip()

            # Try to find the passage with some flexibility
            found = False

            # Search across all pages
            for page_num, page in enumerate(doc):
                # Skip if this page already has too many highlights
                if highlights_per_page.get(page_num, 0) >= 6:  # Increased from 5 to 6
                    continue

                # Try exact match first
                text_instances = page.search_for(passage_clean, quads=True)

                # If no exact match, try partial matching by breaking into key phrases
                if not text_instances and len(passage_clean) > 20:
                    # Try searching for meaningful substrings (first/last 12 words)
                    words = passage_clean.split()
                    if len(words) >= 8:
                        # Try first substantial portion
                        partial = ' '.join(words[:8])
                        text_instances = page.search_for(partial, quads=True)

                # Highlight each instance (but limit per page)
                for inst in text_instances:
                    # Check if we've hit the page limit
                    if highlights_per_page.get(page_num, 0) >= 6:
                        break

                    # Add yellow highlight annotation
                    highlight = page.add_highlight_annot(inst)
                    highlight.set_colors(stroke=(1, 1, 0))  # Yellow
                    highlight.update()
                    highlight_count += 1

                    # Track highlights per page
                    highlights_per_page[page_num] = highlights_per_page.get(page_num, 0) + 1

                    found = True
                    # Only highlight first occurrence of each passage
                    break

                if found:
                    break

            # Stop if we've hit overall limit (10 highlights total)
            if highlight_count >= 10:  # Increased from 8 to 10
                break

        # Save the highlighted PDF
        doc.save(str(output_pdf_path))
        doc.close()

        print(f"      → Added {highlight_count} phrase-based highlights")
        return True

    except Exception as e:
        print(f"      ✗ Highlighting error: {str(e)}")
        # If highlighting fails, just copy the original
        import shutil
        shutil.copy(input_pdf_path, output_pdf_path)
        return False

def highlight_source_pdfs(
    source_paths: List[Path],
    output_dir: Path,
    iteration,  # Can be int (CLI mode) or str (session_id in API mode)
    highlights_per_source: List[List[str]]
) -> List[Path]:
    """
    Create highlighted versions of source PDFs using AI-selected passages.

    Args:
        source_paths: List of paths to original source PDFs
        output_dir: Directory to save highlighted PDFs
        iteration: Current iteration number (int) or session_id (str)
        highlights_per_source: List of passage lists (one per source)

    Returns:
        List of paths to highlighted PDFs
    """
    highlighted_paths = []

    for i, source_path in enumerate(source_paths):
        # Use different naming based on mode
        if isinstance(iteration, str) and len(iteration) > 10:  # Session ID
            output_path = output_dir / f"source_{i + 1}_highlighted.pdf"
        else:  # Iteration number
            output_path = output_dir / f"{iteration}_4_source_{i + 1}.pdf"

        print(f"    Highlighting source {i + 1}: {source_path.name}")

        # Get passages for this source
        passages = highlights_per_source[i] if i < len(highlights_per_source) else []

        # Create highlighted version
        success = highlight_pdf_passages(source_path, output_path, passages)

        highlighted_paths.append(output_path)

    return highlighted_paths
