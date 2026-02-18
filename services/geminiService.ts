
import { MarketAnalysis, ImageStyle, ImageCategory } from "../types";

/**
 * 私有助手：通过 Cloudflare Pages Function 调用 Gemini
 */
async function callGeminiBff(payload: any) {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "UNKNOWN_ERROR" }));
    throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * 产品深度分析与卖点提取 (通过 BFF)
 */
export async function analyzeProduct(base64Image: string): Promise<MarketAnalysis> {
  const payload = {
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/png' } },
        { text: `你现在是电商助手“电商宝”的视觉导演。请分析此图，输出 JSON 格式。包含：productType, targetAudience, sellingPoints, suggestedPrompt, recommendedCategories, marketingCopy (title, shortDesc, tags)。` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      // 在无 SDK 的前端直接使用字符串定义 Schema 类型
      responseSchema: {
        type: "OBJECT",
        properties: {
          productType: { type: "STRING" },
          targetAudience: { type: "STRING" },
          sellingPoints: { type: "ARRAY", items: { type: "STRING" } },
          suggestedPrompt: { type: "STRING" },
          recommendedCategories: { type: "ARRAY", items: { type: "STRING" } },
          marketingCopy: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              shortDesc: { type: "STRING" },
              tags: { type: "ARRAY", items: { type: "STRING" } }
            }
          }
        }
      }
    }
  };

  const result = await callGeminiBff(payload);
  // 解析 BFF 返回的 text
  return JSON.parse(result.text || '{}') as MarketAnalysis;
}

/**
 * 电商背景重构与渲染 (通过 BFF)
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

  const payload = {
    model: isUltraHD ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image',
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
  };

  const result = await callGeminiBff(payload);
  
  // 遍历 candidates 寻找 inlineData 部分
  const candidates = result.candidates || [];
  const imgPart = candidates[0]?.content?.parts.find((p: any) => p.inlineData);
  
  if (imgPart?.inlineData) {
    return `data:image/png;base64,${imgPart.inlineData.data}`;
  }
  
  throw new Error("生成结果不含图像数据，请检查输入原图或调整描述词。");
}
