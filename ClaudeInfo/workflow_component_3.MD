# Component 3: AI Agent RAG (Retrieval-Augmented Generation)

## Overview
Use Claude SDK Agent to search PubMed Central (PMC) for relevant medical information based on extracted keywords and create a comprehensive summary for healthcare providers. PMC contains only open-access articles with full-text PDFs available for download.

## Input/Output
- **Input**: JSON file from Component 2 (same iteration: `[N]_2_output.json`)
- **Output**:
  - Summary PDF with medical information and sources: `[iteration]_3_output.pdf`
  - Individual source PDFs (3 sources): `[iteration]_3_[source_number].pdf` (e.g., `1_3_1.pdf`, `1_3_2.pdf`, `1_3_3.pdf`)
- **Output Location**: `data/components/component3/`
- **Output Naming Convention**:
  - Summary: `[iteration]_3_output.pdf` (e.g., `1_3_output.pdf`, `2_3_output.pdf`)
  - Sources: `[iteration]_3_[1-3].pdf` (e.g., `1_3_1.pdf`, `1_3_2.pdf`, `1_3_3.pdf`)
- **Note**: Individual source PDFs are required for Component 4 processing

## Implementation Plan

### 1. Setup
- Install Claude SDK: `pip install anthropic` (add to requirements.txt)
- Install PubMed Central (PMC) search and PDF download library: `pip install metapub` (add to requirements.txt)
- Install PDF generation library: `pip install reportlab` or `fpdf` (add to requirements.txt)
- Configure Anthropic API key in .env file
- **Note**: Use PMC (PubMed Central) instead of regular PubMed to ensure full-text PDFs are available

### 2. Global Iteration Tracking
- **IMPORTANT**: Component 3 does NOT increment the iteration
- Read current iteration from `data/components/iteration_tracker.txt`
- File format: `iteration=N` (set by Component 1)
- Use this SAME iteration number for both input and output
- Example: If tracker shows `iteration=4`:
  - Read input from: `4_2_output.json`
  - Write output to: `4_3_output.pdf`

### 3. Claude Agent Configuration
- **Model**: `claude-4-opus`
- **Settings**:
  - Adaptive thinking: Enabled
  - Effort: Medium
  - Max turns: 4

- **System Prompt**:
```
You are an experienced doctor and research agent. Use PubMed Central (PMC) to analyze the given data to gather relevant sources and information from the prompt. PMC contains only open-access articles with full-text PDFs available. Focus on patient safety and provide comprehensive analysis.
```

- **User Prompt Template**:
```
Perform a medical RAG for this patient in the categories of:
1. Related healthcare fields
2. Devices needed for diagnosis and treatment of symptoms
3. Urgency level of the patient

Based on the following keywords and summary:
Keywords: [keywords list]
Description: [patient description]

Search PubMed Central (PMC) for open-access articles with full-text PDFs. Provide citations for all information.
```

### 4. PMC Search and Download Tool
- **Library**: Use `metapub` for PubMed Central (PMC) searching and PDF downloading
- **Function**: `search_and_download_pmc(query, max_results=10, download_top=3)`
  - **Search PMC API** using metapub with max_results=5-10
  - **PMC contains ONLY open-access articles** - all have full-text PDFs available
  - Filter for recent publications (last 5 years preferred)
  - Extract: title, authors, abstract, DOI, PMC ID, publication date for all results
  - **Agent reads abstracts** from these 5-10 results
  - **Agent selects the 3 most relevant sources** based on relevance to patient condition
  - **Download full PDFs for ONLY the top 3 selected sources** using metapub
  - **Guaranteed full PDF downloads** (PMC = open access only)
  - Save PDFs as: `[iteration]_3_[source_number].pdf` (e.g., `1_3_1.pdf`, `1_3_2.pdf`, `1_3_3.pdf`)
  - Return structured results with PDF paths
  - **Note**: Read multiple abstracts, download only 3 full PDFs to keep demo fast

### 5. PDF Generation Tool
- **Function**: `generate_pdf(content, iteration, output_path)`
  - Format sections: Healthcare Fields, Devices, Urgency, Sources
  - Include iteration number in PDF
  - Include citations
  - Professional medical document styling
  - Save to `data/components/component3/[iteration]_3_output.pdf`

### 6. Agent Workflow
1. Read global iteration from tracker: `iteration=[N]`
2. Load Component 2 output: `[N]_2_output.json`
3. Parse keywords and description from Component 2
4. Agent thinks about search strategy
5. Agent uses **PMC (PubMed Central) tool** (metapub) to search for:
   - Related medical specialties
   - Diagnostic/treatment devices
   - Urgency indicators
