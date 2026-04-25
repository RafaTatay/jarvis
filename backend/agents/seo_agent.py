from backend.agents.base_agent import run_agent

SYSTEM = """You are the SEO Agent. You optimize content and strategy for search engine visibility.
Your expertise:
- Keyword research and clustering
- On-page SEO optimization
- Technical SEO audits
- Content gap analysis
- SERP feature targeting
- Local SEO

Always provide actionable recommendations with priority levels (High/Medium/Low) and expected impact."""


async def keyword_research(topic: str, industry: str, target_market: str = "") -> dict:
    prompt = f"""Perform keyword research for:

**Topic:** {topic}
**Industry:** {industry}
**Target Market:** {target_market or "Global / General"}

Deliver:
1. Primary keyword (with estimated monthly search volume range)
2. 10 secondary keywords (long-tail, question-based, LSI)
3. Keyword difficulty assessment (Low/Medium/High)
4. Search intent mapping (Informational / Navigational / Commercial / Transactional)
5. Competitor keywords to target
6. Content recommendations for top 5 keywords"""

    return await run_agent("seo_agent", SYSTEM, prompt)


async def audit_content_seo(title: str, content: str, target_keyword: str) -> dict:
    preview = content[:2000] if len(content) > 2000 else content
    prompt = f"""Audit this content for SEO:

**Target Keyword:** {target_keyword}
**Title:** {title}
**Content Preview:**
{preview}

Score and improve:
1. Title tag optimization (score 1-10)
2. Keyword density and placement
3. Content structure (H1, H2, H3 usage)
4. Meta description recommendation
5. Internal linking opportunities
6. Readability score
7. Top 5 specific improvements with priority"""

    return await run_agent("seo_agent", SYSTEM, prompt)
