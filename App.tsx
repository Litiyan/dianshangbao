
import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Download, RefreshCw, Hand, 
  Zap, Crown, Send, Bot, 
  CheckCircle2, ShieldAlert, X, MessageSquareText,
  ExternalLink, Sparkles, Image as ImageIcon, Camera, User, LayoutGrid, ToggleLeft, ToggleRight
} from 'lucide-react';
import { ImageStyle, MarketAnalysis, GeneratedImage } from './types';
import { STYLE_CONFIGS } from './constants';
import { analyzeProduct, generatePreview, generateMarketingSuite, generateModelImage } from './services/geminiService';

const LOADING_MESSAGES = [
  "正在为您寻找 50mm 黄金焦段镜头...",
  "AI 导演正在评估小红书点击率...",
  "正在调试虚拟影棚柔光箱...",
  "正在扫描产品材质纹理...",
  "正在计算 8K 级光影折射...",
  "正在聘请虚拟数字模特...",
  "正在构建 100% 纯净白底场景...",
];

const App: React.FC = () => {
  const [step, setStep] = useState<'upload' | 'preview' | 'suite'>('upload');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>(ImageStyle.STUDIO);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [suiteResults, setSuiteResults] = useState<GeneratedImage[]>([]);
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [modelShowFace, setModelShowFace] = useState(true);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
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
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setSourceImage(base64);
        setIsProcessing(true);
        try {
          const res = await analyzeProduct(base64.split(',')[1]);
          setAnalysis(res);
          setStep('upload');
          setPreviewUrl(null);
          setSuiteResults([]);
          setModelImage(null);
        } catch (err: any) {
          setError({ title: "分析失败", msg: err.message });
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startPreview = async (tweak: string = "") => {
    if (!sourceImage || !analysis) return;
    setIsProcessing(true);
    setStep('preview');
    try {
      const res = await generatePreview(sourceImage.split(',')[1], selectedStyle, analysis, tweak);
      setPreviewUrl(res);
    } catch (err: any) {
      setError({ title: "预览生成失败", msg: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const startFullSuite = async () => {
    if (!sourceImage || !analysis) return;
    setIsProcessing(true);
    try {
      const tweaks = chatMessages.filter(m => m.role === 'user').map(m => m.text).join(', ');
      const results = await generateMarketingSuite(sourceImage.split(',')[1], analysis, selectedStyle, tweaks);
      setSuiteResults(results);
      setStep('suite');
    } catch (err: any) {
      setError({ title: "全套生成失败", msg: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const startModelTryOn = async () => {
    if (!sourceImage || !analysis) return;
    setIsProcessing(true);
    try {
      const res = await generateModelImage(sourceImage.split(',')[1], analysis, modelShowFace);
      setModelImage(res);
      setStep('suite');
    } catch (err: any) {
      setError({ title: "模特试穿失败", msg: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const surpriseMode = () => {
    const styles = Object.values(ImageStyle);
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    setSelectedStyle(randomStyle as ImageStyle);
    startPreview("给我一个意想不到的惊喜风格，发挥创意。");
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-slate-900 pb-20 font-sans">
      {/* 顶部导航 */}
      <nav className="h-20 bg-white/70 backdrop-blur-2xl sticky top-0 z-50 px-8 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-black tracking-tight">电商宝 <span className="text-orange-500 font-medium">Suite</span></h1>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase text-slate-500">双链路已就绪</span>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto p-8 grid grid-cols-12 gap-10">
        {/* 左侧控制区 */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 space-y-8">
            <div>
              <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Camera className="w-4 h-4" /> Step 1 / 产品入库
              </h2>
              <div className="aspect-[4/3] rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 relative overflow-hidden group hover:border-orange-400 transition-all">
                <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                {sourceImage ? (
                  <img src={sourceImage} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <Upload className="w-8 h-8 text-orange-400 mb-2" />
                    <p className="text-sm font-black">导入产品原图</p>
                  </div>
                )}
              </div>
            </div>

            {analysis && (
              <div className="space-y-6">
                <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                  <p className="text-[10px] font-black text-orange-600 uppercase mb-1">AI 识别：{analysis.productType}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {analysis.sellingPoints.slice(0, 2).map((s, i) => (
                      <span key={i} className="text-[9px] px-2 py-0.5 bg-white rounded-full text-slate-500 font-bold">{s}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-4">视觉基调</p>
                  <div className="grid grid-cols-2 gap-2">
                    {STYLE_CONFIGS.map(style => (
                      <button key={style.id} onClick={() => setSelectedStyle(style.id)} className={`flex items-center gap-2 p-3 rounded-2xl border transition-all ${selectedStyle === style.id ? 'border-orange-500 bg-orange-50 text-orange-900 ring-2 ring-orange-100' : 'border-slate-100 bg-slate-50/50 text-slate-500 hover:bg-slate-50'}`}>
                        <span className="text-lg">{style.icon}</span>
                        <span className="text-[10px] font-black">{style.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {step === 'upload' && (
                  <button onClick={() => startPreview()} disabled={isProcessing} className="w-full bg-orange-500 text-white h-16 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-orange-600 shadow-xl shadow-orange-100 transition-all flex items-center justify-center gap-3">
                    <Sparkles className="w-5 h-5" /> 生成主图预览
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* 右侧展示区 */}
        <main className="col-span-12 lg:col-span-8">
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 min-h-[800px] overflow-hidden flex flex-col relative">
            {/* 加载中动画 */}
            {isProcessing && (
              <div className="absolute inset-0 z-[60] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center">
                <div className="relative mb-8">
                  <div className="w-20 h-20 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
                  <Bot className="absolute inset-0 m-auto w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight animate-bounce">{LOADING_MESSAGES[loadingTextIndex]}</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-4">深度重构进行中 · 请稍候</p>
              </div>
            )}

            <div className="flex-1 p-10 overflow-y-auto">
              {!sourceImage && (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <ImageIcon className="w-16 h-16 text-slate-100 mb-6" />
                  <h2 className="text-2xl font-black text-slate-900 mb-2">AI 视觉影棚已就绪</h2>
                  <p className="text-slate-400 text-sm max-w-sm">上传产品图，AI 导演将为您量身定制全套电商视觉资产。</p>
                </div>
              )}

              {step === 'preview' && previewUrl && (
                <div className="space-y-10 animate-in fade-in duration-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">预览重构结果</h3>
                    <div className="flex gap-4">
                      <button onClick={startFullSuite} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-xl shadow-slate-200">
                        <LayoutGrid className="w-4 h-4" /> 生成全套资产
                      </button>
                      {analysis?.isApparel && (
                        <div className="flex items-center bg-purple-50 p-1 rounded-2xl border border-purple-100 gap-2">
                           <button onClick={() => setModelShowFace(!modelShowFace)} className="p-2 text-purple-600 hover:bg-white rounded-xl transition-all flex items-center gap-2">
                             {modelShowFace ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                             <span className="text-[10px] font-black">{modelShowFace ? "露脸模式" : "无头模式"}</span>
                           </button>
                           <button onClick={startModelTryOn} className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-xl shadow-purple-100">
                              <User className="w-4 h-4" /> AI 试穿
                           </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative group max-w-xl mx-auto">
                    <img src={previewUrl} className="w-full rounded-[32px] shadow-2xl border border-slate-100" />
                    <button onClick={() => {const l=document.createElement('a'); l.href=previewUrl; l.download='preview.png'; l.click();}} className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-xl">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>

                  {/* 微调控制台 */}
                  <div className="bg-slate-50/50 rounded-[32px] p-8 border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                       <div className="flex items-center gap-3">
                        <Bot className="w-5 h-5 text-orange-500" />
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">视觉导演微调中心</p>
                      </div>
                      <button onClick={surpriseMode} className="text-[10px] font-black text-orange-500 hover:underline uppercase tracking-widest">试试惊喜模式 ✨</button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      {["更亮一些", "换成大理石背景", "自然窗光", "加点倒影", "极简氛围"].map(tag => (
                        <button key={tag} onClick={() => {setChatInput(tag); startPreview(tag);}} className="px-4 py-2 bg-white rounded-full text-[10px] font-bold text-slate-500 border border-slate-200 hover:border-orange-300 hover:text-orange-500 transition-all">
                          + {tag}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="输入微调指令..."
                        className="w-full h-16 bg-white border border-slate-200 rounded-2xl px-6 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm pr-20"
                      />
                      <button onClick={() => {if(chatInput.trim()){ setChatMessages([...chatMessages, {role:'user', text:chatInput}]); startPreview(chatInput); setChatInput(""); }}} disabled={isProcessing} className="absolute right-3 top-3 w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center hover:bg-orange-600 transition-all shadow-lg">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === 'suite' && (
                <div className="space-y-12 animate-in slide-in-from-bottom duration-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black tracking-tight">全渠道资产包</h3>
                    <button onClick={() => setStep('preview')} className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-orange-500 transition-colors">
                      ← 返回微调
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {suiteResults.map((item, idx) => (
                      <div key={idx} className="group relative bg-slate-50 rounded-[40px] p-2 border border-slate-100 overflow-hidden">
                        <img src={item.url} className={`w-full ${item.aspectRatio === '3:4' ? 'aspect-[3/4]' : 'aspect-square'} object-cover rounded-[34px] group-hover:scale-[1.02] transition-transform duration-500 shadow-sm`} />
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-3 py-1 bg-white rounded-full text-[9px] font-black text-slate-900 border border-slate-200">{item.platformName}</span>
                            <button onClick={() => {const l=document.createElement('a'); l.href=item.url; l.download=`${item.platformName}.png`; l.click();}} className="text-slate-400 hover:text-slate-900 transition-colors"><Download className="w-4 h-4" /></button>
                          </div>
                          <p className="text-[10px] font-medium text-slate-500">{item.description}</p>
                        </div>
                      </div>
                    ))}
                    
                    {modelImage && (
                      <div className="md:col-span-2 group relative bg-gradient-to-br from-purple-50 to-indigo-50 rounded-[40px] p-4 border border-purple-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                          <img src={modelImage} className="w-full aspect-[3/4] object-cover rounded-[34px] shadow-2xl" />
                          <div className="p-4 space-y-6">
                            <span className="px-4 py-1.5 bg-purple-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">AI 模特实穿特写</span>
                            <h4 className="text-3xl font-black tracking-tight">真实感肤质重绘</h4>
                            <p className="text-sm text-slate-500 leading-relaxed">基于最新的高精度皮肤质感网络生成，一键实现商业级真人穿戴效果展示。</p>
                            <button onClick={() => {const l=document.createElement('a'); l.href=modelImage; l.download='model.png'; l.click();}} className="w-full py-4 bg-white text-slate-900 border border-purple-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-xl shadow-purple-100 flex items-center justify-center gap-3">
                              <Download className="w-5 h-5" /> 下载高清模特图
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-10 py-6 border-t border-slate-50 flex items-center justify-between bg-slate-50/20 text-[9px] font-black text-slate-300 uppercase tracking-widest">
              <span>Commerce Suite Engine v2.5.2</span>
              <div className="flex gap-4">
                <button className="hover:text-slate-900 transition-colors">安全隐私</button>
                <button className="hover:text-slate-900 transition-colors">联系技术支持</button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-8 py-6 rounded-[32px] shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom z-[100] border border-orange-100">
          <ShieldAlert className="w-6 h-6 text-orange-500" />
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{error.title}</p>
            <p className="text-sm font-black text-slate-800">{error.msg}</p>
          </div>
          <button onClick={() => setError(null)} className="p-2 text-slate-300 hover:text-slate-900 transition-all"><X /></button>
        </div>
      )}
    </div>
  );
};

export default App;
