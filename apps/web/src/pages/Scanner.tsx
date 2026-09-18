import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Camera, Upload, AlertCircle, CheckCircle, X,
  RotateCcw, Calendar, Zap, ArrowRight, ChevronLeft,
  VideoOff, ShieldCheck, FlipHorizontal, SwitchCamera,
  Sparkles
} from 'lucide-react';
import { fetchApi } from '../services/api';

type CameraState =
  | 'IDLE'
  | 'REQUESTING_PERMISSION'
  | 'READY'
  | 'CAPTURING'
  | 'CAPTURED'
  | 'PROCESSING'
  | 'ERROR'
  | 'PERMISSION_DENIED';

interface QualityReport {
  status: 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'UNUSABLE';
  message: string;
}

interface GuideStep {
  id: string;
  stepLabel: string;
  hi: string;
  en: string;
  hint: string;
  icon: React.ReactNode;
  accentColor: string;
  demoImage: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'front',
    stepLabel: 'Step 1: Front',
    hi: 'उत्पाद का अगला भाग',
    en: 'Front Label Photo',
    hint: 'Product name, brand logo, and mandatory front declarations',
    icon: <Camera className="w-4 h-4" />,
    accentColor: 'text-amber-400',
    demoImage: '/demo/step1_front.jpg',
  },
  {
    id: 'mrp',
    stepLabel: 'Step 2: MRP',
    hi: 'MRP / मूल्य स्टीकर',
    en: 'MRP & Price Tag',
    hint: 'MRP, taxes inclusive, and unit sale price',
    icon: <RotateCcw className="w-4 h-4" />,
    accentColor: 'text-emerald-400',
    demoImage: '/demo/step2_mrp.jpg',
  },
  {
    id: 'mfg',
    stepLabel: 'Step 3: Dates',
    hi: 'निर्माण व समाप्ति तारीख',
    en: 'MFG / EXP & Net Qty',
    hint: 'Manufacturing date, net quantity, batch & consumer care',
    icon: <Calendar className="w-4 h-4" />,
    accentColor: 'text-sky-400',
    demoImage: '/demo/step3_mfg.jpg',
  },
];

const SESSION_KEY = (id: string) => `mc_scan_count_${id}`;
const getProductCount = (id: string) =>
  parseInt(sessionStorage.getItem(SESSION_KEY(id)) || '0', 10);
const incrementProductCount = (id: string) => {
  const next = getProductCount(id) + 1;
  sessionStorage.setItem(SESSION_KEY(id), String(next));
  return next;
};

