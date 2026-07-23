import pytest


@pytest.fixture(autouse=True)
def _enable_db_access_for_all_tests(db):
    """All tests get DB access by default; override per-test if not needed."""
    pass
