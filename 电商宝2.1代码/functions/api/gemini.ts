
import { GoogleGenAI } from "@google/genai";

/**
 * Cloudflare Pages Function: Gemini API BFF Proxy
 * 核心安全逻辑：API 密钥仅在服务端读取，绝不暴露给客户端。
 */
export async function onRequestPost(context: { env: { API_KEY: string }; request: Request }) {
  const { request } = context;

  try {
    const payload = await request.json();
    const { model, contents, config } = payload;

    // Follow SDK guidelines: Always use process.env.API_KEY for initialization.
    // Assume this variable is pre-configured and accessible in the execution context.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: model || 'gemini-3-flash-preview',
      contents,
      config: config || {}
    });

    // Return the response text using the .text getter
    return new Response(JSON.stringify({
      text: response.text,
      candidates: response.candidates
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("[Gemini BFF Error]:", error);
    return new Response(JSON.stringify({ 
      error: "AI_ERROR", 
      message: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
