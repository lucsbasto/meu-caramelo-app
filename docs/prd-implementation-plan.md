# PRD Implementation Plan - Meu Caramelo

Source: `PRD.md`

## Goal
Build and launch the MVP of a collaborative mobile platform to map and maintain feeding points for street animals.

## Assumptions
- Mobile app stack: React Native (Expo Router + TypeScript).
- Backend stack: Supabase (PostgreSQL + PostGIS + Realtime + Storage + Edge Functions).
- MVP scope follows section `13. Roadmap > MVP` in `PRD.md`.

## Milestones
- M1: Foundation (App + Backend + Schema)
- M2: Core User Flows (Map + Point Details + Volunteer Actions)
- M3: Realtime + Validation + Hardening
- M4: MVP Release

## Task Breakdown

- [ ] 1. Scope and product alignment
  - [ ] 1.1 Confirm MVP boundaries (in/out scope) from PRD.
  - [ ] 1.2 Define acceptance criteria per MVP feature.
  - [ ] 1.3 Define non-functional targets (performance, reliability, security baseline).
  - [ ] 1.4 Create release checklist for MVP.
  - Verify: signed-off feature checklist and MVP acceptance document.

- [ ] 2. Mobile app foundation (React Native)
  - [ ] 2.1 Initialize Expo app with TypeScript.
  - [ ] 2.2 Set up navigation structure (map as primary route, detail flow).
  - [ ] 2.3 Add state/query layers (Zustand + React Query or equivalent).
  - [ ] 2.4 Configure env management and Supabase client.
  - [ ] 2.5 Define base UI primitives and status color tokens.
  - Verify: app builds and runs on Android/Web; base routing and env wiring work.

- [ ] 3. Supabase project setup
  - [ ] 3.1 Create Supabase project and environments (dev/prod strategy).
  - [ ] 3.2 Enable auth providers and session handling.
  - [ ] 3.3 Create storage bucket `feeding-point-photos`.
  - [ ] 3.4 Enable Realtime for required tables/events.
  - [ ] 3.5 Prepare Edge Functions scaffold.
  - Verify: test user can authenticate; storage upload and realtime subscription work.

- [ ] 4. Database and geospatial modeling
  - [ ] 4.1 Create `users` table (profile + reputation points).
  - [ ] 4.2 Create `feeding_points` table with geospatial support (PostGIS).
  - [ ] 4.3 Create `feeding_updates` and `feeding_photos` tables.
  - [ ] 4.4 Add indexes for geospatial and time-based queries.
  - [ ] 4.5 Add status enums/constraints (`full`, `empty`, `unknown`, and stale rule derived in app/query).
  - [ ] 4.6 Add migrations and rollback strategy.
  - Verify: migrations run cleanly; bbox and recent-update queries are fast on sample data.

- [ ] 5. Security and access policies
  - [ ] 5.1 Enable RLS on all user-generated tables.
  - [ ] 5.2 Write policies for read/public map access.
  - [ ] 5.3 Write policies for authenticated write/update flows.
  - [ ] 5.4 Add anti-spam/rate-limit strategy for updates.
  - [ ] 5.5 Define admin moderation permissions.
  - Verify: unauthorized writes fail; valid user flows succeed.

- [ ] 6. Map screen (core MVP)
  - [ ] 6.1 Implement geolocation and permission handling.
  - [ ] 6.2 Render feeding points with status-based marker colors.
  - [ ] 6.3 Implement marker clustering for dense areas.
  - [ ] 6.4 Implement viewport/bounding-box fetching.
  - [ ] 6.5 Implement proximity filter and distance display.
  - [ ] 6.6 Implement stale point visual state.
  - Verify: map stays responsive and shows correct status/distance/last update.

- [ ] 7. Point details and history
  - [ ] 7.1 Implement marker tap -> bottom sheet.
  - [ ] 7.2 Show latest photo, status, last update.
  - [ ] 7.3 Show historical updates timeline.
  - [ ] 7.4 Show number of distinct volunteers.
  - [ ] 7.5 Implement photo carousel with metadata (date, user, status).
  - Verify: details reflect backend data correctly for multiple points.

- [ ] 8. Volunteer actions
  - [ ] 8.1 Implement `Abasteci aqui` flow with camera capture.
  - [ ] 8.2 Upload captured image to storage.
  - [ ] 8.3 Create update record and optimistic UI update.
  - [ ] 8.4 Implement `Recipiente vazio` flow (photo optional).
  - [ ] 8.5 Implement `Como chegar` deep links (Google/Apple Maps).
  - Verify: both status actions persist and navigation deep links open properly.

- [ ] 9. Realtime synchronization
  - [ ] 9.1 Subscribe to point and update changes.
  - [ ] 9.2 Merge incoming events into map/detail state.
  - [ ] 9.3 Resolve race conditions and stale cache.
  - [ ] 9.4 Add reconnection/backoff behavior.
  - Verify: updates from user A are reflected on user B without manual refresh.

- [ ] 10. Image validation via AI (Edge Function)
  - [ ] 10.1 Implement photo ingestion trigger.
  - [ ] 10.2 Send photo to vision model provider.
  - [ ] 10.3 Classify result (approved/suspect/rejected).
  - [ ] 10.4 Update point status based on approved results.
  - [ ] 10.5 Log moderation decisions for auditability.
  - Verify: approved images update status; suspect/rejected are flagged for review.

- [ ] 11. Reputation system (MVP-lite)
  - [ ] 11.1 Add points awarding rules (`+10` confirmed refill, `+2` status update).
  - [ ] 11.2 Update user reputation atomically.
  - [ ] 11.3 Display volunteer level badge.
  - Verify: reputation increments correctly and is visible in app.

- [ ] 12. Observability and metrics
  - [ ] 12.1 Track events: point created, update submitted, refill confirmed.
  - [ ] 12.2 Build minimal dashboard for PRD success metrics.
  - [ ] 12.3 Add error logging for upload/realtime/edge function failures.
  - Verify: core product metrics available for weekly review.

- [ ] 13. QA and release preparation
  - [ ] 13.1 End-to-end test of primary journeys (observer + volunteer).
  - [ ] 13.2 Performance pass on map interactions and marker density.
  - [ ] 13.3 Security pass (RLS, abuse paths, file upload validation).
  - [ ] 13.4 Bug triage and release candidate stabilization.
  - [ ] 13.5 Prepare store/internal distribution build.
  - Verify: release checklist passes with no blocker defects.

## Dependencies (Critical Path)
1. Tasks 1-5 must be completed before full feature implementation.
2. Tasks 6-8 depend on tasks 2-5.
3. Task 9 depends on tasks 6-8.
4. Task 10 depends on tasks 3-5 and 8.
5. Tasks 12-13 run in parallel after core flows are stable.

## Out of Scope for MVP (Next Phases)
- Proximity notifications
- Full gamification (badges/ranking/achievements)
- Community reporting workflow
- Sponsored pins and coupons (monetization phase)

## Done Definition
- All MVP roadmap features from `PRD.md` are implemented and validated.
- Realtime updates and photo validation are active in production environment.
- Core success metrics are tracked and reviewable.
- Security baseline (auth, RLS, upload controls, rate limiting) is enforced.
