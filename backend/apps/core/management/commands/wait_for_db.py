import time

from django.db import connections
from django.db.utils import OperationalError
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """Blocks execution until the database is available. Used before running migrations in Docker."""

    help = "Waits for the database to be available before proceeding."

    def handle(self, *args, **options):
        self.stdout.write("Waiting for database...")
        db_conn = None
        attempts = 0
        max_attempts = 30

        while not db_conn:
            attempts += 1
            try:
                db_conn = connections["default"]
                db_conn.cursor()
            except OperationalError:
                db_conn = None
                if attempts >= max_attempts:
                    self.stderr.write(self.style.ERROR("Database unavailable after 30 attempts."))
                    raise
                self.stdout.write(f"Database unavailable, attempt {attempts}/{max_attempts}, waiting 2s...")
                time.sleep(2)

        self.stdout.write(self.style.SUCCESS("Database available!"))
