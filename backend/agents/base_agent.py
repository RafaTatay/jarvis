import time
import os
from anthropic import AsyncAnthropic

client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))

AGENCY_SYSTEM_CONTEXT = """You are a specialized AI agent working inside JARVIS Mission Control —
a full-service marketing agency platform. You work alongside other agents and human strategists.
Always be concise, actionable, and professional. Format outputs in clean markdown.
Focus on measurable results, ROI, and marketing best practices."""


async def run_agent(agent_type: str, system_prompt: str, user_prompt: str) -> dict:
    start = time.monotonic()

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=f"{AGENCY_SYSTEM_CONTEXT}\n\n{system_prompt}",
        messages=[{"role": "user", "content": user_prompt}],
    )

    duration_ms = int((time.monotonic() - start) * 1000)
    result_text = response.content[0].text
    tokens = response.usage.input_tokens + response.usage.output_tokens

    return {
        "result": result_text,
        "tokens_used": tokens,
        "duration_ms": duration_ms,
        "model": response.model,
    }
