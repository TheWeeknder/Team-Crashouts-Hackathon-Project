import { useState } from "react";

import useCurrentUser from "./hooks/useCurrentUser";
import useLogout from "./hooks/useLogout";

import CalendarPage from "./pages/CalendarPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import "./App.css";

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

  return (
    <div className="planner-app">
      <a className="planner-skip-link" href="#planner-content">
        Skip to content
      </a>

      <header className="planner-header">
        <div className="planner-header-inner">
          <button
            type="button"
            className="planner-brand"
            onClick={() => setActiveView("overview")}
            aria-label="Adaptive Study Planner overview"
          >
            <span className="planner-brand-mark" aria-hidden="true">
              CP
            </span>

            <span className="planner-brand-text">
              <span className="planner-brand-title">
                Adaptive Study Planner
              </span>
              <span className="planner-brand-subtitle">
                Team Crashouts
              </span>
            </span>
          </button>

          <nav className="planner-nav" aria-label="Main navigation">
            {navigation.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`planner-nav-button ${
                  activeView === item.id ? "is-active" : ""
                }`}
                onClick={() => setActiveView(item.id)}
                aria-pressed={activeView === item.id}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="planner-session">
            <span className="planner-user">
              Signed in as <strong>{user.username}</strong>
            </span>

            <button
              type="button"
              className="planner-button planner-button-outline"
              onClick={logout}
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main id="planner-content" className="planner-content">
        {activeView === "overview" && (
          <div className="planner-overview">
            <section
              className="planner-hero"
              aria-labelledby="planner-hero-title"
            >
              <div className="planner-hero-copy">
                <p className="planner-eyebrow">
                  Hack-A-Ton · Education / Wildcard
                </p>

                <h1 id="planner-hero-title">
                  A study plan that makes room for life.
                </h1>

                <p className="planner-hero-description">
                  Balance deadlines with work, activities, and time
                  for yourself. Adaptive Study Planner brings your
                  commitments and study sessions together so you can
                  focus on what comes next.
                </p>

                <div className="planner-hero-actions">
                  <button
                    type="button"
                    className="planner-button planner-button-primary"
                    onClick={() => setActiveView("dashboard")}
                  >
                    Open dashboard
                  </button>

                  <button
                    type="button"
                    className="planner-button planner-button-outline"
                    onClick={() => setActiveView("calendar")}
                  >
                    View calendar
                  </button>
                </div>
              </div>

              <aside
                className="planner-example"
                aria-labelledby="planner-example-title"
              >
                <p className="planner-eyebrow">How it helps</p>

                <h2 id="planner-example-title">
                  Know when a deadline needs attention.
                </h2>

                <p className="planner-example-caption">
                  Illustrative example — not your account data.
                </p>

                <dl className="planner-example-stats">
                  <div>
                    <dt>Work remaining</dt>
                    <dd>7 hrs</dd>
                  </div>

                  <div>
                    <dt>Available time</dt>
                    <dd>5 hrs</dd>
                  </div>
                </dl>

                <div className="planner-example-warning">
                  <h3>2-hour shortfall</h3>
                  <p>
                    Identify the gap early, then adjust your
                    availability, priorities, or project scope.
                  </p>
                </div>
              </aside>
            </section>

            <section
              className="planner-features"
              aria-labelledby="planner-features-title"
            >
              <div className="planner-section-heading">
                <p className="planner-eyebrow">
                  Built for busy students
                </p>

                <h2 id="planner-features-title">
                  Less time organizing. More time making progress.
                </h2>

                <p>
                  Our goal is to turn deadlines and real-life
                  constraints into a manageable study timetable.
                </p>
              </div>

              <div className="planner-feature-grid">
                {features.map((feature) => (
                  <article
                    key={feature.number}
                    className="planner-feature-card"
                  >
                    <span
                      className="planner-feature-number"
                      aria-hidden="true"
                    >
                      {feature.number}
                    </span>

                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section
              className="planner-project-note"
              aria-labelledby="planner-project-note-title"
            >
              <div>
                <h2 id="planner-project-note-title">
                  Built by Team Crashouts
                </h2>

                <p>
                  A Hack-A-Ton project exploring a more adaptable
                  approach to student time management.
                </p>
              </div>

              <span className="planner-project-badge">
                Hackathon prototype
              </span>
            </section>
          </div>
        )}

        {activeView === "dashboard" && <DashboardPage />}

        {activeView === "calendar" && <CalendarPage />}
      </main>

      <footer className="planner-footer">
        <div className="planner-footer-inner">
          <p>Team Crashouts · Adaptive Study Planner</p>
          <p>Plan realistically. Make room for life.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;