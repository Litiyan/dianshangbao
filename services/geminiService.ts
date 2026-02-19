
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
  必须判断 isApparel (如果产品是衣服、裤子、鞋、包、配饰，则为 true)。
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
    SCENE: High-end studio background.
    STYLE: ${style}.
    PRODUCT: ${analysis.productType}, ${analysis.sellingPoints.join(', ')}.
    USER_REFINEMENT: ${userTweaks}
    MANDATE: 100% background removal and environment re-rendering. 8k resolution, cinematic lighting.
  `;

  const payload = {
    model: modelName,
    contents: { parts: [{ inlineData: { data: base64Image, mimeType: 'image/png' } }, { text: prompt }] },
    config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
  };

  const result = await callGeminiBff(payload);
  const imgData = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
  if (!imgData) throw new Error("预览生成失败");
  return `data:image/png;base64,${imgData}`;
}

/**
 * 3. 生成全套专家级图像 (针对不同平台参数特化)
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
      platform: "淘宝/京东",
      ratio: "1:1",
      desc: "高点击率主图：50mm 黄金焦段，极简背景，主体高亮。",
      prompt: "Persona: Professional 4A Ad Photographer. Setup: Studio lighting, 50mm lens, center composition, high CTR, clean soft shadows, sharp focus on product."
    },
    {
      id: ImageCategory.SOCIAL,
      platform: "小红书",
      ratio: "3:4",
      desc: "生活种草氛围：35mm 人文焦段，自然窗光，生活化场景。",
      prompt: "Persona: Lifestyle Blogger Photographer. Setup: Natural window lighting, 35mm lens, depth of field bokeh, warm cozy vibe, product placed in a realistic modern interior."
    },
    {
      id: ImageCategory.DETAIL,
      platform: "详情页",
      ratio: "1:1",
      desc: "细节特写：100mm 微距，展现极高清材质纹理。",
      prompt: "Persona: Product Texture Expert. Setup: Macro lens 100mm, f/8, extreme close-up, sharpest focus on materials and craftsmanship, professional retouching."
    },
    {
      id: ImageCategory.WHITEBG,
      platform: "平台白底",
      ratio: "1:1",
      desc: "官方合规白底：100% 纯白背景，符合所有平台规范。",
      prompt: "Setup: Pure white background #FFFFFF, no scenery, soft drop shadow only, ultra-clean product photography, standard e-commerce cutout."
    }
  ];

  const modelName = 'gemini-2.5-flash-image';
  
  const tasks = suiteConfigs.map(async (cfg) => {
    const finalPrompt = `
      ${cfg.prompt}
      PRODUCT_TYPE: ${analysis.productType}
      VISUAL_STYLE: ${style}
      USER_REFINEMENT: ${userTweaks}
      QUALITY: 8k resolution, Masterpiece, commercial photography.
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
 * 4. 生成 AI 模特试穿 (服饰类特化)
 */
export async function generateModelImage(
  base64Image: string,
  analysis: MarketAnalysis,
  showFace: boolean = true
): Promise<string> {
  const modelName = 'gemini-2.5-flash-image';
  const persona = `You are a high-end fashion magazine photographer.`;
  const subject = `Realistic Asian model wearing the ${analysis.productType}. ${showFace ? 'Beautiful confident face' : 'Crop above the nose, focus on outfit'}.`;
  
  const prompt = `
    ${persona}
    SUBJECT: ${subject}
    SCENE: Minimalist modern fashion studio.
    TEXTURE: Realistic skin texture, realistic human anatomy, professional fashion lighting.
    MANDATE: Photorealistic, 8k, haute couture magazine style.
  `;

  const payload = {
    model: modelName,
    contents: { parts: [{ inlineData: { data: base64Image, mimeType: 'image/png' } }, { text: prompt }] },
    config: { imageConfig: { aspectRatio: "3:4", imageSize: "1K" } }
  };

  const result = await callGeminiBff(payload);
  const imgData = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
  if (!imgData) throw new Error("模特试穿生成失败");
  return `data:image/png;base64,${imgData}`;
}
