-- Runs once, automatically, the first time the postgres data volume is created.
-- Django's migrations also enable btree_gist via a migration operation
-- (apps.bookings 0001_initial), but having it ready here avoids any ordering
-- surprises on a fresh `docker compose up`.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Trigram support, for future fuzzy/typo-tolerant search on tutor names,
-- headlines, and subjects (not yet wired into a query, but cheap to enable
-- up front so a future migration can add a GIN index without a superuser step).
CREATE EXTENSION IF NOT EXISTS pg_trgm;
