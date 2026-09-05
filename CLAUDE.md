# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

Neuro-detect is a full-stack medical AI web application for brain fMRI analysis. It classifies neurological disorders (CONTROL, SCHIZOPHRENIA, BIPOLAR, ADHD) from fMRI/DICOM images using a trained TensorFlow CNN model.

## Running the Full Stack

```bash
# Start all services (requires .env with DB_PASSWORD and JWT_SECRET)
docker-compose up

# Rebuild after code changes
docker-compose up --build
```

Services after startup:
- Frontend: http://localhost:3001
- Backend API: http://localhost:8080
- AI Service: http://localhost:8000

## Service-Specific Development

### Frontend (React + TypeScript + Vite)
```bash
cd frontend
npm install
npm run dev        # Dev server on port 5173
npm run build      # Type-check + bundle
npm run lint       # ESLint
```

### Backend (Spring Boot, Java 17)
```bash
cd backend
./mvnw spring-boot:run           # Run locally (needs local PostgreSQL)
./mvnw clean package             # Build JAR
./mvnw test                      # Run all tests
./mvnw test -Dtest=ClassName     # Run a single test class
```

### AI Service (Python FastAPI)
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000   # Dev server
pytest                                   # Run tests
```

## Architecture

Three microservices communicate over Docker network `app-net`:

```
Frontend (React/Vite) → Backend (Spring Boot) → AI Service (FastAPI)
                              ↓
                         PostgreSQL
```

**Frontend** (`frontend/`) — React 19, TypeScript, Tailwind CSS, React Query, React Hook Form + Zod, React Router. Axios instance at `src/api/axiosInstance.ts` automatically attaches JWT from localStorage and redirects to login on 401.

**Backend** (`backend/`) — Spring Boot 4, Java 17, Spring Security + JWT, Spring Data JPA, Flyway migrations, iTextPDF for report generation. Database schema is in `src/main/resources/db/migration/V1__init_schema.sql`. The backend calls the AI service at `http://ai-service:8000/api/v1/predict`.

**AI Service** (`ai-service/`) — FastAPI with a single prediction endpoint `POST /api/v1/predict` (accepts image or DICOM). The `BrainFMRIPredictor` in `app/models/predictor.py` loads TensorFlow + scikit-learn models from `app/model/`. If models fail to load it falls back to mock mode (returns structured fake predictions), enabling frontend/backend development without trained models.

## Database Schema

Four tables managed by Flyway:
- `users` — medical staff accounts (role: `MEDECIN`)
- `patients` — patient records
- `analyses` — MRI analysis results with `all_scores JSONB` column
- `reports` — generated PDF reports

## Environment Variables

`.env` at project root is used by docker-compose:
- `DB_PASSWORD` — PostgreSQL password
- `JWT_SECRET` — signing key for JWT tokens

Frontend reads `VITE_API_URL` from `frontend/.env`.

## Key Conventions

- JWT is stored in browser localStorage; backend validates it via Spring Security filter chain.
- AI Service mock mode: when `app/model/` files are missing or corrupt, the predictor silently falls back — see `docs/ai-service.md` for details.
- Flyway handles all schema migrations; never modify the database schema directly.
