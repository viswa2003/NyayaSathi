# NyayaSathi AI Coding Instructions

## Project Overview

**NyayaSathi** is a legal information system for Indian law with RAG (Retrieval-Augmented Generation) capabilities. The app uses semantic search with embeddings to find relevant legal sections, then generates structured legal advice using Google's Gemini AI.

**Stack**: Express.js backend + React/TypeScript frontend (Vite) + MongoDB + HuggingFace embeddings + Google Gemini AI

## Architecture & Data Flow

### RAG Pipeline (`backend/routes/ragLawRoute.js`)

1. **User Query** → Embed via HuggingFace `sentence-transformers/all-mpnet-base-v2` (768-dim)
2. **Retrieval** → Calculate cosine similarity against all `Law.embeddings` in MongoDB
3. **Ranking** → Sort by similarity score, return top 5 (threshold: 0.3)
4. **Generation** → Pass retrieved sections to Gemini 1.5 Pro for structured JSON response
5. **Response Schema**: `{ legalInformation, relevantSections[], nextSteps: { suggestions, disclaimer } }`

### Authentication & Authorization

- **JWT-based auth** with 3 roles: `user`, `guest`, `admin`
- **Guest users**: Temporary JWT (no DB record), limited to 3 requests/30min via in-memory limiter (`guestLimiter.js`)
- **Auth flow**: Login returns `{ token, user }` → stored in localStorage → verified via `/api/auth/me`
- **Middleware chain**: `auth` (JWT verify) → `guestLimiter` (guest quota) → route handler
- **Protected routes** use `<ProtectedRoute requiredRole="admin">` wrapper (see `frontend/src/components/ProtectedRoute.tsx`)
- **Role-based navigation**: Admin users → `/admin/dashboard`, Regular users/guests → `/` (HomePage)

### Database Schema (`backend/models/Law.js`)

```javascript
{
  // Browsing fields
  category: String,          // e.g., "Criminal Law"
  act_name: String,          // e.g., "Bharatiya Nyaya Sanhita"
  law_code: String,          // e.g., "BNS"
  section_number: String,    // e.g., "302"

  // Content fields (all indexed for text search)
  title: String,
  description: String,       // Full legal text
  simplified_description: String,

  // RAG field
  embeddings: [Number],      // 768-dim vector from HuggingFace

  // Optional fields
  punishment: String,
  keywords: [String],
  examples: [String]
}
```

**Indexes**: Text index on `title`, `description`, `simplified_description`, `keywords` for `/api/laws?search=X`

### Law Embeddings Management

- **Script**: `backend/scripts/backfillLawEmbeddings.js` generates embeddings for all laws
- **Text composition**: Concatenates `act_name + section_number + title + description + simplified_description + punishment + keywords`
- **Usage**: `node backfillLawEmbeddings.js` (only missing) or `node backfillLawEmbeddings.js --force` (re-embed all)
- **Rate limit**: 150ms delay between API calls to HuggingFace

## Key Patterns & Conventions

### Frontend State Management

- **AuthContext** (`frontend/src/context/AuthContext.tsx`): Global auth state via React Context
  - Exports `useAuth()` hook providing `{ token, user, login(), logout(), isLoading }`
  - Syncs with localStorage (`nyayasathi_token`, `nyayasathi_user`)
  - Verifies token on mount by calling `/api/auth/me`

### API Response Handling

- **RAG endpoint** (`POST /api/rag-laws/laws`) returns structured JSON matching `AdviceData` type
- **Frontend navigation**: `DescribePage` → calls API → navigates to `AdvicePage` with `state={{ advice }}`
- **AI response parsing**: Strip markdown code fences, validate JSON structure before parsing

### Error Patterns

- **429 (Too Many Requests)**: Guest limit exceeded → return `{ msg, limitReached: true }`
- **404 (Not Found)**: Semantic search score < 0.3 → "No relevant laws found"
- **401 (Unauthorized)**: Invalid/expired token → frontend redirects to `/login`

## Environment Variables (`.env` in `backend/`)

```bash
MONGO_URI=              # MongoDB connection string
JWT_SECRET=             # JWT signing secret
JWT_EXPIRES_IN=5h       # Token expiration
GEMINI_API_KEY=         # Google Generative AI API key
HUGGINGFACE_API_TOKEN=  # HuggingFace inference API token
PORT=5000               # Server port (optional)
```

## Developer Workflows

### Running the App

```bash
# Backend (from backend/)
npm run dev              # Nodemon with hot reload

# Frontend (from frontend/)
npm run dev              # Vite dev server on http://localhost:5173
```

### Creating Admin Users

```bash
# From backend/ directory
node scripts/createAdminUser.js    # Creates admin@nyayasathi.com with password "admin123"
```

- Edit `backend/scripts/createAdminUser.js` to customize admin credentials
- Script checks for existing admin and updates role if needed
- Default credentials: `admin@nyayasathi.com` / `admin123` (change after first login)

### Adding New Laws (Admin Only)

1. **Manual**: `POST /api/laws` with full Law schema (requires `auth` + `admin` middleware)
2. **Generate embeddings**: Run `node scripts/backfillLawEmbeddings.js` to embed new laws
3. **Validation**: Ensure all required fields present (`category`, `act_name`, `law_code`, `section_number`, `title`, `description`, `simplified_description`)

### Testing RAG Quality

1. Check semantic search relevance: Inspect `similarity_score` in API response (included as comment in production)
2. Adjust similarity threshold in `ragLawRoute.js` if too many/few results
3. Test with edge cases: vague queries, non-legal questions, queries in different languages

### Debugging Auth Issues

- **Token not persisting**: Check localStorage keys (`nyayasathi_token`, `nyayasathi_user`)
- **401 on protected routes**: Verify `Authorization: Bearer <token>` header format
- **Guest limits**: Check in-memory `guestUsage` object in `guestLimiter.js` (resets on server restart)
- **Role-based access**: Confirm `user.role` matches `requiredRole` prop in `ProtectedRoute`

## Common Modifications

### Adding a New Protected Route

```typescript
// In App.tsx
<Route
  path="/new-page"
  element={
    <ProtectedRoute>
      {" "}
      {/* or requiredRole="admin" */}
      <NewPage />
    </ProtectedRoute>
  }
/>
```

### Modifying AI Prompt (RAG Generation)

- **Location**: `backend/routes/ragLawRoute.js` → `generationPrompt` variable
- **Tips**: Keep JSON schema explicit, use examples, request "raw JSON only" to avoid markdown wrappers

### Changing Guest Limits

- **File**: `backend/middleware/guestLimiter.js`
- **Constants**: `GUEST_LIMIT` (requests), `GUEST_WINDOW_MS` (time window)
- **Note**: In-memory storage resets on server restart; use Redis for production persistence

## Important Gotchas

- **Embeddings must be pre-generated**: New laws won't appear in RAG results until `backfillLawEmbeddings.js` runs
- **Gemini response parsing**: AI sometimes wraps JSON in markdown code fences; always strip before parsing
- **Guest token format**: Guest JWTs have temporary `_id` (e.g., `temp_123456`) and no DB record
- **Route order matters**: In `backend/index.js`, mount auth routes before protected routes
- **CORS**: Backend uses `cors()` middleware; adjust if deploying to different domains
