# ReleaseCheck

Small full-stack release checklist app (single-page frontend + backend REST API + PostgreSQL).  
It supports list/create/edit steps/additional info/status; delete release; responsive UI.

## Requirements
- Node >= 18
- PostgreSQL (or Docker)

## Setup
1. Clone repo
2. `cd release-checklist`
3. Create `.env` (optional):
   - `DATABASE_URL=postgres://postgres:postgres@localhost:5432/releasecheck`
   - `DATABASE_SSL=false`
   - `PORT=4000`
4. `npm install`
5. `npm start`
6. Open `http://localhost:4000`

### Docker-local
1. `docker compose up --build`
2. Visit `http://localhost:4000`

## DB Schema
Table `releases`:
- `id` serial primary key
- `name` text not null
- `due_date` timestamp not null
- `additional_info` text
- `steps` jsonb not null (array of booleans, 7 entries)
- `created_at` timestamptz
- `updated_at` timestamptz

## API Endpoints
- GET `/api/releases` - list releases
- POST `/api/releases` - create release
  - body: `{ name, due_date, additional_info, steps? }`
- PUT `/api/releases/:id` - update release
  - body: `{ name?, due_date?, additional_info?, steps? }`
- DELETE `/api/releases/:id` - delete release

## Release status logic
- all steps false -> `planned`
- some true -> `ongoing`
- all true -> `done`

## Frontend
Under `public/`:
- `index.html`
- `styles.css`
- `app.js`

Mockup steps are implemented as:
- All relevant GitHub pull requests have been merged
- CHANGELOG.md updated
- All tests are passing
- Release artifacts built
- Deployed in staging
- Smoke tests completed
- Deployed in production

## Deploy notes
Deploy the backend and static UI to platforms like Render/Heroku/Vercel.  
Provide `DATABASE_URL` as a managed Postgres connection.

---

### Run local tests (optional)
No tests included in this version, but the API is accessible at `/api`.

