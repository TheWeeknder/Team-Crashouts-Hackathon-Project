# Team Roadmap

This document breaks the roadmap in the [README](../README.md) into tasks with owners, order and checkpoints. Backend: Justin and Cody. Frontend: Robin and JP.

The plan assumes a build window of about 24 hours. If your window is longer or shorter, scale the hour ranges. Phases overlap on purpose, so nobody waits for another person to finish.

Each task has an ID (for example `B1.2` or `F2.1`). Use the ID in branch names, pull request titles and team chat.

---

## 1. Who owns what

| Person | Side | Owns |
| --- | --- | --- |
| Justin | Backend | Django setup, models, CRUD API, auth, demo seed data |
| Cody | Backend | Scheduling algorithm (`api/scheduler.py`), feasibility alerts, replanning, calendar and dashboard endpoints |

> The team chose **one Django app** (`backend/api/`) instead of the four apps first planned. Accounts, projects, schedules and the planner all live in `api/models.py`, `api/views.py` and `api/urls.py`.
| Robin | Frontend | Tailwind and daisyUI setup, routing and layout, API client, login, task, commitment and settings pages |
| JP | Frontend | Shared TypeScript types and mock data, calendar view, weekly dashboard, alerts panel, block actions |

The work splits into two pairs. Each pair shares one part of the API, so each pair talks often.

| Pair | Shared surface |
| --- | --- |
| Justin and Robin | Data entry: tasks, commitments, settings, auth |
| Cody and JP | Plan output: study blocks, calendar events, alerts, weekly summary |

---

## 2. Current state of the repo (2026-11-14)

Checked against `main` after PR #21.

**Summary:** the backend works. You can sign up, store data and generate a plan, and all 16 backend tests pass. The frontend has a login flow, data hooks and calendar components, but the app shell does not show them yet, and `npm run build` fails. **Nothing runs end to end in the browser yet.** The biggest risk is the gap between the planned contract (section 4) and the real backend.

### 2.1 Status by task

✅ done · 🟡 partly done or done differently · ❌ not started

