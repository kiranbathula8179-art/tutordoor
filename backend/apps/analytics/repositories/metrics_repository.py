from apps.analytics.models import DailyPlatformMetrics


class MetricsRepository:
    model = DailyPlatformMetrics

    def upsert_for_date(self, date, **fields) -> DailyPlatformMetrics:
        snapshot, _ = self.model.objects.update_or_create(date=date, defaults=fields)
        return snapshot

    def list_range(self, start_date, end_date):
        return self.model.objects.filter(date__range=(start_date, end_date)).order_by("date")
