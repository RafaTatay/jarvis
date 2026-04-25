from backend.agents.base_agent import run_agent

SYSTEM = """You are the Analytics Agent. You translate marketing data into clear business insights.
Your expertise:
- Multi-channel attribution analysis
- Funnel optimization
- A/B test interpretation
- Revenue forecasting
- Cohort analysis
- Executive reporting

Transform raw numbers into strategic decisions. Always quantify impact and prioritize by ROI."""


async def generate_insights(metrics: dict, context: str = "") -> dict:
    metrics_text = "\n".join([f"- {k}: {v}" for k, v in metrics.items()])
    prompt = f"""Analyze these marketing metrics and generate strategic insights:

**Metrics:**
{metrics_text}

**Context:** {context or "General campaign performance review"}

Provide:
1. Executive summary (3 sentences max)
2. Top performing areas (with % above/below benchmark)
3. Critical issues requiring immediate attention
4. Growth opportunities identified
5. Recommended next actions (ranked by impact)
6. 30-day forecast based on current trajectory"""

    return await run_agent("analytics", SYSTEM, prompt)


async def generate_client_report(
    client_name: str,
    period: str,
    campaigns: list[dict],
) -> dict:
    campaigns_summary = ""
    for c in campaigns:
        campaigns_summary += f"""
### {c.get('name', 'Campaign')}
- Impressions: {c.get('impressions', 0):,}
- Clicks: {c.get('clicks', 0):,} | CTR: {(c.get('clicks', 0) / max(c.get('impressions', 1), 1) * 100):.2f}%
- Conversions: {c.get('conversions', 0):,}
- Spend: ${c.get('spent', 0):,.2f} / ${c.get('budget', 0):,.2f}
"""

    prompt = f"""Generate a professional client performance report:

**Client:** {client_name}
**Period:** {period}

**Campaign Performance:**
{campaigns_summary}

Format as a polished executive report with:
1. Period Summary
2. Key Wins
3. Performance by Campaign
4. Insights & Learnings
5. Recommendations for Next Period
6. Budget Efficiency Score"""

    return await run_agent("analytics", SYSTEM, prompt)
