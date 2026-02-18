
import { MarketAnalysis, ImageStyle, ImageCategory } from "../types";

// 定义后端接口地址（BFF 模式）
const API_ENDPOINT = '/api/gemini';

/**
 * 通用的后端调用函数 (BFF模式)
 * 负责将请求转发给 Cloudflare Functions，绕过浏览器端的网络限制
 */
async function callGeminiBff(payload: any) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({ error: "RESPONSE_NOT_JSON" }));

    if (!response.ok) {
      // 针对配额不足或权限受限的特定处理
      if (response.status === 429 || (data.error && (data.error === "RESOURCE_EXHAUSTED" || data.error.status === "RESOURCE_EXHAUSTED"))) {
        const msg = data.message || (data.error && data.error.message) || "";
        if (msg.includes("limit: 0")) {
          throw new Error("检测到模型配额受限 (limit: 0)。请确保已在 Google AI Studio 绑定结算账户(Billing)，且代码已指定正式版模型 'gemini-2.5-flash-image'。");
        }
        throw new Error("API 请求过于频繁或配额耗尽，请稍后再试。");
      }
      
      throw new Error(data.message || (data.error && data.error.message) || `API 请求失败: ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error("BFF 调用错误:", error);
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      throw new Error("网络连接失败。请确保您的 Cloudflare Pages 后台 API 路由正常工作。");
    }
    throw error;
  }
}

/**
 * 1. 分析产品并生成营销建议
 * 使用 gemini-2.0-flash 进行稳健的文本分析
 */
export async function analyzeProduct(base64Image: string): Promise<MarketAnalysis> {
  const modelName = 'gemini-2.0-flash'; 
  
  const systemPrompt = `你现在是电商助手“电商宝”的首席视觉专家。请分析此图。
  必须严格输出纯 JSON 格式。包含：
  - productType (商品类型)
  - targetAudience (目标人群)
  - sellingPoints (卖点数组)
  - suggestedPrompt (生图提示词建议)
  - recommendedCategories (推荐分类数组)
  - marketingCopy (营销文案对象: title, shortDesc, tags)`;

  const payload = {
    model: modelName,
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/png' } },
        { text: systemPrompt }
      ]
    },
    config: {
      responseMimeType: "application/json"
    }
  };

  try {
    const result = await callGeminiBff(payload);
    
    const candidates = result.candidates || [];
    let rawText = "";
    if (candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
      const textPart = candidates[0].content.parts.find((p: any) => p.text);
      if (textPart) rawText = textPart.text;
    } else if (result.text) {
      rawText = result.text;
    }

    if (rawText) {
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson) as MarketAnalysis;
    }
    throw new Error("模型未返回有效的分析结果");
  } catch (error) {
    console.error("分析产品失败:", error);
    throw error;
  }
}

/**
 * 2. 生成产品展示图
 * (修复：强制使用正式版模型，解决 limit: 0 问题)
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
    [ImageCategory.WHITEBG]: "Pure white infinity cove studio background.",
    [ImageCategory.POSTER]: "Modern editorial poster layout with clean space.",
    [ImageCategory.MODEL]: "Fashion lifestyle setting with soft human interaction.",
    [ImageCategory.DETAIL]: "Macro professional photography with extreme bokeh.",
    [ImageCategory.SOCIAL]: "Trendy Xiaohongshu aesthetic with soft warm lighting.",
    [ImageCategory.GIFT]: "Exquisite festive gift setting with ribbons and bokeh.",
    [ImageCategory.LIFESTYLE]: "High-end contemporary interior architecture.",
    [ImageCategory.DISPLAY]: "Art gallery pedestal in a clean bright room."
  };

  const systemMandate = `
    ROLE: You are "电商宝" AI Engine.
    MANDATE: 100% RE-RENDER THE ENVIRONMENT. ERASE ORIGINAL BACKGROUND.
    LIGHTING: Re-calculate all shadows based on the new scene.
    QUALITY: Masterpiece, 8k, commercial product photography.
  `;

  const chatContext = chatHistory.length > 0 
    ? `\nREFINEMENT REQUESTS:\n${chatHistory.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}`
    : "";

  const finalPrompt = `${systemMandate}
    TARGET SCENE: ${categoryMap[category]}
    VISUAL STYLE: ${style}
    TECHNICAL: ${fineTunePrompts.join(', ')}
    CONTEXT: ${marketAnalysis.productType}, ${marketAnalysis.sellingPoints.join(', ')}.
    ${chatContext}
    OUTPUT: Return the final generated image.
  `;

  // 🔴 核心修改：使用正式版模型名称，不带 preview
  const modelName = 'gemini-2.5-flash-image'; 

  const payload = {
    model: modelName,
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/png' } },
        { text: finalPrompt },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
        imageSize: "1K" 
      }
    },
  };

  const result = await callGeminiBff(payload);
  
  const candidates = result.candidates || [];
  if (candidates.length > 0) {
    const parts = candidates[0].content.parts;
    const imgPart = parts.find((p: any) => p.inlineData);
    if (imgPart?.inlineData?.data) {
      return `data:image/png;base64,${imgPart.inlineData.data}`;
    }
  }

  throw new Error("模型已响应，但未包含有效的图像像素。可能是提示词被安全策略拦截。");
}
