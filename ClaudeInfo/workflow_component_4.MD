# Component 4: AI Agent Summarizer

## Overview
Use ChatGPT-o1-mini with chain-of-thought architecture to synthesize information from Components 2 and 3 into a final formatted PDF for healthcare providers.

## Input/Output
- **Input**:
  - JSON from Component 2 (same iteration: `[N]_2_output.json`)
  - Summary PDF from Component 3 (same iteration: `[N]_3_output.pdf`)
  - Individual source PDFs from Component 3 (same iteration: `[N]_3_1.pdf`, `[N]_3_2.pdf`, `[N]_3_3.pdf`)
- **Output**:
  - Final formatted PDF with comprehensive patient summary: `[iteration]_4_output.pdf`
  - **Highlighted source PDFs** with important sections annotated: `[iteration]_4_source_[1-3].pdf`
  - ZIP file containing final PDF and highlighted source PDFs: `[iteration]_final.zip` (saved to `output/` folder)
- **Output Location**: `data/components/component4/` for PDFs, `output/` for ZIP
- **Output Naming Convention**:
  - Summary PDF: `[iteration]_4_output.pdf` (e.g., `1_4_output.pdf`, `2_4_output.pdf`)
  - Highlighted source PDFs: `[iteration]_4_source_[1-3].pdf` (e.g., `1_4_source_1.pdf`, `1_4_source_2.pdf`, `1_4_source_3.pdf`)
  - ZIP: `[iteration]_final.zip` (e.g., `1_final.zip`, `2_final.zip`)

## Implementation Plan

### 1. Setup
- Install OpenAI Python SDK: `pip install openai` (add to requirements.txt)
- Install PDF processing library: `pip install PyPDF2` or `pdfplumber` (add to requirements.txt)
- Install PDF generation library: `pip install reportlab` or `fpdf` (add to requirements.txt)
- Install PDF annotation/highlighting library: `pip install PyMuPDF` (fitz) (add to requirements.txt)
- Configure OpenAI API key in .env file

### 2. Global Iteration Tracking
- **IMPORTANT**: Component 4 IS RESPONSIBLE for incrementing the iteration
- Read current iteration from `data/components/iteration_tracker.txt`
- File format: `iteration=N`
- Use current iteration for input and output
- **After successful completion**, increment iteration for next pipeline run
- Example: If tracker shows `iteration=4`:
  - Read from: `4_2_output.json` and `4_3_output.pdf`
  - Write to: `4_4_output.pdf`
  - After success: Update tracker to `iteration=5`

### 3. Chain-of-Thought Architecture
Based on: https://github.com/itsuncheng/werewolf-template/blob/main/src/werewolf_agents/SuperWolf/agent/cot_agent.py

**Workflow**: Input → Thoughts → Initial Action → Reflection → Final Action

#### Step 1: Input Processing
- Read global iteration from tracker: `iteration=[N]`
- Load Component 2 JSON: `[N]_2_output.json`
- Extract text from Component 3 summary PDF: `[N]_3_output.pdf`
- Locate and read individual source PDFs: `[N]_3_1.pdf`, `[N]_3_2.pdf`, `[N]_3_3.pdf`
- Extract text from each source PDF for analysis
- Combine into structured input

#### Step 2: Thoughts Phase
- Model analyzes keywords and their medical significance
- Identifies key information from sources
- Plans output structure

#### Step 3: Initial Action
- Generate draft summary for each section:
  - Keywords
  - Summary of Transcript
  - Patient Summary (simplified, patient-friendly)
  - Related healthcare fields
  - Devices needed
  - Urgency level of patient

#### Step 4: Reflection Phase
**Reflection Prompt**:
```
Review the patient keywords and summary and review what your output text looks like so far.
Check for the relevancy of the content to the keywords.
Check for source consistency and that your information matches the given sources.
Check that the information fits into the categories described in your role prompt.
```

**Reflection Criteria**:
- Content relevance to keywords
- Source consistency (verify information matches Component 3 sources)
- Category completeness (all 6 sections filled)
- Medical accuracy
- Clarity and conciseness
- Patient Summary uses simple, patient-friendly language (not medical jargon)

