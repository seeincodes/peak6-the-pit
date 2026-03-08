# CapMan AI

Gamified scenario training & MTSS agent for PEAK6 Capital Management.

## Quick Start

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Test Accounts

Seed the database with `python -m app.seed` from the backend directory. By default, development test users are created; set `SEED_PROD=true` for demo/admin accounts.

### Development (default)

| Email | Password | Role | Display Name |
|-------|----------|------|--------------|
| trader@capman.dev | trader123 | TA | Test Trader |
| alex@capman.dev | alex123 | TA | Alex Chen |
| maria@capman.dev | maria123 | TA | Maria Santos |
| james@capman.dev | james123 | Intern | James Kim |
| priya@capman.dev | priya123 | TA | Priya Patel |

### Production (`SEED_PROD=true`)

| Email | Password | Role | Display Name |
|-------|----------|------|--------------|
| demo@capman.dev | demo2026 | TA | Demo Trader |
| admin@capman.dev | admin2026 | Admin | Admin User |
