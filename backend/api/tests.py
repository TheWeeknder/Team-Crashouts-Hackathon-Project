from rest_framework.test import APITestCase

from .models import Account, Project


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