#### Step 5: Final Action
- Revise draft based on reflection
- Generate final formatted PDF
- Include iteration number in PDF
- Save to `data/components/component4/[N]_4_output.pdf`
- **Highlight source PDFs**:
  - For each of the 3 source PDFs from Component 3
  - Identify key sections relevant to patient condition (based on keywords, symptoms, and analysis)
  - Add yellow highlights to important paragraphs/sentences
  - Add annotations/notes in margins if helpful
  - Save as `[N]_4_source_1.pdf`, `[N]_4_source_2.pdf`, `[N]_4_source_3.pdf`
- **Create ZIP file** containing:
  - `[N]_4_output.pdf` (final summary)
  - `[N]_4_source_1.pdf`, `[N]_4_source_2.pdf`, `[N]_4_source_3.pdf` (highlighted source PDFs)
- Save ZIP to `output/[N]_final.zip`
- **After successful completion**: Increment global iteration tracker for next pipeline run
- Update tracker from `iteration=[N]` to `iteration=[N+1]`
- Log any errors to `ClaudeInfo/errors_fixes.MD` under Component 4 section

### 4. Model Configuration
- **Model**: `o1-mini`
- **Role Prompt**:
```
You are a doctor who is evaluating a patient based on keywords and a summary of their symptoms. You also have additional information on sources related to their condition, symptoms, treatments, and urgency level. Your goal is to bring together all this information into a pdf that evaluates keywords, summary of transcript, a patient-friendly summary that can be quoted back to patients, related healthcare fields, devices needed, and urgency level of the patient.
```

### 5. Final PDF Output Format
```
PATIENT EVALUATION SUMMARY
Iteration: [number]
Component: 4
Generated: [timestamp]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KEYWORDS
[keyword 1], [keyword 2], [keyword 3], ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY OF TRANSCRIPT
[2-3 sentence patient summary from transcript]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PATIENT SUMMARY
[Simplified, patient-friendly explanation of their condition
that doctors can quote back to patients. Uses plain language,
avoids medical jargon. 2-4 sentences explaining what's going
on with their health in terms they can understand.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RELATED HEALTHCARE FIELDS
• [Specialty 1]: [Why this specialty is relevant]
• [Specialty 2]: [Why this specialty is relevant]
• [Specialty 3]: [Why this specialty is relevant]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DEVICES NEEDED
• [Device 1]: [Purpose/Usage]
• [Device 2]: [Purpose/Usage]
• [Device 3]: [Purpose/Usage]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

URGENCY LEVEL OF PATIENT
Level: [Low / Medium / High / Critical]

Justification:
[Evidence-based reasoning from symptoms and sources]

Recommended Action:
[Timeframe and recommended next steps]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REFERENCES
Information synthesized from medical literature search
conducted on [date]. See detailed sources in supporting
documentation (Component 3 output).

Source file: [N]_3_output.pdf

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 6. File Structure
```
src/models/component4/
├── __init__.py
├── cot_agent.py         # Chain-of-thought agent implementation
├── pdf_processor.py     # Extract text from Component 3 PDFs
├── pdf_generator.py     # Generate final PDF
├── pdf_highlighter.py   # Highlight important sections in source PDFs
├── zip_handler.py       # Create final ZIP with all outputs
├── config.py            # Model configuration
└── utils.py             # Helper functions (iteration reading, error logging)
```

### 7. Iteration Utilities
```python
# Example utils.py functions
def get_current_iteration():
    """Read global iteration from tracker file"""
    # Read data/components/iteration_tracker.txt
    # Parse: iteration=[N]
    # Return N as integer

def increment_and_save_iteration():
    """Increment global iteration and save to tracker"""
    # ONLY Component 4 should call this function
    # Read current iteration
    # Increment by 1
    # Write back: iteration=[N+1]
    # Return new iteration number

def get_component2_output(iteration):
    """Get Component 2 output file for current iteration"""
    # Return path: data/components/component2/[iteration]_2_output.json
    # Verify file exists

def get_component3_output(iteration):
    """Get Component 3 output files for current iteration"""
    # Return paths:
    #   - Summary: data/components/component3/[iteration]_3_output.pdf
    #   - Sources: data/components/component3/[iteration]_3_[1-3].pdf
    # Verify all files exist
```

### 8. PDF Highlighting Module
```python
# Example pdf_highlighter.py functions
def highlight_pdf(input_pdf_path, output_pdf_path, highlights):
    """Add highlights to PDF"""
    # Use PyMuPDF (fitz) to open PDF
    # For each highlight:
    #   - Find text location
    #   - Add yellow highlight annotation
    # Save highlighted PDF to output path