6. **Agent receives 5-10 PMC search results with abstracts** (all open-access)
7. **Agent reads and analyzes abstracts** to understand relevance
8. **Agent selects the 3 most relevant sources** based on:
   - Relevance to patient symptoms/keywords
   - Quality and recency of information
   - Usefulness for healthcare provider decision-making
9. **Download and save FULL PDFs for ONLY the 3 selected sources** as:
   - `[N]_3_1.pdf` (guaranteed full PDF from PMC)
   - `[N]_3_2.pdf` (guaranteed full PDF from PMC)
   - `[N]_3_3.pdf` (guaranteed full PDF from PMC)
10. Agent synthesizes information from abstracts and selected sources
11. Agent reflects on patient safety
12. Agent generates summary PDF with structured output
13. Save summary as `[N]_3_output.pdf`
14. Do NOT modify iteration tracker (Component 1 already set it)
15. Log any errors to `ClaudeInfo/errors_fixes.MD` under Component 3 section

### 7. Output PDF Structure
```
MEDICAL RESEARCH SUMMARY
Iteration: [number]
Component: 3
Date: [timestamp]

PATIENT SUMMARY
Keywords: [keywords]
Description: [description]

RELATED HEALTHCARE FIELDS
- [Specialty 1]: [Explanation based on sources]
- [Specialty 2]: [Explanation based on sources]

DEVICES NEEDED FOR DIAGNOSIS AND TREATMENT
- [Device 1]: [Purpose and usage]
- [Device 2]: [Purpose and usage]

URGENCY LEVEL ASSESSMENT
Level: [Low/Medium/High/Critical]
Reasoning: [Based on symptoms and literature]
Recommended timeframe: [Immediate/24-48 hours/1 week/Routine]

SOURCES
[1] Title. Authors. Journal. DOI.
[2] Title. Authors. Journal. DOI.
...
```

### 8. File Structure
```
src/models/component3/
├── __init__.py
├── agent.py             # Claude agent setup and execution
├── pmc_tool.py          # PMC (PubMed Central) search and PDF download using metapub
├── pdf_generator.py     # Summary PDF creation
├── config.py            # Configuration (API keys, max articles)
└── utils.py             # Helper functions (iteration reading, error logging)
```

### 9. Iteration Utilities
```python
# Example utils.py functions
def get_current_iteration():
    """Read global iteration from tracker file"""
    # Read data/components/iteration_tracker.txt
    # Parse: iteration=[N]
    # Return N as integer

def get_component2_output(iteration):
    """Get Component 2 output file for current iteration"""
    # Return path: data/components/component2/[iteration]_2_output.json
    # Verify file exists
```

## Testing Plan

### Tool Tests
1. **PMC Search and Download Tool (metapub)**
   - Test PMC search with medical keywords
   - Verify result structure (5-10 PMC results with abstracts)
   - Verify all results are from PMC (open-access)
   - Test agent selection logic (picks top 3 most relevant)
   - **Test full PDF download functionality** for selected 3 (guaranteed available from PMC)
   - Verify complete PDFs are downloaded (not just abstracts)
   - Verify PDFs saved with correct naming: `[iteration]_3_[1-3].pdf`
   - Test with no PMC results found
   - Test with max_results limit (5-10 for search, 3 for download)
   - Validate API error handling
   - Verify searches return abstracts quickly (< 10 seconds)
   - Verify downloading 3 full PDFs completes (< 60 seconds total from PMC)

2. **PDF Generation Tool**
   - Test PDF creation with sample data
   - Verify PDF includes iteration number
   - Verify PDF formatting
   - Test with long content
   - Test special characters
   - Verify file saves with correct name: `[iteration]_3_output.pdf`

### Agent Tests
1. **Agent Initialization**
   - Verify Claude SDK connection
   - Test API key authentication
   - Validate agent configuration

2. **Agent Tool Registration**
   - Verify PubMed tool is registered
   - Verify PDF tool is registered
   - Test tool execution

3. **Agent Execution**
   - Test with sample keywords from Component 2
   - Verify agent searches PubMed
   - Check agent synthesizes information
   - Validate max turns limit (4)
   - Verify processing completes in < 3 minutes

### Integration Tests
1. **End-to-End Pipeline**
   - Verify tracker shows `iteration=1` (from Component 1)
   - Load Component 2 output: `1_2_output.json`
   - Run agent with keywords
   - Verify PMC searches executed using metapub
   - **Check individual FULL source PDFs saved**: `1_3_1.pdf`, `1_3_2.pdf`, `1_3_3.pdf`
   - **Verify PDFs are complete** (multiple pages, not just abstracts)
   - Check summary PDF generated as `1_3_output.pdf`
   - Validate all PDF content and formatting
   - Verify tracker STILL shows `iteration=1` (unchanged)

