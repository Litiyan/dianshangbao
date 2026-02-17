
import { GoogleGenAI, Type } from "@google/genai";
import { MarketAnalysis, ImageStyle, ImageCategory } from "../types";

/**
 * 核心逻辑：获取 API 实例。
 * 遵循指南：API key 必须排他性地从 process.env.API_KEY 获取。
 */
const getFreshAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("AUTH_KEY_INVALID");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * 通用执行器，包含指数退避重试逻辑
 */
async function executeWithRetry<T>(fn: (ai: GoogleGenAI) => Promise<T>, retries = 2): Promise<T> {
  try {
    const ai = getFreshAI();
    return await fn(ai);
  } catch (error: any) {
    const msg = error.message || "";
    if (msg.includes("fetch") || msg.includes("NetworkError") || msg.includes("failed to fetch")) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 2000 * (3 - retries)));
        return executeWithRetry(fn, retries - 1);
      }
      throw new Error("NETWORK_BLOCKED_CN");
    }
    if (msg.includes("API key not valid") || msg.includes("AUTH_KEY_INVALID") || msg.includes("API_KEY_MISSING") || msg.includes("Requested entity was not found")) {
      throw new Error("AUTH_KEY_INVALID");
    }
    throw error;
  }
}

/**
 * 分析产品并生成营销建议
 */
export async function analyzeProduct(base64Image: string): Promise<MarketAnalysis> {
  return executeWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/png' } },
          { text: `你现在是电商助手“电商宝”的首席视觉专家。请分析此图。输出 JSON 格式。包含：productType, targetAudience, sellingPoints, suggestedPrompt, recommendedCategories, marketingCopy (title, shortDesc, tags)。注意：分析必须精准到电商类目。` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productType: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            sellingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedPrompt: { type: Type.STRING },
            recommendedCategories: { type: Type.ARRAY, items: { type: Type.STRING } },
            marketingCopy: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                shortDesc: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}') as MarketAnalysis;
  });
}

/**
 * 生成产品展示图 (重构背景)
 */
export async function generateProductDisplay(
  base64Image: string, 
  style: ImageStyle, 
  category: ImageCategory,
  aspectRatio: string,
  marketAnalysis: MarketAnalysis,
  fineTunePrompts: string[],
  isUltraHD: boolean,
  chatHistory: {role: 'user' | 'assistant', text: string}[] = []
): Promise<string> {
  return executeWithRetry(async (ai) => {
    const categoryMap: Record<ImageCategory, string> = {
      [ImageCategory.WHITEBG]: "Pure white infinity cove studio background, high-key clean look.",
      [ImageCategory.POSTER]: "Avant-garde editorial layout, balanced negative space for copy.",
      [ImageCategory.MODEL]: "Subtle human presence, holding or interacting with product naturally.",
      [ImageCategory.DETAIL]: "Ultra-macro shot, extreme close-up, premium texture focus.",
      [ImageCategory.SOCIAL]: "Trendy lifestyle setup, soft natural light, warm aesthetic vibe.",
      [ImageCategory.GIFT]: "Elegant luxury gift wrap environment, silk ribbons, festive mood.",
      [ImageCategory.LIFESTYLE]: "High-end interior architecture, aspirational lifestyle setting.",
      [ImageCategory.DISPLAY]: "Professional studio pedestal, sharp product focus."
    };

    const prompt = `
      ROLE: "电商宝" Senior Visual Director.
      MISSION: 100% RE-RENDER ENVIRONMENT. REMOVE ALL ORIGINAL BACKGROUND PIXELS.
      PRODUCT CONTEXT: ${marketAnalysis.productType}, ${marketAnalysis.sellingPoints.join(', ')}.
      TARGET SCENE: ${categoryMap[category]}
      VISUAL STYLE: ${style}
      FINE-TUNING TAGS: ${fineTunePrompts.join(', ')}
      TECHNICAL SPECS: Commercial grade photography, ray tracing, accurate shadows, 8k resolution, cinematic lighting.
      ${chatHistory.length > 0 ? `MODIFICATION REQUESTS: ${chatHistory.map(m => m.text).join('; ')}` : ""}
    `;

    const modelName = isUltraHD ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/png' } },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: { 
          aspectRatio: aspectRatio as any,
          imageSize: isUltraHD ? "2K" : "1K"
        }
      },
    });

    const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (imgPart?.inlineData) {
      return `data:image/png;base64,${imgPart.inlineData.data}`;
    }
    throw new Error("IMAGE_GEN_FAILED");
  });
}
