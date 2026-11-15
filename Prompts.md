# AI Prompt Tracker

This file records every use of AI tools on this project, for transparency with the hackathon judges. Add an entry each time AI is used. Include the tool, who used it, the prompt and what came out of it.

## Entry template

```markdown
### <#>. <Short title>

- **Date:** YYYY-MM-DD
- **Tool / model:** e.g. Claude Code (Claude Opus 5.5)
- **Used by:** <team member>
- **Prompt:** "<exact prompt text>"
- **Output / changes:** <what the AI produced or which files it changed>
- **Human review:** <what we kept, edited or rejected>
```

---

## Log

### 1. Scaffold folder structure and refine README

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
- **Human review:** _TBD_

### 2. Set up AI usage documentation

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** Justin
- **Prompt:** "in prompts.md make sure to document all ai usage"
- **Output / changes:**
  - Turned `Prompts.md` into a structured log with an entry template.
  - Backfilled entries 1 and 2.
  - Added a rule to `CLAUDE.md` so Claude logs every future prompt here.
- **Human review:** _TBD_

### 3. Detailed team roadmap

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), desktop app
- **Used by:** Cody
- **Prompt:** "Go through our current docs and road map and make a more in depth road map/plan for our four group members to work (Justin, Cody: backend. Robin, JP: Frontend)."
- **Output / changes:**
  - Created `docs/ROADMAP.md`: owners and pairs, gaps in the current scaffold, first-hour decisions, a shared API contract (models, endpoints, JSON shapes), six phases with task IDs and checkpoints, the scheduling algorithm steps, Git rules, a demo script with seed data, stretch goals and risks.
  - Added a link to `docs/ROADMAP.md` in the README roadmap section.
- **Human review:** JP

### 4. Commit the roadmap

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), desktop app
- **Used by:** Cody
- **Prompt:** "Commit the working tree changes with a sensible message."
- **Output / changes:** Committed `docs/ROADMAP.md`, the README link and Prompts.md entries 3 and 4 to the `cody` branch.
- **Human review:** _TBD_

### 5. Open a pull request for the roadmap

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), desktop app
- **Used by:** Cody
- **Prompt:** "Create PR" (desktop app button: push the `cody` branch and open a pull request to `main`)
- **Output / changes:** Added this entry, pushed the `cody` branch and opened a pull request to `main` for the roadmap.
- **Human review:** _TBD_

### 6. Fix Django app import configuration

- **Date:** 2026-11-14
- **Tool / model:** Copilot SDK in VS Code (model not surfaced)
- **Used by:** Cody
- **Prompt:** "(.venv) cody@lap-cody-lenovo:/home/cody/github/NAIT/Team-Crashouts-Hackathon-Project/backend$ python3 manage.py makemigrations
  Traceback (most recent call last):
  File \"/home/cody/github/NAIT/Team-Crashouts-Hackathon-Project/backend/.venv/lib/python3.13/site-packages/django/apps/config.py\", line 210, in create
  app_module = import_module(app_name)
  File \"/usr/lib/python3.13/importlib/**init**.py\", line 88, in import_module
  return \_bootstrap.\_gcd_import(name[level:], package, level)
  ~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File \"<frozen importlib._bootstrap>\", line 1387, in \_gcd_import
  File \"<frozen importlib._bootstrap>\", line 1360, in \_find_and_load
  File \"<frozen importlib._bootstrap>\", line 1324, in \_find_and_load_unlocked
  ModuleNotFoundError: No module named 'projects'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
