# Productivity Hub: 90-Day Sprint Plan

Date: 2026-04-24
Cadence: 6 sprints, 2 weeks each
Team assumption: 1 full-stack engineer, 1 frontend engineer, 1 product designer, 1 QA shared

## Goals for 90 days
- Increase Weekly Meaningful Execution Rate (WMER)
- Raise deep work minutes per active user
- Improve week-over-week retention with stronger planning rituals

## Sprint 1 (Weeks 1-2): Foundation and Metrics
Deliverables:
- Finalize schema design and migration scripts (not applied without approval)
- Implement analytics service replacing placeholder /api/analytics/productivity
- Add event tracking scaffolding for focus/review/AI flows
- Add feature flags for focus and weekly review

Engineering tasks:
- shared/schema.ts: add new table definitions
- server/storage.ts: add stubs and partial implementations
- server/routes.ts: replace hardcoded analytics route

Exit criteria:
- Real analytics endpoint returns computed metrics on seed data
- No regression in tasks/habits/goals APIs

## Sprint 2 (Weeks 3-4): Focus Protection Engine v1
Deliverables:
- Focus block lifecycle APIs
- Focus session HUD UI integrated into Today page
- Interruption logging and end-of-block recap

Engineering tasks:
- Add focus_blocks and focus_interruptions routes and storage
- Add client components for start/pause/resume/complete
- Persist session across refresh

Exit criteria:
- User can complete at least one full focus block end-to-end
- Focus data visible in analytics cards

## Sprint 3 (Weeks 5-6): Weekly Review OS v1
Deliverables:
- Weekly Review page with Get Clear/Get Current/Get Creative sections
- Weekly priorities (Top 3) creation and tracking
- Weekly reminder settings per user

Engineering tasks:
- Add weekly_reviews and weekly_priorities APIs
- Add route /weekly-review and nav entry
- Show weekly priorities in Today page

Exit criteria:
- User can complete weekly review and set top 3 priorities
- Priorities appear in daily execution UI

## Sprint 4 (Weeks 7-8): AI Coach v1
Deliverables:
- Daily AI brief endpoint and panel
- Task refinement suggestions with one-click apply
- If-Then plan generator and save flow

Engineering tasks:
- Add ai_suggestions and implementation_plans APIs
- Replace local simulated insights with API-backed suggestions
- Add feedback actions (helpful/dismiss)

Exit criteria:
- At least 3 suggestion types shipped and actionable
- Suggestion apply updates data model correctly

## Sprint 5 (Weeks 9-10): Reliability and Trust Upgrades
Deliverables:
- Automatic daily backup snapshot job
- Restore preview screen (read-only dry run)
- Data change audit entries for destructive/bulk actions

Engineering tasks:
- Add backup scheduler and audit log entries
- Extend export payload validation for new tables
- Add restore preview APIs

Exit criteria:
- Backup/restore tested with new schema entities
- No data-loss regressions in high-risk flows

## Sprint 6 (Weeks 11-12): Polish, Optimization, Launch Readiness
Deliverables:
- UX polish and onboarding for new features
- Performance tuning and bug burn-down
- Release dashboard for WMER/focus/review/retention

Engineering tasks:
- Improve loading states and empty states
- Tune API payload sizes and caching
- Final QA regression pass and release checklist

Exit criteria:
- Launch candidate passes regression and reliability tests
- Success metrics dashboard available to team

---

## Priority Backlog (Ranked)
1. Real analytics endpoint (replace placeholder)
2. Focus block lifecycle + interruptions
3. Weekly review flow + top 3 priorities
4. AI daily brief + task refinement
5. If-Then builder and application
6. Automated backup + restore preview

## Staffing and Effort (rough)
- Backend: 10-12 engineer-weeks
- Frontend: 9-11 engineer-weeks
- QA and stabilization: 3-4 engineer-weeks equivalent
- Total: 22-27 engineer-weeks equivalent

## Risks
- Scope creep from secondary features
- AI quality variance
- Migration safety constraints

## Mitigations
- Hold strict v1 scope at three core capabilities
- Keep AI suggestions advisory with explicit apply
- Require backup snapshot before any migration in production

## Definition of Done (Program Level)
- WMER instrumentation running in production
- Focus + Weekly Review + AI Coach available to all users
- Backup and restore preview operational
- User documentation and onboarding complete
