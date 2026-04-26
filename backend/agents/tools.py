from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models import Client, Campaign, Task, ContentPiece, CampaignStatus, TaskStatus, ContentStatus


TOOL_DEFINITIONS = [
    {
        "name": "list_clients",
        "description": "List all clients in the agency. Returns id, name, industry, budget, health_score for each.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "list_campaigns",
        "description": "List all marketing campaigns. Optionally filter by client_id or status (planning/active/paused/completed).",
        "input_schema": {
            "type": "object",
            "properties": {
                "client_id": {"type": "integer", "description": "Filter by client ID"},
                "status": {"type": "string", "enum": ["planning", "active", "paused", "completed"]},
            },
        },
    },
    {
        "name": "create_client",
        "description": "Create a new client in the CRM.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "industry": {"type": "string"},
                "email": {"type": "string"},
                "budget": {"type": "number", "description": "Monthly budget in USD"},
            },
            "required": ["name"],
        },
    },
    {
        "name": "create_campaign",
        "description": "Create a new marketing campaign for a client.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "client_id": {"type": "integer"},
                "channel": {"type": "string", "description": "e.g. 'Google Ads', 'Instagram', 'Email'"},
                "budget": {"type": "number"},
                "duration_weeks": {"type": "integer", "default": 4},
            },
            "required": ["name", "client_id"],
        },
    },
    {
        "name": "create_task",
        "description": "Create a task on the kanban board, optionally linked to a campaign.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "description": {"type": "string"},
                "campaign_id": {"type": "integer"},
                "priority": {"type": "string", "enum": ["low", "medium", "high"], "default": "medium"},
                "assignee": {"type": "string"},
            },
            "required": ["title"],
        },
    },
    {
        "name": "create_content_piece",
        "description": "Create a content piece (blog/social/email/ad) and save it to the content pipeline.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "content_type": {"type": "string", "enum": ["blog", "social", "email", "ad", "video_script"]},
                "body": {"type": "string", "description": "Full content body in markdown"},
                "campaign_id": {"type": "integer"},
                "platform": {"type": "string"},
            },
            "required": ["title", "content_type", "body"],
        },
    },
    {
        "name": "update_campaign_status",
        "description": "Change a campaign's status (planning, active, paused, completed).",
        "input_schema": {
            "type": "object",
            "properties": {
                "campaign_id": {"type": "integer"},
                "status": {"type": "string", "enum": ["planning", "active", "paused", "completed"]},
            },
            "required": ["campaign_id", "status"],
        },
    },
    {
        "name": "get_campaign_metrics",
        "description": "Get detailed metrics for a single campaign (impressions, clicks, conversions, spend, CTR, CVR, CPA).",
        "input_schema": {
            "type": "object",
            "properties": {"campaign_id": {"type": "integer"}},
            "required": ["campaign_id"],
        },
    },
    {
        "name": "get_agency_overview",
        "description": "Get high-level agency metrics: total clients, campaigns, tasks, total budget/spend, overall CTR.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
]


async def _list_clients(db: AsyncSession, **_):
    rows = (await db.execute(select(Client))).scalars().all()
    return [{"id": c.id, "name": c.name, "industry": c.industry, "budget": c.budget, "health_score": c.health_score} for c in rows]


async def _list_campaigns(db: AsyncSession, client_id=None, status=None):
    q = select(Campaign)
    if client_id:
        q = q.where(Campaign.client_id == client_id)
    if status:
        q = q.where(Campaign.status == CampaignStatus(status))
    rows = (await db.execute(q)).scalars().all()
    return [
        {"id": c.id, "name": c.name, "client_id": c.client_id, "status": c.status.value if c.status else None,
         "channel": c.channel, "budget": c.budget, "spent": c.spent, "impressions": c.impressions,
         "clicks": c.clicks, "conversions": c.conversions}
        for c in rows
    ]


async def _create_client(db: AsyncSession, name, industry=None, email=None, budget=0):
    c = Client(name=name, industry=industry, email=email, budget=budget)
    db.add(c)
    await db.flush()
    return {"id": c.id, "name": c.name, "created": True}


