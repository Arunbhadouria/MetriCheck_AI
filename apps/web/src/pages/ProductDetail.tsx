import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Mic, AlertTriangle, CheckCircle, XCircle, Plus, Save, X, Edit2, ShieldCheck, CornerDownLeft } from 'lucide-react';
import { fetchApi } from '../services/api';

export const ProductDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id = 'insp_001', productId = 'prod_001' } = useParams();

  const [inspection, setInspection] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Manual Observation Modal state
  const [showModal, setShowModal] = useState(false);
  const [obsCategory, setObsCategory] = useState<'Label issue' | 'Weight discrepancy' | 'Price issue' | 'Date issue' | 'Other'>('Label issue');
  const [severity, setSeverity] = useState<'Minor' | 'Major' | 'Critical'>('Major');
  const [noteText, setNoteText] = useState('निर्माता का पता अस्पष्ट है। Mandatory details under Rule 6 PCR 2011 incomplete.');
  const [isRecording, setIsRecording] = useState(false);
  const [manualNote, setManualNote] = useState<string | null>(null);

  // Declaration Edit Modal state
  const [editingDecl, setEditingDecl] = useState<any>(null);
  const [editValue, setEditValue] = useState('');
  const [savingDecl, setSavingDecl] = useState(false);

  useEffect(() => {
    fetchApi<any>(`/inspections/${id}`)
      .then(res => {
        const data = res?.data || res;
        setInspection(data);
        const prod = data?.products?.find((p: any) => p.id === productId) || data?.products?.[0];
        setProduct(prod);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id, productId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showModal) setShowModal(false);
        if (editingDecl) setEditingDecl(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, editingDecl]);

  const handleSaveObservation = () => {
    setManualNote(`[${severity.toUpperCase()} - ${obsCategory}] ${noteText}`);
    setShowModal(false);
  };

  const handleOpenEditDecl = (decl: any) => {
    setEditingDecl(decl);
    setEditValue(decl.rawValue || '');
  };

  const handleSaveDecl = async () => {
    if (!editingDecl) return;
    setSavingDecl(true);
    try {
      await fetchApi(`/declarations/${editingDecl.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ rawValue: editValue })
      });
      if (product) {
        const updatedDecls = (product.declarations || []).map((d: any) =>
          d.id === editingDecl.id ? { ...d, rawValue: editValue } : d
        );
        setProduct({ ...product, declarations: updatedDecls });
      }
      setEditingDecl(null);
    } catch (err) {
      if (product) {
        const updatedDecls = (product.declarations || []).map((d: any) =>
          d.id === editingDecl.id ? { ...d, rawValue: editValue } : d
        );
        setProduct({ ...product, declarations: updatedDecls });
      }
      setEditingDecl(null);
    } finally {
      setSavingDecl(false);
    }
  };

  if (loading) {
    return (
      <div className="gov-page text-base-content pb-20">
        <Header title="उत्पाद विवरण • Product Detail" />
        <div className="max-w-xl mx-auto p-12 text-center space-y-3">
          <span className="loading loading-spinner loading-lg text-orange-700" />
          <p className="text-xs font-semibold text-slate-500">लोड हो रहा है… Loading details…</p>
        </div>
      </div>
    );
  }

  const declarations = product?.declarations || [];
  const ruleResults = product?.ruleResults || [];
  const failedRules = ruleResults.filter((r: any) => r.status === 'FAIL');
  const isPass = (product?.complianceStatus || (failedRules.length === 0 ? 'PASS' : 'FAIL')) === 'PASS';

  return (
    <div className="gov-page text-base-content pb-24">
      <Header title="उत्पाद विवरण • Product Detail" />

      <div className="max-w-xl mx-auto p-4 md:p-6 space-y-4">
        {/* Product Identity Header */}
        <div className="gov-card">
          <div className="card-body p-4 sm:p-5 flex flex-row items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] text-orange-700 font-mono font-semibold uppercase tracking-wider block">
                {product?.barcode || '8901234567890'} • {product?.category || 'Packaged Goods'}
              </span>
              <h2 className="text-base font-semibold text-navy-900 truncate mt-0.5">
                {product?.productName || 'Scanned Package'}
              </h2>
              <p className="text-xs text-slate-500 font-medium truncate">Brand: {product?.brand || 'Unknown'}</p>
            </div>
            <div className="shrink-0">
              <div
                className={`badge badge-md gap-1 font-semibold ${
                  isPass ? 'badge-success' : 'badge-error'
                }`}
              >
                {isPass ? <><CheckCircle className="w-3.5 h-3.5" /> PASS</> : <><XCircle className="w-3.5 h-3.5" /> FAIL</>}
              </div>
            </div>
          </div>
        </div>

        {/* Violations Section */}
        {failedRules.length > 0 && (
          <div className="gov-card border-error/40">
            <div className="card-body p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-error border-b border-base-300 pb-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  {failedRules.length} नियम उल्लंघन • Legal Violation{failedRules.length > 1 ? 's' : ''}
                </h3>
              </div>
              <div className="space-y-2">
                {failedRules.map((r: any, idx: number) => (
                  <div key={r.id || idx} className="p-3 bg-error/10 border border-error/30 rounded-xl space-y-1">
                    <p className="font-semibold text-xs text-error">{r.ruleTitle || 'Missing Declaration'}</p>
                    <p className="text-xs text-base-content/80 font-medium">{r.message || 'Mandatory declaration incomplete under PCR 2011'}</p>
                    <p className="text-[10px] text-base-content/50 font-bold">{r.sourceReference || 'Rule 6 PCR 2011'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* OCR Extracted Label Declarations (Editable) */}
        <div className="gov-card">
          <div className="card-body p-4 sm:p-5 space-y-3">
            <div className="flex justify-between items-center border-b border-base-300 pb-2">
              <h3 className="text-xs font-semibold text-navy-900 uppercase tracking-wider">
                घोषणाएं (OCR) • Declarations ({declarations.length})
              </h3>
              <span className="badge badge-ghost badge-xs font-semibold text-orange-700 bg-orange-50 border-orange-100">
                Tap pencil to edit
              </span>
            </div>

            <div className="space-y-2">
              {declarations.length === 0 ? (
                <p className="text-xs text-base-content/50 font-medium py-2 text-center">No OCR declarations extracted.</p>
              ) : (
                declarations.map((d: any) => (
                  <div
                    key={d.id}
                    className="flex justify-between items-center bg-base-100 p-3 rounded-xl text-xs border border-base-300 gap-2"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <span className="text-[9px] font-bold text-base-content/50 uppercase tracking-wider block">
                        {d.field}
                      </span>
                      <span className="text-base-content font-semibold truncate block">
                        {d.rawValue || 'Not Detected'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleOpenEditDecl(d)}
                      className="w-7 h-7 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 flex items-center justify-center shrink-0 shadow-xs transition-all cursor-pointer"
                      title="Edit Field"
                    >
                      <Edit2 className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Manual Observation Display */}
        {manualNote && (
          <div className="alert alert-warning text-xs p-4 font-semibold space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>निरीक्षक टिप्पणी • Inspector Note</span>
            </div>
            <p className="text-xs font-bold leading-relaxed">{manualNote}</p>
          </div>
        )}

        {/* Action Trigger Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => setShowModal(true)}
            className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-700/25 transition-all active:scale-[0.99] cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>मैनुअल टिप्पणी जोड़ें • Add Observation</span>
          </button>

          <button
            onClick={() => navigate(`/inspector/inspections/${id}/summary`)}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-slate-900/20 transition-all active:scale-[0.99] cursor-pointer"
          >
            <CornerDownLeft className="w-4 h-4 text-amber-400 shrink-0" />
            <span>सत्र सारांश पर लौटें • Back to Summary</span>
          </button>
        </div>
      </div>

      {/* Edit Declaration Modal (DaisyUI) */}
      {editingDecl && (
        <div className="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="edit-decl-title">
          <div className="modal-box bg-white border border-base-300 p-5 space-y-4 max-w-sm">
            <div className="flex justify-between items-center border-b border-base-300 pb-3">
              <div>
                <h3 id="edit-decl-title" className="text-sm font-semibold text-base-content">घोषणा संपादित करें • Edit OCR</h3>
                <p className="badge badge-warning badge-xs font-semibold uppercase tracking-wider mt-1">{editingDecl.field}</p>
              </div>
              <button
                onClick={() => setEditingDecl(null)}
                className="btn btn-ghost btn-xs btn-circle text-base-content/60"
                aria-label="Close edit declaration modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="form-control">
              <label htmlFor="edit-decl-val" className="label">
                <span className="label-text font-semibold text-xs">मान • Extracted Value</span>
              </label>
              <input
                id="edit-decl-val"
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="input input-bordered w-full text-xs font-medium bg-white"
              />
            </div>

            <div className="modal-action mt-3">
              <button
                onClick={handleSaveDecl}
                disabled={savingDecl}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-700/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingDecl ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <>
                    <Save className="w-4 h-4 shrink-0" />
                    <span>सहेजें • Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Observation Modal (DaisyUI) */}
      {showModal && (
        <div className="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="obs-modal-title">
          <div className="modal-box bg-white border border-base-300 p-5 space-y-4 max-w-md">
            <div className="flex justify-between items-center border-b border-base-300 pb-3">
              <div>
                <h3 id="obs-modal-title" className="text-sm font-bold text-navy-900">मैनुअल टिप्पणी • Observation</h3>
                <p className="text-[10px] text-slate-500 font-bold truncate mt-0.5">{product?.productName}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
                aria-label="Close observation modal"
              >
                <X className="w-4 h-4 shrink-0" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">श्रेणी • Category</label>
                <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Observation Category">
                  {(['Label issue', 'Weight discrepancy', 'Price issue', 'Date issue', 'Other'] as const).map((cat) => (
                    <button
                      key={cat}
                      role="radio"
                      aria-checked={obsCategory === cat}
                      onClick={() => setObsCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        obsCategory === cat
                          ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">गंभीरता • Severity</label>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Observation Severity">
                  {(['Minor', 'Major', 'Critical'] as const).map((sev) => (
                    <button
                      key={sev}
                      role="radio"
                      aria-checked={severity === sev}
                      onClick={() => setSeverity(sev)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center shadow-xs cursor-pointer ${
                        severity === sev
                          ? sev === 'Critical'
                            ? 'bg-red-600 text-white shadow-red-600/30'
                            : 'bg-amber-500 text-slate-950 shadow-amber-500/30'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label htmlFor="obs-note-text" className="label py-1">
                  <span className="label-text font-bold text-xs text-slate-700">विवरण • Note</span>
                </label>
                <div className="relative">
                  <textarea
                    id="obs-note-text"
                    rows={3}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="textarea textarea-bordered w-full text-xs font-medium bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setIsRecording(!isRecording)}
                    className={`btn btn-circle btn-xs absolute right-3 bottom-3 cursor-pointer ${
                      isRecording ? 'btn-error animate-pulse' : 'btn-primary'
                    }`}
                    aria-label={isRecording ? 'Stop voice recording' : 'Start voice recording'}
                    aria-pressed={isRecording}
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-action mt-3">
              <button
                onClick={handleSaveObservation}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-700/20 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4 shrink-0" />
                <span>टिप्पणी सहेजें • Save Observation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
