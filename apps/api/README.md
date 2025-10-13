# ESG Factsheet AI - Backend API

FastAPI backend for processing ESG factsheets, generating AI summaries, and regenerating PPTX files.

## Tech Stack

- **Framework**: FastAPI
- **Python**: 3.11+
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **AI**: OpenAI API (GPT-4o-mini)
- **PPTX Processing**: python-pptx

## Setup

### Prerequisites

- Python 3.11 or higher
- Supabase account with project created
- OpenAI API key

### Installation

1. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4o-mini
CORS_ORIGIN=http://localhost:5173
```

### Database Setup

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Run the migration script from `../../infra/supabase-migration.sql`
4. Create storage bucket named `factsheets` in Storage section

### Running Locally

```bash
uvicorn main:app --reload --port 8000
```

API will be available at `http://localhost:8000`

API documentation (Swagger UI): `http://localhost:8000/docs`

## API Endpoints

### Core Endpoints

- `GET /healthz` - Health check
- `POST /upload` - Upload multiple PPTX files
- `POST /analyze/{file_id}` - Analyze file and generate AI summary
- `POST /review/{file_id}` - Save/update review draft
- `POST /approve/{file_id}` - Approve review and regenerate PPTX
- `GET /file/{file_id}` - Get file details with suggestions and reviews
- `GET /files` - List all files
- `GET /export/excel` - Export approved summaries to Excel

## Project Structure

```
apps/api/
├── main.py              # FastAPI application and endpoints
├── config.py            # Configuration management
├── storage.py           # Supabase Storage utilities
├── pptx_utils.py        # PPTX text extraction and manipulation
├── ai_service.py        # OpenAI integration
├── requirements.txt     # Python dependencies
├── test_main.py         # Unit tests
├── test_pptx_fixture.py # Test PPTX generator
└── README.md           # This file
```

## Testing

### Run Tests

```bash
pytest test_main.py -v
```

### Generate Test PPTX

```bash
python test_pptx_fixture.py
```

This creates `test_factsheet.pptx` with an AI_SUMMARY placeholder for testing.

## Key Features

### PPTX Processing

- Extracts text from all slides including tables
- Finds shape by name or alt_text = "AI_SUMMARY"
- Inserts formatted summary while preserving original formatting
- Handles errors gracefully if placeholder not found

### AI Integration

- Consultative tone for executive audiences
- Sector-aware context (inferred from deck text)
- Structured output: Strengths, Weaknesses, Action Plan
- Concise bullets (≤22 words per bullet)
- Temperature: 0.2 for consistency
- JSON response format for reliable parsing

### Storage

- Original PPTX uploaded to `factsheets/original/{file_id}.pptx`
- Regenerated PPTX saved to `factsheets/regenerated/{file_id}.pptx`
- Signed URLs with 1-hour expiry for downloads
- Automatic cleanup via Supabase policies (optional)

### Audit Trail

- All suggestions stored with raw model output (JSONB)
- Job tracking for async operations (future-ready)
- Review history with timestamps
- Editor notes for documentation

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | Yes | - | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | - | Service role key (server-side only) |
| `OPENAI_API_KEY` | Yes | - | OpenAI API key |
| `OPENAI_MODEL` | No | gpt-4o-mini | OpenAI model to use |
| `CORS_ORIGIN` | No | http://localhost:5173 | Allowed CORS origin |

## Deployment

See `../../infra/render.yaml` for Render deployment configuration.

### Deploy to Render

1. Connect GitHub repository to Render
2. Create new Blueprint instance
3. Set environment variables in Render dashboard
4. Deploy!

## Error Handling

- **400**: Bad request (e.g., invalid file type)
- **404**: Resource not found (e.g., file_id doesn't exist)
- **500**: Server error (stored in jobs table with error details)

All errors include descriptive messages for debugging.

## Security

- API keys never exposed to frontend
- Supabase Service Role key for server-side operations
- CORS restricted to web origin
- No user authentication in MVP (can be added via Supabase Auth)

## Performance

- Text extraction truncated at ~80k chars to fit LLM context
- Typical latency: 30-180 seconds per file (depends on PPTX size and LLM)
- Polling on frontend for async feel
- Future: Move to proper async with Celery/Redis

## License

MIT

