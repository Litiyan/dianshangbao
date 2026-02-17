
import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Download, RefreshCw, Hand, 
  Zap, Crown, Settings2, Send, Bot, 
  KeyRound, ArrowRight, ShieldAlert, X, MessageSquareText
} from 'lucide-react';
import { ImageStyle, MarketAnalysis, ImageCategory } from './types';
import { CATEGORY_CONFIGS } from './constants';
import { analyzeProduct, generateProductDisplay } from './services/geminiService';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [selectedStyle] = useState<ImageStyle>(ImageStyle.INS);
  const [selectedCategory, setSelectedCategory] = useState<ImageCategory>(ImageCategory.SOCIAL);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState<{title: string, msg: string, code: string} | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'testing' | 'stable' | 'blocked'>('testing');

  useEffect(() => {
    const checkAuth = async () => {
      if (process.env.API_KEY && process.env.API_KEY !== "undefined") {
        setHasKey(true);
        return;
      }
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
      console.error("Open key center failed");
    }
  };

  const processError = (err: any) => {
    const msg = err.message || "";
    if (msg.includes("NETWORK_BLOCKED_CN") || networkStatus === 'blocked') {
      setError({
        title: "网络连接受阻",
        msg: "无法连接至 AI 算力节点。请检查代理设置并开启“全局模式”。",
        code: "G_BLOCK"
      });
    } else if (msg.includes("AUTH_KEY_INVALID") || msg.includes("API_KEY_MISSING")) {
      setError({
        title: "密钥授权失败",
        msg: "您的 API 密钥无效或未配置。请重新完成授权。",
        code: "KEY_ERR"
      });
    } else {
      setError({ title: "渲染引擎错误", msg: msg || "生成失败，请稍后重试。", code: "ENG_FAIL" });
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
      const result = await generateProductDisplay(
        base64, selectedStyle, selectedCategory, "1:1", analysis, [], false, updatedHistory
      );
      setGeneratedResult(result);
      if (refinementText) {
        setChatMessages(prev => [...prev, { role: 'assistant', text: "小手套已重新调整了光影布局，您看这样可以吗？" }]);
      }
      setStep(3);
    } catch (err: any) { processError(err); } finally { setIsProcessing(false); }
  };

  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-[#FFF7ED] flex flex-col items-center justify-center p-10 text-orange-900">
        <div className="max-w-xl w-full text-center space-y-12">
          <div className="w-28 h-28 vision-gradient rounded-[36px] flex items-center justify-center mx-auto shadow-2xl shadow-orange-200 animate-float border-4 border-white">
            <Hand className="w-14 h-14 text-white fill-white rotate-12" />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tight">电商宝</h1>
            <p className="text-orange-400 font-bold uppercase tracking-[0.4em] text-[10px]">您的 AI 电商视觉助手</p>
          </div>
          <div className="bg-white border border-orange-100 p-12 rounded-[56px] shadow-xl">
            <p className="text-slate-500 text-sm leading-relaxed mb-10">
              欢迎！为了启用 4K 级的 AI 背景重构算力，我们需要先连接您的授权密钥。
            </p>
            <button 
              onClick={handleFixAuth}
              className="w-full h-20 vision-gradient text-white rounded-[32px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-orange-200"
            >
              一键开启算力通道 <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] pb-24">
      <nav className="h-20 bg-white/80 backdrop-blur-xl sticky top-0 z-50 px-8 flex items-center justify-between border-b border-orange-100">
        <div className="flex items-center gap-5">
          <div className="w-11 h-11 vision-gradient rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 border-2 border-white rotate-6">
            <Hand className="text-white w-6 h-6 fill-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-orange-950 tracking-tight">电商宝</h1>
            <p className="text-[9px] text-orange-400 font-black uppercase tracking-widest mt-0.5">
              {networkStatus === 'stable' ? '⚡ 链路已就绪' : '⏳ 正在寻址...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleFixAuth} className="px-5 py-2.5 rounded-2xl bg-orange-50 text-orange-600 text-[11px] font-black hover:bg-orange-100 transition-all flex items-center gap-2">
            <Settings2 className="w-3.5 h-3.5" /> 密钥中心
          </button>
          <button className="px-6 py-2.5 rounded-2xl bg-orange-950 text-white text-[11px] font-black hover:bg-black transition-all flex items-center gap-2 shadow-xl shadow-orange-100">
            <Crown className="w-4 h-4 text-amber-400" /> PRO
          </button>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto p-8 grid grid-cols-12 gap-10">
        <aside className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[40px] p-8 vision-shadow border border-orange-50">
            <h2 className="text-[11px] font-black text-orange-300 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Upload className="w-4 h-4" /> 01 / 导入产品
            </h2>
            <div className="aspect-[4/3] rounded-[32px] bg-orange-50/30 border-2 border-dashed border-orange-100 flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:border-orange-400 transition-all group overflow-hidden relative">
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setSourceImage(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
              {sourceImage ? (
                <img src={sourceImage} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-orange-500" />
                  </div>
                  <p className="text-sm font-black text-orange-950">上传产品原图</p>
                  <p className="text-[10px] text-orange-300 font-medium">小手套将自动为您剥离背景</p>
                </div>
              )}
            </div>
            {sourceImage && !analysis && (
              <button onClick={handleAnalyze} disabled={isProcessing} className="w-full mt-8 vision-gradient text-white h-16 rounded-[24px] font-black text-xs tracking-widest shadow-lg shadow-orange-200">
                {isProcessing ? <RefreshCw className="animate-spin w-5 h-5 mx-auto" /> : '智能分析卖点'}
              </button>
            )}
          </div>

          {analysis && step < 3 && (
            <div className="bg-white rounded-[40px] p-8 vision-shadow border border-orange-50 space-y-10 animate-in slide-in-from-bottom">
              <section>
                <h3 className="text-[11px] font-black text-orange-300 uppercase tracking-widest mb-5">02 / 类目空间选择</h3>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORY_CONFIGS.slice(0, 6).map(cat => (
                    <button 
                      key={cat.id} 
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-4 rounded-3xl border transition-all text-left ${selectedCategory === cat.id ? 'border-orange-500 bg-orange-50 text-orange-900 ring-4 ring-orange-500/5' : 'border-slate-50 hover:border-orange-200 bg-slate-50/50'}`}
                    >
                      <span className="text-xl mb-1 block">{cat.icon}</span>
                      <p className="text-[11px] font-black">{cat.name}</p>
                    </button>
                  ))}
                </div>
              </section>
              <button onClick={() => handleGenerate()} disabled={isProcessing} className="w-full vision-gradient text-white h-20 rounded-[28px] font-black text-xs shadow-2xl flex items-center justify-center gap-3">
                {isProcessing ? <RefreshCw className="animate-spin w-6 h-6" /> : <Zap className="w-6 h-6 fill-current" />}
                重构背景环境
              </button>
            </div>
          )}
        </aside>

        <main className="col-span-12 lg:col-span-8">
          <div className={`relative min-h-[800px] rounded-[56px] bg-white vision-shadow border border-orange-50 flex overflow-hidden ${step === 3 ? 'flex-col lg:flex-row' : 'items-center justify-center'}`}>
            <div className={`relative flex items-center justify-center transition-all duration-700 ${step === 3 ? 'w-full lg:w-2/3 p-10 bg-orange-50/20' : 'w-full'}`}>
              {isProcessing && (
                <div className="absolute inset-0 z-40 bg-white/95 backdrop-blur-3xl flex flex-col items-center justify-center">
                  <RefreshCw className="w-16 h-16 text-orange-600 animate-spin mb-8" />
                  <p className="text-2xl font-black text-orange-950">小手套渲染中...</p>
                </div>
              )}

              {generatedResult ? (
                <div className="relative group w-full h-full flex items-center justify-center">
                  <img src={generatedResult} className="max-w-full max-h-[680px] object-contain shadow-2xl rounded-3xl animate-in zoom-in-95" />
                  <div className="absolute bottom-6">
                    <a href={generatedResult} download="dianshangbao_render.png" className="bg-orange-950 text-white px-10 py-5 rounded-[24px] font-black text-xs flex items-center gap-3 hover:bg-black transition-all">
                      <Download className="w-5 h-5" /> 导出商用原图
                    </a>
                  </div>
                </div>
              ) : !isProcessing && (
                <div className="text-center p-20">
                  <div className="w-28 h-28 bg-orange-50 rounded-[48px] flex items-center justify-center mx-auto mb-8 border border-orange-100 shadow-inner">
                    <Hand className="w-12 h-12 text-orange-200 fill-orange-100" />
                  </div>
                  <h2 className="text-2xl font-black text-orange-950">等待导入产品</h2>
                  <p className="text-[10px] text-orange-300 font-bold uppercase tracking-[0.4em] mt-4">您的 AI 视觉专家随时待命</p>
                </div>
              )}
            </div>

            {step === 3 && (
              <div className="w-full lg:w-1/3 bg-white border-l border-orange-50 flex flex-col">
                <div className="p-6 border-b border-orange-50 flex items-center gap-3">
                  <div className="w-10 h-10 vision-gradient rounded-xl flex items-center justify-center text-white">
                    <MessageSquareText className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] font-black text-orange-950 uppercase tracking-tight">AI 创意对话</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] p-4 rounded-3xl text-xs ${
                        msg.role === 'user' ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-orange-50 text-orange-900 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-6 bg-orange-50/30 border-t border-orange-50">
                  <form onSubmit={(e) => { e.preventDefault(); if (chatInput.trim()) handleGenerate(chatInput); setChatInput(""); }} className="relative">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="发送微调要求..."
                      className="w-full bg-white border border-orange-200 rounded-[24px] pl-6 pr-14 py-4 text-[12px] focus:outline-none focus:ring-4 focus:ring-orange-500/10"
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 vision-gradient text-white rounded-full flex items-center justify-center">
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
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-white text-orange-950 px-10 py-8 rounded-[40px] shadow-2xl flex items-center gap-10 animate-in slide-in-from-bottom z-[200] border border-orange-100">
          <ShieldAlert className="w-7 h-7 text-orange-500" />
          <div>
            <p className="text-[10px] font-black text-orange-300 uppercase tracking-widest">{error.title}</p>
            <p className="text-[14px] font-black leading-tight mt-1">{error.msg}</p>
          </div>
          <button onClick={handleFixAuth} className="px-6 py-3 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-orange-600 transition-all">前往密钥中心</button>
          <button onClick={() => setError(null)} className="p-4 hover:bg-orange-50 rounded-full transition-all text-orange-200"><X /></button>
        </div>
      )}
    </div>
  );
};

export default App;
