from backend.agents.base_agent import run_agent

SYSTEM = """You are the Campaign Strategist Agent. You design data-driven marketing campaigns.
Your expertise:
- Full-funnel campaign architecture (Awareness → Consideration → Conversion)
- Channel mix strategy (paid, organic, email, social)
- Budget allocation recommendations
- KPI framework and success metrics
- Competitive positioning and messaging strategy

Deliver strategic plans with clear objectives, tactics, timelines, and budget breakdowns."""


async def create_campaign_strategy(
    objective: str,
    industry: str,
    budget: float,
    duration_weeks: int,
    target_audience: str,
) -> dict:
    prompt = f"""Design a complete marketing campaign strategy:

**Objective:** {objective}
**Industry:** {industry}
**Total Budget:** ${budget:,.2f}
**Duration:** {duration_weeks} weeks
**Target Audience:** {target_audience}

Provide:
1. Campaign overview and positioning
2. Channel strategy with budget allocation (%)
3. Weekly timeline with milestones
4. KPIs and success metrics
5. Creative direction recommendations
6. Risk mitigation"""

    return await run_agent("campaign_strategist", SYSTEM, prompt)


async def analyze_campaign_performance(
    campaign_name: str,
    impressions: int,
    clicks: int,
    conversions: int,
    budget: float,
    spent: float,
) -> dict:
    ctr = (clicks / impressions * 100) if impressions > 0 else 0
    cvr = (conversions / clicks * 100) if clicks > 0 else 0
    cpc = (spent / clicks) if clicks > 0 else 0
    cpa = (spent / conversions) if conversions > 0 else 0

    prompt = f"""Analyze this campaign's performance and provide strategic recommendations:

**Campaign:** {campaign_name}
**Metrics:**
- Impressions: {impressions:,}
- Clicks: {clicks:,} (CTR: {ctr:.2f}%)
- Conversions: {conversions:,} (CVR: {cvr:.2f}%)
- Budget: ${budget:,.2f} | Spent: ${spent:,.2f}
- CPC: ${cpc:.2f} | CPA: ${cpa:.2f}

Provide:
1. Performance assessment (Green/Yellow/Red for each KPI)
2. Top 3 wins
3. Top 3 areas to improve
4. Specific optimization recommendations
5. Budget reallocation suggestions"""

    return await run_agent("campaign_strategist", SYSTEM, prompt)
