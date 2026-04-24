# Productivity Hub: Implementation Blueprint

Date: 2026-04-24
Applies to codebase rooted at client/public/productivity-hub

Note: This document proposes schema and API changes only. No migration is executed here.

## 1. Current Baseline (confirmed)
- Client routes and shell in client/src/App.tsx.
- Core data model in shared/schema.ts.
- API routes in server/routes.ts.
- Storage abstraction in server/storage.ts.

## 2. Proposed Data Model Changes

## 2.1 New Tables

1) focus_blocks
- id (serial PK)
- user_id (int FK users.id)
- planned_duration_min (int not null)
- actual_duration_min (int)
- status (text: active, completed, canceled)
- started_at (timestamp not null)
- ended_at (timestamp)
- quality_rating (int nullable, 1-5)
- created_at (timestamp default now)

2) focus_interruptions
- id (serial PK)
- focus_block_id (int FK focus_blocks.id)
- user_id (int FK users.id)
- interruption_type (text: internal, external, meeting, message, other)
- note (text nullable)
- occurred_at (timestamp not null)

3) weekly_reviews
- id (serial PK)
- user_id (int FK users.id)
- week_key (text not null, YYYY-MM-DD monday)
- status (text: started, completed)
- get_clear_notes (text)
- get_current_notes (text)
- get_creative_notes (text)
- created_at (timestamp default now)
- completed_at (timestamp)

4) weekly_priorities
- id (serial PK)
- user_id (int FK users.id)
- weekly_review_id (int FK weekly_reviews.id)
- title (text not null)
- linked_task_id (int FK tasks.id nullable)
- priority_rank (int not null, 1..3)
- status (text: planned, in_progress, completed)
- target_day_of_week (text nullable)
- created_at (timestamp default now)

5) ai_suggestions
- id (serial PK)
- user_id (int FK users.id)
- source (text: daily_brief, task_refine, review_assist)
- suggestion_type (text: next_action, if_then, schedule, risk)
- payload (jsonb not null)
- confidence (int not null, 0..100)
- status (text: pending, applied, dismissed)
- created_at (timestamp default now)
- acted_at (timestamp)

6) implementation_plans
- id (serial PK)
- user_id (int FK users.id)
- task_id (int FK tasks.id nullable)
- plan_type (text: when_where, if_then)
- trigger_text (text not null)
- response_text (text not null)
- active (boolean default true)
- created_at (timestamp default now)

## 2.2 Existing Table Extensions

tasks table additions:
- energy_level (text: low, medium, high)
- context_label (text nullable)
- specificity_score (int nullable, 0..100)
- next_action_text (text nullable)

users table additions:
- weekly_review_day (text nullable)
- weekly_review_time (text nullable)
- focus_goal_minutes_per_day (int default 90)
- ai_coach_enabled (boolean default true)

## 3. API Changes

All routes require authenticateToken unless marked public.

## 3.1 Focus Engine APIs
- POST /api/focus-blocks/start
  body: plannedDurationMin
  returns: focus block

- PUT /api/focus-blocks/:id/pause
- PUT /api/focus-blocks/:id/resume
- PUT /api/focus-blocks/:id/complete
  body: qualityRating

- POST /api/focus-blocks/:id/interruptions
  body: interruptionType, note

- GET /api/focus-blocks?from=YYYY-MM-DD&to=YYYY-MM-DD

## 3.2 Weekly Review APIs
- POST /api/weekly-reviews/start
  body: weekKey

- PUT /api/weekly-reviews/:id/section
  body: sectionName, notes

- PUT /api/weekly-reviews/:id/complete

- GET /api/weekly-reviews/current
- GET /api/weekly-priorities/current
- POST /api/weekly-priorities
- PUT /api/weekly-priorities/:id
- DELETE /api/weekly-priorities/:id

## 3.3 AI Coach APIs
- POST /api/ai/coach/daily-brief
  returns: suggestions[]

- POST /api/ai/tasks/:taskId/refine
  returns: refined task proposal + next action

- POST /api/ai/if-then
  body: blockerText, desiredAction, context
  returns: implementation plan proposal

- POST /api/ai/suggestions/:id/apply
- POST /api/ai/suggestions/:id/dismiss

## 3.4 Analytics Enhancements
Replace placeholder analytics route with computed values:
- GET /api/analytics/productivity
  returns:
  - WMER
  - deepWorkMinutesByDay
  - interruptionRate
  - weeklyReviewCompletionRate
  - taskSpecificityScoreAvg

## 4. Server Implementation Map

## 4.1 Files to update
- shared/schema.ts
  - add new pgTable definitions, insert schemas, inferred types

- server/storage.ts
  - extend IStorage interface with focus/weekly review/ai suggestion methods
  - implement methods in DatabaseStorage

- server/routes.ts
  - add route groups for focus, weekly review, AI coach
  - replace placeholder /api/notifications and /api/analytics/productivity logic

- server/db.ts
  - ensure schema exports included for migration generation

## 4.2 New files recommended
- server/services/focusService.ts
- server/services/weeklyReviewService.ts
- server/services/aiCoachService.ts
- server/services/analyticsService.ts

## 5. Client Implementation Map

## 5.1 Existing files to extend
- client/src/components/today-view.tsx
  - add focus block quick start and weekly priority card
  - show AI brief cards and one-click apply

- client/src/components/pomodoro-timer.tsx
  - optional shared timer controls for focus block lifecycle

- client/src/components/task-modal.tsx
  - include specificity assistant and context/energy fields

- client/src/pages/analytics.tsx
  - replace static summary with server-computed metrics

- client/src/components/ai-insights.tsx
  - replace local simulated insights with API-backed suggestions

## 5.2 New UI files recommended
- client/src/pages/weekly-review.tsx
- client/src/components/focus-session-hud.tsx
- client/src/components/weekly-priorities.tsx
- client/src/components/ai-coach-panel.tsx
- client/src/components/if-then-builder.tsx

## 5.3 Routing updates
- add /weekly-review route in client/src/App.tsx
- add quick navigation entry in header and mobile bottom nav

## 6. Event Tracking Plan
Use existing telemetry strategy (or add lightweight event logger endpoint):
- focus_block_started
- focus_block_completed
- weekly_review_started
- weekly_review_completed
- ai_suggestion_applied
- if_then_created

## 7. Testing Plan

## 7.1 Backend tests
- route validation tests for all new endpoints
- storage tests for focus and weekly review lifecycle
- analytics computation tests on seeded datasets

## 7.2 Frontend tests
- Today flow integration tests for start focus and apply suggestion
- Weekly review completion flow test
- Task refinement and if-then creation test

## 7.3 Reliability tests
- backup/export unaffected by new schema
- restore compatibility test with new tables

## 8. Rollout Strategy
- Phase 1: feature flags for focus and weekly review
- Phase 2: enable AI coach for opt-in users
- Phase 3: default-on with migration-safe rollout and monitoring

## 9. Risks and Mitigations
- Risk: feature overload
  - Mitigation: progressive disclosure and guided onboarding
- Risk: AI suggestion quality
  - Mitigation: confidence threshold, user feedback loop, easy dismiss
- Risk: data reliability concerns
  - Mitigation: pre-change backup snapshots and explicit restore path
