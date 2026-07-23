import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { CalendarX2, Check, Gift } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { createBooking } from "@/features/bookings/api";
import { getTutorAvailableSlots } from "@/features/tutors/api";
import { cn, formatCurrency, formatTime, getErrorMessage } from "@/lib/utils";
import type { BookingMode, BookingType, TutorProfile } from "@/types";

/**
 * BookingModal — V3 polish program, item 4. All booking logic (slot query,
 * payload, validation, post-create navigation) is preserved verbatim;
 * selection states moved from the codemod's danger-red to primary, slots
 * gained grid density + skeletons, and demo pricing reads "Free".
 */

interface BookingModalProps {
  tutor: TutorProfile;
  isOpen: boolean;
  onClose: () => void;
}

export function BookingModal({ tutor, isOpen, onClose }: BookingModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [bookingType, setBookingType] = useState<BookingType>("demo");
  const [subjectId, setSubjectId] = useState(tutor.tutor_subjects[0]?.subject.id ?? "");
  const [mode, setMode] = useState<BookingMode>(tutor.teaching_mode === "offline" ? "offline" : "online");
  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["tutor-slots", tutor.id, selectedDate],
    queryFn: () => getTutorAvailableSlots(tutor.id, { start_date: selectedDate, end_date: selectedDate }),
    enabled: isOpen,
  });

  const bookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: (booking) => {
      toast.success(bookingType === "demo" ? "Demo class booked!" : "Booking created — complete payment to confirm.");
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      onClose();
      navigate(`/student/bookings/${booking.id}`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleConfirm = () => {
    if (!selectedSlot) {
      toast.error("Pick a time slot first.");
      return;
    }
    if (mode === "offline" && !location.trim()) {
      toast.error("Enter a location for an in-person session.");
      return;
    }

    bookingMutation.mutate({
      tutor_id: tutor.id,
      subject_id: subjectId || undefined,
      booking_type: bookingType,
      mode,
      start_time: selectedSlot.start,
      end_time: selectedSlot.end,
      location: mode === "offline" ? location : undefined,
      student_notes: notes || undefined,
    });
  };

  const estimatedPrice = bookingType === "demo" ? 0 : Number(tutor.hourly_rate);

  const typeCard = (active: boolean) =>
    cn(
      "relative rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
      active ? "border-primary bg-primary-subtle shadow-soft" : "border-line hover:border-navy/25 hover:shadow-soft"
    );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Book a session with ${tutor.user.first_name}`} size="lg">
      <div className="space-y-5">
        {/* -------------------------------------------- Session type */}
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Session type">
          <button
            type="button"
            role="radio"
            aria-checked={bookingType === "demo"}
            onClick={() => setBookingType("demo")}
            className={typeCard(bookingType === "demo")}
          >
            {bookingType === "demo" && (
              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                <Check className="h-3 w-3" />
              </span>
            )}
            <p className="flex items-center gap-1.5 font-semibold text-navy">
              <Gift className="h-4 w-4 text-primary" /> Free demo class
            </p>
            <p className="mt-0.5 text-sm text-slate-500">30–60 min, no cost, once per tutor</p>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={bookingType === "regular"}
            onClick={() => setBookingType("regular")}
            className={typeCard(bookingType === "regular")}
          >
            {bookingType === "regular" && (
              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                <Check className="h-3 w-3" />
              </span>
            )}
            <p className="font-semibold text-navy">Regular session</p>
            <p className="mt-0.5 text-sm text-slate-500">{formatCurrency(tutor.hourly_rate, tutor.currency)}/hr</p>
          </button>
        </div>

        {tutor.tutor_subjects.length > 0 && (
          <Select
            label="Subject"
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            options={tutor.tutor_subjects.map((ts) => ({ value: ts.subject.id, label: ts.subject.name }))}
          />
        )}

        {tutor.teaching_mode === "both" && (
          <Select
            label="Mode"
            value={mode}
            onChange={(event) => setMode(event.target.value as BookingMode)}
            options={[
              { value: "online", label: "Online" },
              { value: "offline", label: "In-person" },
            ]}
          />
        )}

        {mode === "offline" && (
          <Input
            label="Location"
            placeholder="Where should the session take place?"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
        )}

        <Input
          label="Date"
          type="date"
          min={format(new Date(), "yyyy-MM-dd")}
          max={format(addDays(new Date(), 30), "yyyy-MM-dd")}
          value={selectedDate}
          onChange={(event) => {
            setSelectedDate(event.target.value);
            setSelectedSlot(null);
          }}
        />

        {/* -------------------------------------------- Slot picker */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Available times</p>
          {slotsLoading ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-9 rounded-lg" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-slate-500">
              <CalendarX2 className="h-4 w-4 shrink-0 text-slate-400" />
              No open slots on this date — try another day.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Available time slots">
              {slots.map((slot) => {
                const active = selectedSlot?.start === slot.start;
                return (
                  <button
                    key={slot.start}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelectedSlot(slot)}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      active
                        ? "border-primary bg-primary text-white shadow-soft"
                        : "border-line text-slate-600 hover:border-primary/40 hover:text-navy"
                    )}
                  >
                    {formatTime(slot.start)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Textarea
          label="Notes for the tutor (optional)"
          placeholder="What would you like to cover in this session?"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
        />

        {/* -------------------------------------------- Total + confirm */}
        <div className="flex items-center justify-between border-t border-line pt-4">
          <div>
            <p className="text-sm text-slate-500">Total</p>
            <p className="font-display text-2xl font-extrabold tracking-tight text-navy">
              {estimatedPrice === 0 ? "Free" : formatCurrency(estimatedPrice, tutor.currency)}
            </p>
          </div>
          <Button onClick={handleConfirm} isLoading={bookingMutation.isPending} disabled={!selectedSlot}>
            Confirm booking
          </Button>
        </div>
      </div>
    </Modal>
  );
}
