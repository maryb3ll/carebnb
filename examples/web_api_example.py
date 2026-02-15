"""
Web API Usage Examples

Demonstrates how to use the PipelineAPI in various web frameworks.
"""

# ============================================================================
# Example 1: Direct Function Call (Simplest)
# ============================================================================

def example_direct_call():
    """Simple example of processing audio or text directly"""
    from pipeline_api import PipelineAPI

    api = PipelineAPI()

    # Example 1a: Process audio from file
    with open('patient_recording.m4a', 'rb') as f:
        audio_bytes = f.read()

    result = api.process_audio(audio_bytes, format='m4a')

    if result.status == 'completed':
        print(f"Session ID: {result.session_id}")
        print(f"Keywords: {result.keywords}")
        print(f"Description: {result.description}")

        # Save PDF
        with open('output_summary.pdf', 'wb') as f:
            f.write(result.summary_pdf_data)

        print(f"PDF saved at: {result.summary_pdf_path}")
    else:
        print(f"Error: {result.error}")

    # Example 1b: Process text input
    result = api.process_text(
        "Patient has high fever for 5 days, swollen lymph nodes, joint pain."
    )

    if result.status == 'completed':
        print(f"Keywords: {result.keywords}")
        # Use PDF data...


# ============================================================================
# Example 2: Flask Integration
# ============================================================================

def create_flask_app():
    """Flask web application example"""
    from flask import Flask, request, send_file, jsonify
    from pipeline_api import PipelineAPI
    import io

    app = Flask(__name__)
    api = PipelineAPI()

    @app.route('/analyze', methods=['POST'])
    def analyze():
        """Upload and analyze audio file"""
        if 'audio' not in request.files:
            return {'error': 'No audio file provided'}, 400

        file = request.files['audio']
        audio_bytes = file.read()

        # Detect format from filename
        format = file.filename.split('.')[-1]

        # Process audio
        result = api.process_audio(audio_bytes, format=format)

        if result.status == 'completed':
            return {
                'sessionId': result.session_id,
                'keywords': result.keywords,
                'description': result.description,
                'summaryUrl': f'/download/{result.session_id}/summary',
                'zipUrl': f'/download/{result.session_id}/zip'
            }
        else:
            return {'error': result.error}, 500

    @app.route('/analyze-text', methods=['POST'])
    def analyze_text():
        """Analyze text input"""
        data = request.get_json()
        text = data.get('text')

        if not text:
            return {'error': 'No text provided'}, 400

        result = api.process_text(text)

        if result.status == 'completed':
            return {
                'sessionId': result.session_id,
                'keywords': result.keywords,
                'description': result.description
            }
        else:
            return {'error': result.error}, 500

    @app.route('/download/<session_id>/<file_type>')
    def download(session_id, file_type):
        """Download result files"""
        result = api.get_result(session_id)

        if result.status != 'completed':
            return {'error': 'Session not found or not completed'}, 404

        if file_type == 'summary':
            return send_file(
                io.BytesIO(result.summary_pdf_data),
                mimetype='application/pdf',
                as_attachment=True,
                download_name='summary.pdf'
            )
        elif file_type == 'zip':
            return send_file(
                io.BytesIO(result.final_zip_data),
                mimetype='application/zip',
                as_attachment=True,
                download_name='analysis.zip'
            )
        else:
            return {'error': 'Invalid file type'}, 400

    return app


# ============================================================================
# Example 3: FastAPI Integration
# ============================================================================

def create_fastapi_app():
    """FastAPI web application example"""
    from fastapi import FastAPI, UploadFile, File, HTTPException
    from fastapi.responses import StreamingResponse
    from pipeline_api import PipelineAPI
    from pydantic import BaseModel
    import io

    app = FastAPI()
    api = PipelineAPI()

    class TextAnalysisRequest(BaseModel):
        text: str

    @app.post('/analyze')
    async def analyze(file: UploadFile = File(...)):
        """Upload and analyze audio file"""
        audio_bytes = await file.read()
        format = file.filename.split('.')[-1]

        result = api.process_audio(audio_bytes, format=format)

        if result.status != 'completed':
            raise HTTPException(status_code=500, detail=result.error)

        return {
            'sessionId': result.session_id,
            'status': result.status,
            'keywords': result.keywords,
            'description': result.description,
            'summaryUrl': f'/download/{result.session_id}/summary',
            'zipUrl': f'/download/{result.session_id}/zip'
        }

    @app.post('/analyze-text')
    async def analyze_text(request: TextAnalysisRequest):
        """Analyze text input"""
        result = api.process_text(request.text)

        if result.status != 'completed':
            raise HTTPException(status_code=500, detail=result.error)

        return {
            'sessionId': result.session_id,
            'keywords': result.keywords,
            'description': result.description
        }

    @app.get('/download/{session_id}/summary')
    async def download_summary(session_id: str):
        """Download summary PDF"""
        result = api.get_result(session_id)

        if result.status != 'completed':
            raise HTTPException(status_code=404, detail='Session not found')

        return StreamingResponse(
            io.BytesIO(result.summary_pdf_data),
            media_type='application/pdf',
            headers={'Content-Disposition': 'attachment; filename=summary.pdf'}
        )

    @app.get('/download/{session_id}/zip')
    async def download_zip(session_id: str):
        """Download final ZIP"""
        result = api.get_result(session_id)

        if result.status != 'completed':
            raise HTTPException(status_code=404, detail='Session not found')

        return StreamingResponse(
            io.BytesIO(result.final_zip_data),
            media_type='application/zip',
            headers={'Content-Disposition': 'attachment; filename=analysis.zip'}
        )

    return app


# ============================================================================
# Example 4: Session Management
# ============================================================================

def example_session_management():
    """Demonstrate session management features"""
    from src.models.session_manager import list_sessions, cleanup_old_sessions

    # List all completed sessions
    completed = list_sessions(status='completed')
    print(f"Completed sessions: {len(completed)}")

    for session in completed[:5]:  # Show first 5
        print(f"  {session['session_id']}: {session['created_at']}")

    # Cleanup old sessions (older than 7 days)
    deleted_count = cleanup_old_sessions(days=7)
    print(f"Deleted {deleted_count} old sessions")


# ============================================================================
# Example 5: Custom Session ID
# ============================================================================

def example_custom_session_id():
    """Use your own session ID (e.g., from database)"""
    from pipeline_api import PipelineAPI

    api = PipelineAPI()

    # Use your own identifier (e.g., user ID + timestamp)
    custom_session_id = 'user123_20250214_001'

    result = api.process_text(
        text="Patient has fever and cough",
        session_id=custom_session_id
    )

    print(f"Used session ID: {result.session_id}")
    # Will be: user123_20250214_001


if __name__ == '__main__':
    print("Pipeline API Examples")
    print("=" * 60)
    print("\nSee function definitions above for usage examples:")
    print("  - example_direct_call(): Simple API usage")
    print("  - create_flask_app(): Flask integration")
    print("  - create_fastapi_app(): FastAPI integration")
    print("  - example_session_management(): Session management")
    print("  - example_custom_session_id(): Custom session IDs")
    print("\nTo run Flask example:")
    print("  app = create_flask_app()")
    print("  app.run(debug=True)")
    print("\nTo run FastAPI example:")
    print("  import uvicorn")
    print("  app = create_fastapi_app()")
    print("  uvicorn.run(app, host='0.0.0.0', port=8000)")
