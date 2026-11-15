from datetime import date, datetime, time
from datetime import timezone as dt_timezone

from django.test import SimpleTestCase
from rest_framework.test import APITestCase

from . import scheduler
from .models import Account, Commitment, DayOverride, PlannerSettings, Project, StudyBlock

# 2026-11-16 is a Monday.
MON = date(2026, 11, 16)
TUE = date(2026, 11, 17)
WED = date(2026, 11, 18)
FRI = date(2026, 11, 20)
MON_8AM = datetime(2026, 11, 16, 8, 0)


def local(day, hour, minute=0):
    """Expected API timestamp: local time with the server's offset (America/Edmonton)."""
    from django.utils import timezone

    return timezone.make_aware(datetime.combine(day, time(hour, minute))).isoformat(timespec="seconds")


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


class DailyCapacityTests(SimpleTestCase):
    def test_capacity_subtracts_busy_time_and_caps_at_limit(self):
        settings = scheduler.Settings(work_days=frozenset({0, 1, 2}))  # Mon-Wed, 9-19, 6 h limit
        shift = scheduler.Commitment(title="Shift", start_time=time(13), end_time=time(19), recurring=True, weekdays=frozenset({1}))
        sick = scheduler.DayOverride(date=WED)
        capacity = scheduler.daily_capacity(MON, MON + scheduler.timedelta(days=3), settings, [shift], [sick])
        self.assertEqual(capacity[MON], 6 * 60)  # 10 h free, capped at 6 h
        self.assertEqual(capacity[TUE], 4 * 60)  # 9-13
        self.assertEqual(capacity[WED], 0)  # whole day blocked
        self.assertEqual(capacity[MON + scheduler.timedelta(days=3)], 0)  # Thursday is not a work day


class CalendarEventsViewTests(APITestCase):
    url = "/api/v1/planner/events/"

    def setUp(self):
        self.user = Account.objects.create_user(username="alex", email="alex@example.test", password="pw-12345678")
        self.other = Account.objects.create_user(username="sam", email="sam@example.test", password="pw-12345678")
        self.client.force_authenticate(self.user)
        self.project = Project.objects.create(
            user=self.user, title="Capstone", deadline=FRI, estimated_hours=4, colour="#64B5F6"
        )

    def test_requires_login(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(self.url).status_code, 401)

    def test_returns_blocks_expanded_commitments_and_overrides(self):
        StudyBlock.objects.create(user=self.user, project=self.project, date=TUE, start_time=time(9), end_time=time(11), completed=True)
        Commitment.objects.create(user=self.user, title="Shift", recuring=True, weekdays="1,3", start_time=time(13), end_time=time(19))
        Commitment.objects.create(user=self.user, title="Dentist", recuring=False, date=WED, start_time=time(10), end_time=time(11))
        DayOverride.objects.create(user=self.user, date=FRI, reason="low_energy")

        response = self.client.get(self.url, {"start": "2026-11-16", "end": "2026-11-23"})
        self.assertEqual(response.status_code, 200, response.data)
        by_id = {e["id"]: e for e in response.data}

        block = next(e for e in response.data if e["type"] == "study")
        self.assertEqual(block["title"], "Capstone")
        self.assertEqual(block["start"], local(TUE, 9))
        self.assertEqual((block["status"], block["locked"], block["color"]), ("done", False, "#64B5F6"))
        self.assertEqual(block["task_id"], self.project.id)

        shifts = [e for e in response.data if e["title"] == "Shift"]
        self.assertEqual([e["start"][:10] for e in shifts], ["2026-11-17", "2026-11-19"])
        self.assertIsNone(shifts[0]["kind"])
        self.assertIsNone(shifts[0]["task_id"])
        self.assertTrue(any(e["title"] == "Dentist" for e in response.data))

        override = next(e for e in response.data if e["id"].startswith("override-"))
        self.assertEqual(override["title"], "Low energy")
        self.assertEqual((override["start"], override["end"]), (local(FRI, 0), local(FRI + scheduler.timedelta(days=1), 0)))
        self.assertEqual(len(by_id), len(response.data))  # ids are unique

    def test_end_is_exclusive_and_other_users_hidden(self):
        StudyBlock.objects.create(user=self.user, project=self.project, date=WED, start_time=time(9), end_time=time(10))
        other_project = Project.objects.create(user=self.other, title="Not mine", deadline=FRI, estimated_hours=1)
        StudyBlock.objects.create(user=self.other, project=other_project, date=TUE, start_time=time(9), end_time=time(10))
        response = self.client.get(self.url, {"start": "2026-11-16", "end": "2026-11-18"})
        self.assertEqual(response.data, [])

    def test_bad_range_is_400(self):
        self.assertEqual(self.client.get(self.url, {"start": "2026-11-20", "end": "2026-11-16"}).status_code, 400)
        self.assertEqual(self.client.get(self.url, {"start": "soon"}).status_code, 400)
        self.assertEqual(self.client.get(self.url, {"start": "2026-01-01", "end": "2026-12-31"}).status_code, 400)


