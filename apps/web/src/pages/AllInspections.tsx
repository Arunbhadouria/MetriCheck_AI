import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import {
  Search, RefreshCw, ChevronRight, Layers, Clock, ShieldCheck,
  AlertTriangle, CheckCircle2, FileText, Download, MapPin, Store,
  UserCheck, Plus, X, ArrowUpDown, ChevronLeft, Copy, Check
} from 'lucide-react';
import { fetchApi } from '../services/api';

const ITEMS_PER_PAGE = 6;

export const AllInspections: React.FC = () => {
  const navigate = useNavigate();

  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FAIL' | 'PASS' | 'DRAFT'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'VIOLATIONS'>('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadInspections = () => {
    setLoading(true);
    fetchApi<any>('/inspections')
      .then(res => {
        const data = res?.data || res || [];
        setInspections(Array.isArray(data) ? data : []);
      })
      .catch(() => setInspections([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInspections();
  }, []);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter & Search
  const filteredInspections = useMemo(() => {
    return inspections.filter((insp) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (insp.inspectionNumber || '').toLowerCase().includes(q) ||
        (insp.shopName || '').toLowerCase().includes(q) ||
        (insp.shopkeeperName || '').toLowerCase().includes(q) ||
        (insp.licenseNumber || '').toLowerCase().includes(q) ||
        (insp.jurisdictionDistrict || '').toLowerCase().includes(q) ||
        (insp.jurisdictionZone || '').toLowerCase().includes(q) ||
        (insp.marketName || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const hasFail = (insp.products || []).some((p: any) => p.complianceStatus === 'FAIL');
      const hasPass = (insp.products || []).length > 0 && (insp.products || []).every((p: any) => p.complianceStatus === 'PASS');
      const isDraft = !insp.status || insp.status === 'IN_PROGRESS' || insp.status === 'DRAFT';

      if (statusFilter === 'FAIL') return hasFail;
      if (statusFilter === 'PASS') return hasPass;
      if (statusFilter === 'DRAFT') return isDraft;

      return true;
    });
  }, [inspections, searchQuery, statusFilter]);

  // Sort
  const sortedInspections = useMemo(() => {
    return [...filteredInspections].sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return new Date(b.createdAt || b.startedAt || 0).getTime() - new Date(a.createdAt || a.startedAt || 0).getTime();
      }
      if (sortBy === 'OLDEST') {
        return new Date(a.createdAt || a.startedAt || 0).getTime() - new Date(b.createdAt || b.startedAt || 0).getTime();
      }
      if (sortBy === 'VIOLATIONS') {
        const vA = (a.products || []).reduce((acc: number, p: any) => acc + (p.violationsCount || 0), 0);
        const vB = (b.products || []).reduce((acc: number, p: any) => acc + (p.violationsCount || 0), 0);
        return vB - vA;
      }
      return 0;
    });
  }, [filteredInspections, sortBy]);

  // Pagination calculations
  const totalItems = sortedInspections.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const validPage = Math.min(currentPage, totalPages);

  const paginatedInspections = useMemo(() => {
    const startIdx = (validPage - 1) * ITEMS_PER_PAGE;
    return sortedInspections.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [sortedInspections, validPage]);

  // Reset to page 1 on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="gov-page text-base-content pb-24">
      <Header
        title="सभी निरीक्षण • All Inspections"
        showBack={true}
        showMenu={true}
      />

      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
        {/* ══ TOP SEARCH & FILTER BAR ════════════════════════════════════════ */}
        <div className="gov-card p-4 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="inspection-search"
              type="text"
              placeholder="दुकान का नाम, संदर्भ संख्या, लाइसेंस या ज़ोन खोजें..."
              aria-label="दुकान का नाम, संदर्भ संख्या, लाइसेंस या ज़ोन खोजें • Search inspections"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full pl-10 pr-10 text-xs sm:text-sm font-medium bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Tabs & Sort Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter inspections by compliance status">
              <button
                role="tab"
                aria-selected={statusFilter === 'ALL'}
                onClick={() => setStatusFilter('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'ALL'
                    ? 'bg-navy-900 text-white shadow-md shadow-navy-950/20'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-xs'
                }`}
              >
                <span>सभी • All ({inspections.length})</span>
              </button>
              <button
                role="tab"
                aria-selected={statusFilter === 'FAIL'}
                onClick={() => setStatusFilter('FAIL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'FAIL'
                    ? 'bg-red-600 text-white shadow-md shadow-red-900/25'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 shadow-xs'
                }`}
              >
                <span>उल्लंघन दर्ज (Fail)</span>
              </button>
              <button
                role="tab"
                aria-selected={statusFilter === 'PASS'}
                onClick={() => setStatusFilter('PASS')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'PASS'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/25'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-xs'
                }`}
              >
                <span>पूर्ण अनुपालित (Pass)</span>
              </button>
              <button
                role="tab"
                aria-selected={statusFilter === 'DRAFT'}
                onClick={() => setStatusFilter('DRAFT')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'DRAFT'
                    ? 'bg-amber-500 text-navy-950 shadow-md shadow-amber-500/25 font-extrabold'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 shadow-xs'
                }`}
              >
                <span>प्रगति पर (In Progress)</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <span className="text-[11px] text-slate-500 font-semibold">क्रम:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="select select-bordered select-xs text-xs font-semibold bg-white cursor-pointer shadow-xs border-slate-300"
              >
                <option value="NEWEST">नवीनतम पहले • Newest First</option>
                <option value="OLDEST">पुरातन पहले • Oldest First</option>
                <option value="VIOLATIONS">अधिकतम उल्लंघन • Most Violations</option>
              </select>
              <button
                onClick={loadInspections}
                className="btn btn-ghost btn-xs btn-circle text-slate-600 hover:bg-slate-200"
                title="Refresh List"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-700' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* ══ SUMMARY STATUS BAR ════════════════════════════════════════════ */}
        <div className="flex items-center justify-between px-1 text-xs text-slate-600 font-medium">
          <span>
            दिखाए जा रहे हैं <strong>{totalItems === 0 ? 0 : (validPage - 1) * ITEMS_PER_PAGE + 1}</strong> से <strong>{Math.min(validPage * ITEMS_PER_PAGE, totalItems)}</strong> (कुल {totalItems} रिकॉर्ड)
          </span>
          <button
            onClick={() => navigate('/inspector/inspections/new')}
            className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-navy-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/25 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-navy-950 shrink-0" />
            <span>नया निरीक्षण • New Scan</span>
          </button>
        </div>

        {/* ══ INSPECTIONS GRID (MOBILE FIRST & RESPONSIVE) ═════════════════════ */}
        {loading ? (
          <div className="gov-card p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">निरीक्षण रिकॉर्ड लोड हो रहे हैं • Loading Inspections…</p>
          </div>
        ) : paginatedInspections.length === 0 ? (
          <div className="gov-card p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-base-200 border border-base-300 flex items-center justify-center text-slate-400 mx-auto">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-navy-900">कोई निरीक्षण नहीं मिला • No Records Found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery ? `"${searchQuery}" से मेल खाता कोई रिकॉर्ड उपलब्ध नहीं है।` : 'वर्तमान फ़िल्टर में कोई निरीक्षण दर्ज नहीं है।'}
              </p>
            </div>
            {(searchQuery || statusFilter !== 'ALL') && (
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
                className="btn btn-xs btn-outline font-semibold mt-2"
              >
                फ़िल्टर रीसेट करें • Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {paginatedInspections.map((insp) => {
              const products = insp.products || [];
              const hasFail = products.some((p: any) => p.complianceStatus === 'FAIL');
              const hasPass = products.length > 0 && products.every((p: any) => p.complianceStatus === 'PASS');
              const totalViolations = products.reduce((acc: number, p: any) => acc + (p.violationsCount || 0), 0);

              const dateStr = insp.createdAt || insp.startedAt
                ? new Date(insp.createdAt || insp.startedAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })
                : 'Recent';

              return (
                <div
                  key={insp.id}
                  className="gov-card hover:border-orange-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group shadow-xs hover:shadow-md"
                >
                  <div className="p-4 space-y-2.5">
                    {/* Top Row: Shop Name + Status */}
                    <div className="flex items-start justify-between gap-2 border-b border-base-200 pb-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-navy-950 text-sm truncate">
                          {insp.shopName || 'Commercial Establishment'}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <span className="font-mono font-medium">{insp.inspectionNumber}</span>
                          <span>•</span>
                          <span>{dateStr}</span>
                        </div>
                      </div>

                      {hasFail ? (
                        <span className="badge badge-error badge-xs font-bold text-white shrink-0">
                          उल्लंघन • FAIL
                        </span>
                      ) : hasPass ? (
                        <span className="badge badge-success badge-xs font-bold shrink-0">
                          पास • PASS
                        </span>
                      ) : (
                        <span className="badge badge-warning badge-xs font-bold shrink-0">
                          प्रगति पर
                        </span>
                      )}
                    </div>

                    {/* Establishment Particulars */}
                    <div className="text-xs text-slate-600 space-y-1">
                      <p className="truncate">
                        <span className="text-slate-400">स्थान: </span>
                        <span>{insp.locationAddress || `${insp.jurisdictionZone || insp.jurisdictionDistrict}`}</span>
                      </p>
                      <p className="truncate">
                        <span className="text-slate-400">संचालक: </span>
                        <span>{insp.shopkeeperName || 'Proprietor'}</span>
                        {insp.licenseNumber && (
                          <span className="text-slate-400 font-mono text-[11px]"> ({insp.licenseNumber})</span>
                        )}
                      </p>
                    </div>

                    {/* Compliance Result Pill */}
                    <div className="pt-1 text-xs">
                      {totalViolations > 0 ? (
                        <span className="text-red-700 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>{totalViolations} नियम उल्लंघन दर्ज</span>
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>सभी घोषणाएँ सत्यापित • Compliant</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/inspector/inspections/${insp.id}/summary`)}
                      className="flex-1 py-2.5 px-3.5 bg-white hover:bg-orange-50/70 border border-slate-300 hover:border-amber-500 text-navy-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xs hover:shadow-md cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-orange-700 shrink-0" />
                      <span>विवरण देखें</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => window.open(`/api/v1/inspections/${insp.id}/pdf`, '_blank')}
                      className="py-2.5 px-4 bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-navy-950/25 shrink-0 cursor-pointer"
                      title="Download Statutory Form IV PDF"
                    >
                      <Download className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ PAGINATION CONTROLS ═════════════════════════════════════════════ */}
        {totalPages > 1 && (
          <div className="gov-card p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 font-medium">
              पृष्ठ <strong>{validPage}</strong> / <strong>{totalPages}</strong> (कुल {totalItems} रिकॉर्ड)
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePageChange(validPage - 1)}
                disabled={validPage <= 1}
                className="btn btn-sm btn-outline font-semibold text-xs gap-1 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">पिछला • Prev</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => {
                  // Show current page, edges, and nearby pages
                  if (p === 1 || p === totalPages || (p >= validPage - 1 && p <= validPage + 1)) {
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handlePageChange(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                          p === validPage
                            ? 'bg-navy-900 text-white shadow-xs'
                            : 'bg-base-200 text-slate-600 hover:bg-base-300'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  }
                  if (p === validPage - 2 || p === validPage + 2) {
                    return <span key={p} className="px-1 text-slate-400 text-xs">…</span>;
                  }
                  return null;
                })}
              </div>

              <button
                type="button"
                onClick={() => handlePageChange(validPage + 1)}
                disabled={validPage >= totalPages}
                className="btn btn-sm btn-outline font-semibold text-xs gap-1 disabled:opacity-40 cursor-pointer"
              >
                <span className="hidden sm:inline">अगला • Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Floating Scan Button */}
      <button
        onClick={() => navigate('/inspector/inspections/new')}
        className="fixed bottom-6 right-6 sm:hidden w-14 h-14 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all z-40 border-2 border-white/20"
        title="नया निरीक्षण • New Scan"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
};
