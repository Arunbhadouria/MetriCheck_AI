import React from 'react';
import { ShieldAlert, ArrowRight, X, ShieldCheck } from 'lucide-react';

interface RoleSwitchModalProps {
  isOpen: boolean;
  currentRole: 'CITIZEN' | 'INSPECTOR';
  targetRole: 'CITIZEN' | 'INSPECTOR';
  onCancel: () => void;
  onConfirm: () => void;
}

export const RoleSwitchModal: React.FC<RoleSwitchModalProps> = ({
  isOpen,
  currentRole,
  targetRole,
  onCancel,
  onConfirm
}) => {
  if (!isOpen) return null;

  const isCurrentCitizen = currentRole === 'CITIZEN';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-modal-title"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden scale-100 transition-all">
        {/* Top Gov Tricolor Bar */}
        <div className="gov-tricolor" />

        {/* Modal Header */}
        <div className="p-5 pb-3 flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="badge badge-warning badge-xs font-bold text-[9px] mb-1">
              भूमिका सत्यापन • ROLE VERIFICATION
            </span>
            <h3 id="role-modal-title" className="text-base font-extrabold text-navy-950 leading-tight">
              {isCurrentCitizen
                ? 'निरीक्षक पोर्टल में प्रवेश • Switch to Inspector'
                : 'नागरिक पोर्टल में प्रवेश • Switch to Citizen'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Role-Based Access Control (RBAC) Alert
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-5 py-3 space-y-3 text-xs text-slate-700">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <p className="font-medium leading-relaxed">
              आप वर्तमान में{' '}
              <strong className="text-navy-950">
                {isCurrentCitizen ? 'नागरिक (Citizen)' : 'विधिक माप विज्ञान अधिकारी (Inspector)'}
              </strong>{' '}
              के रूप में लॉग इन हैं।
            </p>
            <p className="text-slate-600 leading-relaxed font-normal">
              क्या आप वर्तमान सत्र से लॉगआउट करके{' '}
              <strong className="text-navy-950">
                {isCurrentCitizen ? 'निरीक्षक (Inspector)' : 'नागरिक (Consumer)'}
              </strong>{' '}
              के रूप में लॉगिन करना चाहते हैं?
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>सुरक्षा हेतु दोनों खातों के सत्र पूर्णतः पृथक रखे जाते हैं।</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-5 pt-3 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs transition active:scale-95 shadow-xs cursor-pointer text-center"
          >
            नहीं, वापस जाएं (No, Stay)
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-navy-950 font-extrabold text-xs transition active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>हाँ, लॉगिन करें</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
