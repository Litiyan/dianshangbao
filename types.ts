
export enum PlatformType {
  TAOBAO = 'Taobao',
  JD = 'JD.com',
  AMAZON = 'Amazon',
  XHS = '小红书'
}

export enum ImageStyle {
  MINIMALIST = '简约北欧',
  CYBERPUNK = '赛博朋克',
  STUDIO = '专业摄影棚',
  COZY = '温馨居家',
  OUTDOOR = '户外自然',
  LUXURY = '奢华质感',
  INS = '网红奶油风',
  RETRO = '港风复古'
}

export enum ImageCategory {
  DISPLAY = 'DISPLAY',    // 标准展示
  POSTER = 'POSTER',      // 营销海报
  MODEL = 'MODEL',        // 虚拟模特
  DETAIL = 'DETAIL',      // 细节特写
  SOCIAL = 'SOCIAL',      // 社交种草
  WHITEBG = 'WHITEBG',    // 白底证件
  GIFT = 'GIFT',          // 礼赠场景
  LIFESTYLE = 'LIFESTYLE' // 环境融入
}

export interface MarketingCopy {
  title: string;
  shortDesc: string;
  tags: string[];
}

export interface MarketAnalysis {
  productType: string;
  targetAudience: string;
  sellingPoints: string[];
  suggestedPrompt: string;
  recommendedCategories: ImageCategory[];
  marketingCopy: MarketingCopy;
  isApparel: boolean; // 是否为服饰类（触发 AI 模特入口）
}

export interface GeneratedImage {
  url: string;
  category: ImageCategory;
  platformName: string;
  description: string;
  aspectRatio: string;
}

export interface GeneratedSuite {
  preview: string;
  items: GeneratedImage[];
  modelImage?: string;
}

