
import { MarketAnalysis, ScenarioType, TextConfig } from "../types";

const API_ENDPOINT = '/api/gemini';

/**
 * 统一 BFF 调用接口
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
      throw new Error(data.message || (data.error && data.error.message) || `请求失败: ${response.status}`);
    }
    return data;
  } catch (error: any) {
    console.error("BFF 调用错误:", error);
    throw error;
  }
}

/**
 * 1. 深度分析多图产品 DNA (使用 Gemini 3 Flash)
 */
export async function analyzeProduct(base64Images: string[]): Promise<MarketAnalysis> {
  const modelName = 'gemini-3-flash-preview'; 
  // 构建多图 Part 数组
  const imageParts = base64Images.map(img => ({
    inlineData: { data: img, mimeType: 'image/png' }
  }));
  
  const systemPrompt = `你是一名资深电商视觉专家和市场分析师。
  请根据提供的【多角度】产品图片（图片包含产品细节、侧面或包装），进行深度分析。
  请输出 JSON 格式（不要包含 markdown 代码块标签）: 
  { 
    "productType": "产品名称", 
    "targetAudience": "核心受众", 
    "sellingPoints": ["卖点1", "卖点2"], 
    "suggestedPrompt": "针对此产品的核心摄影描述", 
    "isApparel": true/false 
  }`;

  const payload = {
    model: modelName,
    contents: { parts: [...imageParts, { text: systemPrompt }] },
    config: { responseMimeType: "application/json" }
  };

  const result = await callGeminiBff(payload);
  // 提取文本内容
  let rawText = result.text || "";
  // 兼容不同返回格式的解析
  const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanJson) as MarketAnalysis;
}

/**
 * 2. 核心场景重构引擎 (使用 Gemini 2.5 Flash Image)
 */
export async function generateScenarioImage(
  base64Images: string[],
  scenario: ScenarioType,
  analysis: MarketAnalysis,
  userIntent: string,
  textConfig: TextConfig,
  modelNationality: string = ""
): Promise<string> {
  const modelName = 'gemini-2.5-flash-image';
  
  // 依然传递多图作为参考，帮助模型理解 3D 结构
  const imageParts = base64Images.map(img => ({
    inlineData: { data: img, mimeType: 'image/png' }
  }));

  // 场景特化指令集
  const scenarioPrompts: Record<ScenarioType, string> = {
    [ScenarioType.CROSS_BORDER]: "Global high-end market style (Amazon/Shopify). Minimalist, clean backgrounds, international typography. Localized aesthetic.",
    [ScenarioType.SOCIAL_POSTER]: "Vertical 9:16 layout. Strong visual impact for WeChat/Instagram. Bold promotional stickers and artistic text layout.",
    [ScenarioType.MARKET_MAIN]: "1:1 ratio. High-CTR Taobao/JD style. Professional studio soft lighting. Centered composition with clear selling point text.",
    [ScenarioType.BUYER_SHOW]: "Lifestyle home environment. Shot with a smartphone. Natural, messy but cozy background. Realistic lighting and shadows.",
    [ScenarioType.MODEL_DIVERSITY]: `Fashion editorial style. Featuring a ${modelNationality || 'professional'} model wearing/using the product. Realistic skin and high-end studio set.`,
    [ScenarioType.LIVE_ASSETS]: "16:9 ratio. Live streaming graphics. Clean product on one side, leaving clear space for a real person overlay.",
    [ScenarioType.GREEN_SCREEN]: "16:9 ratio. Luxury showroom or modern minimalist interior. Cinematic depth of field (bokeh). Ideal for virtual backgrounds.",
    [ScenarioType.DETAIL_PAGE]: "3:4 ratio. Extreme macro focus on material, fabric, and build quality. Infographic-style text callouts."
  };

  // 文字美化与排版指令
  const typographyInstruction = textConfig.title || textConfig.detail ? `
    TEXT OVERLAY INSTRUCTIONS:
    - Main Title: "${textConfig.title}" (Bold, high-end commercial font, prominent position)
    - Detail Info: "${textConfig.detail}" (Elegant sub-text, professional spacing)
    - Apply artistic graphic design principles to integrate text with the product.
  ` : "No text overlay.";

  const finalPrompt = `
    TASK: Commercial reconstruction. 
    SCENARIO: ${scenarioPrompts[scenario]}.
    PRODUCT INFO: ${analysis.productType}, ${analysis.sellingPoints.join('/')}.
    USER CUSTOM INTENT: ${userIntent}.
    ${typographyInstruction}
    MANDATE: 8k resolution, photorealistic, complete background removal. Retain the product's 3D structure from the provided multi-angle references.
  `;

  // 比例映射
  const ratioMap: Record<string, string> = {
    [ScenarioType.SOCIAL_POSTER]: "9:16",
    [ScenarioType.LIVE_ASSETS]: "16:9",
    [ScenarioType.GREEN_SCREEN]: "16:9",
    [ScenarioType.MARKET_MAIN]: "1:1",
    [ScenarioType.CROSS_BORDER]: "1:1"
  };
  const aspectRatio = ratioMap[scenario] || "3:4";

  const payload = {
    model: modelName,
    contents: { parts: [...imageParts, { text: finalPrompt }] },
    config: { 
      imageConfig: { 
        aspectRatio: aspectRatio as any
      }
    }
  };

  const result = await callGeminiBff(payload);
  // 按规范查找 inlineData 部分
  const imgData = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
  
  if (!imgData) throw new Error("图片生成链路中断，请检查 BFF 日志");
  return `data:image/png;base64,${imgData}`;
}