File \"/home/cody/github/NAIT/Team-Crashouts-Hackathon-Project/backend/manage.py\", line 22, in <module>
main()
~~~~^^
File \"/home/cody/github/NAIT/Team-Crashouts-Hackathon-Project/backend/manage.py\", line 18, in main
execute_from_command_line(sys.argv)
~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^
File \"/home/cody/github/NAIT/Team-Crashouts-Hackathon-Project/backend/.venv/lib/python3.13/site-packages/django/core/management/**init**.py\", line 443, in execute_from_command_line
utility.execute()
~~~~~~~~~~~~~~~^^
File \"/home/cody/github/NAIT/Team-Crashouts-Hackathon-Project/backend/.venv/lib/python3.13/site-packages/django/core/management/**init**.py\", line 417, in execute
django.setup()
~~~~~~~~~~~~^^
File \"/home/cody/github/NAIT/Team-Crashouts-Hackathon-Project/backend/.venv/lib/python3.13/site-packages/django/**init**.py\", line 24, in setup
apps.populate(settings.INSTALLED_APPS)
~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^
File \"/home/cody/github/NAIT/Team-Crashouts-Hackathon-Project/backend/.venv/lib/python3.13/site-packages/django/apps/registry.py\", line 91, in populate
app_config = AppConfig.create(entry)
File \"/home/cody/github/NAIT/Team-Crashouts-Hackathon-Project/backend/.venv/lib/python3.13/site-packages/django/apps/config.py\", line 212, in create
raise ImproperlyConfigured(
...<6 lines>...
)
django.core.exceptions.ImproperlyConfigured: Cannot import 'projects'. Check that 'apps.projects.apps.ProjectsConfig.name' is correct."

- **Output / changes:** Updated all four Django AppConfig `name` values to match their `apps.*` package paths used in settings and generated initial migrations for the four apps.
- **Human review:** _TBD_"

### 7. Collapse backend apps into one app

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

### 8. Frontend login hook

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), desktop app
- **Used by:** Cody
- **Prompt:** "Can you implement the login hook on the front end?"
- **Output / changes:**
  - Installed `@tanstack/react-query` and wrapped the app in `QueryClientProvider` in `frontend/src/main.tsx`.
  - `frontend/src/api/api.js`: exported `api_url` (reads `VITE_API_URL`), added `apiFetch`, `ApiError` and helpers that keep the Basic auth header in `sessionStorage`.
  - Finished `frontend/src/hooks/useLogin.js`. It checks the username and password with `GET /api/v1/accounts/me/`, because the backend uses Basic auth and has no login endpoint.
  - Added `frontend/src/hooks/useCurrentUser.js` and `frontend/src/hooks/useLogout.js`.
  - Tested login, wrong password, page reload, stale credentials and logout in the browser against a throwaway copy of the backend database.
- **Human review:** _TBD_

### 9. Commit the login hook

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), desktop app
- **Used by:** Cody
- **Prompt:** "Branch and commit"
- **Output / changes:** Created branch `cody-login-hook` and committed the login hook files from entry 8 and this log entry. Left the unrelated changes to `useProjects.js` and `api/schedule.js` uncommitted.
- **Human review:** _TBD_

### 10. Open a pull request for the login hook

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), desktop app
- **Used by:** Cody
- **Prompt:** "Create PR" (desktop app button: push `cody-login-hook` and open a pull request to `main`)
- **Output / changes:** Added this entry, pushed `cody-login-hook` and opened a pull request to `main` for the login hook.
- **Human review:** _TBD_

### 11. Basic login page

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), desktop app
- **Used by:** Cody
- **Prompt:** "Can you make a basic login page on the LoginPage.tsx"
- **Output / changes:**
  - `frontend/src/pages/LoginPage.tsx`: a username and password form that uses `useLogin`. It shows errors and a pending state, takes an optional `onSuccess` prop, and shows "You are logged in" with a Log out button when a user is signed in.
  - `frontend/src/pages/LoginPage.css`: plain CSS that uses the color tokens in `index.css`, for light and dark mode.
  - Added `useLogin.d.ts`, `useLogout.d.ts` and `useCurrentUser.d.ts` in `frontend/src/hooks/`, because TypeScript 6 is strict by default and rejects imports from the untyped `.js` hooks.
  - Tested a wrong password, a correct login, logout, dark mode, light mode and phone width in the browser against a throwaway copy of the backend database.
- **Human review:** _TBD_

### 12. Show the login page in the app

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), desktop app
- **Used by:** Cody
- **Prompt:** "Yes, wire it in" (answer to: "Show the login page in App.tsx when nobody is logged in?")
- **Output / changes:**
  - `frontend/src/App.tsx`: shows `LoginPage` when nobody is logged in. After login, it shows the app with a "Signed in as" bar and a Log out button. Styles are in `frontend/src/App.css`.
  - Fixed a bug in `frontend/src/hooks/useCurrentUser.js`. TanStack Query re-renders a component only for the fields that it read. The hook skipped `data` when logged out, so `App` did not update after a login.
  - Tested login, reload and logout in the browser against a throwaway copy of the backend database.
