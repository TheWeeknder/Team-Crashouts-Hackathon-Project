import { useState } from "react";

import useCurrentUser from "./hooks/useCurrentUser";
import useLogout from "./hooks/useLogout";

import Modal from "./components/Modal";
import SettingsForm from "./components/forms/SettingsForm";
import CalendarPage from "./pages/CalendarPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SchedulePage from "./pages/SchedulePage";
import TasksPage from "./pages/TasksPage";

type AppView = "dashboard" | "calendar" | "tasks" | "schedule";
type AuthView = "login" | "register";

const navigation: { id: AppView; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "calendar", label: "Calendar" },
  { id: "tasks", label: "Tasks" },
  { id: "schedule", label: "Schedule" },
];

function App() {
  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const [authView, setAuthView] = useState<AuthView>("login");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { user } = useCurrentUser();
  const signOut = useLogout();

  // Start the next login on the dashboard, not on the last page used.
  function logout() {
    setActiveView("dashboard");
    setSettingsOpen(false);
    signOut();
  }

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
              onClick={() => setActiveView("dashboard")}
              aria-label="Adaptive Study Planner dashboard"
            >
              <span
                className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-extrabold text-primary-content shadow-md"
                aria-hidden="true"
              >
                TC
              </span>
              <span className="hidden flex-col leading-tight sm:flex">
                <span className="font-bold">Adaptive Study Planner</span>
                <span className="text-xs text-base-content/60">
                  Team Crashouts
                </span>
              </span>
            </button>
          </div>

          <nav
            className="navbar-center hidden lg:flex"
            aria-label="Main navigation"
          >
            <ul className="menu menu-horizontal gap-1 rounded-full bg-base-200 p-1">
              {navButtons}
            </ul>
          </nav>

          <div className="navbar-end gap-3">
            <span className="hidden text-sm text-base-content/70 md:inline">
              Signed in as{" "}
              <strong className="text-base-content">{user.username}</strong>
            </span>
            <div className="dropdown dropdown-end">
              <button
                type="button"
                tabIndex={0}
                className="avatar avatar-placeholder btn btn-ghost btn-circle"
                aria-label="Account menu"
              >
                <div className="w-9 rounded-full bg-primary/15 text-primary">
                  <span className="text-xs font-bold">{initials}</span>
                </div>
              </button>
              <ul
                tabIndex={0}
                className="menu dropdown-content z-50 mt-3 w-52 rounded-box bg-base-100 p-2 shadow-lg"
              >
                <li className="menu-title md:hidden">{user.username}</li>
                <li>
                  <button type="button" onClick={() => setSettingsOpen(true)}>
                    Planner settings
                  </button>
                </li>
                <li>
                  <button type="button" onClick={logout}>
                    Log out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      <main id="planner-content" className="flex-1">
        {activeView === "dashboard" && (
          <DashboardPage onOpenSettings={() => setSettingsOpen(true)} />
        )}

        {activeView === "calendar" && <CalendarPage />}

        {activeView === "tasks" && <TasksPage />}

        {activeView === "schedule" && (
          <SchedulePage onOpenSettings={() => setSettingsOpen(true)} />
        )}
      </main>

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Planner settings"
        description="When you like to study. The planner only schedules sessions inside these hours."
      >
        <SettingsForm onDone={() => setSettingsOpen(false)} />
      </Modal>

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
