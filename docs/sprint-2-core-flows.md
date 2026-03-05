# Sprint 2 - Core MVP User Flows

Duration: 2 weeks
Goal: Deliver end-to-end core user flows for map exploration, point details, and volunteer contribution actions.

## Invocation Log (Mandatory)
- `Invoke project-planner` (planning start, scope lock, sequencing)
- `Invoke mobile-developer` (WS1 map core flow implementation)
- `Invoke backend-architect` (WS1/WS2 data contracts via SQL RPCs)
- `Invoke mobile-developer` (WS2 point details and history UI)
- `Invoke mobile-developer` (WS3 volunteer action implementation)
- `Invoke security-auditor` (WS3 write-flow guardrails and error-state review)
- `Invoke test-engineer` (WS4 quality gate and verification pass)

## Orchestrator Mode
This sprint is coordinated with the `orchestrator` pattern from `C:/Users/lucsb/.codex/ARCHITECTURE.md`, with explicit agent invocation per workstream.

## Scope (In)
- Map screen implementation for MVP (geolocation, markers, viewport fetch, clustering)
- Point detail experience with history and latest evidence
- Volunteer actions (`Abasteci aqui`, `Recipiente vazio`, `Como chegar`)
- Optimistic UI + error handling for contribution flows

## Scope (Out)
- Realtime cross-device sync hardening (Sprint 3)
- AI image validation pipeline completion (Sprint 3)
- Reputation automation and advanced gamification (Sprint 3+)
- Release hardening and distribution activities (Sprint 4)

## Workstreams and Tasks

### WS1 - Map Screen (Core MVP) (22h)
Invoke `mobile-developer`

Scope:
- Implement map interaction and data loading behavior for the primary discovery experience.

Steps:
- [x] 6.1 Implement geolocation and permission handling
- [x] 6.2 Render feeding points with status-based marker colors
- [x] 6.3 Implement marker clustering for dense areas
- [x] 6.4 Implement viewport/bounding-box fetching
- [x] 6.5 Implement proximity filter and distance display
- [x] 6.6 Implement stale point visual state

Acceptance criteria:
- Map loads and remains responsive under expected marker density
- Marker color/status matches backend state (`full`, `empty`, `unknown`, stale)
- BBox fetching reduces overfetch while preserving visible-point correctness

### WS2 - Point Details and History (16h)
Invoke `backend-architect`
Invoke `mobile-developer`

Scope:
- Build point inspection flow with latest evidence and historical traceability.

Steps:
- [x] 7.1 Implement marker tap -> bottom sheet
- [x] 7.2 Show latest photo, status, and last update
- [x] 7.3 Show historical updates timeline
- [x] 7.4 Show number of distinct volunteers
- [x] 7.5 Implement photo carousel with metadata (date, user, status)

Acceptance criteria:
- Details reflect backend data consistently for multiple points
- Timeline ordering is correct and stable
- Empty/partial states are graceful when photos/history are missing

### WS3 - Volunteer Actions (18h)
Invoke `mobile-developer`
Invoke `security-auditor`

Scope:
- Enable contribution actions with safe upload flow and resilient UX.

Steps:
- [x] 8.1 Implement `Abasteci aqui` flow with camera capture
- [x] 8.2 Upload captured image to storage
- [x] 8.3 Create update record and optimistic UI update
- [x] 8.4 Implement `Recipiente vazio` flow (photo optional)
- [x] 8.5 Implement `Como chegar` deep links (Google/Apple Maps)

Acceptance criteria:
- Both status actions persist correctly and update UI feedback
- Upload failures and network issues show actionable retry/error states
- Deep links open native map apps with destination coordinates

### WS4 - Validation and Quality Gate (6h)
Invoke `test-engineer`

Scope:
- Validate primary MVP journey quality before handoff to Sprint 3.

Steps:
- [x] Validate `map -> detail -> action` flow in Android and Web
- [x] Validate permission denial and offline/error paths
- [x] Validate non-regression checklist for Sprint 1 foundations

Acceptance criteria:
- Primary user flow works without blocker defects
- Error states are explicit and recoverable
- Quality checklist is attached to sprint closeout

Validation evidence:
- `npm run lint` (mobile-app) passed
- `npx tsc --noEmit` (mobile-app) passed
- Runtime manual validation on Android/Web remains required in next verification pass

## Dependencies
1. WS1 depends on Sprint 1 foundations (schema, policies, env, Supabase connectivity).
2. WS2 depends on WS1 marker selection and point query contracts.
3. WS3 depends on WS1/WS2 for selected-point context and write permissions.
4. WS4 depends on WS1-WS3 completion.

## Estimates and Capacity
- Total estimated effort: 62h
- Capacity guide:
- 1 full-time dev: about 2 weeks
- 2 devs: about 1 week

## Risks and Mitigations
- Risk: Map performance degradation in dense regions
- Mitigation: clustering + viewport query limits + render profiling in WS1
- Risk: Location permission denial breaks core discovery UX
- Mitigation: fallback states with manual map navigation and clear permission CTA
- Risk: Contribution flow fails under intermittent connectivity
- Mitigation: optimistic UI + retryable upload/update operations with user-safe rollback
- Risk: Detail/history inconsistencies due to query shape drift
- Mitigation: single typed data contract shared across map-detail-action flows

## Exit Criteria
- User can discover nearby points, inspect details/history, and submit volunteer updates
- Primary flows (`map -> detail -> action`) run without blocker defects on target platforms
- Error handling is explicit for permission, upload, and network failure paths
- Sprint 2 artifacts unblock Sprint 3 realtime and validation work
