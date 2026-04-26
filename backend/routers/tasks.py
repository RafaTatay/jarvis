from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from backend.database import get_db
from backend.models import Task, TaskStatus

router = APIRouter(prefix="/tasks", tags=["tasks"])


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    campaign_id: Optional[int] = None
    status: TaskStatus = TaskStatus.todo
    priority: str = "medium"
    assignee: Optional[str] = None
    due_date: Optional[datetime] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[datetime] = None


def _task_dict(t: Task) -> dict:
    return {
        "id": t.id,
        "title": t.title,
        "description": t.description,
        "campaign_id": t.campaign_id,
        "status": t.status,
        "priority": t.priority,
        "assignee": t.assignee,
        "due_date": t.due_date.isoformat() if t.due_date else None,
        "created_at": t.created_at.isoformat(),
    }


@router.get("")
async def list_tasks(campaign_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    query = select(Task).order_by(Task.created_at.desc())
    if campaign_id:
        query = query.where(Task.campaign_id == campaign_id)
    result = await db.execute(query)
    return [_task_dict(t) for t in result.scalars().all()]


@router.post("")
async def create_task(data: TaskCreate, db: AsyncSession = Depends(get_db)):
    task = Task(**data.model_dump())
    db.add(task)
    await db.flush()
    return _task_dict(task)


@router.patch("/{task_id}")
async def update_task(task_id: int, data: TaskUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(task, field, value)
    return _task_dict(task)


@router.delete("/{task_id}")
async def delete_task(task_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
    return {"message": "Deleted"}
