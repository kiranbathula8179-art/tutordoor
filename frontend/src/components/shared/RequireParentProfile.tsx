import { AlertCircle, type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Shared gate for parent-portal pages that hang off a ParentProfile
 * (Dashboard, Children). Distinguishes "you haven't activated a profile yet"
 * from a genuine fetch failure (show a retry — a transient 500 must never be
 * presented as "no profile").
 */
export function RequireParentProfile({
  icon: Icon,
  title,
  description,
  action,
  hasError,
  onRetry,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  hasError?: boolean;
  onRetry?: () => void;
}) {
  if (hasError) {
    return (
      <Card>
        <EmptyState
          icon={AlertCircle}
          title="We couldn't load your parent profile"
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
    <Card>
      <EmptyState icon={Icon} title={title} description={description} action={action} />
    </Card>
  );
}
