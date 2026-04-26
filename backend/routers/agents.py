from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from backend.database import get_db
from backend.models import AgentRun, AgentType, ContentPiece
from backend.agents.base_agent import run_agent_with_tools
from backend.agents.content_writer import write_content
from backend.agents.campaign_strategist import create_campaign_strategy, analyze_campaign_performance
from backend.agents.seo_agent import keyword_research, audit_content_seo
from backend.agents.social_media_agent import create_social_posts, create_content_calendar
from backend.agents.analytics_agent import generate_insights, generate_client_report

router = APIRouter(prefix="/agents", tags=["agents"])


class ContentWriterRequest(BaseModel):
    content_type: str
    topic: str
    brand_voice: str = "professional"
    target_audience: str = ""
    keywords: str = ""
    campaign_id: Optional[int] = None


class CampaignStrategyRequest(BaseModel):
    objective: str
    industry: str
    budget: float
    duration_weeks: int
    target_audience: str


class CampaignAnalysisRequest(BaseModel):
    campaign_name: str
    impressions: int
    clicks: int
    conversions: int
    budget: float
    spent: float


class KeywordResearchRequest(BaseModel):
    topic: str
    industry: str
    target_market: str = ""


class ContentAuditRequest(BaseModel):
    title: str
    content: str
    target_keyword: str


class SocialPostsRequest(BaseModel):
    topic: str
    platforms: list[str] = ["Instagram", "LinkedIn", "X"]
    brand_voice: str = "professional"
    campaign_goal: str = "awareness"
    campaign_id: Optional[int] = None


class ContentCalendarRequest(BaseModel):
    brand: str
    industry: str
    weeks: int = 4
    posting_frequency: str = "daily"


class AnalyticsInsightsRequest(BaseModel):
    metrics: dict
    context: str = ""


class ClientReportRequest(BaseModel):
    client_name: str
    period: str
    campaigns: list[dict]


class AutonomousRequest(BaseModel):
    goal: str
    context: str = ""


async def _save_run(db: AsyncSession, agent_type: AgentType, prompt: str, result: dict) -> AgentRun:
    run = AgentRun(
        agent_type=agent_type,
        prompt=prompt[:500],
        result=result.get("result", ""),
        tokens_used=result.get("tokens_used", 0),
        duration_ms=result.get("duration_ms", 0),
        status="completed",
    )
    db.add(run)
    await db.flush()
    return run


@router.get("/runs")
async def list_agent_runs(limit: int = 20, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AgentRun).order_by(AgentRun.created_at.desc()).limit(limit)
    )
    runs = result.scalars().all()
    return [
        {
            "id": r.id,
            "agent_type": r.agent_type,
            "prompt": r.prompt,
            "result_preview": (r.result or "")[:300],
            "tokens_used": r.tokens_used,
            "duration_ms": r.duration_ms,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
        }
        for r in runs
    ]


