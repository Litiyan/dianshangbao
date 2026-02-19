
export enum ScenarioType {
  CROSS_BORDER_LOCAL = 'CROSS_BORDER_LOCAL',     // 跨境电商“本土化”需求
  TEXT_EDIT_TRANSLATE = 'TEXT_EDIT_TRANSLATE',   // 图片文字自动翻译与擦除
  MODEL_REPLACEMENT = 'MODEL_REPLACEMENT',       // 多肤色/多国籍模特替换
  MOMENTS_POSTER = 'MOMENTS_POSTER',             // 朋友圈营销海报 (9:16)
  PLATFORM_MAIN_DETAIL = 'PLATFORM_MAIN_DETAIL', // 淘宝京东主图/详情图
  BUYER_SHOW = 'BUYER_SHOW',                     // 买家秀/晒单图生成
  LIVE_OVERLAY = 'LIVE_OVERLAY',                 // 直播间贴片/遮罩层
  LIVE_GREEN_SCREEN = 'LIVE_GREEN_SCREEN'        // 绿幕直播背景图
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
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
}
