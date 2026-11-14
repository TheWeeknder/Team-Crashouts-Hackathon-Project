from django.db import models

# Create your models here.

class Commitment(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey('accounts.Account', on_delete=models.CASCADE, related_name='commitments')
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
    user = models.ForeignKey('accounts.Account', on_delete=models.CASCADE, related_name='planner_settings')
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
    user = models.ForeignKey('accounts.Account', on_delete=models.CASCADE, related_name='day_overrides')
    date = models.DateField(default=None, blank=True, null=True)
    start_time = models.TimeField(default=None, blank=True, null=True)
    end_time = models.TimeField(default=None, blank=True, null=True)
    reason = models.CharField(max_length=255, default='', blank=True, null=True)
    note = models.TextField(default='', blank=True, null=True)

    def __str__(self):
        return f"Day Override {self.date}"