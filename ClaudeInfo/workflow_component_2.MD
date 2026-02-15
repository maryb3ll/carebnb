# Component 2: Keyword Extraction

## Overview
Extract relevant medical keywords and create a short description from the transcript using a fine-tuned Chat GPT-4o mini model.

## Input/Output
- **Input**: JSON file from Component 1 (same iteration: `[N]_1_output.json`)
- **Output**: JSON file with keywords and short description
- **Output Location**: `data/components/component2/`
- **Output Naming Convention**: `[iteration]_2_output.json` (e.g., `1_2_output.json`, `2_2_output.json`)

## Implementation Plan

### 1. Data Preparation for Fine-Tuning
- **Dataset Location**: `data/medical-transcriptions/mtsamples.csv`
- **Dataset Size**: 5,029 medical transcription samples
- **Columns Used**:
  - `transcription` → System role (input)
  - `keywords` → Part of assistant role (output)
  - `description` → Part of assistant role (output)

#### Step 1.1: Convert Dataset to OpenAI Fine-Tuning Format
Create JSONL file with format:
```json
{"messages": [
  {"role": "system", "content": "You are a medical transcription analyzer that extracts keywords and creates concise descriptions."},
  {"role": "user", "content": "[transcription text]"},
  {"role": "assistant", "content": "Keywords: [keywords]\nDescription: [description]"}
]}
```

#### Step 1.2: Data Cleaning
- Remove empty transcriptions
- Clean special characters
- Validate keyword format
- Split data: 80% training, 20% validation

### 2. Model Fine-Tuning
- **Base Model**: `gpt-4o-mini`
- **Check for Existing Model**: Read `src/models/config.py` for `KEYWORD_EXTRACTOR_MODEL_ID`
  - If model ID exists: Skip fine-tuning, use existing model
  - If model ID is None/empty: Proceed with fine-tuning
- **Training Script**: `src/models/component2/fine_tune.py`
- **Steps**:
  1. Check `src/models/config.py` for existing model ID
  2. If no model exists:
     - Upload training data to OpenAI
     - Create fine-tuning job
     - Monitor training progress
     - Save fine-tuned model ID to `src/models/config.py`
     - Validate model performance
  3. If model exists: Load and use existing model

### 3. Model ID Storage (src/models/config.py)
```python
# src/models/config.py
# Fine-tuned model configuration for Component 2
KEYWORD_EXTRACTOR_MODEL_ID = None  # Set after fine-tuning or "ft:gpt-4o-mini:custom:model:id"
```

### 4. Global Iteration Tracking
- **IMPORTANT**: Component 2 does NOT increment the iteration
- Read current iteration from `data/components/iteration_tracker.txt`
- File format: `iteration=N` (set by Component 1)
- Use this SAME iteration number for both input and output
- Example: If tracker shows `iteration=4`:
  - Read input from: `4_1_output.json`
  - Write output to: `4_2_output.json`

### 5. Inference Pipeline
- **Function**: `extract_keywords()`
  - Read global iteration from tracker: `iteration=[N]`
  - Load model ID from `src/models/config.py`
  - Find and load Component 1 output: `[N]_1_output.json`
  - Call fine-tuned model
  - Parse response into keywords and description
  - Save to `data/components/component2/[N]_2_output.json`
  - Do NOT modify iteration tracker (Component 1 already set it)
  - Log any errors to `ClaudeInfo/errors_fixes.MD` under Component 2 section

### 6. JSON Output Format
```json
{
  "iteration": 1,
  "component": 2,
  "source_transcript": "1_1_output.json",
  "timestamp": "2026-02-14T10:35:00",
  "keywords": [
    "chest pain",
    "shortness of breath",
    "diabetes",
    "hypertension"
  ],
  "description": "Patient presents with acute chest pain and difficulty breathing. Medical history includes diabetes and hypertension.",
  "metadata": {
    "model": "ft:gpt-4o-mini:custom-model-id",
    "confidence": 0.95
  }
}
```

### 7. File Structure
```
src/models/component2/
├── __init__.py
├── prepare_dataset.py   # Convert CSV to JSONL
├── fine_tune.py         # Fine-tuning script (checks config.py first)
├── extractor.py         # Keyword extraction logic
├── config_handler.py    # Read/write to src/models/config.py
└── utils.py             # Helper functions (iteration reading, error logging)

data/components/component2/
├── training_data.jsonl
├── validation_data.jsonl
└── model_info.json      # Additional model metadata
```

