from datetime import datetime
from decimal import ROUND_HALF_UP, Decimal

from django.db import models, transaction
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator


# --- Accounts ---------------------------------------------------------------

class Account(AbstractUser):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=255, unique=True)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=255, blank=True, null=True)
    last_name = models.CharField(max_length=255, blank=True, null=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username


# --- Projects ---------------------------------------------------------------

PROJECT_COLOURS = [
    ('#E57373', 'Red'),
    ('#FFB74D', 'Orange'),
    ('#FFF176', 'Yellow'),
    ('#81C784', 'Green'),
    ('#4DB6AC', 'Teal'),
    ('#64B5F6', 'Blue'),
    ('#9575CD', 'Purple'),
    ('#F06292', 'Pink'),
    ('#FFFFFF', 'White'),
]
class Project(models.Model):
    STATUS_INCOMPLETED = "incompleted"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_COMPLETED = "completed"
    STATUS_SKIPPED = "skipped"
    STATUS_CHOICES = [
        (STATUS_INCOMPLETED, "Incompleted"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_SKIPPED, "Skipped"),
    ]
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='projects')
    title = models.CharField(max_length=255)
    deadline = models.DateField(default=None, blank=True, null=True)
    # Decimals, so a 45-minute session adds 0.75 h instead of rounding to 1.
    estimated_hours = models.DecimalField(
        max_digits=6, decimal_places=2, default=0, blank=True, null=True,
        validators=[MinValueValidator(0)],
    )
    completed_hours = models.DecimalField(
        max_digits=6, decimal_places=2, default=0, blank=True, null=True,
        validators=[MinValueValidator(0)],
    )
    # remaining_hours = models.IntegerField(default=0, blank=True, null=True)
    priority = models.IntegerField(default=0, blank=True, null=True, validators=[MinValueValidator(0),MaxValueValidator(10)])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_IN_PROGRESS)
    colour = models.CharField(max_length=7, default='#FFFFFF', choices=PROJECT_COLOURS, blank=True, null=True)

    @property
    def remaining_hours(self):
        estimated = self.estimated_hours or 0
        completed = self.completed_hours or 0
        return float(max(estimated - completed, 0))

    def sync_status(self):
        """Make `status` agree with the hours (ROADMAP B3.3).

        - Skipped stays skipped.
        - Hours reach the estimate: completed.
        - Below the estimate but marked completed: back to in_progress.
        - Some hours done but marked incompleted: in_progress.
        A project with no estimate can still be marked completed by hand.
        """
        if self.status == self.STATUS_SKIPPED:
            return
        estimated = Decimal(self.estimated_hours or 0)
        completed = Decimal(self.completed_hours or 0)
        if estimated > 0 and completed >= estimated:
            self.status = self.STATUS_COMPLETED
        elif estimated > 0 and self.status == self.STATUS_COMPLETED:
            self.status = self.STATUS_IN_PROGRESS
        elif completed > 0 and self.status == self.STATUS_INCOMPLETED:
            self.status = self.STATUS_IN_PROGRESS

    def save(self, *args, **kwargs):
        # Runs for the API, Django admin and scripts alike.
        self.sync_status()
        update_fields = kwargs.get("update_fields")
        if update_fields is not None and "status" not in update_fields:
            kwargs["update_fields"] = [*update_fields, "status"]
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


# --- Schedules --------------------------------------------------------------

class Commitment(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='commitments')
    title = models.CharField(max_length=255)
    recuring = models.BooleanField(default=False, blank=True, null=True)
    weekdays = models.CharField(max_length=255, default='', blank=True, null=True)
    date = models.DateField(default=None, blank=True, null=True)
    start_time = models.TimeField(default=None, blank=True, null=True)
    end_time = models.TimeField(default=None, blank=True, null=True)
    active_from = models.DateField(default=None, blank=True, null=True)
    active_to = models.DateField(default=None, blank=True, null=True)

    def __str__(self):
        return self.title


class PlannerSettings(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='planner_settings')
    day_start_time = models.TimeField(default=None, blank=True, null=True)
    day_end_time = models.TimeField(default=None, blank=True, null=True)
    work_days = models.CharField(max_length=255, default='', blank=True, null=True)
    max_hours_per_day = models.IntegerField(default=0, blank=True, null=True)
    min_block_minutes = models.IntegerField(default=0, blank=True, null=True)
    max_block_minutes = models.IntegerField(default=0, blank=True, null=True)
    break_minutes = models.IntegerField(default=0, blank=True, null=True)

    def __str__(self):
        return f"Planner Settings {self.id}"


class DayOverride(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='day_overrides')
    date = models.DateField(default=None, blank=True, null=True)
    start_time = models.TimeField(default=None, blank=True, null=True)
    end_time = models.TimeField(default=None, blank=True, null=True)
    reason = models.CharField(max_length=255, default='', blank=True, null=True)
    note = models.TextField(default='', blank=True, null=True)

    def __str__(self):
        return f"Day Override {self.date}"


# --- Planner ----------------------------------------------------------------
class StudyBlock(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='study_blocks')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='study_blocks')
    date = models.DateField(default=None, blank=True, null=True)
    start_time = models.TimeField(default=None, blank=True, null=True)
    end_time = models.TimeField(default=None, blank=True, null=True)
    completed = models.BooleanField(default=False, blank=True, null=True)

    @property
    def hours(self):
        """Block length in hours, rounded to the 2 decimals projects store."""
        # to_python accepts strings too, e.g. StudyBlock(date="2026-11-18") in a script.
        day = self._meta.get_field("date").to_python(self.date)
        start = self._meta.get_field("start_time").to_python(self.start_time)
        end = self._meta.get_field("end_time").to_python(self.end_time)
        if not (day and start and end):
            return Decimal("0")
        minutes = (datetime.combine(day, end) - datetime.combine(day, start)).total_seconds() / 60
        if minutes <= 0:
            return Decimal("0")
        return (Decimal(int(minutes)) / 60).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def save(self, *args, **kwargs):
        """Save the block and keep its project's completed_hours in step (ROADMAP B3.3).

        A completed block counts its hours toward its project. When a save
        changes that (marked done or undone, moved to another project, or a
        done block's times change), the difference is applied to the
        project(s) in the same transaction. The project rows are locked, so
        two tabs marking blocks at once cannot lose an update. Deleting a
        block leaves the hours, because the study time still happened.
        """
        with transaction.atomic():
            old = None
            if self.pk is not None:
                old = StudyBlock.objects.select_for_update().filter(pk=self.pk).first()
            super().save(*args, **kwargs)

            changes = {}
            if old is not None and old.completed:
                changes[old.project_id] = changes.get(old.project_id, Decimal("0")) - old.hours
            if self.completed:
                changes[self.project_id] = changes.get(self.project_id, Decimal("0")) + self.hours
            for project_id, delta in changes.items():
                if delta == 0:
                    continue
                project = Project.objects.select_for_update().get(pk=project_id)
                project.completed_hours = max(Decimal("0"), Decimal(project.completed_hours or 0) + delta)
                project.save(update_fields=["completed_hours"])
                if self.project_id == project_id:
                    # Callers (and the API response path) see the new hours.
                    self.project = project

    def __str__(self):
        return f"Study Block for {self.project.title} on {self.date}"
