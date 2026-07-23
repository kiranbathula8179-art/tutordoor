import { describe, expect, it } from "vitest";

import { cn, formatCurrency, getErrorMessage, initials } from "@/lib/utils";

describe("cn", () => {
  it("merges class names and resolves Tailwind conflicts", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("ignores falsy values", () => {
    expect(cn("text-ink", false, undefined, "font-bold")).toBe("text-ink font-bold");
  });
});

describe("formatCurrency", () => {
  it("formats a numeric string as INR by default", () => {
    expect(formatCurrency("1500")).toContain("1,500");
  });

  it("formats a plain number", () => {
    expect(formatCurrency(999.5)).toContain("999.5");
  });
});

describe("initials", () => {
  it("builds initials from first and last name", () => {
    expect(initials("Ada", "Lovelace")).toBe("AL");
  });

  it("handles missing names gracefully", () => {
    expect(initials("", "")).toBe("");
  });
});

describe("getErrorMessage", () => {
  it("extracts a message from an axios-like error response", () => {
    const error = { response: { data: { message: "Invalid credentials." } } };
    expect(getErrorMessage(error)).toBe("Invalid credentials.");
  });

  it("falls back to a generic message for unknown errors", () => {
    expect(getErrorMessage("not an error object")).toBe("Something went wrong. Please try again.");
  });

  it("uses the Error message when given a plain Error", () => {
    expect(getErrorMessage(new Error("Network failure"))).toBe("Network failure");
  });
});
