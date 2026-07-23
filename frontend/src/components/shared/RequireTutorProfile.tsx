import { AlertCircle, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Shared gate for tutor-portal pages that hang off a TutorProfile
 * (Availability, Courses, Verification). Distinguishes "you haven't created
 * a profile yet" (show the create-profile CTA) from a genuine fetch failure
 * (show a retry — a transient 500 must never be presented as "no profile").
 */
export function RequireTutorProfile({
  icon: Icon,
  title,
  description,
  hasError,
  onRetry,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  hasError?: boolean;
  onRetry?: () => void;
}) {
  if (hasError) {
    return (
      <Card className="mt-6">
        <EmptyState
          icon={AlertCircle}
          title="We couldn't load your tutor profile"
          description="Something went wrong reaching the server. Check your connection and try again."
          action={
            <Button variant="outline" onClick={onRetry}>
              Retry
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <EmptyState
        icon={Icon}
        title={title}
        description={description}
        action={
          <Link to="/tutor/profile">
            <Button>Set up my profile</Button>
          </Link>
        }
      />
    </Card>
  );
}
