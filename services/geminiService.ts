
import { GoogleGenAI, Type } from "@google/genai";
import { MarketAnalysis, ImageStyle, ImageCategory, GeneratedImage } from "../types";

// Initialize the Gemini API client
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * 1. Analyze product image for metadata and marketing insights
 */
export async function analyzeProduct(base64Image: string): Promise<MarketAnalysis> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/png' } },
          { text: "Analyze this e-commerce product image and provide structured data for marketing generation." }
        ]
      }
    ],
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
            },
            required: ["title", "shortDesc", "tags"]
          },
          isApparel: { type: Type.BOOLEAN, description: "Whether the product is a wearable clothing item or accessory" }
        },
        required: ["productType", "targetAudience", "sellingPoints", "suggestedPrompt", "recommendedCategories", "marketingCopy", "isApparel"]
      }
    }
  });

  return JSON.parse(response.text) as MarketAnalysis;
}

/**
 * 2. Generate a preview image (Standard Studio Shot)
 */
export async function generatePreview(
  base64Image: string,
  style: ImageStyle,
  analysis: MarketAnalysis,
  userTweaks: string = ""
): Promise<string> {
  const ai = getAI();
  const prompt = `
    TASK: Professional e-commerce product photography reconstruction.
    STYLE: ${style}.
    PRODUCT: ${analysis.productType}, highlighting: ${analysis.sellingPoints.join(', ')}.
    MODIFIER: ${userTweaks || "Clean studio lighting, professional product placement, sharp details."}
    MANDATE: 100% background removal. Replace with high-quality ${style} background. Maintain product perspective and scale. Realistic shadows and lighting. 8k resolution.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/png' } },
        { text: prompt }
      ]
    },
    config: {
      imageConfig: { aspectRatio: "1:1" }
    }
  });

  const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (!imagePart) throw new Error("Image generation failed");
  return `data:image/png;base64,${imagePart.inlineData.data}`;
}

/**
 * 3. Generate a full marketing suite of images for different platforms
 */
export async function generateMarketingSuite(
  base64Image: string,
  analysis: MarketAnalysis,
  style: ImageStyle,
  userTweaks: string = ""
): Promise<GeneratedImage[]> {
  const ai = getAI();
  
  const suiteConfigs = [
    {
      id: ImageCategory.DISPLAY,
      platform: "Main Listing (1:1)",
      ratio: "1:1",
      prompt: "50mm lens, studio lighting, soft shadows, center composition, high-end e-commerce style."
    },
    {
      id: ImageCategory.SOCIAL,
      platform: "Social Media (3:4)",
      ratio: "3:4",
      prompt: "Lifestyle photography, 35mm lens, natural lighting, bokeh background, lifestyle props."
    },
    {
      id: ImageCategory.DETAIL,
      platform: "Detail Shot (1:1)",
      ratio: "1:1",
      prompt: "Macro photography, focus on texture and material quality, extreme close-up, dramatic side lighting."
    },
    {
      id: ImageCategory.WHITEBG,
      platform: "Pure White BG (1:1)",
      ratio: "1:1",
      prompt: "Strictly pure white background (#FFFFFF), clean isolation, soft floor shadow only."
    }
  ];

  const tasks = suiteConfigs.map(async (cfg) => {
    const finalPrompt = `
      PLATFORM: ${cfg.platform}.
      SETUP: ${cfg.prompt}
      STYLE: ${style}.
      PRODUCT: ${analysis.productType}.
      TWEAKS: ${userTweaks}
      RECONSTRUCTION: High-fidelity product preservation, 100% environment swap.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/png' } },
          { text: finalPrompt }
        ]
      },
      config: {
        imageConfig: { aspectRatio: cfg.ratio as any }
      }
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return {
      url: imagePart ? `data:image/png;base64,${imagePart.inlineData.data}` : "",
      category: cfg.id,
      platformName: cfg.platform,
      description: cfg.prompt,
      aspectRatio: cfg.ratio
    };
  });

  return Promise.all(tasks);
}

/**
 * 4. AI Virtual Model Try-on
 */
export async function generateModelImage(
  base64Image: string,
  analysis: MarketAnalysis,
  showFace: boolean = true
): Promise<string> {
  const ai = getAI();
  const faceOption = showFace ? "Clear visible professional model face" : "Crop at chin or upper face, focus on body fit";
  
  const prompt = `
    FASHION CATALOGUE: Realistic human model wearing this exact ${analysis.productType}. 
    MODEL: Professional posing, realistic skin texture, high-end look. ${faceOption}.
    SCENE: Minimalist high-fashion studio.
    LIGHTING: Softbox lighting, editorial style.
    REPLACEMENT: Integrate the product seamlessly onto the model's body with correct physics and draping.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/png' } },
        { text: prompt }
      ]
    },
    config: {
      imageConfig: { aspectRatio: "3:4" }
    }
  });

  const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (!imagePart) throw new Error("Model image generation failed");
  return `data:image/png;base64,${imagePart.inlineData.data}`;
}
