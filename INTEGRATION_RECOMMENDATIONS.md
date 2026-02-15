# AI Pipeline Integration Recommendations for CareBnB Web Application

## Current Architecture Summary

**Frontend:**
- React 18 with Vite
- Next.js for SSR and routing
- TailwindCSS styling
- Redux Toolkit state management

**Backend:**
- Next.js API routes (`/app/api/*`)
- Supabase PostgreSQL database
- PostGIS for geospatial queries
- Supabase Auth (email/password)

**Database Tables:**
- `providers` - Healthcare providers
- `patients` - Patients seeking care
- `bookings` - Appointments/sessions
- `care_requests` - Open job postings

**API Endpoints:**
- `/api/providers/match` - Location-based provider search
- `/api/bookings` - Booking management
- `/api/requests/match` - Care request discovery

---

## 🎯 Integration Strategy

### 1. **Add AI Analysis as a Booking Feature**

**Concept:** When a patient creates a booking or care request, they can optionally upload:
- Audio recording of symptoms
- Text description of symptoms

The AI pipeline processes this and attaches the medical summary to the booking/request.

**Database Schema Changes:**

```sql
-- Add to bookings table
ALTER TABLE bookings ADD COLUMN ai_analysis_id UUID REFERENCES ai_analyses(id);
ALTER TABLE bookings ADD COLUMN has_ai_summary BOOLEAN DEFAULT false;

-- Add to care_requests table
ALTER TABLE care_requests ADD COLUMN ai_analysis_id UUID REFERENCES ai_analyses(id);
ALTER TABLE care_requests ADD COLUMN has_ai_summary BOOLEAN DEFAULT false;

-- New table for AI analysis results
CREATE TABLE ai_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(user_id),
  session_id TEXT UNIQUE NOT NULL,

  -- Input
  input_type TEXT CHECK (input_type IN ('audio', 'text')),
  input_file_url TEXT,
  transcript TEXT,

  -- Processing
  status TEXT CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,

  -- Component outputs
  keywords JSONB,
  description TEXT,

  -- Final outputs (Supabase Storage URLs)
  summary_pdf_url TEXT,
  final_zip_url TEXT,
  highlighted_sources JSONB, -- Array of URLs

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_analyses_patient ON ai_analyses(patient_id);
CREATE INDEX idx_ai_analyses_session ON ai_analyses(session_id);
CREATE INDEX idx_ai_analyses_status ON ai_analyses(status);
```

---

### 2. **New API Endpoints (Next.js)**

Create these endpoints in `/app/api/ai/`:

#### **POST /api/ai/analyze**
Upload audio/text for analysis
```typescript
// app/api/ai/analyze/route.ts
interface AnalyzeRequest {
  patientId: string;
  inputType: 'audio' | 'text';
  file?: File; // For audio
  text?: string; // For text input
  bookingId?: string; // Optional - link to booking
  careRequestId?: string; // Optional - link to care request
}

interface AnalyzeResponse {
  sessionId: string;
  status: 'queued' | 'processing';
  estimatedTime: number; // seconds
}
```

#### **GET /api/ai/status/:sessionId**
Check processing status
```typescript
interface StatusResponse {
  sessionId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: {
    currentComponent: 1 | 2 | 3 | 4;
    percentage: number;
  };
  error?: string;
  results?: {
    summaryPdfUrl: string;
    finalZipUrl: string;
    keywords: string[];
    description: string;
  };
}
```

#### **GET /api/ai/download/:sessionId**
Download final ZIP file
```typescript
// Returns the ZIP file as binary stream
```

#### **DELETE /api/ai/cleanup/:sessionId**
Clean up analysis files (optional, for user privacy)

---

### 3. **Backend Integration Architecture**

#### **Option A: Python Backend Service (Recommended)**

Create a separate Python FastAPI service that runs alongside Next.js:

