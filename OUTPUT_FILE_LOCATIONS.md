# Output File Locations

## Session 1: Audio Test (test_recording.m4a)

**Session ID:** `5b21f770-357c-4af4-89ed-9c8776061b2b`

### Main Output Files:
```
/home/kitte/CareBnB/data/sessions/5b21f770-357c-4af4-89ed-9c8776061b2b/component4/
```

**Files:**
- 📄 **summary.pdf** (19 MB) - Main patient evaluation summary
- 📦 **final.zip** (11 MB) - Complete package with all files
- 📑 **source_1_highlighted.pdf** (20 KB) - Highlighted research article #1
- 📑 **source_2_highlighted.pdf** (24 KB) - Highlighted research article #2
- 📑 **source_3_highlighted.pdf** (22 KB) - Highlighted research article #3

### Full Paths:
```bash
# Main summary PDF
/home/kitte/CareBnB/data/sessions/5b21f770-357c-4af4-89ed-9c8776061b2b/component4/summary.pdf

# Complete ZIP package
/home/kitte/CareBnB/data/sessions/5b21f770-357c-4af4-89ed-9c8776061b2b/component4/final.zip

# Highlighted sources
/home/kitte/CareBnB/data/sessions/5b21f770-357c-4af4-89ed-9c8776061b2b/component4/source_1_highlighted.pdf
/home/kitte/CareBnB/data/sessions/5b21f770-357c-4af4-89ed-9c8776061b2b/component4/source_2_highlighted.pdf
/home/kitte/CareBnB/data/sessions/5b21f770-357c-4af4-89ed-9c8776061b2b/component4/source_3_highlighted.pdf
```

---

## Session 2: Text Test (test_text.txt)

**Session ID:** `92300c32-ea41-4d2d-9587-76f8949cd36a`

### Main Output Files:
```
/home/kitte/CareBnB/data/sessions/92300c32-ea41-4d2d-9587-76f8949cd36a/component4/
```

**Files:**
- 📄 **summary.pdf** (19 MB) - Main patient evaluation summary
- 📦 **final.zip** (11 MB) - Complete package with all files
- 📑 **source_1_highlighted.pdf** (13 KB) - Highlighted research article #1
- 📑 **source_2_highlighted.pdf** (24 KB) - Highlighted research article #2
- 📑 **source_3_highlighted.pdf** (21 KB) - Highlighted research article #3

### Full Paths:
```bash
# Main summary PDF
/home/kitte/CareBnB/data/sessions/92300c32-ea41-4d2d-9587-76f8949cd36a/component4/summary.pdf

# Complete ZIP package
/home/kitte/CareBnB/data/sessions/92300c32-ea41-4d2d-9587-76f8949cd36a/component4/final.zip

# Highlighted sources
/home/kitte/CareBnB/data/sessions/92300c32-ea41-4d2d-9587-76f8949cd36a/component4/source_1_highlighted.pdf
/home/kitte/CareBnB/data/sessions/92300c32-ea41-4d2d-9587-76f8949cd36a/component4/source_2_highlighted.pdf
/home/kitte/CareBnB/data/sessions/92300c32-ea41-4d2d-9587-76f8949cd36a/component4/source_3_highlighted.pdf
```

---

## How to Access the Files

### Option 1: Open Directly (if you have a GUI)
```bash
# Open summary PDF
xdg-open /home/kitte/CareBnB/data/sessions/5b21f770-357c-4af4-89ed-9c8776061b2b/component4/summary.pdf

# Or for text test
xdg-open /home/kitte/CareBnB/data/sessions/92300c32-ea41-4d2d-9587-76f8949cd36a/component4/summary.pdf
```

### Option 2: Copy to Desktop or Downloads
```bash
# Copy audio test outputs to current directory
cp /home/kitte/CareBnB/data/sessions/5b21f770-357c-4af4-89ed-9c8776061b2b/component4/summary.pdf ./audio_test_summary.pdf
cp /home/kitte/CareBnB/data/sessions/5b21f770-357c-4af4-89ed-9c8776061b2b/component4/final.zip ./audio_test_final.zip

# Copy text test outputs
cp /home/kitte/CareBnB/data/sessions/92300c32-ea41-4d2d-9587-76f8949cd36a/component4/summary.pdf ./text_test_summary.pdf
cp /home/kitte/CareBnB/data/sessions/92300c32-ea41-4d2d-9587-76f8949cd36a/component4/final.zip ./text_test_final.zip
```

