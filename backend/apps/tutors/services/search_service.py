from decimal import Decimal

from django.db.models import Case, ExpressionWrapper, F, FloatField, Value, When
from django.db.models.functions import ACos, Cos, Radians, Sin

from apps.tutors.models import VerificationStatus
from apps.tutors.repositories.tutor_repository import TutorProfileRepository

EARTH_RADIUS_KM = 6371.0


class TutorSearchService:
    """
    Powers the 'Smart Tutor Search' feature: verified tutors only, filterable
    by subject, teaching mode, price band, and minimum rating, optionally
    ranked by distance from the student's coordinates (haversine formula
    computed in-database via Postgres trig functions for index-friendly sorting).
    """

    def __init__(self, tutor_repository: TutorProfileRepository = None):
        self.tutor_repository = tutor_repository or TutorProfileRepository()

    def search(
        self,
        *,
        subject_id=None,
        query=None,
        teaching_mode=None,
        min_price=None,
        max_price=None,
        min_rating=None,
        city=None,
        latitude=None,
        longitude=None,
        max_distance_km=None,
    ):
        qs = self.tutor_repository.base_queryset().filter(
            verification_status=VerificationStatus.VERIFIED,
            is_accepting_students=True,
        )

        if subject_id:
            qs = qs.filter(tutor_subjects__subject_id=subject_id).distinct()
        if query:
            qs = qs.filter(
                Q_search(query)
            )
        if teaching_mode:
            qs = qs.filter(teaching_mode__in=[teaching_mode, "both"])
        if min_price is not None:
            qs = qs.filter(hourly_rate__gte=Decimal(min_price))
        if max_price is not None:
            qs = qs.filter(hourly_rate__lte=Decimal(max_price))
        if min_rating is not None:
            qs = qs.filter(rating_average__gte=Decimal(min_rating))
        if city:
            qs = qs.filter(city__iexact=city)

        if latitude is not None and longitude is not None:
            qs = self._annotate_distance(qs, latitude, longitude)
            if max_distance_km is not None:
                qs = qs.filter(distance_km__lte=max_distance_km)
            qs = qs.order_by("distance_km")
        else:
            qs = qs.order_by("-is_featured", "-rating_average", "-total_sessions_completed")

        return qs

    @staticmethod
    def _annotate_distance(qs, latitude, longitude):
        lat_rad = Radians(F("latitude"))
        lng_rad = Radians(F("longitude"))
        origin_lat_rad = Radians(Value(float(latitude)))
        origin_lng_rad = Radians(Value(float(longitude)))

        distance_expr = ExpressionWrapper(
            Value(EARTH_RADIUS_KM)
            * ACos(
                Cos(origin_lat_rad) * Cos(lat_rad) * Cos(lng_rad - origin_lng_rad)
                + Sin(origin_lat_rad) * Sin(lat_rad)
            ),
            output_field=FloatField(),
        )

        return qs.filter(latitude__isnull=False, longitude__isnull=False).annotate(
            distance_km=Case(
                When(latitude__isnull=False, longitude__isnull=False, then=distance_expr),
                default=Value(None),
                output_field=FloatField(),
            )
        )


def Q_search(query: str):
    from django.db.models import Q

    return (
        Q(user__first_name__icontains=query)
        | Q(user__last_name__icontains=query)
        | Q(headline__icontains=query)
        | Q(tutor_subjects__subject__name__icontains=query)
    )