```
Architecture:
┌─────────────┐
│   Next.js   │ ──POST /ai/analyze──> ┌──────────────┐
│  Frontend   │                        │   Next.js    │
└─────────────┘                        │  API Routes  │
                                       └──────┬───────┘
                                              │
                                       ┌──────▼────────┐
                                       │  Redis Queue  │
                                       │   (BullMQ)    │
                                       └──────┬────────┘
                                              │
                                       ┌──────▼────────┐
                                       │  Python       │
                                       │  FastAPI      │
                                       │  (AI Worker)  │
                                       └──────┬────────┘
                                              │
                                    ┌─────────▼──────────┐
                                    │  Supabase Storage  │
                                    │  (PDF outputs)     │
                                    └────────────────────┘
```

**Files to create:**
```
carebnb/
├── ai-service/                 # New Python service
│   ├── main.py                # FastAPI app
│   ├── worker.py              # Background job processor
│   ├── pipeline.py            # Your AI pipeline integration
│   ├── storage.py             # Supabase storage client
│   ├── requirements.txt
│   └── Dockerfile
├── app/api/ai/                # Next.js API proxy
│   ├── analyze/route.ts
│   ├── status/[id]/route.ts
│   └── download/[id]/route.ts
└── lib/
    └── ai-client.ts           # TypeScript client for AI service
```

**Why this approach:**
- ✅ Keeps Python AI pipeline separate
- ✅ Easy to scale independently
- ✅ Next.js just proxies requests
- ✅ Can deploy Python service anywhere
- ✅ Redis handles async processing

#### **Option B: Child Process (Simpler, Less Scalable)**

Run Python pipeline as child process from Next.js:

```typescript
// app/api/ai/analyze/route.ts
import { spawn } from 'child_process';

export async function POST(request: Request) {
  const { file } = await request.json();

  // Save file temporarily
  const tempPath = await saveUploadedFile(file);

  // Spawn Python process
  const python = spawn('python3', ['run_pipeline.py', tempPath]);

  // Handle output...
}
```

**Why NOT recommended:**
- ❌ Blocks Node.js event loop
- ❌ Hard to scale
- ❌ Process management issues
- ❌ Memory constraints

---

### 4. **Storage Integration with Supabase**

Your pipeline currently saves files locally. For web deployment, integrate Supabase Storage:

#### **Modify pipeline to upload to Supabase:**

```python
# Add to run_pipeline.py or create storage.py
from supabase import create_client, Client
import os

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

def upload_to_storage(local_file_path: str, session_id: str, file_type: str) -> str:
    """Upload file to Supabase Storage and return public URL"""
    bucket_name = "ai-analyses"
    storage_path = f"{session_id}/{file_type}"

    with open(local_file_path, 'rb') as f:
        supabase.storage.from_(bucket_name).upload(
            path=storage_path,
            file=f,
            file_options={"content-type": "application/pdf" if file_type.endswith('.pdf') else "application/zip"}
        )

    # Get public URL
    url = supabase.storage.from_(bucket_name).get_public_url(storage_path)
    return url
```

#### **Update Component 4 to upload results:**

```python
# In src/models/component4/cot_agent.py
def run_cot_summarizer(session_id: str = None) -> Dict:
    # ... existing code ...

    # After generating files, upload to Supabase
    if session_id:
        summary_url = upload_to_storage(summary_pdf_path, session_id, "summary.pdf")
        zip_url = upload_to_storage(zip_path, session_id, "final.zip")

        # Update database
        supabase.table('ai_analyses').update({
            'status': 'completed',
            'summary_pdf_url': summary_url,
            'final_zip_url': zip_url,
            'completed_at': datetime.now().isoformat()
        }).eq('session_id', session_id).execute()
```

---

### 5. **Replace Iteration System with Session IDs**

**Current:** Global iteration counter
**Problem:** Conflicts with concurrent users
**Solution:** UUID-based sessions

#### **Changes needed:**

