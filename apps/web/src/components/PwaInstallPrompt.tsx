import React, { useState, useEffect } from 'react';
import { Download, X, Share2, PlusSquare, Smartphone, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOSModalOpen, setIsIOSModalOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    // 1. Detect if already running in standalone mode (installed)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    if (checkStandalone()) {
      return;
    }

    // 2. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    setIsIOSDevice(isIOS);

    // 3. Capture Chromium / Android beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if user dismissed recently (within 48 hours)
      const dismissedTimestamp = localStorage.getItem('metricheck_pwa_dismissed_at');
      if (dismissedTimestamp) {
        const hoursPassed = (Date.now() - parseInt(dismissedTimestamp, 10)) / (1000 * 60 * 60);
        if (hoursPassed < 48) {
          return;
        }
      }

      // Show banner after brief delay for smooth entrance
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    };

    // 4. Listen for manual trigger from Navigation Drawer or Settings
    const handleManualTrigger = () => {
      if (checkStandalone()) {
        alert('ऐप पहले से इंस्टॉल है • MetriCheck AI is already installed on this device.');
        return;
      }
      if (isIOS) {
        setIsIOSModalOpen(true);
      } else if (deferredPrompt) {
        handleInstallClick();
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('open-pwa-install', handleManualTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-install', handleManualTrigger);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (isIOSDevice) {
      setIsVisible(false);
      setIsIOSModalOpen(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback instruction for browsers without beforeinstallprompt
      alert('ब्राउज़र मेनू (⋮ या शेयर) खोलें और "Add to Home Screen / इंस्टॉल करें" चुनें।');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        console.log('[PWA] User accepted installation');
        setIsVisible(false);
      } else {
        console.log('[PWA] User dismissed installation prompt');
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('[PWA] Error launching install prompt:', err);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('metricheck_pwa_dismissed_at', Date.now().toString());
  };

  // If already standalone, do not render banner or modals
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* ═══ 1. FLOATING MOBILE INSTALL BANNER ═════════════════════════ */}
      {isVisible && (
        <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-navy-950/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-4 shadow-2xl text-white">
            {/* National Tricolor Line */}
            <div className="h-1 -mt-4 -mx-4 mb-3 rounded-t-2xl flex overflow-hidden">
              <div className="flex-1 bg-[#ff9933]" />
              <div className="flex-1 bg-white" />
              <div className="flex-1 bg-[#138808]" />
            </div>

            <div className="flex items-start gap-3.5">
              {/* App Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-navy-900 to-navy-800 border border-amber-500/50 flex items-center justify-center shrink-0 shadow-md">
                <img src="/favicon.svg" alt="MetriCheck" className="w-9 h-9" />
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-white truncate">MetriCheck AI</h4>
                  <span className="badge badge-xs bg-amber-500 text-navy-950 font-black text-[9px] px-1.5 py-0.5">
                    PWA App
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                  मोबाइल ऐप इंस्टॉल करें • Fast offline access & 1-tap packaging scanner
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center transition shrink-0 cursor-pointer"
                aria-label="Dismiss install prompt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Micro Highlights */}
            <div className="grid grid-cols-2 gap-2 my-3 py-2 px-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>कैमरा स्कैनिंग • Fast Scan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>विधिक मापविज्ञान मानक</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleInstallClick}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-navy-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 active:scale-98 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>ऐप इंस्टॉल करें • Install</span>
              </button>
              <button
                onClick={handleDismiss}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-semibold transition active:scale-98 cursor-pointer"
              >
                बाद में
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 2. IOS SAFARI STEP-BY-STEP INSTALL GUIDE MODAL ════════════ */}
      {isIOSModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-navy-900 border border-white/10 rounded-2xl p-5 text-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-navy-950 flex items-center justify-center font-bold">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">iPhone / iPad पर इंस्टॉल करें</h3>
                  <p className="text-[11px] text-slate-400">Add to Home Screen in Safari</p>
                </div>
              </div>
              <button
                onClick={() => setIsIOSModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* iOS Instructions */}
            <div className="space-y-3.5 text-xs text-slate-200">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-semibold text-white">Safari में शेयर बटन दबाएं</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    नीचे बार में <Share2 className="inline w-3.5 h-3.5 text-sky-400 mx-1" /> <strong>'Share'</strong> आइकन पर टैप करें।
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-semibold text-white">"Add to Home Screen" चुनें</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    सूची को स्क्रॉल करें और <PlusSquare className="inline w-3.5 h-3.5 text-amber-400 mx-1" /> <strong>'Add to Home Screen'</strong> पर टैप करें।
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-semibold text-white">ऊपर 'Add' पर टैप करें</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    MetriCheck AI आपकी होम स्क्रीन पर एक नेटिव ऐप की तरह आ जाएगा!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsIOSModalOpen(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-xs shadow-md transition cursor-pointer"
            >
              समझ गया • Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
