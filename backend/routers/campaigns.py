from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from backend.database import get_db
from backend.models import Campaign, CampaignStatus

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


class CampaignCreate(BaseModel):
    name: str
    client_id: Optional[int] = None
    status: CampaignStatus = CampaignStatus.planning
    channel: Optional[str] = None
    budget: float = 0.0
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[CampaignStatus] = None
    channel: Optional[str] = None
    budget: Optional[float] = None
    spent: Optional[float] = None
    impressions: Optional[int] = None
    clicks: Optional[int] = None
    conversions: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


def _campaign_dict(c: Campaign) -> dict:
    ctr = round(c.clicks / c.impressions * 100, 2) if c.impressions > 0 else 0
    cvr = round(c.conversions / c.clicks * 100, 2) if c.clicks > 0 else 0
    cpa = round(c.spent / c.conversions, 2) if c.conversions > 0 else 0
    return {
        "id": c.id,
        "name": c.name,
        "client_id": c.client_id,
        "status": c.status,
        "channel": c.channel,
        "budget": c.budget,
        "spent": c.spent,
        "impressions": c.impressions,
        "clicks": c.clicks,
        "conversions": c.conversions,
        "ctr": ctr,
        "cvr": cvr,
        "cpa": cpa,
        "start_date": c.start_date.isoformat() if c.start_date else None,
        "end_date": c.end_date.isoformat() if c.end_date else None,
        "created_at": c.created_at.isoformat(),
        "updated_at": c.updated_at.isoformat(),
    }


@router.get("")
async def list_campaigns(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).order_by(Campaign.updated_at.desc()))
    campaigns = result.scalars().all()
    return [_campaign_dict(c) for c in campaigns]


@router.post("")
async def create_campaign(data: CampaignCreate, db: AsyncSession = Depends(get_db)):
    campaign = Campaign(**data.model_dump())
    db.add(campaign)
    await db.flush()
    return {"id": campaign.id, "name": campaign.name, "message": "Campaign created"}


@router.get("/{campaign_id}")
async def get_campaign(campaign_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return _campaign_dict(campaign)


@router.patch("/{campaign_id}")
async def update_campaign(campaign_id: int, data: CampaignUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(campaign, field, value)
    campaign.updated_at = datetime.utcnow()
    return _campaign_dict(campaign)


@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    await db.delete(campaign)
    return {"message": "Deleted"}
