import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, ShieldCheck, CheckCircle2, Clock, AlertTriangle, ArrowLeft,
  Store, MapPin, Scale, UserCheck, FileText, Share2, Copy, Check, RefreshCw
} from 'lucide-react';
import { getFullApiUrl } from '../../services/api';

interface ComplaintRecord {
  id: string;
  trackingId: string;
  productName: string;
  brand?: string;
  printedMrp: number;
  chargedPrice?: number;
  shopName: string;
  shopAddress?: string;
  district: string;
  state: string;
  zone: string;
  violations: string[];
  status: 'SUBMITTED' | 'ASSIGNED' | 'INVESTIGATING' | 'NOTICE_ISSUED' | 'RESOLVED';
  assignedOfficerName?: string;
  assignedOfficerEmpId?: string;
  officerRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

export const ConsumerGrievanceTracker: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';
  const isNew = searchParams.get('new') === 'true';

  const [trackingId, setTrackingId] = useState(initialId);
  const [complaint, setComplaint] = useState<ComplaintRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchComplaint = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setNotFound(false);

    try {
      const res = await fetch(getFullApiUrl(`/complaints/track/${encodeURIComponent(id.trim())}`));
      const json = await res.json();
      if (res.ok && json.data) {
        setComplaint(json.data);
      } else {
        setComplaint(null);
        setNotFound(true);
      }
    } catch {
      setComplaint(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      fetchComplaint(initialId);

      // Real-time background sync every 4 seconds so officer updates reflect immediately
      const timer = setInterval(() => {
        fetch(getFullApiUrl(`/complaints/track/${encodeURIComponent(initialId.trim())}`))
          .then(res => res.json())
          .then(json => {
            if (json?.data) {
              setComplaint(prev => {
                // Only update state if status or remarks changed to avoid unnecessary rerenders
                if (
                  !prev ||
                  prev.status !== json.data.status ||
                  prev.officerRemarks !== json.data.officerRemarks ||
                  prev.updatedAt !== json.data.updatedAt
                ) {
                  return json.data;
                }
                return prev;
              });
            }
          })
          .catch(() => {});
      }, 4000);

      return () => clearInterval(timer);
    }
  }, [initialId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim()) {
      navigate(`/consumer/track?id=${encodeURIComponent(trackingId.trim())}`);
      fetchComplaint(trackingId.trim());
    }
  };

  const handleCopyId = () => {
    if (complaint) {
      navigator.clipboard.writeText(complaint.trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 4 Timeline Steps
  const steps = [
    { key: 'SUBMITTED', title: 'शिकायत दर्ज • Registered', desc: 'सिस्टम में सुरक्षित दर्ज' },
    { key: 'ASSIGNED', title: 'निरीक्षक आवंटित • Assigned', desc: 'मंडल अधिकारी को प्रेषित' },
    { key: 'INVESTIGATING', title: 'सत्यापन व नोटिस • Inspection', desc: 'विधिक जांच व नोटिस' },
    { key: 'RESOLVED', title: 'कार्रवाई पूर्ण • Enforced', desc: 'चालान या सुधार लागू' }
  ];

  const getStepIndex = (status?: string) => {
    switch (status) {
      case 'SUBMITTED': return 0;
      case 'ASSIGNED': return 1;
      case 'INVESTIGATING': return 2;
      case 'NOTICE_ISSUED': return 2;
      case 'RESOLVED': return 3;
      default: return 0;
    }
  };

  const currentStepIdx = getStepIndex(complaint?.status);

  return (
    <div className="gov-page text-base-content min-h-screen pb-28 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-navy-950 text-white shadow-md">
        <div className="gov-tricolor" />
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/consumer')}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition active:scale-95 cursor-pointer"
            aria-label="Back to citizen home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-white text-center">
              शिकायत स्थिति ट्रैकर • Grievance Tracker
            </h1>
            <p className="text-[10px] text-slate-300 text-center font-medium">
              विधिक मापविज्ञान विभाग • Legal Metrology
            </p>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-xl lg:max-w-4xl xl:max-w-5xl mx-auto p-4 md:p-6 space-y-5">
        {/* New Submission Toast Alert */}
        {isNew && (
          <div className="alert alert-success text-white text-xs font-bold p-3 shadow-lg">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <div className="font-extrabold text-sm">शिकायत सफलतापूर्वक दर्ज! • Complaint Submitted</div>
              <div className="text-[11px] font-medium opacity-90">
                आपकी शिकायत दर्ज कर ली गई है। संदर्भ संख्या सुरक्षित रखें।
              </div>
            </div>
          </div>
        )}

        {/* ══ TRACKING ID SEARCH INPUT ═══════════════════════════════════════ */}
        <div className="gov-card p-4 bg-white border border-slate-200 space-y-2.5">
          <label htmlFor="search-complaint-id" className="text-xs font-bold text-navy-950 block">
            शिकायत संदर्भ संख्या दर्ज करें • Enter Tracking ID
          </label>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              id="search-complaint-id"
              type="text"
              placeholder="उदा. LM-CITIZEN-2026-9041"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="input input-bordered flex-1 text-xs font-semibold bg-slate-50 uppercase placeholder:normal-case"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="btn btn-neutral text-xs font-bold px-4 shrink-0 cursor-pointer"
            >
              {loading ? <span className="loading loading-spinner loading-xs" /> : 'खोजें • Track'}
            </button>
          </form>
        </div>

        {notFound && (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-sm font-bold text-navy-950">कोई रिकॉर्ड नहीं मिला • Not Found</h3>
            <p className="text-xs text-slate-500">
              इस संदर्भ संख्या से कोई शिकायत नहीं मिली। कृपया आईडी पुनः जांचें (उदा. LM-CITIZEN-2026-9041)।
            </p>
          </div>
        )}

        {complaint && (
          <div className="space-y-4">
            {/* ══ TRACKING HEADER CARD ═══════════════════════════════════════ */}
            <div className="gov-card p-4 bg-white border-2 border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    आधिकारिक शिकायत संदर्भ संख्या
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-base font-black text-navy-950 font-mono">
                      {complaint.trackingId}
                    </span>
                    <button
                      onClick={handleCopyId}
                      className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-navy-950 transition cursor-pointer"
                      title="Copy Tracking ID"
                      aria-label="Copy Tracking ID"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <span className={`badge badge-md font-bold text-white ${
                  complaint.status === 'RESOLVED'
                    ? 'badge-success'
                    : complaint.status === 'INVESTIGATING' || complaint.status === 'NOTICE_ISSUED'
                      ? 'badge-warning text-navy-950'
                      : 'badge-info'
                }`}>
                  {complaint.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* ══ 4-STEP LIVE TIMELINE ═════════════════════════════════════ */}
              <div className="py-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  प्रवर्तन प्रगति • Enforcement Timeline:
                </div>
                <div className="space-y-3">
                  {steps.map((step, idx) => {
                    const isPassed = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;

                    return (
                      <div key={step.key} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                            isPassed
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-400 border border-slate-300'
                          }`}>
                            {isPassed ? '✓' : idx + 1}
                          </div>
                          {idx < steps.length - 1 && (
                            <div className={`w-0.5 h-6 ${isPassed && idx < currentStepIdx ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                          )}
                        </div>
                        <div className="pt-0.5">
                          <div className={`text-xs font-bold ${isCurrent ? 'text-orange-700' : isPassed ? 'text-navy-950' : 'text-slate-400'}`}>
                            {step.title}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {step.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Officer Official Remarks */}
              {complaint.officerRemarks && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                    <UserCheck className="w-4 h-4 text-orange-600" />
                    <span>अधिकारी की टिप्पणी • Officer Remarks:</span>
                  </div>
                  <p className="text-xs font-medium text-amber-900 leading-relaxed pl-5">
                    "{complaint.officerRemarks}"
                  </p>
                </div>
              )}
            </div>

            {/* ══ COMPLAINT DETAILS SUMMARY ═════════════════════════════════ */}
            <div className="gov-card p-4 bg-white border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider border-b border-slate-100 pb-2">
                विवरण • Case Evidence Record
              </h4>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">उत्पाद:</span>
                  <div className="font-bold text-navy-950">{complaint.productName}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">मुद्रित MRP:</span>
                    <div className="font-bold text-navy-950">₹{complaint.printedMrp}</div>
                  </div>
                  {complaint.chargedPrice && (
                    <div>
                      <span className="text-slate-500 font-medium">मांगी गई दर:</span>
                      <div className="font-bold text-red-600">₹{complaint.chargedPrice}</div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">दुकान व स्थान:</span>
                  <div className="font-bold text-navy-950 flex items-center gap-1 mt-0.5">
                    <Store className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>{complaint.shopName}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 pl-4.5">
                    {complaint.shopAddress}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">आवंटित क्षेत्राधिकारी:</span>
                  <div className="font-bold text-navy-950 flex items-center gap-1.5 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{complaint.assignedOfficerName || 'Amit Verma'} ({complaint.assignedOfficerEmpId || 'LM-MP-0421'})</span>
                  </div>
                  <div className="text-[10px] text-slate-500 pl-5">
                    {complaint.zone}, {complaint.district}, {complaint.state}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/consumer/scan')}
                className="btn btn-primary flex-1 text-xs font-bold cursor-pointer"
              >
                अन्य पैकेट स्कैन करें • New Scan
              </button>
              <button
                onClick={() => navigate('/consumer')}
                className="btn btn-neutral flex-1 text-xs font-bold cursor-pointer"
              >
                नागरिक मुख्य पृष्ठ • Home
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
