# ESG Factsheet AI - Web Frontend

React-based web interface for uploading, reviewing, and managing ESG factsheets.

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **HTTP Client**: Axios

## Setup

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
VITE_API_BASE_URL=http://localhost:8000
```

### Running Locally

Development mode (with hot reload):
```bash
npm run dev
```

App will be available at `http://localhost:5173`

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
apps/web/
├── src/
│   ├── main.tsx           # Entry point
│   ├── App.tsx            # Root component with routing
│   ├── api.ts             # API client (Axios)
│   ├── index.css          # Global styles + Tailwind
│   ├── components/
│   │   ├── Uploader.tsx       # Drag-and-drop file uploader
│   │   └── ReviewEditor.tsx   # Text editor for review sections
│   └── pages/
│       ├── Upload.tsx         # Upload page
│       ├── FileList.tsx       # File listing with actions
│       └── Review.tsx         # Review/edit interface
├── index.html
├── vite.config.ts
├── tailwind.config.cjs
├── postcss.config.cjs
├── tsconfig.json
├── package.json
└── README.md              # This file
```

## Pages

### Upload (`/upload`)

- Drag-and-drop multiple PPTX files
- Optional company name input
- File validation (PPTX only)
- Batch upload with progress indication

### File List (`/files`)

- Table view of all uploaded files
- Real-time status updates (polling every 3s)
- Actions: Analyze, Review, Download
- Export to Excel button

### Review (`/file/:id`)

- Three editable text areas: Strengths, Weaknesses, Action Plan
- Pre-filled with AI suggestions
- Save Draft button
- Approve & Regenerate PPT button
- Request New Suggestion button
- Download links for original and regenerated PPTX
- Job history and status indicators

## Components

### Uploader

Reusable drag-and-drop file input:
- Visual feedback on drag events
- File type validation
- Multiple file selection
- Disabled state support

### ReviewEditor

Textarea with metadata:
- Line and word counts
- Character limit guidance
- Formatting tips
- Disabled state support

## Features

### Real-Time Updates

- Polling every 3 seconds on FileList and Review pages
- Automatic status updates for jobs
- Non-blocking UI during long operations

### Error Handling

- Toast-style error messages
- Clear error descriptions from API
- Network error handling
- Validation feedback

### Loading States

- Spinners for async operations
- Disabled buttons during processing
- Progress indicators
- Visual feedback for all actions

### Responsive Design

- Mobile-friendly layout
- Tailwind CSS utility classes
- Clean, professional UI
- Accessible components

## API Integration

All API calls go through `src/api.ts`:

```typescript
// Upload files
await uploadFiles(files, companyName)

// Analyze file
await analyzeFile(fileId)

// Save review draft
await saveReview(fileId, reviewData)

// Approve and regenerate
await approveAndRegenerate(fileId)

// Get file details
const fileDetail = await getFile(fileId)

// List all files
const files = await listFiles()

// Export to Excel
window.open(getExportExcelUrl())
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | Yes | http://localhost:8000 | Backend API URL |

**Note**: Environment variables must be prefixed with `VITE_` to be exposed to the browser.

## Building for Production

```bash
npm run build
```

Output in `dist/` directory.

The build is optimized:
- Minified JavaScript/CSS
- Code splitting
- Tree shaking
- Asset optimization

## Deployment

See `../../infra/render.yaml` for Render deployment configuration.

### Deploy to Render (Static Site)

1. Connect GitHub repository
2. Set build command: `cd apps/web && npm ci && npm run build`
3. Set publish directory: `apps/web/dist`
4. Set environment variable: `VITE_API_BASE_URL` (your API URL)
5. Deploy!

Alternatively, deploy to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

## Development Tips

### Proxy Configuration

Vite is configured to proxy `/api` requests to the backend during development. See `vite.config.ts`.

### TypeScript

Strict mode enabled. All API types defined in `src/api.ts`.

### Tailwind

Use utility classes for styling. Custom components in `src/components/`.

### Routing

React Router v6 with routes defined in `App.tsx`:
- `/` → Upload page
- `/upload` → Upload page
- `/files` → File list
- `/file/:id` → Review page

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features
- No IE11 support

## Performance

- Code splitting by route
- Lazy loading of pages (can be added)
- Optimized bundle size
- Efficient re-renders with React 18

## Security

- No API keys in frontend code
- CORS handled by backend
- XSS protection via React's escaping
- Content Security Policy headers (via Render)

## License

MIT

