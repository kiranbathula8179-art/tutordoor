import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, MapPin, MessageCircle, SearchX, Video } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { Badge, statusToTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import { cancelBooking, getBooking, joinLiveClass } from "@/features/bookings/api";
import { startConversation } from "@/features/chat/api";
import { DURATION, EASE_OUT, riseInit } from "@/lib/motion/tokens";
import { formatCurrency, formatDate, formatTime, getErrorMessage } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

export function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => getBooking(bookingId!),
    enabled: !!bookingId,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(bookingId!, cancelReason),
    onSuccess: () => {
      toast.success("Booking cancelled.");
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      setCancelOpen(false);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const joinMutation = useMutation({
    mutationFn: () => joinLiveClass(bookingId!),
    onSuccess: (details) => {
      window.open(details.join_url, "_blank", "noopener,noreferrer");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const messageMutation = useMutation({
    mutationFn: () => {
      const recipient = user?.role === "tutor" ? booking!.student.user : booking!.tutor.user;
      return startConversation({ recipient_id: recipient.id, related_booking_id: booking!.id });
    },
    onSuccess: (conversation) => {
      const chatBase = user?.role === "tutor" ? "/tutor/chat" : "/student/chat";
      navigate(`${chatBase}?c=${conversation.id}`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (isLoading) return <PageLoader />;

  if (!booking) {
    const bookingsHome = user?.role === "tutor" ? "/tutor/bookings" : "/student/bookings";
    return (
      <Card className="mx-auto max-w-lg">
        <EmptyState
          icon={SearchX}
          title="Booking not found"
          description="It may have been cancelled, or the link is out of date."
          action={
            <Link to={bookingsHome}>
              <Button variant="outline">Back to bookings</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const backPath = user?.role === "tutor" ? "/tutor/bookings" : "/student/bookings";
  const canCancel = booking.status === "pending_payment" || booking.status === "confirmed";
  const canJoin = booking.status === "confirmed" && booking.mode === "online";
  const counterpart = user?.role === "tutor" ? booking.student.user : booking.tutor.user;

  return (
    <motion.div
      initial={riseInit(16)}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.slow, ease: EASE_OUT }}
      className="mx-auto max-w-2xl"
    >
      <Link to={backPath} className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> Back to bookings
      </Link>

      <Card>
        <CardBody>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-xl font-bold text-navy">Session with {counterpart.full_name}</h1>
              {booking.subject && <p className="text-slate-400">{booking.subject.name}</p>}
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Badge tone={statusToTone(booking.status)}>{booking.status.replace("_", " ")}</Badge>
              {booking.is_demo && <Badge tone="gold">Free demo</Badge>}
            </div>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <dt className="sr-only">Date</dt>
              <dd className="text-navy">{formatDate(booking.start_time)}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <dt className="sr-only">Time</dt>
              <dd className="text-navy">
                {formatTime(booking.start_time)} – {formatTime(booking.end_time)} ({booking.duration_minutes} min)
              </dd>
            </div>
            <div className="flex items-center gap-2">
              {booking.mode === "online" ? <Video className="h-4 w-4 text-slate-400" /> : <MapPin className="h-4 w-4 text-slate-400" />}
              <dt className="sr-only">Mode</dt>
              <dd className="text-navy">{booking.mode === "online" ? "Online session" : booking.location || "In-person"}</dd>
            </div>
          </dl>

          {booking.student_notes && (
            <div className="mt-4 rounded-lg bg-surface-3 p-3 text-sm">
              <p className="font-semibold text-navy">Notes</p>
              <p className="mt-1 text-slate-600">{booking.student_notes}</p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
            <div>
              <p className="text-sm text-slate-500">Price</p>
              <p className="font-mono text-lg font-semibold text-navy">{formatCurrency(booking.price, booking.currency)}</p>
            </div>
            <Badge tone={statusToTone(booking.payment_status)}>{booking.payment_status.replace("_", " ")}</Badge>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {canJoin && (
              <Button onClick={() => joinMutation.mutate()} isLoading={joinMutation.isPending}>
                <Video className="h-4 w-4" /> Join live class
              </Button>
            )}
            {booking.status === "pending_payment" && (
              <Button onClick={() => navigate(`/student/bookings/${booking.id}/pay`)}>Complete payment</Button>
            )}
            <Button variant="outline" onClick={() => messageMutation.mutate()} isLoading={messageMutation.isPending}>
              <MessageCircle className="h-4 w-4" /> Message {counterpart.first_name}
            </Button>
            {canCancel && (
              <Button variant="outline" onClick={() => setCancelOpen(true)}>
                Cancel booking
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      <Modal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel this booking?" size="sm">
        <p className="text-sm text-slate-500">
          Cancellations within <span className="font-medium text-navy">12 hours</span> of the session may not be fully refundable.
        </p>
        <Textarea
          label="Reason (optional)"
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
          className="mt-4"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setCancelOpen(false)}>
            Keep booking
          </Button>
          <Button variant="destructive" onClick={() => cancelMutation.mutate()} isLoading={cancelMutation.isPending}>
            Confirm cancellation
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
