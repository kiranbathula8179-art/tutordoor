import { Component, type ErrorInfo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

/**
 * ErrorBoundary — the app's last line of defence (production-readiness audit,
 * finding HIGH-1: the application previously had none, so a single render
 * exception blanked the entire tree with no recovery path).
 *
 * Deliberate implementation notes:
 * - The fallback uses plain elements + design-system classes rather than our
 *   own UI components. If the crash originated inside a shared component,
 *   rendering that same component in the fallback would crash again.
 * - Error details are shown ONLY in development (`import.meta.env.DEV`).
 *   Production users get a friendly message with no stack traces, which could
 *   otherwise leak internal paths and implementation detail.
 * - `resetKey` lets a parent clear the error automatically (see
 *   RouteErrorBoundary below): without it, one crashed route would stay
 *   crashed for the rest of the session even after navigating away.
 */

interface ErrorBoundaryProps {
  children: ReactNode;
  /** When this value changes, a caught error is cleared automatically. */
  resetKey?: string;
  /** Optional label used in the dev panel to identify which boundary caught. */
  label?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Always surface the error to the console so it reaches browser logs and
    // any attached reporter. Hook point for Sentry/LogRocket when configured:
    //   Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    console.error(
      `[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ""}]`,
      error,
      errorInfo.componentStack
    );
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  handleRetry = () => this.setState({ error: null });

  handleReload = () => window.location.reload();

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const isDev = import.meta.env.DEV;

    return (
      <div
        role="alert"
        className="flex min-h-[60vh] items-center justify-center bg-surface px-4 py-16"
      >
        <div className="w-full max-w-lg rounded-2xl border border-line bg-canvas p-8 text-center shadow-soft">
          <span
            aria-hidden="true"
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-danger-subtle text-2xl text-danger-dark"
          >
            !
          </span>

          <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-navy">
            Something went wrong
          </h1>
          <p className="mt-2 text-slate-500">
            This part of TutorDoor failed to load. Your account, bookings, and payments are
            unaffected — nothing was lost.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <button
              onClick={this.handleRetry}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
            >
              Try again
            </button>
            <button
              onClick={this.handleReload}
              className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Reload page
            </button>
            <a
              href="/"
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Go home
            </a>
          </div>

          {isDev && (
            <details className="mt-6 rounded-xl border border-line bg-surface p-3 text-left">
              <summary className="cursor-pointer text-xs font-semibold text-danger-dark">
                Developer details (hidden in production)
              </summary>
              <p className="mt-2 break-words font-mono text-xs text-navy">{error.message}</p>
              {error.stack && (
                <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words font-mono text-[0.7rem] leading-relaxed text-slate-500">
                  {error.stack}
                </pre>
              )}
            </details>
          )}
        </div>
      </div>
    );
  }
}

/**
 * RouteErrorBoundary — an ErrorBoundary that resets itself whenever the route
 * changes, so a crash on one page doesn't persist across navigation. Must be
 * rendered inside a Router (it reads location).
 */
export function RouteErrorBoundary({ children, label }: { children: ReactNode; label?: string }) {
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={location.pathname} label={label}>
      {children}
    </ErrorBoundary>
  );
}
