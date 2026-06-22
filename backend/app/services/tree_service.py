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


def delete_trees_by_filter(db: Session, filter_key: str) -> int:
    """Delete planted trees for a given time filter.

    Each planted tree has 4 rows (today / week / month / total)
    sharing the same session_id.  Deleting by ANY filter must
    remove ALL 4 rows + the parent session, because they all
    represent the same tree in different views.
    """
    from ..models.focus_session import FocusSession

    # Step 1: find the session IDs for trees matching this filter
    trees = (
        db.query(PlantedTree)
        .filter(PlantedTree.time_filter_key == filter_key)
        .all()
    )

    if not trees:
        return 0

    session_ids = list(set(t.session_id for t in trees))

    # Step 2: delete ALL tree rows for those sessions (across every filter)
    deleted_trees = (
        db.query(PlantedTree)
        .filter(PlantedTree.session_id.in_(session_ids))
        .delete(synchronize_session=False)
    )

    # Step 3: delete the parent sessions
    db.query(FocusSession).filter(
        FocusSession.id.in_(session_ids)
    ).delete(synchronize_session=False)

    db.commit()
    return deleted_trees