@router.post("/content-writer")
async def run_content_writer(req: ContentWriterRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await write_content(
            req.content_type, req.topic, req.brand_voice, req.target_audience, req.keywords
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    run = await _save_run(db, AgentType.content_writer, f"{req.content_type}: {req.topic}", result)

    if req.campaign_id:
        piece = ContentPiece(
            title=f"{req.content_type.title()}: {req.topic}",
            content_type=req.content_type,
            body=result["result"],
            campaign_id=req.campaign_id,
            created_by="ai_agent",
        )
        db.add(piece)
        await db.flush()

    return {"run_id": run.id, "result": result["result"], "tokens_used": result["tokens_used"], "duration_ms": result["duration_ms"]}


@router.post("/campaign-strategy")
async def run_campaign_strategy(req: CampaignStrategyRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await create_campaign_strategy(
            req.objective, req.industry, req.budget, req.duration_weeks, req.target_audience
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    run = await _save_run(db, AgentType.campaign_strategist, req.objective, result)
    return {"run_id": run.id, "result": result["result"], "tokens_used": result["tokens_used"], "duration_ms": result["duration_ms"]}


@router.post("/campaign-analysis")
async def run_campaign_analysis(req: CampaignAnalysisRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await analyze_campaign_performance(
            req.campaign_name, req.impressions, req.clicks, req.conversions, req.budget, req.spent
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    run = await _save_run(db, AgentType.campaign_strategist, f"Analysis: {req.campaign_name}", result)
    return {"run_id": run.id, "result": result["result"], "tokens_used": result["tokens_used"], "duration_ms": result["duration_ms"]}


@router.post("/keyword-research")
async def run_keyword_research(req: KeywordResearchRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await keyword_research(req.topic, req.industry, req.target_market)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    run = await _save_run(db, AgentType.seo_agent, f"Keywords: {req.topic}", result)
    return {"run_id": run.id, "result": result["result"], "tokens_used": result["tokens_used"], "duration_ms": result["duration_ms"]}


@router.post("/content-seo-audit")
async def run_seo_audit(req: ContentAuditRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await audit_content_seo(req.title, req.content, req.target_keyword)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    run = await _save_run(db, AgentType.seo_agent, f"SEO Audit: {req.title}", result)
    return {"run_id": run.id, "result": result["result"], "tokens_used": result["tokens_used"], "duration_ms": result["duration_ms"]}


@router.post("/social-posts")
async def run_social_posts(req: SocialPostsRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await create_social_posts(req.topic, req.platforms, req.brand_voice, req.campaign_goal)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    run = await _save_run(db, AgentType.social_media, f"Social: {req.topic}", result)

    if req.campaign_id:
        piece = ContentPiece(
            title=f"Social Posts: {req.topic}",
            content_type="social",
            body=result["result"],
            campaign_id=req.campaign_id,
            created_by="ai_agent",
        )
        db.add(piece)
        await db.flush()

    return {"run_id": run.id, "result": result["result"], "tokens_used": result["tokens_used"], "duration_ms": result["duration_ms"]}


@router.post("/content-calendar")
async def run_content_calendar(req: ContentCalendarRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await create_content_calendar(req.brand, req.industry, req.weeks, req.posting_frequency)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    run = await _save_run(db, AgentType.social_media, f"Calendar: {req.brand}", result)
    return {"run_id": run.id, "result": result["result"], "tokens_used": result["tokens_used"], "duration_ms": result["duration_ms"]}


@router.post("/analytics-insights")
async def run_analytics_insights(req: AnalyticsInsightsRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await generate_insights(req.metrics, req.context)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    run = await _save_run(db, AgentType.analytics, "Analytics insights", result)
    return {"run_id": run.id, "result": result["result"], "tokens_used": result["tokens_used"], "duration_ms": result["duration_ms"]}


@router.post("/client-report")
async def run_client_report(req: ClientReportRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await generate_client_report(req.client_name, req.period, req.campaigns)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    run = await _save_run(db, AgentType.analytics, f"Report: {req.client_name}", result)
    return {"run_id": run.id, "result": result["result"], "tokens_used": result["tokens_used"], "duration_ms": result["duration_ms"]}


@router.post("/autonomous")
async def run_autonomous_agent(req: AutonomousRequest, db: AsyncSession = Depends(get_db)):
    """Autonomous agent that can read/write the agency database via tools.
    Give it a high-level goal like 'Onboard a new fitness client and create their first 4-week campaign'."""
    system_prompt = """You are JARVIS, an autonomous marketing agency operations agent. You have full access to
the agency database via tools — you can list and create clients, campaigns, tasks, and content, change campaign
status, and read metrics. When given a goal, plan the steps, execute them by calling tools, and verify your work.
Be efficient — minimize tool calls, batch where possible. After completing all actions, summarize what you did
in clean markdown with a bulleted action log."""
    try:
        full_prompt = req.goal if not req.context else f"{req.goal}\n\nContext:\n{req.context}"
        result = await run_agent_with_tools(system_prompt, full_prompt, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    run = await _save_run(db, AgentType.campaign_strategist, f"Autonomous: {req.goal[:200]}", result)
    return {
        "run_id": run.id,
        "result": result["result"],
        "actions": result["actions"],
        "tokens_used": result["tokens_used"],
        "duration_ms": result["duration_ms"],
    }
