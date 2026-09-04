import { NextRequest, NextResponse } from "next/server";

const PYTHON_FASTAPI_URL = process.env.PYTHON_FASTAPI_URL || "http://localhost:8000/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { model } = body;

    if (!model) {
      return NextResponse.json({ error: "Model parameter is required." }, { status: 400 });
    }

    const pyRes = await fetch(`${PYTHON_FASTAPI_URL}/set-model`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model }),
    });

    if (!pyRes.ok) {
      const errData = await pyRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.detail || "Failed to update LLM model." },
        { status: pyRes.status }
      );
    }

    const data = await pyRes.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to reach Python RAG server";
    return NextResponse.json(
      { error: `API route proxy error: ${message}` },
      { status: 500 }
    );
  }
}
