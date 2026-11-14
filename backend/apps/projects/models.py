from django.db import models

# Create your models here.

class Project(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey('accounts.Account', on_delete=models.CASCADE, related_name='projects')
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

