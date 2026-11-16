"""python manage.py seed_demo

Creates the demo account from docs/ROADMAP.md section 8, so every demo starts
from the same data. Run it right before the demo: dates are relative to the
day you run it ("today" = T).

The data is built so the README example always appears after "Generate plan":
Capstone has 10 h estimated and 3 h done (7 h left), and only 5 h of free time
before its deadline, so the alert shows 5 h available and 2 h short.

    T      Classes and labs, 09:00-19:00 (one-off): no study time today
    T+1    Shift at work 11:00-19:00   -> free 09:00-11:00 (2 h)
    T+2    Dentist 10:00-11:00 and volunteering 11:00-19:00 -> free 09:00-10:00 (1 h)
    T+3    Shift at work 11:00-19:00   -> free 09:00-11:00 (2 h), Capstone due
    T+7    Math assignment due (fits in T+4 to T+7)
    T+10   Reading notes due

The shifts and volunteering repeat weekly on those weekdays. Completed study
blocks on T-1 and T-2 match the hours already done.

Re-running the command deletes the demo account and creates it again. It only
touches the account named by --username.
"""

from datetime import date, time, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.models import Account, Commitment, PlannerSettings, Project, StudyBlock


class Command(BaseCommand):
    help = "Create (or reset) the demo account with the ROADMAP section 8 data."

    def add_arguments(self, parser):
        parser.add_argument("--username", default="demo")
        parser.add_argument("--password", default="demo1234")
        parser.add_argument(
            "--today",
            help='The demo day as YYYY-MM-DD. Default: today in the server time zone.',
        )

    def handle(self, *args, username, password, today, **options):
        from django.utils import timezone

        if today:
            try:
                t = date.fromisoformat(today)
            except ValueError:
                raise CommandError('--today must look like "2026-11-16".')
        else:
            t = timezone.localdate()

        def day(offset):
            return t + timedelta(days=offset)

        def weekday(offset):
            return str(day(offset).weekday())

        with transaction.atomic():
            Account.objects.filter(username=username).delete()  # cascades to all demo data
            user = Account.objects.create_user(
                username=username, email=f"{username}@example.com", password=password,
                first_name="Demo", last_name="Student",
            )

            PlannerSettings.objects.create(
                user=user,
                day_start_time=time(9), day_end_time=time(19),
                work_days="0,1,2,3,4,5,6",
                max_hours_per_day=6,
                min_block_minutes=30, max_block_minutes=120, break_minutes=15,
            )

            commitments = [
                # Recurring: weekdays are chosen from T so the free time is the same on any day.
                dict(title="Shift at work", recuring=True, weekdays=f"{weekday(1)},{weekday(3)}",
                     start_time=time(11), end_time=time(19)),
                dict(title="Volunteering", recuring=True, weekdays=weekday(2),
                     start_time=time(11), end_time=time(19)),
                # One-off.
                dict(title="Classes and labs", recuring=False, date=day(0),
                     start_time=time(9), end_time=time(19)),
                dict(title="Dentist", recuring=False, date=day(2),
                     start_time=time(10), end_time=time(11)),
            ]
            for c in commitments:
                Commitment.objects.create(user=user, **c)

            # completed_hours starts at 0: the done sessions below add
            # their hours (StudyBlock.save), giving Capstone 3 h and Reading 1 h.
            capstone = Project.objects.create(
                user=user, title="Capstone report", deadline=day(3),
                estimated_hours=10, completed_hours=0, priority=8,
                status=Project.STATUS_IN_PROGRESS, colour="#9575CD",
            )
            Project.objects.create(
                user=user, title="Math assignment", deadline=day(7),
                estimated_hours=4, completed_hours=0, priority=5,
                status=Project.STATUS_INCOMPLETED, colour="#64B5F6",
            )
            reading = Project.objects.create(
                user=user, title="Reading notes", deadline=day(10),
                estimated_hours=3, completed_hours=0, priority=3,
                status=Project.STATUS_IN_PROGRESS, colour="#81C784",
            )

            # Past sessions that account for the hours already done.
            for project, offset, start, end in [
                (capstone, -2, time(14), time(15)),
                (capstone, -1, time(9), time(11)),
                (reading, -1, time(13), time(14)),
            ]:
                StudyBlock.objects.create(
                    user=user, project=project, date=day(offset),
                    start_time=start, end_time=end, completed=True,
                )

        self.stdout.write(self.style.SUCCESS(
            f'Demo account ready: username "{username}", password "{password}", '
            f"today = {t.isoformat()} ({t:%A})."
        ))
        self.stdout.write(
            'Sign in and click "Generate plan". Capstone report shows an alert: '
            "7 h left, 5 h available, 2 h short. Run seed_demo again to reset."
        )
