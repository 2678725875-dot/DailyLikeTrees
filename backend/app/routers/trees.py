"""Tree API endpoints."""

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.tree import TreeListResponse
from ..services import tree_service

router = APIRouter(prefix="/api/trees", tags=["trees"])

FILTER_KEYS = {"today", "week", "month", "total"}


def _compute_filter_key(filter_name: str) -> str:
    """Convert a named filter to the actual DB key."""
    today = date.today()
    iso_week = today.isocalendar()
    mapping = {
        "today": today.isoformat(),
        "week": f"{iso_week[0]}-W{iso_week[1]:02d}",
        "month": today.strftime("%Y-%m"),
        "total": "total",
    }
    return mapping.get(filter_name, "total")


@router.get("", response_model=TreeListResponse)
def get_trees(
    filter: str = Query("today", description="Time filter: today, week, month, total"),
    db: Session = Depends(get_db),
):
    """Get planted trees and stats for a time period."""
    if filter not in FILTER_KEYS:
        filter = "today"
    actual_key = _compute_filter_key(filter)
    return tree_service.get_trees_by_filter(db, actual_key)


@router.delete("")
def delete_trees(
    filter: str = Query("today", description="Time filter: today, week, month, total"),
    db: Session = Depends(get_db),
):
    """Delete all planted trees for a time period.  Developer tool only."""
    if filter not in FILTER_KEYS:
        filter = "today"
    actual_key = _compute_filter_key(filter)
    deleted = tree_service.delete_trees_by_filter(db, actual_key)
    return {"deleted": deleted}
