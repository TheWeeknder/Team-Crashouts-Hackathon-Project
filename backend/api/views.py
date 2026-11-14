from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

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
    filter_params = ["kind", "date"]
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
