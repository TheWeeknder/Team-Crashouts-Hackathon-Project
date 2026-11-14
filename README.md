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
| Backend | Python, Django (+ Django REST Framework for the API) |
| Frontend | React, TypeScript, Tailwind CSS + daisyUI |

---

## Project structure

```text
Team-Crashouts-Hackathon-Project/
├── backend/                  # Django API
│   ├── config/               # Django project settings, root URLs, WSGI/ASGI
│   ├── apps/
│   │   ├── accounts/         # Users and auth
│   │   ├── projects/         # Projects/tasks: deadlines, estimates, progress
│   │   ├── schedules/        # Other commitments and work-window settings
│   │   └── planner/          # Scheduling algorithm and feasibility alerts
│   ├── tests/
│   └── requirements.txt
├── frontend/                 # React + TypeScript client
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── calendar/     # Monthly calendar view
│       │   ├── dashboard/    # Weekly schedule and progress widgets
│       │   └── common/       # Shared UI (buttons, modals, forms)
│       ├── pages/            # Route-level pages
│       ├── services/         # API client for the Django backend
│       ├── hooks/            # Custom React hooks
│       ├── types/            # Shared TypeScript types
│       └── utils/            # Date/time helpers
├── docs/                     # Design notes, diagrams, pitch material
├── Prompts.md                # AI prompt tracker
└── README.md
```

---

## Getting started

> These commands scaffold the empty folders. Run them once, then commit the result.

### Backend (Django)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate   |   macOS/Linux: source .venv/bin/activate
pip install django djangorestframework django-cors-headers
pip freeze > requirements.txt
django-admin startproject config .
python manage.py startapp accounts apps/accounts   # repeat for projects, schedules, planner
python manage.py migrate
python manage.py runserver                         # http://localhost:8000
```

### Frontend (React + TypeScript + daisyUI)

```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss @tailwindcss/vite daisyui
npm run dev                                        # http://localhost:5173
```

---

## Roadmap

- [ ] Data models: projects/tasks, commitments, work-window settings
- [ ] REST API endpoints for those models
- [ ] Scheduling algorithm (MVP: greedy, earliest-deadline-first)
- [ ] Feasibility check and alerts
- [ ] Monthly calendar view
- [ ] Weekly dashboard with progress tracking
- [ ] Re-scheduling when events change (emergencies, missed sessions)
- [ ] Polish and demo

---

## Team

Team Crashouts
