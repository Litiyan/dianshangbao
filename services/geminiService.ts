
import { MarketAnalysis, ImageStyle, ImageCategory, GeneratedImage } from "../types";

const API_ENDPOINT = '/api/gemini';

async function callGeminiBff(payload: any) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({ error: "RESPONSE_NOT_JSON" }));
    if (!response.ok) {
      if (response.status === 429 || (data.error && data.error.status === "RESOURCE_EXHAUSTED")) {
        throw new Error("配额不足或 Billing 未开启。请检查 Google AI Studio 结算设置。");
      }
      throw new Error(data.message || (data.error && data.error.message) || `API 请求失败: ${response.status}`);
    }
    return data;
  } catch (error: any) {
    console.error("BFF 调用错误:", error);
    throw error;
  }
}

/**
 * 1. 深度分析产品
 */
export async function analyzeProduct(base64Image: string): Promise<MarketAnalysis> {
  const modelName = 'gemini-2.0-flash'; 
  const systemPrompt = `你现在是电商助手“电商宝”的首席视觉专家。
  分析此图，输出 JSON 格式。
  必须准确判断 isApparel (如果产品是衣服、裤子、鞋、包、帽子、配饰，则为 true)。
  JSON 结构: { productType, targetAudience, sellingPoints[], suggestedPrompt, recommendedCategories[], marketingCopy: {title, shortDesc, tags[]}, isApparel }`;

  const payload = {
    model: modelName,
    contents: { parts: [{ inlineData: { data: base64Image, mimeType: 'image/png' } }, { text: systemPrompt }] },
    config: { responseMimeType: "application/json" }
  };

  const result = await callGeminiBff(payload);
  let rawText = result.text || (result.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text) || "";
  const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanJson) as MarketAnalysis;
}

/**
 * 2. 生成预览图 (快速/通用商业风格)
 */
export async function generatePreview(
  base64Image: string,
  style: ImageStyle,
  analysis: MarketAnalysis,
  userTweaks: string = ""
): Promise<string> {
  const modelName = 'gemini-2.5-flash-image';
  const prompt = `
    ROLE: Professional Commercial Photographer.
    SCENE: Clean, bright studio with high-end commercial lighting.
    STYLE: ${style}.
    PRODUCT: ${analysis.productType}, ${analysis.sellingPoints.join(', ')}.
    USER_REFINEMENT: ${userTweaks}
    MANDATE: 100% background removal and re-render. 8k, realistic shadows, product centered.
  `;

  const payload = {
    model: modelName,
    contents: { parts: [{ inlineData: { data: base64Image, mimeType: 'image/png' } }, { text: prompt }] },
    config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
  };

  const result = await callGeminiBff(payload);
  const imgData = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
  if (!imgData) throw new Error("预览图生成失败");
  return `data:image/png;base64,${imgData}`;
}

/**
 * 3. 生成全套专家级资产 (多渠道差异化)
 */
export async function generateMarketingSuite(
  base64Image: string,
  analysis: MarketAnalysis,
  style: ImageStyle,
  userTweaks: string = ""
): Promise<GeneratedImage[]> {
  const suiteConfigs = [
    {
      id: ImageCategory.DISPLAY,
      platform: "淘宝/京东主图",
      ratio: "1:1",
      desc: "高点击率主图：50mm 黄金焦段，极简高光，主体高亮。",
      prompt: "Setup: Professional 50mm lens photography, high CTR e-commerce style, center composition, soft shadows, sharp focus, studio lighting."
    },
    {
      id: ImageCategory.SOCIAL,
      platform: "小红书氛围图",
      ratio: "3:4",
      desc: "社区种草：35mm 人文焦段，自然窗光，温馨生活化场景。",
      prompt: "Setup: 35mm lens lifestyle photography, natural window lighting, beautiful bokeh, cozy atmosphere, Instagram/XHS aesthetic."
    },
    {
      id: ImageCategory.DETAIL,
      platform: "详情页细节",
      ratio: "1:1",
      desc: "细节特写：100mm 微距，展现极高清材质纹理。",
      prompt: "Setup: 100mm Macro lens, extreme close-up, f/8, ultra-sharp focus on texture and fabric, professional retouching."
    },
    {
      id: ImageCategory.WHITEBG,
      platform: "合规白底图",
      ratio: "1:1",
      desc: "平台白底：100% 纯白 (#FFFFFF)，专业柔光，符合平台规范。",
      prompt: "Setup: Pure white background #FFFFFF, soft drop shadow, no scenery, ultra-clean product cutout style."
    }
  ];

  const modelName = 'gemini-2.5-flash-image';
  
  const tasks = suiteConfigs.map(async (cfg) => {
    const finalPrompt = `
      ${cfg.prompt}
      PRODUCT: ${analysis.productType}
      STYLE: ${style}
      TWEAKS: ${userTweaks}
      MANDATE: 100% background replacement, 8k resolution, commercial grade.
    `;

    const payload = {
      model: modelName,
      contents: { parts: [{ inlineData: { data: base64Image, mimeType: 'image/png' } }, { text: finalPrompt }] },
      config: { imageConfig: { aspectRatio: cfg.ratio as any, imageSize: "1K" } }
    };

    const result = await callGeminiBff(payload);
    const imgData = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
    return {
      url: imgData ? `data:image/png;base64,${imgData}` : "",
      category: cfg.id,
      platformName: cfg.platform,
      description: cfg.desc,
      aspectRatio: cfg.ratio
    };
  });

  return Promise.all(tasks);
}

/**
 * 4. 生成 AI 模特试穿 (服饰类专供)
 */
export async function generateModelImage(
  base64Image: string,
  analysis: MarketAnalysis,
  showFace: boolean = true
): Promise<string> {
  const modelName = 'gemini-2.5-flash-image';
  const faceOption = showFace ? "Beautiful confident face" : "Crop above mouth, focus on the outfit body";
  
  const prompt = `
    ROLE: High-end Fashion Magazine Photographer.
    SUBJECT: Realistic Asian fashion model wearing this ${analysis.productType}. ${faceOption}.
    SCENE: Minimalist modern boutique or professional fashion studio.
    TEXTURE: Realistic skin texture, realistic human anatomy, professional soft lighting.
    MANDATE: 8k photorealistic, fashion catalogue style.
  `;

  const payload = {
    model: modelName,
    contents: { parts: [{ inlineData: { data: base64Image, mimeType: 'image/png' } }, { text: prompt }] },
    config: { imageConfig: { aspectRatio: "3:4", imageSize: "1K" } }
  };

  const result = await callGeminiBff(payload);
  const imgData = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
  if (!imgData) throw new Error("模特图生成失败");
  return `data:image/png;base64,${imgData}`;
}