| ID | Status | Notes |
| --- | --- | --- |
| `B0.1` | ✅ | DRF, `corsheaders` (`CORS_ALLOW_ALL_ORIGINS = True`), `TIME_ZONE = "America/Edmonton"` and the `api/v1/` route are set. Auth is DRF **Basic auth**, not token auth (see 2.2). |
| `B0.2` | ✅ | Built as `backend/api/scheduler.py` (no Django imports) instead of `engine.py`. |
| `B1.1` | 🟡 | Models exist: `Account`, `Project`, `Commitment`, `PlannerSettings`, `DayOverride`, `StudyBlock`. All are in Django admin. Field names and types differ from section 4.1 (see 2.2). |
| `B1.2` | 🟡 | A viewset for each model, filtered by `request.user`. The section 4.1 rules are **not** enforced: `completed_hours ≤ estimated_hours`, `end_time > start_time`, and one settings row per user. |
| `B1.3` | 🟡 | Sign up is `POST /api/v1/accounts/` and the current user is `GET /api/v1/accounts/me/`. There is no login or token endpoint: the frontend checks credentials by calling `me`. Sign up does not create `PlannerSettings`, but the frontend hook creates it on the first save. |
| `B1.4` | ❌ | No `seed_demo` command. `backend/api/management/` does not exist. |
| `B1.5` | ✅ | `_free_days` in `scheduler.py`. |
| `B1.6` | ✅ | `StudyBlock` uses `date`, `start_time`, `end_time` and `completed`. It has no `status` or `locked` field. |
| `B2.1` | ✅ | EDF placement with tests in `api/test_scheduler.py`. |
| `B2.2` | ✅ | `POST /api/v1/planner/generate/` takes `now` and `dry_run`, and returns `{ now, blocks, alerts }`. |
| `B2.3` | 🟡 | `GET /api/v1/study-blocks/?date=` filters by one date only, with no `start`/`end` range. `/planner/events/` (section 4.3), which expands recurring commitments, does **not** exist. |
| `B2.4` | 🟡 | `test_scheduler.py` covers `generate`, including that users only see their own data. `api/tests.py` is empty: there are no CRUD or permission tests for the other endpoints. |
| `B2.5` | ❌ | Depends on `B1.4`. |
| `B3.1` | ✅ | Alerts with suggestions. The README example test passes. |
| `B3.2` | ❌ | No `/planner/alerts/` or `/planner/week/`. Alerts come back from `generate` only. |
| `B3.3` | ❌ | No `progress/` endpoint. A client can still `PATCH` `completed_hours`, but nothing sets `status` to `completed`. |
| `B4.1` | 🟡 | `PATCH /study-blocks/{id}/` with `completed` works. It does not add hours to the project, and there is no "missed" or "locked" state. |
| `B4.2` | 🟡 | Calling `generate` again works as a replan: it keeps completed blocks and blocks that have started. There is no separate `replan(user)` service. |
| `B4.3` | ❌ | Changes to data do not trigger a replan. The frontend must call `generate`. |
| `F0.1` | ❌ | **Blocks every other frontend task.** Tailwind, daisyUI and `react-router` are not installed. `App.tsx` is still the Vite demo page behind a login check. The components already use Tailwind classes, which have no effect right now. |
| `F0.2` | ✅ | `types/api.ts` (planned contract), `services/mocks.ts`, FullCalendar v7. `date-fns` is not installed. There is also `types/backend.ts`, which matches the real backend. |
| `F1.1` | 🟡 | Done differently: `src/api/api.js` (fetch wrapper with Basic auth in `sessionStorage`) and TanStack Query hooks in `src/hooks/` for every resource, plus `useGeneratePlan`. There is no `VITE_USE_MOCKS` switch. |
| `F1.2` | 🟡 | `LoginPage` and `RegisterPage` work. `App.tsx` switches between them with state, with no route guard. |
| `F1.3` | ❌ | No Tasks (Projects) page. `useProjects` is ready to use. |
| `F1.4` | 🟡 | `CalendarPage` and `MonthlyCalendar` work on mock data. `App.tsx` does not show them. |
| `F1.5` | 🟡 | `DashboardPage` shows `WeeklyCalendar` on mock data. `PlanForDay` and `ProgressTracker` exist but are not on the page. There is no alerts panel. |
| `F2.1` | ❌ | No Schedule (commitments) page. `useCommitments` is ready. `hooks/useSchedules.js` is an empty file. |
| `F2.2` | ❌ | No Settings page. `usePlannerSettings` is ready. |
| `F2.3` | ❌ | The calendar uses mock data only. There is no "Generate plan" button. |
| `F3.x`, `F4.x` | ❌ | Not started. |
| Phase 5 | ❌ | Not started. This README update covers part of `B5.1`. |

### 2.2 The real backend differs from the contract in section 4

The frontend components (`MonthlyCalendar`, `WeeklyCalendar`, `PlanForDay`, `ProgressTracker`) use the section 4 shapes in `types/api.ts`. The API returns the shapes in `types/backend.ts`. **The team must pick one fix now** (decision `D1` in 2.3).

| Planned (section 4) | Real backend (`api/models.py`) |
| --- | --- |
| Token auth, `/auth/register/`, `/auth/login/`, `/auth/me/` | Basic auth, `POST /accounts/`, `GET /accounts/me/` |
| Route prefix `/api/` | `/api/v1/` |
| `Task` at `/tasks/` | `Project` at `/projects/` |
| `deadline` is a datetime | `deadline` is a date |
| Hours are decimals | `estimated_hours` and `completed_hours` are integers |
| `priority` 1 (high) to 3 (low) | `priority` 0 to 10, higher means more important |
| `status`: `todo`, `in_progress`, `done` | `incompleted`, `in_progress`, `completed`, `skipped` |
| `color`, any hex | `colour`, one of 9 preset hex values |
| `Commitment.kind` | Removed in migration `0003` |
| `recurring`, `weekdays` as a list, `active_until` | `recuring` (misspelled), `weekdays` as text `"0,2,4"`, `active_to` |
| `/settings/`, one row with defaults | `/planner-settings/`, a list. A user can have 0 or more rows. Fields are `day_start_time` and `day_end_time`, and `work_days` is text. Empty values fall back to the scheduler defaults. |
| `DayOverride.max_hours` lowers the capacity of a day | `DayOverride` has `start_time` and `end_time` and **blocks that time**. With no times, it blocks the whole day. You cannot express "only 2 hours today". |
| `StudyBlock` with `start`/`end` datetimes, `status`, `locked` | `date`, `start_time`, `end_time`, `completed` |
| `/planner/blocks/`, `/planner/events/`, `/planner/alerts/`, `/planner/week/` | `/study-blocks/` only. Alerts come back from `generate`. |

