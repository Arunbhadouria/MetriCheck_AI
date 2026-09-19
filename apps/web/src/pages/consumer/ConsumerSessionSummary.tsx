import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import {
  ShieldCheck, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  PlusCircle, Send, Volume2, RotateCcw, Scale, Store, Sparkles,
  ShoppingBag, ArrowLeft, ExternalLink, ArrowRight, Bookmark
} from 'lucide-react';
import { ScannedConsumerProduct } from './ConsumerScanner';
import { voiceAi } from '../../services/voiceAi';
import { aiBackgroundManager, useAiBackgroundTasks } from '../../services/aiBackgroundManager';
import { AiProcessingCircleLoader } from '../../components/AiProcessingCircleLoader';

export const ConsumerSessionSummary: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<ScannedConsumerProduct[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [speakingProductId, setSpeakingProductId] = useState<string | null>(null);
  const { runningTasks, waitForAllTasks } = useAiBackgroundTasks();
  const [showCircleLoader, setShowCircleLoader] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('metricheck_consumer_cart');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCart(parsed);
          return;
        }
      } catch (e) {
        console.warn('Error reading consumer cart', e);
      }
    }
    // If no cart in session, check if there's a single product
    const singleRaw = sessionStorage.getItem('metricheck_consumer_product');
    if (singleRaw) {
      try {
        const single = JSON.parse(singleRaw);
        setCart([single]);
      } catch {
        navigate('/consumer/scan');
      }
    } else {
      navigate('/consumer/scan');
    }
  }, [navigate]);

  const totalProducts = cart.length;
  const violationProducts = cart.filter(p => p.status === 'VIOLATION' || (p.violations && p.violations.length > 0));
  const compliantProducts = cart.filter(p => p.status === 'PASS' && (!p.violations || p.violations.length === 0));

  const totalOvercharge = cart.reduce((acc, p) => {
    if (p.stickerPrice && p.stickerPrice > p.printedMrp) {
      return acc + (p.stickerPrice - p.printedMrp);
    }
    return acc;
  }, 0);

  const totalPrintedValue = cart.reduce((acc, p) => acc + (p.printedMrp || 0), 0);
  const totalChargedValue = cart.reduce((acc, p) => acc + (p.stickerPrice || p.printedMrp || 0), 0);

  const handlePlayVoice = (prod: ScannedConsumerProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    if (speakingProductId === prod.id) {
      voiceAi.stop();
      setSpeakingProductId(null);
      return;
    }

    setSpeakingProductId(prod.id);
    voiceAi.speakProductAnnouncement(
      {
        productName: prod.name,
        brand: prod.brand,
        mrp: prod.printedMrp,
        stickerPrice: prod.stickerPrice,
        expiryDate: prod.expiryDate,
        netWeight: prod.netWeight,
        violations: prod.violations,
        lang: 'hi'
      },
      () => setSpeakingProductId(prod.id),
      () => setSpeakingProductId(null)
    );
  };

  const handleClearSession = () => {
    if (window.confirm('क्या आप इस सत्र की सभी जाँची गई वस्तुएँ हटाना चाहते हैं?')) {
      sessionStorage.removeItem('metricheck_consumer_cart');
      sessionStorage.removeItem('metricheck_consumer_product');
      navigate('/consumer/scan');
    }
  };

  const handleSaveToHistory = async () => {
    voiceAi.stop();
    if (runningTasks.length > 0) {
      setShowCircleLoader(true);
      await waitForAllTasks();
      setShowCircleLoader(false);
    }

    const citizenUser = localStorage.getItem('metricheck_citizen_user');
    if (!citizenUser) {
      navigate('/consumer/auth?redirect=history');
      return;
    }

    // Citizen is authenticated: save all cart items to history
    if (cart.length > 0) {
      try {
        const rawHistory = localStorage.getItem('metricheck_citizen_history');
        const existing = rawHistory ? JSON.parse(rawHistory) : [];
        const itemsToSave = cart.map(item => ({
          ...item,
          scannedAt: new Date().toISOString(),
          storeName: 'गुप्ता किराना एवं जनरल स्टोर्स, इंदौर'
        }));
        localStorage.setItem('metricheck_citizen_history', JSON.stringify([...itemsToSave, ...existing]));
      } catch (e) {
        console.warn('Error saving to history', e);
      }
    }
    navigate('/consumer/dashboard?tab=history');
  };

  const handleProceedToComplaint = async () => {
    voiceAi.stop();
    if (runningTasks.length > 0) {
      setShowCircleLoader(true);
      await waitForAllTasks();
      setShowCircleLoader(false);
    }

    // If multiple violated products, save collective data
    if (violationProducts.length > 0) {
      sessionStorage.setItem('metricheck_consumer_product', JSON.stringify(violationProducts[0]));
      sessionStorage.setItem('metricheck_collective_violations', JSON.stringify(violationProducts));
    }
    const citizenUser = localStorage.getItem('metricheck_citizen_user');
    if (!citizenUser) {
      navigate('/consumer/auth?redirect=complaint');
      return;
    }
    navigate('/consumer/complaint');
  };

  return (
    <div className="gov-page text-base-content min-h-screen pb-28 font-sans">
      <Header
        title="उत्पाद जाँच सारांश • All Products Analysis"
        subtitle="उपभोक्ता संरक्षण सत्र • Citizen Verification"
        showBack={true}
        showMenu={true}
      />

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
        {/* ══ TOP STATS HERO ═══════════════════════════════════════════════ */}
        <div className="gov-card p-5 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 text-white border border-amber-500/30 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>उपभोक्ता संरक्षण सत्र • Consumer Verification Session</span>
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                कुल जाँचे गए उत्पाद: {totalProducts}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/consumer/scan')}
                className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>और उत्पाद स्कैन करें</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">कुल उत्पाद</span>
              <span className="text-xl font-black text-white">{totalProducts}</span>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-center">
              <span className="text-[10px] text-emerald-300 font-bold uppercase block">पूर्ण अनुपालित</span>
              <span className="text-xl font-black text-emerald-400">{compliantProducts.length}</span>
            </div>

            <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-center">
              <span className="text-[10px] text-red-300 font-bold uppercase block">उल्लंघन दर्ज</span>
              <span className="text-xl font-black text-red-400">{violationProducts.length}</span>
            </div>

            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 text-center">
              <span className="text-[10px] text-amber-300 font-bold uppercase block">कुल अवैध अधिशुल्क</span>
              <span className="text-xl font-black text-amber-400">₹{totalOvercharge}</span>
            </div>
          </div>

          {totalOvercharge > 0 && (
            <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl text-xs flex items-center justify-between gap-3 text-red-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  दुकानदार द्वारा कुल बिलिंग में <strong>₹{totalOvercharge}</strong> का अवैध अधिशुल्क लिया जा रहा है। (मुद्रित MRP: ₹{totalPrintedValue} | वसूली: ₹{totalChargedValue})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ══ ACCORDION OF ALL CHECKED PRODUCTS ════════════════════════════ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 text-xs text-slate-600 font-bold">
            <span>उत्पादों का व्यक्तिगत विवरण ({cart.length})</span>
            <button
              onClick={handleClearSession}
              className="text-[11px] text-slate-400 hover:text-red-600 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>सत्र रीसेट करें</span>
            </button>
          </div>

          {cart.map((prod, idx) => {
            const isPass = prod.status === 'PASS' && (!prod.violations || prod.violations.length === 0);
            const overcharge = prod.stickerPrice && prod.stickerPrice > prod.printedMrp ? prod.stickerPrice - prod.printedMrp : 0;
            const isOpen = openIndex === idx;

            return (
              <div
                key={prod.id || idx}
                className={`gov-card transition-all overflow-hidden border ${
                  isPass ? 'border-emerald-200 hover:border-emerald-300' : 'border-red-300 hover:border-red-400'
                }`}
              >
                {/* Accordion Bar */}
                <div
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-navy-950 truncate">{prod.name}</h4>
                      <p className="text-xs text-slate-500 truncate">
                        {prod.brand} {prod.netWeight ? `• ${prod.netWeight}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {overcharge > 0 && (
                      <span className="badge badge-error badge-xs font-black text-white">
                        +₹{overcharge} अवैध
                      </span>
                    )}

                    {isPass ? (
                      <span className="badge badge-success badge-xs font-bold text-white">
                        पास • PASS
                      </span>
                    ) : (
                      <span className="badge badge-error badge-xs font-bold text-white">
                        उल्लंघन • FAIL
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handlePlayVoice(prod, e)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                        speakingProductId === prod.id
                          ? 'bg-amber-500 text-navy-950 animate-pulse'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="Voice AI सुनें"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isOpen && (
                  <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                    {/* Price Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">मुद्रित MRP</span>
                        <span className="text-base font-black text-slate-900">₹{prod.printedMrp}</span>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">दुकानदार मूल्य</span>
                        <span className={`text-base font-black ${overcharge > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                          ₹{prod.stickerPrice || prod.printedMrp}
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">इकाई मूल्य (USP)</span>
                        <span className="text-xs font-bold text-slate-700 font-mono">{prod.unitSalePrice || 'N/A'}</span>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">समाप्ति तिथि (EXP)</span>
                        <span className="text-xs font-bold text-slate-700">{prod.expiryDate || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Violations List */}
                    {prod.violations && prod.violations.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="font-bold text-red-900 text-[11px] block">दर्ज नियम उल्लंघन:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {prod.violations.map((v, vIdx) => (
                            <span key={vIdx} className="badge bg-red-100 text-red-800 border-red-300 font-bold text-[10px]">
                              ⚠ {v.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Manufacturer & Consumer Care info */}
                    {prod.manufacturer && (
                      <p className="text-[11px] text-slate-600 pt-1">
                        <span className="font-bold text-slate-700">निर्माता: </span>
                        {prod.manufacturer}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ══ PRIMARY ACTIONS ══════════════════════════════════════════════ */}
        <div className="space-y-2.5 pt-2">
          {violationProducts.length > 0 ? (
            <button
              onClick={handleProceedToComplaint}
              className="btn btn-primary w-full py-4 text-sm sm:text-base font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 active:scale-[0.99] cursor-pointer"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>
                {violationProducts.length === 1
                  ? 'अधिकारी को शिकायत दर्ज करें • File Official Complaint'
                  : `सभी ${violationProducts.length} उल्लंघनों की संयुक्त शिकायत दर्ज करें • File Collective Complaint`}
              </span>
            </button>
          ) : (
            <div className="alert alert-success text-xs font-semibold p-3.5 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>बधाई! आपके द्वारा जाँचे गए सभी उत्पाद विधिक माप विज्ञान मानकों के पूर्णतः अनुरूप हैं।</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleSaveToHistory}
              className="btn bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs sm:text-sm py-3 flex items-center justify-center gap-2 transition active:scale-[0.99] shadow-md cursor-pointer"
            >
              <Bookmark className="w-4 h-4 text-amber-400 shrink-0" />
              <span>इतिहास में सहेजें • Save Session to History</span>
            </button>

            <button
              onClick={() => navigate('/consumer/scan')}
              className="btn bg-white hover:bg-slate-100 border border-slate-300 text-navy-950 font-bold text-xs sm:text-sm py-3 flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-orange-600" />
              <span>और उत्पाद स्कैन करें • Scan More Products</span>
            </button>
          </div>
        </div>
      </main>

      <AiProcessingCircleLoader
        isOpen={showCircleLoader}
        tasks={runningTasks}
        title="AI विश्लेषण पूर्ण हो रहा है..."
        subtitle="कृपया प्रतीक्षा करें, पृष्ठभूमि में सभी जाँचे गए सामानों का AI सत्यापन पूर्ण किया जा रहा है।"
      />
    </div>
  );
};
