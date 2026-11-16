# AI Prompt Log: JP

JP (Frontend). This file records every AI prompt JP used on the project. Only add your own entries here. See [Prompts.md](../Prompts.md) for the other team members.

Number entries in this file from 1. Entries moved from the old shared log keep their old number in **Shared log #**, because the roadmap and older entries refer to those numbers.

## Entry template

```markdown
### <#>. <Short title>

- **Date:** YYYY-MM-DD
- **Tool / model:** e.g. Claude Code (Claude Opus 5.5)
- **Used by:** JP
- **Prompt:** "<exact prompt text>"
- **Output / changes:** <what the AI produced or which files it changed>
- **Human review:** <what you kept, edited or rejected>
```

---

## Log

### 1. Codebase health review (no code changes)

- **Shared log #:** 27
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** JP
- **Prompt:** "Hello claude, please analyze my entire codebase, especially the frontend, and make sure everything is currently working properly. do not write any code right now, simply tell me any mistakes and obstacles."
- **Output / changes:** Read-only review. Ran `tsc -b`, `eslint`, `vite build`, `manage.py check`, `makemigrations --check` and `manage.py test`, then reported problems: styling not wired up (App.css was still the Vite template, Tailwind not installed), dashboard and calendar still on mock data, frontend and backend data shapes don't match, `/accounts/me/` returns the password hash, `db.sqlite3.bak` committed, no tests. No files changed.
- **Human review:** JP

### 2. Tailwind CSS + daisyUI styling pass

- **Shared log #:** 28
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** JP
- **Prompt:** "could you tackle the styling? implement tailwind css and/or daisyui to App.tsx and the respective pages to make most of the app look attractive."
- **Output / changes:**
  - Installed `tailwindcss@4.3.3`, `@tailwindcss/vite@4.3.3` and `daisyui@5.7.50` as dev dependencies and added the Tailwind plugin to `vite.config.ts`.
  - Replaced the Vite starter `index.css` with Tailwind + daisyUI and two custom themes (`planner` light, `planner-dark` dark) in violet to match the FullCalendar palette. Removed `App.css` and `pages/LoginPage.css`.
  - `index.html`: real page title, Inter font.
  - Restyled `App.tsx` (sticky navbar with mobile menu, hero, stats card, feature cards, footer), `LoginPage.tsx` and `RegisterPage.tsx` (new shared `components/AuthLayout.tsx`), `CalendarPage.tsx` (calendar plus event-details side panel) and `DashboardPage.tsx`, which now also shows `ProgressTracker` and `PlanForDay` with a day picker, still using mock data. No logic changed.
  - Switched `PlanForDay`, `ProgressTracker`, `MonthlyCalendar` and `WeeklyCalendar` to theme colours so dark mode works; the calendars now always use white event text.
  - `main.tsx`: sets a `data-color-scheme` attribute on `<html>` from the OS dark-mode setting, so FullCalendar's dark palette turns on with daisyUI's.
  - Checked with `tsc -b`, `eslint` and `vite build`, plus headless-browser screenshots of every page in light, dark and mobile against a mock API.
- **Human review:** JP

### 3. Restore App.css to fix a merge conflict

- **Shared log #:** 29
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** JP
- **Prompt:** "on github it is saying that I have a conflict happening on app.css because i forgot to pull before a push. could you revert whatever chances you made in app.css temporarily? and also do not add the ai usage prompt on prompt.md for now, we will do that later to prevent conflicts too."
- **Output / changes:** Restored `frontend/src/App.css` to its version from before entry 28. `main` had edited the file while this branch deleted it. Ran a test merge against `origin/main` to confirm no conflicts were left. Held back the `Prompts.md` entries until now (this entry and the next three).
- **Human review:** JP

### 4. Commit and push the App.css fix

- **Shared log #:** 30
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** JP
- **Prompt:** "yes please"
- **Output / changes:** Committed the restored `App.css` (`9098d0a`) and pushed it to `jp-apptsx-branch`. That branch was later merged in PR #23.
- **Human review:** JP

### 5. Add the held-back AI usage entries

- **Shared log #:** 31
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** JP
- **Prompt:** "i am ready to add the ai usage entries"
- **Output / changes:** Fast-forwarded `jp-apptsx-branch` to `origin/main` so the numbering would not conflict, then added entries 27–31 to `Prompts.md`.
- **Human review:** JP

### 6. Plan where users enter their own data (no code)

