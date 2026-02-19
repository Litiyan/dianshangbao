
import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Download, RefreshCw, Hand, 
  Zap, Crown, Send, Bot, 
  CheckCircle2, ShieldAlert, X, MessageSquareText,
  ExternalLink, Sparkles, Image as ImageIcon, Camera, User, LayoutGrid, ToggleLeft, ToggleRight,
  ChevronRight, Layers, Box, Maximize2
} from 'lucide-react';
import { ImageStyle, MarketAnalysis, GeneratedImage } from './types';
import { STYLE_CONFIGS } from './constants';
import { analyzeProduct, generatePreview, generateMarketingSuite, generateModelImage } from './services/geminiService';

const LOADING_MESSAGES = [
  "正在为您匹配 8K 级光影链路...",
  "AI 视觉引擎正在重构背景像素...",
  "正在调试 100% 还原的真实阴影...",
  "正在分析全球商业摄影流行趋势...",
  "正在微调色准与动态范围...",
  "正在聘请虚拟模特进行 1:1 试穿...",
  "正在导出高分辨率电商资产...",
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
  const [error, setError] = useState<{title: string, msg: string} | null>(null);

  // Carousel for loading text
  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
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
          const rawBase64 = base64.split(',')[1];
          const res = await analyzeProduct(rawBase64);
          setAnalysis(res);
          setStep('upload');
          setPreviewUrl(null);
          setSuiteResults([]);
          setModelImage(null);
        } catch (err: any) {
          setError({ title: "Analysis Error", msg: err.message });
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
      setError({ title: "Preview Generation Failed", msg: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const startFullSuite = async () => {
    if (!sourceImage || !analysis) return;
    setIsProcessing(true);
    try {
      const results = await generateMarketingSuite(sourceImage.split(',')[1], analysis, selectedStyle, chatInput);
      setSuiteResults(results);
      setStep('suite');
    } catch (err: any) {
      setError({ title: "Suite Generation Failed", msg: err.message });
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
      setError({ title: "Model Generation Failed", msg: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-20 font-sans">
      {/* Header */}
      <nav className="h-16 bg-white/80 backdrop-blur-xl sticky top-0 z-[100] px-6 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.location.reload()}>
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
            <Sparkles className="text-white w-4 h-4" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">电商宝 <span className="text-orange-500">Suite</span></h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            System Status: Optimal
          </div>
          <button className="px-5 py-2 rounded-lg bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">
             Pro Account
          </button>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto p-6 lg:p-10 grid grid-cols-12 gap-8">
        
        {/* Left Sidebar: Controls */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-8 sticky top-24">
            
            {/* Upload Area */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Box className="w-3 h-3" /> Step 1: Input Product
                </h2>
                {sourceImage && (
                  <button onClick={() => setSourceImage(null)} className="text-[10px] text-orange-500 font-bold hover:underline">Replace</button>
                )}
              </div>
              <div className="relative aspect-square rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden group hover:border-orange-500 transition-colors">
                <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                {sourceImage ? (
                  <img src={sourceImage} className="w-full h-full object-contain p-4" alt="Product source" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-orange-500" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">Drop or click to upload</p>
                    <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider">Supports PNG, JPG (White or clean BG preferred)</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Insights & Styles */}
            {analysis && (
              <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <p className="text-[9px] font-bold text-orange-600 uppercase mb-2 tracking-widest">AI Intelligence Report</p>
                  <p className="text-xs font-bold text-slate-800 mb-3">{analysis.productType}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.sellingPoints.slice(0, 4).map((point, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white text-[9px] font-bold text-slate-500 rounded border border-orange-100">{point}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Choose Visual Vibe</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {STYLE_CONFIGS.map(style => (
                      <button 
                        key={style.id} 
                        onClick={() => setSelectedStyle(style.id)} 
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedStyle === style.id ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-slate-100 hover:border-orange-200 bg-slate-50/50'}`}
                      >
                        <span className="text-lg">{style.icon}</span>
                        <span className="text-[10px] font-bold text-slate-700 truncate">{style.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {step === 'upload' && (
                  <button 
                    onClick={() => startPreview()} 
                    disabled={isProcessing} 
                    className="w-full bg-orange-500 text-white h-12 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-orange-600 shadow-lg shadow-orange-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Initialize Visual Build
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Right Content Area: Main Display */}
        <main className="col-span-12 lg:col-span-8">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 min-h-[600px] relative overflow-hidden flex flex-col">
            
            {/* Full-screen Loading Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 z-[200] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center p-10">
                <div className="relative mb-10 scale-125">
                  <div className="w-20 h-20 border-2 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
                  <Bot className="absolute inset-0 m-auto w-8 h-8 text-orange-500 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight text-center max-w-md h-8">{LOADING_MESSAGES[loadingTextIndex]}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-6">Processing high-fidelity reconstruction</p>
              </div>
            )}

            <div className="flex-1 p-8">
              {!sourceImage ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 rotate-3 shadow-inner border border-slate-100">
                    <ImageIcon className="w-8 h-8 text-slate-200" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">AI Visual Studio Ready</h2>
                  <p className="text-slate-400 text-sm max-w-xs leading-relaxed">Upload a product photo to begin professional background reconstruction and marketing asset generation.</p>
                </div>
              ) : step === 'preview' && previewUrl ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <LayoutGrid className="w-3 h-3" /> Production Preview
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={startFullSuite} 
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-sm"
                      >
                        <Layers className="w-3.5 h-3.5" /> Full Marketing Suite
                      </button>
                      {analysis?.isApparel && (
                        <button 
                          onClick={startModelTryOn} 
                          className="px-4 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-purple-700 transition-all flex items-center gap-2 shadow-sm"
                        >
                          <User className="w-3.5 h-3.5" /> Virtual Model
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative group max-w-xl mx-auto rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-200">
                    <img src={previewUrl} className="w-full object-cover" alt="AI Generated Preview" />
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = previewUrl;
                        link.download = 'ai-preview.png';
                        link.click();
                      }}
                      className="absolute bottom-4 right-4 p-3 bg-white/90 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
                    >
                      <Download className="w-5 h-5 text-slate-900" />
                    </button>
                  </div>

                  {/* Refinement Tools */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <MessageSquareText className="w-4 h-4 text-orange-600" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Director's Tweak Center</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {["Make it brighter", "Marble surface", "Nature vibes", "Soft shadows", "Floating product"].map(tag => (
                        <button 
                          key={tag} 
                          onClick={() => { setChatInput(tag); startPreview(tag); }} 
                          className="px-3 py-1.5 bg-white rounded-lg text-[10px] font-bold text-slate-500 border border-slate-200 hover:border-orange-500 hover:text-orange-500 transition-all shadow-sm"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type a refinement instruction..."
                        className="w-full h-12 bg-white border border-slate-200 rounded-xl px-5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                      />
                      <button 
                        onClick={() => { if(chatInput.trim()){ startPreview(chatInput); setChatInput(""); } }} 
                        className="absolute right-1.5 top-1.5 w-9 h-9 bg-orange-500 text-white rounded-lg flex items-center justify-center hover:bg-orange-600 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : step === 'suite' && (
                <div className="space-y-10 animate-in slide-in-from-bottom duration-500">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-slate-900">Marketing Assets Package</h3>
                      <p className="text-xs text-slate-400 mt-1">Multi-channel optimized visual content</p>
                    </div>
                    <button onClick={() => setStep('preview')} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-orange-500 flex items-center gap-2">
                      <RefreshCw className="w-3 h-3" /> Refine Setup
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {suiteResults.map((item, idx) => (
                      <div key={idx} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                        <div className="relative aspect-square">
                          <img src={item.url} className="w-full h-full object-cover" alt={item.platformName} />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                             <button onClick={() => {const l=document.createElement('a'); l.href=item.url; l.download='asset.png'; l.click();}} className="p-3 bg-white rounded-full text-slate-900 hover:scale-110 transition-transform shadow-lg"><Download className="w-5 h-5"/></button>
                          </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wide">{item.platformName}</p>
                            <p className="text-[9px] text-slate-400 uppercase font-bold mt-1">{item.aspectRatio} Aspect Ratio</p>
                          </div>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </div>
                      </div>
                    ))}
                    
                    {modelImage && (
                      <div className="md:col-span-2 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2">
                          <div className="aspect-[3/4] overflow-hidden">
                            <img src={modelImage} className="w-full h-full object-cover" alt="AI Model Try-on" />
                          </div>
                          <div className="p-8 flex flex-col justify-center space-y-4">
                            <span className="w-fit px-3 py-1 bg-purple-600 text-white rounded-full text-[9px] font-bold uppercase tracking-widest">AI Virtual Model V2</span>
                            <h4 className="text-2xl font-bold text-slate-900">Professional Wearable Visualization</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">Integrated high-fidelity digital models with realistic fabric draping and studio-grade retouching.</p>
                            <button 
                              onClick={() => {const l=document.createElement('a'); l.href=modelImage; l.download='model-shot.png'; l.click();}}
                              className="w-full py-4 bg-white border border-purple-200 text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                              <Download className="w-4 h-4" /> Download 8K Model Asset
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Subtle Footer */}
            <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/30 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
              <div className="flex items-center gap-4">
                <span>Core Engine v3.0</span>
                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                <span>Gemini High-Density Vision</span>
              </div>
              <div className="flex gap-4">
                <span>Encrypted</span>
                <span>Priority Node</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-[400px] bg-white text-slate-900 p-5 rounded-2xl shadow-2xl border border-red-100 flex items-start gap-4 animate-in slide-in-from-right z-[500]">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">{error.title}</p>
            <p className="text-xs font-bold text-slate-700 leading-normal truncate">{error.msg}</p>
          </div>
          <button onClick={() => setError(null)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
};

export default App;
