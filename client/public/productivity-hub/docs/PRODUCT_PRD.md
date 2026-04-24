# Productivity Hub: Product PRD (v1)

Date: 2026-04-24
Owner: Product + Engineering
Status: Ready for implementation planning

## 1. Product Vision
Build the most effective daily execution system for knowledge workers and small teams by reducing attention fragmentation, improving planning clarity, and increasing completion consistency.

## 2. Target Users
- Solo professionals managing high context-switch workloads.
- Startup and small team operators who need execution speed without meeting overload.
- Habit-focused users who want behavior change, not only task logging.

## 3. Core User Problems
- Work is fragmented and reactive; users lose focus due to interruptions.
- Weekly planning quality is poor and inconsistent.
- Task lists are vague and not action-ready.
- Productivity tools provide analytics but weak execution guidance.
- Users fear data loss and need stronger trust mechanisms.

## 4. Product Principles
- Action over dashboarding.
- Clarity over feature count.
- Automation for low-value decisions.
- Safety and data trust by default.
- Measure outcomes, not activity.

## 5. North Star and Success Metrics
North Star: Weekly Meaningful Execution Rate (WMER)

WMER formula:
WMER = users with >=3 planned weekly priorities and >=70% completion of high-priority tasks / active weekly users

Secondary metrics:
- Daily Focus Minutes (deep work minutes)
- Interruption Rate (interruptions per focus hour)
- Weekly Review Completion Rate
- Task Specificity Score (tasks with clear verb + context + expected outcome)
- 4-week retention

## 6. Scope for v1 (first 90 days)
Ship three core capabilities:
1. Focus Protection Engine
2. Weekly Review OS
3. AI Execution Coach with If-Then planning

---

## 7. Feature PRD: Focus Protection Engine

### Problem
Users cannot protect deep work time. Notifications and ad-hoc requests break execution.

### Goals
- Help users complete 1-3 protected focus blocks per workday.
- Reduce interruption frequency in focus windows.
- Convert interrupted tasks into structured re-entry queues.

### Non-goals
- Full OS-level notification control in v1.
- Enterprise policy enforcement.

### User Stories
- As a user, I can start a 25/50/90-minute focus block with one click.
- As a user, I can select what gets muted during focus.
- As a user, I can see interrupted tasks and resume them quickly.
- As a user, I can review deep work stats by day/week.

### Functional Requirements
- Focus Block presets: 25, 50, 90, and custom duration.
- Start/Stop/Pause/Resume focus sessions.
- Interruption logging (manual quick-capture button and optional auto events from in-app interactions).
- Re-entry queue generated at focus end.
- Calendar-aware conflict warning if focus overlaps scheduled events.

### UX Requirements
- Add Start Focus CTA in Today and Dashboard.
- Add in-session minimal HUD: timer, interruptions count, quick capture.
- End-of-block recap modal with 3 actions:
  - Resume top interrupted item
  - Plan next block
  - Mark block quality

### Acceptance Criteria
- Users can create and complete a focus block in <=10 seconds from Today page.
- Session persists across page refresh/tab reload.
- Interruptions and block summary are saved and visible in Analytics.

### Telemetry
- focus_block_started
- focus_block_completed
- focus_block_interrupted
- focus_reentry_item_created

### Risks
- Overly strict focus UX may increase abandonment.
Mitigation: provide flexible modes and quick exits.

---

## 8. Feature PRD: Weekly Review OS

### Problem
Users plan ad hoc and start weeks reactively.

### Goals
- Establish a recurring weekly planning ritual.
- Convert open loops into prioritized and schedulable work.
- Connect weekly priorities to daily execution.

### User Stories
- As a user, I get a weekly review prompt at a chosen day/time.
- As a user, I can run a structured review checklist in 15-45 minutes.
- As a user, I can set top 3 weekly priorities and map them to days.
- As a user, I can carry incomplete items forward intentionally.

### Functional Requirements
- Configurable weekly review reminder.
- Review sections:
  - Get Clear: inbox/mind sweep
  - Get Current: open tasks, waiting items, calendar lookback/lookahead
  - Get Creative: ideas and future opportunities
- Weekly Top 3 commitments.
- Auto-generated next-week proposal from incomplete/high-priority tasks.
- Weekly scorecard snapshot.

### UX Requirements
- Dedicated Weekly Review page and entry point from Today.
- Progress indicator for review sections.
- End screen with generated weekly plan summary.

### Acceptance Criteria
- User can complete review without leaving the flow.
- Saved weekly priorities appear on Today and Dashboard.
- Weekly summary can be exported.

### Telemetry
- weekly_review_started
- weekly_review_completed
- weekly_priority_created
- weekly_priority_completed

---

## 9. Feature PRD: AI Execution Coach + If-Then Planner

### Problem
Users know goals but fail at execution due to vague tasks and no fallback plans.

### Goals
- Make tasks actionable and context-aware.
- Increase follow-through by using implementation intentions and fallback plans.

### User Stories
- As a user, I can ask AI to transform a vague task into clear next actions.
- As a user, I can generate an If-Then fallback for likely blockers.
- As a user, I get a morning and evening coaching brief.

### Functional Requirements
- AI transforms tasks to: action verb, context, estimate, dependency, first step.
- If-Then template generator:
  - If [blocker], then [backup action].
- Daily coaching brief:
  - Morning: plan, risk, focus suggestion
  - Evening: recap, carry-forward suggestion
- Confidence score and rationale for each suggestion.

### Non-goals
- Fully autonomous scheduling in v1.

### UX Requirements
- Add Coach panel to Today and Dashboard.
- One-click apply for each AI recommendation.
- User feedback controls: helpful/not helpful, hide suggestion type.

### Acceptance Criteria
- Recommendation apply action updates tasks/goals immediately.
- Suggestions reference user data from tasks/habits/focus history.

### Telemetry
- ai_suggestion_generated
- ai_suggestion_applied
- ai_suggestion_dismissed
- if_then_created

---

## 10. Trust and Data Safety Requirements
- Automatic daily backup snapshot.
- Manual one-click ZIP and Excel export remains available.
- Restore preview before write operations.
- Data change log for sensitive operations (bulk carry-forward, reset, imports).

## 11. Out of Scope for 90 days
- Native desktop client.
- Enterprise SSO/SCIM.
- Full automation marketplace.

## 12. Launch Readiness Checklist
- End-to-end test coverage for focus/weekly review/coach apply actions.
- Analytics instrumentation validated.
- Backup and restore smoke tested on seeded data.
- In-app onboarding for new features.
