from django.contrib import admin

from .models import Account, Commitment, DayOverride, PlannerSettings, Project, StudyBlock

admin.site.register(Account)
admin.site.register(Project)
admin.site.register(Commitment)
admin.site.register(PlannerSettings)
admin.site.register(DayOverride)
admin.site.register(StudyBlock)