def identify_important_sections(pdf_text, keywords, patient_summary):
    """Identify which sections to highlight"""
    # Analyze PDF text
    # Find paragraphs/sections that:
    #   - Contain patient keywords
    #   - Relate to symptoms/conditions
    #   - Provide diagnostic/treatment info
    # Return list of text snippets to highlight
```

## Testing Plan

### Unit Tests
1. **Input Processing**
   - Test loading Component 2 JSON with correct iteration
   - Test extracting text from Component 3 summary PDF with correct iteration
   - Test locating all 3 individual source PDFs with correct iteration
   - Verify data combination
   - Test file path construction using iteration number

2. **CoT Agent Phases**
   - Test Thoughts phase output
   - Test Initial Action generation
   - Test Reflection logic
   - Test Final Action revision

3. **PDF Generation, Highlighting, and ZIP Creation**
   - Test PDF creation with sample data
   - Verify formatting and all 6 sections
   - Verify iteration number included
   - Test Patient Summary uses simple, patient-friendly language
   - Test with long/short content
   - Validate special characters
   - Verify correct filename: `[iteration]_4_output.pdf`
   - **Test PDF highlighting functionality**:
     - Verify highlights are added to source PDFs
     - Test with different PDF formats
     - Verify highlighted sections are relevant
     - Check highlight color and visibility
   - Verify highlighted PDFs saved as: `[iteration]_4_source_[1-3].pdf`
   - Test ZIP creation with final PDF and 3 highlighted source PDFs
   - Verify ZIP naming: `[iteration]_final.zip`
   - Verify ZIP contains all 4 PDFs (1 summary + 3 highlighted sources)

4. **Iteration Tracking**
   - Test reading iteration from tracker
   - Verify correct input files loaded using iteration
   - Verify output filename uses same iteration
   - Confirm Component 4 does NOT modify tracker

### Integration Tests
1. **End-to-End Pipeline**
   - Verify tracker shows `iteration=1` (from Component 1)
   - Load Component 2 output: `1_2_output.json`
   - Load Component 3 outputs: `1_3_output.pdf`, `1_3_1.pdf`, `1_3_2.pdf`, `1_3_3.pdf`
   - Run full CoT workflow
   - Verify final PDF generated as `1_4_output.pdf`
   - **Verify highlighted source PDFs created**: `1_4_source_1.pdf`, `1_4_source_2.pdf`, `1_4_source_3.pdf`
   - Verify highlights are visible and relevant in source PDFs
   - Verify ZIP file created as `output/1_final.zip` containing all 4 PDFs (1 summary + 3 highlighted sources)
   - Check all 6 sections are populated
   - Verify Patient Summary is in plain, patient-friendly language
   - Verify tracker incremented to `iteration=2` after successful completion

2. **Multi-Component Flow**
   - Use realistic data from Components 2 & 3
   - Verify information synthesis
   - Check no data loss
   - Verify source references are correct

3. **Global Iteration Tests**
   - Verify Component 4 reads the same iteration set by Component 1
   - Test: If tracker = `iteration=4`, Component 4 should:
     - Read from: `4_2_output.json`, `4_3_output.pdf`, `4_3_1.pdf`, `4_3_2.pdf`, `4_3_3.pdf`
     - Write to: `4_4_output.pdf`, `4_4_source_1.pdf`, `4_4_source_2.pdf`, `4_4_source_3.pdf`, and `output/4_final.zip`
     - After success: Update tracker to `iteration=5`
   - Run full pipeline (Components 1-4) and verify all use same iteration for processing
   - Verify only Component 4 increments the tracker at the end

### Quality Tests
1. **Content Relevance**
   - Keywords match original transcript
   - Summary accurately reflects patient condition
   - Healthcare fields align with symptoms
   - Devices are appropriate
   - Urgency level is justified

2. **Source Consistency**
   - Information matches Component 3 sources
   - No hallucinated information
   - Citations reference Component 3 output correctly

3. **Reflection Effectiveness**
   - Compare Initial Action vs Final Action
   - Verify improvements after reflection
   - Check error corrections

4. **Output Completeness**
   - All 6 sections filled (Keywords, Summary of Transcript, Patient Summary, Related Healthcare Fields, Devices Needed, Urgency Level)
   - No empty fields
   - Patient Summary is simple and quotable by doctors
   - Professional formatting
   - Iteration number included
   - All 3 source PDFs have highlights added
   - Highlighted sections are relevant to patient case

### Chain-of-Thought Tests
1. **Thoughts Phase**
   - Verify model plans appropriately
   - Check understanding of keywords
   - Validate analysis of sources

2. **Reflection Phase**
   - Test reflection identifies errors
   - Verify improvements are made
   - Check reflection prompt is followed

3. **Revision Quality**
   - Compare draft vs final
   - Measure improvement metrics
   - Validate reflection leads to better output

### Performance Tests
1. **Latency Test**
   - Thoughts phase < 10 seconds
   - Initial Action < 15 seconds
   - Reflection < 10 seconds
   - Final Action < 15 seconds
   - Total time < 1 minute

2. **Token Usage**
   - Monitor API costs
   - Optimize prompt efficiency

### Edge Cases
1. **Minimal Information**
   - Test with sparse keywords
   - Test with limited sources
   - Verify graceful handling

2. **Conflicting Information**
   - Test when sources disagree
   - Verify agent handles ambiguity

3. **Critical Urgency**
   - Test emergency scenarios
   - Verify appropriate urgency flagging

### Manual Testing Checklist
- [ ] Verify tracker shows `iteration=1` (from Component 1)
- [ ] Verify outputs from Components 2 and 3 exist with iteration 1
- [ ] Verify all Component 3 files present: `1_3_output.pdf`, `1_3_1.pdf`, `1_3_2.pdf`, `1_3_3.pdf`
- [ ] Run CoT agent workflow
- [ ] Review Thoughts phase output
- [ ] Review Initial Action draft
- [ ] Review Reflection analysis
- [ ] Review Final Action improvements
- [ ] Verify final PDF is generated as `1_4_output.pdf`
- [ ] **Verify highlighted source PDFs created**: `1_4_source_1.pdf`, `1_4_source_2.pdf`, `1_4_source_3.pdf`
- [ ] **Open highlighted PDFs and verify highlights are visible** and relevant
- [ ] Check that highlighted sections relate to patient keywords/condition
- [ ] **Verify ZIP file created**: `output/1_final.zip` containing all 4 PDFs
- [ ] Extract ZIP and verify it contains summary + 3 highlighted sources
- [ ] Check all 6 sections are complete
- [ ] **Verify Patient Summary is in plain, patient-friendly language** (no jargon)
- [ ] Test if Patient Summary can be quoted directly to patients
- [ ] Verify iteration number is included in PDF
- [ ] Validate information accuracy
- [ ] Review formatting and readability
- [ ] Verify tracker incremented to `iteration=2` after successful completion
- [ ] Test with 5 different patient scenarios
- [ ] Run full pipeline again - verify all components use `iteration=2`, then tracker becomes `iteration=3`
- [ ] Compare output quality: with vs without reflection
- [ ] Trigger an error and verify it's logged to errors_fixes.MD

## Success Criteria
- All 6 sections properly populated (Keywords, Summary of Transcript, Patient Summary, Related Healthcare Fields, Devices Needed, Urgency Level)
- **Patient Summary is in simple, patient-friendly language** that doctors can quote back to patients
- Information is consistent with Component 2 & 3
- Reflection phase improves output quality
- Final PDF is professionally formatted with iteration number
- **3 highlighted source PDFs created** with relevant sections marked
- Highlights are visible, accurate, and helpful for quick reference
- Highlighted sections correspond to patient keywords and condition
- **ZIP file successfully created** containing final PDF and all 3 highlighted source PDFs
- Processing time < 1 minute
- Urgency assessment is medically sound
- No hallucinated information
- Healthcare provider can use PDF for patient evaluation
- **Doctors can directly quote Patient Summary section to patients**
- **Doctors can quickly review highlighted sections in source PDFs** without reading entire papers
- Output naming follows conventions:
  - Summary PDF: `[iteration]_4_output.pdf`
  - Highlighted sources: `[iteration]_4_source_[1-3].pdf`
  - ZIP: `output/[iteration]_final.zip`
- Correctly reads global iteration from tracker
- Reads from correct Component 2 and 3 files (including all source PDFs) using shared iteration
- Source references Component 3 output correctly
- **Iteration tracker properly incremented** after successful completion for next pipeline run
- ZIP file is deliverable final output for healthcare providers with actionable, highlighted research
