
export enum ScenarioType {
  CROSS_BORDER = 'CROSS_BORDER',    // 跨境本土化
  SOCIAL_POSTER = 'SOCIAL_POSTER',  // 朋友圈营销海报 (9:16)
  MARKET_MAIN = 'MARKET_MAIN',      // 淘宝/京东主图 (1:1)
  BUYER_SHOW = 'BUYER_SHOW',        // 买家秀/晒单图
  MODEL_DIVERSITY = 'MODEL_DIVERSITY', // 多肤色/国籍模特
  LIVE_ASSETS = 'LIVE_ASSETS',      // 直播间贴片/遮罩层
  GREEN_SCREEN = 'GREEN_SCREEN',    // 绿幕直播背景
  DETAIL_PAGE = 'DETAIL_PAGE'       // 详情页卖点图
}

export interface TextConfig {
  title: string;
  detail: string;
}

export interface MarketAnalysis {
  productType: string;
  targetAudience: string;
  sellingPoints: string[];
  suggestedPrompt: string;
  isApparel: boolean;
}

export interface GeneratedImage {
  url: string;
  scenario: ScenarioType;
  platformName: string;
  description: string;
  aspectRatio: '1:1' | '3:4' | '9:16' | '16:9';
}
