from io import StringIO

from django.core.management import call_command
from rest_framework.test import APITestCase

from .models import Account, Commitment, PlannerSettings, Project, StudyBlock

# Run the demo on several weekdays and times: the result must not depend on them.
DEMO_DAYS = ["2026-11-16", "2026-11-19", "2026-11-21"]  # Monday, Thursday, Saturday


class SeedDemoTests(APITestCase):
    def seed(self, today, **kwargs):
        call_command("seed_demo", today=today, stdout=StringIO(), **kwargs)
        return Account.objects.get(username=kwargs.get("username", "demo"))

    def generate(self, user, now):
        self.client.force_authenticate(user)
        response = self.client.post("/api/v1/planner/generate/", {"now": now}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        return response.data

    def test_readme_alert_on_any_day_and_time(self):
        for today in DEMO_DAYS:
            for clock in ("08:00", "13:30", "21:00"):
                with self.subTest(today=today, clock=clock):
                    user = self.seed(today)
                    plan = self.generate(user, f"{today}T{clock}")

                    self.assertEqual(len(plan["alerts"]), 1, plan["alerts"])
                    alert = plan["alerts"][0]
                    self.assertEqual(alert["project_title"], "Capstone report")
                    self.assertEqual(
                        (alert["remaining_hours"], alert["available_hours"], alert["shortfall_hours"]),
                        (7, 5, 2),
                    )
                    # Nothing is planned today: classes fill the work window.
                    self.assertFalse([b for b in plan["blocks"] if b["date"] == today])
                    # Math and Reading fit completely.
                    planned = {}
                    for b in plan["blocks"]:
                        h, m = map(int, b["end_time"][:5].split(":"))
                        sh, sm = map(int, b["start_time"][:5].split(":"))
                        planned[b["project"]] = planned.get(b["project"], 0) + (h * 60 + m - sh * 60 - sm) / 60
                    titles = {p.id: p.title for p in Project.objects.filter(user=user)}
                    by_title = {titles[k]: v for k, v in planned.items()}
                    self.assertEqual(by_title["Math assignment"], 4)
                    self.assertEqual(by_title["Reading notes"], 2)
                    self.assertEqual(by_title["Capstone report"], 5)

    def test_password_works_and_rerun_resets(self):
        user = self.seed("2026-11-16", password="s3cret-demo")
        self.assertTrue(user.check_password("s3cret-demo"))
        Project.objects.create(user=user, title="Extra", estimated_hours=1)
        other = Account.objects.create_user(username="sam", email="sam@example.test", password="pw-12345678")
        Project.objects.create(user=other, title="Not demo", estimated_hours=1)

        user = self.seed("2026-11-16")
        self.assertEqual(
            sorted(Project.objects.filter(user=user).values_list("title", flat=True)),
            ["Capstone report", "Math assignment", "Reading notes"],
        )
        self.assertEqual(PlannerSettings.objects.filter(user=user).count(), 1)
        self.assertEqual(Commitment.objects.filter(user=user).count(), 4)
        self.assertEqual(StudyBlock.objects.filter(user=user, completed=True).count(), 3)
        self.assertTrue(Project.objects.filter(user=other, title="Not demo").exists())

    def test_completed_blocks_match_hours_done(self):
        user = self.seed("2026-11-16")
        for project in Project.objects.filter(user=user):
            blocks = StudyBlock.objects.filter(project=project, completed=True)
            hours = sum((b.end_time.hour * 60 + b.end_time.minute - b.start_time.hour * 60 - b.start_time.minute) / 60 for b in blocks)
            self.assertEqual(hours, project.completed_hours, project.title)

    def test_demo_script_life_happens_steps(self):
        # ROADMAP section 8, steps 5 and 6, on the seeded data.
        from datetime import date, time

        from .models import DayOverride

        user = self.seed("2026-11-19")
        self.generate(user, "2026-11-19T10:00")

        # Step 5: "Car broke down" tomorrow 09:00-11:00 takes Capstone's 2 h that day.
        Commitment.objects.create(user=user, title="Car broke down", recuring=False,
                                  date=date(2026, 11, 20), start_time=time(9), end_time=time(11))
        alert = self.generate(user, "2026-11-19T10:05")["alerts"][0]
        self.assertEqual((alert["available_hours"], alert["shortfall_hours"], alert["severity"]), (3, 4, "critical"))

        # Step 6: time off on T+4 moves Math to later days; it still fits.
        before = {b["date"] for b in self.generate(user, "2026-11-19T10:10")["blocks"]}
        self.assertIn("2026-11-23", before)
        DayOverride.objects.create(user=user, date=date(2026, 11, 23), reason="low_energy")
        plan = self.generate(user, "2026-11-19T10:15")
        self.assertNotIn("2026-11-23", {b["date"] for b in plan["blocks"]})
        self.assertEqual([a["project_title"] for a in plan["alerts"]], ["Capstone report"])
