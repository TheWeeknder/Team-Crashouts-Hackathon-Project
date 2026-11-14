from datetime import date, datetime, time

from django.test import SimpleTestCase
from rest_framework.test import APITestCase

from . import scheduler
from .models import Account, Commitment, PlannerSettings, Project, StudyBlock

# 2026-11-16 is a Monday.
MON = date(2026, 11, 16)
TUE = date(2026, 11, 17)
WED = date(2026, 11, 18)
FRI = date(2026, 11, 20)
MON_8AM = datetime(2026, 11, 16, 8, 0)


def hours(blocks, project_id=None):
    total = 0
    for b in blocks:
        if project_id is None or b.project_id == project_id:
            start = datetime.combine(b.date, b.start_time)
            end = datetime.combine(b.date, b.end_time)
            total += (end - start).total_seconds() / 3600
    return total


class SchedulerTests(SimpleTestCase):
    def test_single_project_uses_blocks_breaks_and_daily_limit(self):
        project = scheduler.Project(id=1, title="Essay", deadline=FRI, estimated_hours=8, completed_hours=0)
        plan = scheduler.build_plan(MON_8AM, scheduler.Settings(), [project])

        self.assertEqual(plan.alerts, [])
        self.assertEqual(hours(plan.blocks), 8)
        first, second = plan.blocks[0], plan.blocks[1]
        self.assertEqual((first.date, first.start_time, first.end_time), (MON, time(9), time(11)))
        # 15-minute break after each block.
        self.assertEqual(second.start_time, time(11, 15))
        # 6 hours a day at most: 8 hours spill into Tuesday.
        self.assertEqual(hours([b for b in plan.blocks if b.date == MON]), 6)
        self.assertEqual(hours([b for b in plan.blocks if b.date == TUE]), 2)

    def test_earliest_deadline_goes_first(self):
        later = scheduler.Project(id=1, title="Later", deadline=FRI, estimated_hours=2)
        sooner = scheduler.Project(id=2, title="Sooner", deadline=TUE, estimated_hours=2)
        plan = scheduler.build_plan(MON_8AM, scheduler.Settings(), [later, sooner])
        self.assertEqual(plan.blocks[0].project_id, 2)
        self.assertEqual(plan.blocks[0].start_time, time(9))

    def test_same_deadline_higher_priority_first(self):
        low = scheduler.Project(id=1, title="Low", deadline=FRI, estimated_hours=2, priority=1)
        high = scheduler.Project(id=2, title="High", deadline=FRI, estimated_hours=2, priority=8)
        plan = scheduler.build_plan(MON_8AM, scheduler.Settings(), [low, high])
        self.assertEqual(plan.blocks[0].project_id, 2)

    def test_commitments_and_overrides_block_time(self):
        settings = scheduler.Settings(max_minutes_per_day=10 * 60)
        shift = scheduler.Commitment(
            title="Shift", start_time=time(9), end_time=time(17), recurring=True, weekdays=frozenset({0})
        )
        sick_tuesday = scheduler.DayOverride(date=TUE)  # no times: whole day
        project = scheduler.Project(id=1, title="Lab", deadline=WED, estimated_hours=4)
        plan = scheduler.build_plan(MON_8AM, settings, [project], [shift], [sick_tuesday])

        monday = [b for b in plan.blocks if b.date == MON]
        self.assertTrue(all(b.start_time >= time(17) for b in monday))
        self.assertFalse([b for b in plan.blocks if b.date == TUE])
        self.assertEqual(hours(plan.blocks), 4)

    def test_readme_example_raises_alert(self):
        # 10 h estimated, 3 h done, only 5 free hours before the deadline.
        # No breaks, so all 5 free hours can hold study blocks.
        settings = scheduler.Settings(day_start=time(9), day_end=time(19), max_minutes_per_day=6 * 60, break_minutes=0)
        busy = scheduler.Commitment(title="Work", start_time=time(9), end_time=time(14), date=MON)
        project = scheduler.Project(id=1, title="Capstone", deadline=MON, estimated_hours=10, completed_hours=3)
        plan = scheduler.build_plan(MON_8AM, settings, [project], [busy])

        self.assertEqual(len(plan.alerts), 1)
        alert = plan.alerts[0]
        self.assertEqual((alert.remaining_hours, alert.available_hours, alert.shortfall_hours), (7, 5, 2))
        self.assertEqual(alert.severity, "warning")
        self.assertTrue(alert.suggestions)

    def test_done_and_finished_projects_are_skipped(self):
        done = scheduler.Project(id=1, title="Done", deadline=FRI, estimated_hours=5, status="completed")
        skipped = scheduler.Project(id=2, title="Skipped", deadline=FRI, estimated_hours=5, status="skipped")
        finished = scheduler.Project(id=3, title="All hours", deadline=FRI, estimated_hours=5, completed_hours=5)
        plan = scheduler.build_plan(MON_8AM, scheduler.Settings(), [done, skipped, finished])
        self.assertEqual((plan.blocks, plan.alerts), ([], []))

    def test_starts_after_now_and_skips_short_gaps(self):
        now = datetime(2026, 11, 16, 18, 20)  # rounds up to 18:30, 30 min left today
        settings = scheduler.Settings(min_block_minutes=45)
        project = scheduler.Project(id=1, title="Quiz prep", deadline=TUE, estimated_hours=1)
        plan = scheduler.build_plan(now, settings, [project])
        self.assertEqual(plan.blocks[0].date, TUE)

    def test_kept_blocks_use_time_and_daily_limit(self):
        kept = scheduler.KeptBlock(date=MON, start_time=time(9), end_time=time(14))
        project = scheduler.Project(id=1, title="Essay", deadline=FRI, estimated_hours=3)
        plan = scheduler.build_plan(MON_8AM, scheduler.Settings(), [project], kept_blocks=[kept])
        monday = [b for b in plan.blocks if b.date == MON]
        self.assertEqual(hours(monday), 1)  # 6 h limit - 5 h kept
        self.assertGreaterEqual(monday[0].start_time, time(14))

    def test_past_deadline_gets_alert_and_no_blocks(self):
        project = scheduler.Project(id=1, title="Old", deadline=date(2026, 11, 1), estimated_hours=2)
        plan = scheduler.build_plan(MON_8AM, scheduler.Settings(), [project])
        self.assertEqual(plan.blocks, [])
        self.assertEqual(plan.alerts[0].severity, "critical")

    def test_parse_weekdays(self):
        self.assertEqual(scheduler.parse_weekdays("0, 2,4,9,x"), frozenset({0, 2, 4}))
        self.assertEqual(scheduler.parse_weekdays("", frozenset({1})), frozenset({1}))


