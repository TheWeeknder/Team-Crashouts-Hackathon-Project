from datetime import datetime

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
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
    """

    filter_backends = [OrderingFilter]
    filter_params = []

    def get_queryset(self):
        queryset = super().get_queryset().filter(user=self.request.user)
        for param in self.filter_params:
            value = self.request.query_params.get(param)
            if value is not None:
                queryset = queryset.filter(**{param: value})
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
      now      Local time from the browser, e.g. "2026-11-18T14:30". The
               server runs in UTC, so without this "today" can be wrong.
      dry_run  If true, return the plan without saving it.

    Completed blocks and blocks that already started stay. Every other block
    is replaced. Returns {"now", "blocks", "alerts"}.
    """

    def post(self, request):
        now = self._parse_now(request.data.get("now"))
        dry_run = request.data.get("dry_run") in (True, "true", "1", 1)
        user = request.user

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
            settings=_scheduler_settings(PlannerSettings.objects.filter(user=user).first()),
            projects=[
                scheduler.Project(
                    id=p.id,
                    title=p.title,
                    deadline=p.deadline,
                    estimated_hours=p.estimated_hours,
                    completed_hours=p.completed_hours,
                    priority=p.priority,
                    status=p.status,
                )
                for p in Project.objects.filter(user=user)
            ],
            commitments=[
                scheduler.Commitment(
                    title=c.title,
                    start_time=c.start_time,
                    end_time=c.end_time,
                    recurring=bool(c.recuring),
                    weekdays=scheduler.parse_weekdays(c.weekdays),
                    date=c.date,
                    active_from=c.active_from,
                    active_to=c.active_to,
                )
                for c in Commitment.objects.filter(user=user)
            ],
            overrides=[
                scheduler.DayOverride(date=o.date, start_time=o.start_time, end_time=o.end_time)
                for o in DayOverride.objects.filter(user=user, date__isnull=False)
            ],
            kept_blocks=[
                scheduler.KeptBlock(date=b.date, start_time=b.start_time, end_time=b.end_time)
                for b in kept
            ],
        )

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
        if dry_run:
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
                replaceable.delete()
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
        return Response({"now": now.isoformat(timespec="minutes"), "blocks": blocks, "alerts": alerts})

    @staticmethod
    def _parse_now(value):
        if not value:
            return timezone.localtime().replace(tzinfo=None)
        try:
            parsed = datetime.fromisoformat(str(value))
        except ValueError:
            raise ValidationError({"now": 'Use a local time like "2026-11-18T14:30".'})
        # Keep the wall-clock time the browser sent; drop any offset.
        return parsed.replace(tzinfo=None)
