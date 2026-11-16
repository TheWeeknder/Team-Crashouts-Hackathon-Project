from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AccountViewSet,
    CalendarEventsView,
    CommitmentViewSet,
    DayOverrideViewSet,
    GeneratePlanView,
    LoginView,
    LogoutView,
    PlannerSettingsViewSet,
    ProjectViewSet,
    StudyBlockViewSet,
    WeeklySummaryView,
)

router = DefaultRouter()
router.register("accounts", AccountViewSet, basename="account")
router.register("projects", ProjectViewSet, basename="project")
router.register("commitments", CommitmentViewSet, basename="commitment")
router.register("planner-settings", PlannerSettingsViewSet, basename="planner-settings")
router.register("day-overrides", DayOverrideViewSet, basename="day-override")
router.register("study-blocks", StudyBlockViewSet, basename="study-block")

urlpatterns = router.urls + [
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("planner/generate/", GeneratePlanView.as_view(), name="planner-generate"),
    path("planner/events/", CalendarEventsView.as_view(), name="planner-events"),
    path("planner/week/", WeeklySummaryView.as_view(), name="planner-week"),
]
