import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, Calendar, Clock, MapPin, Video } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, statusToTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionLoader } from "@/components/ui/Spinner";
import { Tabs } from "@/components/ui/Tabs";
import { listMyBookings } from "@/features/bookings/api";
import { staggerContainer, staggerItem } from "@/lib/motion/tokens";
import { prefersReducedMotion } from "@/lib/motion/quality";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
] as const;

export function ParentBookingsPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("upcoming");
  const still = prefersReducedMotion();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["parent-bookings", activeTab],
    queryFn: () =>
      listMyBookings(
        activeTab === "upcoming"
          ? { upcoming: true }
          : activeTab === "completed"
            ? { status: "completed" }
            : { status: "cancelled" }
      ),
  });

  return (
    <div>
      <PageHeader title="Bookings" description="Every session for children linked to your account." />

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
              title="We couldn't load bookings"
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
              <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <Avatar
                  src={booking.student.user.avatar}
                  firstName={booking.student.user.first_name}
                  lastName={booking.student.user.last_name}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-navy">
                      {booking.student.user.first_name} with {booking.tutor.user.full_name}
                    </p>
                    {booking.is_demo && <Badge tone="gold">Demo</Badge>}
                    <Badge tone={statusToTone(booking.status)}>{booking.status.replace("_", " ")}</Badge>
                  </div>
                  {booking.subject && <p className="text-sm text-slate-500">{booking.subject.name}</p>}

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {formatDate(booking.start_time)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {formatTime(booking.start_time)}
                    </span>
                    <span className="flex items-center gap-1">
                      {booking.mode === "online" ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                      {booking.mode === "online" ? "Online" : booking.location || "In-person"}
                    </span>
                  </div>
                </div>
                <p className="font-mono font-semibold text-navy">{formatCurrency(booking.price, booking.currency)}</p>
              </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="rounded-card border border-dashed border-line py-16 text-center">
            <p className="font-medium text-navy">No {activeTab} bookings</p>
            <p className="mt-1 text-sm text-slate-500">
              Sessions appear here once a linked child has bookings, or you book on their behalf from a tutor's page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
