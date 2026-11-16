from datetime import date, datetime, time, timedelta

from django.db import transaction
from django.db.models import F, Q
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.serializers import AuthTokenSerializer
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from . import scheduler

from .models import Account, Commitment, DayOverride, PlannerSettings, Project, StudyBlock
from .serializers import (
    AccountSerializer,
    CommitmentSerializer,
    DayOverrideSerializer,
    PlannerSettingsSerializer,
    ProjectSerializer,
    StudyBlockSerializer,
)


class UserOwnedViewSet(ModelViewSet):
    """Base viewset for models with a `user` foreign key.

    - Only returns records that belong to the logged-in account.
    - Fills in `user` from the login, so clients never send it.
    - Supports exact-match query filters named in `filter_params`,
      e.g. `?date=2026-11-20`.
    - Supports date range filters named in `date_range_params`, e.g.
      `?date_from=2026-09-01&date_to=2026-12-31` (both inclusive).
    """

    filter_backends = [OrderingFilter]
    filter_params = []
    date_range_params = {}

    def get_queryset(self):
        queryset = super().get_queryset().filter(user=self.request.user)
        for param in self.filter_params:
            value = self.request.query_params.get(param)
            if value is not None:
                queryset = queryset.filter(**{param: value})
        for param, lookup in self.date_range_params.items():
            value = self.request.query_params.get(param)
            if value:
                queryset = queryset.filter(**{lookup: _parse_day(value, param, None)})
        return queryset

    def get_serializer(self, *args, **kwargs):
        # The serializers use fields="__all__", so `user` is a required input.
        # Inject it from the login instead of trusting the request body.
        data = kwargs.get("data")
        if data is not None:
            data = data.copy()
            data["user"] = self.request.user.pk
            kwargs["data"] = data
        return super().get_serializer(*args, **kwargs)


# --- Accounts ---------------------------------------------------------------

class AccountViewSet(ModelViewSet):
    """Sign up with POST (no login needed). Every other action only sees your own account."""

    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    filter_backends = [SearchFilter]
    search_fields = ["username", "email"]

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(pk=self.request.user.pk)

    def perform_create(self, serializer):
        # The serializer exposes every field, so never let sign-up grant privileges.
        account = serializer.save(
            is_staff=False, is_superuser=False, groups=[], user_permissions=[]
        )
        account.set_password(serializer.validated_data["password"])
        account.save()

    def perform_update(self, serializer):
        privileges = {}
        if not self.request.user.is_superuser:
            # Keep privilege fields as they are unless a superuser makes the change.
            instance = serializer.instance
            privileges = {
                "is_staff": instance.is_staff,
                "is_superuser": instance.is_superuser,
                "groups": list(instance.groups.all()),
                "user_permissions": list(instance.user_permissions.all()),
            }
        account = serializer.save(**privileges)
        if "password" in serializer.validated_data:
            account.set_password(serializer.validated_data["password"])
            account.save()

    @action(detail=False, methods=["get"])
    def me(self, request):
        """GET /accounts/me/ returns the logged-in account."""
        return Response(self.get_serializer(request.user).data)


class LoginView(APIView):
    """POST /api/v1/auth/login/ {"username", "password"} -> {"token", "user"}.

    Checks the password once and returns a token. The client then sends
    "Authorization: Token <token>" on every request. Logging in again
    returns the same token until the user logs out.
    """

    permission_classes = [AllowAny]
    authentication_classes = []  # a stale header must not block a login

    def post(self, request):
        serializer = AuthTokenSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": AccountSerializer(user).data})


class LogoutView(APIView):
    """POST /api/v1/auth/logout/ deletes the caller's token, so it stops working."""

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=204)


# --- Projects ---------------------------------------------------------------

class ProjectViewSet(UserOwnedViewSet):
    queryset = Project.objects.all().order_by("deadline")
    serializer_class = ProjectSerializer
    filter_params = ["status"]
    ordering_fields = ["deadline", "priority", "title"]


# --- Schedules --------------------------------------------------------------

class CommitmentViewSet(UserOwnedViewSet):
    queryset = Commitment.objects.all().order_by("date", "start_time")
    serializer_class = CommitmentSerializer
    filter_params = ["date"]
    ordering_fields = ["date", "start_time"]


