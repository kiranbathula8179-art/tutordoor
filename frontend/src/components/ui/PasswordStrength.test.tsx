import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PASSWORD_RULES, PasswordStrength } from "@/components/ui/PasswordStrength";

/**
 * The meter must agree with the password policy the schema enforces; a meter
 * that reads "Strong" for a password the form rejects is worse than none.
 */

describe("PASSWORD_RULES", () => {
  it("encodes the four policy rules", () => {
    expect(PASSWORD_RULES).toHaveLength(4);
  });

  it("rejects a password that is long but missing character classes", () => {
    const met = PASSWORD_RULES.filter((rule) => rule.test("abcdefghijkl"));
    expect(met).toHaveLength(1); // length only
  });

  it("accepts a password satisfying every rule", () => {
    const met = PASSWORD_RULES.filter((rule) => rule.test("Abcdefghij1!"));
    expect(met).toHaveLength(4);
  });

  it("requires both letter cases, not just one", () => {
    const caseRule = PASSWORD_RULES[1];
    expect(caseRule.test("abcdefghij")).toBe(false);
    expect(caseRule.test("ABCDEFGHIJ")).toBe(false);
    expect(caseRule.test("Abcdefghij")).toBe(true);
  });

  it("requires at least ten characters", () => {
    const lengthRule = PASSWORD_RULES[0];
    expect(lengthRule.test("Ab1!x")).toBe(false);
    expect(lengthRule.test("Ab1!xxxxxx")).toBe(true);
  });
});

describe("PasswordStrength", () => {
  it("renders nothing until the user types", () => {
    const { container } = render(<PasswordStrength value="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("reports a weak password with an accessible live summary", () => {
    render(<PasswordStrength value="abc" />);
    expect(screen.getByText(/0 of 4 requirements met/)).toBeInTheDocument();
  });

  it("reports a fully compliant password as strong", () => {
    render(<PasswordStrength value="Abcdefghij1!" />);
    expect(screen.getByText("Strong")).toBeInTheDocument();
    expect(screen.getByText(/4 of 4 requirements met/)).toBeInTheDocument();
  });

  it("lists every requirement so the rules are never colour-only", () => {
    render(<PasswordStrength value="abc" />);
    for (const rule of PASSWORD_RULES) {
      expect(screen.getByText(rule.label)).toBeInTheDocument();
    }
  });
});
