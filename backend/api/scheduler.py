"""Study planner: earliest-deadline-first (EDF) scheduling.

This module is plain Python with no Django imports, so it is easy to test.
`views.GeneratePlanView` converts the database rows into the dataclasses
below, calls `build_plan`, and saves the result as StudyBlock rows.

How it works:

1. Find free time on each day from now to the latest deadline (60 days at
   most): the work window from the planner settings, minus commitments,
   day overrides and study blocks we keep (completed or in the past).
   Each day also has a study limit (`max_hours_per_day`).
2. Sort open projects by deadline, then priority (higher first), then
   remaining hours (larger first).
3. For each project, fill the earliest free time before its deadline with
   blocks between `min_block_minutes` and `max_block_minutes` long, with
   `break_minutes` between blocks.
4. If a project still has hours left, add an alert with the shortfall.

For one person who can split work into blocks, EDF is optimal for meeting
deadlines: if EDF cannot fit a project before its deadline, no other order
can. So an alert means the work really does not fit.

All times are local wall-clock times (naive datetimes).
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta

HORIZON_DAYS_MAX = 60
HORIZON_DAYS_NO_DEADLINE = 14
ROUND_MINUTES = 15
# Project.status values that mean "do not schedule".
DONE_STATUSES = {"completed", "skipped"}


# --- Inputs -------------------------------------------------------------------


@dataclass
class Settings:
    day_start: time = time(9, 0)
    day_end: time = time(19, 0)
    work_days: frozenset[int] = frozenset(range(7))  # 0 = Monday
    max_minutes_per_day: int = 6 * 60
    min_block_minutes: int = 30
    max_block_minutes: int = 120
    break_minutes: int = 15


@dataclass
class Commitment:
    title: str
    start_time: time | None
    end_time: time | None
    recurring: bool = False
    weekdays: frozenset[int] = frozenset()  # used if recurring
    date: date | None = None  # used if not recurring
    active_from: date | None = None
    active_to: date | None = None

    def occurs_on(self, day: date) -> bool:
        if self.active_from and day < self.active_from:
            return False
        if self.active_to and day > self.active_to:
            return False
        if self.recurring:
            return day.weekday() in self.weekdays
        return self.date == day


@dataclass
class DayOverride:
    """Time that is not available on one date. No times means the whole day."""

    date: date
    start_time: time | None = None
    end_time: time | None = None


@dataclass
class Project:
    id: int
    title: str
    deadline: date | None
    estimated_hours: float | None
    completed_hours: float | None = 0
    priority: int | None = None
    status: str | None = None

    @property
    def remaining_minutes(self) -> int:
        estimated = self.estimated_hours or 0
        completed = self.completed_hours or 0
        return max(0, round((estimated - completed) * 60))

    @property
    def is_open(self) -> bool:
        status = (self.status or "").strip().lower()
        return status not in DONE_STATUSES and self.remaining_minutes > 0


@dataclass
class KeptBlock:
    """An existing study block that the new plan must work around."""

    date: date
    start_time: time
    end_time: time


# --- Outputs ------------------------------------------------------------------


@dataclass
class PlannedBlock:
    project_id: int
    date: date
    start_time: time
    end_time: time


@dataclass
class Alert:
    project_id: int
    project_title: str
    deadline: date | None
    remaining_hours: float
    available_hours: float
    shortfall_hours: float
    severity: str  # "warning" or "critical"
    suggestions: list[str] = field(default_factory=list)


@dataclass
class Plan:
    blocks: list[PlannedBlock]
    alerts: list[Alert]


# --- Helpers ------------------------------------------------------------------


def parse_weekdays(text: str | None, default: frozenset[int] = frozenset()) -> frozenset[int]:
    """Parses "0,2,4" (the backend stores weekdays as text). Ignores junk."""
    days = set()
    for part in (text or "").replace(" ", "").split(","):
        if part.isdigit() and 0 <= int(part) <= 6:
            days.add(int(part))
    return frozenset(days) if days else default


def _round_up(moment: datetime, minutes: int = ROUND_MINUTES) -> datetime:
    moment = moment.replace(second=0, microsecond=0)
    extra = (-moment.minute) % minutes
    return moment + timedelta(minutes=extra)


def _minutes(start: datetime, end: datetime) -> int:
    return int((end - start).total_seconds() // 60)


def _subtract(free: list[list[datetime]], busy_start: datetime, busy_end: datetime) -> list[list[datetime]]:
    """Removes [busy_start, busy_end) from a sorted list of free intervals."""
    result = []
    for start, end in free:
        if busy_end <= start or busy_start >= end:
            result.append([start, end])
            continue
        if start < busy_start:
            result.append([start, busy_start])
        if busy_end < end:
            result.append([busy_end, end])
    return result


def _span(day: date, start: time | None, end: time | None) -> tuple[datetime, datetime]:
    """A time range on a day. A missing time means the start or end of the day."""
    begin = datetime.combine(day, start or time.min)
    finish = datetime.combine(day, end) if end else datetime.combine(day + timedelta(days=1), time.min)
    return begin, finish


def _fmt_hours(minutes: float) -> float:
    return round(minutes / 60, 2)


@dataclass
class _Day:
    date: date
    free: list[list[datetime]]
    capacity: int  # study minutes still allowed


# --- Main entry point ---------------------------------------------------------


def build_plan(
    now: datetime,
    settings: Settings,
    projects: list[Project],
    commitments: list[Commitment] = (),
    overrides: list[DayOverride] = (),
    kept_blocks: list[KeptBlock] = (),
) -> Plan:
    open_projects = [p for p in projects if p.is_open]
    today = now.date()

    deadlines = [p.deadline for p in open_projects if p.deadline and p.deadline >= today]
    if deadlines:
        last_day = min(max(deadlines), today + timedelta(days=HORIZON_DAYS_MAX - 1))
    else:
        last_day = today + timedelta(days=HORIZON_DAYS_NO_DEADLINE - 1)
    # Projects without a deadline fill time after the others, up to last_day.
    if any(p.deadline is None for p in open_projects):
        last_day = max(last_day, today + timedelta(days=HORIZON_DAYS_NO_DEADLINE - 1))

    days = _free_days(now, last_day, settings, commitments, overrides, kept_blocks)

    def sort_key(p: Project):
        # Project.priority is 0-10. We treat a higher number as more important.
        return (p.deadline or date.max, -(p.priority or 0), -p.remaining_minutes, p.id)

    blocks: list[PlannedBlock] = []
    alerts: list[Alert] = []
    for project in sorted(open_projects, key=sort_key):
        deadline = project.deadline or last_day
        needed = project.remaining_minutes
        placed = _place(project, needed, deadline, days, settings, blocks)
        if placed < needed:
            alerts.append(_make_alert(project, needed, placed, today, days, settings))

    blocks.sort(key=lambda b: (b.date, b.start_time))
    return Plan(blocks=blocks, alerts=alerts)


def _free_days(now, last_day, settings, commitments, overrides, kept_blocks) -> list[_Day]:
    days = []
    earliest = _round_up(now)
    day = now.date()
    while day <= last_day:
        if day.weekday() in settings.work_days:
            start = max(datetime.combine(day, settings.day_start), earliest)
            end = datetime.combine(day, settings.day_end)
            free = [[start, end]] if start < end else []

            for c in commitments:
                if c.occurs_on(day):
                    free = _subtract(free, *_span(day, c.start_time, c.end_time))
            for o in overrides:
                if o.date == day:
                    free = _subtract(free, *_span(day, o.start_time, o.end_time))

            capacity = settings.max_minutes_per_day
            for b in kept_blocks:
                if b.date == day:
                    b_start, b_end = _span(day, b.start_time, b.end_time)
                    free = _subtract(free, b_start, b_end)
                    capacity -= _minutes(b_start, b_end)

            days.append(_Day(date=day, free=free, capacity=max(0, capacity)))
        day += timedelta(days=1)
    return days


def _place(project, needed, deadline, days, settings, blocks) -> int:
    """Fills the earliest free time up to the deadline. Returns minutes placed."""
    placed = 0
    for day in days:
        if day.date > deadline or placed >= needed:
            break
        for interval in day.free:
            while placed < needed and day.capacity > 0:
                start, end = interval
                left = needed - placed
                length = min(settings.max_block_minutes, left, _minutes(start, end), day.capacity)
                # Skip slots too short for a block, unless they finish the project.
                if length <= 0 or (length < settings.min_block_minutes and length < left):
                    break
                block_end = start + timedelta(minutes=length)
                blocks.append(
                    PlannedBlock(
                        project_id=project.id,
                        date=day.date,
                        start_time=start.time(),
                        end_time=block_end.time(),
                    )
                )
                placed += length
                day.capacity -= length
                interval[0] = min(end, block_end + timedelta(minutes=settings.break_minutes))
            if placed >= needed or day.capacity <= 0:
                break
    return placed


def _make_alert(project, needed, placed, today, days, settings) -> Alert:
    shortfall = needed - placed
    suggestions = []
    if project.deadline and project.deadline < today:
        suggestions.append("The deadline has passed. Set a new deadline or mark the project done.")
    else:
        study_days = sum(1 for d in days if project.deadline is None or d.date <= project.deadline)
        if study_days:
            extra = math.ceil(shortfall / study_days / 30) / 2  # round up to 0.5 h
            new_limit = settings.max_minutes_per_day / 60 + extra
            suggestions.append(
                f"Raise your daily study limit to about {new_limit:g} hours "
                f"or widen your work window on the {study_days} study days before the deadline."
            )
        suggestions.append("Move or cancel a commitment before the deadline.")
        suggestions.append(
            f"Ask for an extension, or cut the estimate by {_fmt_hours(shortfall):g} hours."
        )
    return Alert(
        project_id=project.id,
        project_title=project.title,
        deadline=project.deadline,
        remaining_hours=_fmt_hours(needed),
        available_hours=_fmt_hours(placed),
        shortfall_hours=_fmt_hours(shortfall),
        severity="critical" if shortfall * 2 > needed else "warning",
        suggestions=suggestions,
    )