### 2.3 Decisions to make now

| ID | Decision | Recommended |
| --- | --- | --- |
| `D1` | How do the components get the data they expect? | Keep the backend models as they are. Cody adds `GET /api/v1/planner/events/?start=&end=` that returns the section 4.3 `CalendarEvent` shape, with recurring commitments expanded. The calendar components then work as they are. Pages that edit data use `types/backend.ts`. |
| `D2` | How does the weekly progress view get its data? | Either Cody adds `/planner/week/` (section 4.4) or JP computes it on the client from `/projects/` and `/study-blocks/`. The endpoint is cleaner. The client version needs no backend work. |
| `D3` | How does a "low-energy day" work? | Model it as a `DayOverride` that blocks part of the day, for example 13:00 to 19:00. This needs no backend change. Otherwise add `max_hours` to `DayOverride`. |
| `D4` | Auth | Keep Basic auth for the demo. It already works end to end. |

### 2.4 Known bugs and cleanup

- `npm run build` fails: `components/EventItem.tsx` and `components/EventList.tsx` have untyped props (TS7031). Both are unused and read `event.project.colour`, which does not exist. Delete them or give them types.
- `frontend/package.json` lists `@fullcalendar/react` twice.
- `frontend/src/hooks/useSchedules.js` is empty.
- `backend/db.sqlite3.bak` is tracked in git. `*.sqlite3` is ignored, but `.bak` is not.
- `frontend/README.md` is still the Vite template.
- `api/serializers.py` uses `fields = "__all__"` for `Account`, so the password hash is in API responses. Make `password` write only.

### 2.5 What still needs to be done, in priority order

These are the tasks the demo in section 8 depends on. Do them in this order.

1. **`F0.1` (Robin):** install Tailwind and daisyUI and `react-router`. Replace the Vite demo in `App.tsx` with a layout, a navbar and routes for `/dashboard`, `/calendar`, `/tasks`, `/schedule` and `/settings`. Fix the build (2.4).
2. **`D1` and `B2.3` (Cody):** `/planner/events/` endpoint. **`F2.3` (JP):** connect the calendar and dashboard to it, and add a "Generate plan" button that uses `useGeneratePlan`.
3. **`F1.3`, `F2.1` and `F2.2` (Robin):** Projects, Commitments and Settings pages on the existing hooks.
4. **`F3.3` (JP):** an alerts panel that shows the `alerts` from `generate`. Put `PlanForDay` and `ProgressTracker` on the dashboard (`D2`).
5. **`B1.4` and `B4.4` (Justin):** `seed_demo` with the section 8 data, adjusted to the real models (date deadlines, whole hours, `DayOverride` as blocked time).
6. **`B1.2`, `B2.4` and `B3.3` (Justin):** validation, CRUD and permission tests in `api/tests.py`. When `completed_hours` reaches `estimated_hours`, set `status` to `completed`.
7. **`B4.1` (Cody) and `F4.1`/`F4.2` (Robin, JP):** marking a block done adds its hours to the project. "Life happens" actions call `generate` after each change.
8. **Phase 5:** `docs/ALGORITHM.md`, polish, slides, demo rehearsal.

---

## 3. Decisions to make in the first hour

The team makes these choices together before people split up. The recommended option is first.

| Topic | Recommended | Alternative | Why |
| --- | --- | --- | --- |
| Auth | DRF token auth. The frontend uses a seeded demo user until the login page works. | No login, one hard-coded user | Real login looks better in the demo and costs about one hour. |
| Time zone | `TIME_ZONE = 'America/Edmonton'`. The API sends ISO 8601 strings with an offset, for example `2026-11-20T14:00:00-07:00`. | UTC everywhere | Study blocks are local times. One rule for all four people prevents off-by-hours bugs. |
| Calendar UI | FullCalendar (`@fullcalendar/react` with `daygrid` and `timegrid`) | Hand-built month grid | FullCalendar gives month and week views at no cost. JP can spend the time on the dashboard. |
| Routing | `react-router` | One page with tabs | Pages map to the folders in the README. |
| Date helpers | `date-fns` | Plain `Date` | Week start, add days and formatting in a few lines. |
| Plan horizon | From now until the latest deadline, 60 days at most | Fixed 4 weeks | No wasted work on empty days. |
| Block sizes | 30 minutes minimum, 2 hours maximum, 15 minutes break between blocks | Fixed 1-hour blocks | Fits short gaps between classes and shifts. |

