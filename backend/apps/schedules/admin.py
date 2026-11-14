from django.contrib import admin
from .models import Commitment, PlannerSettings, DayOverride

# Register your models here.
admin.site.register(Commitment)
admin.site.register(PlannerSettings)
admin.site.register(DayOverride)