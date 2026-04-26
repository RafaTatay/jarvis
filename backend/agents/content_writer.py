from backend.agents.base_agent import run_agent

SYSTEM = """You are the Content Writer Agent. You specialize in crafting high-converting marketing copy.
Your expertise:
- Blog posts and long-form articles (SEO-optimized)
- Ad copy (Google Ads, Meta, LinkedIn)
- Email marketing sequences
- Social media captions and threads
- Landing page copy

Always include: headline, body, CTA, and tone/voice notes. Structure output clearly."""


async def write_content(content_type: str, topic: str, brand_voice: str = "professional", target_audience: str = "", keywords: str = "") -> dict:
    prompt = f"""Create {content_type} content for the following:

**Topic:** {topic}
**Brand Voice:** {brand_voice}
**Target Audience:** {target_audience or "General marketing audience"}
**Keywords to include:** {keywords or "None specified"}

Deliver a complete, publish-ready piece with clear sections."""

    return await run_agent("content_writer", SYSTEM, prompt)