---

## 4. Shared API contract

> **Note (2026-11-14):** this is the contract the team **planned**. The real backend differs. Section 2.2 lists the differences, and `frontend/src/types/backend.ts` has the real shapes. Until the team settles decision `D1`, use `types/backend.ts` for anything that reads or writes the API.

Everyone codes against this contract from the start. The frontend uses mock data that matches it until the real endpoints exist. If you change the contract, update this section and tell your pair in the team chat.

All routes start with `/api/`. All routes except register and login need the header `Authorization: Token <token>`. Each user sees only their own data.

### 4.1 Data models

`projects.Task`: one piece of work with a deadline.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | int | |
| `title` | string | |
| `course` | string | Optional, for example "CMPE 2000" |
| `deadline` | datetime | |
| `estimated_hours` | decimal | Greater than 0 |
| `completed_hours` | decimal | 0 or more. Not more than `estimated_hours`. |
| `remaining_hours` | decimal | Read only. `estimated_hours - completed_hours`. |
| `priority` | int | 1 high, 2 medium, 3 low |
| `status` | string | `todo`, `in_progress` or `done` |
| `color` | string | Optional hex color for the calendar |

`schedules.Commitment`: time that is not free for study.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | int | |
| `title` | string | For example "Shift at Safeway" |
| `kind` | string | `work`, `extracurricular`, `personal` or `event` |
| `recurring` | bool | If true, use `weekdays`. If false, use `date`. |
| `weekdays` | int list | 0 is Monday, 6 is Sunday |
| `date` | date | One-off events only |
| `start_time`, `end_time` | time | `end_time` is after `start_time` |
| `active_from`, `active_until` | date | Optional limits for a recurring commitment |

`schedules.PlannerSettings`: one row per user. The register view creates it with default values.

| Field | Type | Default |
| --- | --- | --- |
| `day_start`, `day_end` | time | `09:00`, `19:00` |
| `work_days` | int list | `[0, 1, 2, 3, 4, 5, 6]` |
| `max_hours_per_day` | decimal | 6 |
| `min_block_minutes` | int | 30 |
| `max_block_minutes` | int | 120 |
| `break_minutes` | int | 15 |

`schedules.DayOverride`: a change to the study capacity of one date. This is how a low-motivation day or a sick day enters the planner.

| Field | Type | Notes |
| --- | --- | --- |
| `date` | date | Unique per user |
| `max_hours` | decimal | 0 means a day off |
| `reason` | string | `low_energy`, `sick`, `emergency` or `other` |
| `note` | string | Optional |

`planner.StudyBlock`: one scheduled session of work on a task.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | int | |
| `task` | int | Task ID |
| `start`, `end` | datetime | |
| `status` | string | `planned`, `done` or `missed` |
| `locked` | bool | If true, a replan does not move this block |

`Alert` is not stored. The planner computes it each time.

```json
{
  "task_id": 4,
  "task_title": "Capstone report",
  "deadline": "2026-11-21T23:59:00-07:00",
  "remaining_hours": 7,
  "available_hours": 5,
  "shortfall_hours": 2,
  "severity": "warning",
  "suggestions": [
    "Raise your daily limit from 6 to 7 hours on 2 days before Friday.",
    "Lower the priority of \"Reading notes\", which is due later.",
    "Ask for an extension or cut the estimate by 2 hours."
  ]
}
```

### 4.2 Endpoints

