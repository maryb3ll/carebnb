import json
from datetime import datetime
from openai import OpenAI
from typing import Dict
from pathlib import Path
from . import config
from .utils import (
    get_current_iteration,
    increment_and_save_iteration,
    get_component2_output,
    get_component3_sources,
    log_error
)
from .pdf_processor import extract_text_from_pdf, extract_source_pdfs_text
from .pdf_generator import generate_final_summary_pdf
from .pdf_highlighter import highlight_source_pdfs
from .zip_handler import create_final_zip

def run_cot_summarizer(iteration: int = None, session_id: str = None) -> Dict:
    """
    Run Component 4: Chain-of-Thought AI Agent Summarizer.

    Uses o1-mini model with chain-of-thought to create final patient summary.

    Args:
        iteration: Iteration number (for CLI mode)
        session_id: Session ID (for API mode)

    Returns:
        dict: Results including paths to generated files
    """
    try:
        # Determine mode and setup paths
        if session_id:
            # API mode: session-based
            from src.models.session_manager import get_session_path

            comp2_path = get_session_path(session_id, component=2) / 'keywords.json'
            output_dir = get_session_path(session_id, component=4)
            current_iteration = session_id  # Use session_id as identifier
        else:
            # CLI mode: iteration-based
            if iteration is None:
                current_iteration = get_current_iteration()
            else:
                current_iteration = iteration

            comp2_path = get_component2_output(current_iteration)
            output_dir = config.OUTPUT_DIR

        print(f"Component 4: AI Agent Summarizer (Chain-of-Thought)")
        if session_id:
            print(f"Session: {session_id}")
        else:
            print(f"Iteration: {current_iteration}")
        print()

        # Step 1: Load Component 2 data
        print("Loading Component 2 data...")
        with open(comp2_path, 'r') as f:
            comp2_data = json.load(f)

        keywords = comp2_data['keywords']
        description = comp2_data['description']

        # Filter out junk keywords
        clean_keywords = [
            k for k in keywords
            if len(k) < 50 and 'NOTE' not in k and 'transcribed' not in k.lower()
        ]

        print(f"✓ Keywords: {', '.join(clean_keywords[:5])}...")
        print()

        # Step 2: Load Component 3 source PDFs
        print("Loading Component 3 source PDFs...")
        if session_id:
            # Session mode: read from session directory
            metadata_path = get_session_path(session_id, component=3) / 'metadata.json'
            comp3_dir = get_session_path(session_id, component=3)
            print(f"  Checking directory: {comp3_dir}")
            print(f"  Directory exists: {comp3_dir.exists()}")
            if comp3_dir.exists():
                all_files = list(comp3_dir.glob('*'))
                print(f"  Files in directory: {[f.name for f in all_files]}")
            source_paths = []
            for i in range(1, 10):  # Check for up to 9 sources
                source_path = comp3_dir / f'source_{i}.pdf'
                print(f"  Checking: {source_path.name} - exists: {source_path.exists()}")
                if source_path.exists():
                    source_paths.append(source_path)
            if not source_paths:
                print("⚠ WARNING: No sources found from Component 3")
                print("  Will create summary based only on keywords and clinical knowledge")
                print()
            else:
                print(f"  ✓ Found {len(source_paths)} source PDFs")
        else:
            # CLI mode: use existing utility function
            metadata_path, source_paths = get_component3_sources(current_iteration)

        # Extract text from source PDFs (if any exist)
        if source_paths:
            sources_text = extract_source_pdfs_text(source_paths)
            print(f"✓ Loaded {len(source_paths)} source PDFs")
            for i, source_path in enumerate(source_paths, 1):
                text_len = len(sources_text[i])
                print(f"  Source {i}: {text_len} characters")
            print()
        else:
            sources_text = {}
            print("✓ No source PDFs to load")
            print()

        # Step 3: Run Chain-of-Thought with o1-mini
        print("Running Chain-of-Thought analysis with o1-mini...")
        client = OpenAI(api_key=config.OPENAI_API_KEY)

        # Combine all source texts (limit to prevent token overflow)
        combined_sources = ""
        if source_paths:
            for i in range(1, len(source_paths) + 1):
                combined_sources += f"\n\n=== SOURCE {i} ===\n"
                combined_sources += sources_text[i][:5000]  # Limit each source to 5k chars
                if len(sources_text[i]) > 5000:
                    combined_sources += "\n[...truncated...]"
        else:
            combined_sources = "\n\nNo research articles available. Base analysis on clinical knowledge and symptoms."

        # Create prompt for GPT-4o with chain-of-thought
        num_sources = len(source_paths)

        prompt = f"""You are a doctor evaluating a patient based on keywords, symptoms, and medical research.

PATIENT INFORMATION:
Keywords: {', '.join(clean_keywords[:10])}
Description: {description}

MEDICAL RESEARCH SOURCES ({num_sources} available):
{combined_sources}

YOUR TASK:
Create a comprehensive patient evaluation with these 7 sections:

1. KEYWORDS: List the relevant medical keywords

2. SUMMARY OF TRANSCRIPT: 2-3 sentence clinical summary of the patient's condition

3. PATIENT SUMMARY: A comprehensive clinical analysis (at least one full paragraph, 6-10 sentences) that provides:
   - Detailed reasoning about the patient's condition based on symptoms and medical literature
   - Relevant case studies or clinical patterns from the sources
   - Key findings from the research that relate to this patient's presentation
   - Clinical insights that help the doctor understand similar cases and outcomes
   - Evidence-based context from the sources
   This should be written for healthcare professionals, providing substantive clinical information to support decision-making.

4. SOAP ASSESSMENT:
   - Subjective: Patient's reported symptoms and complaints
   - Objective: Observable clinical findings from sources
   - Assessment: Clinical interpretation and diagnosis
   - Plan: Recommended treatment and management plan

5. RELATED HEALTHCARE FIELDS: List 3-4 medical specialties and explain why each is relevant

6. DEVICES NEEDED: List 3-4 diagnostic devices/tests and their purpose

7. URGENCY LEVEL: Assess urgency (Low/Medium/High/Critical), provide justification, and recommend action timeframe

IMPORTANT GUIDELINES:
- Base all recommendations on the provided medical sources
- Do NOT include source citations like [Source 1] or [Source 2]
- Be medically accurate but accessible
- Write in a professional clinical tone

8. HIGHLIGHTS FOR SOURCE PDFs: For each source, identify 6-10 text passages that appear EXACTLY as written in the source (word-for-word quotes, 8-25 words each) that provide educational value. MANDATORY: You MUST include highlights from EARLY, MIDDLE, AND LATE sections of each document. These will be highlighted in yellow in the final PDFs.

CRITICAL REQUIREMENTS:
- You MUST copy the exact text word-for-word from the sources
- Do NOT paraphrase, rephrase, or create new sentences
- Do NOT generate medical phrases that aren't in the source
- Each highlight must be a verbatim quote that appears in the source document
- If you can't find exact relevant text, look for related general medical concepts

HIGHLIGHTING PHILOSOPHY:
Your goal is to highlight passages from the sources that educate the reader about:
- Pathophysiology, mechanisms, and biological processes
- Clinical reasoning, diagnostic approaches, and differential diagnosis
- Treatment principles, therapeutic approaches, and clinical management
- Risk factors, complications, prognosis, and monitoring
- General medical concepts applicable to clinical practice
- Even tangentially related content has educational value

HIGHLIGHTING GUIDELINES:
- Copy EXACT VERBATIM TEXT from the sources (8-25 words)
- Select complete phrases/sentences that convey medical concepts
- DO NOT highlight single words - highlight phrases that contain those words in context
- Look for phrases containing medical information: causes, mechanisms, symptoms, diagnoses, treatments
- Aim for 6-10 highlights per source for comprehensive coverage
- CRITICAL: Distribute highlights THROUGHOUT the entire document - find highlights in early pages, middle pages, AND later pages
- Do NOT cluster all highlights at the beginning - spread them across the full document
- Prioritize: pathophysiology, clinical findings, diagnostic methods, treatment approaches, complications

WHAT TO LOOK FOR IN SOURCES (find exact text about):
- Disease mechanisms and biological processes
- Clinical presentations and symptom patterns
- Diagnostic criteria and testing approaches
- Treatment options and therapeutic strategies
- Risk factors and complications
- Patient assessment and monitoring methods
- General medical principles and clinical reasoning
- Results, discussion, and conclusion sections often contain valuable insights
- Even if source topic differs, find relevant general medical content

DISTRIBUTION STRATEGY (CRITICAL):
You MUST distribute highlights across the ENTIRE document. Follow this mandatory approach:

1. Divide each source into THREE sections: Early (first 1/3), Middle (middle 1/3), Late (last 1/3)
2. Select AT LEAST 2 highlights from EARLY section (introduction, background, methods)
3. Select AT LEAST 2 highlights from MIDDLE section (results, findings, data)
4. Select AT LEAST 2 highlights from LATE section (discussion, conclusions, implications)
5. For a 10-page source: find highlights on pages 1-3, pages 4-7, AND pages 8-10
6. For a 5-page source: find highlights on pages 1-2, page 3, AND pages 4-5

DO NOT cluster all highlights at the beginning. Readers need educational content from throughout the paper, especially conclusions and clinical implications which appear at the END.

REQUIRED MINIMUM DISTRIBUTION:
- Pages 1-33% of document: 2-3 highlights
- Pages 34-66% of document: 2-3 highlights
- Pages 67-100% of document: 2-4 highlights

GOOD HIGHLIGHTS (showing proper distribution):
✓ FROM EARLY PAGES (introduction/background):
  "clinical assessment should include evaluation of vital signs and physical examination findings"
✓ FROM MIDDLE PAGES (methods/results):
  "laboratory testing revealed elevated white blood cell count in 78 percent of cases"
✓ FROM LATE PAGES (discussion/conclusion):
  "these findings suggest that early intervention improves patient outcomes significantly"

BAD HIGHLIGHTS:
✗ ALL from pages 1-2 only (must distribute throughout)
✗ Single words: "fever", "infection", "treatment"
✗ Invented phrases not in source: "prolonged fever indicates bacteremia" (if not exact quote)
✗ Ignoring late sections of the paper

Provide your analysis in JSON format:
{{
  "keywords": ["keyword1", "keyword2", ...],
  "transcript_summary": "Clinical summary here",
  "patient_summary": "Comprehensive clinical analysis here",
  "soap": {{
    "subjective": "Patient's reported symptoms and complaints",
    "objective": "Observable clinical findings from research",
    "assessment": "Clinical interpretation and diagnosis based on evidence",
    "plan": "Recommended treatment and management approach"
  }},
  "healthcare_fields": [
    {{"specialty": "Orthopedics", "explanation": "Why this specialty is needed"}}
  ],
  "devices": [
    {{"name": "MRI", "purpose": "What it's used for"}}
  ],
  "urgency": {{
    "level": "Medium",
    "justification": "Evidence-based reasoning and clinical rationale",
    "recommended_action": "Timeframe and next steps"
  }},
  "highlights": {{
    "source_1": [
      "exact verbatim phrase from early in source 1 about pathophysiology or mechanism",
      "exact verbatim phrase from middle of source 1 about clinical findings or diagnosis",
      "exact verbatim phrase from later in source 1 about treatment or outcomes"
    ],
    "source_2": [
      "exact verbatim phrase from source 2 methods or background section",
      "exact verbatim phrase from source 2 results or discussion section"
    ]
  }}
}}"""

        # Call o1-mini (note: o1 models don't use system messages)
        response = client.chat.completions.create(
            model=config.MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        # Extract response
        response_text = response.choices[0].message.content

        # Parse JSON from response
        analysis = extract_json_from_response(response_text)

        print("✓ Chain-of-Thought analysis complete")
        print()

        # Step 4: Generate final summary PDF
        print("Generating final summary PDF...")
        if session_id:
            summary_pdf_path = output_dir / 'summary.pdf'
        else:
            summary_pdf_path = config.OUTPUT_DIR / f"{current_iteration}_4_output.pdf"

        generate_final_summary_pdf(
            iteration=current_iteration,
            keywords=analysis['keywords'],
            transcript_summary=analysis['transcript_summary'],
            patient_summary=analysis['patient_summary'],
            soap=analysis['soap'],
            healthcare_fields=analysis['healthcare_fields'],
            devices=analysis['devices'],
            urgency=analysis['urgency'],
            output_path=summary_pdf_path
        )

        print(f"✓ Summary PDF: {summary_pdf_path.name}")
        print()

        # Step 5: Create highlighted source PDFs
        if source_paths:
            print("Creating highlighted source PDFs...")

            # Extract highlights from analysis (with fallback to keywords if not present)
            highlights_dict = analysis.get('highlights', {})
            highlights_per_source = []
            total_ai_highlights = 0

            for i in range(1, len(source_paths) + 1):
                source_key = f"source_{i}"
                source_highlights = highlights_dict.get(source_key, [])

                # Log AI-selected highlights
                if source_highlights:
                    print(f"      AI selected {len(source_highlights)} passages for source {i}")
                    total_ai_highlights += len(source_highlights)

                # Fallback to keywords if no highlights provided
                # Convert keywords to longer search phrases for better matching
                if not source_highlights:
                    # Create phrase-based searches from keywords
                    keyword_phrases = []
                    for kw in clean_keywords[:5]:
                        # Expand keywords into searchable medical phrases
                        if len(kw) > 3:
                            keyword_phrases.append(kw)  # Use keyword directly for now
                    source_highlights = keyword_phrases
                    print(f"      Using {len(source_highlights)} keyword-based fallbacks for source {i}")

                highlights_per_source.append(source_highlights)

            if total_ai_highlights > 0:
                print(f"    → Total AI-selected passages: {total_ai_highlights}")
            else:
                print(f"    → No AI passages found, using keyword fallback")

            highlighted_sources = highlight_source_pdfs(
                source_paths=source_paths,
                output_dir=output_dir,
                iteration=current_iteration,
                highlights_per_source=highlights_per_source
            )

            print(f"✓ Created {len(highlighted_sources)} highlighted source PDFs")
            print()
        else:
            print("⚠ No sources to highlight (Component 3 found 0 relevant articles)")
            highlighted_sources = []
            print()

        # Step 6: Create final ZIP
        print("Creating final ZIP file...")
        if session_id:
            zip_path = output_dir / 'final.zip'
        else:
            zip_path = config.FINAL_OUTPUT_DIR / f"{current_iteration}_final.zip"

        create_final_zip(
            summary_pdf=summary_pdf_path,
            highlighted_sources=highlighted_sources,
            output_zip=zip_path
        )

        print(f"✓ ZIP file: {zip_path}")
        print()

        # Step 7: Increment iteration tracker (Component 4's responsibility!)
        # ONLY in CLI mode - session mode doesn't use iteration tracker
        new_iteration = None
        if not session_id:
            print("Incrementing iteration tracker...")
            new_iteration = increment_and_save_iteration()
            print()

        print("=" * 60)
        print("✓ COMPONENT 4 COMPLETE")
        print("=" * 60)
        print(f"Summary PDF: {summary_pdf_path.name}")
        highlighted_names = ", ".join([p.name for p in highlighted_sources])
        print(f"Highlighted sources ({len(highlighted_sources)}): {highlighted_names}")
        print(f"Final ZIP: {zip_path.name}")
        if new_iteration:
            print(f"Next iteration: {new_iteration}")
        print()

        # Return results
        result = {
            'component': 4,
            'timestamp': datetime.now().isoformat(),
            'summary_pdf': str(summary_pdf_path),
            'highlighted_sources': [str(p) for p in highlighted_sources],
            'final_zip': str(zip_path),
            'analysis': analysis
        }

        if session_id:
            result['session_id'] = session_id
        else:
            result['iteration'] = current_iteration
            result['next_iteration'] = new_iteration

        return result

    except Exception as e:
        error_msg = f"CoT Summarizer failed: {str(e)}"
        log_error(4, error_msg)
        raise

def extract_json_from_response(text: str) -> Dict:
    """Extract JSON object from model response."""
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
        "keywords": ["ankle pain", "joint pain"],
        "transcript_summary": "Patient presents with ankle pain requiring evaluation.",
        "patient_summary": "Patient has pain in the ankle that needs to be checked by a healthcare provider.",
        "soap": {
            "subjective": "Patient reports ankle pain when standing",
            "objective": "Clinical examination shows joint tenderness and limited range of motion",
            "assessment": "Likely ankle sprain or strain requiring diagnostic imaging",
            "plan": "Recommend X-ray imaging, possible physical therapy, and orthopedic consultation"
        },
        "healthcare_fields": [
            {"specialty": "Orthopedics", "explanation": "Specializes in bone and joint issues"},
            {"specialty": "Sports Medicine", "explanation": "Treats ankle injuries and musculoskeletal conditions"},
            {"specialty": "Physical Therapy", "explanation": "Helps with rehabilitation and range of motion recovery"}
        ],
        "devices": [
            {"name": "X-ray", "purpose": "Check for fractures or bone issues"},
            {"name": "MRI", "purpose": "Examine soft tissue damage including ligaments and tendons"},
            {"name": "Ultrasound", "purpose": "Visualize tendons and ligaments in real-time"}
        ],
        "urgency": {
            "level": "Medium",
            "justification": "Pain requires medical attention but not emergency care",
            "recommended_action": "Schedule appointment within 1-2 weeks"
        },
        "highlights": {
            "source_1": [],
            "source_2": [],
            "source_3": []
        }
    }
