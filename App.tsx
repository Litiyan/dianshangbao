
import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Download, RefreshCw, Hand, 
  Zap, Crown, Settings2, Send, Bot, 
  ArrowRight, ShieldAlert, X, MessageSquareText,
  CheckCircle2, Layers, Sun, Maximize2
} from 'lucide-react';
import { ImageStyle, MarketAnalysis, ImageCategory } from './types';
import { CATEGORY_CONFIGS, STYLE_CONFIGS, RATIO_OPTIONS, FINE_TUNE_TAGS, LIGHTING_DIRECTIONS } from './constants';
import { analyzeProduct, generateProductDisplay } from './services/geminiService';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  
  // 配置状态
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

  const [error, setError] = useState<{title: string, msg: string, code: string} | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'testing' | 'stable' | 'blocked'>('testing');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // @ts-ignore
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } catch (e) {
        setHasKey(false);
      }
    };
    checkAuth();

    const checkConnectivity = async () => {
      try {
        await fetch('https://generativelanguage.googleapis.com/v1/models', { mode: 'no-cors' });
        setNetworkStatus('stable');
      } catch (e) {
        setNetworkStatus('blocked');
      }
    };
    checkConnectivity();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleFixAuth = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasKey(true);
      setError(null);
    } catch (e) {
      console.error("Auth open failed");
    }
  };

  const processError = (err: any) => {
    const msg = err.message || "";
    if (msg.includes("NETWORK_BLOCKED_CN") || networkStatus === 'blocked') {
      setError({ title: "算力链路受限", msg: "无法触达 AI 节点，建议开启全局代理模式。", code: "G_BLOCK" });
    } else if (msg.includes("AUTH_KEY_INVALID")) {
      setError({ title: "授权密钥失效", msg: "请在密钥中心重新完成授权。", code: "KEY_ERR" });
      setHasKey(false);
    } else {
      setError({ title: "引擎处理异常", msg: msg || "生成失败，请稍后重试。", code: "ENG_FAIL" });
    }
  };

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
    } catch (err: any) { processError(err); } finally { setIsProcessing(false); }
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
        base64, 
        selectedStyle, 
        selectedCategory, 
        selectedRatio, 
        analysis, 
        [...selectedFineTunePrompts, lightingPrompt], 
        isUltraHD, 
        updatedHistory
      );
      
      setGeneratedResult(result);
      if (refinementText) {
        setChatMessages(prev => [...prev, { role: 'assistant', text: "小手套已按照您的要求优化了场景，您可以继续提出修改建议。" }]);
      }
      setStep(3);
    } catch (err: any) { processError(err); } finally { setIsProcessing(false); }
  };

  const toggleFineTune = (id: string) => {
    setSelectedFineTunes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10">
        <div className="max-w-xl w-full text-center space-y-10 animate-in fade-in zoom-in-95 duration-700">
          <div className="w-24 h-24 bg-orange-500 rounded-[28px] flex items-center justify-center mx-auto shadow-2xl rotate-12">
            <Hand className="w-12 h-12 text-white fill-white" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">电商宝</h1>
            <p className="text-orange-500 font-bold uppercase tracking-[0.3em] text-[10px]">您的 AI 电商视觉专家</p>
          </div>
          <div className="bg-white border border-slate-200 p-10 rounded-[40px] shadow-xl">
            <p className="text-slate-500 text-sm mb-8 font-medium">请先连接您的 API 密钥以开启 4K 算力通道。</p>
            <button onClick={handleFixAuth} className="w-full h-16 bg-orange-500 text-white rounded-[20px] font-black text-sm tracking-widest flex items-center justify-center gap-3 hover:bg-orange-600 transition-all">
              开启算力通道 <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-900">
      <nav className="h-20 bg-white/80 backdrop-blur-xl sticky top-0 z-50 px-8 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg rotate-12">
            <Hand className="text-white w-5 h-5 fill-white" />
          </div>
          <h1 className="text-lg font-black tracking-tight">电商宝 <span className="text-orange-500 ml-1">Workstation</span></h1>
        </div>
        
        {/* 步骤指示器 - 真正的“亮灯”逻辑 */}
        <div className="hidden md:flex items-center gap-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${
                step >= s ? 'bg-orange-500 text-white shadow-lg ring-4 ring-orange-100' : 'bg-slate-100 text-slate-400'
              }`}>
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${step >= s ? 'text-slate-900' : 'text-slate-300'}`}>
                {s === 1 ? '上传' : s === 2 ? '配置' : '成品'}
              </p>
              {s < 3 && <div className={`w-12 h-0.5 rounded-full ${step > s ? 'bg-orange-500' : 'bg-slate-100'}`} />}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleFixAuth} className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
            <Settings2 className="w-5 h-5" />
          </button>
          <button className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" /> 升级 Pro
          </button>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto p-8 grid grid-cols-12 gap-10">
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          {/* Step 1: Upload */}
          <div className={`bg-white rounded-[32px] p-6 shadow-sm border transition-all duration-500 ${step === 1 ? 'border-orange-500 ring-4 ring-orange-50' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4" /> 01 / 产品导入
              </h2>
              {sourceImage && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            </div>
            
            <div className="aspect-video rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 relative overflow-hidden group cursor-pointer hover:border-orange-400 transition-all">
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => { setSourceImage(reader.result as string); setStep(1); setAnalysis(null); };
                  reader.readAsDataURL(file);
                }
              }} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
              {sourceImage ? (
                <img src={sourceImage} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <Upload className="w-8 h-8 text-orange-500 mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-black text-slate-900">选择产品原图</p>
                  <p className="text-[9px] text-slate-400 mt-1">支持常规商品、3C、美妆等拍摄图</p>
                </div>
              )}
            </div>
            
            {sourceImage && step === 1 && (
              <button onClick={handleAnalyze} disabled={isProcessing} className="w-full mt-6 bg-orange-500 text-white h-14 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-100">
                {isProcessing ? <RefreshCw className="animate-spin w-5 h-5 mx-auto" /> : '开始智能定调'}
              </button>
            )}
          </div>

          {/* Step 2: Advanced Config */}
          {analysis && (
            <div className={`bg-white rounded-[32px] p-6 shadow-sm border transition-all duration-500 ${step === 2 ? 'border-orange-500 ring-4 ring-orange-50' : 'border-slate-200'} space-y-8 animate-in slide-in-from-bottom duration-500`}>
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Settings2 className="w-4 h-4" /> 02 / 视觉参数配置
                </h2>
              </div>

              {/* 场景比例 */}
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

              {/* 场景风格 */}
              <section>
                <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-3">核心类目</p>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORY_CONFIGS.slice(0, 4).map(cat => (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${selectedCategory === cat.id ? 'border-orange-500 bg-orange-50' : 'border-slate-100 bg-slate-50'}`}>
                      <span className="text-base">{cat.icon}</span>
                      <span className="text-[10px] font-bold truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* 视觉微调 */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Maximize2 className="w-3 h-3" /> 视觉质感微调
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {FINE_TUNE_TAGS.map(tag => (
                    <button key={tag.id} onClick={() => toggleFineTune(tag.id)} className={`px-3 py-1.5 rounded-full text-[9px] font-bold border transition-all ${selectedFineTunes.includes(tag.id) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-400 border-slate-200'}`}>
                      {tag.name}
                    </button>
                  ))}
                </div>
              </section>

              {/* 光影方向 */}
              <section>
                <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Sun className="w-3 h-3" /> 物理光影方向
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {LIGHTING_DIRECTIONS.map(l => (
                    <button key={l.id} onClick={() => setSelectedLighting(l.id)} className={`p-2 rounded-lg border transition-all flex flex-col items-center gap-1 ${selectedLighting === l.id ? 'border-orange-500 bg-orange-50 text-orange-900' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                      <span className="text-[9px] font-black">{l.name}</span>
                    </button>
                  ))}
                </div>
              </section>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-10 h-5 rounded-full relative transition-all ${isUltraHD ? 'bg-orange-500' : 'bg-slate-200'}`}>
                    <input type="checkbox" className="sr-only" checked={isUltraHD} onChange={e => setIsUltraHD(e.target.checked)} />
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isUltraHD ? 'left-6' : 'left-1'}`} />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 group-hover:text-slate-900 transition-colors">4K 超清重构</span>
                </label>
                <button onClick={() => handleGenerate()} disabled={isProcessing} className="px-8 h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-100 flex items-center gap-2">
                  {isProcessing ? <RefreshCw className="animate-spin w-4 h-4" /> : <Zap className="w-4 h-4 fill-current" />}
                  执行重构
                </button>
              </div>
            </div>
          )}
        </aside>

        <main className="col-span-12 lg:col-span-8">
          <div className={`relative min-h-[750px] bg-white rounded-[40px] shadow-sm border border-slate-200 flex overflow-hidden ${step === 3 ? 'flex-col' : 'items-center justify-center'}`}>
            <div className={`relative flex items-center justify-center transition-all duration-700 p-8 ${step === 3 ? 'h-2/3 bg-slate-50/50 border-b border-slate-100' : 'h-full w-full'}`}>
              {isProcessing && (
                <div className="absolute inset-0 z-40 bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-500">
                  <div className="relative mb-6">
                    <RefreshCw className="w-16 h-16 text-orange-500 animate-spin" />
                    <Hand className="absolute inset-0 m-auto w-6 h-6 text-orange-200 fill-orange-50 animate-pulse" />
                  </div>
                  <p className="text-xl font-black tracking-tight">小手套渲染中...</p>
                  <div className="mt-4 px-4 py-1.5 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                    深度神经网络重塑物理空间
                  </div>
                </div>
              )}

              {generatedResult ? (
                <div className="relative group w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-700">
                  <img src={generatedResult} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button className="p-3 bg-white/90 backdrop-blur rounded-xl shadow-lg hover:scale-105 transition-transform">
                      <Download className="w-5 h-5 text-slate-900" />
                    </button>
                  </div>
                </div>
              ) : !isProcessing && (
                <div className="text-center max-w-sm">
                  <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner rotate-6">
                    <Hand className="w-10 h-10 text-slate-200 fill-slate-50" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">等待视觉执行</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-loose">
                    导入产品图片后，AI 将自动分析核心卖点并为您匹配最佳的商业视觉空间。
                  </p>
                </div>
              )}
            </div>

            {step === 3 && (
              <div className="h-1/3 bg-white flex flex-col animate-in slide-in-from-bottom duration-700">
                <div className="px-8 py-4 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bot className="w-5 h-5 text-orange-500" />
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">AI 导演微调建议</p>
                  </div>
                  <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest animate-pulse">● 实时交互中</p>
                </div>
                
                <div className="flex-1 overflow-y-auto px-8 py-4 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                        <MessageSquareText className="w-4 h-4" />
                      </div>
                      <div className="bg-orange-50 p-3 rounded-2xl text-[11px] text-orange-900 font-medium max-w-[80%]">
                        我是您的 AI 视觉导演。如果您对当前背景的光影、材质或构图有任何细微调整需求，请直接告诉我。例如：“光影再柔和一些”或“背景换成极简工业风”。
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

                <div className="p-6 bg-slate-50">
                  <form onSubmit={(e) => { e.preventDefault(); if (chatInput.trim()) handleGenerate(chatInput); setChatInput(""); }} className="relative">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="发送导演微调指令..."
                      className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-6 text-xs focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm pr-16"
                    />
                    <button type="submit" disabled={isProcessing || !chatInput.trim()} className="absolute right-2 top-2 w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 disabled:opacity-30">
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
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-8 py-6 rounded-[32px] shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom duration-500 z-[100] border border-slate-100">
          <ShieldAlert className="w-8 h-8 text-orange-500" />
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{error.title}</p>
            <p className="text-sm font-black leading-tight">{error.msg}</p>
          </div>
          <div className="flex gap-3 ml-6">
            <button onClick={handleFixAuth} className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all">重新授权</button>
            <button onClick={() => setError(null)} className="p-2.5 hover:bg-slate-100 rounded-xl transition-all text-slate-300"><X /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
