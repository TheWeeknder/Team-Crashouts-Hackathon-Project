import type { ReactNode } from "react";

// Shared full-page frame for the login and register screens.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      {/* Soft background glow */}
      <div
        className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-primary/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-secondary/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <span
            className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-extrabold text-primary-content shadow-md"
            aria-hidden="true"
          >
            CP
          </span>
          <div className="leading-tight">
            <p className="font-bold">Adaptive Study Planner</p>
            <p className="text-xs text-base-content/60">Team Crashouts</p>
          </div>
        </div>

        <section className="card border border-base-300 bg-base-100 shadow-xl">
          <div className="card-body gap-5">{children}</div>
        </section>
      </div>
    </main>
  );
}
