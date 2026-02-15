"""
Flask server for CareBnB AI intake pipeline.
Run from audio-model directory: python server.py
Serves POST /analyze for text or audio input; returns JSON with session_id, keywords, transcript, summary_pdf_base64.
"""
import base64
import os
from flask import Flask, request, jsonify

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024  # 100MB

# Lazy init so we only load pipeline when first request comes
_api = None


def get_api():
    global _api
    if _api is None:
        from pipeline_api import PipelineAPI
        _api = PipelineAPI()
    return _api


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "carebnb-pipeline"})


@app.route("/analyze", methods=["POST"])
def analyze():
    """Accept either JSON { text: "..." } or multipart form with file "audio" (and optional "format")."""
    try:
        api = get_api()
    except Exception as e:
        return jsonify({"error": f"Pipeline init failed: {str(e)}", "status": "failed"}), 500

    # Text input
    if request.content_type and "application/json" in request.content_type:
        data = request.get_json() or {}
        text = data.get("text", "").strip()
        if not text:
            return jsonify({"error": "Missing or empty 'text'", "status": "failed"}), 400
        result = api.process_text(text)
        return _result_to_json(result)

    # Audio upload (multipart)
    if "audio" not in request.files:
        return jsonify({"error": "Missing 'audio' file or send JSON with 'text'", "status": "failed"}), 400
    file = request.files["audio"]
    if not file or not file.filename:
        return jsonify({"error": "No file selected", "status": "failed"}), 400
    audio_bytes = file.read()
    if not audio_bytes:
        return jsonify({"error": "Empty file", "status": "failed"}), 400
    format_hint = (request.form.get("format") or "").strip().lower() or None
    if not format_hint:
        ext = os.path.splitext(file.filename)[1].lstrip(".").lower()
        format_hint = ext if ext in ("m4a", "wav", "mp3", "webm", "ogg", "flac") else "m4a"
    result = api.process_audio(audio_bytes, format=format_hint)
    return _result_to_json(result)


def _result_to_json(result):
    payload = {
        "sessionId": result.session_id,
        "status": result.status,
        "keywords": result.keywords or [],
        "transcript": result.transcript or "",
        "description": result.description or "",
        "durationSeconds": result.duration_seconds,
        "error": result.error,
    }
    if result.summary_pdf_data:
        payload["summaryPdfBase64"] = base64.standard_b64encode(result.summary_pdf_data).decode("ascii")
    if result.final_zip_data:
        payload["zipBase64"] = base64.standard_b64encode(result.final_zip_data).decode("ascii")
    status_code = 200 if result.status == "completed" else 422
    return jsonify(payload), status_code


if __name__ == "__main__":
    # Default 5001: on macOS, port 5000 is used by AirPlay Receiver and returns 403
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG", "0") == "1")
