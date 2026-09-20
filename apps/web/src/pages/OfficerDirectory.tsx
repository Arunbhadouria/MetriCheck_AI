import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, MapPin, Building, Phone, Mail, FileText, Send,
  ShieldCheck, Search, Filter, Printer, CheckCircle2, X,
  AlertCircle, Sparkles, ArrowRight, ExternalLink, ChevronRight,
  UserCheck, Shield, HelpCircle, Copy, Check
} from 'lucide-react';
import { fetchApi } from '../services/api';
import { Header } from '../components/Header';

interface Officer {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  department: string;
  jurisdictionState: string;
  jurisdictionDistrict: string;
  jurisdictionZone: string;
  phone?: string;
  email?: string;
  officeAddress?: string;
  activeStatus?: 'ON_DUTY' | 'IN_FIELD' | 'LEAVE';
}

export const OfficerDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');

  // Active current officer
  const [currentOfficer, setCurrentOfficer] = useState<any>(() => {
    try {
      const raw = localStorage.getItem('metricheck_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Requisition Modal State
  const [selectedTargetOfficer, setSelectedTargetOfficer] = useState<Officer | null>(null);
  const [memoPurpose, setMemoPurpose] = useState('MULTI_ZONE_TRADER_INVESTIGATION');
  const [caseReference, setCaseReference] = useState('');
  const [productInquiry, setProductInquiry] = useState('');
  const [memoNotes, setMemoNotes] = useState('');
  const [memoSuccessReceipt, setMemoSuccessReceipt] = useState<string | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<any>('/officers');
      const data = res?.data || res || [];
      if (Array.isArray(data)) {
        setOfficers(data);
      }
    } catch (err) {
      console.warn('Failed to load officers directory:', err);
    } finally {
      setLoading(false);
    }
  };

  // Derive unique states and districts for filters
  const uniqueStates = ['ALL', ...Array.from(new Set(officers.map(o => o.jurisdictionState).filter(Boolean)))];
  const uniqueDistricts = ['ALL', ...Array.from(new Set(
    officers
      .filter(o => selectedState === 'ALL' || o.jurisdictionState === selectedState)
      .map(o => o.jurisdictionDistrict)
      .filter(Boolean)
  ))];

  // Filtered officers
  const filteredOfficers = officers.filter(officer => {
    if (selectedState !== 'ALL' && officer.jurisdictionState !== selectedState) return false;
    if (selectedDistrict !== 'ALL' && officer.jurisdictionDistrict !== selectedDistrict) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = officer.name?.toLowerCase().includes(q);
      const matchEmp = officer.employeeId?.toLowerCase().includes(q);
      const matchZone = officer.jurisdictionZone?.toLowerCase().includes(q);
      const matchDistrict = officer.jurisdictionDistrict?.toLowerCase().includes(q);
      if (!matchName && !matchEmp && !matchZone && !matchDistrict) return false;
    }
    return true;
  });

  // Handle open Requisition modal
  const handleOpenRequisition = (officer: Officer) => {
    setSelectedTargetOfficer(officer);
    setCaseReference(`INSP-REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setMemoSuccessReceipt(null);
    setCopiedReceipt(false);
  };

  // Submit Requisition
  const handleSubmitRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    const receiptId = `LM-REQ/${new Date().getFullYear()}/${Math.floor(100000 + Math.random() * 900000)}`;
    setMemoSuccessReceipt(receiptId);
  };

  const handleCopyReceipt = () => {
    if (memoSuccessReceipt) {
      navigator.clipboard.writeText(memoSuccessReceipt);
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header
        title="अधिकारी निर्देशिका • Officer Directory"
        subtitle="अखिल भारतीय विधिक माप विज्ञान समन्वय एवं डेटा अधियाचना"
        showBack={true}
        showMenu={true}
      />

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
              <span onClick={() => navigate('/inspector/dashboard')} className="hover:text-primary cursor-pointer">
                पोर्टल डैशबोर्ड
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-navy-950 font-bold">अधिकारी निर्देशिका</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-navy-900 text-amber-400 flex items-center justify-center font-bold shadow-sm">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
                  विधिक माप विज्ञान अधिकारी निर्देशिका
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Legal Metrology All-India Officer Directory & Inter-Zone Data Coordination
                </p>
              </div>
            </div>
          </div>

          {/* Current Officer Jurisdiction Badge */}
          {currentOfficer && (
            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center gap-3 self-start sm:self-auto">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  आपका अधिकृत कार्यक्षेत्र • Your Assigned Zone
                </span>
                <span className="font-bold text-navy-950 block">
                  {currentOfficer.jurisdictionZone || 'Zone 08 — Vijay Nagar'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {currentOfficer.name} ({currentOfficer.employeeId || 'LM-MP-0421'})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Inter-Zone Legal Notice Banner */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 font-bold mt-0.5">
              <Shield className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-bold text-navy-950 flex items-center gap-1.5">
                <span>विधिक क्षेत्राधिकार व अंतर-क्षेत्रीय डेटा आदान-प्रदान नियम (धारा 15, विधिक माप विज्ञान अधिनियम, 2009)</span>
              </h3>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                प्रत्येक निरीक्षक केवल अपने अधिसूचित कार्यक्षेत्र (Zone/Circle) के निरीक्षण रिकॉर्ड व मामलों का निस्तारण कर सकता है। अन्य क्षेत्र/राज्य से संबंधित जांच या निर्माता सत्यापन हेतु सीधे संबंधित क्षेत्र के प्राधिकृत अधिकारी से संपर्क करें अथवा <strong>आधिकारिक अधियाचना (Requisition Memo)</strong> प्रेषित करें।
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="अधिकारी का नाम, बैज आईडी (LM-..), या जोन खोजें..."
                className="input input-sm input-bordered w-full pl-9 pr-3 text-xs bg-slate-50/50"
              />
            </div>

            {/* State Filter */}
            <div className="sm:col-span-3">
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedDistrict('ALL');
                }}
                className="select select-sm select-bordered w-full text-xs bg-slate-50/50"
              >
                <option value="ALL">सभी राज्य • All States</option>
                {uniqueStates.filter(s => s !== 'ALL').map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* District Filter */}
            <div className="sm:col-span-3">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="select select-sm select-bordered w-full text-xs bg-slate-50/50"
              >
                <option value="ALL">सभी जिले • All Districts</option>
                {uniqueDistricts.filter(d => d !== 'ALL').map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>
              कुल <strong>{filteredOfficers.length}</strong> प्राधिकृत विधिक माप विज्ञान अधिकारी सूचीबद्ध
            </span>
            {(selectedState !== 'ALL' || selectedDistrict !== 'ALL' || searchQuery.trim()) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedState('ALL');
                  setSelectedDistrict('ALL');
                  setSearchQuery('');
                }}
                className="text-xs text-primary font-bold hover:underline cursor-pointer"
              >
                फ़िल्टर साफ़ करें • Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Officers Cards Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <span className="loading loading-spinner loading-lg text-primary" />
            <p className="text-xs text-slate-500 font-medium">अधिकारी निर्देशिका लोड हो रही है...</p>
          </div>
        ) : filteredOfficers.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-base text-navy-950">कोई प्राधिकृत अधिकारी नहीं मिला</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              दिए गए मापदंडों के अनुरूप कोई अधिकारी सूची में उपलब्ध नहीं है। कृपया राज्य या जिले का चयन बदलें।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOfficers.map((officer) => {
              const isCurrentOfficer = currentOfficer?.employeeId === officer.employeeId;

              return (
                <div
                  key={officer.id || officer.employeeId}
                  className={`bg-white rounded-2xl border transition-all shadow-xs hover:shadow-md flex flex-col justify-between ${
                    isCurrentOfficer ? 'border-primary/50 ring-2 ring-primary/20' : 'border-slate-200'
                  }`}
                >
                  <div className="p-4 space-y-3">
                    {/* Header: Name, Badge, Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h2 className="font-black text-sm text-navy-950">{officer.name}</h2>
                          {isCurrentOfficer && (
                            <span className="badge badge-primary badge-xs font-bold text-white">
                              आप • You
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-600 mt-0.5">
                          {officer.role || 'LEGAL METROLOGY INSPECTOR'}
                        </p>
                        <span className="font-mono text-[11px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/20 inline-block mt-1">
                          {officer.employeeId}
                        </span>
                      </div>

                      <span className="badge badge-success badge-xs font-bold text-white shrink-0">
                        {officer.activeStatus === 'IN_FIELD' ? 'क्षेत्र में • Field' : 'कार्यरत • Active'}
                      </span>
                    </div>

                    {/* Department & Jurisdiction Details */}
                    <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-navy-900 block">{officer.jurisdictionZone}</span>
                          <span className="text-[11px] text-slate-500">
                            {officer.jurisdictionDistrict}, {officer.jurisdictionState}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 pt-1 border-t border-slate-200/60">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-slate-600 truncate">
                          {officer.officeAddress || `${officer.jurisdictionDistrict} कलेक्ट्रेट परिसर, विधिक माप विज्ञान प्रकोष्ठ`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-3 bg-slate-50/70 border-t border-slate-100 rounded-b-2xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {officer.phone && (
                        <a
                          href={`tel:${officer.phone}`}
                          className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 flex items-center justify-center text-slate-700 transition cursor-pointer"
                          title={`कॉल करें: ${officer.phone}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {officer.email && (
                        <a
                          href={`mailto:${officer.email}?subject=Inter-Zone Legal Metrology Coordination Inquiry&body=Respected Officer, regarding jurisdiction ${officer.jurisdictionZone}...`}
                          className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 flex items-center justify-center text-slate-700 transition cursor-pointer"
                          title={`ईमेल भेजें: ${officer.email}`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    {!isCurrentOfficer ? (
                      <button
                        type="button"
                        onClick={() => handleOpenRequisition(officer)}
                        className="btn btn-xs rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold gap-1 text-[11px] cursor-pointer shadow-xs"
                      >
                        <FileText className="w-3 h-3 text-amber-400" />
                        <span>डेटा अधियाचना • Request Data</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold px-2">
                        सक्रिय कार्यक्षेत्र
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ══ REQUISITION MEMO MODAL (SECTION 15 LMA 2009) ══════════════════════════ */}
      {selectedTargetOfficer && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-navy-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-navy-950 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    अंतर-क्षेत्रीय डेटा अधियाचना ज्ञापन (धारा 15)
                  </h3>
                  <p className="text-[10px] text-slate-300">
                    Inter-Zone Inspection &amp; Compliance Data Requisition
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTargetOfficer(null)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {memoSuccessReceipt ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-navy-950">
                      अधियाचना ज्ञापन सफलतापूर्वक प्रेषित!
                    </h3>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
                      संबंधित क्षेत्र के अधिकारी <strong>{selectedTargetOfficer.name}</strong> को विधिक सूचना और डेटा अनुरोध प्रेषित कर दिया गया है।
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl max-w-sm mx-auto flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-500 font-sans text-[11px]">पावती क्रमांक:</span>
                    <span className="font-bold text-navy-900">{memoSuccessReceipt}</span>
                    <button
                      type="button"
                      onClick={handleCopyReceipt}
                      className="p-1 rounded hover:bg-slate-200 text-slate-600 cursor-pointer"
                      title="कॉपी करें"
                    >
                      {copiedReceipt ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTargetOfficer(null)}
                      className="btn btn-sm btn-primary text-xs font-bold"
                    >
                      पूर्ण हुआ • Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequisition} className="space-y-4">
                  {/* Parties Box */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        प्रेषक अधिकारी • From (Requester)
                      </span>
                      <span className="font-bold text-navy-900 block mt-0.5">
                        {currentOfficer?.name || 'Amit Verma'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {currentOfficer?.employeeId || 'LM-MP-0421'}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {currentOfficer?.jurisdictionZone || 'Zone 08 — Vijay Nagar'}
                      </span>
                    </div>

                    <div className="border-l border-slate-200 pl-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        लक्षित अधिकारी • To (Recipient)
                      </span>
                      <span className="font-bold text-navy-900 block mt-0.5">
                        {selectedTargetOfficer.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {selectedTargetOfficer.employeeId}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {selectedTargetOfficer.jurisdictionZone}
                      </span>
                    </div>
                  </div>

                  {/* Requisition Purpose */}
                  <div className="form-control">
                    <label className="label py-0.5">
                      <span className="label-text font-bold text-xs text-navy-900">
                        अधियाचना का वैधानिक प्रयोजन • Statutory Purpose *
                      </span>
                    </label>
                    <select
                      value={memoPurpose}
                      onChange={(e) => setMemoPurpose(e.target.value)}
                      className="select select-sm select-bordered w-full text-xs bg-white"
                      required
                    >
                      <option value="MULTI_ZONE_TRADER_INVESTIGATION">
                        बहु-क्षेत्रीय व्यापारी/वितरक जांच • Multi-Zone Trader Investigation
                      </option>
                      <option value="MANUFACTURER_PACKER_VERIFICATION">
                        निर्माता/पैकर पता व लाइसेंस सत्यापन • Manufacturer/Packer Verification
                      </option>
                      <option value="DUAL_MRP_CROSS_VERIFICATION">
                        दोहरे MRP व बारकोड की अंतर-क्षेत्रीय पुष्टि • Dual MRP Cross-Verification
                      </option>
                      <option value="COURT_CASE_EVIDENCE_REQUISITION">
                        न्यायालयीन परिवाद साक्ष्य संकलन • Court Proceeding Evidence Gathering
                      </option>
                    </select>
                  </div>

                  {/* Case / Inspection Reference */}
                  <div className="form-control">
                    <label className="label py-0.5">
                      <span className="label-text font-bold text-xs text-navy-900">
                        मूल प्रकरण/जांच संदर्भ क्रमांक • Case / Inspection Ref No. *
                      </span>
                    </label>
                    <input
                      type="text"
                      value={caseReference}
                      onChange={(e) => setCaseReference(e.target.value)}
                      className="input input-sm input-bordered w-full font-mono text-xs bg-white"
                      placeholder="उदा. INSP-REQ-2026-8812"
                      required
                    />
                  </div>

                  {/* Product or Trader Details */}
                  <div className="form-control">
                    <label className="label py-0.5">
                      <span className="label-text font-bold text-xs text-navy-900">
                        संबंधित उत्पाद / व्यापारी का विवरण • Product or Trader Under Inquiry *
                      </span>
                    </label>
                    <input
                      type="text"
                      value={productInquiry}
                      onChange={(e) => setProductInquiry(e.target.value)}
                      className="input input-sm input-bordered w-full text-xs bg-white"
                      placeholder="उदा. Lays Classic 50g / मेसर्स बालाजी डिस्ट्रीब्यूटर्स"
                      required
                    />
                  </div>

                  {/* Remarks / Questions */}
                  <div className="form-control">
                    <label className="label py-0.5">
                      <span className="label-text font-bold text-xs text-navy-900">
                        विशिष्ट जानकारी की मांग • Specific Information Requested
                      </span>
                    </label>
                    <textarea
                      value={memoNotes}
                      onChange={(e) => setMemoNotes(e.target.value)}
                      rows={3}
                      className="textarea textarea-bordered text-xs bg-white w-full"
                      placeholder="संबंधित क्षेत्र के गोदाम/यूनिट के हालिया निरीक्षण रिपोर्ट और बैच नंबर सत्यापन प्रेषित करें..."
                    />
                  </div>

                  {/* Footer Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedTargetOfficer(null)}
                      className="btn btn-sm btn-ghost text-xs"
                    >
                      रद्द करें • Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-sm rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-md shadow-orange-600/20 gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>अधियाचना ज्ञापन भेजें • Send Requisition</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