class PlannerSettingsViewSet(UserOwnedViewSet):
    queryset = PlannerSettings.objects.all()
    serializer_class = PlannerSettingsSerializer


class DayOverrideViewSet(UserOwnedViewSet):
    queryset = DayOverride.objects.all().order_by("date")
    serializer_class = DayOverrideSerializer
    filter_params = ["date"]
    ordering_fields = ["date"]


# --- Planner ----------------------------------------------------------------

class StudyBlockViewSet(UserOwnedViewSet):
    queryset = StudyBlock.objects.all().order_by("date", "start_time")
    serializer_class = StudyBlockSerializer
    filter_params = ["project", "date", "completed"]
    # The frontend loads only the blocks its calendars can show.
    date_range_params = {"date_from": "date__gte", "date_to": "date__lte"}
    ordering_fields = ["date", "start_time"]

    def perform_create(self, serializer):
        self._check_project_owner(serializer)
        serializer.save()

    def perform_update(self, serializer):
        self._check_project_owner(serializer)
        serializer.save()

    def _check_project_owner(self, serializer):
        project = serializer.validated_data.get("project")
        if project is not None and project.user_id != self.request.user.pk:
            raise ValidationError({"project": "You can only schedule your own projects."})


# --- Plan generation ----------------------------------------------------------


def _positive(value, default):
    return value if value and value > 0 else default


