# AI Prompt Log: Justin

Justin (Backend). This file records every AI prompt Justin used on the project. Only add your own entries here. See [Prompts.md](../Prompts.md) for the other team members.

Number entries in this file from 1. Entries moved from the old shared log keep their old number in **Shared log #**, because the roadmap and older entries refer to those numbers.

## Entry template

```markdown
### <#>. <Short title>

- **Date:** YYYY-MM-DD
- **Tool / model:** e.g. Claude Code (Claude Opus 5.5)
- **Used by:** Justin
- **Prompt:** "<exact prompt text>"
- **Output / changes:** <what the AI produced or which files it changed>
- **Human review:** <what you kept, edited or rejected>
```

---

## Log

### 1. Scaffold folder structure and refine README

- **Shared log #:** 1
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** Justin
- **Prompt:** "Based on the README, build a folder structure and refine README"
- **Output / changes:**
  - Created the empty project skeleton:
    - `backend/`: `config/`, plus `apps/` containing `accounts`, `projects`, `schedules` and `planner`; also `tests/`
    - `frontend/src/`: `components/` (calendar, dashboard, common), `pages/`, `services/`, `hooks/`, `types/`, `utils/`
    - `docs/`
  - Added `.gitignore` for Python/Django, Node and editor files.
  - Rewrote `README.md` with these sections: problem, solution, features, data inputs table, tech stack, project structure, setup commands and roadmap.
  - Proposed two choices the team hadn't made: Django REST Framework for the API, and earliest-deadline-first as the starting scheduling approach.
- **Human review:** Justin

### 2. Set up AI usage documentation

- **Shared log #:** 2
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** Justin
- **Prompt:** "in prompts.md make sure to document all ai usage"
- **Output / changes:**
  - Turned `Prompts.md` into a structured log with an entry template.
  - Backfilled entries 1 and 2.
  - Added a rule to `CLAUDE.md` so Claude logs every future prompt here.
- **Human review:** _TBD_

### 3. Collapse backend apps into one app

- **Shared log #:** 7
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** Justin
- **Prompt:** "Restructure backend folders and collapse all apps into one app"
- **Output / changes:**
  - Replaced `backend/apps/` (`accounts`, `projects`, `schedules`, `planner`) with a single app at `backend/api/`.
  - Merged all six models (`Account`, `Project`, `Commitment`, `PlannerSettings`, `DayOverride`, `StudyBlock`) into `api/models.py`, and all admin registrations into `api/admin.py`.
  - Moved the in-progress `Account` serializer, viewset and router into `api/serializers.py`, `api/views.py` and `api/urls.py`, fixing the broken `urls.py` and the misplaced serializer.
  - Removed the four old migrations and generated a single `api/migrations/0001_initial.py`.
  - Updated `INSTALLED_APPS` to `'api'` and `config/urls.py` to include `api.urls` under `api/v1/`.
  - Updated the project structure in `README.md` and the old app paths in `docs/ROADMAP.md`.
- **Human review:** _TBD_

### 4. Review the project and update the roadmap and README

- **Shared log #:** 25
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** Justin
- **Prompt:** "For this prompt do not write in prompt.md as this is a redundant check. Read through project and update Roadmap and Readme and clarify what still needs to be completed"
- **Output / changes:**
  - Read the backend and frontend code, ran the backend tests (16 pass) and the frontend build (fails on `EventItem.tsx` and `EventList.tsx`).
  - `docs/ROADMAP.md`: noted the single `api` app in section 1. Rewrote section 2 with a status for each task ID, a table of where the real backend differs from the planned contract, four open decisions (`D1` to `D4`), known bugs, and the remaining work in priority order. Added notes to sections 4 and 6.
  - `README.md`: updated the tech stack, project structure, setup commands and API overview, and split the roadmap checklist into done and still to do.
  - Per the prompt, did not add a `Prompts.md` entry at the time. Entry 26 adds it.
- **Human review:** Justin

### 5. Log the last prompt and commit

- **Shared log #:** 26
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** Justin
- **Prompt:** "update prompt.md with last prompts and commit changes"
- **Output / changes:** Added entries 25 and 26, and committed `README.md`, `docs/ROADMAP.md` and `Prompts.md` to `Justins-update-branch`.
- **Human review:** Justin

### 6. Implement the roadmap 2.3 decisions

