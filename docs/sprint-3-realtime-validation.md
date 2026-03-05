# Sprint 3 - Realtime, Validation, and Reputation

Duration: 1 to 1.5 weeks  
Goal: Synchronize updates live, validate photos, and finalize collaboration mechanics.

## Scope
- [ ] 9. Realtime synchronization
  - [ ] Subscribe to updates/points channels
  - [ ] Merge live updates into map/detail state
  - [ ] Reconnect/backoff and stale-cache handling
  - Estimate: 14h

- [ ] 10. Image validation via AI (Edge Function)
  - [ ] Trigger and ingestion pipeline
  - [ ] Vision-model classification
  - [ ] Approved/suspect/rejected handling
  - [ ] Audit logs
  - Estimate: 18h

- [ ] 11. Reputation system (MVP-lite)
  - [ ] Award rules (`+10`, `+2`)
  - [ ] Atomic score updates
  - [ ] Basic level badge display
  - Estimate: 8h

- [ ] 12. Observability and metrics
  - [ ] Core event tracking
  - [ ] Minimal product metrics dashboard
  - [ ] Error logging for uploads/realtime/edge
  - Estimate: 10h

## Estimated Effort
- Total: 50h
- Team capacity guide:
  - 1 dev full-time: ~1.5 weeks
  - 2 devs: ~4 to 5 days

## Exit Criteria
- Live updates visible across clients
- Photo validation affects status lifecycle correctly
- Reputation and key metrics are active
