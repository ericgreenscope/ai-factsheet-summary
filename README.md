# ESG Factsheet AI

A full-stack application for ingesting ESG factsheets (PPTX), generating AI-powered summaries, enabling human review and editing, and regenerating PPTX files with approved summaries.

## Architecture

- **Frontend**: React + Vite + TypeScript + Tailwind CSS (`apps/web/`)
- **Backend**: FastAPI + Python (`apps/api/`)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **AI**: Google Gemini Pro API
- **Deployment**: Render (two services)

## Features

- Batch upload of PPTX files
- AI-powered analysis generating Strengths, Weaknesses, and 12-month Action Plans
- Human review and editing interface
- Regeneration of PPTX with approved summaries inserted into predefined placeholders
- Excel export of all approved summaries
- Audit trail with raw model outputs

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account
- OpenAI API key

### Supabase Setup

1. Create a new Supabase project
2. Run the migration script:
   ```bash
   # In Supabase SQL Editor
   # Run: infra/supabase-migration.sql
   ```
3. Create storage buckets:
   - `factsheets` (public or private based on your needs)

### Backend Setup

```bash
cd apps/api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `apps/api/.env`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4o-mini
CORS_ORIGIN=http://localhost:5173
```

Run the API:
```bash
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd apps/web
npm install
```

Create `apps/web/.env`:
```
VITE_API_BASE_URL=http://localhost:8000
```

Run the dev server:
```bash
npm run dev
```

Visit `http://localhost:5173`

## Deployment

This project is configured for deployment on Render using `infra/render.yaml`.

### Steps:

1. Fork/push this repo to GitHub
2. Create a new Blueprint instance on Render
3. Point it to `infra/render.yaml`
4. Set environment variables for both services:
   - **API service**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `CORS_ORIGIN`
   - **Web service**: `VITE_API_BASE_URL` (set to your API service URL)

## Project Structure

```
esg-factsheet-ai/
├── apps/
│   ├── web/              # React frontend
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── api.ts
│   │   │   ├── pages/
│   │   │   └── components/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── api/              # FastAPI backend
│       ├── main.py
│       ├── requirements.txt
│       └── README.md
└── infra/
    ├── render.yaml       # Render deployment config
    └── supabase-migration.sql
```

## Usage

1. **Upload**: Navigate to `/upload` and drag-drop PPTX files
2. **Analyze**: Files are automatically analyzed; view progress on `/files`
3. **Review**: Click "Open Review" to edit AI-generated summaries
4. **Approve**: Click "Approve & Regenerate PPT" to create final PPTX
5. **Download**: Download regenerated PPTX or export all to Excel

## Requirements

- Each PPTX must have a text shape with name or alt text = `AI_SUMMARY`
- AI summaries are inserted into this placeholder
- Output format: English only, consultative tone, concise bullets (≤22 words)

## License

MIT