| Method | Path | Owner | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register/` | Justin | Create a user and their settings. Returns `{ token, user }`. |
| POST | `/api/auth/login/` | Justin | Returns `{ token }` |
| GET | `/api/auth/me/` | Justin | Current user |
| GET, POST | `/api/tasks/` | Justin | List and create tasks |
| GET, PATCH, DELETE | `/api/tasks/{id}/` | Justin | One task |
| POST | `/api/tasks/{id}/progress/` | Justin | Body `{ "hours": 1.5 }`. Adds to `completed_hours`. |
| GET, POST | `/api/commitments/` | Justin | List and create commitments |
| GET, PATCH, DELETE | `/api/commitments/{id}/` | Justin | One commitment |
| GET, PUT | `/api/settings/` | Justin | The user's planner settings |
| GET, POST | `/api/day-overrides/` | Justin | List and create day overrides |
| PATCH, DELETE | `/api/day-overrides/{id}/` | Justin | One day override |
| POST | `/api/planner/generate/` | Cody | Build a new plan. Returns `{ blocks, alerts }`. |
| GET | `/api/planner/blocks/?start=&end=` | Cody | Study blocks in a date range |
| PATCH | `/api/planner/blocks/{id}/` | Cody | Body `{ status }` or `{ locked }` |
| GET | `/api/planner/alerts/` | Cody | Current alerts |
| GET | `/api/planner/events/?start=&end=` | Cody | All calendar events in a range. See 4.3. |
| GET | `/api/planner/week/?start=YYYY-MM-DD` | Cody | Weekly dashboard summary. See 4.4. |

### 4.3 Calendar event shape

The backend expands recurring commitments into single events. The calendar then reads one list and does no date math.

```json
{
  "id": "block-12",
  "type": "study",
  "title": "Capstone report",
  "start": "2026-11-18T10:00:00-07:00",
  "end": "2026-11-18T12:00:00-07:00",
  "task_id": 4,
  "status": "planned",
  "locked": false,
  "kind": null,
  "color": "#7c3aed"
}
```

For a commitment, `type` is `"commitment"`, `id` is `"commitment-<id>-<date>"`, `kind` has a value and `task_id`, `status` and `locked` are `null`.

### 4.4 Weekly summary shape

```json
{
  "week_start": "2026-11-16",
  "planned_hours": 24,
  "done_hours": 9.5,
  "missed_hours": 1,
  "days": [
    { "date": "2026-11-16", "capacity_hours": 6, "planned_hours": 4, "done_hours": 4 }
  ],
  "tasks": [
    { "task_id": 4, "title": "Capstone report", "deadline": "2026-11-21T23:59:00-07:00",
      "estimated_hours": 10, "completed_hours": 3, "percent": 30, "at_risk": true }
  ]
}
```

---

## 5. Phases and tasks

### Phase 0: Setup and contract (hours 0 to 2)

Goal: both servers run from `main`, and everyone codes against the same contract.

| ID | Owner | Task | Depends on |
| --- | --- | --- | --- |
| `A0.1` | All | Read this document. Agree on section 3. Freeze section 4. | |
| `B0.1` | Justin | Fix the backend gaps in section 2. Correct the app names in each `apps.py`. Add `rest_framework`, `rest_framework.authtoken`, `corsheaders` and the four apps to `INSTALLED_APPS`. Allow CORS for `http://localhost:5173`. Set `TIME_ZONE`. Set the DRF default auth and permission classes. Add an `api/` include to `config/urls.py`. Merge to `main` first so everyone builds on it. | |
| `B0.2` | Cody | Create `backend/api/engine.py` as plain Python with dataclasses and no Django imports. Write the first tests in `backend/api/tests.py`. This work needs no models, so it starts at once. | |
| `F0.1` | Robin | Install Tailwind and daisyUI. Delete the Vite demo content. Create the `src/` folders from the README. Add `react-router` with routes `/login`, `/dashboard`, `/calendar`, `/tasks`, `/schedule` and `/settings`. Build a layout with a navbar. Pick a daisyUI theme. | |
| `F0.2` | JP | Write `src/types/api.ts` from section 4. Write `src/services/mocks.ts` with one week of events, three tasks and one alert. Install FullCalendar and `date-fns`. | |

Done when: `python manage.py runserver` and `npm run dev` both start on `main`, and `src/types/api.ts` matches section 4.

### Phase 1: Core data (hours 2 to 8)

Goal: a user signs in and creates tasks through the real API.

