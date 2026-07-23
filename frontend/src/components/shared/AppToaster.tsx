import { Toaster } from "react-hot-toast";

/**
 * App-wide toasts — V3 (polish program, item 7). White surface, line
 * border, dropdown shadow, Inter, semantic icon tints. This file was the
 * last v1 fossil in the codebase: its colors were inline hex, invisible to
 * the class-based codemod.
 */
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#FFFFFF",
          color: "#0F172A",
          border: "1px solid #E2E8F0",
          borderRadius: "0.75rem",
          padding: "0.75rem 1rem",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          fontSize: "0.9rem",
          boxShadow: "0 10px 24px -6px rgb(15 23 42 / 0.14), 0 4px 8px -4px rgb(15 23 42 / 0.08)",
        },
        success: { iconTheme: { primary: "#16A34A", secondary: "#FFFFFF" } },
        error: { iconTheme: { primary: "#DC2626", secondary: "#FFFFFF" } },
      }}
    />
  );
}
