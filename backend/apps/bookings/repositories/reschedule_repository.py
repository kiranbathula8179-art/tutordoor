from typing import Optional

from apps.bookings.models import RescheduleRequest, RescheduleStatus


class RescheduleRepository:
    model = RescheduleRequest

    def create(self, **fields) -> RescheduleRequest:
        return self.model.objects.create(**fields)

    def get_pending_for_booking(self, booking) -> Optional[RescheduleRequest]:
        return self.model.objects.filter(booking=booking, status=RescheduleStatus.PENDING).order_by("-created_at").first()

    def get_by_id(self, request_id) -> Optional[RescheduleRequest]:
        return self.model.objects.select_related("booking", "requested_by").filter(id=request_id).first()

    def close_pending_for_booking(self, booking, *, new_status: str = RescheduleStatus.WITHDRAWN):
        self.model.objects.filter(booking=booking, status=RescheduleStatus.PENDING).update(status=new_status)

    def update(self, request: RescheduleRequest, **fields) -> RescheduleRequest:
        for key, value in fields.items():
            setattr(request, key, value)
        request.save(update_fields=list(fields.keys()) + ["updated_at"])
        return request
