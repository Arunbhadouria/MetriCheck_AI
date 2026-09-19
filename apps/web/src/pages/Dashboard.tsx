import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import {
  Plus, Search, RefreshCw, ChevronRight, Layers, Clock, ShieldCheck,
  CheckCircle2, AlertOctagon, UserCheck, Award, Printer, Copy, Check,
  MapPin, Phone, Mail, Building2, Calendar, FileText, Sparkles,
  ArrowLeft, ExternalLink, User, Scan, BookOpen, MessageSquare
} from 'lucide-react';
import { fetchApi } from '../services/api';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation state: 'DASHBOARD' | 'ID_CARD'
  const [mainView, setMainView] = useState<'DASHBOARD' | 'ID_CARD'>(() => {
    return searchParams.get('tab') === 'id_card' ? 'ID_CARD' : 'DASHBOARD';
  });

  // Keep state in sync with URL search params
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'id_card') {
      setMainView('ID_CARD');
    } else if (tabParam === 'dashboard' || !tabParam) {
      setMainView('DASHBOARD');
    }
  }, [searchParams]);

  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'FAIL' | 'PASS'>('ALL');
  const [copiedId, setCopiedId] = useState(false);

  // Officer Profile State initialized from localStorage with background refresh from /auth/me
  const [user, setUser] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem('metricheck_user') || '{}');
    } catch {
      return {};
    }
  });

  const loadData = () => {
    setLoading(true);

    // Fetch real dashboard metrics from backend
    fetchApi<any>('/dashboard/summary')
      .then(res => setSummary(res?.data || res))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));

    // Refresh current officer profile from DB
    fetchApi<any>('/auth/me')
      .then(res => {
        if (res?.data) {
          setUser(res.data);
          localStorage.setItem('metricheck_user', JSON.stringify(res.data));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const officerName = user?.name || 'Amit Verma';
  const officerEmpId = user?.employeeId || 'LM-MP-0421';
  const officerState = user?.jurisdictionState || 'Madhya Pradesh';
  const officerDistrict = user?.jurisdictionDistrict || 'Indore';
  const officerZone = user?.jurisdictionZone || 'Zone 08 — Central Market';
  const officerDepartment = user?.department || `${officerState} Legal Metrology Department • विधिक माप विज्ञान विभाग`;
  const officerEmail = user?.email || 'officer@lm.gov.in';
  const officerPhone = user?.mobileNumber || '9876543210';
  const officerRole = user?.role || 'INSPECTOR';

  const issueDateFormatted = (() => {
    try {
      if (user?.createdAt) {
        return new Date(user.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
    } catch {}
    return '17 Sep 2026';
  })();

  const initials = officerName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'AV';

  // Copy Officer Unique Code to clipboard
  const handleCopyOfficerId = () => {
    navigator.clipboard.writeText(officerEmpId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  // Print ID Badge
  const handlePrintIdCard = () => {
    window.print();
  };

  // Real inspections from summary
  const allInspections = summary?.recentInspections || [];

  const filteredInspections = allInspections.filter((insp: any) => {
    const matchesSearch =
      (insp.shopName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (insp.inspectionNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (insp.locationAddress || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === 'FAIL') return insp.products?.some((p: any) => p.complianceStatus === 'FAIL');
    if (activeTab === 'PASS') return insp.products?.every((p: any) => p.complianceStatus === 'PASS');
    return true;
  });

  return (
    <div className="gov-page text-base-content pb-24">
      <Header title="निरीक्षक पोर्टल • Officer Portal" showBack={false} />

      {/* Top View Toggle Navigation */}
      <div className="max-w-xl mx-auto px-4 pt-3 print:hidden">
        <div className="grid grid-cols-2 p-1 bg-white border border-base-300 rounded-xl shadow-xs">
          <button
            type="button"
            onClick={() => {
              setMainView('DASHBOARD');
              setSearchParams({});
            }}
            className={`py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mainView === 'DASHBOARD'
                ? 'bg-navy-900 text-white shadow-md shadow-navy-950/20'
                : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-400 shrink-0" />
            <span>कार्यक्षेत्र डैशबोर्ड • Operations</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMainView('ID_CARD');
              setSearchParams({ tab: 'id_card' });
            }}
            className={`py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mainView === 'ID_CARD'
                ? 'bg-navy-900 text-white shadow-md shadow-navy-950/20'
                : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>पहचान पत्र • Official ID Card</span>
          </button>
        </div>
      </div>

      <div className="max-w-xl lg:max-w-5xl xl:max-w-6xl mx-auto p-4 md:p-6 space-y-5">
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── VIEW 1: DASHBOARD OPERATIONS ──────────────────────────────────── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {mainView === 'DASHBOARD' && (
          <>
            {/* Officer Summary Card */}
            <div className="gov-card overflow-hidden">
              <div className="card-body p-4 sm:p-5">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    <div className="avatar placeholder">
                      <div className="bg-navy-900 text-white font-bold rounded-xl w-12 h-12 text-lg shadow-sm border border-navy-800">
                        {initials}
                      </div>
                    </div>
                    <div>
                      <div className="badge badge-ghost badge-xs font-semibold uppercase tracking-wider mb-0.5 text-orange-700 bg-orange-50 border-orange-100">
                        Legal Metrology Inspector
                      </div>
                      <h2 className="text-base font-bold text-navy-900 tracking-tight">{officerName}</h2>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                          {officerEmpId}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate max-w-[180px] sm:max-w-xs">
                          • {officerZone}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setMainView('ID_CARD')}
                      className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer transition"
                      title="View Official ID Card"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>ID कार्ड</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem('metricheck_token');
                        localStorage.removeItem('metricheck_user');
                        navigate('/');
                      }}
                      className="text-[11px] text-red-600 hover:text-red-700 font-semibold cursor-pointer underline"
                    >
                      लॉगआउट • Logout
                    </button>
                  </div>
                </div>

                {/* Real Metrics Grid: 4 responsive tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
                  <div className="bg-base-200/80 border border-base-300 rounded-xl p-3 text-center">
                    <div className="text-[10px] uppercase font-semibold text-slate-500">कुल निरीक्षण</div>
                    <div className="text-xl font-bold text-navy-900 mt-0.5">
                      {summary ? summary.totalInspections : (loading ? '—' : 0)}
                    </div>
                    <div className="text-[9px] font-medium text-slate-400">Total Cases</div>
                  </div>

                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-center">
                    <div className="text-[10px] uppercase font-semibold text-emerald-800">सत्यापित अनुपालन</div>
                    <div className="text-xl font-bold text-emerald-700 mt-0.5">
                      {summary ? summary.compliant : (loading ? '—' : 0)}
                    </div>
                    <div className="text-[9px] font-medium text-emerald-600">PASS</div>
                  </div>

                  <div className="bg-red-50/70 border border-red-200 rounded-xl p-3 text-center">
                    <div className="text-[10px] uppercase font-semibold text-red-800">दर्ज उल्लंघन</div>
                    <div className="text-xl font-bold text-error mt-0.5">
                      {summary ? summary.nonCompliant : (loading ? '—' : 0)}
                    </div>
                    <div className="text-[9px] font-medium text-red-600">FAIL</div>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-center">
                    <div className="text-[10px] uppercase font-semibold text-amber-800">प्रक्रियाधीन / ड्राफ्ट</div>
                    <div className="text-xl font-bold text-amber-700 mt-0.5">
                      {summary ? (summary.pendingReview ?? 0) : (loading ? '—' : 0)}
                    </div>
                    <div className="text-[9px] font-medium text-amber-600">IN PROGRESS</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ══ RESPONSIVE DESKTOP DUAL COLUMN LAYOUT ══════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* LEFT COLUMN (lg:col-span-5): Quick Actions & Shortcuts */}
              <div className="lg:col-span-5 space-y-4">
                {/* ══ CLEAN OFFICER SCANNER CARD ════════════════════════════════ */}
                <div
                  onClick={() => navigate('/inspector/inspections/new')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate('/inspector/inspections/new');
                    }
                  }}
                  className="rounded-2xl bg-navy-950 text-white p-4 sm:p-5 cursor-pointer shadow-md hover:bg-navy-900 transition-all flex items-center justify-between group border border-amber-500/30"
                  role="button"
                  tabIndex={0}
                  aria-label="Start New Inspection"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-amber-500 text-navy-950 flex items-center justify-center font-bold shadow-md shrink-0 group-hover:scale-105 transition-transform">
                      <Scan className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                        नया निरीक्षण शुरू करें • Start Inspection
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        पैकेज स्कैन करने के लिए टैप करें
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </div>

                {/* ══ CITIZEN COMPLAINTS SHORTCUT CARD ════════════════════════════ */}
                <div
                  onClick={() => navigate('/inspector/inspections?tab=grievances')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate('/inspector/inspections?tab=grievances');
                    }
                  }}
                  className="p-3.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-300 flex items-center justify-between shadow-xs transition cursor-pointer group"
                  role="button"
                  tabIndex={0}
                  aria-label="View citizen complaints in this zone"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-amber-500 text-navy-950 flex items-center justify-center shrink-0 font-bold shadow-xs">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-navy-950 truncate">
                          नागरिक शिकायतें • Citizen Grievances
                        </h4>
                        <span className="badge badge-warning badge-xs font-bold text-[9px]">LIVE</span>
                      </div>
                      <p className="text-[11px] text-amber-900 truncate">
                        उपभोक्ताओं द्वारा दर्ज अधिक वसूली व अवैध स्टिकर मामले
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-amber-700 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>

                {/* ══ LAWS & CITIZEN AWARENESS SHORTCUT CARD ═════════════════════ */}
                <div
                  onClick={() => navigate('/inspector/laws')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate('/inspector/laws');
                    }
                  }}
                  className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-between shadow-xs transition cursor-pointer group"
                  role="button"
                  tabIndex={0}
                  aria-label="Open Legal Metrology Laws & Awareness Guide"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-navy-950 truncate">
                        विधिक नियम व अधिनियम • Acts & Rules
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        LMPC Rules 2011, Act 2009 एवं आधिकारिक वेबसाइट्स
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </div>

              {/* RIGHT COLUMN (lg:col-span-7): Search, Filter & Inspection Ledger */}
              <div className="lg:col-span-7 space-y-4">
                {/* Inspection Search Input */}
                <div className="form-control">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="दुकान का नाम, लाइसेंस नंबर या बाज़ार खोजें..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-bordered w-full pl-10 pr-3 text-xs sm:text-sm font-medium bg-white"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="tabs tabs-boxed bg-white border border-base-300 p-1 flex">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`tab tab-sm flex-1 font-semibold text-xs ${activeTab === 'ALL' ? 'tab-active' : 'text-slate-500'}`}
              >
                सभी (All: {allInspections.length})
              </button>
              <button
                onClick={() => setActiveTab('FAIL')}
                className={`tab tab-sm flex-1 font-semibold text-xs ${activeTab === 'FAIL' ? 'tab-active !bg-error !text-white' : 'text-error'}`}
              >
                उल्लंघन (Fail)
              </button>
              <button
                onClick={() => setActiveTab('PASS')}
                className={`tab tab-sm flex-1 font-semibold text-xs ${activeTab === 'PASS' ? 'tab-active !bg-success !text-white' : 'text-success'}`}
              >
                अनुपालित (Pass)
              </button>
            </div>

            {/* Inspections List: Most Recent 4-5 */}
            <div className="gov-card">
              <div className="card-body p-4 sm:p-5 space-y-3">
                <div className="flex justify-between items-center border-b border-base-300 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-orange-700" />
                    <h3 className="text-xs font-semibold text-navy-900 uppercase tracking-wider">
                      हाल के निरीक्षण • Recent Inspections ({Math.min(5, filteredInspections.length)} of {allInspections.length})
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {allInspections.length > 5 && (
                      <button
                        onClick={() => navigate('/inspector/inspections')}
                        className="btn btn-ghost btn-xs text-orange-700 font-bold gap-1"
                      >
                        <span>सभी देखें ({allInspections.length})</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={loadData}
                      className="btn btn-ghost btn-xs btn-circle text-slate-500"
                      title="Refresh Log"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-700' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {loading ? (
                    <div className="py-8 text-center text-xs font-medium text-slate-500 space-y-2">
                      <span className="loading loading-spinner loading-md text-orange-700" />
                      <p>डेटाबेस से निरीक्षण रिकॉर्ड लोड हो रहे हैं…</p>
                    </div>
                  ) : filteredInspections.length === 0 ? (
                    /* Helpful Empty State for newly registered officers */
                    <div className="py-8 px-4 text-center space-y-3 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl">
                      <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center mx-auto">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-navy-900">
                          अभी तक कोई निरीक्षण दर्ज नहीं हुआ है
                        </h4>
                        <p className="text-xs text-slate-500 font-medium mt-1 max-w-sm mx-auto">
                          अधिकारी {officerName} के कार्यक्षेत्र ({officerDistrict}, {officerState}) में पहला विधिक माप विज्ञान निरीक्षण प्रारंभ करें।
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/inspector/inspections/new')}
                        className="btn btn-sm btn-primary font-semibold text-xs gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>पहला निरीक्षण प्रारंभ करें • Start Inspection</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Show exactly most recent 4 to 5 inspections */}
                      {filteredInspections.slice(0, 5).map((insp: any) => {
                        const products = insp.products || [];
                        const hasFail = products.some((p: any) => p.complianceStatus === 'FAIL');
                        return (
                          <div
                            key={insp.id}
                            onClick={() => navigate(`/inspector/inspections/${insp.id}/summary`)}
                            className="rounded-xl bg-white border border-base-300 hover:border-orange-300 p-3.5 cursor-pointer transition-all hover:shadow-xs group"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <span className="text-[10px] font-mono font-semibold text-slate-400 block tracking-wider">
                                  {insp.inspectionNumber}
                                </span>
                                <h4 className="text-sm font-bold text-navy-900 truncate mt-0.5 group-hover:text-orange-800 transition-colors">
                                  {insp.shopName || 'Retail Premises Inspection'}
                                </h4>
                                <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                  📍 {insp.locationAddress || `${insp.jurisdictionDistrict || officerDistrict}, ${insp.jurisdictionState || officerState}`}
                                </p>
                              </div>
                              <div className="shrink-0">
                                {hasFail ? (
                                  <div className="badge badge-error badge-sm gap-1 font-semibold text-[10px] text-white">
                                    <AlertOctagon className="w-3 h-3" /> FAIL
                                  </div>
                                ) : (
                                  <div className="badge badge-success badge-sm gap-1 font-semibold text-[10px]">
                                    <CheckCircle2 className="w-3 h-3" /> PASS
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-base-200 pt-2.5 mt-2 font-medium">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {insp.startedAt ? new Date(insp.startedAt).toLocaleDateString('en-IN') : 'Field Session'}
                              </span>
                              <span className="flex items-center gap-1 text-orange-700 font-semibold group-hover:translate-x-0.5 transition-transform">
                                <span>रिपोर्ट देखें • View Report</span>
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {/* View More Inspections Button */}
                      {allInspections.length > 4 && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => navigate('/inspector/inspections')}
                            className="w-full py-3.5 px-5 bg-white hover:bg-amber-50/80 border-2 border-slate-200 hover:border-amber-400 text-navy-950 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow-md active:scale-[0.98] group cursor-pointer"
                          >
                            <span>सभी {allInspections.length} निरीक्षण रिकॉर्ड देखें • View All Inspections</span>
                            <ChevronRight className="w-4 h-4 text-orange-700 group-hover:translate-x-1 transition-transform shrink-0" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── VIEW 2: OFFICIAL OFFICER IDENTITY CARD (ID BADGE FORMAT) ──────── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {mainView === 'ID_CARD' && (
          <div className="space-y-4">
            {/* Top Back Action Bar (Hidden on print) */}
            <div className="flex items-center justify-between print:hidden">
              <button
                type="button"
                onClick={() => setMainView('DASHBOARD')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-navy-900 border border-slate-300 font-bold text-xs flex items-center gap-2 shadow-xs transition active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span>डैशबोर्ड पर लौटें • Return</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyOfficerId}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-navy-900 border-2 border-slate-300 font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-slate-700 shrink-0" />}
                  <span>{copiedId ? 'कॉपी हो गया' : 'आईडी कॉपी करें'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintIdCard}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-navy-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/25 transition active:scale-95 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 shrink-0" />
                  <span>प्रिंट / सेव करें • Print</span>
                </button>
              </div>
            </div>

            {/* ── PHYSICAL SMART IDENTITY CARD CONTAINER ── */}
            <div
              id="officer-id-badge"
              className="relative max-w-sm sm:max-w-md mx-auto bg-gradient-to-b from-white via-slate-50 to-white border-2 border-slate-300 rounded-3xl shadow-xl overflow-hidden print:border-black print:shadow-none"
            >
              {/* Lanyard Slot Cutout Graphic at Top */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-16 h-3.5 bg-slate-200 border border-slate-300 rounded-full shadow-inner flex items-center justify-center">
                  <div className="w-8 h-1.5 bg-slate-400 rounded-full" />
                </div>
              </div>

              {/* National Tricolor Header Ribbon */}
              <div className="gov-tricolor" />

              {/* Official Department Header */}
              <div className="bg-navy-950 text-white text-center py-3.5 px-4 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex justify-center items-center gap-2 mb-1">
                    {/* Ashoka Lion Motif Seal */}
                    <div className="w-7 h-7 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-bold text-xs shadow-inner">
                      🏛️
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-amber-400 leading-tight">
                        भारत सरकार • GOVT. OF INDIA
                      </div>
                      <div className="text-[9px] text-slate-300 font-medium leading-tight">
                        उपभोक्ता मामले, खाद्य एवं सार्वजनिक वितरण मंत्रालय
                      </div>
                    </div>
                  </div>

                  <h1 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white mt-1 border-t border-navy-800 pt-1">
                    विधिक माप विज्ञान विभाग • LEGAL METROLOGY
                  </h1>
                  <p className="text-[9px] uppercase tracking-widest text-emerald-400 font-semibold mt-0.5">
                    OFFICIAL ENFORCEMENT &amp; INSPECTION PASS
                  </p>
                </div>
              </div>

              {/* Officer Portrait & Unique ID Section */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-4">
                  {/* Photo Frame with Hologram Badge */}
                  <div className="relative shrink-0">
                    <div className="w-22 h-26 rounded-2xl bg-gradient-to-br from-navy-900 to-slate-800 border-2 border-amber-400/80 p-1 shadow-md flex flex-col items-center justify-center text-white overflow-hidden">
                      <div className="w-full h-full bg-navy-950 rounded-xl flex flex-col items-center justify-center relative">
                        <User className="w-10 h-10 text-amber-300/80" />
                        <span className="text-[9px] font-bold text-amber-300 mt-1 uppercase tracking-wider">
                          GOI OFFICER
                        </span>
                        {/* Status Light */}
                        <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                    </div>

                    {/* Hologram Stamp */}
                    <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-300 via-orange-400 to-amber-200 border border-amber-500 text-navy-950 flex items-center justify-center text-[8px] font-extrabold shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-amber-900" />
                    </div>
                  </div>

                  {/* Name, Designation & Cadre */}
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/80 border border-emerald-300 text-[10px] font-bold text-emerald-900 mb-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-700" />
                      <span>राजपत्रित अधिकारी • Gazetted</span>
                    </div>

                    <h2 className="text-base sm:text-lg font-extrabold text-navy-900 leading-tight truncate">
                      {officerName}
                    </h2>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">
                      विधिक माप विज्ञान अधिकारी (LMO)
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Legal Metrology Inspector
                    </p>
                  </div>
                </div>

                {/* ── HIGHLIGHTED UNIQUE STATUTORY OFFICER CODE BOX ── */}
                <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-400/70 rounded-2xl p-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-amber-900 tracking-wider">
                        विशिष्ट अधिकारी कोड • Unique Officer ID
                      </div>
                      <div className="font-mono text-lg sm:text-xl font-extrabold tracking-widest text-navy-950 mt-0.5">
                        {officerEmpId}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyOfficerId}
                      className="btn btn-sm btn-ghost bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs gap-1 font-semibold cursor-pointer"
                      title="Copy Unique Officer Code"
                    >
                      {copiedId ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                      <span className="text-[11px]">{copiedId ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Official Particulars Grid */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2.5 text-xs shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>राज्य व ज़िला • Jurisdiction:</span>
                    </span>
                    <span className="font-bold text-navy-900 text-right">
                      {officerDistrict}, {officerState}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>सर्कल • Circle / Zone:</span>
                    </span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[180px]">
                      {officerZone}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>मोबाइल • Mobile:</span>
                    </span>
                    <span className="font-mono font-semibold text-slate-800 text-right">
                      +91 {officerPhone}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>ईमेल • Official Email:</span>
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-slate-800 text-right truncate max-w-[180px]">
                      {officerEmail}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>जारी दिनांक • Issue Date:</span>
                    </span>
                    <span className="font-semibold text-slate-800 text-right">
                      {issueDateFormatted}
                    </span>
                  </div>
                </div>

                {/* Scannable Official QR Verification & Legal Authority */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center gap-3">
                  {/* Digital Security SVG QR Graphic */}
                  <div className="shrink-0 bg-white p-1.5 border border-slate-300 rounded-xl shadow-xs">
                    <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Outer Frame */}
                      <rect width="100" height="100" rx="6" fill="white"/>
                      {/* Finder Pattern Top-Left */}
                      <rect x="8" y="8" width="26" height="26" rx="4" fill="#0B1F3A"/>
                      <rect x="13" y="13" width="16" height="16" rx="2" fill="white"/>
                      <rect x="17" y="17" width="8" height="8" rx="1" fill="#C2410C"/>
                      {/* Finder Pattern Top-Right */}
                      <rect x="66" y="8" width="26" height="26" rx="4" fill="#0B1F3A"/>
                      <rect x="71" y="13" width="16" height="16" rx="2" fill="white"/>
                      <rect x="75" y="17" width="8" height="8" rx="1" fill="#C2410C"/>
                      {/* Finder Pattern Bottom-Left */}
                      <rect x="8" y="66" width="26" height="26" rx="4" fill="#0B1F3A"/>
                      <rect x="13" y="71" width="16" height="16" rx="2" fill="white"/>
                      <rect x="17" y="75" width="8" height="8" rx="1" fill="#C2410C"/>
                      {/* Data Dots & Alignment */}
                      <rect x="42" y="12" width="6" height="6" fill="#0B1F3A"/>
                      <rect x="52" y="12" width="6" height="6" fill="#0B1F3A"/>
                      <rect x="42" y="24" width="6" height="6" fill="#0B1F3A"/>
                      <rect x="12" y="42" width="6" height="6" fill="#0B1F3A"/>
                      <rect x="24" y="42" width="6" height="6" fill="#0B1F3A"/>
                      <rect x="68" y="42" width="6" height="6" fill="#0B1F3A"/>
                      <rect x="80" y="42" width="6" height="6" fill="#0B1F3A"/>
                      <rect x="42" y="52" width="6" height="6" fill="#0B1F3A"/>
                      <rect x="52" y="52" width="6" height="6" fill="#0B1F3A"/>
                      <rect x="42" y="68" width="6" height="6" fill="#0B1F3A"/>
                      <rect x="52" y="78" width="6" height="6" fill="#0B1F3A"/>
                      <rect x="72" y="68" width="6" height="6" fill="#0B1F3A"/>
                      <rect x="82" y="78" width="6" height="6" fill="#0B1F3A"/>
                      {/* Center Seal Motif */}
                      <circle cx="50" cy="50" r="7" fill="#C2410C"/>
                      <circle cx="50" cy="50" r="4" fill="white"/>
                    </svg>
                  </div>

                  <div className="min-w-0 text-xs text-slate-600">
                    <div className="font-bold text-navy-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>डिजिटल सत्यापन पास • Official Pass</span>
                    </div>
                    <p className="mt-1 text-slate-500 text-[11px] leading-snug">
                      प्राधिकार सत्यापन हेतु इस क्यूआर कोड को स्कैन करें।
                    </p>
                  </div>
                </div>

                {/* Digital Signature & Statutory Footer */}
                <div className="border-t border-slate-200 pt-3 flex justify-between items-end">
                  <div className="text-[9px] text-slate-400 max-w-[200px] leading-tight">
                    धारा 15, विधिक माप विज्ञान अधिनियम 2009 के अधीन अधिकृत।
                    <div className="text-[8px] mt-0.5">Authorised under Sec 15, LM Act 2009.</div>
                  </div>

                  <div className="text-right">
                    <div className="font-serif italic text-xs font-bold text-navy-900 tracking-wider">
                      Ashutosh Agarwal
                    </div>
                    <div className="text-[9px] font-bold text-slate-600 border-t border-slate-300 pt-0.5">
                      निदेशक, विधिक माप विज्ञान
                    </div>
                    <div className="text-[8px] text-slate-400">
                      Director of Legal Metrology
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Security Tricolor Stripe */}
              <div className="gov-tricolor" />
            </div>

            {/* Print & Return Navigation */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 max-w-sm sm:max-w-md mx-auto print:hidden">
              <button
                type="button"
                onClick={handlePrintIdCard}
                className="btn btn-primary flex-1 font-semibold text-xs gap-2 shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>पहचान पत्र प्रिंट / डाउनलोड करें • Print ID Pass</span>
              </button>

              <button
                type="button"
                onClick={() => setMainView('DASHBOARD')}
                className="btn btn-outline btn-neutral flex-1 font-semibold text-xs gap-2 bg-white cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>डैशबोर्ड पर वापस जाएं • Return to Dashboard</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
