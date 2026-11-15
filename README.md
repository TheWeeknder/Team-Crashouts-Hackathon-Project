# Team Crashouts — Adaptive Study Planner

Our project for the **Hack-A-Ton Hackathon**.

**Category:** Education / Wildcard

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
| Frontend | React 19, TypeScript, Vite, TanStack Query, FullCalendar v7 |
| Planned, not installed yet | Tailwind CSS + daisyUI, `react-router`, `date-fns` |

---

## Project structure

```text
Team-Crashouts-Hackathon-Project/
├── backend/                     # Django API
│   ├── config/                  # Settings, root URLs (mounts api/ at /api/v1/), WSGI/ASGI
│   ├── api/                     # The one Django app
│   │   ├── models.py            # Account, Project, Commitment, PlannerSettings, DayOverride, StudyBlock
│   │   ├── serializers.py
│   │   ├── views.py             # CRUD viewsets + GeneratePlanView
│   │   ├── urls.py
│   │   ├── scheduler.py         # EDF planning algorithm (plain Python, no Django)
│   │   ├── test_scheduler.py    # Scheduler and generate-endpoint tests
│   │   └── migrations/
│   └── requirements.txt
├── frontend/                    # React + TypeScript client
│   └── src/
│       ├── api/api.js           # fetch wrapper with Basic auth
│       ├── hooks/               # TanStack Query hooks, one per resource, plus useGeneratePlan
│       ├── components/          # MonthlyCalendar, WeeklyCalendar, PlanForDay, ProgressTracker
│       ├── pages/               # Login, Register, Dashboard, Calendar
│       ├── services/mocks.ts    # Mock data in the planned contract shape
│       └── types/               # api.ts (planned contract), backend.ts (real API)
├── docs/ROADMAP.md              # Task plan, status and what is left
├── Prompts.md                   # AI prompt log
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
python manage.py test api          # 16 tests
```

There is no demo seed command yet (`seed_demo`, see the roadmap). Create a user through the sign-up page, `POST /api/v1/accounts/` or the Django admin.

### Frontend (React)

```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173
```

The frontend calls `http://127.0.0.1:8000/api/v1/` by default. To change it, set `VITE_API_URL` in `frontend/.env`.

> **Known issue:** `npm run build` fails on type errors in two unused components, `EventItem.tsx` and `EventList.tsx`. `npm run dev` still works.

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
| `POST planner/generate/` | Build a new plan. Body: `{ "now": "2026-11-18T14:30", "dry_run": false }`. Returns `{ now, blocks, alerts }`. |

---

## Status and roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md), section 2, for the status of each task, the known bugs and the order of the remaining work.

**Done**

- [x] Data models and migrations (one `api` app)
- [x] REST API for all models, scoped to the logged-in user
- [x] Sign up and login (Basic auth)
- [x] Scheduling algorithm: earliest deadline first, with breaks, block sizes and a daily limit
- [x] Feasibility alerts with suggestions, returned by `planner/generate/`
- [x] Scheduler and generate-endpoint tests (16 passing)
- [x] Frontend API client and data hooks for every resource
- [x] Login and register pages
- [x] Monthly and weekly calendar, day plan and progress components (on mock data)

**Still to do**

- [ ] Frontend app shell: Tailwind + daisyUI, routing, navbar. Replace the Vite demo page in `App.tsx` and fix the build.
- [ ] Decide how the frontend gets calendar-shaped data: a `/planner/events/` endpoint or a client adapter (roadmap `D1`)
- [ ] Connect the calendar and dashboard to real data, and add a "Generate plan" button
- [ ] Projects, Commitments and Settings pages
- [ ] Alerts panel and weekly progress on the dashboard
- [ ] Re-plan when life happens: mark blocks done or missed, add an emergency or a low-energy day, then regenerate
- [ ] `seed_demo` command with the demo data
- [ ] Input validation and CRUD/permission tests; hide the password hash in account responses
- [ ] Polish, `docs/ALGORITHM.md`, slides and demo rehearsal

---

## Team

Team Crashouts
