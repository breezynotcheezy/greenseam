import { NextResponse } from "next/server"
import OpenAI from "openai"

export const runtime = "edge"

export async function GET() {
  try {
    console.log("Testing OpenAI API...")
    console.log("API Key exists:", !!process.env.OPENAI_API_KEY)
    console.log("API Key starts with:", process.env.OPENAI_API_KEY?.substring(0, 10))

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "No API key found",
          env: process.env.OPENAI_API_KEY ? "exists" : "missing",
        },
        { status: 400 },
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    console.log("Making test call to OpenAI...")

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Respond with exactly: 'OpenAI connection successful!'",
        },
        {
          role: "user",
          content: "Test connection",
        },
      ],
      max_tokens: 50,
      temperature: 0,
    })

    const result = response.choices[0]?.message?.content

    return NextResponse.json({
      success: true,
      message: result,
      model: "gpt-3.5-turbo",
      fineTuneModel: process.env.FINE_TUNE_MODEL || "not set",
    })
  } catch (error) {
    console.error("OpenAI test error:", error)
    return NextResponse.json(
      {
        error: "OpenAI API call failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