2. **Multi-Turn Conversation**
   - Verify agent uses multiple turns effectively
   - Check thinking and reflection
   - Validate information synthesis

3. **Global Iteration Tests**
   - Verify Component 3 reads the same iteration set by Component 1
   - Test: If tracker = `iteration=4`, Component 3 should:
     - Read from: `4_2_output.json`
     - Write to: `4_3_output.pdf` (summary) and `4_3_1.pdf`, `4_3_2.pdf`, `4_3_3.pdf` (sources)
   - Verify Component 3 does NOT modify the tracker

### Quality Tests
1. **Source Relevance**
   - Manual review: Are sources medically relevant?
   - Do sources match keywords?
   - Are citations properly formatted?

2. **Healthcare Field Accuracy**
   - Verify recommended specialties are appropriate
   - Check reasoning is sound

3. **Device Recommendations**
   - Validate devices match symptoms
   - Check devices are standard medical equipment

4. **Urgency Assessment**
   - Review urgency levels for appropriateness
   - Check reasoning aligns with medical standards

### Performance Tests
1. **Latency Test**
   - Total processing time < 3 minutes (demo requirement)
   - PubMed searches < 30 seconds total
   - PDF generation < 5 seconds

2. **API Usage**
   - Monitor Claude API token usage
   - Track PubMed API rate limits
   - Optimize for demo performance

3. **Article Limit Test**
   - Verify limited number of articles searched
   - Confirm processing stays fast for demo

### Edge Cases
1. **Rare Conditions**
   - Test with uncommon keywords
   - Verify agent handles limited search results

2. **Ambiguous Symptoms**
   - Test with vague descriptions
   - Check agent seeks clarification appropriately

3. **Emergency Indicators**
   - Test with critical symptoms (chest pain, etc.)
   - Verify urgency level is HIGH/CRITICAL

### Manual Testing Checklist
- [ ] Verify tracker shows `iteration=1` (from Component 1)
- [ ] Load output from Component 2: `1_2_output.json`
- [ ] Run agent with sample keywords
- [ ] Verify PMC searches return 5-10 open-access articles with abstracts using metapub
- [ ] Verify agent reads abstracts and selects 3 most relevant (not just first 3)
- [ ] **Check individual FULL source PDFs downloaded**: `1_3_1.pdf`, `1_3_2.pdf`, `1_3_3.pdf`
- [ ] **Open PDFs and verify they are complete full-text articles** (not just abstracts)
- [ ] Check summary PDF is generated as `1_3_output.pdf`
- [ ] Verify all PDFs are formatted correctly with iteration number
- [ ] Review healthcare field recommendations
- [ ] Validate device recommendations
- [ ] Assess urgency level accuracy
- [ ] Verify all sources are cited in summary PDF
- [ ] Verify tracker STILL shows `iteration=1` (unchanged)
- [ ] Test with 3-5 different patient scenarios
- [ ] Check agent completes within max 4 turns
- [ ] Verify total time < 3 minutes (demo requirement)
- [ ] Run pipeline again - verify uses `iteration=2` for all files
- [ ] Trigger an error and verify it's logged to errors_fixes.MD

## Success Criteria
- Agent successfully searches **PubMed Central (PMC)** using metapub and retrieves 5-10 open-access results with abstracts
- **Agent reads abstracts and intelligently selects 3 most relevant sources** (not just first 3)
- **3 individual FULL source PDFs downloaded** (complete articles, not abstracts) for selected sources with naming: `[iteration]_3_[1-3].pdf`
- **All 3 PDFs are complete full-text articles** from PMC (guaranteed open-access)
- Summary PDF is generated with all required sections and iteration number
- Healthcare fields are medically appropriate
- Device recommendations are accurate
- Urgency assessment is reasonable
- Processing completes in < 3 minutes (demo requirement)
- Citations are properly formatted
- Agent operates within 4 turns
- Output naming follows conventions:
  - Summary: `[iteration]_3_output.pdf`
  - Sources: `[iteration]_3_1.pdf`, `[iteration]_3_2.pdf`, `[iteration]_3_3.pdf`
- Correctly reads global iteration (does not modify it)
- Reads from correct Component 2 file using shared iteration
- Searches return 5-10 abstracts from PMC, downloads only 3 full PDFs to keep demo fast
- Individual source PDFs are complete full-text articles available for Component 4 to use
