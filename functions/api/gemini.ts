
import { GoogleGenAI } from "@google/genai";

/**
 * Cloudflare Pages Function: Gemini API BFF Proxy
 * 处理来自前端的 AI 请求，并在服务器端安全调用 Google API。
 */
export async function onRequestPost(context: { env: { API_KEY: string }; request: Request }) {
  const { env, request } = context;
  
  // 1. 获取环境变量中的 API KEY
  // 遵循指南：API key 必须且仅能从环境获取
  const apiKey = env.API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ 
      error: "API_KEY_MISSING", 
      message: "Cloudflare 环境中未配置 API_KEY。请在 Pages 控制台设置环境变量。" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 2. 为 SDK 注入 process.env 兼容层
  (globalThis as any).process = (globalThis as any).process || {};
  (globalThis as any).process.env = (globalThis as any).process.env || {};
  (globalThis as any).process.env.API_KEY = apiKey;

  try {
    const payload = await request.json();
    const { model, contents, config } = payload;

    // 3. 使用 Google GenAI SDK 进行初始化
    // 遵循指南：必须使用 new GoogleGenAI({ apiKey: process.env.API_KEY })
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // 4. 执行生成内容请求
    const response = await ai.models.generateContent({
      model: model || 'gemini-3-flash-preview',
      contents,
      config: config || {}
    });

    // 5. 使用 .text 属性提取结果并返回
    // 遵循指南：使用 response.text 而不是 .text()
    return new Response(JSON.stringify({
      text: response.text,
      candidates: response.candidates
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("[BFF Error]:", error);
    return new Response(JSON.stringify({ 
      error: "AI_INFERENCE_FAILED", 
      message: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
