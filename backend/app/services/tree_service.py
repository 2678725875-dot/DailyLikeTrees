"""Tree query service."""

from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models.tree import PlantedTree


def get_trees_by_filter(db: Session, filter_key: str) -> dict:
    """Get all trees for a given time filter and compute stats."""
    trees = (
        db.query(PlantedTree)
        .filter(PlantedTree.time_filter_key == filter_key)
        .order_by(PlantedTree.grid_y, PlantedTree.grid_x)
        .all()
    )

    # Compute stats: count + total focus minutes from sessions
    from ..models.focus_session import FocusSession

    session_ids = [t.session_id for t in trees]
    total_minutes = 0
    if session_ids:
        result = (
            db.query(func.sum(FocusSession.actual_seconds))
            .filter(FocusSession.id.in_(session_ids))
            .scalar()
        )
        total_minutes = (result or 0) // 60

    stats = {
        "count": len(trees),
        "total_minutes": total_minutes,
    }

    return {"trees": trees, "stats": stats}