def _scheduler_settings(row):
    """PlannerSettings row (or None) -> scheduler.Settings. Empty or 0 values use the defaults."""
    defaults = scheduler.Settings()
    if row is None:
        return defaults
    return scheduler.Settings(
        day_start=row.day_start_time or defaults.day_start,
        day_end=row.day_end_time or defaults.day_end,
        work_days=scheduler.parse_weekdays(row.work_days, defaults.work_days),
        max_minutes_per_day=_positive(row.max_hours_per_day, defaults.max_minutes_per_day // 60) * 60,
        min_block_minutes=_positive(row.min_block_minutes, defaults.min_block_minutes),
        max_block_minutes=_positive(row.max_block_minutes, defaults.max_block_minutes),
        break_minutes=defaults.break_minutes if row.break_minutes is None else row.break_minutes,
    )


class GeneratePlanView(APIView):
    """POST /api/v1/planner/generate/ builds a new study plan.

    Body (all optional):
      now      The browser's time, e.g. "2026-11-18T14:30-06:00". A time with
               an offset is converted to the server's time zone
               (settings.TIME_ZONE, America/Edmonton), which is the zone the
               StudyBlock date and time fields use. A time without an offset
               is taken as server-local wall-clock time. Default: server now.
      dry_run  If true, return the plan without saving it.
      alerts_only  If true, a dry run that returns only {"now", "alerts"}.
               Used by the frontend's live alert check, which does not need
               the blocks.

    Completed blocks and blocks that already started stay. Every other block
    is replaced. Returns {"now", "blocks", "alerts"}.
    """

    def post(self, request):
        now = _parse_now(request.data.get("now"))
        alerts_only = _truthy(request.data.get("alerts_only"))
        dry_run = alerts_only or _truthy(request.data.get("dry_run"))
        user = request.user

        plan, replaceable = _build_plan_for(user, now)
        # Snapshot the blocks the planner treated as replaceable. The queryset
        # is lazy: run later, it would match whatever is in the table then,
        # not the set this plan was built around.
        replace_ids = list(replaceable.values_list("pk", flat=True))

        new_blocks = [
            StudyBlock(
                user=user,
                project_id=b.project_id,
                date=b.date,
                start_time=b.start_time,
                end_time=b.end_time,
                completed=False,
            )
            for b in plan.blocks
        ]
        if alerts_only:
            blocks = None
        elif dry_run:
            blocks = [
                {
                    "id": None,
                    "user": user.pk,
                    "project": b.project_id,
                    "date": b.date.isoformat(),
                    "start_time": b.start_time.isoformat(),
                    "end_time": b.end_time.isoformat(),
                    "completed": False,
                }
                for b in new_blocks
            ]
        else:
            with transaction.atomic():
                # Delete only the snapshot, and never a block that was marked
                # completed after planning. Then create the new blocks, so the
                # delete cannot match them. Both steps commit or neither does.
                StudyBlock.objects.filter(user=user, pk__in=replace_ids).filter(
                    Q(completed=False) | Q(completed__isnull=True)
                ).delete()
                StudyBlock.objects.bulk_create(new_blocks)
            # bulk_create sets ids on SQLite and Postgres; re-read to be safe.
            saved = StudyBlock.objects.filter(
                user=user, completed=False, date__gte=now.date()
            ).order_by("date", "start_time")
            blocks = StudyBlockSerializer(saved, many=True).data

        alerts = [
            {
                "project": a.project_id,
                "project_title": a.project_title,
                "deadline": a.deadline.isoformat() if a.deadline else None,
                "remaining_hours": a.remaining_hours,
                "available_hours": a.available_hours,
                "shortfall_hours": a.shortfall_hours,
                "severity": a.severity,
                "suggestions": a.suggestions,
            }
            for a in plan.alerts
        ]
        now_text = now.isoformat(timespec="minutes")
        if alerts_only:
            return Response({"now": now_text, "alerts": alerts})
        return Response({"now": now_text, "blocks": blocks, "alerts": alerts})


# --- Calendar events and weekly summary (ROADMAP 2.3, D1 and D2) ---------------
#
# Spare endpoints (ROADMAP decision D5). The frontend builds the same data
# itself in frontend/src/lib/events.ts and does not call these. They are kept,
# with their tests, for API clients and debugging. If you change the rules
# here (for example how daily capacity is counted), change lib/events.ts too.

STUDY_COLOUR = "#9575CD"  # used when a project has no colour or is white
COMMITMENT_COLOUR = "#9E9E9E"
OVERRIDE_COLOUR = "#E57373"
MAX_EVENT_RANGE_DAYS = 92


def _local_iso(day, at):
    """Date + wall-clock time -> ISO 8601 with the server's offset, e.g. "...-07:00"."""
    return timezone.make_aware(datetime.combine(day, at)).isoformat(timespec="seconds")


def _iso_span(day, start, end):
    begin, finish = scheduler._span(day, start, end)
    return (
        timezone.make_aware(begin).isoformat(timespec="seconds"),
        timezone.make_aware(finish).isoformat(timespec="seconds"),
    )


def _deadline_iso(deadline):
    # Deadlines are dates; treat them as due at the end of that day.
    return _local_iso(deadline, time(23, 59)) if deadline else None


def _parse_day(value, name, default):
    if not value:
        return default
    try:
        # Accept "2026-11-16" or a full datetime such as FullCalendar sends.
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        raise ValidationError({name: 'Use a date like "2026-11-16".'})


def _block_hours(block):
    if not (block.date and block.start_time and block.end_time):
        return 0
    start = datetime.combine(block.date, block.start_time)
    end = datetime.combine(block.date, block.end_time)
    return max(0, (end - start).total_seconds() / 3600)


class CalendarEventsView(APIView):
    """GET /api/v1/planner/events/?start=YYYY-MM-DD&end=YYYY-MM-DD

    Every calendar event in [start, end) in the CalendarEvent shape from
    ROADMAP section 4.3: study blocks, commitments (recurring ones expanded
    into one event per day) and day overrides. `end` is exclusive, like
    FullCalendar's range. Defaults to the current week (Monday to Sunday).

    Differences from the planned contract, because of the real models:
    - Commitments have no kind, so `kind` is null.
    - Study blocks have no missed or locked state: `status` is "done" or
      "planned", and `locked` is always false.
    - Day overrides use type "commitment" with ids "override-<id>-<date>".
    """

    def get(self, request):
        today = timezone.localdate()
        monday = today - timedelta(days=today.weekday())
        start = _parse_day(request.query_params.get("start"), "start", monday)
        end = _parse_day(request.query_params.get("end"), "end", start + timedelta(days=7))
        if end <= start:
            raise ValidationError({"end": "end must be after start."})
        if (end - start).days > MAX_EVENT_RANGE_DAYS:
            raise ValidationError({"end": f"The range can be {MAX_EVENT_RANGE_DAYS} days at most."})
        user = request.user
        events = []

        blocks = (
            StudyBlock.objects.filter(user=user, date__gte=start, date__lt=end)
            .exclude(start_time__isnull=True)
            .exclude(end_time__isnull=True)
            .select_related("project")
        )
        for b in blocks:
            colour = b.project.colour
            events.append({
                "id": f"block-{b.id}",
                "type": "study",
                "title": b.project.title,
                "start": _local_iso(b.date, b.start_time),
                "end": _local_iso(b.date, b.end_time),
                "task_id": b.project_id,
                "status": "done" if b.completed else "planned",
                "locked": False,
                "kind": None,
                "color": colour if colour and colour.upper() != "#FFFFFF" else STUDY_COLOUR,
            })

        commitments = [(c, _to_scheduler_commitment(c)) for c in Commitment.objects.filter(user=user)]
        overrides = DayOverride.objects.filter(user=user, date__gte=start, date__lt=end)
        day = start
        while day < end:
            for row, c in commitments:
                if c.occurs_on(day):
                    begin, finish = _iso_span(day, row.start_time, row.end_time)
                    events.append(self._busy_event(f"commitment-{row.id}-{day}", row.title, begin, finish, COMMITMENT_COLOUR))
            day += timedelta(days=1)
        for o in overrides:
            begin, finish = _iso_span(o.date, o.start_time, o.end_time)
            title = o.note or (o.reason or "Unavailable").replace("_", " ").capitalize()
            events.append(self._busy_event(f"override-{o.id}-{o.date}", title, begin, finish, OVERRIDE_COLOUR))

        events.sort(key=lambda e: (e["start"], e["id"]))
        return Response(events)

    @staticmethod
    def _busy_event(event_id, title, start, end, colour):
        return {
            "id": event_id,
            "type": "commitment",
            "title": title,
            "start": start,
            "end": end,
            "task_id": None,
            "status": None,
            "locked": None,
            "kind": None,
            "color": colour,
        }


class WeeklySummaryView(APIView):
    """GET /api/v1/planner/week/?start=YYYY-MM-DD&now=YYYY-MM-DDTHH:MM+HH:MM

    The weekly dashboard summary from ROADMAP section 4.4, for the 7 days
    from `start` (default: this week's Monday).

    - capacity_hours: free study time each day (work window minus
      commitments and day overrides, capped by the daily limit).
    - missed_hours: blocks that ended before `now` and are not completed.
    - at_risk: the project gets an alert if the plan is rebuilt now
      (a dry run of planner/generate; nothing is saved).
    """

    def get(self, request):
        now = _parse_now(request.query_params.get("now"))
        monday = now.date() - timedelta(days=now.date().weekday())
        start = _parse_day(request.query_params.get("start"), "start", monday)
        last = start + timedelta(days=6)
        user = request.user
        inputs = _scheduler_inputs(user)

        capacity = scheduler.daily_capacity(
            start, last, inputs["settings"], inputs["commitments"], inputs["overrides"]
        )
        blocks = (
            StudyBlock.objects.filter(user=user, date__gte=start, date__lte=last)
            .exclude(start_time__isnull=True)
            .exclude(end_time__isnull=True)
        )
        days = {
            start + timedelta(days=i): {"planned": 0.0, "done": 0.0} for i in range(7)
        }
        missed = 0.0
        for b in blocks:
            h = _block_hours(b)
            days[b.date]["planned"] += h
            if b.completed:
                days[b.date]["done"] += h
            elif datetime.combine(b.date, b.end_time) <= now:
                missed += h

        plan, _ = _build_plan_for(user, now, inputs)
        at_risk = {a.project_id for a in plan.alerts}
        tasks = []
        projects = Project.objects.filter(user=user).exclude(status=Project.STATUS_SKIPPED)
        for p in projects.order_by(F("deadline").asc(nulls_last=True), "id"):
            if p.deadline and p.deadline < start and p.status == Project.STATUS_COMPLETED:
                continue  # finished before this week
            estimated = float(p.estimated_hours or 0)
            completed = float(p.completed_hours or 0)
            tasks.append({
                "task_id": p.id,
                "title": p.title,
                "deadline": _deadline_iso(p.deadline),
                "estimated_hours": estimated,
                "completed_hours": completed,
                "percent": round(min(100, completed / estimated * 100)) if estimated else 0,
                "at_risk": p.id in at_risk,
            })

        r = lambda x: round(x, 2)  # noqa: E731
        return Response({
            "week_start": start.isoformat(),
            "planned_hours": r(sum(d["planned"] for d in days.values())),
            "done_hours": r(sum(d["done"] for d in days.values())),
            "missed_hours": r(missed),
            "days": [
                {
                    "date": d.isoformat(),
                    "capacity_hours": r(capacity[d] / 60),
                    "planned_hours": r(v["planned"]),
                    "done_hours": r(v["done"]),
                }
                for d, v in days.items()
            ],
            "tasks": tasks,
        })


# --- Shared planner helpers -----------------------------------------------------


def _truthy(value):
    return value in (True, "true", "1", 1)


def _parse_now(value):
    """The planner's "now" as a naive wall-clock time in the server's time zone.

    StudyBlock, Commitment and DayOverride store naive dates and times in
    settings.TIME_ZONE (America/Edmonton). `now` must be in the same zone, or
    now.date() and now.time() put blocks near midnight or the current hour in
    the wrong group. So a value with an offset (e.g. "...Z" or "...-06:00") is
    converted to that zone. A value without one is already taken as local.
    """
    if not value:
        return timezone.localtime().replace(tzinfo=None)
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        raise ValidationError({"now": 'Use a time like "2026-11-18T14:30-06:00".'})
    if timezone.is_aware(parsed):
        parsed = timezone.localtime(parsed)
    return parsed.replace(tzinfo=None)


def _to_scheduler_commitment(c):
    return scheduler.Commitment(
        title=c.title,
        start_time=c.start_time,
        end_time=c.end_time,
        recurring=bool(c.recuring),
        weekdays=scheduler.parse_weekdays(c.weekdays),
        date=c.date,
        active_from=c.active_from,
        active_to=c.active_to,
    )


def _hours(value):
    """Decimal project hours -> float for the scheduler (None stays None)."""
    return None if value is None else float(value)


def _scheduler_inputs(user):
    """The user's rows converted to scheduler dataclasses (everything but kept blocks)."""
    return {
        "settings": _scheduler_settings(PlannerSettings.objects.filter(user=user).first()),
        "projects": [
            scheduler.Project(
                id=p.id,
                title=p.title,
                deadline=p.deadline,
                estimated_hours=_hours(p.estimated_hours),
                completed_hours=_hours(p.completed_hours),
                priority=p.priority,
                status=p.status,
            )
            for p in Project.objects.filter(user=user)
        ],
        "commitments": [_to_scheduler_commitment(c) for c in Commitment.objects.filter(user=user)],
        "overrides": [
            scheduler.DayOverride(date=o.date, start_time=o.start_time, end_time=o.end_time)
            for o in DayOverride.objects.filter(user=user, date__isnull=False)
        ],
    }


def _build_plan_for(user, now, inputs=None):
    """Runs the scheduler as of `now`. Returns (plan, queryset of blocks a save would replace).

    Completed blocks and blocks that already started are kept; the plan works
    around them. Saves nothing.
    """
    replaceable = StudyBlock.objects.filter(user=user).filter(
        Q(completed=False) | Q(completed__isnull=True)
    ).filter(
        Q(date__isnull=True)
        | Q(start_time__isnull=True)
        | Q(date__gt=now.date())
        | Q(date=now.date(), start_time__gte=now.time())
    )
    kept = (
        StudyBlock.objects.filter(user=user, date__gte=now.date())
        .exclude(pk__in=replaceable.values("pk"))
        .exclude(start_time__isnull=True)
        .exclude(end_time__isnull=True)
    )
    plan = scheduler.build_plan(
        now=now,
        **(inputs or _scheduler_inputs(user)),
        kept_blocks=[
            scheduler.KeptBlock(date=b.date, start_time=b.start_time, end_time=b.end_time)
            for b in kept
        ],
    )
    return plan, replaceable
