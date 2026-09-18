import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, FileText, X, PlusCircle, CornerDownLeft, Scale, ShieldAlert, Camera } from 'lucide-react';
import { fetchApi } from '../services/api';

interface DeclarationItem {
  id: string;
  field: string;
  label: string;
  value: string;
  status: 'PASS' | 'FAIL';
  confidence: number;
  bbox?: { x: number; y: number; width: number; height: number };
}

export const ScanResult: React.FC = () => {
  const navigate = useNavigate();
  const { id = 'insp_001' } = useParams();
  const [inspection, setInspection] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBboxDecl, setSelectedBboxDecl] = useState<DeclarationItem | null>(null);

  useEffect(() => {
    fetchApi<any>(`/inspections/${id}`)
      .then(res => setInspection(res?.data || res))
      .catch((err) => console.error('Failed to load inspection:', err))
      .finally(() => setIsLoading(false));
  }, [id]);

  const product = inspection?.products?.[inspection.products.length - 1];

  if (isLoading) {
    return (
      <div className="gov-page text-base-content pb-24">
        <Header title="समीक्षा व क्रेडिट स्कोर • AI Compliance Review" />
        <div className="max-w-md mx-auto p-12 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">पैकेज डेटा लोड हो रहा है • Loading inspection data…</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="gov-page text-base-content pb-24">
        <Header title="समीक्षा व क्रेडिट स्कोर • AI Compliance Review" />
        <div className="max-w-md mx-auto p-6 mt-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-navy-900">कोई उत्पाद स्कैन नहीं मिला • No Scanned Product</h3>
            <p className="text-xs text-slate-500 mt-1">
              इस निरीक्षण में अभी तक किसी उत्पाद पैकेज का विश्लेषण नहीं हुआ है। कृपया पहले उत्पाद की फोटो खींचें या अपलोड करें।
            </p>
          </div>
          <button
            onClick={() => navigate(`/inspector/inspections/${id}/scan`)}
            className="btn bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold w-full text-xs gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>पैकेज स्कैनर शुरू करें • Launch Camera Scanner</span>
          </button>
        </div>
      </div>
    );
  }

  // Derive compliance credit score (0-100)
  const declarationsRaw = product?.declarations || [];
  const ruleResultsRaw = product?.ruleResults || [];
  const failedRules = ruleResultsRaw.filter((r: any) => r.status === 'FAIL');
  const criticalFails = failedRules.filter((r: any) => r.severity === 'CRITICAL');
  const highFails = failedRules.filter((r: any) => r.severity === 'HIGH');
  const mediumFails = failedRules.filter((r: any) => r.severity === 'MEDIUM');
  const reviewRequired = ruleResultsRaw.filter((r: any) => r.status === 'REVIEW_REQUIRED');

  let score = 100;
  score -= criticalFails.length * 35;
  score -= highFails.length * 25;
  score -= mediumFails.length * 15;
  score -= reviewRequired.length * 10;

  // If there are critical failures (like missing MRP, missing Net Quantity, or fictitious manufacturer),
  // cap score at 20 (Severe High Risk)
  if (criticalFails.length > 0) {
    score = Math.min(score, 20);
  } else if (failedRules.length >= 2) {
    score = Math.min(score, 40);
  } else if (failedRules.length === 1) {
    score = Math.min(score, 60);
  }

  score = Math.max(0, Math.min(100, score));

  // Determine Decision Action Tier
  let decisionTier: 'LEGAL_COMPLAINT' | 'MANUAL_REVIEW' | 'PASS' = 'PASS';
  if (failedRules.length > 0 || score < 50) {
    decisionTier = 'LEGAL_COMPLAINT';
  } else if (reviewRequired.length > 0 || score < 80) {
    decisionTier = 'MANUAL_REVIEW';
  }

  const isCompliant = failedRules.length === 0 && score >= 80;

  // Parse declarations into Compliant (Left) vs Violations (Right)
  const compliantList: DeclarationItem[] = [];
  const violationList: any[] = [...failedRules];

  declarationsRaw.forEach((d: any) => {
    const isFieldFailed = failedRules.some((r: any) => {
      if (d.field === 'MRP' && r.ruleCode === 'RULE-6-1-E') return true;
      if (d.field === 'NET_QUANTITY' && r.ruleCode === 'RULE-6-1-C') return true;
      if ((d.field === 'MANUFACTURER' || d.field === 'ADDRESS') && r.ruleCode === 'RULE-6-1-A') return true;
      if (d.field === 'MFG_DATE' && r.ruleCode === 'RULE-6-1-D') return true;
      if (d.field === 'PRODUCT_NAME' && r.ruleCode === 'RULE-6-1-B') return true;
      if (d.field === 'CONSUMER_CARE' && r.ruleCode === 'RULE-6-1-F') return true;
      if (d.field === 'BATCH_NUMBER' && r.ruleCode === 'RULE-6-1-G') return true;
      return false;
    });

    const isUndeclared = !d.rawValue || 
      d.rawValue === 'Not Detected' || 
      d.rawValue.includes('BLANK') || 
      d.rawValue.includes('UNDECLARED') ||
      /lorem\s*ipsum/i.test(d.rawValue);

    if (!isFieldFailed && !isUndeclared) {
      compliantList.push({
        id: d.id,
        field: d.field,
        label: d.field.replace(/_/g, ' '),
        value: d.rawValue,
        status: 'PASS',
        confidence: d.confidence || 0.95,
        bbox: d.bbox
      });
    }
  });

  return (
    <div className="gov-page text-base-content pb-24">
      <Header title="समीक्षा व क्रेडिट स्कोर • AI Compliance Review" />

      <div className="max-w-xl mx-auto p-4 md:p-6 space-y-4">
        {/* Product Identity Card */}
        <div className="gov-card">
          <div className="card-body p-4 sm:p-5 flex flex-row items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] text-orange-700 font-semibold uppercase tracking-wider font-mono block">
                {product?.barcode || '8901234567890'} • {product?.category || 'Packaged Commodities'}
              </span>
              <h2 className="text-base font-semibold text-navy-900 truncate mt-0.5">
                {product?.productName || 'Scanned Package'}
              </h2>
              <p className="text-xs text-slate-500 font-medium truncate">Brand: {product?.brand || 'Unknown'}</p>
            </div>
            <div className="shrink-0">
              <div
                className={`badge badge-md gap-1 font-semibold ${
                  isCompliant ? 'badge-success' : 'badge-error text-white'
                }`}
              >
                {isCompliant ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>{isCompliant ? 'PASS' : 'FAIL'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══ 0-100 CREDIT SCORE CARD ═════════════════════════════════════════ */}
        <div className="gov-card">
          <div className="card-body p-4 sm:p-5 space-y-3">
            <div className="flex justify-between items-center border-b border-base-300 pb-3">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  AI COMPLIANCE CREDIT SCORE
                </span>
                <h3 className="text-sm font-semibold text-navy-900 mt-0.5">अनुपालन स्कोर (0 - 100)</h3>
              </div>
              <div className="text-right">
                <span
                  className={`text-3xl font-semibold ${
                    score >= 80 ? 'text-success' : score >= 45 ? 'text-warning' : 'text-error'
                  }`}
                >
                  {score}
                </span>
                <span className="text-xs text-slate-400 font-medium"> / 100</span>
              </div>
            </div>

            {/* DaisyUI Progress Bar */}
            <div className="space-y-1.5">
              <progress
                className={`progress w-full h-3.5 ${
                  score >= 80 ? 'progress-success' : score >= 45 ? 'progress-warning' : 'progress-error'
                }`}
                value={score}
                max="100"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold uppercase">
                <span>0 (High Risk)</span>
                <span>50 (Moderate)</span>
                <span>100 (Compliant)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══ DUAL-COLUMN LAYOUT: Compliant (Left) vs Violations (Right) ════════ */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-navy-900 uppercase tracking-wider px-1">
            विश्लेषण तुलना • Dual Inspection Breakdown
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* LEFT COLUMN: 🟢 Compliant Declarations */}
            <div className="gov-card border-success/30">
              <div className="card-body p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-base-200 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-success"></span>
                    <h4 className="text-xs font-semibold text-navy-900">वैध जानकारी (Valid)</h4>
                  </div>
                  <span className="badge badge-success badge-xs font-bold font-mono">
                    {compliantList.length}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {compliantList.length === 0 ? (
                    <p className="text-[11px] text-base-content/60 italic py-2">No compliant fields detected.</p>
                  ) : (
                    compliantList.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedBboxDecl(item)}
                        className="bg-success/5 hover:bg-success/10 border border-success/20 rounded-lg p-2 transition cursor-pointer flex justify-between items-start"
                      >
                        <div className="min-w-0 pr-1">
                          <span className="text-[9px] font-semibold text-success uppercase block tracking-wider">
                            {item.label}
                          </span>
                          <span className="text-xs font-semibold text-navy-900 line-clamp-2 mt-0.5">
                            {item.value}
                          </span>
                        </div>
                        <span className="badge badge-success badge-xs text-[8px] font-mono shrink-0">
                          {Math.round(item.confidence * 100)}%
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: 🔴 Detected Violations */}
            <div className="gov-card border-error/30">
              <div className="card-body p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-base-200 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-error"></span>
                    <h4 className="text-xs font-semibold text-navy-900">उल्लंघन (Violations)</h4>
                  </div>
                  <span className="badge badge-error badge-xs font-bold font-mono text-white">
                    {violationList.length}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {violationList.length === 0 ? (
                    <p className="text-[11px] text-success font-medium py-2">✓ Zero Rule Violations Detected.</p>
                  ) : (
                    violationList.map((r: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-error/5 border border-error/20 rounded-lg p-2 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="badge badge-error badge-xs text-white text-[8px] font-bold font-mono">
                            {r.ruleCode}
                          </span>
                          <span className="text-[8px] font-semibold text-error uppercase">
                            {r.severity}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-navy-900 leading-snug">
                          {r.message}
                        </p>
                        {r.expectedValue && (
                          <div className="text-[9px] text-base-content/60 border-t border-error/10 pt-1 mt-1">
                            <span className="font-semibold text-slate-500">Expected: </span>
                            {r.expectedValue}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ AUTOMATED DECISION / ACTION CARD ═════════════════════════════════ */}
        <div className="gov-card">
          <div className="card-body p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-base-300 pb-2.5">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-orange-700" />
                <h4 className="text-xs font-semibold text-navy-900 uppercase tracking-wider">
                  स्वचालित कार्रवाई • Automated Decision
                </h4>
              </div>
              <span className="text-[9px] font-bold text-slate-400">MetriCheck Legal Metrology Engine</span>
            </div>

            {decisionTier === 'LEGAL_COMPLAINT' && (
              <div className="space-y-3">
                <div className="alert alert-error text-xs p-3.5 shadow-md text-white">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <div>
                    <h5 className="font-bold text-xs">गंभीर उल्लंघन • धारा 36/39 कानूनी नोटिस आवश्यक</h5>
                    <p className="text-[11px] font-medium opacity-90 mt-0.5">
                      Statutory violations detected under Legal Metrology Act, 2009 (Sec 36). Immediate issuance of Form 4 / Seizure Notice and compounding penalty recommended.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/inspector/inspections/${id}/report`)}
                  className="btn btn-gov-danger w-full text-white font-bold text-xs sm:text-sm py-3.5 px-5 rounded-xl shadow-xl shadow-red-900/30 flex items-center justify-center gap-2.5 transition active:scale-[0.98]"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>धारा 36 / 39 चालान जारी करें • Issue Seizure Notice / Form 4</span>
                </button>
              </div>
            )}

            {decisionTier === 'MANUAL_REVIEW' && (
              <div className="space-y-3">
                <div className="alert alert-warning text-xs p-3.5">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <div>
                    <h5 className="font-semibold text-xs">मैन्युअल अधिकारी समीक्षा हेतु भेजें</h5>
                    <p className="text-[11px] font-medium opacity-90 mt-0.5">
                      Moderate defects detected. Recommended for manual review by Senior Inspector before issuing violation notice.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/inspector/inspections/${id}/summary`)}
                  className="btn btn-warning w-full font-bold text-xs sm:text-sm py-3.5 px-5 rounded-xl shadow-lg flex items-center justify-center gap-2.5 transition active:scale-[0.98]"
                >
                  <CornerDownLeft className="w-4 h-4 shrink-0" />
                  <span>समीक्षा हेतु भेजें • Forward for Manual Review</span>
                </button>
              </div>
            )}

            {decisionTier === 'PASS' && (
              <div className="space-y-3">
                <div className="alert alert-success text-xs p-3.5">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <div>
                    <h5 className="font-semibold text-xs">पूर्ण अनुपालन स्वीकृत • Verified Compliant</h5>
                    <p className="text-[11px] font-medium opacity-90 mt-0.5">
                      All mandatory package declarations under Legal Metrology Rules, 2011 verified.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/inspector/inspections/${id}/summary`)}
                  className="btn btn-gov-success w-full font-bold text-xs sm:text-sm py-3.5 px-5 rounded-xl shadow-lg shadow-emerald-900/25 flex items-center justify-center gap-2.5 transition active:scale-[0.98]"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>डिजिटल प्रमाण पत्र जारी करें • Approve & Pass</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Navigation Actions */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => navigate(`/inspector/inspections/${id}/scan`)}
            className="btn w-full bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs sm:text-sm py-3 px-5 rounded-xl shadow-md shadow-navy-950/20 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>अगला उत्पाद जोड़ें • Add Next Product</span>
          </button>
        </div>
      </div>

      {/* DaisyUI Evidence Modal */}
      {selectedBboxDecl && (
        <div className="modal modal-open">
          <div className="modal-box bg-white border border-base-300 p-5 space-y-4 max-w-sm">
            <div className="flex justify-between items-center border-b border-base-300 pb-3">
              <div>
                <span className="badge badge-warning badge-xs font-semibold uppercase text-[8px]">AI OCR LOCATOR</span>
                <h3 className="text-sm font-semibold text-navy-900 mt-1">{selectedBboxDecl.label}</h3>
                <p className="text-xs font-bold text-success">{selectedBboxDecl.value}</p>
              </div>
              <button
                onClick={() => setSelectedBboxDecl(null)}
                className="btn btn-ghost btn-xs btn-circle text-base-content/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-full h-52 bg-base-100 rounded-2xl overflow-hidden border border-base-300 flex items-center justify-center p-4">
              <div className="text-center text-base-content/80 font-semibold text-sm">{product?.productName || 'Package View'}</div>
              <div className="absolute inset-4 border-2 border-dashed border-amber-400/60 rounded-xl flex items-center justify-center pointer-events-none">
                <span className="badge badge-warning font-semibold text-[9px]">
                  OCR Region ({Math.round(selectedBboxDecl.confidence * 100)}%)
                </span>
              </div>
            </div>

            <div className="modal-action mt-0">
              <button
                onClick={() => setSelectedBboxDecl(null)}
                className="btn btn-sm btn-block btn-neutral font-bold text-xs"
              >
                Close Overlay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