- **Shared log #:** 35
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** JP
- **Prompt:** "i committed and pushed it myself. right now the pages, components, and seeded data looks good. but there are no areas where we can input our own schedules, tasks, deadlines, and such. could you figure out a way we could squeeze it in? would inputs be integrated within the dashboard? do not code anything on the backend and frontend yet. lets verify"
- **Output / changes:** Read-only planning. Proposed new Tasks and Schedule pages, quick-add dialogs on the dashboard, planner settings in the avatar menu, a setup checklist for new accounts, and form fields mapped to the backend models. Flagged that the calendar and dashboard still showed mock data. No files changed.
- **Human review:** JP

### 7. Build the input forms and connect the app to real data

- **Shared log #:** 36
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** JP
- **Prompt:** "The layout above does work for me. I am okay with building the input forms now, our teammates agreed on it. For the conversion, its okay if the calendar events happen in the frontend. Another thing, I removed the recent ai usage entry due to possible conflicts, you should also pause on typing out the entry for this until i tell you to."
- **Output / changes:**
  - New pages: `TasksPage.tsx` (task cards, filters, log hours, edit, delete) and `SchedulePage.tsx` (weekly commitments, one-time events, time off, study-hours summary). Both added to the nav in `App.tsx`, with a Planner settings dialog in the avatar menu.
  - New forms in `components/forms/`: `TaskForm`, `CommitmentForm`, `DayOverrideForm` (can replan right away), `SettingsForm`, `LogHoursForm`, and shared `Field` helpers. Also new `Modal`, `ConfirmDialog` and `EventDetails` (mark a study session done or undo it, which updates the task's hours and status).
  - `DashboardPage.tsx`: quick-add dialogs, Generate plan button with the planner's alerts, an "Update needed" badge after inputs change, a 4-step setup checklist, and one week control shared by the calendar and day picker. `CalendarPage.tsx` now uses real data.
  - New `lib/` helpers: `events.ts` (backend records to calendar events and the weekly summary, including deadlines as all-day events), `dates.ts`, `formErrors.ts`, `progress.ts`, `taskOptions.ts`. New hooks `usePlannerData` and `usePlanStatus`.
  - Updated `PlanForDay`, `ProgressTracker`, `MonthlyCalendar`, `WeeklyCalendar` and `types/api.ts`: local time zone instead of a hardcoded one, nullable `kind`, a new deadline event type, per-event text colour, and a fix for horizontal overflow on phones.
  - No backend changes. Checked with `tsc`, `eslint`, `vite build`, and a browser test of the full flow against the real Django API on a throwaway database.
- **Human review:** JP

### 8. Commit, push and log the input forms work

- **Shared log #:** 37
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** JP
- **Prompt:** "please commit and push this, and I am ready for you to add the entry for this work"
- **Output / changes:** Committed the frontend work (`7870f12`) and merged `origin/main` into `jp-apptsx-branch`. Resolved conflicts in `PlanForDay.tsx`, `CalendarPage.tsx` and `types/api.ts` by keeping this branch's versions, which already included main's `kind`-can-be-null fix. Re-ran the checks, the 26 backend tests and the browser test on the merged code. Added entries 35–37 and pushed.
- **Human review:** JP

### 9. Fix the overload, alert and suggestion problems

- **Shared log #:** 42
- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** JP
- **Prompt:** "fix all of the suggested fixes you proposed."
- **Output / changes:**
  - `DashboardPage.tsx`: the setup checklist shows only until the first plan, and alerts show whenever there are any, so a shortfall stays visible even when time off removes every study block. Added a "No study time is left in your plan" banner. "Update needed" only appears after a first plan.
  - New `hooks/usePlanCheck.ts`: loads alerts live from a dry run of `POST planner/generate/` (saves nothing), so they survive reloads and refresh after every save. `usePlanStatus.ts` now uses its own cache key, because the `['planner']` refresh added on main had been wiping it after every save, and it keeps the "Update needed" state in `localStorage` per account.
  - `DayOverrideForm.tsx`: notes while filling in ("Nth day off this week", not a study day, already off, date passed). After saving, it shows a dry-run preview of the impact on each deadline, then **Update my plan** or **Not now**.
  - `CommitmentForm.tsx`: shows how many hours of the study window the commitment uses, and warns when it covers all of them.
  - `backend/api/scheduler.py`: alert suggestions count only days that still have free time, give a clear message when no study time is left, and suggest a higher daily limit only when the limit is what blocks the work (with how much it would help). Added 4 tests to `test_scheduler.py`; all 30 backend tests pass.
  - Added `api/api.d.ts` and the `localNow` type in `useGeneratePlan.d.ts`, so TypeScript files can import them.
  - Checked with `tsc`, `eslint`, `vite build`, the backend tests, and a 33-check browser test against the real API on a throwaway database (validation on every form, edit, delete, undo, one-time events, partial time off, the impact step, overload, and alerts after reload).
- **Human review:** JP