### Option 3: Extract ZIP to View All Files
```bash
# Extract audio test ZIP
unzip /home/kitte/CareBnB/data/sessions/5b21f770-357c-4af4-89ed-9c8776061b2b/component4/final.zip -d ./audio_test_output/

# Extract text test ZIP
unzip /home/kitte/CareBnB/data/sessions/92300c32-ea41-4d2d-9587-76f8949cd36a/component4/final.zip -d ./text_test_output/
```

### Option 4: Access via Python API
```python
from pipeline_api import PipelineAPI

api = PipelineAPI()

# Get audio test results
result = api.get_result('5b21f770-357c-4af4-89ed-9c8776061b2b')
pdf_data = result.summary_pdf_data  # PDF as bytes
zip_data = result.final_zip_data    # ZIP as bytes

# Save to file
with open('my_summary.pdf', 'wb') as f:
    f.write(pdf_data)
```

---

## All Session Files (Complete Structure)

### Audio Session Full Structure:
```
data/sessions/5b21f770-357c-4af4-89ed-9c8776061b2b/
├── input/
│   └── audio.m4a                    # Original audio input
├── component1/
│   └── transcript.json              # Whisper transcription
├── component2/
│   └── keywords.json                # Extracted keywords
├── component3/
│   ├── source_1.pdf                 # Original research article 1
│   ├── source_2.pdf                 # Original research article 2
│   ├── source_3.pdf                 # Original research article 3
│   └── metadata.json                # Search metadata
├── component4/
│   ├── summary.pdf                  # ⭐ MAIN OUTPUT - Patient evaluation
│   ├── source_1_highlighted.pdf     # Highlighted version of article 1
│   ├── source_2_highlighted.pdf     # Highlighted version of article 2
│   ├── source_3_highlighted.pdf     # Highlighted version of article 3
│   └── final.zip                    # ⭐ COMPLETE PACKAGE - All files
└── metadata.json                    # Session metadata
```

### Text Session Full Structure:
```
data/sessions/92300c32-ea41-4d2d-9587-76f8949cd36a/
├── input/
│   └── transcript.txt               # Original text input
├── component1/
│   └── transcript.json              # Text formatted as transcript
├── component2/
│   └── keywords.json                # Extracted keywords
├── component3/
│   ├── source_1.pdf                 # Original research article 1
│   ├── source_2.pdf                 # Original research article 2
│   ├── source_3.pdf                 # Original research article 3
│   └── metadata.json                # Search metadata
├── component4/
│   ├── summary.pdf                  # ⭐ MAIN OUTPUT - Patient evaluation
│   ├── source_1_highlighted.pdf     # Highlighted version of article 1
│   ├── source_2_highlighted.pdf     # Highlighted version of article 2
│   ├── source_3_highlighted.pdf     # Highlighted version of article 3
│   └── final.zip                    # ⭐ COMPLETE PACKAGE - All files
└── metadata.json                    # Session metadata
```

---

## Quick Access Commands

### View Summary PDFs:
```bash
# Audio test
open /home/kitte/CareBnB/data/sessions/5b21f770-357c-4af4-89ed-9c8776061b2b/component4/summary.pdf

# Text test
open /home/kitte/CareBnB/data/sessions/92300c32-ea41-4d2d-9587-76f8949cd36a/component4/summary.pdf
```

### Copy All Outputs to Desktop:
```bash
# Create output directory
mkdir -p ~/Desktop/pipeline_outputs

# Copy audio test
cp -r /home/kitte/CareBnB/data/sessions/5b21f770-357c-4af4-89ed-9c8776061b2b/component4/* ~/Desktop/pipeline_outputs/audio_test/

# Copy text test
cp -r /home/kitte/CareBnB/data/sessions/92300c32-ea41-4d2d-9587-76f8949cd36a/component4/* ~/Desktop/pipeline_outputs/text_test/
```

---

## What's in the Summary PDF?

The **summary.pdf** file contains:
- ✅ Keywords extracted from the transcript
- ✅ Summary of the transcript
- ✅ Comprehensive patient summary (clinical analysis based on research)
- ✅ SOAP notes (Subjective, Objective, Assessment, Plan)
- ✅ Related healthcare fields
- ✅ Recommended diagnostic devices/tests
- ✅ Urgency level and recommended action timeframe

## What's in the ZIP file?

The **final.zip** contains:
- ✅ summary.pdf (main patient evaluation)
- ✅ source_1_highlighted.pdf (highlighted research article)
- ✅ source_2_highlighted.pdf (highlighted research article)
- ✅ source_3_highlighted.pdf (highlighted research article)

This ZIP is what you'd deliver to a healthcare provider - everything they need in one package!
