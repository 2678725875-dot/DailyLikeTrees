"""Todo CRUD service."""

from sqlalchemy.orm import Session

from ..models.todo import Todo


def get_todos(db: Session) -> list[Todo]:
    return db.query(Todo).order_by(Todo.sort_order, Todo.created_at).all()


def create_todo(db: Session, content: str) -> Todo:
    # Find the max sort_order to append at the end
    max_order = db.query(Todo.sort_order).order_by(Todo.sort_order.desc()).first()
    next_order = (max_order[0] + 1.0) if max_order and max_order[0] is not None else 0.0

    todo = Todo(content=content, sort_order=next_order)
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


def update_todo(db: Session, todo_id: int, data: dict) -> Todo | None:
    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not todo:
        return None
    if "content" in data and data["content"] is not None:
        todo.content = data["content"]
    if "completed" in data and data["completed"] is not None:
        todo.completed = data["completed"]
    db.commit()
    db.refresh(todo)
    return todo


def delete_todo(db: Session, todo_id: int) -> bool:
    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not todo:
        return False
    db.delete(todo)
    db.commit()
    return True


def reorder_todos(db: Session, items: list[dict]) -> list[Todo]:
    """Batch update sort_order for multiple todos."""
    todo_map = {t.id: t for t in db.query(Todo).all()}
    for item in items:
        if item["id"] in todo_map:
            todo_map[item["id"]].sort_order = item["sort_order"]
    db.commit()
    return get_todos(db)
