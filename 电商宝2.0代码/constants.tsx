
import { ScenarioType } from './types';

export const SCENARIO_CONFIGS = [
  { 
    id: ScenarioType.CROSS_BORDER, 
    name: '跨境本土化', 
    icon: '🌍', 
    desc: 'Amazon/Shopee 风格，自动翻译并匹配当地审美',
    ratio: '1:1'
  },
  { 
    id: ScenarioType.SOCIAL_POSTER, 
    name: '朋友圈海报', 
    icon: '📱', 
    desc: '9:16 竖屏，高冲击力营销文字叠加',
    ratio: '9:16'
  },
  { 
    id: ScenarioType.MARKET_MAIN, 
    name: '淘系主图', 
    icon: '🛍️', 
    desc: '1:1 比例，黄金卖点排版，高点击率',
    ratio: '1:1'
  },
  { 
    id: ScenarioType.BUYER_SHOW, 
    name: '真实买家秀', 
    icon: '📸', 
    desc: '模拟生活场景手机实拍，无后期修饰感',
    ratio: '3:4'
  },
  { 
    id: ScenarioType.MODEL_DIVERSITY, 
    name: '多国籍模特', 
    icon: '👥', 
    desc: '欧美/亚/非肤色切换，适合跨境服装',
    ratio: '3:4'
  },
  { 
    id: ScenarioType.LIVE_ASSETS, 
    name: '直播贴片', 
    icon: '🎥', 
    desc: '带遮罩层效果，预留直播人像位置',
    ratio: '16:9'
  },
  { 
    id: ScenarioType.GREEN_SCREEN, 
    name: '直播背景图', 
    icon: '🖼️', 
    desc: '高端直播间虚化背景，支持绿幕抠图',
    ratio: '16:9'
  },
  { 
    id: ScenarioType.DETAIL_PAGE, 
    name: '详情卖点图', 
    icon: '📜', 
    desc: '大面积材质特写 + 详细参数文字',
    ratio: '3:4'
  }
];

export const MODEL_NATIONALITY = [
  { id: 'asian', name: '亚洲', prompt: 'Asian model' },
  { id: 'caucasian', name: '欧美', prompt: 'Caucasian Western model' },
  { id: 'latino', name: '拉丁', prompt: 'Latino model' },
  { id: 'african', name: '非洲', prompt: 'African model' }
];