| ID | Owner | Task | Depends on |
| --- | --- | --- | --- |
| `B1.1` | Justin | Models `Task`, `Commitment`, `PlannerSettings` and `DayOverride`. Migrations. Register all of them in Django admin. | `B0.1` |
| `B1.2` | Justin | Serializers and viewsets for the four models. Filter every query by `request.user`. Make sure that the data follows the rules in section 4.1. | `B1.1` |
| `B1.3` | Justin | Auth endpoints: register, login (DRF `obtain_auth_token`) and me. Register also creates `PlannerSettings`. | `B1.1` |
| `B1.4` | Justin | Management command `python manage.py seed_demo`. It creates a demo user with the data in section 8. | `B1.1` |
| `B1.5` | Cody | Free-time builder in `engine.py`. Input: settings, commitments, day overrides, a date range. Output: free intervals per day and the study capacity of each day. Tests for overlaps, days off and overrides. | `B0.2` |
| `B1.6` | Cody | `StudyBlock` model and migration. | `B0.1` |
| `F1.1` | Robin | `src/services/api.ts`: a `fetch` wrapper. It reads the base URL from `VITE_API_URL`, adds the token header, and parses JSON errors. If `VITE_USE_MOCKS=true`, it uses `mocks.ts` instead. | `F0.1`, `F0.2` |
| `F1.2` | Robin | Login and register pages. Keep the token in `localStorage`. Add a route guard that sends signed-out users to `/login`. | `F1.1` |
| `F1.3` | Robin | Tasks page: list with a progress bar per task, a create and edit form in a daisyUI modal, delete, mark done and "log hours". | `F1.1` |
| `F1.4` | JP | Calendar page on mock events: month view and week view, colors by event type, a detail modal on click. | `F0.2` |
| `F1.5` | JP | Dashboard layout on mock data: week strip, hours card, task progress list, alerts panel. | `F0.2` |

Checkpoint 1 (about hour 8): Robin's Tasks page creates, edits and deletes real tasks on Justin's API. Pull `main` on all four machines.

### Phase 2: Scheduler MVP (hours 6 to 14)

Goal: a user clicks "Generate plan" and sees study blocks on the calendar.

| ID | Owner | Task | Depends on |
| --- | --- | --- | --- |
| `B2.1` | Cody | Placement function in `engine.py` (section 6, steps 3 to 5). Tests: one task, two tasks with close deadlines, the daily limit, the minimum block size, a deadline that falls before any free time. | `B1.5` |
| `B2.2` | Cody | `POST /api/planner/generate/`: load the user's data, call the engine, delete future `planned` blocks that are not locked, save the new blocks, return blocks and alerts. | `B2.1`, `B1.6`, `B1.1` |
| `B2.3` | Cody | `GET /api/planner/blocks/` and `GET /api/planner/events/` (section 4.3). | `B2.2` |
| `B2.4` | Justin | API tests in `backend/tests/`: CRUD for each model, and a test that user A cannot read the data of user B. | `B1.2` |
| `B2.5` | Justin | Make sure that `seed_demo` data gives an interesting plan: some shifts, one task that fits and one that does not. Pair with Cody to run `generate` on it. | `B1.4`, `B2.2` |
| `F2.1` | Robin | Schedule page: list of commitments and a form. If `recurring` is on, the form shows a weekday picker. If it is off, the form shows a date picker. | `F1.1` |
| `F2.2` | Robin | Settings page: work window, work days, daily hour limit, block sizes, break length. | `F1.1` |
| `F2.3` | JP | Connect the calendar to `/api/planner/events/`. Add a "Generate plan" button that calls `generate` and reloads the events. | `F1.4`, `B2.3` |

Checkpoint 2 (about hour 14): a user adds tasks and commitments in the UI, clicks "Generate plan" and sees study blocks around the commitments.

### Phase 3: Feasibility alerts and dashboard (hours 12 to 18)

Goal: the README example (10 hours estimated, 3 done, 5 free) shows a warning in the UI.

| ID | Owner | Task | Depends on |
| --- | --- | --- | --- |
| `B3.1` | Cody | Feasibility check and suggestions (section 6, step 6). A test for the README example must give `shortfall_hours = 2`. | `B2.1` |
| `B3.2` | Cody | `GET /api/planner/alerts/` and `GET /api/planner/week/` (section 4.4). | `B3.1` |
| `B3.3` | Justin | `POST /api/tasks/{id}/progress/`. If `completed_hours` reaches `estimated_hours`, set `status` to `done`. | `B1.2` |
| `F3.1` | Robin | Show an alert badge on each at-risk task on the Tasks page. If "Generate plan" gives new alerts, show a toast. | `F1.3`, `B3.2` |
| `F3.2` | Robin | Shared components in `components/common/`: form fields, modal, toast, spinner, empty state, error message. Use them on all of Robin's pages. | `F0.1` |
| `F3.3` | JP | Connect the dashboard to `/api/planner/week/` and `/api/planner/alerts/`: hours planned against hours done, a bar per day, task progress bars, an alerts panel with the suggestions. | `F1.5`, `B3.2` |