- **Human review:** _TBD_

### 13. Commit the login page

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), desktop app
- **Used by:** Cody
- **Prompt:** "Commit the working tree changes with a sensible message."
- **Output / changes:** Committed the login page, the hook type files, the `App.tsx` login gate, the `useCurrentUser` fix and entries 11 to 13 to `cody-login-page`. Left the unrelated deletion of `frontend/src/api/schedule.js` uncommitted.
- **Human review:** _TBD_

### 14. Open a pull request for the login page

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), desktop app
- **Used by:** Cody
- **Prompt:** "Create PR" (desktop app button: push `cody-login-page` and open a pull request to `main`)
- **Output / changes:** Added this entry, pushed `cody-login-page` and opened a pull request to `main` for the login page.
- **Human review:** _TBD_

### 15. Basic register page

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), desktop app
- **Used by:** Cody
- **Prompt:** "make a basic register page too"
- **Output / changes:**
  - `frontend/src/pages/RegisterPage.tsx`: username, email, password and confirm-password fields. It checks the fields in the browser first (required fields, email format, at least 8 characters, matching passwords). It shows Django's 400 errors next to each field and logs the user in after sign-up.
  - `frontend/src/hooks/useRegister.js` and `useRegister.d.ts`: `POST /api/v1/accounts/`, then log in with the same username and password.
  - `frontend/src/api/api.js`: moved the sign-in step into `signInWithPassword` (now shared by `useLogin` and `useRegister`) and added an `auth: false` option to `apiFetch`.
  - `LoginPage.tsx` and `App.tsx`: "Create one" and "Log in" links switch between the two pages until a router exists. `LoginPage.css` has the new field error and link styles.
  - `frontend/package.json`: added `@fullcalendar/react@^7.1.5`. Pull request 11 imports it but did not list it, so `main` did not build.
  - Tested empty fields, a taken username, a successful sign-up, logout, and dark mode at phone width in the browser against a throwaway copy of the backend database.
- **Human review:** _TBD_

### 16. Commit the register page

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), desktop app
- **Used by:** Cody
- **Prompt:** "Commit the working tree changes with a sensible message."
- **Output / changes:** Committed the work from entry 15 to `cody-register-page` in two commits: the missing `@fullcalendar/react` dependency, then the register page with entries 15 and 16.
- **Human review:** _TBD_

### 17. Open a pull request for the register page

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), desktop app
- **Used by:** Cody
- **Prompt:** "Create PR" (desktop app button: push `cody-register-page` and open a pull request to `main`)
- **Output / changes:** Added this entry, pushed `cody-register-page` and opened a pull request to `main` for the register page and the FullCalendar dependency fix.
- **Human review:** _TBD_

### 18. Hooks for the backend API

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), desktop app
- **Used by:** Cody
- **Prompt:** "Can you make the required hooks to interact with the backend?"
- **Output / changes:**
  - `frontend/src/hooks/resource.js` (with `resource.d.ts`): shared TanStack Query helpers for the DRF viewsets. They list with filters, fetch one record, and create, PATCH-update and delete records. After each change they refresh the cached lists. Boolean filters are sent as `1`/`0`, because Django rejects `true`/`false`.
  - `useProjects`, `useCommitments`, `useDayOverrides` and `useStudyBlocks` (each with a `.d.ts`): list, one record, create, update and delete. Deleting a project also refreshes study blocks, because the backend deletes them too (CASCADE). `useProjects.js` replaces the empty stub.
  - `usePlannerSettings`: reads the user's single settings record, or `null` if there is none. `saveSettings` creates it the first time and PATCHes it after that.
  - `frontend/src/types/backend.ts`: TypeScript types that match `backend/api/models.py`, which differs from the planned contract in `types/api.ts`.
  - Tested every hook in the browser against a throwaway copy of the backend database. The tests covered create, list, filters (including `completed`), detail, update, a 400 for a missing field, the project-delete cascade, and settings create-then-update.
- **Human review:** _TBD_

### 19. Commit the API hooks

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), desktop app
- **Used by:** Cody
- **Prompt:** "Commit the working tree changes with a sensible message."
- **Output / changes:** Committed the hooks, types and log entries 18 and 19 from this work to `cody-api-hooks`.
- **Human review:** _TBD_

