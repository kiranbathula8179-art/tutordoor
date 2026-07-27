import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, CalendarDays, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionLoader } from "@/components/ui/Spinner";
import { Tabs } from "@/components/ui/Tabs";
import { BookingCard } from "@/features/bookings/components/BookingCard";
import { listMyBookings } from "@/features/bookings/api";
import { staggerContainer, staggerItem } from "@/lib/motion/tokens";
import { prefersReducedMotion } from "@/lib/motion/quality";

import { useAuthStore } from "@/store/auth-store";

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
] as const;

export function BookingsListPage() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("upcoming");
  const still = prefersReducedMotion();

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
          <Card>
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
          </Card>
        ) : data && data.results.length > 0 ? (
          <motion.div
            initial={still ? false : "hidden"}
            animate="show"
            variants={staggerContainer}
            className="space-y-4"
          >
            {data.results.map((booking) => (
              <motion.div key={booking.id} variants={staggerItem}>
                <BookingCard booking={booking} viewerRole={viewerRole} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <Card>
            <EmptyState
              icon={CalendarDays}
              title={`No ${activeTab} bookings`}
              description={activeTab === "upcoming" ? "Book a session to see it here." : "Nothing to show yet."}
              action={
                activeTab === "upcoming" && viewerRole === "student" ? (
                  <Link to="/search">
                    <Button>
                      <Search className="h-4 w-4" /> Find a tutor
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          </Card>
        )}
      </div>
    </div>
  );
}