```python
# run_pipeline.py - MODIFY
import uuid

def run_pipeline(input_file: Path, session_id: str = None):
    """Run pipeline with session ID instead of iteration"""

    if session_id is None:
        session_id = str(uuid.uuid4())

    # Create session directory
    session_dir = PROJECT_ROOT / 'data' / 'sessions' / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    # Pass session_id to all components instead of iteration
    # ... rest of pipeline ...
```

#### **Update all components:**

Each component should accept `session_id` instead of reading global iteration:

```python
# Component 1
def transcribe_audio(audio_path: Path, session_id: str) -> Dict:
    output_path = OUTPUT_DIR / session_id / "transcript.json"
    # ...

# Component 2
def extract_keywords(session_id: str) -> Dict:
    input_path = COMPONENT1_DIR / session_id / "transcript.json"
    # ...

# Similar for Components 3 & 4
```

---

### 6. **Async Processing with BullMQ**

For handling long-running AI pipeline without blocking HTTP requests:

#### **Install dependencies:**
```bash
npm install bullmq ioredis
```

#### **Create queue:**
```typescript
// lib/ai-queue.ts
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';

const connection = new Redis(process.env.REDIS_URL);

export const aiAnalysisQueue = new Queue('ai-analysis', { connection });

export interface AnalysisJob {
  sessionId: string;
  patientId: string;
  inputType: 'audio' | 'text';
  filePath: string;
}

// Worker processes jobs
const worker = new Worker('ai-analysis', async (job) => {
  const { sessionId, filePath } = job.data;

  // Call Python pipeline
  await callPythonPipeline(filePath, sessionId);

  return { sessionId, status: 'completed' };
}, { connection });
```

#### **Add job to queue:**
```typescript
// app/api/ai/analyze/route.ts
import { aiAnalysisQueue } from '@/lib/ai-queue';

export async function POST(request: Request) {
  const sessionId = uuidv4();

  // Save file
  const filePath = await saveFile(file);

  // Add to queue
  await aiAnalysisQueue.add('analyze', {
    sessionId,
    patientId,
    inputType,
    filePath
  });

  // Save to database
  await supabase.from('ai_analyses').insert({
    session_id: sessionId,
    patient_id: patientId,
    status: 'queued'
  });

  return Response.json({ sessionId, status: 'queued' });
}
```

---

### 7. **Frontend Integration**

#### **Upload Component:**
```typescript
// components/AIAnalysisUpload.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AIAnalysisUpload({ bookingId }: { bookingId?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpload = async () => {
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bookingId', bookingId);

    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      body: formData
    });

    const { sessionId } = await response.json();

    // Redirect to status page
    router.push(`/analysis/${sessionId}`);
  };

  return (
    <div className="border-2 border-dashed p-6 rounded-lg">
      <h3>Upload Symptom Recording</h3>
      <input
        type="file"
        accept="audio/*,.txt"
        onChange={(e) => setFile(e.target.files?.[0])}
      />
      <button onClick={handleUpload} disabled={!file || loading}>
        {loading ? 'Processing...' : 'Analyze Symptoms'}
      </button>
    </div>
  );
}
```

#### **Status/Results Page:**
```typescript
// app/analysis/[sessionId]/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function AnalysisPage({ params }) {
  const { sessionId } = params;
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const pollStatus = setInterval(async () => {
      const res = await fetch(`/api/ai/status/${sessionId}`);
      const data = await res.json();

      setStatus(data);

      if (data.status === 'completed' || data.status === 'failed') {
        clearInterval(pollStatus);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollStatus);
  }, [sessionId]);

  if (status?.status === 'completed') {
    return (
      <div>
        <h2>Analysis Complete!</h2>
        <a href={status.results.summaryPdfUrl} download>
          Download Summary PDF
        </a>
        <a href={status.results.finalZipUrl} download>
          Download Full Report (ZIP)
        </a>

        <div>
          <h3>Keywords:</h3>
          {status.results.keywords.map(k => <span key={k}>{k}</span>)}
        </div>

        <div>
          <h3>Summary:</h3>
          <p>{status.results.description}</p>
        </div>
      </div>
    );
  }

  return <div>Processing... {status?.progress?.percentage}%</div>;
}
```

