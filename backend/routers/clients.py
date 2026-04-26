from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from backend.database import get_db
from backend.models import Client, Campaign

router = APIRouter(prefix="/clients", tags=["clients"])


class ClientCreate(BaseModel):
    name: str
    industry: Optional[str] = None
    email: Optional[str] = None
    budget: float = 0.0
    notes: Optional[str] = None


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    email: Optional[str] = None
    budget: Optional[float] = None
    health_score: Optional[int] = None
    notes: Optional[str] = None


@router.get("")
async def list_clients(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Client).order_by(Client.created_at.desc()))
    clients = result.scalars().all()
    out = []
    for c in clients:
        camp_result = await db.execute(
            select(func.count()).where(Campaign.client_id == c.id)
        )
        count = camp_result.scalar()
        out.append({
            "id": c.id,
            "name": c.name,
            "industry": c.industry,
            "email": c.email,
            "budget": c.budget,
            "health_score": c.health_score,
            "notes": c.notes,
            "campaign_count": count,
            "created_at": c.created_at.isoformat(),
        })
    return out


@router.post("")
async def create_client(data: ClientCreate, db: AsyncSession = Depends(get_db)):
    client = Client(**data.model_dump())
    db.add(client)
    await db.flush()
    return {"id": client.id, "name": client.name, "message": "Client created"}


@router.get("/{client_id}")
async def get_client(client_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    camp_result = await db.execute(select(Campaign).where(Campaign.client_id == client_id))
    campaigns = camp_result.scalars().all()
    return {
        "id": client.id,
        "name": client.name,
        "industry": client.industry,
        "email": client.email,
        "budget": client.budget,
        "health_score": client.health_score,
        "notes": client.notes,
        "created_at": client.created_at.isoformat(),
        "campaigns": [{"id": c.id, "name": c.name, "status": c.status} for c in campaigns],
    }


@router.patch("/{client_id}")
async def update_client(client_id: int, data: ClientUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(client, field, value)
    return {"message": "Updated"}


@router.delete("/{client_id}")
async def delete_client(client_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    await db.delete(client)
    return {"message": "Deleted"}
