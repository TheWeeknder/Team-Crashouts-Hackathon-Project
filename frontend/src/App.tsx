import { useState } from "react";

import useCurrentUser from "./hooks/useCurrentUser";
import useLogout from "./hooks/useLogout";

import CalendarPage from "./pages/CalendarPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

type AppView = "overview" | "dashboard" | "calendar";
type AuthView = "login" | "register";

const navigation: { id: AppView; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "dashboard", label: "Dashboard" },
  { id: "calendar", label: "Calendar" },
];

const features = [
  {
    number: "01",
    title: "Plan around your life",
    description:
      "Bring deadlines, work shifts, activities, and personal time into one study plan.",
  },
  {
    number: "02",
    title: "See your next steps",
    description:
      "Use monthly and weekly views to see when to study and what to work on.",
  },
  {
    number: "03",
    title: "Track your progress",
    description:
      "Compare completed hours with task estimates and keep your remaining work visible.",
  },
  {
    number: "04",
    title: "Spot problems early",
    description:
      "The planner is designed to flag deadlines at risk and adjust when your availability changes.",
  },
];

function App() {
  const [activeView, setActiveView] = useState<AppView>("overview");
  const [authView, setAuthView] = useState<AuthView>("login");

  const { user } = useCurrentUser();
  const logout = useLogout();

  // Preserve the existing authentication flow.
  if (!user) {
    return authView === "register" ? (
      <RegisterPage
        onShowLogin={() => setAuthView("login")}
        onSuccess={() => setAuthView("login")}
      />
    ) : (
      <LoginPage onShowRegister={() => setAuthView("register")} />
    );
  }

  const initials = user.username.slice(0, 2).toUpperCase();

  const navButtons = navigation.map((item) => (
    <li key={item.id}>
      <button
        type="button"
        className={activeView === item.id ? "menu-active font-semibold" : ""}
        onClick={() => setActiveView(item.id)}
        aria-current={activeView === item.id ? "page" : undefined}
      >
        {item.label}
      </button>
    </li>
  ));

  return (
    <div className="flex min-h-screen flex-col">
      <a
        className="btn btn-primary btn-sm absolute left-4 top-2 z-50 -translate-y-16 focus:translate-y-0"
        href="#planner-content"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-base-300 bg-base-100/85 backdrop-blur">
        <div className="navbar mx-auto max-w-7xl px-4">
          <div className="navbar-start gap-1">
            {/* Mobile menu */}
            <div className="dropdown lg:hidden">
              <button
                type="button"
                tabIndex={0}
                className="btn btn-ghost btn-square"
                aria-label="Open navigation"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <ul
                tabIndex={0}
                className="menu dropdown-content z-50 mt-3 w-52 rounded-box bg-base-100 p-2 shadow-lg"
              >
                {navButtons}
              </ul>
            </div>

            <button
              type="button"
              className="flex items-center gap-3 rounded-box px-2 py-1 text-left transition hover:bg-base-200"
              onClick={() => setActiveView("overview")}
              aria-label="Adaptive Study Planner overview"
            >
              <span
                className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-extrabold text-primary-content shadow-md"
                aria-hidden="true"
              >
                CP
              </span>
              <span className="hidden flex-col leading-tight sm:flex">
                <span className="font-bold">Adaptive Study Planner</span>
                <span className="text-xs text-base-content/60">
                  Team Crashouts
                </span>
              </span>
            </button>
          </div>

          <nav className="navbar-center hidden lg:flex" aria-label="Main navigation">
            <ul className="menu menu-horizontal gap-1 rounded-full bg-base-200 p-1">
              {navButtons}
            </ul>
          </nav>

          <div className="navbar-end gap-3">
            <span className="hidden text-sm text-base-content/70 md:inline">
              Signed in as{" "}
              <strong className="text-base-content">{user.username}</strong>
            </span>
            <div className="avatar avatar-placeholder" aria-hidden="true">
              <div className="w-9 rounded-full bg-primary/15 text-primary">
                <span className="text-xs font-bold">{initials}</span>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={logout}
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main id="planner-content" className="flex-1">
        {activeView === "overview" && (
          <div className="mx-auto max-w-7xl space-y-16 px-4 py-10 sm:py-16">
            <section
              className="grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]"
              aria-labelledby="planner-hero-title"
            >
              <div>
                <span className="badge badge-primary badge-soft font-medium">
                  Hack-A-Ton · Education / Wildcard
                </span>

                <h1
                  id="planner-hero-title"
                  className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
                >
                  A study plan that{" "}
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    makes room for life.
                  </span>
                </h1>

                <p className="mt-5 max-w-xl text-lg text-base-content/70">
                  Balance deadlines with work, activities, and time for
                  yourself. Adaptive Study Planner brings your commitments
                  and study sessions together so you can focus on what comes
                  next.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    onClick={() => setActiveView("dashboard")}
                  >
                    Open dashboard
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-lg"
                    onClick={() => setActiveView("calendar")}
                  >
                    View calendar
                  </button>
                </div>
              </div>

              <aside
                className="card border border-base-300 bg-base-100 shadow-xl"
                aria-labelledby="planner-example-title"
              >
                <div className="card-body gap-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    How it helps
                  </p>
                  <h2 id="planner-example-title" className="card-title text-2xl">
                    Know when a deadline needs attention.
                  </h2>
                  <p className="text-sm text-base-content/60">
                    Illustrative example, not your account data.
                  </p>

                  <dl className="stats stats-horizontal border border-base-300 bg-base-200/50">
                    <div className="stat">
                      <dt className="stat-title">Work remaining</dt>
                      <dd className="stat-value text-primary">7 hrs</dd>
                    </div>
                    <div className="stat">
                      <dt className="stat-title">Available time</dt>
                      <dd className="stat-value text-secondary">5 hrs</dd>
                    </div>
                  </dl>

                  <div role="alert" className="alert alert-warning alert-soft items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="size-6 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                      />
                    </svg>
                    <div>
                      <h3 className="font-bold">2-hour shortfall</h3>
                      <p className="text-sm">
                        Identify the gap early, then adjust your
                        availability, priorities, or project scope.
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </section>

            <section aria-labelledby="planner-features-title">
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                  Built for busy students
                </p>
                <h2
                  id="planner-features-title"
                  className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
                >
                  Less time organizing. More time making progress.
                </h2>
                <p className="mt-4 text-base-content/70">
                  Our goal is to turn deadlines and real-life constraints
                  into a manageable study timetable.
                </p>
              </div>

              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {features.map((feature) => (
                  <article
                    key={feature.number}
                    className="card border border-base-300 bg-base-100 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="card-body">
                      <span
                        className="grid size-11 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary"
                        aria-hidden="true"
                      >
                        {feature.number}
                      </span>
                      <h3 className="card-title mt-2 text-lg">{feature.title}</h3>
                      <p className="text-sm text-base-content/70">
                        {feature.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section
              className="card bg-gradient-to-r from-primary to-secondary text-primary-content shadow-xl"
              aria-labelledby="planner-project-note-title"
            >
              <div className="card-body flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2
                    id="planner-project-note-title"
                    className="text-2xl font-bold"
                  >
                    Built by Team Crashouts
                  </h2>
                  <p className="mt-1 opacity-90">
                    A Hack-A-Ton project exploring a more adaptable approach
                    to student time management.
                  </p>
                </div>
                <span className="badge badge-lg border-0 bg-base-100/20 font-medium text-primary-content">
                  Hackathon prototype
                </span>
              </div>
            </section>
          </div>
        )}

        {activeView === "dashboard" && <DashboardPage />}

        {activeView === "calendar" && <CalendarPage />}
      </main>

      <footer className="border-t border-base-300 bg-base-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-6 text-sm text-base-content/60 sm:flex-row sm:justify-between">
          <p>Team Crashouts · Adaptive Study Planner</p>
          <p>Plan realistically. Make room for life.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
