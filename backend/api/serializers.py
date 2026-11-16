import re

from rest_framework import serializers

from . import scheduler
from .models import Account, Project, Commitment, PlannerSettings, DayOverride, StudyBlock


# --- Validation helpers (ROADMAP B1.2) ----------------------------------------
# The frontend forms run the same checks for instant feedback. These make the
# API enforce them for every client. Error keys match the form fields, so
# splitServerErrors shows each message next to its input.

WEEKDAYS_RE = re.compile(r"^\s*[0-6](\s*,\s*[0-6])*\s*$")


def current(serializer, attrs, name):
    """The value after this request: from the request, or else from the
    stored record (a PATCH sends only the changed fields)."""
    if name in attrs:
        return attrs[name]
    return getattr(serializer.instance, name, None) if serializer.instance else None


def check_weekdays(value, field, errors, required):
    """Weekdays are stored as text like "0,2,4" (0 = Monday)."""
    if not value:
        if required:
            errors[field] = "Pick at least one day."
    elif not WEEKDAYS_RE.match(value):
        errors[field] = "Use weekday numbers 0 (Monday) to 6 (Sunday), e.g. \"0,2,4\"."

# --- Accounts ---------------------------------------------------------------
class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = "__all__"
        # Sign-up and password changes send it; responses never return the hash.
        extra_kwargs = {"password": {"write_only": True}}

# --- Projects ---------------------------------------------------------------

class ProjectSerializer(serializers.ModelSerializer):
    remaining_hours = serializers.ReadOnlyField()  # computed property on the model

    class Meta:
        model = Project
        fields = "__all__"

    def validate(self, attrs):
        # completed_hours <= estimated_hours, checked only when this request
        # changes one of them. Marking blocks done can go past the estimate
        # (the work took longer), and editing only the title of such a task
        # must still save.
        changed = any(
            name in attrs and attrs[name] != current(self, {}, name)
            for name in ("estimated_hours", "completed_hours")
        )
        estimated = current(self, attrs, "estimated_hours")
        completed = current(self, attrs, "completed_hours")
        if changed and estimated and completed is not None and completed > estimated:
            raise serializers.ValidationError({
                "completed_hours": f"Can't be more than the estimate ({estimated.normalize():f} h). Raise the estimate first.",
            })
        return attrs

# --- Schedules --------------------------------------------------------------
class CommitmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commitment
        fields = "__all__"

    def validate(self, attrs):
        get = lambda name: current(self, attrs, name)  # noqa: E731
        errors = {}
        if get("recuring"):
            check_weekdays(get("weekdays"), "weekdays", errors, required=True)
            start, end = get("active_from"), get("active_to")
            if start and end and end < start:
                errors["active_to"] = "Must be on or after the start date."
        elif not get("date"):
            errors["date"] = "Pick a date."
        start, end = get("start_time"), get("end_time")
        if not start:
            errors["start_time"] = "Pick a start time."
        if not end:
            errors["end_time"] = "Pick an end time."
        elif start and end <= start:
            errors["end_time"] = "End must be after start (same day)."
        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class PlannerSettingsSerializer(serializers.ModelSerializer):
    """Empty or 0 values mean "use the default" (see views._scheduler_settings),
    so they stay allowed. Any other value must be in range."""

    class Meta:
        model = PlannerSettings
        fields = "__all__"

    def validate(self, attrs):
        get = lambda name: current(self, attrs, name)  # noqa: E731
        defaults = scheduler.Settings()
        errors = {}

        start = get("day_start_time") or defaults.day_start
        end = get("day_end_time") or defaults.day_end
        if end <= start:
            errors["day_end_time"] = "Must be after the start time."

        check_weekdays(get("work_days"), "work_days", errors, required=False)

        hours = get("max_hours_per_day")
        if hours and not 1 <= hours <= 24:
            errors["max_hours_per_day"] = "Between 1 and 24."

        min_block = get("min_block_minutes")
        max_block = get("max_block_minutes")
        if min_block and min_block < 15:
            errors["min_block_minutes"] = "At least 15 minutes."
        if max_block and max_block < 15:
            errors["max_block_minutes"] = "At least 15 minutes."
        elif (min_block or defaults.min_block_minutes) > (max_block or defaults.max_block_minutes):
            errors["max_block_minutes"] = "Must be at least the shortest session."

        rest = get("break_minutes")
        if rest is not None and rest < 0:
            errors["break_minutes"] = "0 or more minutes."

        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class DayOverrideSerializer(serializers.ModelSerializer):
    """No times blocks the whole day. Otherwise both times, end after start."""

    class Meta:
        model = DayOverride
        fields = "__all__"

    def validate(self, attrs):
        get = lambda name: current(self, attrs, name)  # noqa: E731
        errors = {}
        if not get("date"):
            errors["date"] = "Pick a date."
        start, end = get("start_time"), get("end_time")
        if bool(start) != bool(end):
            errors["start_time" if not start else "end_time"] = (
                "Give both a start and an end time, or neither for the whole day."
            )
        elif start and end <= start:
            errors["end_time"] = "End must be after start."
        if errors:
            raise serializers.ValidationError(errors)
        return attrs

# --- Planner ----------------------------------------------------------------
class StudyBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyBlock
        fields = "__all__"

