import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { parseWorkoutResult } from "@/lib/schema";
import { parsedWorkoutJsonSchema } from "@/lib/jsonSchema";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a workout timer parser. Extract a WorkoutConfig from the user's spoken description. Return ONLY valid JSON, no explanation, no markdown, no backticks. Use this exact structure:
{
  "preparation": <seconds, default 10 if not mentioned>,
  "rounds": <array of per-round durations in seconds>,
  "rest": <seconds between rounds>
}
Rules:
- 'rounds' must be an array with exactly the number of rounds specified
- Unspecified rounds inherit the default duration mentioned, or 30 seconds if no default given
- Handle word numbers: 'three', 'half a minute', 'a minute and a half'
- Resolve relative references: 'first 2', 'last round', '4th round'
- If currentConfig is provided, treat transcript as a modification command and return the updated config
- If something is ambiguous, make a reasonable assumption`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Could not parse workout" }, { status: 400 });
    }

    const body = (await req.json()) as { transcript?: unknown; currentConfig?: unknown };
    const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
    if (!transcript) {
      return NextResponse.json({ error: "Could not parse workout" }, { status: 400 });
    }

    const userContent =
      body.currentConfig !== undefined
        ? `Current config: ${JSON.stringify(body.currentConfig)}\n\nModification: ${transcript}`
        : transcript;

    const client = new Anthropic({ apiKey });
    const params = {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      output_config: {
        format: { type: "json_schema", schema: parsedWorkoutJsonSchema() },
      },
      messages: [{ role: "user", content: userContent }],
    } as unknown as Anthropic.MessageCreateParamsNonStreaming;

    const response = await client.messages.create(params);

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "Could not parse workout" }, { status: 400 });
    }

    const json = JSON.parse(textBlock.text);
    const parsed = parseWorkoutResult(json); // zod-validates ranges/shape
    return NextResponse.json(parsed, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Could not parse workout" }, { status: 400 });
  }
}
