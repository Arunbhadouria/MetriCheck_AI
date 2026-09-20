import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Home, Clock, AlertTriangle, ShieldCheck, CheckCircle2,
  PlusCircle, Search, Volume2, ArrowRight, ExternalLink,
  BookOpen, LogOut, Menu, X, ShoppingBag, User, Store,
  MapPin, Phone, MessageSquare, RefreshCw, Send, ChevronRight,
  ShieldAlert, Sparkles, Award, Layers, Scale, Trash2
} from 'lucide-react';
import { voiceAi } from '../../services/voiceAi';
import { fetchApi } from '../../services/api';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import {
  getCitizenHistory,
  saveCitizenHistory,
  clearCitizenHistory,
  DEMO_CITIZEN_HISTORY
} from '../../services/consumerStorage';

export const ConsumerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'OVERVIEW';

  // Navigation Tabs: 'OVERVIEW' | 'HISTORY' | 'GRIEVANCES' | 'RIGHTS'
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HISTORY' | 'GRIEVANCES' | 'RIGHTS'>(
    ['OVERVIEW', 'HISTORY', 'GRIEVANCES', 'RIGHTS'].includes(initialTab.toUpperCase())
      ? initialTab.toUpperCase()
      : 'OVERVIEW'
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [speakingProductId, setSpeakingProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Citizen Profile
  const [citizenUser, setCitizenUser] = useState<any>(() => {
    try {
      const raw = localStorage.getItem('metricheck_citizen_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // History & Complaints State
  const [history, setHistory] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  useEffect(() => {
    // If not logged in, redirect to consumer login
    if (!citizenUser) {
      navigate('/consumer/auth');
      return;
    }

    // Load Scan History from phone-scoped storage
    try {
      const citizenScans = getCitizenHistory(citizenUser.phone);
      setHistory(citizenScans);
    } catch (e) {
      console.warn('Failed to load scan history:', e);
    }

    // Load Citizen Complaints from API (strictly filtered by citizen's phone number)
    setLoadingComplaints(true);
    const complaintsUrl = citizenUser.phone
      ? `/complaints?phone=${encodeURIComponent(citizenUser.phone)}`
      : '/complaints';

    fetchApi<any>(complaintsUrl)
      .then(res => {
        const data = res?.data || res || [];
        setComplaints(Array.isArray(data) ? data : []);
      })
      .catch(() => setComplaints([]))
      .finally(() => setLoadingComplaints(false));
  }, [citizenUser, navigate]);

  // Real-time background sync for grievances every 5 seconds (scoped to phone)
  useEffect(() => {
    if (!citizenUser?.phone) return;
    const complaintsUrl = `/complaints?phone=${encodeURIComponent(citizenUser.phone)}`;
    const interval = setInterval(() => {
      fetchApi<any>(complaintsUrl)
        .then(res => {
          const data = res?.data || res || [];
          if (Array.isArray(data)) {
            setComplaints(data);
          }
        })
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [citizenUser]);

  const handleLoadDemoData = () => {
    saveCitizenHistory(DEMO_CITIZEN_HISTORY, citizenUser?.phone);
    setHistory(DEMO_CITIZEN_HISTORY);
  };

  const handleClearHistory = () => {
    if (window.confirm('क्या आप वाकई अपना स्कैन इतिहास हटाना चाहते हैं?')) {
      clearCitizenHistory(citizenUser?.phone);
      setHistory([]);
    }
  };

  // Keep active tab in sync with URL parameters (from NavigationDrawer or browser back/forward)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      const upper = tabParam.toUpperCase();
      if (['OVERVIEW', 'HISTORY', 'GRIEVANCES', 'RIGHTS'].includes(upper)) {
        setActiveTab(upper as any);
      }
    } else {
      setActiveTab('OVERVIEW');
    }
  }, [searchParams]);

  const handleTabChange = (t: 'OVERVIEW' | 'HISTORY' | 'GRIEVANCES' | 'RIGHTS') => {
    setActiveTab(t);
    setSearchParams(t === 'OVERVIEW' ? {} : { tab: t.toLowerCase() });
  };

  const handleLogout = () => {
    if (window.confirm('क्या आप नागरिक खाते से लॉगआउट करना चाहते हैं?')) {
      localStorage.removeItem('metricheck_citizen_token');
      localStorage.removeItem('metricheck_citizen_user');
      navigate('/');
    }
  };

  const handlePlayVoice = (item: any) => {
    if (speakingProductId === item.id) {
      voiceAi.stop();
      setSpeakingProductId(null);
      return;
    }

    setSpeakingProductId(item.id);
    voiceAi.speakProductAnnouncement(
      {
        productName: item.name,
        brand: item.brand,
        mrp: item.printedMrp,
        stickerPrice: item.stickerPrice,
        expiryDate: item.expiryDate,
        violations: item.violations || [],
        lang: 'hi'
      },
      () => setSpeakingProductId(item.id),
      () => setSpeakingProductId(null)
    );
  };

  // Metrics
  const totalScans = history.length;
  const violationScans = history.filter(h => h.status === 'VIOLATION' || (h.violations && h.violations.length > 0));
  const totalOvercharge = history.reduce((acc, h) => {
    if (h.stickerPrice && h.stickerPrice > h.printedMrp) {
      return acc + (h.stickerPrice - h.printedMrp);
    }
    return acc;
  }, 0);
  const resolvedComplaints = complaints.filter(c => c.status === 'RESOLVED').length;

  // Filtered history
  const filteredHistory = history.filter(h => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (h.name || '').toLowerCase().includes(q) ||
      (h.brand || '').toLowerCase().includes(q) ||
      (h.storeName || '').toLowerCase().includes(q)
    );
  });

  if (!citizenUser) return null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans select-none">
      {/* Top Gov Tricolor Bar */}
      <div className="gov-tricolor" />

      {/* ══ TOP NAVBAR ═════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 bg-navy-950 text-white px-3 sm:px-4 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Hamburger Menu Button (Inspector Style) */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/60 shadow-xs flex items-center justify-center shrink-0 transition active:scale-95 cursor-pointer"
            aria-label="Open Navigation Menu"
            aria-expanded={drawerOpen}
            aria-haspopup="dialog"
            title="मेनू • Menu"
          >
            <Menu className="w-4 h-4 text-amber-400 shrink-0" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-black text-sm shadow-md shrink-0">
              ना
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate">
                <span className="truncate">उपभोक्ता संरक्षण डैशबोर्ड</span>
                <span className="badge badge-warning badge-xs font-bold text-[9px] shrink-0">CITIZEN</span>
              </h1>
              <p className="text-[9px] sm:text-[10px] text-slate-300 truncate">विधिक माप विज्ञान पोर्टल • Legal Metrology</p>
            </div>
          </div>
        </div>

        {/* Right User Status */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/consumer/scan')}
            className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">नया स्कैन करें</span>
            <span className="sm:hidden">स्कैन</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/15 text-right">
            <div>
              <span className="text-xs font-bold block text-white">{citizenUser.name}</span>
              <span className="text-[10px] text-emerald-400 font-semibold block">सत्यापित नागरिक</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-purple-900 border border-purple-400 text-purple-200 flex items-center justify-center font-black text-xs">
              {citizenUser.name[0]}
            </div>
          </div>
        </div>
      </header>

      {/* ══ TOP VIEW TABS (INSPECTOR STYLE) ═════════════════════════════════ */}
      <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 pt-3.5 w-full print:hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <button
            type="button"
            onClick={() => handleTabChange('OVERVIEW')}
            className={`py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'bg-navy-900 text-white shadow-md shadow-navy-950/20'
                : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>अवलोकन • Overview</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('HISTORY')}
            className={`py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'bg-navy-900 text-white shadow-md shadow-navy-950/20'
                : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>स्कैन इतिहास</span>
            <span className={`badge badge-xs text-[10px] font-mono ${activeTab === 'HISTORY' ? 'badge-warning text-navy-950 font-bold' : 'badge-neutral'}`}>
              {history.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('GRIEVANCES')}
            className={`py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'GRIEVANCES'
                ? 'bg-navy-900 text-white shadow-md shadow-navy-950/20'
                : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>मेरी शिकायतें</span>
            <span className={`badge badge-xs text-[10px] font-mono ${activeTab === 'GRIEVANCES' ? 'badge-warning text-navy-950 font-bold' : 'badge-neutral'}`}>
              {complaints.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('RIGHTS')}
            className={`py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'RIGHTS'
                ? 'bg-navy-900 text-white shadow-md shadow-navy-950/20'
                : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>अधिकार • Rights</span>
          </button>
        </div>
      </div>

      {/* ══ MAIN BODY: CENTERED CONTENT ═════════════════════════════════════ */}
      <main className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto w-full p-4 md:p-6 space-y-5 flex-1">
          {/* ══ VIEW 1: OVERVIEW ═════════════════════════════════════════════ */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              {/* Welcome Hero Card */}
              <div className="gov-card p-5 bg-gradient-to-br from-navy-950 via-slate-900 to-navy-950 text-white border border-purple-500/30 shadow-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>नागरिक अधिकार व विधिक माप विज्ञान पोर्टल</span>
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                      नमस्ते, {citizenUser.name}!
                    </h2>
                    <p className="text-xs text-slate-300 max-w-lg">
                      आपके द्वारा सामान खरीदते समय स्कैन किए गए पैकेट, अधिक वसूली गई राशि का हिसाब और विधिक शिकायतों की स्थिति यहाँ सुरक्षित है।
                    </p>
                  </div>

                  <button
                    onClick={() => navigate('/consumer/scan')}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-navy-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/30 transition active:scale-95 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>पैकेट स्कैन करें • Scan Product</span>
                  </button>
                </div>

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">कुल जाँचे उत्पाद</span>
                    <span className="text-xl font-black text-white">{totalScans}</span>
                  </div>

                  <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-red-300 block uppercase">उल्लंघन दर्ज</span>
                    <span className="text-xl font-black text-red-400">{violationScans.length}</span>
                  </div>

                  <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-amber-300 block uppercase">कुल अवैध वसूली</span>
                    <span className="text-xl font-black text-amber-400">₹{totalOvercharge}</span>
                  </div>

                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-emerald-300 block uppercase">निस्तारित शिकायतें</span>
                    <span className="text-xl font-black text-emerald-400">{resolvedComplaints}</span>
                  </div>
                </div>
              </div>

              {/* ══ RESPONSIVE DESKTOP DUAL COLUMN SECTION ════════════════════ */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* LEFT COLUMN (lg:col-span-7): Recent Scan Highlights */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-purple-700" />
                      <span>हालिया स्कैन किए गए उत्पाद • Recent Scans</span>
                    </h3>
                    <button
                      onClick={() => handleTabChange('HISTORY')}
                      className="text-xs text-purple-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>सभी देखें ({history.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {history.length === 0 ? (
                      <div className="gov-card p-6 text-center space-y-3 col-span-full border-dashed border-2 border-slate-200">
                        <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto" />
                        <div>
                          <h4 className="text-xs font-bold text-navy-950">अभी तक कोई उत्पाद स्कैन नहीं किया गया</h4>
                          <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                            दुकान पर सामान खरीदते समय बारकोड व MRP जांचने के लिए स्कैनर शुरू करें।
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => navigate('/consumer/scan')}
                            className="btn btn-primary btn-xs text-xs font-bold gap-1 cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>सामान स्कैन करें • Scan Product</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleLoadDemoData}
                            className="btn btn-ghost btn-xs text-[11px] text-purple-700 hover:bg-purple-50 gap-1 cursor-pointer border border-purple-200"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>डेमो डेटा लोड करें • Load Sample Scans</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      history.slice(0, 4).map((item, idx) => {
                        const overcharge = item.stickerPrice && item.stickerPrice > item.printedMrp ? item.stickerPrice - item.printedMrp : 0;
                        const isPass = item.status === 'PASS';

                        return (
                          <div
                            key={item.id || idx}
                            className="gov-card p-3.5 hover:border-purple-300 transition shadow-xs flex items-start justify-between gap-3"
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-navy-950 truncate block">{item.name}</span>
                                {item.isDemo && (
                                  <span className="badge badge-ghost badge-xs text-[9px] font-bold text-purple-700">
                                    डेमो • Sample
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">
                                {item.storeName || 'किराना स्टोर, इंदौर'}
                              </p>
                              <div className="flex items-center gap-2 pt-0.5">
                                <span className="text-xs font-bold text-slate-800">MRP: ₹{item.printedMrp}</span>
                                {overcharge > 0 ? (
                                  <span className="badge badge-error badge-xs font-black text-white">
                                    +₹{overcharge} अधिशुल्क
                                  </span>
                                ) : (
                                  <span className="badge badge-success badge-xs font-bold text-white">
                                    सही मूल्य
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handlePlayVoice(item)}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition shrink-0 cursor-pointer ${
                                speakingProductId === item.id
                                  ? 'bg-amber-500 text-navy-950 animate-pulse'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                              title="Voice AI सुनें"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN (lg:col-span-5): Active Grievances + Statutory Toll-Free Help */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Active Grievances Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-orange-700" />
                        <span>आपकी दर्ज शिकायतें • Active Grievances</span>
                      </h3>
                      <button
                        onClick={() => handleTabChange('GRIEVANCES')}
                        className="text-xs text-purple-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>स्थिति देखें ({complaints.length})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {complaints.length === 0 ? (
                      <div className="gov-card p-6 text-center text-xs text-slate-500">
                        अभी तक कोई शिकायत दर्ज नहीं है। ओवरचार्जिंग होने पर आप सीधे 1-क्लिक में शिकायत भेज सकते हैं।
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {complaints.slice(0, 2).map((comp) => (
                          <div
                            key={comp.id}
                            className="gov-card p-3.5 hover:border-orange-300 transition flex flex-wrap items-center justify-between gap-2.5"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-navy-950">{comp.trackingId}</span>
                                <span className="badge badge-warning badge-xs font-bold">{comp.status}</span>
                              </div>
                              <p className="text-xs font-semibold text-slate-700 mt-0.5">{comp.productName}</p>
                              <p className="text-[11px] text-slate-500">{comp.storeName} • {comp.jurisdictionZone}</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => navigate(`/consumer/track?id=${comp.trackingId}`)}
                              className="py-1.5 px-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition active:scale-95"
                            >
                              <span>लाइव ट्रैक करें</span>
                              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Statutory Consumer Protection Hotline */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-start gap-3 shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 text-xs">
                      <h4 className="font-bold text-navy-950">राष्ट्रीय उपभोक्ता हेल्पलाइन (NCH)</h4>
                      <p className="text-[11px] text-indigo-950 mt-0.5">
                        मुद्रित MRP से अधिक वसूली होने पर टोल-फ्री <strong className="font-mono text-indigo-700 font-bold">1915</strong> या पोर्टल पर तुरंत शिकायत दर्ज कराएं।
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ VIEW 2: SCAN HISTORY ═════════════════════════════════════════ */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="text-sm font-bold text-navy-950">मेरी स्कैन हिस्ट्री • My Saved Scans</h3>
                  <p className="text-xs text-slate-500">आपके द्वारा जाँचे गए सभी उत्पादों का रिकॉर्ड</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="उत्पाद या दुकान का नाम खोजें..."
                      className="input input-sm input-bordered pl-9 text-xs bg-white w-full sm:w-64"
                    />
                  </div>

                  {history.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      className="btn btn-ghost btn-sm text-xs text-red-600 hover:bg-red-50 gap-1 cursor-pointer shrink-0"
                      title="स्कैन इतिहास हटाएं"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">इतिहास हटाएं</span>
                    </button>
                  )}
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="gov-card p-12 text-center space-y-3">
                  <Clock className="w-10 h-10 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-navy-900">कोई स्कैन इतिहास नहीं मिला</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    खरीददारी करते समय उत्पाद का पैकेट स्कैन करें, या मूल्यांकन के लिए नमूना डेटा लोड करें।
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => navigate('/consumer/scan')}
                      className="btn btn-primary btn-sm text-xs font-bold gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>स्कैनर खोलें • Open Scanner</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadDemoData}
                      className="btn btn-outline btn-sm text-xs text-purple-700 border-purple-300 hover:bg-purple-50 gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>डेमो डेटा लोड करें • Load Sample Scans</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredHistory.map((item, idx) => {
                    const overcharge = item.stickerPrice && item.stickerPrice > item.printedMrp ? item.stickerPrice - item.printedMrp : 0;
                    const isPass = item.status === 'PASS';

                    return (
                      <div
                        key={item.id || idx}
                        className="gov-card p-4 hover:border-purple-300 transition shadow-xs space-y-2.5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-navy-950">{item.name}</h4>
                              {item.isDemo && (
                                <span className="badge badge-ghost badge-xs text-[9px] font-bold text-purple-700">
                                  डेमो • Sample
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">
                              {item.brand} • स्कैन दिनांक: {new Date(item.scannedAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {isPass ? (
                              <span className="badge badge-success badge-xs font-bold text-white">पास • PASS</span>
                            ) : (
                              <span className="badge badge-error badge-xs font-bold text-white">उल्लंघन दर्ज</span>
                            )}

                            <button
                              type="button"
                              onClick={() => handlePlayVoice(item)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer ${
                                speakingProductId === item.id
                                  ? 'bg-amber-500 text-navy-950 animate-pulse'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                              title="Voice AI सुनें"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Price Details */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">मुद्रित MRP</span>
                            <span className="font-black text-slate-800 text-sm">₹{item.printedMrp}</span>
                          </div>

                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">वसूली गई राशि</span>
                            <span className={`font-black text-sm ${overcharge > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                              ₹{item.stickerPrice || item.printedMrp}
                            </span>
                          </div>

                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 sm:col-span-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">दुकान / स्थान</span>
                            <span className="font-semibold text-slate-700 text-xs truncate block">
                              {item.storeName || 'विजय नगर मार्केट, इंदौर'}
                            </span>
                          </div>
                        </div>

                        {/* Violations & Action */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex flex-wrap gap-1">
                            {item.violations && item.violations.length > 0 ? (
                              item.violations.map((v: string, vIdx: number) => (
                                <span key={vIdx} className="badge bg-red-100 text-red-800 border-red-300 font-bold text-[10px]">
                                  ⚠ {v.replace(/_/g, ' ')}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>सभी नियम घोषणाएँ पूर्ण</span>
                              </span>
                            )}
                          </div>

                          {overcharge > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                sessionStorage.setItem('metricheck_consumer_product', JSON.stringify(item));
                                navigate('/consumer/complaint');
                              }}
                              className="py-1 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <Send className="w-3 h-3" />
                              <span>शिकायत भेजें</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ VIEW 3: MY GRIEVANCES ════════════════════════════════════════ */}
          {activeTab === 'GRIEVANCES' && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-navy-950">मेरी शिकायतें • My Filed Complaints</h3>
                <p className="text-xs text-slate-500">विधिक माप विज्ञान अधिकारियों को भेजी गई शिकायतों का लाइव स्टेटस</p>
              </div>

              {loadingComplaints ? (
                <div className="gov-card p-12 text-center space-y-2">
                  <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold">शिकायतें लोड हो रही हैं…</p>
                </div>
              ) : complaints.length === 0 ? (
                <div className="gov-card p-12 text-center space-y-3">
                  <Scale className="w-10 h-10 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-navy-900">कोई लंबित शिकायत नहीं</h4>
                  <p className="text-xs text-slate-500">यदि कोई दुकानदार MRP से अधिक मूल्य लेता है, तो तुरंत शिकायत भेजें।</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.map((comp) => {
                    const overcharge = comp.chargedPrice && comp.declaredMrp ? comp.chargedPrice - comp.declaredMrp : 0;
                    return (
                      <div
                        key={comp.id}
                        className="gov-card p-4 hover:border-purple-300 transition shadow-xs space-y-3 border-l-4 border-l-purple-600"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-navy-950">{comp.trackingId}</span>
                              <span className="badge badge-warning badge-xs font-bold">{comp.status}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              दिनांक: {new Date(comp.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              {comp.jurisdictionZone && ` • ${comp.jurisdictionZone}`}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => navigate(`/consumer/track?id=${comp.trackingId}`)}
                            className="py-1.5 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-xs"
                          >
                            <span>विस्तृत ट्रैकिंग देखें</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">उत्पाद एवं अधिशुल्क</span>
                            <span className="font-bold text-navy-900 block">{comp.productName}</span>
                            <span className="text-slate-600">अंकित: ₹{comp.declaredMrp} → वसूली: ₹{comp.chargedPrice}</span>
                            {overcharge > 0 && (
                              <span className="badge badge-error badge-xs font-bold text-white ml-2">
                                +₹{overcharge} अवैध
                              </span>
                            )}
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">दुकानदार विवरण</span>
                            <span className="font-bold text-navy-900 block">{comp.storeName}</span>
                            <span className="text-slate-500 text-[11px] truncate block">{comp.storeAddress}</span>
                          </div>
                        </div>

                        {comp.officerRemarks && (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                            <strong>अधिकारी की टिप्पणी:</strong> {comp.officerRemarks}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ VIEW 4: RIGHTS & RULES ═══════════════════════════════════════ */}
          {activeTab === 'RIGHTS' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-navy-950">उपभोक्ता अधिकार एवं नियम • Statutory Rights</h3>
                <p className="text-xs text-slate-500">विधिक माप विज्ञान अधिनियम, 2009 के अंतर्गत उपभोक्ता अधिकार</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="gov-card p-4 space-y-2 border-l-4 border-l-orange-500">
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-orange-600" />
                    <h4 className="font-bold text-sm text-navy-950">धारा 36(1): MRP से अधिक वसूली पर रोक</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    कोई भी व्यापारी या खुदरा विक्रेता पैकेट पर मुद्रित अधिकतम खुदरा मूल्य (MRP) से अधिक मूल्य नहीं वसूल सकता।
                    पहली बार उल्लंघन पर <strong>₹25,000</strong> तक का जुर्माना और दूसरी बार पर <strong>₹50,000</strong> तक का जुर्माना या कारावास का प्रावधान है।
                  </p>
                </div>

                <div className="gov-card p-4 space-y-2 border-l-4 border-l-blue-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-sm text-navy-950">दोहरा स्टीकर लगाना पूर्णतः अवैध</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    मूल मुद्रित MRP पर नया स्टीकर चिपका कर मूल्य बढ़ाना कानूनन अवैध है। यदि किसी उत्पाद पर अतिरिक्त स्टीकर लगा हो, तो उपभोक्ता केवल मूल मुद्रित मूल्य देने के लिए बाध्य है।
                  </p>
                </div>

                <div className="gov-card p-4 space-y-2 border-l-4 border-l-emerald-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-sm text-navy-950">नियम 6: अनिवार्य पैकेज घोषणाएं</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    प्रत्येक बंद पैकेट पर: निर्माता का नाम व पता, शुद्ध वजन / मात्रा, निर्माण तिथि, समाप्ति तिथि (खाद्य पदार्थों हेतु), और उपभोक्ता हेल्पलाइन नंबर मुद्रित होना अनिवार्य है।
                  </p>
                </div>

                <div className="gov-card p-4 space-y-2 border-l-4 border-l-purple-500">
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-purple-600" />
                    <h4 className="font-bold text-sm text-navy-950">राष्ट्रीय उपभोक्ता हेल्पलाइन</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    टोल-फ्री हेल्पलाइन: <strong>1915</strong> या <strong>1800-11-4000</strong><br />
                    ऑनलाइन शिकायत पोर्टल: consumerhelpline.gov.in<br />
                    MetriCheck AI द्वारा दर्ज शिकायतें सीधे आपके क्षेत्रीय विधिक माप विज्ञान निरीक्षक को प्रेषित होती हैं।
                  </p>
                </div>
              </div>
            </div>
          )}
      </main>

      {/* Navigation Drawer (Overlay, exact Inspector design) */}
      <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
};
