import json
from datetime import datetime
from anthropic import Anthropic
from typing import Dict, List
from . import config
from .utils import get_current_iteration, get_component2_output, log_error
from .pubmed_tool import search_pubmed, download_source_pdf

def run_medical_rag(iteration: int = None, session_id: str = None) -> Dict:
    """
    Run Component 3: AI Agent RAG for medical research.

    Component 3's job:
    - Search PubMed Central (PMC) for open-access articles with full-text PDFs
    - Use Claude to select 3 most relevant sources
    - Download FULL PDFs from PMC for those 3 sources

    Component 4 will handle summary generation and highlighting.

    Args:
        iteration: Iteration number (for CLI mode)
        session_id: Session ID (for API mode)

    Returns:
        dict: Results including paths to 3 full-text source PDFs from PMC
    """
    try:
        # Determine mode and setup paths
        if session_id:
            # API mode: session-based
            from src.models.session_manager import get_session_path

            input_path = get_session_path(session_id, component=2) / 'keywords.json'
            output_dir = get_session_path(session_id, component=3)
            current_iteration = session_id  # Use session_id as identifier for file naming
        else:
            # CLI mode: iteration-based
            if iteration is None:
                current_iteration = get_current_iteration()
            else:
                current_iteration = iteration

            input_path = get_component2_output(current_iteration)
            output_dir = config.OUTPUT_DIR

        # Load Component 2 output
        with open(input_path, 'r') as f:
            component2_data = json.load(f)

        keywords = component2_data['keywords']
        description = component2_data['description']

        print(f"Component 3: Medical RAG (Source Selection)")
        if session_id:
            print(f"Session: {session_id}")
        else:
            print(f"Iteration: {current_iteration}")
        print(f"Keywords: {', '.join(keywords[:5])}...")
        print()

        # Initialize Anthropic client
        client = Anthropic(api_key=config.ANTHROPIC_API_KEY)

        # Step 1: Search PMC (PubMed Central) for open-access articles
        print("Searching PubMed Central (PMC) for open-access articles...")

        # Filter out bad keywords (training artifacts)
        clean_keywords = [
            k for k in keywords
            if len(k) < 50 and 'NOTE' not in k and 'transcribed' not in k.lower()
            and '/' not in k and 'soap' not in k.lower() and 'chart' not in k.lower()
        ]

        # Use cleaned keywords or fall back to description terms
        if clean_keywords:
            query = ' '.join(clean_keywords[:5])
        else:
            # Extract key medical terms from description
            query = description.replace('.', ' ').strip()[:100]

        print(f"Search query: {query}")
        search_results = search_pubmed(query, max_results=config.MAX_SEARCH_RESULTS)

        if not search_results:
            # Try a simpler fallback query
            query = "patient care medical treatment"
            print(f"  No PMC results. Retrying with fallback query: {query}")
            search_results = search_pubmed(query, max_results=config.MAX_SEARCH_RESULTS)

            if not search_results:
                raise ValueError(f"No PMC articles found with full-text access. Try different keywords or check PMC availability.")

        print(f"✓ Found {len(search_results)} PMC articles with full-text PDFs available")
        print()

        # Step 2: Use Claude to select top 3 most relevant sources
        print("Agent selecting most relevant sources...")

        user_prompt = f"""Analyze these {len(search_results)} PubMed Central (PMC) search results for a patient case.

NOTE: All articles are from PMC and have full-text PDFs available.

PATIENT INFORMATION:
Keywords: {', '.join(clean_keywords[:10])}
Description: {description}

SEARCH RESULTS:
{format_results_for_analysis(search_results)}

TASK:
Select the 3 MOST RELEVANT articles based on:
- Relevance to patient symptoms/keywords
- Quality and recency of information
- Usefulness for healthcare provider decision-making

Return ONLY a JSON object with the selected source numbers:
{{
    "selected_sources": [1, 3, 5],
    "reasoning": "Brief explanation of why these 3 were selected"
}}"""

        response = client.messages.create(
            model=config.CLAUDE_MODEL,
            max_tokens=3000,
            temperature=1,  # Required when thinking is enabled
            thinking={
                "type": "enabled",
                "budget_tokens": 1500
            },
            messages=[
                {"role": "user", "content": user_prompt}
            ]
        )

        # Extract response
        response_text = ""
        for block in response.content:
            if hasattr(block, 'text'):
                response_text += block.text

        # Parse JSON from response
        selection = extract_json_from_response(response_text)

        print("✓ Agent selected sources")
        print(f"  Selected: {selection['selected_sources']}")
        if 'reasoning' in selection:
            print(f"  Reasoning: {selection['reasoning'][:80]}...")
        print()

        # Step 3: Download FULL PDFs from PMC for selected sources
        print("Downloading FULL-TEXT PDFs from PMC for selected sources...")
        downloaded_sources = []
        for i, source_idx in enumerate(selection['selected_sources'][:3], 1):
            if source_idx <= len(search_results):
                source = search_results[source_idx - 1]
                print(f"  Source {i} ({source.get('pmc_id', 'N/A')}): {source['title'][:50]}...")
                result = download_source_pdf(
                    pmid=source['pmid'],
                    source_number=i,
                    iteration=current_iteration,
                    source=source,
                    output_dir=output_dir
                )
                if result['success']:
                    content_type = "Full-text" if result.get('has_full_text') else "Abstract"
                    print(f"    ✓ {content_type} PDF created: {result['filename']}")
                    downloaded_sources.append({
                        'source_number': i,
                        'pmid': source['pmid'],
                        'pmc_id': source.get('pmc_id'),
                        'title': source['title'],
                        'pdf_path': result['filepath'],
                        'has_full_text': result.get('has_full_text', False)
                    })
                else:
                    print(f"    ✗ Failed: {result.get('error', 'Unknown error')}")

        print()
        print(f"✓ Component 3 complete: Downloaded {len(downloaded_sources)} source PDFs")
        if session_id:
            print(f"  Files saved to session: {session_id}")
        else:
            print(f"  Files: {current_iteration}_3_1.pdf, {current_iteration}_3_2.pdf, {current_iteration}_3_3.pdf")
        print()

        # Save metadata for Component 4
        metadata = {
            'component': 3,
            'timestamp': datetime.now().isoformat(),
            'search_query': query,
            'total_results': len(search_results),
            'selected_sources': selection['selected_sources'],
            'downloaded_sources': downloaded_sources
        }

        if session_id:
            metadata['session_id'] = session_id
            metadata_path = output_dir / 'metadata.json'
        else:
            metadata['iteration'] = current_iteration
            metadata_path = config.OUTPUT_DIR / f"{current_iteration}_3_metadata.json"

        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        # Return results
        result = {
            'component': 3,
            'timestamp': datetime.now().isoformat(),
            'source_pdfs': [str(src['pdf_path']) for src in downloaded_sources],
            'sources_count': len(downloaded_sources),
            'metadata_file': str(metadata_path)
        }

        if session_id:
            result['session_id'] = session_id
        else:
            result['iteration'] = current_iteration

        return result

    except Exception as e:
        error_msg = f"Medical RAG failed: {str(e)}"
        log_error(3, error_msg)
        raise

def format_results_for_analysis(results: List[Dict]) -> str:
    """Format search results for Claude analysis."""
    formatted = ""
    for i, result in enumerate(results, 1):
        formatted += f"\n[{i}] {result['title']}\n"
        formatted += f"    Authors: {result['authors']}\n"
        formatted += f"    Journal: {result['journal']} ({result['year']})\n"
        formatted += f"    Abstract: {result['abstract'][:400]}...\n"
    return formatted

def extract_json_from_response(text: str) -> Dict:
    """Extract JSON object from Claude's response."""
    import re

    # Try to find JSON block
    json_match = re.search(r'\{.*\}', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass

    # Fallback: return default structure
    return {
        "selected_sources": [1, 2, 3],
        "reasoning": "Defaulted to first 3 sources"
    }