class GeneratePlanViewTests(APITestCase):
    url = "/api/v1/planner/generate/"

    def setUp(self):
        self.user = Account.objects.create_user(username="alex", email="alex@example.test", password="pw-12345678")
        self.other = Account.objects.create_user(username="sam", email="sam@example.test", password="pw-12345678")
        self.client.force_authenticate(self.user)
        self.project = Project.objects.create(
            user=self.user, title="Capstone", deadline=FRI, estimated_hours=4, completed_hours=0
        )

    def test_requires_login(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.post(self.url, {}, format="json").status_code, 401)

    def test_generates_and_replaces_future_blocks(self):
        done = StudyBlock.objects.create(
            user=self.user, project=self.project, date=MON, start_time=time(9), end_time=time(10), completed=True
        )
        stale = StudyBlock.objects.create(
            user=self.user, project=self.project, date=WED, start_time=time(9), end_time=time(10), completed=False
        )
        PlannerSettings.objects.create(user=self.user, max_hours_per_day=2, work_days="")

        response = self.client.post(self.url, {"now": "2026-11-16T08:00"}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["alerts"], [])

        self.assertTrue(StudyBlock.objects.filter(pk=done.pk).exists())
        self.assertFalse(StudyBlock.objects.filter(pk=stale.pk).exists())
        new = StudyBlock.objects.filter(user=self.user, completed=False)
        self.assertEqual(len(response.data["blocks"]), new.count())
        # Daily limit 2 h, and the kept 1 h block on Monday counts toward it.
        monday = new.filter(date=MON)
        self.assertEqual(monday.count(), 1)
        self.assertEqual((monday[0].start_time, monday[0].end_time), (time(10), time(11)))

    def test_dry_run_saves_nothing(self):
        response = self.client.post(self.url, {"now": "2026-11-16T08:00", "dry_run": True}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["blocks"])
        self.assertFalse(StudyBlock.objects.exists())

    def test_alerts_and_commitments_use_backend_field_names(self):
        Commitment.objects.create(
            user=self.user, title="Shifts", recuring=True, weekdays="0,1,2,3,4",
            start_time=time(9), end_time=time(18, 30),
        )
        response = self.client.post(self.url, {"now": "2026-11-16T08:00"}, format="json")
        alert = response.data["alerts"][0]
        self.assertEqual(alert["project"], self.project.id)
        self.assertEqual(alert["shortfall_hours"], 4 - alert["available_hours"])
        self.assertTrue(all(b["start_time"] >= "18:30" for b in response.data["blocks"]))

    def test_only_uses_own_data(self):
        Project.objects.create(user=self.other, title="Not mine", deadline=FRI, estimated_hours=3)
        self.client.post(self.url, {"now": "2026-11-16T08:00"}, format="json")
        projects = set(StudyBlock.objects.filter(user=self.user).values_list("project__title", flat=True))
        self.assertEqual(projects, {"Capstone"})

    def test_bad_now_is_400(self):
        response = self.client.post(self.url, {"now": "tomorrow"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("now", response.data)