- **Shared log #:** 32
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** Justin
- **Prompt:** "Implement recommendations for 2.3 in Roadmap"
- **Output / changes:**
  - `backend/api/views.py`:
    - `D1`: new `CalendarEventsView` (`GET /api/v1/planner/events/?start=&end=`) returns study blocks, expanded commitments and day overrides in the `CalendarEvent` shape.
    - `D2`: new `WeeklySummaryView` (`GET /api/v1/planner/week/?start=&now=`) returns the `WeeklySummary` shape. `at_risk` comes from a dry run of the planner.
    - Moved the planner input building out of `GeneratePlanView` into shared helpers. `generate` behaves the same.
  - `backend/api/scheduler.py`: new `daily_capacity()` for the weekly summary.
  - `backend/api/urls.py`: registered both routes.
  - `backend/api/test_scheduler.py`: 7 new tests, 23 in total, all passing. Expected timestamps use the server's real offset, because tzdata gives `America/Edmonton` `-06:00` in November 2026, not `-07:00`.
  - Frontend:
    - New `useCalendarEvents` and `useWeeklySummary` hooks with `.d.ts` files. Planner queries refetch after `generatePlan` and after any resource change (`resource.js`, `useGeneratePlan.js`).
    - `types/api.ts` now allows `kind: null`.
    - `PlanForDay` and `CalendarPage` show "Commitment" when `kind` is null.
  - `D3` and `D4` needed no code. The roadmap records them as decided.
  - `docs/ROADMAP.md` and `README.md`: updated the 2.1 statuses (`B2.3`, `B3.2`, `F0.1`, `F2.3`), the 2.2 differences, 2.3 (now "made and built"), the 2.5 priorities, the API table, the test count and the checklist.
- **Human review:** Justin

### 7. Fix the generate save step and time zone handling of `now`

- **Shared log #:** 33
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** Justin
- **Prompt:** "replaceable is lazy: it's a queryset, not a list. If post creates the new blocks before deleting replaceable, the delete will re-run the query and could match the blocks it just created. Delete first, or turn it into a list of IDs before creating anything, and wrap both steps in transaction.atomic(). Timezones: now.date() and now.time() assume now is in the same timezone your date/start_time fields are stored in. If now is in UTC and blocks use the user's local time, blocks near midnight or the current hour can land in the wrong group."
- **Output / changes:**
  - `backend/api/views.py`, `GeneratePlanView.post`:
    - The code already deleted before creating, inside `transaction.atomic()`.
    - It now snapshots the replaceable block IDs at planning time. Inside the transaction, it deletes only those IDs, skipping any marked completed since planning, and then creates the new blocks.
  - `backend/api/views.py`, `_parse_now`:
    - A `now` with an offset (`Z`, `-06:00`) is now converted to `settings.TIME_ZONE` (America/Edmonton), the zone the block date and time fields use. Before, the offset was dropped, so UTC times were read as Edmonton times.
    - A `now` without an offset is still taken as server-local time.
    - Fixed docstrings that said the server runs in UTC.
  - `frontend/src/hooks/useGeneratePlan.js`: `localNow()` now sends the browser's offset, so `generate` and `week` are correct from any time zone. Updated the comment in `types/backend.ts`.
  - `backend/api/test_scheduler.py`: 3 tests (26 in total, all passing): a UTC `now` is converted, a `now` without an offset stays local, and a late-evening `now` from UTC+1 still replaces a 17:00 Edmonton block from today. The first and third fail on the old code.
- **Human review:** Justin

### 8. Commit and push the roadmap 2.3 work

- **Shared log #:** 34
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** Justin
- **Prompt:** "commit and push"
- **Output / changes:** Committed the work from entries 32 and 33 as `af7d24e` on `justin-reccomendations-roadmap` and pushed it to `origin`. Added this entry in a follow-up commit.
- **Human review:** Justin

### 9. Review the project and update the README and roadmap

- **Shared log #:** 38
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** Justin
- **Prompt:** "Go through the project and update Readme as needed, update Roadmap"
- **Output / changes:**
  - Reviewed `main` after PR #26: backend tests (26 pass), frontend build (still fails on the unused `EventItem.tsx` and `EventList.tsx`), and the new pages, forms and `lib/events.ts`.
  - `docs/ROADMAP.md`:
    - Rewrote section 2: status for each task now that the Tasks, Schedule, Settings, Dashboard and Calendar views work on real data; updated decisions `D1` and `D2` to the frontend conversion, and added open decision `D5` (two versions of the events and summary logic).
    - Refreshed the known bugs and the priority list. `seed_demo`, the build fix and a demo rehearsal are now at the top.
    - Rewrote the section 8 demo steps to match the real buttons ("Generate plan", "+ Add commitment", "Can't study today", "Regenerate", "Mark as done") and added a note that the seed data must leave only 5 free hours for the alert to appear.
  - `README.md`: updated the tech stack, project structure (`lib/`, `components/forms/`, new pages), test count, and the API notes (the events and week endpoints are unused by the frontend; `now` takes an offset). Added a "Using the app" section and rewrote the done and still-to-do checklists.
  - `Prompts.md`: renumbered the duplicate entries from the PR #25 merge. Justin's 27–29 became 32–34 and JP's 32–34 became 35–37, and the references inside them were fixed. Added this entry.
- **Human review:** Justin

### 10. Commit and push the README and roadmap update

- **Shared log #:** 39
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** Justin
- **Prompt:** "don't delete, commit and push"
- **Output / changes:** Committed `README.md`, `docs/ROADMAP.md` and `Prompts.md` (entries 38 and 39) on `justin-roadmap-update` and pushed the branch to `origin`. Per the prompt, did not delete `EventItem.tsx` or `EventList.tsx`, so `npm run build` still fails.
- **Human review:** Justin

### 11. Fix the build and add the `seed_demo` command

