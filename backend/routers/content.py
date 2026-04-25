from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from backend.database import get_db
from backend.models import ContentPiece, ContentStatus

router = APIRouter(prefix="/content", tags=["content"])


class ContentCreate(BaseModel):
    title: str
    content_type: Optional[str] = None
    body: Optional[str] = None
    campaign_id: Optional[int] = None
    platform: Optional[str] = None
    created_by: str = "human"


class ContentUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    status: Optional[ContentStatus] = None
    platform: Optional[str] = None


def _content_dict(c: ContentPiece) -> dict:
    return {
        "id": c.id,
        "title": c.title,
        "content_type": c.content_type,
        "body": c.body,
        "campaign_id": c.campaign_id,
        "status": c.status,
        "platform": c.platform,
        "created_by": c.created_by,
        "created_at": c.created_at.isoformat(),
    }


@router.get("")
async def list_content(campaign_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    query = select(ContentPiece).order_by(ContentPiece.created_at.desc())
    if campaign_id:
        query = query.where(ContentPiece.campaign_id == campaign_id)
    result = await db.execute(query)
    return [_content_dict(c) for c in result.scalars().all()]


@router.post("")
async def create_content(data: ContentCreate, db: AsyncSession = Depends(get_db)):
    piece = ContentPiece(**data.model_dump())
    db.add(piece)
    await db.flush()
    return _content_dict(piece)


@router.get("/{content_id}")
async def get_content(content_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ContentPiece).where(ContentPiece.id == content_id))
    piece = result.scalar_one_or_none()
    if not piece:
        raise HTTPException(status_code=404, detail="Content not found")
    return _content_dict(piece)


@router.patch("/{content_id}")
async def update_content(content_id: int, data: ContentUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ContentPiece).where(ContentPiece.id == content_id))
    piece = result.scalar_one_or_none()
    if not piece:
        raise HTTPException(status_code=404, detail="Content not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(piece, field, value)
    return _content_dict(piece)


@router.delete("/{content_id}")
async def delete_content(content_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ContentPiece).where(ContentPiece.id == content_id))
    piece = result.scalar_one_or_none()
    if not piece:
        raise HTTPException(status_code=404, detail="Content not found")
    await db.delete(piece)
    return {"message": "Deleted"}
