from django.db import models
from django.contrib.auth.models import AbstractUser


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

class Project(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='projects')
    title = models.CharField(max_length=255)
    course = models.CharField(max_length=255)
    deadline = models.DateField(default=None, blank=True, null=True)
    estimated_hours = models.IntegerField(default=0, blank=True, null=True)
    completed_hours = models.IntegerField(default=0, blank=True, null=True)
    remaining_hours = models.IntegerField(default=0, blank=True, null=True)
    priority = models.IntegerField(default=0, blank=True, null=True)
    status = models.CharField(max_length=255, default='Not Started', blank=True, null=True)
    colour = models.CharField(max_length=7, default='#FFFFFF', blank=True, null=True)

    def __str__(self):
        return self.title


# --- Schedules --------------------------------------------------------------

class Commitment(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='commitments')
    title = models.CharField(max_length=255)
    kind = models.CharField(max_length=255, default='work', blank=True, null=True)
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

    def __str__(self):
        return f"Study Block for {self.project.title} on {self.date}"