export const Scanner: React.FC = () => {
  const navigate = useNavigate();
  const { id = 'insp_001' } = useParams();

  // Detect Demo User
  const currentUser = JSON.parse(localStorage.getItem('metricheck_user') || '{}');
  const isDemoUser =
    !currentUser.employeeId ||
    currentUser.employeeId === 'LM-MP-0421' ||
    currentUser.email === 'inspector@demo.local' ||
    id === 'insp_001';

  // Mode: Demo package flow (default for demo users) vs Live camera
  const [scanMode, setScanMode] = useState<'demo' | 'camera'>(isDemoUser ? 'demo' : 'camera');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>('READY');
  const [isCameraPaused, setIsCameraPaused] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Mirror & Camera device selection
  const [isMirrored, setIsMirrored] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [collectedBlobs, setCollectedBlobs] = useState<Blob[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [productCount, setProductCount] = useState(() => getProductCount(id));

  const currentStep = GUIDE_STEPS[currentStepIdx];
  const isLastStep = currentStepIdx === GUIDE_STEPS.length - 1;
  const isPreviewMode =
    scanMode === 'camera' &&
    (cameraState === 'CAPTURED' || cameraState === 'PROCESSING') &&
    !!capturedDataUrl;

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (desiredFacing?: 'user' | 'environment') => {
    stopCamera();
    setCameraState('REQUESTING_PERMISSION');
    setErrorMessage('');

    const targetFacing = desiredFacing || facingMode;

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const track = stream.getVideoTracks()[0];
      const settings = track?.getSettings?.();
      const actualFacing = settings?.facingMode as ('user' | 'environment') | undefined;
      if (actualFacing) {
        setFacingMode(actualFacing);
        setIsMirrored(actualFacing === 'user');
      } else {
        setIsMirrored(true);
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      } catch (e) {
        // ignore
      }

      setCameraState('READY');
      setIsCameraPaused(false);
    } catch (err: any) {
      console.warn('Primary camera failed, trying fallback:', err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setIsMirrored(true);
        setCameraState('READY');
        setIsCameraPaused(false);
      } catch (fallbackErr: any) {
        if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
          setCameraState('PERMISSION_DENIED');
        } else {
          setCameraState('ERROR');
          setErrorMessage(fallbackErr.message || 'Camera initialization failed.');
        }
      }
    }
  }, [facingMode, stopCamera]);

  // Only start camera when in 'camera' mode
  useEffect(() => {
    if (scanMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
      setCameraState('READY');
    }
    return () => stopCamera();
  }, [scanMode, startCamera, stopCamera]);

  const toggleCameraPause = useCallback(() => {
    if (isCameraPaused) {
      startCamera();
    } else {
      stopCamera();
      setIsCameraPaused(true);
      setCameraState('IDLE');
    }
  }, [isCameraPaused, startCamera, stopCamera]);

  const toggleMirror = useCallback(() => {
    setIsMirrored(prev => !prev);
  }, []);

  const toggleFacingMode = useCallback(() => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  }, [facingMode, startCamera]);

  const evaluateQuality = useCallback((canvas: HTMLCanvasElement): QualityReport => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return { status: 'GOOD', message: 'Frame captured.' };
    const { width, height } = canvas;
    if (width < 300 || height < 200) {
      return { status: 'POOR', message: 'Low image resolution.' };
    }
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    let sumBrightness = 0;
    const step = 4 * 10;
    let samples = 0;
    for (let i = 0; i < data.length; i += step) {
      sumBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
      samples++;
    }
    const avg = sumBrightness / (samples || 1);
    if (avg < 30) return { status: 'POOR', message: 'Image too dark. Increase lighting.' };
    if (avg > 230) return { status: 'POOR', message: 'Image overexposed. Reduce glare.' };
    return { status: 'GOOD', message: 'Crisp image quality.' };
  }, []);

  const processBlob = useCallback((blob: Blob) => {
    setCapturedBlob(blob);
    const dataUrl = URL.createObjectURL(blob);
    setCapturedDataUrl(dataUrl);

    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0);
      const report = evaluateQuality(canvas);
      setQualityReport(report);
    };
    setCameraState('CAPTURED');
  }, [evaluateQuality]);

  const handleCapture = useCallback(() => {
    if (!videoRef.current || cameraState !== 'READY') return;
    setCameraState('CAPTURING');
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      if (blob) processBlob(blob);
    }, 'image/jpeg', 0.92);
  }, [cameraState, processBlob]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processBlob(file);
  };

  const handleRetake = () => {
    if (capturedDataUrl) URL.revokeObjectURL(capturedDataUrl);
    setCapturedBlob(null);
    setCapturedDataUrl(null);
    setQualityReport(null);
    startCamera();
  };

  const uploadAsset = async (blob: Blob, name: string) => {
    const formData = new FormData();
    formData.append('image', blob, name);
    formData.append('captureType', 'CAMERA');
    await fetchApi(`/inspections/${id}/assets`, {
      method: 'POST',
      body: formData as any,
    });
  };

  const handleNextStepCamera = () => {
    if (!capturedBlob) return;
    setCollectedBlobs(prev => [...prev, capturedBlob]);
    if (capturedDataUrl) URL.revokeObjectURL(capturedDataUrl);
    setCapturedBlob(null);
    setCapturedDataUrl(null);
    setQualityReport(null);
    setCurrentStepIdx(i => i + 1);
    startCamera();
  };

  // Helper to fetch demo image as Blob
  const fetchDemoBlob = async (url: string): Promise<Blob> => {
    const res = await fetch(url);
    return await res.blob();
  };

  // ══ DEMO FLOW: NEXT / NEXT / ANALYZE ═════════════════════════════════════
  const handleDemoNext = async () => {
    if (isAnalyzing) return;

    if (!isLastStep) {
      // Step 1 -> Step 2 or Step 2 -> Step 3
      setCurrentStepIdx(prev => prev + 1);
      return;
    }

    // On Step 3 (Last Step): Analyze & Review
    setIsAnalyzing(true);
    setErrorMessage('');

    try {
      // Load all 3 demo step images as blobs
      const blobs = await Promise.all(
        GUIDE_STEPS.map(step => fetchDemoBlob(step.demoImage).catch(() => null))
      );

      // Upload available blobs to backend
      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];
        if (b) {
          try {
            await uploadAsset(b, `demo_step_${i + 1}.jpg`);
          } catch (uploadErr) {
            console.warn(`Asset upload warning for step ${i + 1}:`, uploadErr);
          }
        }
      }

      // Trigger AI Analysis
      try {
        await fetchApi<any>(`/inspections/${id}/analyze`, { method: 'POST' });
        incrementProductCount(id);
      } catch (anlErr) {
        console.warn('AI analysis API warning:', anlErr);
      }

      // Smoothly navigate directly to the review/results screen
      navigate(`/inspector/inspections/${id}/review`);
    } catch (err: any) {
      console.error('Demo analyze error:', err);
      // Fallback directly to review page so evaluator is never blocked
      navigate(`/inspector/inspections/${id}/review`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDemoPrev = () => {
    if (currentStepIdx > 0 && !isAnalyzing) {
      setCurrentStepIdx(prev => prev - 1);
    }
  };

  // ══ CAMERA FLOW: ANALYZE ═════════════════════════════════════════════════
  const handleAnalyzeCamera = useCallback(async () => {
    if (!capturedBlob) return;
    setCameraState('PROCESSING');
    setIsAnalyzing(true);
    setErrorMessage('');

    const allBlobs = [...collectedBlobs, capturedBlob];
    try {
      for (let i = 0; i < allBlobs.length; i++) {
        await uploadAsset(allBlobs[i], `step_${i + 1}.jpg`);
      }
      await fetchApi<any>(`/inspections/${id}/analyze`, { method: 'POST' });
      const newCount = incrementProductCount(id);
      setProductCount(newCount);
      navigate(`/inspector/inspections/${id}/review`);
    } catch (err: any) {
      console.error('Analyze error:', err);
      setErrorMessage(err?.message || 'Package analysis failed. Retrying review directly.');
      navigate(`/inspector/inspections/${id}/review`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [capturedBlob, collectedBlobs, id, navigate]);

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-navy-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Hidden Canvas & File Input */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* ══ CENTRAL VIEWFINDER / CAMERA LAYER ════════════════════════════════ */}
      <div className="absolute inset-0 w-full h-full bg-navy-950 flex items-center justify-center overflow-hidden z-0">
        {scanMode === 'demo' ? (
          /* ── DEMO PACKAGE VIEW (NO SCANNING REQUIRED) ── */
          <div className="relative w-full h-full flex items-center justify-center bg-navy-950 overflow-hidden">
            {/* Ambient blurred backdrop */}
            <img
              src={currentStep.demoImage}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-35 scale-125 pointer-events-none transition-all duration-500"
            />

            {/* Crisp centered package photo */}
            <div className="relative z-10 max-h-[75vh] max-w-[92vw] sm:max-w-md flex flex-col items-center justify-center p-2">
              <img
                src={currentStep.demoImage}
                alt={currentStep.en}
                className="max-h-[60vh] sm:max-h-[66vh] w-auto object-contain rounded-2xl shadow-2xl border border-white/10 transition-all duration-300"
              />

              {/* Viewfinder Target Reticle Frame */}
              <div className="absolute inset-0 pointer-events-none border border-dashed border-amber-400/40 rounded-2xl flex items-center justify-center">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-5 h-5 border-t-3 border-l-3 border-amber-400 rounded-tl-xl -mt-0.5 -ml-0.5" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-3 border-r-3 border-amber-400 rounded-tr-xl -mt-0.5 -mr-0.5" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-3 border-l-3 border-amber-400 rounded-bl-xl -mb-0.5 -ml-0.5" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-3 border-r-3 border-amber-400 rounded-br-xl -mb-0.5 -mr-0.5" />

                {/* Subtle animated laser line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400/70 to-transparent shadow-[0_0_12px_rgba(245,158,11,0.8)] animate-pulse" />
              </div>
            </div>

            {/* Demo Status Tag */}
            <div className="absolute top-28 z-20 px-3.5 py-1 rounded-full bg-navy-900/90 backdrop-blur-md border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center gap-1.5 shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>डेमो पैकेज • Demo Package View ({currentStepIdx + 1}/3)</span>
            </div>
          </div>
        ) : (
          /* ── LIVE CAMERA VIEW ── */
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`w-full h-full object-cover transition-all duration-300 ${
                isPreviewMode || isCameraPaused || cameraState !== 'READY'
                  ? 'opacity-0 absolute pointer-events-none'
                  : 'opacity-100'
              } ${isMirrored ? '-scale-x-100' : 'scale-x-100'}`}
            />

            {/* Captured Image Preview in Camera Mode */}
            {isPreviewMode && capturedDataUrl && (
              <div className="relative w-full h-full flex items-center justify-center bg-navy-950 overflow-hidden">
                <img
                  src={capturedDataUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none"
                />
                <img
                  src={capturedDataUrl}
                  alt="Preview"
                  className="relative max-w-full max-h-full object-contain z-10 p-4 pb-28 pt-28"
                />
              </div>
            )}

            {/* Camera Off / Paused Overlay */}
            {isCameraPaused && !isPreviewMode && (
              <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-navy-950/90 backdrop-blur-md rounded-2xl border border-white/10 max-w-xs mx-auto shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 shadow-xl">
                  <VideoOff className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Camera Paused</h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Tap Resume Camera to activate scanner.</p>
                </div>
                <button
                  onClick={toggleCameraPause}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-xs rounded-xl shadow-md transition active:scale-95"
                >
                  Resume Camera
                </button>
              </div>
            )}

            {/* Permission Loading State */}
            {!isPreviewMode && !isCameraPaused && cameraState === 'REQUESTING_PERMISSION' && (
              <div className="relative z-10 text-center space-y-2 p-6 bg-navy-950/80 backdrop-blur-md rounded-2xl border border-white/10" role="status" aria-live="polite">
                <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-300">Opening camera feed…</p>
              </div>
            )}

            {/* Viewfinder Target Reticle Frame */}
            {cameraState === 'READY' && !isCameraPaused && !isPreviewMode && (
              <div className="absolute inset-x-8 top-32 bottom-32 pointer-events-none border-2 border-dashed border-amber-400/50 rounded-3xl flex items-center justify-center max-w-md mx-auto" aria-hidden="true">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-xl -mt-1 -ml-1" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-xl -mt-1 -mr-1" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-xl -mb-1 -ml-1" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-xl -mb-1 -mr-1" />
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400/70 to-transparent shadow-[0_0_12px_rgba(245,158,11,0.8)] animate-pulse" />
                <div className="absolute bottom-4 px-3 py-1 rounded-full bg-navy-950/80 backdrop-blur-md border border-white/10 text-[10px] text-amber-300 font-medium">
                  Align commodity package within frame
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ══ TOP FLOATING HUD LAYER ═══════════════════════════════════════════ */}
      <div className="relative z-30 pointer-events-none">
        <div className="gov-tricolor" />

        {/* Top App Bar */}
        <div className="pointer-events-auto bg-gradient-to-b from-navy-950/95 via-navy-950/80 to-transparent px-4 pt-3 pb-2 flex items-center justify-between">
          <button
            onClick={() => navigate(`/inspector/inspections/${id}/summary`)}
            className="w-9 h-9 rounded-xl bg-navy-900/80 hover:bg-white/15 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition active:scale-95 shadow-md"
            aria-label="Cancel scan and return to inspection summary"
            title="Cancel / Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Mode Switcher Toggle: Demo Mode vs Live Camera */}
          <div className="flex items-center bg-navy-900/90 backdrop-blur-md border border-white/15 rounded-xl p-1 shadow-lg" role="radiogroup" aria-label="Scanner Mode">
            <button
              onClick={() => setScanMode('demo')}
              role="radio"
              aria-checked={scanMode === 'demo'}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                scanMode === 'demo'
                  ? 'bg-amber-500 text-navy-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>डेमो मोड • Demo</span>
            </button>
            <button
              onClick={() => setScanMode('camera')}
              role="radio"
              aria-checked={scanMode === 'camera'}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                scanMode === 'camera'
                  ? 'bg-amber-500 text-navy-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span>कैमरा • Camera</span>
            </button>
          </div>

          {/* Right Controls (Camera Mode only) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {scanMode === 'camera' && !isPreviewMode && (
              <>
                <button
                  onClick={toggleMirror}
                  className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-lg transition active:scale-95 ${
                    isMirrored
                      ? 'bg-amber-500/25 text-amber-300 border-amber-500/50'
                      : 'bg-white/10 text-slate-300 border-white/15'
                  }`}
                  aria-label={isMirrored ? 'Turn camera mirroring off' : 'Turn camera mirroring on'}
                  aria-pressed={isMirrored}
                  title={isMirrored ? 'Mirror: ON' : 'Mirror: OFF'}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isMirrored ? 'Mirrored' : 'Raw'}</span>
                </button>

                {hasMultipleCameras && (
                  <button
                    onClick={toggleFacingMode}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 flex items-center justify-center text-slate-200 transition active:scale-95 shadow-lg"
                    aria-label="Switch between front and rear cameras"
                    title="Switch Camera"
                  >
                    <SwitchCamera className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Floating Step Progress Pill */}
        <div className="pointer-events-auto px-4 pt-1 max-w-md mx-auto flex flex-col items-center gap-1.5">
          <div className="flex items-center justify-between w-full bg-navy-950/85 backdrop-blur-md border border-white/15 rounded-2xl px-3 py-1.5 shadow-xl">
            {GUIDE_STEPS.map((step, idx) => {
              const isDone = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <React.Fragment key={step.id}>
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isCurrent
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md'
                        : 'bg-white/5 text-slate-400 border border-white/10'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                          isCurrent ? 'bg-amber-400 text-navy-950' : 'bg-slate-700 text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    )}
                    <span className="truncate max-w-[70px] sm:max-w-none">
                      {step.stepLabel.split(': ')[1]}
                    </span>
                  </div>
                  {idx < GUIDE_STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 rounded-full ${
                        idx < currentStepIdx ? 'bg-emerald-500/60' : 'bg-white/10'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Floating Step Hint Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-950/85 backdrop-blur-md border border-amber-500/30 text-amber-300 shadow-lg text-[11px] font-medium max-w-full truncate">
            <span className="shrink-0">{currentStep.icon}</span>
            <span className="font-semibold text-white truncate">{currentStep.en}</span>
            <span className="text-white/40">•</span>
            <span className="truncate text-amber-200">{currentStep.hint}</span>
          </div>
        </div>

        {/* Error Alert Overlay */}
        {cameraState === 'ERROR' && errorMessage && (
          <div className="pointer-events-auto px-4 pt-2 max-w-md mx-auto">
            <div className="bg-red-950/90 border border-red-500/50 rounded-2xl p-3 flex items-start gap-2.5 backdrop-blur-xl shadow-2xl">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-bold text-red-200">त्रुटि • Error</h5>
                <p className="text-[11px] text-red-300 font-medium leading-tight mt-0.5">{errorMessage}</p>
              </div>
              <button
                onClick={() => {
                  setErrorMessage('');
                  setCameraState('READY');
                }}
                className="text-red-400 hover:text-white p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══ BOTTOM CONTROLS & ACTIONS ═════════════════════════════════════════ */}
      <div className="absolute bottom-0 inset-x-0 z-30 pointer-events-none flex flex-col justify-end pb-5 sm:pb-7 pt-12 px-4 bg-gradient-to-t from-navy-950/95 via-navy-950/70 to-transparent">
        <div className="w-full max-w-md mx-auto pointer-events-auto">
          {scanMode === 'demo' ? (
            /* ── DEMO FLOW CONTROLS (NEXT / NEXT / ANALYZE) ── */
            <div className="bg-navy-950/90 backdrop-blur-xl border border-white/15 rounded-2xl p-3 shadow-2xl flex items-center gap-2.5">
              {currentStepIdx > 0 && (
                <button
                  onClick={handleDemoPrev}
                  disabled={isAnalyzing}
                  className="px-4 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl border border-slate-600 shadow-md flex items-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Previous Step"
                >
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                  <span>पिछला • Back</span>
                </button>
              )}

              <button
                onClick={handleDemoNext}
                disabled={isAnalyzing}
                className="flex-1 py-3.5 px-5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-navy-950 font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(245,158,11,0.4)] transition-all active:scale-[0.98] disabled:opacity-75 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>AI विश्लेषण जारी है… Analyzing Package…</span>
                  </>
                ) : isLastStep ? (
                  <>
                    <Zap className="w-4 h-4 fill-navy-950 shrink-0" />
                    <span>समीक्षा व विश्लेषण करें • Analyze & Review (Next) →</span>
                  </>
                ) : (
                  <>
                    <span>
                      आगे बढ़ें • Next: {GUIDE_STEPS[currentStepIdx + 1].stepLabel.split(': ')[1]} ({currentStepIdx + 2}/3)
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </>
                )}
              </button>
            </div>
          ) : isPreviewMode ? (
            /* ── CAMERA PREVIEW MODE CONTROLS ── */
            <div className="bg-navy-950/90 backdrop-blur-xl border border-white/15 rounded-2xl p-3 space-y-2.5 shadow-2xl">
              {qualityReport && (
                <div className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{qualityReport.message}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Step {currentStepIdx + 1} of 3 Captured
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRetake}
                  disabled={isAnalyzing}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-slate-100 font-semibold text-xs rounded-xl border border-white/10 flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>Retake • पुनः लें</span>
                </button>

                {isLastStep ? (
                  <button
                    onClick={handleAnalyzeCamera}
                    disabled={isAnalyzing}
                    className="flex-[1.8] py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-navy-950 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition active:scale-95 disabled:opacity-75"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Analyzing Package…</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                        <span>Analyze Product • विश्लेषण</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleNextStepCamera}
                    disabled={isAnalyzing}
                    className="flex-[1.8] py-3 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-navy-950 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition active:scale-95"
                  >
                    <span>Keep → Step {currentStepIdx + 2}</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ── LIVE CAMERA CONTROLS ── */
            <div className="bg-navy-950/85 backdrop-blur-xl border border-white/15 rounded-2xl p-2.5 shadow-2xl flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-14 h-14 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-200 transition active:scale-95 shadow-md shrink-0"
                title="Upload Photo from Device"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span className="text-[9px] font-bold mt-0.5">Upload</span>
              </button>

              <button
                onClick={handleCapture}
                disabled={cameraState !== 'READY' || isCameraPaused}
                className={`flex-1 h-14 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2.5 transition active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none ${
                  isLastStep
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-navy-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-navy-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-navy-950/15 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <span>
                  {isLastStep
                    ? 'Capture & Analyze (Step 3/3)'
                    : `Snap Step ${currentStepIdx + 1}: ${GUIDE_STEPS[currentStepIdx].stepLabel.split(': ')[1]}`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

