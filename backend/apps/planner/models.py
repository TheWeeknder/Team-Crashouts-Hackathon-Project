from django.db import models

# Create your models here.

class StudyBlock(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey('accounts.Account', on_delete=models.CASCADE, related_name='study_blocks')
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='study_blocks')
    date = models.DateField(default=None, blank=True, null=True)
    start_time = models.TimeField(default=None, blank=True, null=True)
    end_time = models.TimeField(default=None, blank=True, null=True)
    completed = models.BooleanField(default=False, blank=True, null=True)

    def __str__(self):
        return f"Study Block for {self.project.title} on {self.date}"