
import { GoogleGenAI, Type } from "@google/genai";
import { MarketAnalysis, ImageStyle, ImageCategory } from "../types";

/**
 * 动态获取 AI 客户端
 * 严格遵循开发指南：API key 必须且仅能从 process.env.API_KEY 获取。
 * 此变量由执行环境自动注入，应用不得提供手动输入或管理界面。
 */
const getFreshAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_NOT_CONFIGURED");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * 通用重试包装器，处理网络波动
 */
async function executeWithRetry<T>(fn: (ai: GoogleGenAI) => Promise<T>, retries = 2): Promise<T> {
  try {
    const ai = getFreshAI();
    return await fn(ai);
  } catch (error: any) {
    const msg = error.message || "";
    console.error("[电商宝内核错误]:", error);

    if (msg.includes("fetch") || msg.includes("NetworkError") || msg.includes("failed to fetch")) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 1500 * (3 - retries)));
        return executeWithRetry(fn, retries - 1);
      }
      throw new Error("网络连接超时，请检查全局代理设置。");
    }
    throw error;
  }
}

/**
 * 产品深度分析与卖点提取
 */
export async function analyzeProduct(base64Image: string): Promise<MarketAnalysis> {
  return executeWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/png' } },
          { text: `你现在是电商助手“电商宝”的视觉导演。请分析此图，输出 JSON 格式。包含：productType, targetAudience, sellingPoints, suggestedPrompt, recommendedCategories, marketingCopy (title, shortDesc, tags)。` }
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
 * 电商背景重构与渲染
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
      [ImageCategory.WHITEBG]: "Pure white studio background.",
      [ImageCategory.POSTER]: "High-end editorial poster layout.",
      [ImageCategory.MODEL]: "Fashion lifestyle with soft human context.",
      [ImageCategory.DETAIL]: "Macro professional product photography.",
      [ImageCategory.SOCIAL]: "Trendy soft-focus social media aesthetic.",
      [ImageCategory.GIFT]: "Premium gift box environment with festive mood.",
      [ImageCategory.LIFESTYLE]: "Modern domestic interior setting.",
      [ImageCategory.DISPLAY]: "Gallery exhibition display stand."
    };

    const systemPrompt = `
      ROLE: "电商宝" AI Visual Master.
      TASK: RE-RENDER THE BACKGROUND. KEEP PRODUCT PIXELS INTACT BUT ENHANCE LIGHTING.
      SCENE: ${categoryMap[category]}
      STYLE: ${style}
      CONTEXT: ${marketAnalysis.productType}, ${marketAnalysis.sellingPoints.join(', ')}.
      EXTRA: ${fineTunePrompts.join(', ')}.
      ${chatHistory.length > 0 ? `REFINEMENT: ${chatHistory.map(m => m.text).join('; ')}` : ""}
    `;

    const model = isUltraHD ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/png' } },
          { text: systemPrompt },
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
    throw new Error("生成结果不含图像数据，请检查输入原图。");
  });
}