Checkpoint 3 (about hour 18): the demo user sees the Capstone warning on the dashboard and on the Tasks page.

### Phase 4: Replanning (hours 16 to 22)

Goal: when life happens, the plan changes by itself.

| ID | Owner | Task | Depends on |
| --- | --- | --- | --- |
| `B4.1` | Cody | `PATCH /api/planner/blocks/{id}/`. Status `done` adds the block length to the task's `completed_hours`. Status `missed` keeps the block as a record and triggers a replan. `locked` pins a block. | `B2.2` |
| `B4.2` | Cody | Service function `replan(user)` in `planner/services.py`. It keeps past, done and locked blocks, and plans again from now. | `B2.2` |
| `B4.3` | Justin | Call `replan(user)` after each create, update and delete of a task, commitment, day override or the settings. | `B4.2`, `B1.2` |
| `B4.4` | Justin | Finish `seed_demo` so that it matches the demo script in section 8 exactly. | `B2.5` |
| `F4.1` | Robin | "Life happens" quick actions on the dashboard: "Add emergency" (a one-off commitment), "Low-energy day" (a day override for today with fewer hours), "New task". After each one, reload events, alerts and the weekly summary. | `F3.3`, `B4.3` |
| `F4.2` | JP | Buttons in the calendar event modal: "Done", "Missed" and "Lock". After each one, reload the calendar and show a "Plan updated" toast. | `F2.3`, `B4.1` |

Checkpoint 4 (about hour 22): feature freeze. After this point, merge bug fixes only.

### Phase 5: Polish and demo (last 2 to 4 hours)

| ID | Owner | Task |
| --- | --- | --- |
| `A5.1` | All | Run the demo script in section 8 three times on a fresh database. Fix the bugs you find. |
| `B5.1` | Justin | Update the "Getting started" section in the README with the real commands, including `seed_demo`. |
| `B5.2` | Cody | Write `docs/ALGORITHM.md`: one page and one diagram that explain the planner to the judges. |
| `F5.1` | Robin | Visual polish: spacing, colors, mobile width, loading and empty states. |
| `F5.2` | JP | Pitch slides and the demo script in `docs/`. Lead the rehearsal. |
| `A5.2` | All | Fill in the "Human review" field of your own entries in `Prompts.md`. |

---

## 6. Scheduling algorithm (Cody)

> **Status:** built in `backend/api/scheduler.py` and called from `GeneratePlanView` in `api/views.py`. Differences from the plan below: priority is sorted with higher numbers first (0 to 10). Day overrides block time instead of setting `max_hours`. A project with no deadline fills time up to 14 days ahead.

The MVP uses earliest deadline first (EDF): work on the task that is due soonest. For one person who can split work into blocks, EDF is a known optimal rule. If EDF cannot meet a deadline, no other order can meet it either. This gives the feasibility alert a solid base.

Inputs: the current time, `PlannerSettings`, commitments, day overrides, open tasks and the blocks to keep (past, `done` or `locked`).

1. Set the horizon. Start at now, rounded up to the next 15 minutes. End at the latest open deadline, 60 days at most.
2. Build free time for each day in the horizon. If the day is not in `work_days`, skip it. Start with `day_start` to `day_end`. Remove commitment times and kept blocks. If the day has an override, set the day capacity to its `max_hours`. If not, use `max_hours_per_day`. Subtract the hours of kept blocks on that day.
3. Sort open tasks by deadline, then by priority, then by remaining hours (largest first).
4. For each task, find the hours left to place: `estimated_hours - completed_hours - hours in kept future blocks`.
5. Walk the free intervals in time order, up to the task deadline. Place a block with the length `min(max_block, hours left, interval length, day capacity left)`. If that length is less than `min_block` and less than the hours left, skip the interval. After each block, leave `break_minutes` free. Update the interval and the day capacity.
6. If hours are still left after the walk, create an alert:
   - `available_hours` is the hours that the planner placed for the task.
   - `shortfall_hours` is the hours left.
   - If the shortfall is more than half of the remaining hours, `severity` is `critical`. If not, it is `warning`.
   - Suggestions come from three sources:
     - the extra daily hours that the days before the deadline need
     - tasks due later that can drop in priority
     - an extension or a smaller estimate

