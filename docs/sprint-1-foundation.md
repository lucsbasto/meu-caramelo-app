# Sprint 1 - Foundation and Data Layer

Duration: 2 weeks
Goal: Build the technical foundation for MVP delivery with secure data model, mobile baseline, and reproducible backend setup.

## Orchestrator Mode
This sprint was coordinated with the `orchestrator` pattern from `C:/Users/lucsb/.codex/ARCHITECTURE.md`, synthesizing these agent perspectives:
- `project-planner`: sprint structure, scope boundaries, sequencing
- `mobile-developer`: Expo Router foundation, navigation, env wiring
- `database-architect`: Supabase + PostGIS schema and indexing
- `security-auditor`: RLS, policy model, anti-abuse baseline
- `test-engineer`: acceptance criteria and validation checks
- `documentation-writer`: sprint artifact quality and readiness

## Scope (In)
- Product and MVP alignment for Sprint 1
- Expo + TypeScript app foundation for mobile app
- Supabase environment setup (auth, storage, realtime, edge scaffold)
- Postgres/PostGIS schema + migrations for core entities
- Security baseline with RLS and initial anti-spam strategy

## Scope (Out)
- Full map UX and clustering behavior (Sprint 2)
- Volunteer action flows and camera submission (Sprint 2)
- AI photo validation pipeline completion (Sprint 3)
- Release and distribution tasks (Sprint 4)

## Workstreams and Tasks

### WS1 - Scope and Product Alignment (8h)
- [x] 1.1 Confirm MVP in/out boundaries from PRD
- [x] 1.2 Define acceptance criteria for Sprint 1 deliverables
- [x] 1.3 Define NFR targets (performance, reliability, security)
- [x] 1.4 Publish MVP release checklist draft
- Acceptance:
- Signed checklist with explicit in/out scope
- NFR baseline documented and approved

### WS2 - Mobile App Foundation (16h)
- [x] 2.1 Keep Expo Router + TypeScript baseline in place
- [x] 2.2 Define app navigation skeleton for MVP routes
- [x] 2.3 Add state/query foundation (preferred: Zustand + React Query)
- [x] 2.4 Configure Supabase client + env management
- [x] 2.5 Create base UI tokens for status colors and spacing
- Acceptance:
- App starts on Android/Web without runtime errors
- Navigation skeleton is reachable
- Supabase client initializes from env safely

### WS3 - Supabase Platform Setup (10h)
- [x] 3.1 Define environments strategy (dev/prod + secrets flow)
- [x] 3.2 Configure authentication baseline
- [x] 3.3 Create storage bucket `feeding-point-photos`
- [x] 3.4 Enable realtime on required tables/events
- [x] 3.5 Scaffold edge functions structure
- Acceptance:
- Test user can authenticate
- Bucket upload works for allowed actor
- Realtime subscription receives change events

### WS4 - Database and Geospatial Modeling (12h)
- [x] 4.1 Create `users` table (profile + reputation)
- [x] 4.2 Create `feeding_points` with PostGIS geometry/geography
- [x] 4.3 Create `feeding_updates` and `feeding_photos`
- [x] 4.4 Add geospatial and temporal indexes
- [x] 4.5 Add constraints/enums for statuses (`full`, `empty`, `unknown`)
- [x] 4.6 Add reproducible migrations and rollback notes
- Acceptance:
- Migrations run clean on empty DB
- Spatial query on viewport returns expected points
- Status constraints reject invalid values

### WS5 - Security and Access Policies (12h)
- [x] 5.1 Enable RLS in all user-generated tables
- [x] 5.2 Public read policy for map visibility
- [x] 5.3 Authenticated write policies for user actions
- [x] 5.4 Admin moderation policy baseline
- [x] 5.5 Initial anti-spam/rate-limit strategy
- Acceptance:
- Unauthorized writes fail by policy
- Authorized writes succeed per role
- Policy test matrix includes positive and negative cases

## Dependencies
1. WS1 must complete before final scope lock.
2. WS2 and WS3 can run in parallel after WS1 starts.
3. WS4 depends on WS3 base provisioning.
4. WS5 depends on WS4 schema completion.

## Estimates and Capacity
- Total estimated effort: 58h
- Capacity guide:
- 1 full-time dev: 1.5-2 weeks
- 2 devs: around 1 week

## Risks and Mitigations
- Risk: Schema churn due to unclear status rules
- Mitigation: Lock status model in WS1 and validate in WS4 constraints
- Risk: RLS over-restricts valid flows
- Mitigation: policy test matrix with positive/negative scenarios in WS5
- Risk: env/config drift between local and cloud
- Mitigation: standard env contract and startup validation in WS2/WS3

## Exit Criteria
- App foundation runs with Supabase connection initialized
- Core migrations are reproducible and documented
- RLS/policies validated with positive/negative test evidence
- Sprint 1 artifacts unblock Sprint 2 core flows