class WeeklySummaryViewTests(APITestCase):
    url = "/api/v1/planner/week/"

    def setUp(self):
        self.user = Account.objects.create_user(username="alex", email="alex@example.test", password="pw-12345678")
        self.client.force_authenticate(self.user)

    def test_readme_example_is_at_risk_and_hours_add_up(self):
        # README example: 10 h estimated, 3 done, only 5 h free before Friday.
        capstone = Project.objects.create(user=self.user, title="Capstone", deadline=FRI, estimated_hours=10, completed_hours=3)
        reading = Project.objects.create(user=self.user, title="Reading", deadline=FRI + scheduler.timedelta(days=10), estimated_hours=3)
        PlannerSettings.objects.create(user=self.user, max_hours_per_day=1)
        StudyBlock.objects.create(user=self.user, project=capstone, date=MON, start_time=time(9), end_time=time(10), completed=True)
        StudyBlock.objects.create(user=self.user, project=capstone, date=MON, start_time=time(11), end_time=time(12))
        StudyBlock.objects.create(user=self.user, project=reading, date=WED, start_time=time(9), end_time=time(10, 30))

        response = self.client.get(self.url, {"start": "2026-11-16", "now": "2026-11-16T14:00"})
        self.assertEqual(response.status_code, 200, response.data)
        data = response.data
        self.assertEqual(data["week_start"], "2026-11-16")
        self.assertEqual((data["planned_hours"], data["done_hours"], data["missed_hours"]), (3.5, 1, 1))
        self.assertEqual(len(data["days"]), 7)
        self.assertEqual(data["days"][0], {"date": "2026-11-16", "capacity_hours": 1, "planned_hours": 2, "done_hours": 1})

        tasks = {t["title"]: t for t in data["tasks"]}
        self.assertTrue(tasks["Capstone"]["at_risk"])
        self.assertFalse(tasks["Reading"]["at_risk"])
        self.assertEqual(tasks["Capstone"]["percent"], 30)
        self.assertEqual(tasks["Capstone"]["deadline"], local(FRI, 23, 59))
        # A dry run: the summary saves nothing.
        self.assertEqual(StudyBlock.objects.count(), 3)

    def test_defaults_to_this_weeks_monday(self):
        response = self.client.get(self.url, {"now": "2026-11-19T10:00"})
        self.assertEqual(response.data["week_start"], "2026-11-16")


class PlannerNowTimezoneTests(APITestCase):
    """`now` must be compared in the zone the block dates and times are stored in."""

    url = "/api/v1/planner/generate/"

    def setUp(self):
        self.user = Account.objects.create_user(username="alex", email="alex@example.test", password="pw-12345678")
        self.client.force_authenticate(self.user)
        self.project = Project.objects.create(user=self.user, title="Capstone", deadline=FRI, estimated_hours=2)

    def test_now_with_offset_is_converted_to_server_time(self):
        from django.utils import timezone

        # 20:00 UTC is mid-afternoon in Edmonton. Read as local, it would be after
        # the 19:00 work window and push every block to Tuesday.
        utc_now = datetime(2026, 11, 16, 20, 0, tzinfo=dt_timezone.utc)
        local_now = timezone.localtime(utc_now).replace(tzinfo=None)
        response = self.client.post(self.url, {"now": "2026-11-16T20:00:00Z", "dry_run": True}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["now"], local_now.isoformat(timespec="minutes"))
        first = response.data["blocks"][0]
        self.assertEqual(first["date"], "2026-11-16")
        self.assertGreaterEqual(first["start_time"], local_now.time().isoformat())

    def test_now_without_offset_is_server_local(self):
        response = self.client.post(self.url, {"now": "2026-11-16T14:00", "dry_run": True}, format="json")
        self.assertEqual(response.data["now"], "2026-11-16T14:00")

    def test_late_evening_in_another_zone_keeps_todays_blocks(self):
        # 23:30 in UTC+1 is still afternoon in Edmonton, so a block that starts at
        # 17:00 local today has not started yet and is replaced.
        stale = StudyBlock.objects.create(
            user=self.user, project=self.project, date=MON, start_time=time(17), end_time=time(18)
        )
        response = self.client.post(self.url, {"now": "2026-11-16T23:30:00+01:00"}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertFalse(StudyBlock.objects.filter(pk=stale.pk).exists())
        self.assertEqual(StudyBlock.objects.filter(user=self.user).count(), len(response.data["blocks"]))
