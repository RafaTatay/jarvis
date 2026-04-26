import time
import os
from anthropic import AsyncAnthropic
from sqlalchemy.ext.asyncio import AsyncSession
from backend.agents.tools import TOOL_DEFINITIONS, execute_tool

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


async def run_agent_with_tools(
    system_prompt: str,
    user_prompt: str,
    db: AsyncSession,
    max_iterations: int = 8,
) -> dict:
    """Run an agent that can call tools to read/write the agency database."""
    start = time.monotonic()
    messages = [{"role": "user", "content": user_prompt}]
    actions_taken = []
    total_input = 0
    total_output = 0
    final_text = ""

    for _ in range(max_iterations):
        response = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=f"{AGENCY_SYSTEM_CONTEXT}\n\n{system_prompt}",
            tools=TOOL_DEFINITIONS,
            messages=messages,
        )
        total_input += response.usage.input_tokens
        total_output += response.usage.output_tokens

        # Collect any text blocks the model returned this turn.
        text_blocks = [b.text for b in response.content if b.type == "text"]
        if text_blocks:
            final_text = "\n\n".join(text_blocks)

        if response.stop_reason != "tool_use":
            break

        tool_uses = [b for b in response.content if b.type == "tool_use"]
        messages.append({"role": "assistant", "content": response.content})

        tool_results = []
        for tu in tool_uses:
            result = await execute_tool(tu.name, tu.input or {}, db)
            actions_taken.append({"tool": tu.name, "input": tu.input, "result": result})
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": tu.id,
                "content": str(result),
            })
        messages.append({"role": "user", "content": tool_results})

    duration_ms = int((time.monotonic() - start) * 1000)
    return {
        "result": final_text or "Agent finished without a final message.",
        "actions": actions_taken,
        "tokens_used": total_input + total_output,
        "duration_ms": duration_ms,
        "model": "claude-sonnet-4-6",
    }
