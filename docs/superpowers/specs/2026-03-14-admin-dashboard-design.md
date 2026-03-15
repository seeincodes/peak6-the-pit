# Admin Dashboard with Multi-Org Analytics

**Date:** 2026-03-14
**Status:** Design
**Scope:** Admin dashboard for learning progress, activity, and content performance analytics across organizations

---

## Overview

Implement a multi-tenant admin dashboard that allows organization admins to view analytics for their users. All users belong to exactly one organization, and admins can only view data for their organization.

**Key Features:**
- Organization model with org-to-user relationships
- Admin role enforcement via middleware
- Three analytics dashboards: Learning Progress, Activity, Content Performance
- Time-period filtering (date range)
- Frontend dashboard UI with charts and summary cards

---

## Data Model

### Organization Table

```python
class Organization(Base):
    __tablename__ = "organizations"

    id: UUID (PK)
    name: str (max 255)
    created_at: datetime
```

### User Model Changes

**Modifications to existing User table:**
- Add `org_id: UUID (NOT NULL, FK)` — all users must belong to exactly one org
- Add constraint: `FOREIGN KEY (org_id) REFERENCES organizations(id)`

**All user roles now belong to an organization:**
- `ta`, `intern`, `experienced`, `educator`, `admin`
- Admins with `role='admin'` manage the organization identified by their `org_id`

### Seeding Strategy

When seeding the database:
1. Create default organization (e.g., "Peak6")
2. All seeded users (dev and prod) assign to this organization
3. Future: support multi-org setup via config

---

## API Architecture

### Admin Endpoints

All endpoints:
- Prefix: `/api/admin`
- Auth: Require `get_current_user` + admin role guard
- Scoping: Admin can only access their own org's data
- Response: JSON with metrics data

#### 1. Learning Progress
**Endpoint:** `GET /api/admin/org/{org_id}/learning`

**Parameters:**
- `start_date`: ISO datetime (optional, default: 30 days ago)
- `end_date`: ISO datetime (optional, default: now)

**Response:**
```json
{
  "total_scenarios_completed": 145,
  "avg_score": 78.5,
  "level_distribution": {
    "1": 5,
    "2": 12,
    "3": 8,
    "4": 2
  },
  "completion_by_role": {
    "ta": 120,
    "intern": 20,
    "experienced": 5
  },
  "completion_by_cohort": {
    "cohort_a": 80,
    "cohort_b": 65
  }
}
```

#### 2. Activity
**Endpoint:** `GET /api/admin/org/{org_id}/activity`

**Parameters:**
- `start_date`: ISO datetime (optional, default: 30 days ago)
- `end_date`: ISO datetime (optional, default: now)
- `granularity`: "daily" | "weekly" (optional, default: daily)

**Response:**
```json
{
  "completions_over_time": [
    { "date": "2026-03-01", "count": 12 },
    { "date": "2026-03-02", "count": 15 }
  ],
  "active_users": 24,
  "peak_hours": [14, 15, 16],
  "total_completions": 147
}
```

#### 3. Content Performance
**Endpoint:** `GET /api/admin/org/{org_id}/scenarios`

**Parameters:**
- `start_date`: ISO datetime (optional, default: 30 days ago)
- `end_date`: ISO datetime (optional, default: now)
- `difficulty`: filter by difficulty (optional)
- `category`: filter by category (optional)

**Response:**
```json
{
  "scenarios": [
    {
      "scenario_id": "uuid",
      "title": "Oil Options Volatility",
      "category": "volatility",
      "difficulty": "intermediate",
      "completion_rate": 0.82,
      "avg_score": 75.3,
      "total_attempts": 42,
      "user_struggles": [
        {
          "category": "volatility",
          "common_mistakes": "Underestimated delta hedging"
        }
      ]
    }
  ]
}
```

### Authorization Middleware

**New dependency:** `require_admin(user: User) -> User`
- Checks: `user.role == 'admin'`
- Returns: authenticated admin user
- Raises: 403 Forbidden if not admin

**Route pattern:**
```python
@router.get("/api/admin/org/{org_id}/learning")
async def get_learning_analytics(
    org_id: UUID,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    # Verify admin owns this org
    if admin_user.org_id != org_id:
        raise HTTPException(403, "Unauthorized")
    # ... return analytics
```

---

## Frontend Implementation

### Admin Dashboard Component

**Location:** `frontend/src/pages/AdminDashboard.tsx`

**Features:**
1. **Date Range Selector**
   - Quick presets: Last 7 days, Last 30 days, Custom range
   - Updates all three tabs

2. **Three Main Tabs**
   - Learning Progress
   - Activity
   - Content Performance

3. **Learning Progress Tab**
   - Summary cards: Total completed, avg score, top level
   - Charts: Level distribution (bar), completion by role (pie)

4. **Activity Tab**
   - Chart: Completion trend over time (line chart)
   - Cards: Active users, peak hours

5. **Content Performance Tab**
   - Table: All scenarios with completion rate, avg score, attempts
   - Filters: By difficulty, category
   - Sorting: By completion rate, avg score

### UI Library

Use existing patterns from the app (if React Query, TanStack Table, etc. are available). If not, keep simple with basic Recharts or similar for charts.

---

## Implementation Sequence

### Phase 1: Data Model & Auth
1. Create `Organization` model
2. Add migration for `users.org_id`
3. Seed default organization
4. Create `require_admin` middleware

### Phase 2: Analytics Service
5. Create analytics service with queries for:
   - Learning progress
   - Activity metrics
   - Scenario performance

### Phase 3: API Endpoints
6. Implement `/api/admin/org/{org_id}/learning`
7. Implement `/api/admin/org/{org_id}/activity`
8. Implement `/api/admin/org/{org_id}/scenarios`

### Phase 4: Frontend
9. Create AdminDashboard component
10. Build tabs and charts
11. Connect to backend API

---

## Error Handling

**Scenarios:**
- **Admin accessing another org's data:** 403 Forbidden
- **Invalid date range:** 400 Bad Request
- **Org not found:** 404 Not Found
- **DB query timeout:** 500 Server Error (log and retry)

---

## Testing Strategy

**Backend:**
- Unit tests for analytics queries (mocked DB)
- Integration tests for API endpoints (real DB in test env)
- Auth tests: verify admin role enforcement

**Frontend:**
- Component tests for each tab (with mocked API responses)
- Integration test: date picker updates all tabs

---

## Future Considerations

- **Caching:** Analytics queries may be expensive; add Redis caching with TTL
- **Export:** Add CSV/PDF export for reports
- **Real-time:** WebSocket updates for live activity metrics
- **Org management:** UI for creating/managing organizations
- **User management:** Admins can invite/remove users from their org

---

## Summary

This design establishes a clean multi-org architecture with admin analytics. The phased approach allows building and testing incrementally. Key decisions:
- All users required to belong to an org (no nulls)
- Admins scoped to single org via middleware
- Simple time filtering with room for expansion
