# Team Crashouts — Adaptive Study Planner

Our project for the **Hack-A-Ton Hackathon**.

**Category:** Education

---

## The problem

Many people struggle to manage their time. Doomscrolling and procrastination crowd out the work that actually matters. Students have it especially hard: school is only one of their commitments, alongside jobs, extracurriculars, hobbies and rest. Static planners can't keep up when life gets in the way.

## Our solution

An **adaptive study planner** that:

1. **Collects your constraints.** These include work shifts, extracurriculars, personal time (hobbies, games, breaks) and your preferred working hours.
2. **Takes your tasks.** Each one has a deadline and an estimate of how many hours it needs.
3. **Builds a study timetable** automatically and shows it in a calendar view.
4. **Re-plans when life happens.** If an emergency, a low-motivation day or a new task comes up, the schedule adjusts around it.
5. **Warns you early.** If the hours a task still needs are more than the free hours left before its deadline, the app alerts you and suggests what to do.

> **Example:** A project is estimated at **10 hrs**. You've done **3 hrs**, so **7 hrs** remain, but only **5 hrs** of available time are left before the deadline. The planner shows a warning and suggests adding time or reprioritising.

---

## Features

### Core system

- **Scheduling algorithm:** places task work blocks into free time, respecting deadlines, work windows and other commitments.
- **Calendar view:** a monthly view of all scheduled events and study blocks.
- **Dashboard:** this week's schedule plus progress tracking for time management.
- **Feasibility alerts:** flags tasks that can't be finished in time.

### Data inputs

| Input | Details |
| --- | --- |
| **Projects / tasks** | Deadline, estimated hours, hours completed, completion status |
| **Other schedules** | Work, extracurriculars, personal time, one-off events |
| **Work window** | Default daily window (e.g. 9am–7pm) and a max daily work limit to prevent burnout |

---

## Tech stack

| Layer | Tech |
| --- | --- |
| Backend | Python, Django 6.1, Django REST Framework, `django-cors-headers`, SQLite |
| Frontend | React 19, TypeScript, Vite, TanStack Query, FullCalendar v7, Tailwind CSS + daisyUI |
| Not used | `react-router` (views switch through state in `App.tsx`) and `date-fns` (date helpers live in `src/lib/dates.ts`) |

---

## Project structure

```text
Team-Crashouts-Hackathon-Project/
├── backend/                     # Django API
│   ├── config/                  # Settings (TIME_ZONE America/Edmonton), root URLs (api/ at /api/v1/)
│   ├── api/                     # The one Django app
│   │   ├── models.py            # Account, Project, Commitment, PlannerSettings, DayOverride, StudyBlock
│   │   ├── serializers.py
│   │   ├── views.py             # CRUD viewsets, planner generate, events and week views
│   │   ├── urls.py
│   │   ├── scheduler.py         # EDF planning algorithm (plain Python, no Django)
│   │   ├── test_scheduler.py    # Planner and planner endpoint tests
│   │   ├── test_seed_demo.py    # Demo data and demo script tests
│   │   ├── management/commands/seed_demo.py  # Demo account (ROADMAP section 8)
│   │   └── migrations/
│   └── requirements.txt
├── frontend/                    # React + TypeScript client
│   └── src/
│       ├── App.tsx              # Navbar, view switching, login gate, settings modal
│       ├── api/api.js           # fetch wrapper with Basic auth
│       ├── hooks/               # TanStack Query hooks per resource, usePlannerData, usePlanStatus, useGeneratePlan
│       ├── lib/                 # events.ts (backend records -> calendar events and weekly summary), dates, progress
│       ├── components/          # Calendars, PlanForDay, ProgressTracker, EventDetails, Modal, ConfirmDialog
│       │   └── forms/           # Task, Commitment, DayOverride, Settings and LogHours forms
│       ├── pages/               # Login, Register, Dashboard, Calendar, Tasks, Schedule
│       └── types/               # backend.ts (real API records), api.ts (calendar and summary shapes)
├── docs/ROADMAP.md              # Task plan, status and what is left
├── Prompts.md                   # AI prompt log index (links to each person's log)
├── prompts/                     # One AI prompt log per team member
└── README.md
```

---

## Getting started

