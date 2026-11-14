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
- **Human review:** _TBD_

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
  File \"/usr/lib/python3.13/importlib/__init__.py\", line 88, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File \"<frozen importlib._bootstrap>\", line 1387, in _gcd_import
  File \"<frozen importlib._bootstrap>\", line 1360, in _find_and_load
  File \"<frozen importlib._bootstrap>\", line 1324, in _find_and_load_unlocked
ModuleNotFoundError: No module named 'projects'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File \"/home/cody/github/NAIT/Team-Crashouts-Hackathon-Project/backend/manage.py\", line 22, in <module>
    main()
    ~~~~^^
  File \"/home/cody/github/NAIT/Team-Crashouts-Hackathon-Project/backend/manage.py\", line 18, in main
    execute_from_command_line(sys.argv)
    ~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^
  File \"/home/cody/github/NAIT/Team-Crashouts-Hackathon-Project/backend/.venv/lib/python3.13/site-packages/django/core/management/__init__.py\", line 443, in execute_from_command_line
    utility.execute()
    ~~~~~~~~~~~~~~~^^
  File \"/home/cody/github/NAIT/Team-Crashouts-Hackathon-Project/backend/.venv/lib/python3.13/site-packages/django/core/management/__init__.py\", line 417, in execute
    django.setup()
    ~~~~~~~~~~~~^^
  File \"/home/cody/github/NAIT/Team-Crashouts-Hackathon-Project/backend/.venv/lib/python3.13/site-packages/django/__init__.py\", line 24, in setup
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
