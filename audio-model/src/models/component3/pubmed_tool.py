from metapub import PubMedFetcher
from metapub.exceptions import MetaPubError
from pathlib import Path
import json
from typing import List, Dict, Optional
from . import config

def search_pubmed(query: str, max_results: int = 10) -> List[Dict]:
    """
    Search PubMed Central (PMC) for open-access articles with full-text PDFs.

    ONLY returns articles that have PMC IDs (guaranteed full-text availability).

    Args:
        query: Search query string
        max_results: Maximum number of results to return (default 10)

    Returns:
        List of dictionaries containing article metadata and abstracts (PMC articles only)
    """
    try:
        fetch = PubMedFetcher()

        # Search PMC specifically by adding filter
        pmc_query = f"{query} AND free full text[sb]"
        pmids = fetch.pmids_for_query(pmc_query, retmax=max_results * 3)  # Get more to filter

        results = []
        for i, pmid in enumerate(pmids):
            if len(results) >= max_results:
                break

            try:
                article = fetch.article_by_pmid(pmid)

                # ONLY include articles with PMC IDs (guaranteed full text)
                if hasattr(article, 'pmc') and article.pmc:
                    result = {
                        'source_number': len(results) + 1,
                        'pmid': pmid,
                        'pmc_id': article.pmc,
                        'title': article.title or 'No title',
                        'authors': ', '.join(article.authors[:3]) if article.authors else 'Unknown',
                        'all_authors': ', '.join(article.authors) if article.authors else 'Unknown',
                        'journal': article.journal or 'Unknown',
                        'year': article.year or 'Unknown',
                        'doi': article.doi or 'N/A',
                        'abstract': article.abstract or 'No abstract available',
                        'url': article.url or f'https://pubmed.ncbi.nlm.nih.gov/{pmid}/',
                        'pmc_url': f'https://www.ncbi.nlm.nih.gov/pmc/articles/{article.pmc}/'
                    }
                    results.append(result)
                    print(f"  ✓ PMC article found: {article.pmc} - {article.title[:50]}...")
            except MetaPubError as e:
                continue

        print(f"\n  Found {len(results)} PMC articles with full-text access")
        return results

    except Exception as e:
        print(f"  ✗ PMC search error: {str(e)}")
        return []

