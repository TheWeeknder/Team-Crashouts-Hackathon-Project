from decimal import Decimal

from rest_framework.test import APITestCase

from .models import Account, Project, StudyBlock


class AccountPasswordTests(APITestCase):
    """ROADMAP 2.4: account responses must never include the password hash."""

    def test_sign_up_does_not_return_password(self):
        response = self.client.post(
            "/api/v1/accounts/",
            {"username": "sam", "email": "sam@example.com", "password": "s3cret-pass"},
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertNotIn("password", response.data)
        account = Account.objects.get(username="sam")
        self.assertTrue(account.check_password("s3cret-pass"))

    def test_me_and_list_do_not_return_password(self):
        account = Account.objects.create_user(username="sam", email="sam@example.com", password="x")
        self.client.force_authenticate(account)
        me = self.client.get("/api/v1/accounts/me/")
        self.assertEqual(me.status_code, 200)
        self.assertNotIn("password", me.data)
        listing = self.client.get("/api/v1/accounts/")
        self.assertNotIn("password", listing.json()[0])


class DecimalHoursTests(APITestCase):
    """ROADMAP 2.4: project hours keep fractions and come back as JSON numbers."""

    def setUp(self):
        self.user = Account.objects.create_user(username="sam", email="sam@example.com", password="x")
        self.client.force_authenticate(self.user)

    def test_fractional_hours_round_trip_as_numbers(self):
        created = self.client.post(
            "/api/v1/projects/",
            {"title": "Essay", "estimated_hours": 2.5, "completed_hours": 0.75},
            format="json",
        )
        self.assertEqual(created.status_code, 201, created.data)
        body = created.json()
        self.assertEqual(body["estimated_hours"], 2.5)
        self.assertEqual(body["completed_hours"], 0.75)
        self.assertEqual(body["remaining_hours"], 1.75)

    def test_negative_hours_are_rejected(self):
        response = self.client.post(
            "/api/v1/projects/", {"title": "Essay", "estimated_hours": -1}, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("estimated_hours", response.data)

    def test_generate_plans_fractional_remaining_hours(self):
        Project.objects.create(
            user=self.user, title="Essay", deadline="2026-11-20",
            estimated_hours="1.50", completed_hours="0.75",
        )
        response = self.client.post(
            "/api/v1/planner/generate/",
            {"now": "2026-11-16T08:00-07:00", "dry_run": True},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["alerts"], [])
        minutes = 0
        for block in response.data["blocks"]:
            start_h, start_m = map(int, block["start_time"].split(":")[:2])
            end_h, end_m = map(int, block["end_time"].split(":")[:2])
            minutes += (end_h * 60 + end_m) - (start_h * 60 + start_m)
        self.assertEqual(minutes, 45)


class TokenAuthTests(APITestCase):
    """Token login: the password is checked once, then a token is sent instead."""

    def setUp(self):
        self.user = Account.objects.create_user(username="sam", email="sam@example.com", password="s3cret-pass")

    def login(self, password="s3cret-pass"):
        return self.client.post(
            "/api/v1/auth/login/", {"username": "sam", "password": password}, format="json"
        )

    def test_login_returns_token_and_user_without_password(self):
        response = self.login()
        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(response.data["token"])
        self.assertEqual(response.data["user"]["username"], "sam")
        self.assertNotIn("password", response.data["user"])

    def test_wrong_password_is_rejected(self):
        self.assertEqual(self.login("wrong").status_code, 400)

    def test_token_authenticates_and_logout_revokes_it(self):
        token = self.login().data["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        self.assertEqual(self.client.get("/api/v1/accounts/me/").status_code, 200)
        self.assertEqual(self.client.post("/api/v1/auth/logout/").status_code, 204)
        self.assertEqual(self.client.get("/api/v1/accounts/me/").status_code, 401)

    def test_stale_header_does_not_block_login(self):
        self.client.credentials(HTTP_AUTHORIZATION="Token not-a-real-token")
        self.assertEqual(self.login().status_code, 200)


class StudyBlockRangeTests(APITestCase):
    def setUp(self):
        self.user = Account.objects.create_user(username="sam", email="sam@example.com", password="x")
        self.client.force_authenticate(self.user)
        project = Project.objects.create(user=self.user, title="Essay", estimated_hours=5)
        for day in ("2026-08-01", "2026-11-16", "2026-12-20"):
            StudyBlock.objects.create(
                user=self.user, project=project, date=day, start_time="09:00", end_time="10:00"
            )

    def dates(self, query):
        response = self.client.get(f"/api/v1/study-blocks/{query}")
        self.assertEqual(response.status_code, 200, response.data)
        return [b["date"] for b in response.json()]

    def test_date_from_and_date_to_are_inclusive(self):
        self.assertEqual(self.dates("?date_from=2026-11-16"), ["2026-11-16", "2026-12-20"])
        self.assertEqual(self.dates("?date_to=2026-11-16"), ["2026-08-01", "2026-11-16"])
        self.assertEqual(self.dates("?date_from=2026-09-01&date_to=2026-12-01"), ["2026-11-16"])

    def test_bad_date_is_a_400(self):
        response = self.client.get("/api/v1/study-blocks/?date_from=soon")
        self.assertEqual(response.status_code, 400)
        self.assertIn("date_from", response.data)


class AlertsOnlyTests(APITestCase):
    def setUp(self):
        self.user = Account.objects.create_user(username="sam", email="sam@example.com", password="x")
        self.client.force_authenticate(self.user)
        Project.objects.create(user=self.user, title="Essay", deadline="2026-11-20", estimated_hours=3)

    def test_alerts_only_skips_blocks_and_saves_nothing(self):
        response = self.client.post(
            "/api/v1/planner/generate/",
            {"now": "2026-11-16T08:00-07:00", "alerts_only": True},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(set(response.data), {"now", "alerts"})
        self.assertFalse(StudyBlock.objects.exists())


class ProjectStatusTests(APITestCase):
    """ROADMAP B3.3: the server keeps a project's status in step with its hours."""

    def setUp(self):
        self.user = Account.objects.create_user(username="sam", email="sam@example.com", password="x")
        self.client.force_authenticate(self.user)

    def make(self, **fields):
        return Project.objects.create(user=self.user, title="Essay", **fields)

    def test_reaching_the_estimate_completes_the_project(self):
        project = self.make(estimated_hours=2, completed_hours=0, status=Project.STATUS_INCOMPLETED)
        response = self.client.patch(f"/api/v1/projects/{project.pk}/", {"completed_hours": 2}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["status"], Project.STATUS_COMPLETED)

    def test_some_hours_move_incompleted_to_in_progress(self):
        project = self.make(estimated_hours=4, completed_hours=1, status=Project.STATUS_INCOMPLETED)
        self.assertEqual(project.status, Project.STATUS_IN_PROGRESS)

    def test_completed_status_below_the_estimate_is_corrected(self):
        project = self.make(estimated_hours=4, completed_hours=1)
        response = self.client.patch(
            f"/api/v1/projects/{project.pk}/", {"status": Project.STATUS_COMPLETED}, format="json"
        )
        self.assertEqual(response.data["status"], Project.STATUS_IN_PROGRESS)

    def test_skipped_and_no_estimate_are_left_alone(self):
        skipped = self.make(estimated_hours=2, completed_hours=2, status=Project.STATUS_SKIPPED)
        self.assertEqual(skipped.status, Project.STATUS_SKIPPED)
        no_estimate = self.make(estimated_hours=0, completed_hours=0, status=Project.STATUS_COMPLETED)
        self.assertEqual(no_estimate.status, Project.STATUS_COMPLETED)

    def test_save_with_update_fields_also_saves_status(self):
        project = self.make(estimated_hours=2, completed_hours=0, status=Project.STATUS_INCOMPLETED)
        project.completed_hours = 2
        project.save(update_fields=["completed_hours"])
        project.refresh_from_db()
        self.assertEqual(project.status, Project.STATUS_COMPLETED)


class StudyBlockProgressTests(APITestCase):
    """ROADMAP B3.3: marking a block done updates its project in the same request."""

    def setUp(self):
        self.user = Account.objects.create_user(username="sam", email="sam@example.com", password="x")
        self.client.force_authenticate(self.user)
        self.project = Project.objects.create(
            user=self.user, title="Essay", estimated_hours=2, completed_hours="0.50",
            status=Project.STATUS_IN_PROGRESS,
        )
        self.block = StudyBlock.objects.create(
            user=self.user, project=self.project, date="2026-11-18",
            start_time="09:00", end_time="09:45",
        )

    def patch_block(self, **changes):
        response = self.client.patch(f"/api/v1/study-blocks/{self.block.pk}/", changes, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.project.refresh_from_db()

    def test_done_adds_hours_and_undo_removes_them(self):
        self.patch_block(completed=True)
        self.assertEqual(self.project.completed_hours, Decimal("1.25"))
        self.patch_block(completed=False)
        self.assertEqual(self.project.completed_hours, Decimal("0.50"))

    def test_saving_a_done_block_again_does_not_count_twice(self):
        self.patch_block(completed=True)
        self.patch_block(completed=True)
        self.assertEqual(self.project.completed_hours, Decimal("1.25"))

    def test_reaching_the_estimate_completes_the_project(self):
        self.project.completed_hours = "1.50"
        self.project.save()
        self.patch_block(completed=True)
        self.assertEqual(self.project.completed_hours, Decimal("2.25"))
        self.assertEqual(self.project.status, Project.STATUS_COMPLETED)
        self.patch_block(completed=False)
        self.assertEqual(self.project.status, Project.STATUS_IN_PROGRESS)

    def test_undo_never_goes_below_zero(self):
        self.patch_block(completed=True)
        Project.objects.filter(pk=self.project.pk).update(completed_hours=0)
        self.patch_block(completed=False)
        self.assertEqual(self.project.completed_hours, Decimal("0"))

    def test_changing_a_done_blocks_times_adjusts_the_hours(self):
        self.patch_block(completed=True)
        self.patch_block(end_time="10:00")
        self.assertEqual(self.project.completed_hours, Decimal("1.50"))

    def test_moving_a_done_block_moves_its_hours(self):
        other = Project.objects.create(user=self.user, title="Lab", estimated_hours=5, completed_hours=0)
        self.patch_block(completed=True)
        self.patch_block(project=other.pk)
        other.refresh_from_db()
        self.assertEqual(self.project.completed_hours, Decimal("0.50"))
        self.assertEqual(other.completed_hours, Decimal("0.75"))

    def test_saves_outside_the_api_update_the_project_too(self):
        # Django admin and scripts call save() directly.
        self.block.completed = True
        self.block.save()
        self.project.refresh_from_db()
        self.assertEqual(self.project.completed_hours, Decimal("1.25"))


class ServerValidationTests(APITestCase):
    """ROADMAP B1.2: the API enforces the same rules as the frontend forms."""

    def setUp(self):
        self.user = Account.objects.create_user(username="sam", email="sam@example.com", password="x")
        self.client.force_authenticate(self.user)

    def post(self, resource, body):
        return self.client.post(f"/api/v1/{resource}/", body, format="json")

    def patch(self, resource, pk, body):
        return self.client.patch(f"/api/v1/{resource}/{pk}/", body, format="json")

    def assert_rejected(self, response, field):
        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn(field, response.data)

    # --- Commitments ---

    def commitment(self, **changes):
        body = {"title": "Shift", "recuring": True, "weekdays": "0,2",
                "start_time": "09:00", "end_time": "17:00"}
        body.update(changes)
        return self.post("commitments", body)

    def test_valid_commitments_save(self):
        self.assertEqual(self.commitment().status_code, 201)
        self.assertEqual(self.commitment(recuring=False, weekdays="", date="2026-11-20").status_code, 201)

    def test_commitment_rules(self):
        self.assert_rejected(self.commitment(end_time="09:00"), "end_time")
        self.assert_rejected(self.commitment(start_time=None), "start_time")
        self.assert_rejected(self.commitment(weekdays=""), "weekdays")
        self.assert_rejected(self.commitment(weekdays="mon,7"), "weekdays")
        self.assert_rejected(self.commitment(recuring=False, weekdays=""), "date")
        self.assert_rejected(
            self.commitment(active_from="2026-11-20", active_to="2026-11-19"), "active_to"
        )

    def test_commitment_patch_is_checked_against_stored_values(self):
        pk = self.commitment().data["id"]
        self.assert_rejected(self.patch("commitments", pk, {"end_time": "08:00"}), "end_time")
        self.assertEqual(self.patch("commitments", pk, {"title": "Work"}).status_code, 200)

    # --- Day overrides ---

    def test_day_override_rules(self):
        self.assertEqual(self.post("day-overrides", {"date": "2026-11-20"}).status_code, 201)
        self.assertEqual(
            self.post("day-overrides", {"date": "2026-11-20", "start_time": "13:00", "end_time": "15:00"}).status_code,
            201,
        )
        self.assert_rejected(self.post("day-overrides", {"reason": "sick"}), "date")
        self.assert_rejected(
            self.post("day-overrides", {"date": "2026-11-20", "start_time": "15:00", "end_time": "13:00"}),
            "end_time",
        )
        self.assert_rejected(
            self.post("day-overrides", {"date": "2026-11-20", "start_time": "15:00"}), "end_time"
        )

    # --- Planner settings ---

    def settings(self, **changes):
        body = {"day_start_time": "09:00", "day_end_time": "19:00", "work_days": "0,1,2,3,4",
                "max_hours_per_day": 6, "min_block_minutes": 30, "max_block_minutes": 120,
                "break_minutes": 15}
        body.update(changes)
        return self.post("planner-settings", body)

    def test_valid_settings_and_empty_defaults_save(self):
        self.assertEqual(self.settings().status_code, 201)
        # Empty or 0 means "use the default", as the scheduler reads it.
        self.assertEqual(self.post("planner-settings", {}).status_code, 201)
        self.assertEqual(
            self.settings(work_days="", max_hours_per_day=0, min_block_minutes=0, max_block_minutes=0).status_code,
            201,
        )

    def test_settings_rules(self):
        self.assert_rejected(self.settings(day_end_time="08:00"), "day_end_time")
        self.assert_rejected(self.settings(max_hours_per_day=25), "max_hours_per_day")
        self.assert_rejected(self.settings(min_block_minutes=10), "min_block_minutes")
        self.assert_rejected(self.settings(max_block_minutes=10), "max_block_minutes")
        self.assert_rejected(self.settings(min_block_minutes=90, max_block_minutes=60), "max_block_minutes")
        self.assert_rejected(self.settings(break_minutes=-5), "break_minutes")
        self.assert_rejected(self.settings(work_days="8"), "work_days")
        # Compared with the default when one side is empty: 150 > default max 120.
        self.assert_rejected(self.settings(min_block_minutes=150, max_block_minutes=0), "max_block_minutes")

    # --- Projects ---

    def test_completed_hours_cannot_pass_the_estimate(self):
        self.assert_rejected(
            self.post("projects", {"title": "Essay", "estimated_hours": 2, "completed_hours": 3}),
            "completed_hours",
        )
        pk = self.post("projects", {"title": "Essay", "estimated_hours": 2}).data["id"]
        response = self.patch("projects", pk, {"completed_hours": 2.5})
        self.assert_rejected(response, "completed_hours")
        self.assertIn("(2 h)", str(response.data["completed_hours"]))
        self.assert_rejected(
            self.patch("projects", pk, {"estimated_hours": 0.5, "completed_hours": 1}), "completed_hours"
        )
        self.assertEqual(self.patch("projects", pk, {"completed_hours": 2}).status_code, 200)

    def test_task_over_its_estimate_from_blocks_can_still_be_edited(self):
        # Done blocks can push the hours past the estimate. Editing the task
        # (the form resends both hour fields unchanged) must still work.
        project = Project.objects.create(user=self.user, title="Essay", estimated_hours=1, completed_hours="1.50")
        response = self.patch(
            "projects", project.pk, {"title": "Essay v2", "estimated_hours": 1, "completed_hours": 1.5}
        )
        self.assertEqual(response.status_code, 200, response.data)
