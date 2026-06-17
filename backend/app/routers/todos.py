"""Todo API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.todo import TodoCreate, TodoUpdate, TodoReorder, TodoResponse
from ..services import todo_service

router = APIRouter(prefix="/api/todos", tags=["todos"])


@router.get("", response_model=list[TodoResponse])
def list_todos(db: Session = Depends(get_db)):
    return todo_service.get_todos(db)


@router.post("", response_model=TodoResponse, status_code=201)
def create_todo(data: TodoCreate, db: Session = Depends(get_db)):
    return todo_service.create_todo(db, data.content)


@router.patch("/{todo_id}", response_model=TodoResponse)
def update_todo(todo_id: int, data: TodoUpdate, db: Session = Depends(get_db)):
    todo = todo_service.update_todo(db, todo_id, data.model_dump(exclude_unset=True))
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


@router.delete("/{todo_id}", status_code=204)
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    success = todo_service.delete_todo(db, todo_id)
    if not success:
        raise HTTPException(status_code=404, detail="Todo not found")


@router.put("/reorder", response_model=list[TodoResponse])
def reorder_todos(data: TodoReorder, db: Session = Depends(get_db)):
    items = [{"id": item.id, "sort_order": item.sort_order} for item in data.items]
    return todo_service.reorder_todos(db, items)
