from rest_framework.routers import DefaultRouter

from .views import (
    AccountViewSet,
    CommitmentViewSet,
    DayOverrideViewSet,
    PlannerSettingsViewSet,
    ProjectViewSet,
    StudyBlockViewSet,
)

router = DefaultRouter()
router.register("accounts", AccountViewSet, basename="account")
router.register("projects", ProjectViewSet, basename="project")
router.register("commitments", CommitmentViewSet, basename="commitment")
router.register("planner-settings", PlannerSettingsViewSet, basename="planner-settings")
router.register("day-overrides", DayOverrideViewSet, basename="day-override")
router.register("study-blocks", StudyBlockViewSet, basename="study-block")

urlpatterns = router.urls
