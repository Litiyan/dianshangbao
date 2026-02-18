
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

  const data = await response.json().catch(() => ({ error: "UNKNOWN_ERROR" }));

  if (!response.ok) {
    // 处理 Google API 报错 (429 RESOURCE_EXHAUSTED)
    if (response.status === 429 || (data.error && (data.error === "RESOURCE_EXHAUSTED" || data.error.status === "RESOURCE_EXHAUSTED"))) {
      const errorMsg = data.message || (data.error && data.error.message) || "";
      
      if (errorMsg.includes("limit: 0") || errorMsg.includes("quota") || errorMsg.includes("free_tier")) {
        throw new Error("检测到 API 权限受限。虽然您已开启 Billing，但生效可能需要几分钟，或请检查 API Key 是否属于该付费项目。");
      }
      
      throw new Error("请求过于频繁，请稍后再试。");
    }
    
    throw new Error(data.message || (data.error && data.error.message) || `服务器响应异常 (HTTP ${response.status})`);
  }

  return data;
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
  // 对于分析模型，直接读取返回的 JSON 字符串
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
    TASK: RE-RENDER THE BACKGROUND. KEEP PRODUCT PIXELS INTACT BUT ENHANCE LIGHTING AND ENVIRONMENT.
    SCENE: ${categoryMap[category]}
    STYLE: ${style}
    CONTEXT: ${marketAnalysis.productType}, ${marketAnalysis.sellingPoints.join(', ')}.
    EXTRA: ${fineTunePrompts.join(', ')}.
    ${chatHistory.length > 0 ? `REFINEMENT HISTORY: ${chatHistory.map(m => m.text).join('; ')}` : ""}
    OUTPUT: Return the final generated image.
  `;

  // 正确使用具备图像生成功能的模型名称
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
  
  // 遍历 candidates 寻找图像数据
  const candidates = result.candidates || [];
  if (candidates.length > 0) {
    const parts = candidates[0].content.parts;
    const imgPart = parts.find((p: any) => p.inlineData);
    if (imgPart?.inlineData?.data) {
      return `data:image/png;base64,${imgPart.inlineData.data}`;
    }
  }
  
  throw new Error("模型已响应，但未包含有效的图像像素。请尝试减少提示词的复杂度。");
}
