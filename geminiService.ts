
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
  const imageParts = base64Images.map(img => ({
    inlineData: { data: img, mimeType: 'image/png' }
  }));
  
  const systemPrompt = `你是一名资深电商视觉专家和市场分析师。
  请根据提供的【多角度】产品图片，进行深度分析并输出 JSON 格式（不要包含 markdown 标签）: 
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
  let rawText = result.text || "";
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
  const imageParts = base64Images.map(img => ({
    inlineData: { data: img, mimeType: 'image/png' }
  }));

  // 场景特化指令集
  const scenarioPrompts: Record<ScenarioType, string> = {
    [ScenarioType.CROSS_BORDER_LOCAL]: "Localized for global market (Amazon/Shopee). Match the aesthetic of the target region (e.g., minimalist for US, vibrant for SE Asia). Realistic background.",
    [ScenarioType.TEXT_EDIT_TRANSLATE]: "Strictly erase all existing text from the source image. Replace with professional, translated marketing copy. High texture background.",
    [ScenarioType.MODEL_REPLACEMENT]: `Replace original person with a ${modelNationality || 'professional'} model. High fashion skin texture and lighting. Product must be worn or held naturally.`,
    [ScenarioType.MOMENTS_POSTER]: "9:16 vertical poster. 'Psoriasis' style (牛皮癣主图) with high impact stickers, bold discount text, and viral marketing graphic elements.",
    [ScenarioType.PLATFORM_MAIN_DETAIL]: "1:1 ratio. Optimized for Taobao/JD. Professional studio setup, clean lighting, clear product features, and high-conversion graphic layout.",
    [ScenarioType.BUYER_SHOW]: "Simulated amateur smartphone photography. Home lifestyle background, natural messy lighting, realistic shadows. Casual placement.",
    [ScenarioType.LIVE_OVERLAY]: "16:9 ratio. Live streaming asset. Clear product in focus. Graphics on corners/sides. Leave center area clear for human placement.",
    [ScenarioType.LIVE_GREEN_SCREEN]: "16:9 ratio. High-end virtual live studio. Showroom or modern interior. Soft lighting, bokeh background. Optimized for chroma keying."
  };

  const typographyInstruction = (textConfig.title || textConfig.detail) ? `
    TYPOGRAPHY ARTWORK:
    - Main Headline: "${textConfig.title}" (Bold, eye-catching font)
    - Sub-detail: "${textConfig.detail}" (Clean, readable marketing text)
    - Automatically beautify and layout these texts based on the chosen scenario.
  ` : "No extra text overlay required.";

  const finalPrompt = `
    TASK: Reconstruct product into a ${scenario} scenario.
    INTENT: ${userIntent}.
    RULES: ${scenarioPrompts[scenario]}.
    ${typographyInstruction}
    PRODUCT FEATURES: ${analysis.sellingPoints.join(', ')}.
    MANDATE: 8k photorealistic. Remove original background. Retain 3D product fidelity using provided multi-angle references.
  `;

  // 比例映射
  const ratioMap: Record<ScenarioType, string> = {
    [ScenarioType.MOMENTS_POSTER]: "9:16",
    [ScenarioType.LIVE_OVERLAY]: "16:9",
    [ScenarioType.LIVE_GREEN_SCREEN]: "16:9",
    [ScenarioType.PLATFORM_MAIN_DETAIL]: "1:1",
    [ScenarioType.CROSS_BORDER_LOCAL]: "1:1",
    [ScenarioType.TEXT_EDIT_TRANSLATE]: "1:1",
    [ScenarioType.MODEL_REPLACEMENT]: "3:4",
    [ScenarioType.BUYER_SHOW]: "3:4"
  };

  const payload = {
    model: modelName,
    contents: { parts: [...imageParts, { text: finalPrompt }] },
    config: { 
      imageConfig: { 
        aspectRatio: (ratioMap[scenario] || "1:1") as any
      }
    }
  };

  const result = await callGeminiBff(payload);
  const imgData = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
  
  if (!imgData) throw new Error("生成失败，请检查输入素材。");
  return `data:image/png;base64,${imgData}`;
}