### 8. Config Handler Integration
```python
# Example config_handler.py functions
def get_model_id():
    """Read KEYWORD_EXTRACTOR_MODEL_ID from src/models/config.py"""
    # Import and return the model ID
    # Return None if not set

def save_model_id(model_id):
    """Save model ID to src/models/config.py"""
    # Update KEYWORD_EXTRACTOR_MODEL_ID in config file
    # Write to src/models/config.py

def model_exists():
    """Check if fine-tuned model already exists"""
    # Return True if model ID is set and valid
```

### 9. Iteration Utilities
```python
# Example utils.py functions
def get_current_iteration():
    """Read global iteration from tracker file"""
    # Read data/components/iteration_tracker.txt
    # Parse: iteration=[N]
    # Return N as integer

def get_component1_output(iteration):
    """Get Component 1 output file for current iteration"""
    # Return path: data/components/component1/[iteration]_1_output.json
    # Verify file exists
```

## Testing Plan

### Dataset Preparation Tests
1. **CSV Loading Test**
   - Verify CSV loads correctly (5,029 rows)
   - Check all required columns exist
   - Validate data types

2. **JSONL Conversion Test**
   - Verify JSONL format is correct
   - Check message structure
   - Validate train/validation split (80/20)

3. **Data Quality Test**
   - Check for empty transcriptions
   - Verify keywords are properly formatted
   - Ensure descriptions are meaningful

### Fine-Tuning Tests
1. **Model Check Test**
   - Verify config.py is read correctly from `src/models/config.py`
   - Test behavior when model ID exists (skip fine-tuning)
   - Test behavior when model ID is None (proceed with fine-tuning)

2. **Upload Test**
   - Verify training data uploads successfully
   - Check file validation passes

3. **Training Job Test**
   - Monitor training job status
   - Verify no errors during training
   - Check training metrics

4. **Model ID Storage Test**
   - Verify model ID saved to `src/models/config.py`
   - Test reading model ID back from config

5. **Model Validation Test**
   - Test on validation set
   - Compare performance to base model
   - Verify keyword extraction accuracy > 85%

### Inference Tests
1. **Unit Tests**
   - Test with sample transcript
   - Verify keyword format
   - Check description quality
   - Test error handling

2. **Integration Tests**
   - Verify tracker shows `iteration=1` (set by Component 1)
   - Load Component 1 output: `1_1_output.json`
   - Run extraction pipeline
   - Verify output JSON format: `1_2_output.json`
   - Check file saved to correct location
   - Verify tracker STILL shows `iteration=1` (unchanged)

3. **Global Iteration Tests**
   - Verify Component 2 reads the same iteration set by Component 1
   - Test: If tracker = `iteration=4`, Component 2 should:
     - Read from: `4_1_output.json`
     - Write to: `4_2_output.json`
   - Verify Component 2 does NOT modify the tracker

4. **Edge Cases**
   - Empty transcript
   - Very short transcript (< 50 words)
   - Very long transcript (> 2000 words)
   - Unclear/ambiguous symptoms

### Quality Tests
1. **Keyword Relevance**
   - Manual review of 20 random samples
   - Keywords should be medically relevant
   - No generic/non-medical keywords

2. **Description Quality**
   - Should be 1-3 sentences
   - Should capture main symptoms/conditions
   - Should not include unnecessary details

### Performance Tests
1. **Latency Test**
   - Processing time < 10 seconds per transcript
   - Batch processing capability

2. **Cost Test**
   - Track API costs for fine-tuning
   - Monitor per-request inference costs

### Manual Testing Checklist
- [ ] Verify `src/models/config.py` exists
- [ ] Run fine-tuning (first time only)
- [ ] Verify model ID saved to `src/models/config.py`
- [ ] Run fine-tuning again - verify it skips and uses existing model
- [ ] Verify tracker shows `iteration=1` (from Component 1)
- [ ] Test extraction with `1_1_output.json` from Component 1
- [ ] Verify keywords are medically accurate
- [ ] Check description is concise and relevant
- [ ] Validate output saved as `1_2_output.json`
- [ ] Verify tracker STILL shows `iteration=1` (unchanged by Component 2)
- [ ] Run pipeline again - verify uses `iteration=2` for both input/output
- [ ] Compare output quality: fine-tuned vs base model
- [ ] Trigger an error and verify it's logged to errors_fixes.MD

## Success Criteria
- Fine-tuned model achieves > 85% keyword extraction accuracy
- Model ID properly saved to and read from `src/models/config.py`
- System skips fine-tuning when model already exists
- Descriptions are medically relevant and concise
- Processing time < 10 seconds per transcript
- Output JSON format is correct with iteration tracking
- Correctly reads global iteration (does not modify it)
- Reads from correct Component 1 file using shared iteration
- Model generalizes well to new patient transcripts