async def _create_campaign(db: AsyncSession, name, client_id, channel=None, budget=0, duration_weeks=4):
    start = datetime.utcnow()
    end = start + timedelta(weeks=duration_weeks)
    c = Campaign(name=name, client_id=client_id, channel=channel, budget=budget,
                 status=CampaignStatus.planning, start_date=start, end_date=end)
    db.add(c)
    await db.flush()
    return {"id": c.id, "name": c.name, "client_id": c.client_id, "status": "planning", "created": True}


async def _create_task(db: AsyncSession, title, description=None, campaign_id=None, priority="medium", assignee=None):
    t = Task(title=title, description=description, campaign_id=campaign_id,
             priority=priority, assignee=assignee, status=TaskStatus.todo)
    db.add(t)
    await db.flush()
    return {"id": t.id, "title": t.title, "status": "todo", "created": True}


async def _create_content_piece(db: AsyncSession, title, content_type, body, campaign_id=None, platform=None):
    p = ContentPiece(title=title, content_type=content_type, body=body, campaign_id=campaign_id,
                     platform=platform, status=ContentStatus.draft, created_by="ai_agent")
    db.add(p)
    await db.flush()
    return {"id": p.id, "title": p.title, "status": "draft", "created": True}


async def _update_campaign_status(db: AsyncSession, campaign_id, status):
    c = (await db.execute(select(Campaign).where(Campaign.id == campaign_id))).scalar_one_or_none()
    if not c:
        return {"error": f"Campaign {campaign_id} not found"}
    c.status = CampaignStatus(status)
    await db.flush()
    return {"id": c.id, "status": status, "updated": True}


async def _get_campaign_metrics(db: AsyncSession, campaign_id):
    c = (await db.execute(select(Campaign).where(Campaign.id == campaign_id))).scalar_one_or_none()
    if not c:
        return {"error": f"Campaign {campaign_id} not found"}
    ctr = round((c.clicks / c.impressions * 100), 2) if c.impressions else 0
    cvr = round((c.conversions / c.clicks * 100), 2) if c.clicks else 0
    cpa = round((c.spent / c.conversions), 2) if c.conversions else 0
    return {"id": c.id, "name": c.name, "status": c.status.value if c.status else None,
            "impressions": c.impressions, "clicks": c.clicks, "conversions": c.conversions,
            "budget": c.budget, "spent": c.spent, "ctr_pct": ctr, "cvr_pct": cvr, "cpa": cpa}


async def _get_agency_overview(db: AsyncSession, **_):
    clients = (await db.execute(select(Client))).scalars().all()
    campaigns = (await db.execute(select(Campaign))).scalars().all()
    tasks = (await db.execute(select(Task))).scalars().all()
    total_imp = sum(c.impressions for c in campaigns)
    total_clicks = sum(c.clicks for c in campaigns)
    return {
        "total_clients": len(clients),
        "total_campaigns": len(campaigns),
        "active_campaigns": sum(1 for c in campaigns if c.status == CampaignStatus.active),
        "total_tasks": len(tasks),
        "open_tasks": sum(1 for t in tasks if t.status != TaskStatus.done),
        "total_budget": sum(c.budget for c in campaigns),
        "total_spent": sum(c.spent for c in campaigns),
        "total_impressions": total_imp,
        "total_clicks": total_clicks,
        "overall_ctr_pct": round(total_clicks / total_imp * 100, 2) if total_imp else 0,
    }


HANDLERS = {
    "list_clients": _list_clients,
    "list_campaigns": _list_campaigns,
    "create_client": _create_client,
    "create_campaign": _create_campaign,
    "create_task": _create_task,
    "create_content_piece": _create_content_piece,
    "update_campaign_status": _update_campaign_status,
    "get_campaign_metrics": _get_campaign_metrics,
    "get_agency_overview": _get_agency_overview,
}


async def execute_tool(name: str, args: dict, db: AsyncSession) -> dict:
    handler = HANDLERS.get(name)
    if not handler:
        return {"error": f"Unknown tool: {name}"}
    try:
        return await handler(db, **args)
    except Exception as e:
        return {"error": f"{type(e).__name__}: {e}"}
