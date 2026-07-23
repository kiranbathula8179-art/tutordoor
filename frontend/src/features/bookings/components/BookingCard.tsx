import { Calendar, Clock, MapPin, Video } from "lucide-react";
import { Link } from "react-router-dom";

import { Avatar } from "@/components/ui/Avatar";
import { Badge, statusToTone } from "@/components/ui/Badge";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import type { Booking } from "@/types";

export function BookingCard({ booking, viewerRole }: { booking: Booking; viewerRole: "student" | "tutor" }) {
  const counterpart = viewerRole === "student" ? booking.tutor.user : booking.student.user;
  const detailPath = viewerRole === "student" ? `/student/bookings/${booking.id}` : `/tutor/bookings/${booking.id}`;

  return (
    <Link
      to={detailPath}
      className="flex flex-col gap-4 rounded-card border border-line bg-canvas p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:flex-row sm:items-center"
    >
      <Avatar src={counterpart.avatar} firstName={counterpart.first_name} lastName={counterpart.last_name} size="lg" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-navy">{counterpart.full_name}</p>
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

      <div className="text-right">
        <p className="font-mono font-semibold text-navy">{formatCurrency(booking.price, booking.currency)}</p>
      </div>
    </Link>
  );
}
