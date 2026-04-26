import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select, func

load_dotenv()

from backend.database import init_db, get_db, async_session
from backend.models import Client, Campaign, Task, ContentPiece, AgentRun, CampaignStatus, TaskStatus
from backend.routers import campaigns, clients, tasks, content, agents


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_demo_data()
    yield


app = FastAPI(
    title="JARVIS Mission Control",
    description="Full Marketing Agency Management Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(campaigns.router, prefix="/api")
app.include_router(clients.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(content.router, prefix="/api")
app.include_router(agents.router, prefix="/api")


@app.get("/api/dashboard")
async def dashboard_stats():
    async with async_session() as db:
        total_clients = (await db.execute(select(func.count()).select_from(Client))).scalar()
        total_campaigns = (await db.execute(select(func.count()).select_from(Campaign))).scalar()
        active_campaigns = (await db.execute(
            select(func.count()).where(Campaign.status == CampaignStatus.active)
        )).scalar()
        total_tasks = (await db.execute(select(func.count()).select_from(Task))).scalar()
        pending_tasks = (await db.execute(
            select(func.count()).where(Task.status == TaskStatus.todo)
        )).scalar()
        total_content = (await db.execute(select(func.count()).select_from(ContentPiece))).scalar()
        agent_runs = (await db.execute(select(func.count()).select_from(AgentRun))).scalar()

        budget_result = await db.execute(select(func.sum(Campaign.budget)))
        total_budget = budget_result.scalar() or 0.0
        spent_result = await db.execute(select(func.sum(Campaign.spent)))
        total_spent = spent_result.scalar() or 0.0

        impressions_result = await db.execute(select(func.sum(Campaign.impressions)))
        total_impressions = impressions_result.scalar() or 0
        clicks_result = await db.execute(select(func.sum(Campaign.clicks)))
        total_clicks = clicks_result.scalar() or 0
        conv_result = await db.execute(select(func.sum(Campaign.conversions)))
        total_conversions = conv_result.scalar() or 0

        recent_runs = await db.execute(
            select(AgentRun).order_by(AgentRun.created_at.desc()).limit(5)
        )
        runs = recent_runs.scalars().all()

        recent_campaigns = await db.execute(
            select(Campaign).order_by(Campaign.updated_at.desc()).limit(5)
        )
        camps = recent_campaigns.scalars().all()

    return {
        "metrics": {
            "total_clients": total_clients,
            "total_campaigns": total_campaigns,
            "active_campaigns": active_campaigns,
            "total_tasks": total_tasks,
            "pending_tasks": pending_tasks,
            "total_content": total_content,
            "agent_runs": agent_runs,
            "total_budget": total_budget,
            "total_spent": total_spent,
            "total_impressions": total_impressions,
            "total_clicks": total_clicks,
            "total_conversions": total_conversions,
            "overall_ctr": round(total_clicks / total_impressions * 100, 2) if total_impressions > 0 else 0,
        },
        "recent_agent_runs": [
            {
                "id": r.id,
                "agent_type": r.agent_type,
                "prompt": r.prompt,
                "tokens_used": r.tokens_used,
                "duration_ms": r.duration_ms,
                "created_at": r.created_at.isoformat(),
            }
            for r in runs
        ],
        "recent_campaigns": [
            {
                "id": c.id,
                "name": c.name,
                "status": c.status,
                "channel": c.channel,
                "budget": c.budget,
                "spent": c.spent,
            }
            for c in camps
        ],
    }


@app.get("/api/health")
async def health():
    return {"status": "operational", "service": "JARVIS Mission Control"}


async def seed_demo_data():
    async with async_session() as db:
        existing = (await db.execute(select(func.count()).select_from(Client))).scalar()
        if existing > 0:
            return

        clients_data = [
            Client(name="TechFlow SaaS", industry="Software", email="marketing@techflow.io", budget=50000, health_score=92),
            Client(name="Verde Organics", industry="E-commerce", email="growth@verdeorganics.com", budget=30000, health_score=78),
            Client(name="Apex Fitness", industry="Health & Wellness", email="team@apexfitness.co", budget=20000, health_score=85),
        ]
        for c in clients_data:
            db.add(c)
        await db.flush()

        from datetime import datetime, timedelta
        now = datetime.utcnow()

        campaigns_data = [
            Campaign(
                name="TechFlow Q2 Lead Gen",
                client_id=clients_data[0].id,
                status=CampaignStatus.active,
                channel="Google Ads + LinkedIn",
                budget=25000,
                spent=14320,
                impressions=480000,
                clicks=9600,
                conversions=384,
                start_date=now - timedelta(days=30),
                end_date=now + timedelta(days=60),
            ),
            Campaign(
                name="Verde Spring Collection",
                client_id=clients_data[1].id,
                status=CampaignStatus.active,
                channel="Meta + Instagram",
                budget=15000,
                spent=8700,
                impressions=320000,
                clicks=12800,
                conversions=512,
                start_date=now - timedelta(days=14),
                end_date=now + timedelta(days=46),
            ),
            Campaign(
                name="Apex Summer Challenge",
                client_id=clients_data[2].id,
                status=CampaignStatus.planning,
                channel="TikTok + YouTube",
                budget=10000,
                spent=0,
                impressions=0,
                clicks=0,
                conversions=0,
                start_date=now + timedelta(days=7),
                end_date=now + timedelta(days=67),
            ),
            Campaign(
                name="TechFlow Brand Awareness",
                client_id=clients_data[0].id,
                status=CampaignStatus.completed,
                channel="Display + YouTube",
                budget=20000,
                spent=19800,
                impressions=1200000,
                clicks=18000,
                conversions=270,
                start_date=now - timedelta(days=90),
                end_date=now - timedelta(days=10),
            ),
        ]
        for camp in campaigns_data:
            db.add(camp)
        await db.flush()

        tasks_data = [
            Task(title="Design Q2 ad creatives", campaign_id=campaigns_data[0].id, status=TaskStatus.in_progress, priority="high", assignee="Design Team"),
            Task(title="Write 5 LinkedIn ad variants", campaign_id=campaigns_data[0].id, status=TaskStatus.todo, priority="high", assignee="Content Team"),
            Task(title="Set up Instagram Shopping", campaign_id=campaigns_data[1].id, status=TaskStatus.done, priority="medium", assignee="Paid Social"),
            Task(title="Influencer outreach", campaign_id=campaigns_data[2].id, status=TaskStatus.todo, priority="medium", assignee="Partnerships"),
            Task(title="TikTok creative brief", campaign_id=campaigns_data[2].id, status=TaskStatus.todo, priority="high", assignee="Creative"),
            Task(title="Monthly performance review", campaign_id=None, status=TaskStatus.review, priority="low", assignee="Analytics"),
        ]
        for t in tasks_data:
            db.add(t)

        content_data = [
            ContentPiece(title="5 Ways SaaS Can Cut CAC in 2024", content_type="blog", campaign_id=campaigns_data[0].id, status="published", platform="Website", created_by="ai_agent"),
            ContentPiece(title="Spring Sale Instagram Carousel", content_type="social", campaign_id=campaigns_data[1].id, status="approved", platform="Instagram", created_by="ai_agent"),
            ContentPiece(title="Verde Email Launch Sequence", content_type="email", campaign_id=campaigns_data[1].id, status="draft", platform="Email", created_by="human"),
            ContentPiece(title="Apex Challenge TikTok Script", content_type="video_script", campaign_id=campaigns_data[2].id, status="draft", platform="TikTok", created_by="ai_agent"),
        ]
        for cp in content_data:
            db.add(cp)

        await db.commit()
