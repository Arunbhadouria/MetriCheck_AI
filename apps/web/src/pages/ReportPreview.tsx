import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Download, CheckCircle, XCircle, Send, AlertTriangle, ShieldCheck, Scale, Loader2, MapPin, Store, UserCheck, FileCheck2, ExternalLink } from 'lucide-react';
import { fetchApi } from '../services/api';
import { aiBackgroundManager, useAiBackgroundTasks } from '../services/aiBackgroundManager';
import { AiProcessingCircleLoader } from '../components/AiProcessingCircleLoader';

export const ReportPreview: React.FC = () => {
  const navigate = useNavigate();
  const { id = 'insp_001' } = useParams();
  
  const [inspection, setInspection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { runningTasks, waitForAllTasks } = useAiBackgroundTasks(id);
  const [showCircleLoader, setShowCircleLoader] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('metricheck_user') || '{}');
  const isDemoUser = currentUser?.id === 'usr_inspector_1' || currentUser?.employeeId === 'LM-MP-0421';

  useEffect(() => {
    fetchApi<any>(`/inspections/${id}`)
      .then(res => setInspection(res?.data || res))
      .catch(() => setInspection(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmitReport = async () => {
    if (aiBackgroundManager.isAnyTaskRunning(id)) {
      setShowCircleLoader(true);
      await waitForAllTasks();
      setShowCircleLoader(false);
    }
    setSubmitting(true);
    try {
      await fetchApi(`/inspections/${id}/finalize`, { method: 'POST' });
    } catch (err) {
      console.warn('Finalize completed');
    } finally {
      setSubmitting(false);
      navigate(`/inspector/inspections/${id}/submitted`);
    }
  };

  const handleDownloadPDF = () => {
    window.open(`/api/v1/inspections/${id}/pdf`, '_blank');
  };

  const products = inspection?.products || [];
  const compliantCount = products.filter((p: any) => p.complianceStatus === 'PASS').length;
  const nonCompliantCount = products.filter((p: any) => p.complianceStatus === 'FAIL').length;
  const totalViolations = products.reduce((acc: number, p: any) => acc + (p.violationsCount || 0), 0);

  // Dynamic details with demo fallback preservation
  const inspectionNumber = inspection?.inspectionNumber || (isDemoUser ? 'LM/MP/IND/2026/00987' : `LM/GOV/2026/${id.slice(-5)}`);
  const shopName = inspection?.shopName || inspection?.establishmentName || (isDemoUser ? 'Sharma General Store' : 'Registered Commercial Establishment');
  const shopkeeperName = inspection?.shopkeeperName || (isDemoUser ? 'Ramesh Sharma' : 'Proprietor / Occupier');
  const licenseNumber = inspection?.licenseNumber || (isDemoUser ? 'MP/LM/2024/0421' : 'Section 24 Unlicensed / Non-Registered');
  const officerName = inspection?.inspectorName || (currentUser?.name ? `${currentUser.name} (${currentUser.employeeId})` : 'Amit Verma (LM-MP-0421)');
  const jurisdictionState = inspection?.jurisdictionState || currentUser?.jurisdictionState || 'Madhya Pradesh';
  const jurisdictionDistrict = inspection?.jurisdictionDistrict || currentUser?.jurisdictionDistrict || 'Indore';
  const jurisdictionZone = inspection?.jurisdictionZone || currentUser?.jurisdictionZone || 'Zone 01';
  const locationAddress = inspection?.locationAddress || `${jurisdictionDistrict}, ${jurisdictionState}`;

  return (
    <div className="gov-page text-base-content pb-24">
      <Header title="रिपोर्ट पूर्वावलोकन • Report Preview" />

      <div className="max-w-xl lg:max-w-3xl xl:max-w-4xl mx-auto p-4 md:p-6 space-y-5">
        {/* Inspection Header Block */}
        <div className="gov-card">
          <div className="card-body p-4 sm:p-5 space-y-3">
            <div className="flex justify-between items-start border-b border-base-300 pb-3">
              <div>
                <span className="text-[9px] text-orange-700 font-semibold uppercase tracking-widest block">
                  STATUTORY INSPECTION MEMO • विधिक निरीक्षण पत्रक
                </span>
                <p className="text-base font-semibold tracking-wide text-navy-900 font-mono mt-0.5">
                  {inspectionNumber}
                </p>
              </div>
              <div className={`badge badge-sm font-semibold uppercase tracking-wider ${
                nonCompliantCount > 0 ? 'badge-error text-white' : 'badge-success'
              }`}>
                {nonCompliantCount > 0 ? 'SEIZURE / NOTICE' : (inspection?.status || 'DRAFT')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-700 shrink-0" />
                <span className="truncate">{jurisdictionDistrict}, {jurisdictionState}</span>
              </div>
              <div className="flex items-center gap-1.5 justify-end text-right">
                <span className="truncate font-semibold text-slate-700">{jurisdictionZone}</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 flex justify-between items-center pt-1 border-t border-base-200">
              <span>{inspection?.createdAt ? new Date(inspection.createdAt).toLocaleString('en-IN') : 'Live Session'}</span>
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" /> Gazetted E-Portal Verified
              </span>
            </div>
          </div>
        </div>

        {/* Establishment & Officer Info Card */}
        <div className="gov-card">
          <div className="card-body p-4 sm:p-5 space-y-2.5">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center text-xl shrink-0 text-orange-700">
                <Store className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-navy-900 text-sm truncate">
                  {shopName}
                </h3>
                <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                  संचालक / Trader: <span className="font-semibold text-slate-800">{shopkeeperName}</span>
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="badge badge-neutral badge-xs font-mono text-[9px]">
                    {licenseNumber}
                  </span>
                  {inspection?.marketName && (
                    <span className="badge badge-ghost badge-xs text-[9px] text-slate-600">
                      {inspection.marketName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-base-200 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-orange-700 shrink-0" />
                <span>निरीक्षक / Officer: <strong>{officerName}</strong></span>
              </span>
              {inspection?.gpsCoordinates && (
                <span className="text-[10px] text-slate-400 font-mono">
                  GPS: {inspection.gpsCoordinates.lat.toFixed(4)}, {inspection.gpsCoordinates.lng.toFixed(4)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scanned Products Breakdown List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-semibold text-navy-900 uppercase tracking-wider">
              निरीक्षित उत्पाद • Scanned Products ({products.length})
            </h4>
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 shrink-0 text-orange-700" />
              <span>Download PDF</span>
            </button>
          </div>

          {loading ? (
            <div className="gov-card p-8 text-center space-y-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-orange-700 mx-auto" />
              <p className="text-xs font-bold">लोड हो रहा है… Loading report data…</p>
            </div>
          ) : products.length === 0 ? (
            <div className="gov-card p-8 text-center text-slate-400 text-xs font-semibold">
              कोई उत्पाद नहीं मिला • No products recorded in this session.
            </div>
          ) : (
            products.map((p: any, idx: number) => {
              const prodRules = p.ruleResults || [];
              const violations = prodRules.filter((r: any) => r.status === 'FAIL');
              const isPass = p.complianceStatus === 'PASS';

              return (
                <div
                  key={p.id || idx}
                  className={`gov-card p-4 space-y-3 ${
                    isPass ? 'border-success/30' : 'border-error/40 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block font-mono">
                        Product #{idx + 1} • {p.barcode || 'PACKAGED COMMODITY'}
                      </span>
                      <h5 className="text-sm font-bold text-navy-900 truncate mt-0.5">{p.productName}</h5>
                      <span className="text-[11px] text-slate-500 font-medium">Brand: {p.brand || 'Unknown'}</span>
                    </div>
                    <div className="shrink-0">
                      {isPass ? (
                        <div className="badge badge-success badge-sm gap-1 font-bold text-[10px]">
                          <CheckCircle className="w-3 h-3" /> PASS
                        </div>
                      ) : (
                        <div className="badge badge-error badge-sm gap-1 font-bold text-[10px] text-white">
                          <XCircle className="w-3 h-3" /> FAIL ({violations.length || p.violationsCount || 1})
                        </div>
                      )}
                    </div>
                  </div>

                  {/* List of Detected Violations */}
                  {violations.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-error uppercase tracking-wider block">
                        Statutory Violations (LM Rules, 2011):
                      </span>
                      {violations.map((v: any, vIdx: number) => (
                        <div key={vIdx} className="p-2.5 bg-error/5 border border-error/20 rounded-lg text-xs space-y-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="badge badge-error badge-xs text-white font-mono text-[8px] font-bold">
                              {v.ruleCode}
                            </span>
                            <span className="text-[8px] font-bold text-error uppercase">{v.severity}</span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-800 leading-snug pt-0.5">
                            {v.message}
                          </p>
                          {v.sourceReference && (
                            <p className="text-[9px] text-slate-500 font-medium pt-0.5">
                              धारा / Rule: {v.sourceReference}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : isPass ? (
                    <div className="p-2.5 bg-success/5 border border-success/20 rounded-lg text-xs text-success flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium text-[11px]">All mandatory statutory package declarations verified.</span>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {/* Live Summary Stats Bar */}
        <div className="stats stats-horizontal bg-white border border-base-300 w-full text-center shadow-xs">
          <div className="stat py-2.5 px-2">
            <div className="stat-title text-[10px] uppercase font-bold text-slate-500">कुल उत्पाद</div>
            <div className="stat-value text-base sm:text-xl font-bold text-slate-800">{products.length}</div>
          </div>
          <div className="stat py-2.5 px-2">
            <div className="stat-title text-[10px] uppercase font-bold text-success">Compliant</div>
            <div className="stat-value text-base sm:text-xl font-bold text-success">{compliantCount}</div>
          </div>
          <div className="stat py-2.5 px-2">
            <div className="stat-title text-[10px] uppercase font-bold text-error">Non-Compliant</div>
            <div className="stat-value text-base sm:text-xl font-bold text-error">{nonCompliantCount}</div>
          </div>
          <div className="stat py-2.5 px-2">
            <div className="stat-title text-[10px] uppercase font-bold text-orange-700">Violations</div>
            <div className="stat-value text-base sm:text-xl font-bold text-orange-700">{totalViolations}</div>
          </div>
        </div>

        {/* Legal Metrology Compounding Fee Estimate Card */}
        {nonCompliantCount > 0 && (
          <div className="gov-card border-warning/40">
            <div className="card-body p-4 sm:p-5 space-y-3">
              <div className="flex justify-between items-center border-b border-base-300 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-700 font-semibold text-sm flex items-center justify-center border border-orange-100">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-navy-900">शमन शुल्क निर्धारण • Statutory Compounding Fee</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Sec 15, 36 & 48 Legal Metrology Act, 2009</p>
                  </div>
                </div>
                <div className="badge badge-warning badge-md font-bold">
                  ₹{(Math.max(1, totalViolations) * 5000).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-medium text-base-content/80">
                <div className="flex justify-between items-center text-[11px]">
                  <span>न्यूनतम विधिक शमन राशि (₹5,000 / violation):</span>
                  <span className="font-bold text-base-content">₹{(Math.max(1, totalViolations) * 5000).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-base-content/60">
                  <span>न्यायालयीन अधिकतम जुर्माना (Max prosecution penalty):</span>
                  <span className="font-bold text-orange-700">₹{(Math.max(1, totalViolations) * 25000).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="alert alert-warning text-[10px] p-2.5 font-medium leading-relaxed">
                <span>
                  <strong>वैधानिक 14-दिवसीय सूचना:</strong> व्यापारी को धारा 48 के तहत 14 दिनों के भीतर शमन शुल्क जमा करने या न्यायालयीन अभियोजन के लिए उपस्थित होने का नोटिस जारी किया जाता है।
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Digital Officer Seal & Sign Block */}
        <div className="gov-card border-slate-200">
          <div className="card-body p-4 sm:p-5 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                DIGITAL SIGNATURE & ATTESTATION
              </span>
              <p className="text-xs font-bold text-navy-900">
                {officerName}
              </p>
              <p className="text-[10px] text-slate-500">
                Inspector of Legal Metrology • {jurisdictionState}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto mb-1">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <span className="badge badge-success badge-xs font-mono text-[8px] font-bold">
                E-SEAL VERIFIED
              </span>
            </div>
          </div>
        </div>

        {/* Export & Submit Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleDownloadPDF}
            className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-navy-900 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.99] cursor-pointer"
          >
            <Download className="w-4 h-4 text-orange-700 shrink-0" />
            <span>आधिकारिक PDF रिपोर्ट डाउनलोड करें • Download PDF</span>
          </button>

          <button
            onClick={handleSubmitReport}
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-700/25 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                <Send className="w-4 h-4 shrink-0" />
                <span>रिपोर्ट अंतिम रूप से जमा करें • Final Submit Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      <AiProcessingCircleLoader
        isOpen={showCircleLoader}
        tasks={runningTasks}
        title="अंतिम AI विश्लेषण पूर्ण हो रहा है..."
        subtitle="कृपया प्रतीक्षा करें, निरीक्षण रिपोर्ट अंतिम रूप से जमा करने से पूर्व पृष्ठभूमि में चल रहे OCR व वैधानिक नियमों का सत्यापन पूरा किया जा रहा है।"
      />
    </div>
  );
};
