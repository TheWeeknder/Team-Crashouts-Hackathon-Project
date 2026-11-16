from rest_framework import serializers

from .models import Account, Project, Commitment, PlannerSettings, DayOverride, StudyBlock

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

# --- Schedules --------------------------------------------------------------
class CommitmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commitment
        fields = "__all__"

class PlannerSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlannerSettings
        fields = "__all__"

class DayOverrideSerializer(serializers.ModelSerializer):
    class Meta:
        model = DayOverride
        fields = "__all__"

# --- Planner ----------------------------------------------------------------
class StudyBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyBlock
        fields = "__all__"

