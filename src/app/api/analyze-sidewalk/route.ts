import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Lazy initialization to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// Structured output schema for sidewalk analysis
export interface SidewalkAnalysis {
  // Detection confidence
  confidence: number; // 0-1 overall confidence
  sidewalkVisible: boolean; // Could AI see a sidewalk?

  // SEGURIDAD bucket (AI-filled)
  hasSidewalk: boolean | null;
  sidewalkWidth: "narrow" | "adequate" | "wide" | null;
  widthRating: number; // 1-5
  obstructions: string[]; // ['holes', 'cars', 'construction', etc.]
  hasLighting: boolean | null; // May be null for daytime photos
  lightingRating: number | null;

  // Condition assessment
  conditionRating: number; // 1-5 pavement quality
  safetyRating: number; // 1-5 overall safety
  accessibilityRating: number; // 1-5 wheelchair/stroller friendly

  // Description
  description: string; // Natural language summary in Spanish
  detectedIssues: string[]; // List of specific problems found

  // Quality feedback
  imageQuality: "good" | "acceptable" | "poor";
  qualityIssues: string[]; // ['blurry', 'sidewalk_not_visible', etc.]
  retakeRecommended: boolean; // AI suggests retaking photo
}

const SYSTEM_PROMPT = `You are analyzing a street photo from Panama City to assess sidewalk walkability.

Analyze the image and provide a structured assessment of:
1. Whether a sidewalk is visible and its condition
2. Width assessment (narrow/adequate/wide)
3. Any obstructions (holes, parked cars, vendors, construction, business encroachment, trees/roots, garbage)
4. Pavement condition (cracks, damage, missing sections, uneven surfaces)
5. Lighting infrastructure (if visible - may not be detectable in daytime photos)
6. Accessibility for wheelchairs/strollers
7. Overall safety impression

If you cannot clearly see the sidewalk or the image is too blurry, indicate this in qualityIssues and set retakeRecommended to true.

IMPORTANT:
- All text descriptions should be in Spanish
- Be specific about issues you detect
- Rate on a 1-5 scale where 1 is worst and 5 is best
- If no sidewalk exists, set hasSidewalk to false and explain in description

Respond with a valid JSON object matching this exact schema:
{
  "confidence": number (0-1),
  "sidewalkVisible": boolean,
  "hasSidewalk": boolean | null,
  "sidewalkWidth": "narrow" | "adequate" | "wide" | null,
  "widthRating": number (1-5),
  "obstructions": string[],
  "hasLighting": boolean | null,
  "lightingRating": number | null (1-5),
  "conditionRating": number (1-5),
  "safetyRating": number (1-5),
  "accessibilityRating": number (1-5),
  "description": string (in Spanish),
  "detectedIssues": string[] (in Spanish),
  "imageQuality": "good" | "acceptable" | "poor",
  "qualityIssues": string[],
  "retakeRecommended": boolean
}`;

// Validate and normalize base64 data URL for OpenAI compatibility
function normalizeDataUrl(dataUrl: string): string | null {
  // Expected format: data:image/[format];base64,[base64data]
  const dataUrlRegex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,([A-Za-z0-9+/]+=*)$/;

  // Clean up the data URL - remove any whitespace/newlines that mobile browsers might add
  const cleaned = dataUrl.replace(/\s/g, '');

  const match = cleaned.match(dataUrlRegex);
  if (match) {
    // Return the cleaned version
    return cleaned;
  }

  // Try to fix common issues
  // Some browsers use 'jpg' instead of 'jpeg'
  if (cleaned.startsWith('data:image/jpg;base64,')) {
    const fixed = cleaned.replace('data:image/jpg;base64,', 'data:image/jpeg;base64,');
    if (dataUrlRegex.test(fixed)) {
      return fixed;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Validate and normalize the data URL
    const normalizedImage = normalizeDataUrl(image);
    if (!normalizedImage) {
      console.error("Invalid image data URL format. First 100 chars:", image.substring(0, 100));
      return NextResponse.json(
        { error: "Invalid image format. Please try taking the photo again." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Call GPT-4o-mini with vision
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this sidewalk photo and provide a structured assessment.",
            },
            {
              type: "image_url",
              image_url: {
                url: normalizedImage,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    const analysis: SidewalkAnalysis = JSON.parse(content);

    return NextResponse.json({
      success: true,
      analysis,
      model: "gpt-4o-mini",
      usage: response.usage,
    });
  } catch (error) {
    console.error("Error analyzing sidewalk:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}
