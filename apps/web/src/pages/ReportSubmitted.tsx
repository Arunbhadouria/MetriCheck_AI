import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { CheckCircle2, Download, Share2, PlusCircle, LayoutDashboard, ShieldCheck, MapPin, Store, UserCheck, Copy, Check } from 'lucide-react';
import { fetchApi, getFullApiUrl } from '../services/api';

export const ReportSubmitted: React.FC = () => {
  const navigate = useNavigate();
  const { id = 'insp_001' } = useParams();
  const [inspection, setInspection] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('metricheck_user') || '{}');
  const isDemoUser = currentUser?.id === 'usr_inspector_1' || currentUser?.employeeId === 'LM-MP-0421';

  useEffect(() => {
    fetchApi<any>(`/inspections/${id}`)
      .then(res => setInspection(res?.data || res))
      .catch(() => setInspection(null));
  }, [id]);

  const handleDownloadPDF = () => {
    window.open(getFullApiUrl(`/inspections/${id}/pdf`), '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inspectionNumber = inspection?.inspectionNumber || (isDemoUser ? 'LM/MP/IND/2026/00987' : `LM/GOV/2026/${id.slice(-5)}`);
  const jurisdictionState = inspection?.jurisdictionState || currentUser?.jurisdictionState || 'Madhya Pradesh';
  const jurisdictionDistrict = inspection?.jurisdictionDistrict || currentUser?.jurisdictionDistrict || 'Indore';
  const shopName = inspection?.shopName || inspection?.establishmentName || (isDemoUser ? 'Sharma General Store' : 'Commercial Establishment');
  const officerName = inspection?.inspectorName || (currentUser?.name ? `${currentUser.name} (${currentUser.employeeId})` : 'Amit Verma (LM-MP-0421)');

  return (
    <div className="gov-page text-base-content pb-24">
      <Header title="प्रमाण पत्र • Report Submitted" showBack={false} />

      <div className="max-w-xl mx-auto p-4 md:p-6 space-y-4 text-center">
        {/* Success Animated Card */}
        <div className="gov-card p-6 space-y-3">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900">निरीक्षण रिपोर्ट सफलतापूर्वक दर्ज</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Official Inspection & Seizure Report Timestamped on Department Portal
            </p>
          </div>

          {/* Reference Card */}
          <div className="bg-base-100 p-4 rounded-2xl border border-base-300 space-y-1.5 text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              रिपोर्ट संदर्भ संख्या • Reference ID
            </span>
            <p className="text-base sm:text-lg font-bold text-orange-700 tracking-wider font-mono">
              {inspectionNumber}
            </p>
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <span className="badge badge-success badge-sm font-bold gap-1 text-[9px] uppercase">
                <ShieldCheck className="w-3 h-3" /> {jurisdictionState} e-Portal Verified
              </span>
            </div>
          </div>

          {/* Shop & Officer Badge */}
          <div className="text-xs text-slate-600 font-medium pt-1 flex items-center justify-center gap-2 flex-wrap">
            <span className="flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-orange-700" />
              <strong>{shopName}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {jurisdictionDistrict}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
              {officerName}
            </span>
          </div>
        </div>

        {/* Timeline Breakdown Card */}
        <div className="gov-card text-left">
          <div className="card-body p-4 sm:p-5 space-y-3">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider border-b border-base-300 pb-2">
              आगे क्या होगा • Statutory Procedural Steps
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-orange-50 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-orange-200">
                  1
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-navy-900">विधिक अभिलेखन • Portal Database Sync</p>
                  <p className="text-[10px] text-slate-500 font-medium">Seizure memo and AI vision evidence archived with cryptographic hash</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-orange-50 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-orange-200">
                  2
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-navy-900">व्यापारी को सूचना • Notice Served to Trader</p>
                  <p className="text-[10px] text-slate-500 font-medium">Official Form 4 Notice with compounding details dispatched via SMS / copy</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-orange-50 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-orange-200">
                  3
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-navy-900">शमन या न्यायालयीन सुनवाई • Compounding Hearing</p>
                  <p className="text-[10px] text-slate-500 font-medium">14 calendar days statutory window to deposit fee under Section 48</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-navy-900 text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-[0.99] cursor-pointer"
          >
            <Download className="w-4 h-4 text-orange-700 shrink-0" />
            <span>PDF डाउनलोड</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-navy-900 text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-[0.99] cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <Copy className="w-4 h-4 text-orange-700 shrink-0" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={() => navigate('/inspector/inspections/new')}
            className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-700/25 transition-all active:scale-[0.99] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>नया निरीक्षण शुरू करें • New Inspection</span>
          </button>

          <button
            onClick={() => navigate('/inspector/dashboard')}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-slate-900/20 transition-all active:scale-[0.99] cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4 text-amber-400 shrink-0" />
            <span>डैशबोर्ड पर जाएं • Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
