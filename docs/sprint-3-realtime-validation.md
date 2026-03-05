# Sprint 3 - Realtime, Validation, and Reputation

Duration: 1 to 1.5 weeks  
Goal: Synchronize updates live, validate photos, and finalize collaboration mechanics.

## Invocation Log (Mandatory)
- `Invoke project-planner` (planning start, scope lock, sequencing)
- `Invoke backend-architect` (WS1 realtime contracts and resilience approach)
- `Invoke mobile-developer` (WS1 realtime client merge and stale-cache handling)
- `Invoke backend-architect` (WS2 validation pipeline contracts and audit schema)
- `Invoke security-auditor` (WS2 moderation lifecycle and auditability checks)
- `Invoke backend-architect` (WS3 reputation atomicity and scoreboard contracts)
- `Invoke mobile-developer` (WS3 reputation badge display)
- `Invoke backend-architect` (WS4 metrics/events schema and dashboard view)
- `Invoke test-engineer` (WS1-WS4 verification pass)

## Orchestrator Mode
This sprint follows the orchestrator workflow from `C:/Users/lucsb/.codex/ARCHITECTURE.md` with explicit agent invocation for each workstream.

## Scope (In)
- Realtime synchronization on map/detail flows with reconnect/backoff and stale-cache controls
- AI photo validation pipeline via Edge Function with approved/suspect/rejected outcomes
- Reputation points automation (`+2` update submitted, `+10` refill confirmed)
- Core observability events and minimal product metrics dashboard

## Scope (Out)
- Advanced moderation tooling UI
- Push notifications and background tasks
- Full gamification beyond MVP-lite levels

## Workstreams and Tasks

### WS1 - Realtime Synchronization (14h)
Invoke `backend-architect`  
Invoke `mobile-developer`

Scope:
- Keep map/detail state synchronized with database updates without manual refresh.

Steps:
- [x] Subscribe to `feeding_points`, `feeding_updates`, and `feeding_photos`
- [x] Merge incoming events through query invalidation for map/detail caches
- [x] Add reconnect/backoff behavior after channel failures
- [x] Add stale realtime detection and recovery polling behavior

Acceptance criteria:
- Updates from one client appear on another client automatically
- Realtime disconnections self-recover with bounded retry delay
- Stale-cache state is detected and refreshed

### WS2 - Image Validation via AI (Edge Function) (18h)
Invoke `backend-architect`  
Invoke `security-auditor`

Scope:
- Validate uploaded photos and apply lifecycle decisions with auditability.

Steps:
- [x] Implement ingestion call from app after photo insert
- [x] Implement validation classification (`approved`, `suspect`, `rejected`) in Edge Function
- [x] Apply lifecycle updates to `feeding_photos` and `feeding_points` when approved
- [x] Persist audit records in `photo_validation_audit_logs`

Acceptance criteria:
- Validation status changes are persisted and visible in point detail photo metadata
- Approved validation updates the point lifecycle state consistently
- All moderation decisions are auditable

### WS3 - Reputation System (MVP-lite) (8h)
Invoke `backend-architect`  
Invoke `mobile-developer`

Scope:
- Award and display contribution reputation with atomic data integrity.

Steps:
- [x] Implement `reputation_ledger` + atomic award function
- [x] Award `+2` on every submitted update
- [x] Award `+10` on approved refill confirmation
- [x] Show level badge (`iniciante`, `protetor`, `guardiao`, `heroi`) in detail sheet

Acceptance criteria:
- Reputation increments exactly once per qualifying event
- Score updates remain atomic and idempotent
- Badge state reflects current score in app

### WS4 - Observability and Metrics (10h)
Invoke `backend-architect`  
Invoke `test-engineer`

Scope:
- Track core product and reliability events with a minimal dashboard view.

Steps:
- [x] Add `product_events` table and `track_event` RPC
- [x] Track `update_submitted`, validation outcomes, and client/edge errors
- [x] Add `product_metrics_dashboard` view for daily rollups
- [x] Wire app-side error and action instrumentation

Acceptance criteria:
- Core event telemetry is persisted for weekly review
- Validation and realtime failures are logged
- Dashboard query is available directly in SQL (`public.product_metrics_dashboard`)

## Dependencies
1. WS1 depends on Sprint 2 map/detail data flow stability.
2. WS2 depends on storage upload flow from Sprint 2.
3. WS3 depends on WS2 validation lifecycle for refill confirmation awards.
4. WS4 spans WS1-WS3 and is finalized at quality gate.

## Estimated Effort
- Total: 50h
- Team capacity guide:
  - 1 dev full-time: ~1.5 weeks
  - 2 devs: ~4 to 5 days

## Validation Evidence
- `npm --prefix mobile-app run lint` passed
- `npx tsc --noEmit` in `mobile-app` passed

## Exit Criteria
- Live updates visible across clients
- Photo validation affects status lifecycle correctly
- Reputation and key metrics are active
