import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/shared/StarRating";

describe("Button", () => {
  it("renders children and responds to clicks", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Book now</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Book now" }));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("is disabled while loading and does not fire onClick", async () => {
    const handleClick = vi.fn();
    render(
      <Button isLoading onClick={handleClick}>
        Submitting
      </Button>
    );

    const button = screen.getByRole("button", { name: "Submitting" });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});

describe("StarRating", () => {
  it("shows the numeric rating and review count by default", () => {
    render(<StarRating rating={4.8} count={210} />);
    expect(screen.getByText("4.8")).toBeInTheDocument();
    expect(screen.getByText("(210)")).toBeInTheDocument();
  });

  it("hides the numeric value when showValue is false", () => {
    render(<StarRating rating={4.8} showValue={false} />);
    expect(screen.queryByText("4.8")).not.toBeInTheDocument();
  });
});
