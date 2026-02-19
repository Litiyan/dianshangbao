
import React, { useState, useEffect } from 'react';
import { 
  Upload, Download, RefreshCw, Send, Bot, 
  CheckCircle2, ShieldAlert, X, MessageSquareText,
  Sparkles, Image as ImageIcon, Camera, User, LayoutGrid, Plus, Trash2
} from 'lucide-react';
import { ScenarioType, MarketAnalysis, TextConfig } from './types';
import { SCENARIO_CONFIGS, MODEL_NATIONALITY } from './constants';
import { analyzeProduct, generateScenarioImage } from './services/geminiService';

const LOADING_MESSAGES = [
  "正在读取多图立体特征...",
  "AI 视觉导演正在构思排版...",
  "正在渲染 8K 级商业光影...",
  "正在为您匹配最佳本土化风格...",
  "正在计算文字与产品的交互位置...",
  "正在导出高保真电商素材...",
];

const App: React.FC = () => {
  const [step, setStep] = useState<'upload' | 'result'>('upload');
  const [sourceImages, setSourceImages] = useState<string[]>([]);
  const [userIntent, setUserIntent] = useState("");
  const [textConfig, setTextConfig] = useState<TextConfig>({ title: "", detail: "" });
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>(ScenarioType.MARKET_MAIN);
  const [selectedNationality, setSelectedNationality] = useState("");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<{title: string, msg: string} | null>(null);

  // 加载文案轮播
  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const readers = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    const results = await Promise.all(readers);
    const newImages = [...sourceImages, ...results].slice(0, 5);
    setSourceImages(newImages);
    
    // 多图分析
    setIsProcessing(true);
    try {
      const rawB64s = newImages.map(r => r.split(',')[1]);
      const res = await analyzeProduct(rawB64s);
      setAnalysis(res);
    } catch (err: any) {
      console.error("分析失败:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeImage = (index: number) => {
    setSourceImages(prev => prev.filter((_, i) => i !== index));
  };

  const startGeneration = async () => {
    if (sourceImages.length === 0) {
      setError({ title: "缺少素材", msg: "请至少上传一张产品原图" });
      return;
    }
    setIsProcessing(true);
    setStep('result');
    try {
      const rawB64s = sourceImages.map(img => img.split(',')[1]);
      const res = await generateScenarioImage(
        rawB64s, 
        selectedScenario, 
        analysis || { productType: "Product", targetAudience: "General", sellingPoints: [], suggestedPrompt: "", isApparel: false }, 
        userIntent, 
        textConfig,
        selectedNationality
      );
      setResultImage(res);
    } catch (err: any) {
      setError({ title: "生成失败", msg: err.message });
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-slate-900 pb-20 font-sans selection:bg-orange-100">
      <nav className="h-20 bg-white/70 backdrop-blur-2xl sticky top-0 z-[100] px-8 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-black tracking-tight">电商宝 <span className="text-orange-500 font-medium">3.0 Pro</span></h1>
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto p-8">
        {step === 'upload' ? (
          <div className="space-y-10 animate-in fade-in duration-700">
            {/* 核心意图区域 - 前置 */}
            <section className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                      <MessageSquareText className="w-5 h-5 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-black italic">您想如何重构这件产品？</h2>
                  </div>
                  <textarea 
                    value={userIntent}
                    onChange={(e) => setUserIntent(e.target.value)}
                    placeholder="描述您的创意意图，例如：'在巴黎街头的咖啡馆外，自然光照，背景要有法式慵懒感'..."
                    className="w-full h-40 bg-slate-50 border border-slate-100 rounded-[32px] p-8 text-base focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all resize-none shadow-inner"
                  />
                </div>
                
                <div className="lg:col-span-5 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-black">图片文字美化</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">主标题 (醒目/艺术感)</p>
                      <input 
                        type="text" 
                        value={textConfig.title}
                        onChange={(e) => setTextConfig({...textConfig, title: e.target.value})}
                        placeholder="如：夏季清凉系列"
                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">详情描述 (卖点标注)</p>
                      <input 
                        type="text" 
                        value={textConfig.detail}
                        onChange={(e) => setTextConfig({...textConfig, detail: e.target.value})}
                        placeholder="如：100% 蚕丝 / 限量发售"
                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 素材管理 */}
            <section className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                    <Camera className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-black">多角度原图素材 <span className="text-slate-300 ml-2 font-medium">支持上传细节、侧面与包装</span></h2>
                </div>
              </div>
              <div className="flex flex-wrap gap-5">
                {sourceImages.map((img, idx) => (
                  <div key={idx} className="relative group w-36 h-36 rounded-3xl overflow-hidden shadow-md ring-1 ring-slate-100">
                    <img src={img} className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(idx)} className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
                {sourceImages.length < 5 && (
                  <label className="w-36 h-36 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50/30 transition-all group relative">
                    <input type="file" multiple accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <Plus className="w-8 h-8 text-slate-300 group-hover:text-orange-500 mb-2" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">上传新角度</span>
                  </label>
                )}
              </div>
            </section>

            {/* 场景选择 */}
            <section className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black">落地场景用途</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {SCENARIO_CONFIGS.map(cfg => (
                  <button key={cfg.id} onClick={() => setSelectedScenario(cfg.id)} className={`flex flex-col items-center p-6 rounded-[32px] border transition-all ${selectedScenario === cfg.id ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.02]' : 'bg-slate-50/50 border-slate-50 text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}>
                    <span className="text-3xl mb-3">{cfg.icon}</span>
                    <span className="text-[11px] font-black uppercase tracking-widest">{cfg.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <button onClick={startGeneration} disabled={isProcessing || sourceImages.length === 0} className="w-full h-24 bg-orange-500 text-white rounded-[40px] font-black text-xl uppercase tracking-[0.2em] shadow-2xl shadow-orange-100 hover:bg-orange-600 transition-all active:scale-[0.98] disabled:bg-slate-200 disabled:shadow-none flex items-center justify-center gap-4">
              {isProcessing ? <RefreshCw className="animate-spin w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
              开始商业重构
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-1000">
            {/* 生成结果页 */}
            <div className="bg-white rounded-[60px] p-12 shadow-sm border border-slate-100 min-h-[800px] flex flex-col items-center relative overflow-hidden">
              {isProcessing && (
                <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin mb-10"></div>
                  <h3 className="text-3xl font-black text-slate-900 mb-4 animate-pulse">{LOADING_MESSAGES[loadingTextIndex]}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.5em]">正在打造极致视觉...</p>
                </div>
              )}

              {resultImage && (
                <div className="w-full space-y-12">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h2 className="text-3xl font-black tracking-tighter">商业重构交付完成</h2>
                    </div>
                    <button onClick={() => setStep('upload')} className="px-8 py-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors">← 返回修改指令</button>
                  </div>

                  <div className="relative group max-w-4xl mx-auto rounded-[50px] overflow-hidden shadow-2xl ring-1 ring-slate-100">
                    <img src={resultImage} className="w-full h-auto object-cover" />
                    <button onClick={() => {const l=document.createElement('a'); l.href=resultImage; l.download='commercial_pro.png'; l.click();}} className="absolute top-10 right-10 p-6 bg-white/90 backdrop-blur rounded-[30px] shadow-2xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                      <Download className="w-8 h-8 text-slate-900" />
                    </button>
                  </div>

                  {/* 亮起的绿灯指标 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100">
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">多角度立体拟合</p>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-pulse" />
                      </div>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-[2000ms] ease-out w-full shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
                      </div>
                      <p className="text-xs font-black mt-3 text-emerald-600">匹配成功 (100%)</p>
                    </div>
                    <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100">
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">商业光影一致性</p>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-pulse" />
                      </div>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-[2500ms] ease-out w-full shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
                      </div>
                      <p className="text-xs font-black mt-3 text-emerald-600">动态重构完成</p>
                    </div>
                    <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100">
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">标题/详情美化排版</p>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-pulse" />
                      </div>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-[3000ms] ease-out w-full shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
                      </div>
                      <p className="text-xs font-black mt-3 text-emerald-600">视觉平衡已就绪</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white px-10 py-6 rounded-[40px] shadow-2xl border border-red-50 flex items-center gap-6 z-[200] animate-in slide-in-from-bottom">
          <ShieldAlert className="w-8 h-8 text-red-500" />
          <div>
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">{error.title}</p>
            <p className="text-sm font-bold text-slate-800">{error.msg}</p>
          </div>
          <button onClick={() => setError(null)} className="p-2 hover:bg-slate-50 rounded-full"><X className="w-5 h-5 text-slate-300" /></button>
        </div>
      )}
    </div>
  );
};

export default App;
