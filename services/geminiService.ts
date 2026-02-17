
import { GoogleGenAI, Type } from "@google/genai";
import { MarketAnalysis, ImageStyle, ImageCategory } from "../types";

/**
 * 动态获取 AI 客户端
 * 确保在每次请求时读取 process.env.API_KEY，适配 Edge Runtime 环境。
 */
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * 带有退避重试逻辑的执行包装器
 */
async function executeWithRetry<T>(fn: (ai: GoogleGenAI) => Promise<T>, retries = 2): Promise<T> {
  try {
    const ai = getClient();
    return await fn(ai);
  } catch (error: any) {
    const msg = error.message || "";
    console.error("[电商宝 API Error]:", error);

    // 处理网络层级阻塞
    if (msg.includes("fetch") || msg.includes("NetworkError") || msg.includes("failed to fetch")) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 2000));
        return executeWithRetry(fn, retries - 1);
      }
      throw new Error("NETWORK_BLOCKED_CN");
    }

    // 处理密钥层级错误
    if (msg.includes("API key not valid") || msg.includes("API Key must be set") || msg.includes("API_KEY_MISSING")) {
      throw new Error("AUTH_KEY_INVALID");
    }

    throw error;
  }
}

export async function analyzeProduct(base64Image: string): Promise<MarketAnalysis> {
  return executeWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/png' } },
          { text: `你现在是电商助手“电商宝”的首席视觉专家。请分析此图。输出 JSON。` }
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
      [ImageCategory.WHITEBG]: "Pure white studio background.",
      [ImageCategory.POSTER]: "Modern editorial poster design.",
      [ImageCategory.MODEL]: "Fashion lifestyle setting with human presence.",
      [ImageCategory.DETAIL]: "Extreme macro bokeh background.",
      [ImageCategory.SOCIAL]: "Trendy soft-focus Xiaohongshu style.",
      [ImageCategory.GIFT]: "Premium festive gift presentation.",
      [ImageCategory.LIFESTYLE]: "Modern home interior architecture.",
      [ImageCategory.DISPLAY]: "Art gallery exhibition pedestal."
    };

    const mandate = `
      ROLE: You are "电商宝" AI Visual Expert.
      MANDATE: 100% RE-RENDER THE BACKGROUND. DELETE ALL ORIGINAL PIXELS EXCEPT THE PRODUCT.
      SCENE: ${categoryMap[category]}
      STYLE: ${style}
      TECHNICAL: Commercial photography, masterpiece, highly realistic, professional lighting.
      ${chatHistory.length > 0 ? `MODIFICATION HISTORY: ${chatHistory.map(m => m.text).join(', ')}` : ""}
    `;

    const modelName = isUltraHD ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/png' } },
          { text: mandate },
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
