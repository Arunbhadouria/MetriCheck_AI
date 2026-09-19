import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scan, Search, ShieldCheck, AlertTriangle, ArrowRight, BookOpen,
  Scale, PhoneCall, CheckCircle2, ChevronRight, Sparkles, Volume2, Store
} from 'lucide-react';

export const CitizenHome: React.FC = () => {
  const navigate = useNavigate();
  const [trackInput, setTrackInput] = useState('');

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackInput.trim()) {
      navigate(`/consumer/track?id=${encodeURIComponent(trackInput.trim())}`);
    }
  };

  const sampleProducts = [
    {
      id: 'demo_chips',
      name: 'Lays Classic Salted Chips 50g',
      brand: 'Lays / PepsiCo',
      mrp: 20,
      stickerPrice: 25,
      issue: '⚠️ अवैध स्टिकर: ₹5 अधिक वसूली',
      issueType: 'VIOLATION'
    },
    {
      id: 'demo_milk',
      name: 'Amul Taaza Toned Milk 1L',
      brand: 'Amul',
      mrp: 54,
      stickerPrice: 58,
      issue: '⚠️ ₹4 अतिरिक्त चार्जिंग (दुकानदार ओवरचार्जिंग)',
      issueType: 'VIOLATION'
    },
    {
      id: 'demo_biscuit',
      name: 'Parle-G Gold Biscuits 100g',
      brand: 'Parle',
      mrp: 10,
      issue: '✅ पूर्ण वैध (100% Compliant Package)',
      issueType: 'PASS'
    }
  ];

  return (
    <div className="gov-page text-base-content min-h-screen pb-24 font-sans">
      {/* ══ TOP GOVERNMENT HEADER ══════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 bg-navy-950 text-white shadow-md">
        <div className="gov-tricolor" />
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-navy-950 font-extrabold flex items-center justify-center text-sm shadow-md">
              म
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
                MetriCheck Citizen • नागरिक पोर्टल
              </h1>
              <p className="text-[10px] text-slate-300 font-medium">
                विधिक मापविज्ञान • उपभोक्ता मूल्य व गुणवत्ता सत्यापन
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 px-2.5 py-1.5 rounded-lg border border-amber-500/40 hover:bg-amber-500/10 transition cursor-pointer"
          >
            अधिकारी प्रवेश • Officer Login
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-4">
        {/* ══ CITIZEN HERO SCAN CARD ═════════════════════════════════════════ */}
        <div className="gov-card p-5 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 text-white border-2 border-amber-500/40 shadow-xl space-y-4 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                <Sparkles className="w-3 h-3" />
                <span>AI पावर्ड पैकेट स्कैनर</span>
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white pt-1">
                मुद्रित MRP व वैधता की तुरंत जांच करें
              </h2>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                खरीदते समय पैकेट को कैमरे के सामने लाएं। वॉयस AI बोलकर असली कीमत बताएगा और अधिक वसूली पकड़ेगा।
              </p>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={() => navigate('/consumer/scan')}
            className="btn btn-primary w-full py-4 text-sm sm:text-base font-black flex items-center justify-center gap-2.5 shadow-lg shadow-orange-600/30 active:scale-[0.99] cursor-pointer"
          >
            <Scan className="w-5 h-5 shrink-0" />
            <span>उत्पाद पैकेट स्कैन करें • Scan Package</span>
          </button>

          {/* Feature Micro-Badges */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              <Volume2 className="w-4 h-4 mx-auto text-amber-400 mb-1" />
              <div className="text-[10px] font-bold text-slate-200">वॉयस AI घोषणा</div>
              <div className="text-[9px] text-slate-400">Hindi & English</div>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              <AlertTriangle className="w-4 h-4 mx-auto text-red-400 mb-1" />
              <div className="text-[10px] font-bold text-slate-200">अवैध स्टिकर पहचान</div>
              <div className="text-[9px] text-slate-400">Anti-Overcharge</div>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              <Scale className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
              <div className="text-[10px] font-bold text-slate-200">1-टैप शिकायत</div>
              <div className="text-[9px] text-slate-400">Direct Officer Link</div>
            </div>
          </div>
        </div>

        {/* ══ TRACK EXISTING COMPLAINT ═══════════════════════════════════════ */}
        <div className="gov-card p-4 space-y-3 bg-white">
          <div className="flex items-center gap-2 text-navy-950">
            <Search className="w-4 h-4 text-orange-600 shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold">शिकायत की स्थिति जांचें • Track Grievance</h3>
          </div>
          <form onSubmit={handleTrackSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="उदा. LM-CITIZEN-2026-9041"
              value={trackInput}
              onChange={(e) => setTrackInput(e.target.value)}
              className="input input-bordered flex-1 text-xs font-semibold bg-slate-50 uppercase placeholder:normal-case"
              required
            />
            <button
              type="submit"
              className="btn btn-neutral text-xs font-bold px-4 shrink-0 cursor-pointer"
            >
              स्थिति देखें
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span>नमूना आईडी: <b>LM-CITIZEN-2026-9041</b></span>
            <button
              type="button"
              onClick={() => navigate('/consumer/track?id=LM-CITIZEN-2026-9041')}
              className="text-orange-700 font-bold hover:underline"
            >
              डेमो शिकायत देखें →
            </button>
          </div>
        </div>

        {/* ══ POPULAR DEMO SCENARIOS ═════════════════════════════════════════ */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-950">
              त्वरित परीक्षण नमूने • Instant Test Samples
            </h3>
            <span className="text-[10px] font-semibold text-slate-500">टैप करके जांचें</span>
          </div>

          <div className="space-y-2">
            {sampleProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/consumer/scan?sample=${p.id}`)}
                className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-xs flex items-center justify-between transition cursor-pointer group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/consumer/scan?sample=${p.id}`);
                  }
                }}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-navy-950 truncate group-hover:text-orange-600 transition">
                      {p.name}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-600">
                      MRP: ₹{p.mrp}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold mt-1">
                    <span className={p.issueType === 'VIOLATION' ? 'text-red-700' : 'text-emerald-700'}>
                      {p.issue}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* ══ STATUTORY CITIZEN RIGHTS GUIDE ═════════════════════════════════ */}
        <div className="gov-card p-4 bg-amber-50/70 border border-amber-200/80 space-y-2.5">
          <div className="flex items-center gap-2 text-amber-950">
            <Scale className="w-4 h-4 text-amber-700 shrink-0" />
            <h4 className="text-xs font-bold">उपभोक्ता अधिकार • Legal Metrology Act, 2009</h4>
          </div>
          <div className="text-xs text-amber-900/90 space-y-1.5 font-medium leading-relaxed">
            <p>
              • <b>धारा 36 (Section 36)</b>: मुद्रित अधिकतम मूल्य (MRP) से एक रुपया भी अधिक लेना गैर-कानूनी है। पहली बार उल्लंघन पर <b>₹25,000 तक का जुर्माना</b> है।
            </p>
            <p>
              • <b>नियम 6 (Rule 6)</b>: हर पैकेट पर उत्पाद का नाम, शुद्ध वजन, निर्माण तिथि, एक्सपायरी, निर्माता का पूरा पता और कस्टमर केयर नंबर अनिवार्य है।
            </p>
          </div>
          <div className="pt-1 flex items-center justify-between border-t border-amber-200/60 text-[11px] font-bold text-amber-900">
            <span className="flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5 text-amber-700" />
              राष्ट्रीय हेल्पलाइन: 1915 (Toll Free)
            </span>
            <button
              onClick={() => navigate('/consumer/dashboard?tab=rights')}
              className="text-orange-800 hover:underline cursor-pointer"
            >
              अधिकार विवरण देखें →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