---

### 8. **Environment Variables**

Add to `.env.local`:
```bash
# AI Pipeline
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
NCBI_API_KEY=...

# Python Service (if using separate service)
AI_SERVICE_URL=http://localhost:8000

# Redis (for BullMQ)
REDIS_URL=redis://localhost:6379

# Supabase Storage
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...  # Server-side only
```

---

### 9. **Deployment Considerations**

#### **Option A: Monorepo (Recommended)**
```
carebnb/
├── frontend/           # Next.js app
├── ai-service/         # Python FastAPI
├── docker-compose.yml  # Local dev
└── .github/workflows/  # CI/CD
```

#### **Option B: Separate Repos**
- `carebnb-frontend` - Next.js
- `carebnb-ai-service` - Python pipeline

#### **Docker Setup:**
```dockerfile
# ai-service/Dockerfile
FROM python:3.11-slim

# Install system dependencies (ffmpeg for audio)
RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  ai-service:
    build: ./ai-service
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SUPABASE_URL=${SUPABASE_URL}
    depends_on:
      - redis

  nextjs:
    build: .
    ports:
      - "3000:3000"
    environment:
      - AI_SERVICE_URL=http://ai-service:8000
    depends_on:
      - ai-service
```

---

## 📋 Implementation Checklist

### Phase 1: Basic Integration (MVP)
- [ ] Add `ai_analyses` table to database
- [ ] Create `/api/ai/*` endpoints in Next.js
- [ ] Modify `run_pipeline.py` to accept session ID
- [ ] Add Supabase Storage integration
- [ ] Create upload UI component
- [ ] Test end-to-end with audio file

### Phase 2: Production Ready
- [ ] Set up Redis + BullMQ for async processing
- [ ] Add progress tracking
- [ ] Implement file cleanup/retention
- [ ] Add error handling and retries
- [ ] Create Docker containers
- [ ] Add monitoring/logging

### Phase 3: User Experience
- [ ] Link AI analysis to bookings
- [ ] Provider dashboard shows AI summaries
- [ ] Patient can share summary with provider
- [ ] Email notifications on completion
- [ ] Mobile-responsive upload interface

---

## 🔄 Workflow Example

**Patient books appointment:**
1. Patient creates booking on website
2. Optionally uploads symptom recording
3. AI pipeline processes in background
4. Patient receives notification when complete
5. Summary PDF attached to booking
6. Provider sees AI analysis in their dashboard
7. During appointment, provider references the summary

---

## ⚠️ Important Notes

1. **HIPAA Compliance**: If handling real patient data, ensure:
   - Encrypted storage (Supabase handles this)
   - Access controls (auth required)
   - Audit logging
   - Data retention policies

2. **Cost Management**:
   - OpenAI API costs ~$0.10-0.50 per analysis
   - Anthropic API costs similar
   - Monitor usage and set limits

3. **File Storage**:
   - Audio files can be large (50MB+)
   - Set upload size limits
   - Clean up old analyses regularly

4. **Rate Limiting**:
   - Prevent abuse with rate limits
   - Queue has max concurrent jobs

---

## 🚀 Recommended First Steps

1. **Test locally first:**
   - Run Python pipeline standalone
   - Verify all components work
   - Test with sample audio/text

2. **Create simple API endpoint:**
   - POST /api/ai/test
   - Accepts file, runs pipeline synchronously
   - Returns results directly (no queue yet)

3. **Add database tracking:**
   - Create ai_analyses table
   - Store session ID and status

4. **Build upload UI:**
   - Simple file upload form
   - Show processing status
   - Display results

5. **Add async processing:**
   - Integrate BullMQ
   - Move to background jobs
   - Add progress updates

Would you like me to start implementing any of these recommendations?
