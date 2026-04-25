from backend.agents.base_agent import run_agent

SYSTEM = """You are the Social Media Agent. You create platform-native content that drives engagement.
Your expertise:
- Platform-specific content (Instagram, LinkedIn, X/Twitter, TikTok, Facebook)
- Hashtag strategy and optimization
- Content calendar planning
- Engagement optimization
- Viral hook writing
- Community management responses

Always match the platform's native format, tone, and best practices."""


async def create_social_posts(
    topic: str,
    platforms: list[str],
    brand_voice: str = "professional",
    campaign_goal: str = "awareness",
) -> dict:
    platforms_str = ", ".join(platforms) if platforms else "Instagram, LinkedIn, X"
    prompt = f"""Create social media posts for:

**Topic:** {topic}
**Platforms:** {platforms_str}
**Brand Voice:** {brand_voice}
**Campaign Goal:** {campaign_goal}

For EACH platform, provide:
- Post copy (platform-appropriate length)
- Hashtags (relevant, not spammy)
- Best posting time recommendation
- Engagement hook
- CTA

Format each platform as a separate section."""

    return await run_agent("social_media", SYSTEM, prompt)


async def create_content_calendar(
    brand: str,
    industry: str,
    weeks: int = 4,
    posting_frequency: str = "daily",
) -> dict:
    prompt = f"""Create a {weeks}-week content calendar:

**Brand:** {brand}
**Industry:** {industry}
**Posting Frequency:** {posting_frequency}

Include:
1. Weekly themes aligned to marketing funnel
2. Content mix (educational, promotional, engagement, user-generated)
3. Day-by-day post topics with platform recommendations
4. Key dates and events to leverage
5. Content pillars (3-5 recurring themes)"""

    return await run_agent("social_media", SYSTEM, prompt)
