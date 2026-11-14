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