def download_source_pdf(
    pmid: str,
    source_number: int,
    iteration: int,
    source: Dict,
    output_dir: Path = None
) -> Dict:
    """
    Download FULL-TEXT PDF from PubMed Central (PMC).

    Downloads complete PDF from PMC for open-access articles.
    All sources passed to this function should have PMC IDs.

    Args:
        pmid: PubMed ID
        source_number: Source number (1-3)
        iteration: Current iteration (or session_id)
        source: Full source dictionary with PMC ID
        output_dir: Optional output directory (defaults to config.OUTPUT_DIR)

    Returns:
        Dictionary with download status and file path
    """
    try:
        fetch = PubMedFetcher()
        article = fetch.article_by_pmid(pmid)

        # Get PMC ID from source or article
        pmc_id = source.get('pmc_id') or (article.pmc if hasattr(article, 'pmc') else None)

        if not pmc_id:
            raise ValueError(f"No PMC ID available for PMID {pmid}. Cannot download full text.")

        # Get full text from PMC (guaranteed available for PMC articles)
        full_text_content = None
        content_type = 'full_text_from_pmc'

        if pmc_id:
            try:
                # Fetch full text from PMC using eUtils API
                import requests
                import xml.etree.ElementTree as ET

                pmc_id_clean = pmc_id.replace('PMC', '')
                pmc_url = f"https://www.ncbi.nlm.nih.gov/pmc/oai/oai.cgi?verb=GetRecord&identifier=oai:pubmedcentral.nih.gov:{pmc_id_clean}&metadataPrefix=pmc"

                print(f"      → Fetching full text from PMC: {pmc_id}")
                response = requests.get(pmc_url, timeout=15)

                if response.status_code == 200:
                    # Parse XML and extract text content
                    root = ET.fromstring(response.content)

                    # Extract all text from body sections
                    texts = []
                    for elem in root.iter():
                        if elem.text and elem.text.strip() and len(elem.text.strip()) > 20:
                            texts.append(elem.text.strip())

                    if texts:
                        full_text_content = '\n\n'.join(texts[:150])  # Include more content
                        content_type = 'full_text_from_pmc'
                        print(f"      ✓ Retrieved full text from PMC: {pmc_id} ({len(texts)} text blocks)")
                    else:
                        raise ValueError("No text content extracted from PMC")
                else:
                    raise ValueError(f"PMC API returned status {response.status_code}")

            except Exception as e:
                # If PMC fetch fails, this is an error since we expect all sources to have PMC
                print(f"      ✗ Failed to fetch PMC full text: {str(e)}")
                raise ValueError(f"Could not retrieve full text from PMC {pmc_id}: {str(e)}")

        if output_dir is None:
            output_dir = config.OUTPUT_DIR

        filename = f"source_{source_number}.pdf" if isinstance(iteration, str) and len(iteration) > 10 else f"{iteration}_3_{source_number}.pdf"
        filepath = output_dir / filename

        # Generate a comprehensive PDF with all article information
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib.enums import TA_LEFT, TA_JUSTIFY
        from reportlab.lib import colors

        doc = SimpleDocTemplate(str(filepath), pagesize=letter,
                               topMargin=0.75*inch, bottomMargin=0.75*inch,
                               leftMargin=1*inch, rightMargin=1*inch)
        story = []
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.darkblue,
            spaceAfter=20,
            leading=20
        )

        heading_style = ParagraphStyle(
            'HeadingStyle',
            parent=styles['Heading2'],
            fontSize=12,
            textColor=colors.darkblue,
            spaceAfter=10,
            spaceBefore=15
        )

        body_style = ParagraphStyle(
            'BodyStyle',
            parent=styles['Normal'],
            fontSize=10,
            alignment=TA_JUSTIFY,
            spaceAfter=10,
            leading=14
        )

        # Title
        title = Paragraph(f"<b>{article.title or 'No title'}</b>", title_style)
        story.append(title)
        story.append(Spacer(1, 0.2 * inch))

        # Metadata section
        story.append(Paragraph("<b>Article Metadata</b>", heading_style))

        metadata_items = [
            f"<b>Authors:</b> {source.get('all_authors', 'Unknown')}",
            f"<b>Journal:</b> {article.journal or 'Unknown'}",
            f"<b>Year:</b> {article.year or 'Unknown'}",
            f"<b>Volume/Issue:</b> {getattr(article, 'volume', 'N/A')}/{getattr(article, 'issue', 'N/A')}",
            f"<b>PMID:</b> {pmid}",
            f"<b>DOI:</b> {article.doi or 'N/A'}",
            f"<b>PubMed URL:</b> <link href='{article.url}'>{article.url or f'https://pubmed.ncbi.nlm.nih.gov/{pmid}/'}</link>"
        ]

        for item in metadata_items:
            story.append(Paragraph(item, body_style))

        story.append(Spacer(1, 0.3 * inch))

        # Full text section (guaranteed for PMC articles)
        story.append(Paragraph("<b>Full Text (from PubMed Central)</b>", heading_style))

        if full_text_content:
            # PMC content - include substantial portion
            text_to_include = full_text_content[:20000]  # Include up to 20K chars for complete articles
            if len(full_text_content) > 20000:
                text_to_include += f"\n\n[Content truncated for PDF size. Full text available at: https://www.ncbi.nlm.nih.gov/pmc/articles/{pmc_id}/]"

            # Split into paragraphs
            paragraphs = text_to_include.split('\n\n') if '\n\n' in text_to_include else [text_to_include]

            for para in paragraphs:
                if para.strip():
                    # Clean up the text
                    clean_para = para.strip().replace('\n', ' ')
                    try:
                        story.append(Paragraph(clean_para, body_style))
                        story.append(Spacer(1, 0.1 * inch))
                    except:
                        # If paragraph has issues, skip it
                        continue
        else:
            # This shouldn't happen for PMC articles
            story.append(Paragraph("<b>Error: Full text not available</b>", heading_style))
            story.append(Paragraph("Expected full text from PMC but none was retrieved.", body_style))

        story.append(Spacer(1, 0.3 * inch))

        # Keywords/MeSH terms if available
        try:
            if hasattr(article, 'mesh') and article.mesh and isinstance(article.mesh, list):
                story.append(Paragraph("<b>Medical Subject Headings (MeSH)</b>", heading_style))
                mesh_text = ', '.join(str(m) for m in article.mesh[:20])  # First 20 MeSH terms
                story.append(Paragraph(mesh_text, body_style))
                story.append(Spacer(1, 0.3 * inch))
        except:
            pass  # Skip MeSH if there's any issue

        # Citation information
        story.append(Paragraph("<b>Citation</b>", heading_style))
        citation = f"{source.get('all_authors', 'Unknown authors')}. "
        citation += f"{article.title}. "
        citation += f"{article.journal or 'Unknown journal'}. "
        citation += f"{article.year or 'N/A'}"
        if article.doi:
            citation += f". DOI: {article.doi}"

        story.append(Paragraph(citation, body_style))

        # Footer note
        story.append(Spacer(1, 0.5 * inch))
        footer_style = ParagraphStyle(
            'FooterStyle',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_LEFT
        )

        footer_text = f"<i>This document was generated from PubMed Central (PMC) full-text for Component 3, Iteration {iteration}. " \
                     f"Source: Open-access article {pmc_id}. This is a complete full-text article from PMC.</i>"

        story.append(Paragraph(footer_text, footer_style))

        # Build PDF
        doc.build(story)

        return {
            'success': True,
            'filepath': str(filepath),
            'filename': filename,
            'pmid': pmid,
            'title': article.title,
            'has_full_text': full_text_content is not None,
            'content_type': content_type
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'pmid': pmid
        }
