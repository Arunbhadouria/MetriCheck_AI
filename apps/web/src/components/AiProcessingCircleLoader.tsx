import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, Clock, X, ArrowRight } from 'lucide-react';
import { AiBackgroundTask } from '../services/aiBackgroundManager';

interface AiProcessingCircleLoaderProps {
  isOpen: boolean;
  tasks?: AiBackgroundTask[];
  title?: string;
  subtitle?: string;
  onClose?: () => void;
}

export const AiProcessingCircleLoader: React.FC<AiProcessingCircleLoaderProps> = ({
  isOpen,
  tasks = [],
  title,
  subtitle,
  onClose
}) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed(s => s + 1);
    }, 1000);

    // Auto-dismiss safety timer after 12 seconds
    const autoDismiss = setTimeout(() => {
      if (onClose) onClose();
    }, 12000);

    return () => {
      clearInterval(interval);
      clearTimeout(autoDismiss);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeTaskCount = tasks.length;
  const currentTask = tasks[0];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/85 backdrop-blur-md p-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="circle-loader-title"
    >
      <div className="bg-navy-900 border border-amber-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.7)] rounded-3xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full text-center space-y-6 relative overflow-hidden">
        {/* Close / Dismiss Button if stuck */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition z-20 cursor-pointer"
            title="Dismiss loader / रद्द करें"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {/* Tricolor Government Header Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-500 absolute top-0 left-0" />

        {/* ══ CIRCLE SPINNER LOADER ═════════════════════════════════════════ */}
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center pt-2">
          {/* Subtle Outer Pulsing Halo */}
          <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 animate-ping opacity-30" />
          
          {/* Rotating High-Precision Gradient Arc */}
          <svg className="w-28 h-28 animate-spin" viewBox="0 0 100 100" aria-hidden="true">
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-white/10"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="url(#gradient-circle-loader)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="180 80"
              fill="none"
            />
            <defs>
              <linearGradient id="gradient-circle-loader" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Glowing MetriCheck Sparkle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-400/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* ══ BILINGUAL HEADINGS & DESCRIPTION ═══════════════════════════════ */}
        <div className="space-y-2">
          <span className="badge badge-warning badge-sm font-black uppercase tracking-wider text-[10px] px-3 py-1">
            ⚡ विधिक मापविज्ञान AI प्रसंस्करण • AI Evaluation
          </span>
          <h3 id="circle-loader-title" className="text-base sm:text-lg font-black text-white tracking-wide">
            {title || 'AI विश्लेषण पूर्ण हो रहा है...'}
          </h3>
          <p className="text-xs text-amber-200/90 font-medium leading-relaxed px-2">
            {subtitle || 'कृपया प्रतीक्षा करें, पृष्ठभूमि में सभी स्कैन किए गए पैकेजों का OCR व नियम सत्यापन पूर्ण किया जा रहा है।'}
          </p>
          <p className="text-[11px] text-slate-400 font-normal">
            Finalizing OCR text extraction and Legal Metrology Rule compliance before submission...
          </p>
        </div>

        {/* ══ LIVE TASK PROGRESS PILL ════════════════════════════════════════ */}
        <div className="p-3 bg-navy-950/80 rounded-2xl border border-white/10 text-left flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-amber-400 animate-spin" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-200 truncate">
                {currentTask ? currentTask.productName : 'Scanned Commodity Packages'}
              </span>
              {activeTaskCount > 0 && (
                <span className="badge badge-neutral badge-xs font-mono text-amber-400 ml-2 shrink-0">
                  {activeTaskCount} active
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">
              Evaluating mandatory declarations under Legal Metrology Rules, 2011
            </p>
          </div>
        </div>

        {/* If taking longer than 5 seconds, provide reassuring fallback button */}
        {elapsed >= 5 && onClose && (
          <div className="pt-1 animate-in fade-in slide-in-from-bottom-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 rounded-xl text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>प्रतीक्षा छोड़ें व परिणाम देखें • Skip Wait & View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Security & Integrity Assurance Note */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-400 font-semibold pt-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verifying SHA-256 evidence integrity on server</span>
        </div>
      </div>
    </div>
  );
};
