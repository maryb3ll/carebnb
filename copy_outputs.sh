#!/bin/bash
#
# Copy Pipeline Output Files to Easy-to-Access Location
#

echo "📦 Copying Pipeline Test Outputs..."
echo ""

# Create output directory
OUTPUT_DIR="$HOME/pipeline_test_results"
mkdir -p "$OUTPUT_DIR/audio_test"
mkdir -p "$OUTPUT_DIR/text_test"

# Audio test session
AUDIO_SESSION="5b21f770-357c-4af4-89ed-9c8776061b2b"
AUDIO_PATH="/home/kitte/CareBnB/data/sessions/$AUDIO_SESSION/component4"

echo "Copying Audio Test Outputs..."
cp "$AUDIO_PATH/summary.pdf" "$OUTPUT_DIR/audio_test/summary.pdf"
cp "$AUDIO_PATH/final.zip" "$OUTPUT_DIR/audio_test/final.zip"
cp "$AUDIO_PATH/source_1_highlighted.pdf" "$OUTPUT_DIR/audio_test/source_1_highlighted.pdf"
cp "$AUDIO_PATH/source_2_highlighted.pdf" "$OUTPUT_DIR/audio_test/source_2_highlighted.pdf"
cp "$AUDIO_PATH/source_3_highlighted.pdf" "$OUTPUT_DIR/audio_test/source_3_highlighted.pdf"
echo "  ✓ Audio outputs copied to: $OUTPUT_DIR/audio_test/"

# Text test session
TEXT_SESSION="92300c32-ea41-4d2d-9587-76f8949cd36a"
TEXT_PATH="/home/kitte/CareBnB/data/sessions/$TEXT_SESSION/component4"

echo "Copying Text Test Outputs..."
cp "$TEXT_PATH/summary.pdf" "$OUTPUT_DIR/text_test/summary.pdf"
cp "$TEXT_PATH/final.zip" "$OUTPUT_DIR/text_test/final.zip"
cp "$TEXT_PATH/source_1_highlighted.pdf" "$OUTPUT_DIR/text_test/source_1_highlighted.pdf"
cp "$TEXT_PATH/source_2_highlighted.pdf" "$OUTPUT_DIR/text_test/source_2_highlighted.pdf"
cp "$TEXT_PATH/source_3_highlighted.pdf" "$OUTPUT_DIR/text_test/source_3_highlighted.pdf"
echo "  ✓ Text outputs copied to: $OUTPUT_DIR/text_test/"

echo ""
echo "✅ All files copied successfully!"
echo ""
echo "Output location: $OUTPUT_DIR"
echo ""
echo "Files:"
echo "  Audio Test:"
echo "    - $OUTPUT_DIR/audio_test/summary.pdf"
echo "    - $OUTPUT_DIR/audio_test/final.zip"
echo "    - $OUTPUT_DIR/audio_test/source_*_highlighted.pdf"
echo ""
echo "  Text Test:"
echo "    - $OUTPUT_DIR/text_test/summary.pdf"
echo "    - $OUTPUT_DIR/text_test/final.zip"
echo "    - $OUTPUT_DIR/text_test/source_*_highlighted.pdf"
echo ""
echo "To open the summary PDFs:"
echo "  xdg-open $OUTPUT_DIR/audio_test/summary.pdf"
echo "  xdg-open $OUTPUT_DIR/text_test/summary.pdf"
