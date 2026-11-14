import WeeklyCalendar from "../components/WeeklyCalendar";
import { mockEvents } from "../services/mocks";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <p className="mt-2">
          Your weekly study schedule. All times are shown in Edmonton
          time.
        </p>
      </header>

      <WeeklyCalendar
        events={mockEvents}
        initialDate="2026-11-16"
      />
    </div>
  );
}