Keep `engine.py` free of Django imports. Then the tests run fast and need no database. `services.py` loads the models, converts them to dataclasses, calls the engine and saves the results.

A known limit: EDF fills the earliest days first, so later days stay empty. If time permits, add a "spread" option that moves blocks later while every deadline still holds.

---

## 7. How we work together

### Git

1. Merge to `main` through pull requests only.
2. Ask one person to review each pull request. Backend people review backend work. Frontend people review frontend work.
3. Name branches `<name>/<task-id>-<short-name>`, for example `cody/b2.1-placement`.
4. Pull `main` at each checkpoint and before you start a new task.
5. Keep pull requests small. One task ID per pull request is ideal.

### Files with a high risk of merge conflicts

| File | Rule |
| --- | --- |
| `Prompts.md` | Append only. Pull `main` before you add an entry. If two entries get the same number, renumber yours. |
| `backend/config/settings.py` | Justin owns it. Ask Justin before you change it. |
| `backend/config/urls.py` | All endpoints live in `backend/api/urls.py`. The root file only includes it under `api/v1/`. |
| `frontend/src/types/api.ts` | JP owns it after Phase 0. A change here needs the same change in the backend serializer and in section 4. |

### Definition of done for a task

- The feature works against the real API, not only the mocks.
- The browser console and the Django log show no errors.
- The pull request is merged to `main`.
- If you used AI, `Prompts.md` has an entry.

---

## 8. Demo script and seed data

The demo takes about 4 minutes. `seed_demo` (`B1.4`, `B4.4`) creates this data for user `demo` so the demo is the same each time.

Demo user: a student with a part-time job.

| Type | Data |
| --- | --- |
| Settings | 09:00 to 19:00, 6 hours a day at most |
| Commitment | Work shift, Tuesday and Thursday, 13:00 to 19:00 |
| Commitment | Basketball practice, Monday and Wednesday, 17:00 to 19:00 |
| Commitment | Dentist, one-off, Wednesday 10:00 to 11:00 |
| Task | Capstone report: due Friday, 10 hours estimated, 3 done. With the shifts, only 5 free hours remain. This task triggers the README warning. |
| Task | Math assignment: due next Monday, 4 hours estimated, 0 done |
| Task | Reading notes: due in 10 days, 3 hours estimated, 1 done |

Steps:

1. Sign in as `demo`. The dashboard shows this week and one red alert.
2. Open the Tasks and Schedule pages to show the inputs.
3. Open the calendar. Study blocks fill the gaps around the shifts and practice.
4. Open the alert. It says 7 hours remain, 5 are free and 2 are missing. It shows the suggestions.
5. Life happens: add "Car broke down" tomorrow 13:00 to 17:00. The blocks move.
6. Click "Low-energy day" for today. Today's blocks shrink and move to later days.
7. Mark a block done. The progress bar moves.
8. Close with one sentence on EDF and point at `Prompts.md` for AI transparency.

---

## 9. Stretch goals

If the demo flow has no bugs after Checkpoint 4, start these. Do not start them earlier.

| Idea | Owner |
| --- | --- |
| Drag a study block to a new time. The block becomes locked. | JP with Cody |
| "Spread" mode that moves work away from the first days (section 6) | Cody |
| Light and dark theme switch with daisyUI themes | Robin |
| Import a school timetable from an `.ics` file | Justin |
| Focus timer on a study block. When the timer ends, it logs the hours. | Robin |
| Weekly streak and "hours studied" history chart | JP |

---

## 10. Risks

| Risk | Sign | Response |
| --- | --- | --- |
| Time zone bugs | Blocks show one or more hours off | Use the rule in section 3 everywhere. Test with the seed data at Checkpoint 2. |
| The algorithm takes too long | `B2.1` not done by hour 12 | Ship placement without the break and minimum block rules. Add them in Phase 4. |
| Late integration | Frontend still on mocks at hour 14 | Hold a 15-minute integration session at each checkpoint, with all four people. |
| Contract drift | 400 errors or missing fields | Change section 4 first, then the code. Tell your pair. |
| Scope creep | Stretch work before Checkpoint 4 | Stop and finish the demo flow first. |
