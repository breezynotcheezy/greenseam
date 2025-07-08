import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { playerData } = await request.json();
    
    if (!playerData) {
      return NextResponse.json(
        { error: "Player data is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Format player stats for the prompt
    const statsString = Object.entries(playerData)
      .filter(([key, value]) => typeof value !== 'object' && key !== 'id')
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert baseball analyst specializing in player performance analysis. Provide concise, insightful analysis based on player statistics. Focus on strengths, weaknesses, and actionable suggestions for improvement. Use baseball terminology appropriately. Keep responses under 150 words and make them specific to the player's stats."
        },
        {
          role: "user",
          content: `Analyze this baseball player's performance and provide insights:\n\n${statsString}`
        }
      ],
      max_tokens: 250,
      temperature: 0.7,
    });

    const insights = response.choices[0]?.message?.content || "Unable to generate insights at this time.";

    return NextResponse.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    return NextResponse.json(
      {
        error: "Failed to generate insights",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
