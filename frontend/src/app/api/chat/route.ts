import { NextRequest, NextResponse } from "next/server";

const PYTHON_FASTAPI_URL = process.env.PYTHON_FASTAPI_URL || "http://localhost:8000/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, model } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Question parameter is required." },
        { status: 400 }
      );
    }

    const pyRes = await fetch(`${PYTHON_FASTAPI_URL}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, model }),
    });

    if (!pyRes.ok) {
      const errData = await pyRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.detail || "RAG engine error from Python backend." },
        { status: pyRes.status }
      );
    }

    const data = await pyRes.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: `API route proxy error: ${error.message || "Failed to reach Python RAG server"}` },
      { status: 500 }
    );
  }
}
