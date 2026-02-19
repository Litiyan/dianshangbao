
import { ScenarioType } from './types';

export const SCENARIO_CONFIGS = [
  { 
    id: ScenarioType.CROSS_BORDER_LOCAL, 
    name: '跨境“本土化”', 
    icon: '🌍', 
    desc: '适应 Amazon/Shopee 等海外审美，自动匹配当地环境',
    ratio: '1:1'
  },
  { 
    id: ScenarioType.TEXT_EDIT_TRANSLATE, 
    name: '文字翻译擦除', 
    icon: '✂️', 
    desc: '自动消除原图文字并替换为美化后的多语种文案',
    ratio: '1:1'
  },
  { 
    id: ScenarioType.MODEL_REPLACEMENT, 
    name: '多国籍模特替换', 
    icon: '👥', 
    desc: '一键更换模特肤色与国籍，解决跨境真人出镜痛点',
    ratio: '3:4'
  },
  { 
    id: ScenarioType.MOMENTS_POSTER, 
    name: '朋友圈营销海报', 
    icon: '📱', 
    desc: '9:16 竖屏、“牛皮癣”式高冲击力主图生成',
    ratio: '9:16'
  },
  { 
    id: ScenarioType.PLATFORM_MAIN_DETAIL, 
    name: '淘京主图/详情', 
    icon: '🛍️', 
    desc: '淘宝京东标准主图或详情页卖点图，高转化排版',
    ratio: '1:1'
  },
  { 
    id: ScenarioType.BUYER_SHOW, 
    name: '买家秀/晒单生成', 
    icon: '📸', 
    desc: '模拟生活化实拍场景，增加用户信任度',
    ratio: '3:4'
  },
  { 
    id: ScenarioType.LIVE_OVERLAY, 
    name: '直播贴片/遮罩', 
    icon: '🎥', 
    desc: '生成带透明质感的直播间互动层或品牌贴片',
    ratio: '16:9'
  },
  { 
    id: ScenarioType.LIVE_GREEN_SCREEN, 
    name: '绿幕直播背景', 
    icon: '🖼️', 
    desc: '虚拟直播间高清背景，支持实时绿幕抠图合成',
    ratio: '16:9'
  }
];

export const MODEL_NATIONALITY = [
  { id: 'asian', name: '亚洲', prompt: 'Asian model' },
  { id: 'caucasian', name: '欧美', prompt: 'Caucasian Western model' },
  { id: 'latino', name: '拉丁', prompt: 'Latino model' },
  { id: 'african', name: '非洲', prompt: 'African model' }
];
