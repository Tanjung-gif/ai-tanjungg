// src/app/api/generate/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Definisikan tipe input biar tidak pakai any
type InputPart =
  | { text: string }
  | { inlineData: { data: string; mimeType: string } };

// Definisikan tipe request body
interface GenerateRequest {
  prompt: string;
  image?: string;
  mimeType?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const {
      prompt,
      image,
      mimeType,
      model = "gemini-2.5-flash",
      temperature = 0.2,
      maxOutputTokens = 1024,
      topP = 0.8,
      topK = 40,
    }: GenerateRequest = await req.json();

    // Validasi prompt
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt wajib diisi" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY belum diset di .env.local" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelInstance = genAI.getGenerativeModel({ model });

    // Input tidak pakai any lagi
    const inputs: InputPart[] = [{ text: prompt }];

    if (image && typeof image === "string") {
      inputs.push({
        inlineData: {
          data: image.replace(/^data:image\/\w+;base64,/, ""),
          mimeType: mimeType || "image/png",
        },
      });
    }

    const result = await modelInstance.generateContent({
      contents: [{ role: "user", parts: inputs }],
      generationConfig: { temperature, maxOutputTokens, topP, topK },
    });

    // Tangani output
    let output = "";
    if (result.response) {
      try {
        output = result.response.text
          ? result.response.text()
          : JSON.stringify(result.response);
      } catch {
        output = JSON.stringify(result.response);
      }
    }

    return NextResponse.json({ output });
  } catch (err: unknown) {
    console.error("Error API Gemini:", err);
    let errorMessage = "Terjadi kesalahan pada server";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