### Backend (Django)

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate   |   macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser   # optional, for /admin/
python manage.py runserver         # http://127.0.0.1:8000
python manage.py seed_demo         # demo account: demo / demo1234 (resets on each run)
python manage.py test api          # 30 tests
```

`seed_demo` creates a student with shifts, classes and three projects, with dates relative to today. After you click **Generate plan**, one project shows the "7 hours left, only 5 free" alert. Run it again right before a demo to reset the account. Options: `--password`, `--username`, `--today YYYY-MM-DD`. You can also create your own user through the sign-up page.

### Frontend (React)

```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173
```

The frontend calls `http://127.0.0.1:8000/api/v1/` by default. To change it, set `VITE_API_URL` in `frontend/.env`.

`npm run build` creates a production build in `frontend/dist/`.

### Using the app

1. Start both servers and open http://localhost:5173. Sign in as `demo` / `demo1234` (after `seed_demo`), or register.
2. On the **Dashboard**, follow the getting-started checklist:
   - Add tasks (projects) with a deadline and an hour estimate.
   - Add commitments such as shifts and practices.
   - Set your study hours in **Planner settings**.
3. Click **Generate plan**. Study blocks appear on the weekly and monthly calendars. Projects that can't fit before their deadline show an alert with suggestions.
4. When plans change, use **+ Add commitment** or **Can't study today**, then click **Regenerate**. The plan does not update by itself.
5. Click a study block and choose **Mark as done** to log progress. On the **Tasks** view, use **Log hours** for work done outside a block.

### API overview

All routes start with `/api/v1/` and use HTTP Basic auth. Each user sees only their own records.

| Route | Purpose |
| --- | --- |
| `POST accounts/` | Sign up (no login needed) |
| `GET accounts/me/` | Current user, also used to check a login |
| `projects/` | Tasks with a deadline and hour estimates (`?status=`) |
| `commitments/` | Shifts, practices and one-off events, recurring or not |
| `planner-settings/` | Work window, work days, daily limit, block sizes |
| `day-overrides/` | Time blocked on one date (sick day, emergency) |
| `study-blocks/` | Scheduled study sessions (`?date=`, `?project=`, `?completed=`) |
| `GET planner/events/?start=&end=` | Calendar events in a date range: study blocks, commitments (recurring ones expanded) and day overrides. `end` is exclusive. The frontend does not use it: it builds events in `lib/events.ts`. |
| `GET planner/week/?start=` | Weekly summary: hours planned, done and missed, daily capacity, and project progress with at-risk flags. Not used by the frontend yet. |
| `POST planner/generate/` | Build a new plan. Body: `{ "now": "2026-11-18T14:30-06:00", "dry_run": false }`. A `now` with an offset is converted to America/Edmonton. Returns `{ now, blocks, alerts }`. |

---

## Status and roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md), section 2, for the status of each task, the known bugs and the order of the remaining work.

**Done**

- [x] Data models and REST API for all of them, scoped to the logged-in user
- [x] Sign up and login (Basic auth)
- [x] Scheduling algorithm: earliest deadline first, with breaks, block sizes and a daily limit
- [x] Feasibility alerts with suggestions
- [x] Backend tests for the planner, its endpoints and the demo data (30 passing)
- [x] `seed_demo` command with the demo data
- [x] `npm run build` passes
- [x] App shell with Tailwind + daisyUI, light and dark mode, and mobile layout
- [x] Tasks, Schedule (commitments and time off) and Settings forms
- [x] Dashboard: weekly calendar, day plan, progress tracker, alerts panel, "Generate plan" and quick actions
- [x] Monthly calendar on real data, with event details
- [x] Mark study blocks done and log hours, which updates project progress

**Still to do** (in priority order; details in roadmap section 2.5)

- [ ] Rehearse the demo script on a fresh database
- [ ] Pick one version of the calendar events and summary logic, frontend or backend (roadmap `D5`)
- [ ] Hide the password hash in account responses; server-side validation; CRUD and permission tests
- [ ] At-risk badges on the Tasks page; keep alerts after a page reload
- [ ] Polish, `docs/ALGORITHM.md`, slides
- [ ] Stretch: routing, automatic replanning, decimal hours, "Missed" and "Lock" for blocks

---

## Team

Team Crashouts
