// src/app/api/generate/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const {
      prompt,
      image,
      mimeType,
      model = "gemini-2.0-flash",
      temperature = 0.2,
      maxOutputTokens = 1024,
      topP = 0.8,
      topK = 40,
    } = await req.json();

    // Validasi prompt
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt wajib diisi" }, { status: 400 });
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

    const inputs: any[] = [{ text: prompt }];

    if (image && typeof image === "string") {
      inputs.push({
        inlineData: {
          data: image.replace(/^data:image\/\w+;base64,/, ""), // remove prefix if ada
          mimeType: mimeType || "image/png",
        },
      });
    }

    const result = await modelInstance.generateContent({
      contents: [{ role: "user", parts: inputs }],
      generationConfig: { temperature, maxOutputTokens, topP, topK },
    });

    // Tangani teks atau konten multi-part
    let output = "";
    if (result.response) {
      try {
        output = result.response.text ? result.response.text() : JSON.stringify(result.response);
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
