import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger("tutordoor")


@shared_task
def snapshot_daily_metrics_task():
    """Runs once daily (see CELERY_BEAT_SCHEDULE): computes yesterday's platform KPIs into DailyPlatformMetrics."""
    from apps.analytics.services.analytics_service import MetricsSnapshotService

    yesterday = (timezone.now() - timezone.timedelta(days=1)).date()
    snapshot = MetricsSnapshotService().snapshot_for_date(yesterday)
    logger.info("Snapshotted platform metrics for %s.", yesterday)
    return str(snapshot.id)
