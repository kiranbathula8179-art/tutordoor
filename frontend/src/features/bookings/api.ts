import { apiClient } from "@/lib/api-client";
import type { Booking, BookingMode, BookingType, PaginatedResponse } from "@/types";

export interface CreateBookingPayload {
  tutor_id: string;
  subject_id?: string;
  booking_type: BookingType;
  mode: BookingMode;
  start_time: string;
  end_time: string;
  location?: string;
  student_notes?: string;
  student_id?: string;
}

export async function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  const { data } = await apiClient.post<{ booking: Booking }>("/bookings/", payload);
  return data.booking;
}

export async function listMyBookings(params: { status?: string; upcoming?: boolean; page?: number } = {}): Promise<
  PaginatedResponse<Booking>
> {
  const { data } = await apiClient.get<PaginatedResponse<Booking>>("/bookings/me/", { params });
  return data;
}

export async function getBooking(bookingId: string): Promise<Booking> {
  const { data } = await apiClient.get<{ booking: Booking }>(`/bookings/${bookingId}/`);
  return data.booking;
}

export async function cancelBooking(bookingId: string, reason: string): Promise<Booking> {
  const { data } = await apiClient.post<{ booking: Booking }>(`/bookings/${bookingId}/cancel/`, { reason });
  return data.booking;
}

export interface LiveClassJoinDetails {
  provider: string;
  room_name: string;
  jitsi_domain: string;
  join_url: string;
  display_name: string;
}

export async function joinLiveClass(bookingId: string): Promise<LiveClassJoinDetails> {
  const { data } = await apiClient.post<LiveClassJoinDetails>(`/bookings/${bookingId}/live-class/join/`);
  return data;
}

export async function requestReschedule(
  bookingId: string,
  payload: { proposed_start_time: string; proposed_end_time: string; reason?: string }
) {
  const { data } = await apiClient.post(`/bookings/${bookingId}/reschedule/`, payload);
  return data;
}
