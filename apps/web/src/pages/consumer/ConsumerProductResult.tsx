import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Volume2, VolumeX, AlertTriangle, CheckCircle2, ShieldAlert, ArrowLeft,
  Scale, MessageSquare, FileWarning, RefreshCw, Send, ChevronRight, Copy, Check,
  PlusCircle, Layers, Bookmark
} from 'lucide-react';
import { voiceAi } from '../../services/voiceAi';
import { ScannedConsumerProduct } from './ConsumerScanner';

export const ConsumerProductResult: React.FC = () => {
  const navigate = useNavigate();
  const [product, setProduct] = useState<ScannedConsumerProduct | null>(null);
  const [cartCount, setCartCount] = useState<number>(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechLang, setSpeechLang] = useState<'hi' | 'en'>('hi');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [copiedDispute, setCopiedDispute] = useState(false);

  useEffect(() => {
    const rawCart = sessionStorage.getItem('metricheck_consumer_cart');
    if (rawCart) {
      try {
        const parsed = JSON.parse(rawCart);
        if (Array.isArray(parsed)) setCartCount(parsed.length);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem('metricheck_consumer_product');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setProduct(parsed);
        // Automatically announce in Hindi on mount
        setTimeout(() => {
          handlePlayVoice(parsed, 'hi');
        }, 500);
      } catch {
        navigate('/consumer/scan');
      }
    } else {
      navigate('/consumer/scan');
    }

    return () => {
      voiceAi.stop();
    };
  }, [navigate]);

  const handlePlayVoice = (prod: ScannedConsumerProduct = product!, lang: 'hi' | 'en' = speechLang) => {
    if (!prod) return;
    setSpeechLang(lang);
    voiceAi.speakProductAnnouncement(
      {
        productName: prod.name,
        brand: prod.brand,
        mrp: prod.printedMrp,
        stickerPrice: prod.stickerPrice,
        expiryDate: prod.expiryDate,
        netWeight: prod.netWeight,
        violations: prod.violations,
        lang
      },
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const handleStopVoice = () => {
    voiceAi.stop();
    setIsSpeaking(false);
  };

  const hasDualPrice = !!(product?.stickerPrice && product.stickerPrice > product.printedMrp);
  const isPass = product?.status === 'PASS';

  const disputeText = product ? `विधिक मापविज्ञान अधिनियम 2009 (धारा 36) सूचना:
दुकानदार महोदय, इस उत्पाद "${product.name}" पर मुद्रित अधिकतम मूल्य (MRP) ₹${product.printedMrp} है। आपसे ₹${product.stickerPrice || product.printedMrp} मांगा गया है। मुद्रित MRP से अधिक वसूली एक संज्ञेय अपराध है जिसपर ₹25,000 तक का जुर्माना देय है। कृपया मुद्रित MRP ही चार्ज करें।` : '';

  const handleCopyDispute = () => {
    navigator.clipboard.writeText(disputeText);
    setCopiedDispute(true);
    setTimeout(() => setCopiedDispute(false), 2000);
  };

  const handleSaveToHistory = () => {
    voiceAi.stop();
    const citizenUser = localStorage.getItem('metricheck_citizen_user');
    if (!citizenUser) {
      navigate('/consumer/auth?redirect=history');
      return;
    }

    // Citizen is authenticated: save to history
    if (product) {
      try {
        const rawHistory = localStorage.getItem('metricheck_citizen_history');
        const existing = rawHistory ? JSON.parse(rawHistory) : [];
        const itemToSave = {
          ...product,
          scannedAt: new Date().toISOString(),
          storeName: 'गुप्ता किराना एवं जनरल स्टोर्स, इंदौर'
        };
        localStorage.setItem('metricheck_citizen_history', JSON.stringify([itemToSave, ...existing]));
      } catch (e) {
        console.warn('Error saving to history', e);
      }
    }
    navigate('/consumer/dashboard?tab=history');
  };

  const handleProceedToComplaint = () => {
    voiceAi.stop();
    const citizenUser = localStorage.getItem('metricheck_citizen_user');
    if (!citizenUser) {
      navigate('/consumer/auth?redirect=complaint');
      return;
    }
    navigate('/consumer/complaint');
  };

  if (!product) return null;

  return (
    <div className="gov-page text-base-content min-h-screen pb-28 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-navy-950 text-white shadow-md">
        <div className="gov-tricolor" />
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              voiceAi.stop();
              navigate('/consumer/scan');
            }}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition active:scale-95 cursor-pointer"
            aria-label="Re-scan product"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <h1 className="text-xs font-bold text-white uppercase tracking-wider">
              सत्यापन परिणाम • Scan Verdict
            </h1>
            <p className="text-[10px] text-slate-300 font-mono">
              Barcode: {product.barcode}
            </p>
          </div>
          <button
            onClick={() => navigate('/consumer/scan')}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-amber-400 transition active:scale-95 cursor-pointer"
            title="Scan Another"
            aria-label="Scan another product"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-xl lg:max-w-4xl xl:max-w-5xl mx-auto p-4 md:p-6 space-y-5">
        {/* ══ 1. VOICE AI AUDIO ANNOUNCEMENT BAR ═════════════════════════════ */}
        <div className="gov-card p-4 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 text-white border border-amber-500/30 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md transition-all ${
                isSpeaking ? 'bg-amber-400 text-navy-950 animate-pulse' : 'bg-white/10 text-amber-300'
              }`}>
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
                  वॉयस AI उद्घोषणा • Voice AI Assistant
                  {isSpeaking && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </h2>
                <p className="text-[11px] text-slate-300 font-medium">
                  {isSpeaking ? 'ऑडियो चल रहा है • Speaking…' : 'बोलकर सुनने हेतु टैप करें'}
                </p>
              </div>
            </div>

            {/* Language Switcher Buttons */}
            <div className="flex items-center bg-white/10 rounded-xl p-1 text-xs font-bold">
              <button
                onClick={() => handlePlayVoice(product, 'hi')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  speechLang === 'hi' ? 'bg-amber-500 text-navy-950 shadow-xs' : 'text-slate-300'
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => handlePlayVoice(product, 'en')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  speechLang === 'en' ? 'bg-amber-500 text-navy-950 shadow-xs' : 'text-slate-300'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2 pt-1">
            {isSpeaking ? (
              <button
                onClick={handleStopVoice}
                className="btn btn-error btn-sm w-full font-bold text-xs gap-1.5 cursor-pointer"
              >
                <VolumeX className="w-4 h-4" />
                <span>ऑडियो रोकें • Stop Audio</span>
              </button>
            ) : (
              <button
                onClick={() => handlePlayVoice(product, speechLang)}
                className="btn btn-primary btn-sm w-full font-bold text-xs gap-1.5 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>{speechLang === 'hi' ? 'दोबारा हिन्दी में सुनें' : 'Play English Audio'}</span>
              </button>
            )}
          </div>
        </div>

        {/* ══ 2. PRODUCT PRICING & VERDICT CARD ══════════════════════════════ */}
        <div className="gov-card p-5 bg-white border-2 border-slate-200 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                {product.brand}
              </span>
              <h3 className="text-base font-bold text-navy-950 mt-0.5">
                {product.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                शुद्ध मात्रा: <b>{product.netWeight}</b> • इकाई दर: <b>{product.unitSalePrice}</b>
              </p>
            </div>
            <span className={`badge badge-md gap-1 font-bold shrink-0 ${
              isPass ? 'badge-success text-white' : 'badge-error text-white'
            }`}>
              {isPass ? <><CheckCircle2 className="w-3.5 h-3.5" /> वैध (Pass)</> : <><AlertTriangle className="w-3.5 h-3.5" /> उल्लंघन (Alert)</>}
            </span>
          </div>

          {/* Big Price Display & Overcharging Callout */}
          <div className={`p-4 rounded-2xl border-2 flex items-center justify-between ${
            hasDualPrice 
              ? 'bg-red-50/80 border-red-400 text-red-950' 
              : 'bg-emerald-50/80 border-emerald-400 text-emerald-950'
          }`}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-600">
                आधिकारिक मुद्रित मूल्य (Printed MRP)
              </span>
              <div className="text-3xl font-black text-navy-950 mt-0.5">
                ₹{product.printedMrp}
                <span className="text-xs font-normal text-slate-600 ml-1.5">(सभी कर सहित)</span>
              </div>
            </div>

            {hasDualPrice ? (
              <div className="text-right">
                <span className="badge badge-error text-white font-bold text-[10px]">
                  अवैध स्टिकर
                </span>
                <div className="text-xl font-extrabold text-red-600 mt-0.5">
                  ₹{product.stickerPrice}
                </div>
                <div className="text-[11px] font-black text-red-700">
                  +₹{product.stickerPrice! - product.printedMrp} अधिक वसूली
                </div>
              </div>
            ) : (
              <div className="text-right">
                <span className="badge badge-success text-white font-bold text-[10px]">
                  सत्यापित दर
                </span>
                <div className="text-xs font-bold text-emerald-800 mt-1">
                  कोई अतिरिक्त शुल्क नहीं
                </div>
              </div>
            )}
          </div>

          {/* Statutory Violations List */}
          {product.violations.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>पहचाने गए विधिक उल्लंघन • Detected Violations:</span>
              </div>
              <ul className="space-y-1 text-xs font-semibold text-amber-900 list-disc pl-5">
                {hasDualPrice && (
                  <li>
                    <b>धारा 36(1) का उल्लंघन</b>: मुद्रित मूल्य ₹{product.printedMrp} पर ₹{product.stickerPrice} का स्टिकर चिपकाकर अधिक दर वसूली।
                  </li>
                )}
                {product.violations.includes('EXPIRED_PRODUCT') && (
                  <li className="text-red-700">
                    <b>समाप्ति तिथि पार</b>: यह पैकेट {product.expiryDate} को एक्सपायर हो चुका है। इसे बेचना गैर-कानूनी है।
                  </li>
                )}
                {product.violations.includes('RULE_6_EXPIRY_BREACH') && (
                  <li>
                    <b>नियम 6 उल्लंघन</b>: अनिवार्य तिथि घोषणा में विसंगति पाई गई।
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Statutory Package Details Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold block">निर्माण तिथि (Mfg)</span>
              <span className="font-semibold text-navy-950">{product.mfgDate}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold block">उपभोग अंतिम तिथि (Expiry)</span>
              <span className="font-semibold text-navy-950">{product.expiryDate}</span>
            </div>
          </div>

          {/* Customer Care & Manufacturer Info */}
          <div className="text-[11px] text-slate-500 space-y-1 pt-1">
            <p><b>निर्माता</b>: {product.manufacturer}</p>
            <p><b>कस्टमर केयर</b>: {product.customerCare}</p>
          </div>
        </div>

        {/* ══ 3. COUNTER DISPUTE TOOL & WHATSAPP SLIP ════════════════════════ */}
        {hasDualPrice && (
          <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 flex items-center justify-between gap-3 shadow-xs">
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-indigo-950">
                दुकानदार से अभी सही दाम पर सामान लें
              </h4>
              <p className="text-[11px] text-indigo-800 mt-0.5">
                दुकानदार को काउंटर पर धारा 36 का नियम व ₹25,000 जुर्माने का नोटिस दिखाएं।
              </p>
            </div>
            <button
              onClick={() => setShowDisputeModal(true)}
              className="btn btn-neutral btn-sm text-xs font-bold shrink-0 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>नियम पर्ची</span>
            </button>
          </div>
        )}

        {/* ══ 4. MULTI-PRODUCT ACTIONS & GRIEVANCE BUTTON ═══════════════════ */}
        <div className="space-y-2.5 pt-1">
          {/* Secondary Action Grid: Add Next Product + View All Products */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                voiceAi.stop();
                navigate('/consumer/scan');
              }}
              className="btn bg-white hover:bg-slate-100 border border-slate-300 text-navy-950 font-bold text-xs sm:text-sm py-3 flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-orange-600 shrink-0" />
              <span>अगला सामान जोड़ें • Add Next</span>
            </button>

            <button
              onClick={() => {
                voiceAi.stop();
                navigate('/consumer/summary');
              }}
              className="btn bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs sm:text-sm py-3 flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-md shadow-purple-900/25 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-amber-400 shrink-0" />
              <span>जाँच पूर्ण करें • Complete ({cartCount}) →</span>
            </button>
          </div>

          {/* Action Row: Save to History + File Complaint */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleSaveToHistory}
              className="btn bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs sm:text-sm py-3.5 flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-md cursor-pointer"
            >
              <Bookmark className="w-4 h-4 text-amber-400 shrink-0" />
              <span>इतिहास में सहेजें • Save to History</span>
            </button>

            <button
              onClick={handleProceedToComplaint}
              className="btn btn-primary font-black text-xs sm:text-sm py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 active:scale-[0.98] cursor-pointer"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>अधिकारी को शिकायत भेजें • File Complaint</span>
            </button>
          </div>

          <p className="text-center text-[10px] text-slate-500 font-medium">
            आपकी शिकायत आपके मंडल (Zone) के पंजीकृत विधिक मापविज्ञान अधिकारी को सीधे भेजी जाएगी।
          </p>
        </div>
      </main>

      {/* ══ DISPUTE SLIP MODAL ═══════════════════════════════════════════════ */}
      {showDisputeModal && (
        <div className="modal modal-open" role="dialog" aria-modal="true">
          <div className="modal-box bg-white border border-slate-300 p-5 space-y-4 max-w-md">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                <Scale className="w-4 h-4 text-orange-600" />
                <span>दुकानदार सूचना पर्ची • Counter Dispute Notice</span>
              </h3>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="btn btn-ghost btn-xs btn-circle"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
              {disputeText}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCopyDispute}
                className="btn btn-neutral flex-1 font-bold text-xs gap-1.5"
              >
                {copiedDispute ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedDispute ? 'कॉपी हो गया!' : 'टेक्स्ट कॉपी करें'}</span>
              </button>
              <button
                onClick={() => {
                  const url = `https://wa.me/?text=${encodeURIComponent(disputeText)}`;
                  window.open(url, '_blank');
                }}
                className="btn btn-success text-white flex-1 font-bold text-xs gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp पर भेजें</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