- **Shared log #:** 40
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** Justin
- **Prompt:** "Fix the build: delete the unused files in 2.4 so that npm run build passes. B1.4 and B4.4: python manage.py seed_demo with the section 8 data, adjusted to the real models: date deadlines, whole hours, and "Car broke down" as a DayOverride or a one-off commitment. Without it, every demo starts from an empty account."
- **Output / changes:**
  - Deleted the unused `frontend/src/components/EventItem.tsx`, `EventList.tsx`, `services/mocks.ts`, and the empty `api/schedule.js` and `hooks/useSchedules.js`. Nothing imported them. `npm run build` and `eslint` pass. The build warns that the bundle is over 500 kB.
  - `backend/api/management/commands/seed_demo.py`: creates or resets the `demo` account (`--username`, `--password`, `--today`). Dates are relative to the run day. A one-off "Classes and labs" commitment fills the demo day, and weekly shifts and volunteering on T+1 to T+3 leave exactly 5 free hours before the Capstone deadline. The README alert (7 left, 5 available, 2 short) therefore appears on any day and at any time. Past completed blocks match the hours done.
  - `backend/api/test_seed_demo.py`: 4 tests (30 in total, all passing). They cover the alert on 3 weekdays at 3 times, the reset and the password, completed hours, and demo steps 5 and 6.
  - "Car broke down" stays a live demo step, entered as a one-off commitment tomorrow 09:00–11:00. The section 8 time (13:00–17:00) fell inside a shift, so the plan would not have changed. Now Capstone turns critical (3 available, 4 short).
  - `docs/ROADMAP.md`: rewrote section 8 (seed data and steps), updated the 2.1 statuses, marked the build fix as done in 2.4, and renumbered the 2.5 priorities.
  - `README.md`: added the `seed_demo` setup, sign-in details and new files, removed the known build issue, and updated the test count and checklists.
- **Human review:** Justin

### 12. Commit and push the build fix and `seed_demo`

- **Shared log #:** 41
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** Justin
- **Prompt:** "commit and push"
- **Output / changes:** Committed the work from entry 40 and this entry on `justin-backend-update` and pushed the branch to `origin`.
- **Human review:** Justin

### 13. Review the project and update the roadmap

- **Shared log #:** 43
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** Justin
- **Prompt:** "go through the project and update the roadmap"
- **Output / changes:**
  - Reviewed `main` after PR #29: 34 backend tests pass, no pending migrations, `npm run build` and `eslint` pass. Read the new `usePlanCheck`, `usePlanStatus`, form and scheduler suggestion changes.
  - `docs/ROADMAP.md`:
    - Section 2: new summary. Updated statuses for `B3.1`, `B2.4`, `F1.1`, `F1.5`, `F2.1`, `F3.1` and `F4.1`, and decisions `D2` and `D5` (client at-risk flags are now live; capacity is the remaining difference).
    - Marked the "alerts gone after reload" bug as fixed and added a note on the extra dry run per save. Narrowed priority 5 to the Tasks-page badges.
    - Section 8: demo steps match the live alerts, the commitment hours note and the time-off impact preview ("Update my plan").
  - `Prompts.md`: renumbered JP's PR #29 entry from 36 (a duplicate) to 42, and added this entry.
- **Human review:** Justin

### 14. Commit and push the roadmap update

- **Shared log #:** 44
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** Justin
- **Prompt:** "commit and push"
- **Output / changes:** Committed `docs/ROADMAP.md` and `Prompts.md` (entries 42–44) on `justin-testing` and pushed the branch to `origin`.
- **Human review:** Justin

### 15. Split the prompt log per person and update the roadmap

- **Date:** 2026-11-15
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** Justin
- **Prompt:** "create a new prompt.md for specific users and keep them seperated. Read through roadmap and update what needs to be done."
- **Output / changes:**
  - Split the shared `Prompts.md` log into `prompts/Justin.md` (14 entries), `prompts/Cody.md` (21), `prompts/JP.md` (9) and `prompts/Robin.md` (empty).
    - Each file has its own template and numbers its entries from 1.
    - Each moved entry keeps its old number as **Shared log #**.
    - A script checked that no line of the old log was lost.
  - `Prompts.md` is now an index: links to each person's log, plus a frozen table that maps the old shared numbers 1 to 44 to their new place.
  - `CLAUDE.md` now says to log in the sender's own file and never in another person's.
  - `README.md`: added `prompts/` to the project structure.
  - `docs/ROADMAP.md`:
    - re-checked against `main` after PR #33: 34 tests pass, there are no pending migrations, and the build and lint pass
    - fixed the broken ownership table in section 1
    - updated the prompt log rules in sections 5, 7 and 8
    - added the AI log gaps and a small cleanup task to 2.4 and 2.5
  - No app code changed.
- **Human review:** Justin

### 16. Commit and push the prompt log split

- **Date:** 2026-11-15
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** Justin
- **Prompt:** "commit and push"
- **Output / changes:** Committed `prompts/`, `Prompts.md`, `CLAUDE.md`, `README.md` and `docs/ROADMAP.md` on `justins-post-hack` and pushed the branch to `origin`.
- **Human review:** _TBD_
