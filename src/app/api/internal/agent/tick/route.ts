import { NextResponse } from "next/server";

import { runAgentTick } from "@/lib/services/agents";

export async function POST(request: Request) {
  const secret = request.headers.get("x-agent-secret");
  if (!secret || secret !== process.env.AGENT_TICK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runAgentTick();
  return NextResponse.json({ data: result });
}
