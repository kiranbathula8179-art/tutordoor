import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CalendarDays } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionLoader } from "@/components/ui/Spinner";
import { Tabs } from "@/components/ui/Tabs";
import { BookingCard } from "@/features/bookings/components/BookingCard";
import { listMyBookings } from "@/features/bookings/api";

import { useAuthStore } from "@/store/auth-store";

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
] as const;

export function BookingsListPage() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("upcoming");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-bookings", activeTab],
    queryFn: () =>
      listMyBookings(
        activeTab === "upcoming"
          ? { upcoming: true }
          : activeTab === "completed"
            ? { status: "completed" }
            : { status: "cancelled" }
      ),
  });

  const viewerRole = user?.role === "tutor" ? "tutor" : "student";

  return (
    <div>
      <PageHeader title="My bookings" />

      <Tabs
        className="mt-4"
        items={TABS.map(({ key, label }) => ({ value: key, label }))}
        value={activeTab}
        onChange={(value) => setActiveTab(value as (typeof TABS)[number]["key"])}
      />

      <div className="mt-6">
        {isLoading ? (
          <SectionLoader />
        ) : isError ? (
          <div className="rounded-card border border-line bg-canvas shadow-soft">
            <EmptyState
              icon={AlertCircle}
              title="We couldn't load your bookings"
              description="Something went wrong reaching the server. Check your connection and try again."
              action={
                <Button variant="outline" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          </div>
        ) : data && data.results.length > 0 ? (
          <div className="space-y-4">
            {data.results.map((booking) => (
              <BookingCard key={booking.id} booking={booking} viewerRole={viewerRole} />
            ))}
          </div>
        ) : (
          <div className="rounded-card border border-line bg-canvas shadow-soft">
            <EmptyState
              icon={CalendarDays}
              title={`No ${activeTab} bookings`}
              description={activeTab === "upcoming" ? "Book a session to see it here." : "Nothing to show yet."}
            />
          </div>
        )}
      </div>
    </div>
  );
}