### 20. Open a pull request for the API hooks

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), desktop app
- **Used by:** Cody
- **Prompt:** "Create PR" (desktop app button: push `cody-api-hooks` and open a pull request to `main`)
- **Output / changes:** Added this entry, pushed `cody-api-hooks` and opened a pull request to `main` for the API hooks.
- **Human review:** _TBD_

### 21. Advice on the scheduling algorithm

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), desktop app
- **Used by:** Cody
- **Prompt:** "How would we implement a scheduling algorithm, is there a good one already out there or should we create our own? Should it be on the front end?"
- **Output / changes:** Advice only, no code. The recommendation: write our own earliest-deadline-first scheduler in Python on the backend, as a pure module with a `generate` endpoint, and keep Google OR-Tools CP-SAT as an option for later. The answer also listed the backend model gaps that the planner must handle.
- **Human review:** _TBD_

### 22. Build the scheduler

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), desktop app
- **Used by:** Cody
- **Prompt:** "Build it" (answer to: "Build the scheduler engine and generate endpoint next?")
- **Output / changes:**
  - `backend/api/scheduler.py`: an earliest-deadline-first planner in plain Python with no Django imports. It finds free time (the work window minus commitments, day overrides and kept blocks), applies the daily limit and the block and break sizes, places blocks before each deadline, and returns alerts with the shortfall and suggestions.
  - `backend/api/views.py` and `urls.py`: `POST /api/v1/planner/generate/`. The body can include `now` (the browser's local time, because the server runs in UTC) and `dry_run`. The endpoint keeps completed blocks and blocks that already started, and replaces the rest in one transaction. It also removes the stale `kind` filter from `CommitmentViewSet`, because migration 0003 removed that field and the filter caused a server error.
  - `backend/api/test_scheduler.py`: 16 tests for the planner and the endpoint, including the README example (7 hours remain, 5 fit, 2 short).
  - `frontend/src/hooks/useGeneratePlan.js` and `.d.ts`: calls the endpoint with the local time and refreshes study block lists.
  - `frontend/src/types/backend.ts` and hook examples: updated for the new models (no `course` and no `kind`, status choices, colour choices, priority 0 to 10), plus the plan response types.
  - Tested the hook end to end in the browser against a throwaway, migrated copy of the database.
- **Human review:** _TBD_

### 23. Commit the scheduler

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), desktop app
- **Used by:** Cody
- **Prompt:** "Commit the working tree changes with a sensible message."
- **Output / changes:** Committed the work from entry 22 to `cody-scheduler` in two commits: the backend scheduler and endpoint, then the frontend hook and type updates with entries 22 and 23.
- **Human review:** _TBD_

### 24. Open a pull request for the scheduler

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), desktop app
- **Used by:** Cody
- **Prompt:** "Create PR" (desktop app button: push `cody-scheduler` and open a pull request to `main`)
- **Output / changes:** Added this entry, pushed `cody-scheduler` and opened a pull request to `main` for the scheduler.
- **Human review:** _TBD_

### 25. Review the project and update the roadmap and README

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** Justin
- **Prompt:** "For this prompt do not write in prompt.md as this is a redundant check. Read through project and update Roadmap and Readme and clarify what still needs to be completed"
- **Output / changes:**
  - Read the backend and frontend code, ran the backend tests (16 pass) and the frontend build (fails on `EventItem.tsx` and `EventList.tsx`).
  - `docs/ROADMAP.md`: noted the single `api` app in section 1. Rewrote section 2 with a status for each task ID, a table of where the real backend differs from the planned contract, four open decisions (`D1` to `D4`), known bugs, and the remaining work in priority order. Added notes to sections 4 and 6.
  - `README.md`: updated the tech stack, project structure, setup commands and API overview, and split the roadmap checklist into done and still to do.
  - Per the prompt, did not add a `Prompts.md` entry at the time. Entry 26 adds it.
- **Human review:** _TBD_

### 26. Log the last prompt and commit

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** Justin
- **Prompt:** "update prompt.md with last prompts and commit changes"
- **Output / changes:** Added entries 25 and 26, and committed `README.md`, `docs/ROADMAP.md` and `Prompts.md` to `Justins-update-branch`.
- **Human review:** _TBD_

