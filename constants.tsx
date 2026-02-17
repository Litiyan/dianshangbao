
import { ImageCategory, ImageStyle } from './types';

export const CATEGORY_CONFIGS = [
  { id: ImageCategory.DISPLAY, name: '猫狗主图 (白/灰)', icon: '🛍️', desc: '符合淘宝京东合规要求，高光突出产品' },
  { id: ImageCategory.SOCIAL, name: '小红书种草氛围', icon: '✨', desc: '奶油风/生活化场景，高点击率保证' },
  { id: ImageCategory.POSTER, name: '品牌海报构图', icon: '🖼️', desc: '预留文案空间，极简美学设计' },
  { id: ImageCategory.MODEL, name: '手持/佩戴展示', icon: '🙌', desc: '真实人体交互，增加产品信任感' },
  { id: ImageCategory.DETAIL, name: '详情页微距', icon: '🔍', desc: '爆破式细节展示，突出材质做工' },
  { id: ImageCategory.LIFESTYLE, name: '现代实境场景', icon: '🏠', desc: '将产品自然融入高品质家居/户外环境' },
  { id: ImageCategory.GIFT, name: '节日礼赠视觉', icon: '🎁', desc: '针对大促/礼盒场景的精致氛围' },
  { id: ImageCategory.WHITEBG, name: '平台纯白底照', icon: '⬜', desc: '100% 纯白背景，系统自动抠图重绘' },
];

export const STYLE_CONFIGS = [
  { id: ImageStyle.LUXURY, name: '奢华香槟', icon: '🥂' },
  { id: ImageStyle.STUDIO, name: '专业棚拍', icon: '📸' },
  { id: ImageStyle.INS, name: '清冷质感', icon: '☁️' },
  { id: ImageStyle.MINIMALIST, name: '极致简约', icon: '🌿' },
  { id: ImageStyle.COZY, name: '柔和暖阳', icon: '☀️' },
  { id: ImageStyle.RETRO, name: '摩登复古', icon: '🎞️' },
];

export const RATIO_OPTIONS = [
  { id: '1:1', name: '淘宝/京东主图' },
  { id: '3:4', name: '小红书/详情页' },
  { id: '9:16', name: '短视频/直播间' },
  { id: '16:9', name: 'PC端通栏图' }
];

export const FINE_TUNE_TAGS = [
  { id: 'water', name: '水感莹润', prompt: 'Subsurface scattering, wet gloss, professional product lighting' },
  { id: 'sun', name: '丁达尔光', prompt: 'Cinematic god rays, volumetric lighting beams' },
  { id: 'shadow', name: '悬浮倒影', prompt: 'Product hovering with soft contact shadows and floor reflections' },
  { id: 'metal', name: '镜面增强', prompt: 'High-contrast metallic reflections, studio specular highlights' },
  { id: 'blur', name: '景深虚化', prompt: 'F/1.8 aperture bokeh, creamy background separation' },
  { id: 'soft', name: '柔光修饰', prompt: 'Softbox diffusion, elegant professional product retouching feel' }
];

export const LIGHTING_DIRECTIONS = [
  { id: 'rim', name: '高亮轮廓', prompt: 'Hard rim lighting to separate product from background' },
  { id: 'top', name: '垂直顶光', prompt: 'Professional top-down spotlighting' },
  { id: 'side', name: '立体侧光', prompt: 'Dramatic side lighting for texture depth' },
  { id: 'ambient', name: '自然柔光', prompt: 'Evenly distributed soft ambient studio light' }
];
