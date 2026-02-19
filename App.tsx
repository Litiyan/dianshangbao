

import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Download, RefreshCw, Hand, 
  Zap, Crown, Settings2, Send, Bot, 
  Layers, Sun, Maximize2, CheckCircle2,
  ShieldAlert, X, MessageSquareText
} from 'lucide-react';
import { ImageStyle, MarketAnalysis, ImageCategory } from './types';
import { CATEGORY_CONFIGS, STYLE_CONFIGS, RATIO_OPTIONS, FINE_TUNE_TAGS, LIGHTING_DIRECTIONS } from './constants';
import { analyzeProduct, generateProductDisplay } from './services/geminiService';

const App: React.FC = () => {
  // 核心逻辑：移除 hasKey 的阻塞状态，默认直接进入应用。
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  
  // 场景配置
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>(ImageStyle.STUDIO);
  const [selectedCategory, setSelectedCategory] = useState<ImageCategory>(ImageCategory.SOCIAL);
  const [selectedRatio, setSelectedRatio] = useState<string>('1:1');
  const [selectedFineTunes, setSelectedFineTunes] = useState<string[]>([]);
  const [selectedLighting, setSelectedLighting] = useState<string>('ambient');
  const [isUltraHD, setIsUltraHD] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState<{title: string, msg: string} | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'stable' | 'testing'>('testing');

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        await fetch('https://generativelanguage.googleapis.com/v1/models', { mode: 'no-cors' });
        setNetworkStatus('stable');
      } catch (e) {
        setNetworkStatus('testing');
      }
    };
    checkNetwork();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleAnalyze = async () => {
    if (!sourceImage) return;
    setIsProcessing(true);
    setError(null);
    try {
      const base64 = sourceImage.split(',')[1];
      const result = await analyzeProduct(base64);
      setAnalysis(result);
      if (result.recommendedCategories?.length) {
        setSelectedCategory(result.recommendedCategories[0]);
      }
      setStep(2);
    } catch (err: any) {
      setError({ title: "分析失败", msg: err.message || "无法识别商品特征，请更换图片重试。" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerate = async (refinementText?: string) => {
    if (!sourceImage || !analysis) return;
    setIsProcessing(true);
    setError(null);
    
    const updatedHistory = refinementText 
      ? [...chatMessages, { role: 'user' as const, text: refinementText }]
      : chatMessages;
    
    if (refinementText) setChatMessages(updatedHistory);

    try {
      const base64 = sourceImage.split(',')[1];
      const selectedFineTunePrompts = FINE_TUNE_TAGS
        .filter(t => selectedFineTunes.includes(t.id))
        .map(t => t.prompt);
      
      const lightingPrompt = LIGHTING_DIRECTIONS.find(l => l.id === selectedLighting)?.prompt || '';

      const result = await generateProductDisplay(
        base64, selectedStyle, selectedCategory, selectedRatio, 
        analysis, [...selectedFineTunePrompts, lightingPrompt], 
        isUltraHD, updatedHistory
      );
      
      setGeneratedResult(result);
      if (refinementText) {
        setChatMessages(prev => [...prev, { role: 'assistant', text: "暖心小手套已根据您的要求微调了视觉空间。" }]);
      }
      setStep(3);
    } catch (err: any) {
      setError({ title: "生成异常", msg: err.message || "背景重构失败，请检查网络或刷新页面。" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* 极简导航 */}
      <nav className="h-20 bg-white/80 backdrop-blur-xl sticky top-0 z-50 px-8 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg rotate-12">
            <Hand className="text-white w-5 h-5 fill-white" />
          </div>
          <h1 className="text-lg font-black tracking-tight">电商宝 <span className="text-orange-500 font-medium">Workstation</span></h1>
        </div>

        <div className="hidden lg:flex items-center gap-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                step >= s ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'
              }`}>
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${step >= s ? 'text-slate-900' : 'text-slate-300'}`}>
                {s === 1 ? '上传' : s === 2 ? '配置' : '成品'}
              </p>
              {s < 3 && <div className={`w-8 h-0.5 rounded-full ${step > s ? 'bg-orange-500' : 'bg-slate-100'}`} />}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${
            networkStatus === 'stable' ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-amber-100 bg-amber-50 text-amber-600'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${networkStatus === 'stable' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
            {networkStatus === 'stable' ? '链路通畅' : '建立连接中'}
          </div>
          <button className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" /> 专业版
          </button>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto p-8 grid grid-cols-12 gap-8">
        {/* 控制侧栏 */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          {/* 上传卡片 */}
          <div className={`bg-white rounded-[32px] p-6 shadow-sm border transition-all ${step === 1 ? 'border-orange-500 ring-4 ring-orange-50' : 'border-slate-100'}`}>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Upload className="w-4 h-4" /> 01 / 产品图片
            </h2>
            <div className="aspect-video rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 relative overflow-hidden group cursor-pointer hover:border-orange-400 transition-all">
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => { setSourceImage(reader.result as string); setStep(1); setAnalysis(null); setGeneratedResult(null); };
                  reader.readAsDataURL(file);
                }
              }} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
              {sourceImage ? (
                <img src={sourceImage} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <Upload className="w-8 h-8 text-orange-500 mb-3" />
                  <p className="text-xs font-black text-slate-900">导入产品原图</p>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest font-bold">PNG / JPG</p>
                </div>
              )}
            </div>
            {sourceImage && step === 1 && (
              <button onClick={handleAnalyze} disabled={isProcessing} className="w-full mt-6 bg-orange-500 text-white h-14 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 shadow-xl shadow-orange-100 transition-all flex items-center justify-center gap-3">
                {isProcessing ? <RefreshCw className="animate-spin w-5 h-5" /> : '智能分析定调'}
              </button>
            )}
          </div>

          {/* 配置卡片 */}
          {analysis && (
            <div className={`bg-white rounded-[32px] p-6 shadow-sm border transition-all ${step === 2 ? 'border-orange-500 ring-4 ring-orange-50' : 'border-slate-100'} space-y-8 animate-in slide-in-from-bottom`}>
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> 02 / 视觉配置
              </h2>

              <section>
                <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-3">输出比例</p>
                <div className="grid grid-cols-4 gap-2">
                  {RATIO_OPTIONS.map(r => (
                    <button key={r.id} onClick={() => setSelectedRatio(r.id)} className={`py-2 rounded-lg text-[9px] font-black border transition-all ${selectedRatio === r.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'}`}>
                      {r.id}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-3">场景风格</p>
                <div className="grid grid-cols-2 gap-2">
                  {STYLE_CONFIGS.map(style => (
                    <button key={style.id} onClick={() => setSelectedStyle(style.id)} className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${selectedStyle === style.id ? 'border-orange-500 bg-orange-50 text-orange-900' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
                      <span className="text-base">{style.icon}</span>
                      <span className="text-[10px] font-bold">{style.name}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-3">核心卖点点亮</p>
                <div className="flex flex-wrap gap-2">
                  {FINE_TUNE_TAGS.map(tag => (
                    <button key={tag.id} onClick={() => setSelectedFineTunes(p => p.includes(tag.id) ? p.filter(i => i !== tag.id) : [...p, tag.id])} className={`px-3 py-1.5 rounded-full text-[9px] font-bold border transition-all ${selectedFineTunes.includes(tag.id) ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>
                      {tag.name}
                    </button>
                  ))}
                </div>
              </section>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-10 h-5 rounded-full relative transition-all ${isUltraHD ? 'bg-orange-500' : 'bg-slate-200'}`}>
                    <input type="checkbox" className="sr-only" checked={isUltraHD} onChange={e => setIsUltraHD(e.target.checked)} />
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isUltraHD ? 'left-6' : 'left-1'}`} />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">4K 超清重构</span>
                </label>
                <button onClick={() => handleGenerate()} disabled={isProcessing} className="px-8 h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-3">
                  {isProcessing ? <RefreshCw className="animate-spin w-4 h-4" /> : <Zap className="w-4 h-4 fill-current" />}
                  执行重构
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* 展示主区 */}
        <main className="col-span-12 lg:col-span-8">
          <div className={`relative min-h-[750px] bg-white rounded-[40px] shadow-sm border border-slate-200 flex overflow-hidden ${step === 3 ? 'flex-col' : 'items-center justify-center'}`}>
            <div className={`relative flex items-center justify-center transition-all duration-700 p-8 ${step === 3 ? 'h-2/3 bg-slate-50/50 border-b border-slate-100' : 'h-full w-full'}`}>
              {isProcessing && (
                <div className="absolute inset-0 z-40 bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in">
                  <div className="relative mb-6">
                    <RefreshCw className="w-16 h-16 text-orange-500 animate-spin" />
                    <Hand className="absolute inset-0 m-auto w-6 h-6 text-orange-200 fill-orange-50 animate-pulse" />
                  </div>
                  <p className="text-xl font-black tracking-tight">暖心小手套正在渲染...</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-3">深度神经网络光影重构中</p>
                </div>
              )}

              {generatedResult ? (
                <div className="relative group w-full h-full flex items-center justify-center animate-in zoom-in-95">
                  <img src={generatedResult} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
                  <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                    <button className="p-4 bg-white/90 backdrop-blur rounded-2xl shadow-xl hover:scale-105 transition-transform">
                      <Download className="w-6 h-6 text-slate-900" />
                    </button>
                  </div>
                </div>
              ) : !isProcessing && (
                <div className="text-center max-w-sm">
                  <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-10 border border-slate-100 shadow-inner rotate-6">
                    <Hand className="w-10 h-10 text-slate-200 fill-slate-50" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">等待视觉执行</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-loose">
                    导入产品原图并配置参数，点击“执行重构”开启 AI 视觉创作。
                  </p>
                </div>
              )}
            </div>

            {step === 3 && (
              <div className="h-1/3 bg-white flex flex-col animate-in slide-in-from-bottom">
                <div className="px-8 py-4 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bot className="w-5 h-5 text-orange-500" />
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">AI 导演微调建议</p>
                  </div>
                  <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">● 实时交互</p>
                </div>
                
                <div className="flex-1 overflow-y-auto px-8 py-4 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                        <MessageSquareText className="w-4 h-4" />
                      </div>
                      <div className="bg-orange-50 p-4 rounded-2xl text-[11px] text-orange-900 font-medium max-w-[80%]">
                        我是您的视觉导演。对当前渲染的光影、材质、构图不满意？直接告诉我您的想法，例如：“光影再柔和一些”或“背景换成极简大理石”。
                      </div>
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-[11px] font-medium shadow-sm ${
                          msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100">
                  <form onSubmit={(e) => { e.preventDefault(); if (chatInput.trim()) handleGenerate(chatInput); setChatInput(""); }} className="relative">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="发送微调指令..."
                      className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-6 text-xs focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm pr-16"
                    />
                    <button type="submit" disabled={isProcessing || !chatInput.trim()} className="absolute right-2 top-2 w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center hover:bg-orange-600 transition-all shadow-lg disabled:opacity-30">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-8 py-6 rounded-[32px] shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom z-[100] border border-slate-100 min-w-[400px]">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{error.title}</p>
            <p className="text-sm font-black leading-tight">{error.msg}</p>
          </div>
          <button onClick={() => setError(null)} className="p-3 hover:bg-slate-100 rounded-xl transition-all text-slate-300"><X /></button>
        </div>
      )}
    </div>
  );
};

export default App;