### 27. Codebase health review (no code changes)

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** JP
- **Prompt:** "Hello claude, please analyze my entire codebase, especially the frontend, and make sure everything is currently working properly. do not write any code right now, simply tell me any mistakes and obstacles."
- **Output / changes:** Read-only review. Ran `tsc -b`, `eslint`, `vite build`, `manage.py check`, `makemigrations --check` and `manage.py test`, then reported problems: styling not wired up (App.css was still the Vite template, Tailwind not installed), dashboard and calendar still on mock data, frontend and backend data shapes don't match, `/accounts/me/` returns the password hash, `db.sqlite3.bak` committed, no tests. No files changed.
- **Human review:** JP

### 28. Tailwind CSS + daisyUI styling pass

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

### 29. Restore App.css to fix a merge conflict

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** JP
- **Prompt:** "on github it is saying that I have a conflict happening on app.css because i forgot to pull before a push. could you revert whatever chances you made in app.css temporarily? and also do not add the ai usage prompt on prompt.md for now, we will do that later to prevent conflicts too."
- **Output / changes:** Restored `frontend/src/App.css` to its version from before entry 28. `main` had edited the file while this branch deleted it. Ran a test merge against `origin/main` to confirm no conflicts were left. Held back the `Prompts.md` entries until now (this entry and the next three).
- **Human review:** JP

### 30. Commit and push the App.css fix

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** JP
- **Prompt:** "yes please"
- **Output / changes:** Committed the restored `App.css` (`9098d0a`) and pushed it to `jp-apptsx-branch`. That branch was later merged in PR #23.
- **Human review:** JP

### 31. Add the held-back AI usage entries

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** JP
- **Prompt:** "i am ready to add the ai usage entries"
- **Output / changes:** Fast-forwarded `jp-apptsx-branch` to `origin/main` so the numbering would not conflict, then added entries 27–31 to `Prompts.md`.
- **Human review:** JP

### 27. Implement the roadmap 2.3 decisions

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
- **Human review:** _TBD_

### 28. Fix the generate save step and time zone handling of `now`

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
- **Human review:** _TBD_

### 29. Commit and push the roadmap 2.3 work

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** Justin
- **Prompt:** "commit and push"
- **Output / changes:** Committed the work from entries 27 and 28 as `af7d24e` on `justin-reccomendations-roadmap` and pushed it to `origin`. Added this entry in a follow-up commit.
- **Human review:** _TBD_

### 32. Plan where users enter their own data (no code)

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** JP
- **Prompt:** "i committed and pushed it myself. right now the pages, components, and seeded data looks good. but there are no areas where we can input our own schedules, tasks, deadlines, and such. could you figure out a way we could squeeze it in? would inputs be integrated within the dashboard? do not code anything on the backend and frontend yet. lets verify"
- **Output / changes:** Read-only planning. Proposed new Tasks and Schedule pages, quick-add dialogs on the dashboard, planner settings in the avatar menu, a setup checklist for new accounts, and form fields mapped to the backend models. Flagged that the calendar and dashboard still showed mock data. No files changed.
- **Human review:** JP

### 33. Build the input forms and connect the app to real data

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

### 34. Commit, push and log the input forms work

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** JP
- **Prompt:** "please commit and push this, and I am ready for you to add the entry for this work"
- **Output / changes:** Committed the frontend work (`7870f12`) and merged `origin/main` into `jp-apptsx-branch`. Resolved conflicts in `PlanForDay.tsx`, `CalendarPage.tsx` and `types/api.ts` by keeping this branch's versions, which already included main's `kind`-can-be-null fix. Re-ran the checks, the 26 backend tests and the browser test on the merged code. Added entries 32–34 and pushed.
- **Human review:** JP

### 36. Fix the overload, alert and suggestion problems

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

### 37. Make the overview less busy

- **Date:** 2026-11-14
- **Tool / model:** Claude Code (Claude Opus 5.5), VS Code extension
- **Used by:** JP
- **Prompt:** "could you make the overview look less busy?"
- **Output / changes:** `App.tsx`: the overview is now a centred headline, one sentence and two buttons, then three short features without borders. Removed the event badge, the "How it helps" example card, the section labels, the four numbered feature cards and the gradient banner. Checked with `tsc`, `eslint`, and screenshots in light, dark and phone width.
- **Human review:** JP
