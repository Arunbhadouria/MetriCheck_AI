import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Camera, Upload, AlertCircle, CheckCircle, X,
  RotateCcw, Calendar, Zap, ArrowRight, ChevronLeft,
  VideoOff, ShieldCheck, FlipHorizontal, SwitchCamera,
  Sparkles, Layers, PlusCircle, Clock
} from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';
import { aiBackgroundManager, useAiBackgroundTasks } from '../../services/aiBackgroundManager';
import { AiProcessingCircleLoader } from '../../components/AiProcessingCircleLoader';
import { fetchApi } from '../../services/api';

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

export interface ScannedConsumerProduct {
  id: string;
  name: string;
  brand: string;
  barcode: string;
  printedMrp: number;
  stickerPrice?: number;
  expiryDate: string;
  mfgDate: string;
  netWeight: string;
  manufacturer: string;
  customerCare: string;
  violations: string[];
  unitSalePrice: string;
  status: 'PASS' | 'VIOLATION';
  stepImages?: {
    front?: string;
    mrp?: string;
    dates?: string;
  };
}

const DEMO_PRESET_CATALOG: Record<string, {
  product: ScannedConsumerProduct;
  steps: { frontImg: string; mrpImg: string; mfgImg: string };
}> = {
  demo_chips: {
    product: {
      id: 'prod_chips_1',
      name: 'Lays Classic Salted Potato Chips 50g',
      brand: 'Lays / PepsiCo India Holdings',
      barcode: '8901491101831',
      printedMrp: 20,
      stickerPrice: 25,
      expiryDate: '2026-11-20',
      mfgDate: '2026-07-15',
      netWeight: '50 g',
      manufacturer: 'PepsiCo India Holdings Pvt. Ltd., Village Channo, Sangrur, Punjab',
      customerCare: '1800-22-4020 / consumer.feedback@pepsico.com',
      violations: ['DUAL_MRP_STICKER', 'SECTION_36_OVERCHARGING'],
      unitSalePrice: '₹0.40 / g (Sticker: ₹0.50 / g)',
      status: 'VIOLATION'
    },
    steps: {
      frontImg: '/demo/step1_front.jpg',
      mrpImg: '/demo/step2_mrp.jpg',
      mfgImg: '/demo/step3_mfg.jpg',
    }
  },
  demo_milk: {
    product: {
      id: 'prod_milk_1',
      name: 'Amul Taaza Homogenised Toned Milk 1L',
      brand: 'Amul / GCMMF Ltd.',
      barcode: '8901262010054',
      printedMrp: 54,
      stickerPrice: 58,
      expiryDate: '2026-09-24',
      mfgDate: '2026-09-16',
      netWeight: '1000 mL (1 L)',
      manufacturer: 'Gujarat Co-operative Milk Marketing Federation Ltd., Anand, Gujarat',
      customerCare: '1800-258-3333 / customercare@amul.coop',
      violations: ['SECTION_36_OVERCHARGING'],
      unitSalePrice: '₹0.054 / mL (Billed: ₹0.058 / mL)',
      status: 'VIOLATION'
    },
    steps: {
      frontImg: '/demo/step1_front.jpg',
      mrpImg: '/demo/step2_mrp.jpg',
      mfgImg: '/demo/step3_mfg.jpg',
    }
  },
  demo_expired: {
    product: {
      id: 'prod_atta_1',
      name: 'Aashirvaad Shudh Chakki Atta 5kg',
      brand: 'Aashirvaad / ITC Ltd.',
      barcode: '8901030383441',
      printedMrp: 235,
      expiryDate: '2025-12-10',
      mfgDate: '2025-06-10',
      netWeight: '5 kg',
      manufacturer: 'ITC Limited, 37 J.L. Nehru Road, Kolkata, West Bengal',
      customerCare: '1800-425-4444 / itccares@itc.in',
      violations: ['EXPIRED_PRODUCT', 'RULE_6_EXPIRY_BREACH'],
      unitSalePrice: '₹47.00 / kg',
      status: 'VIOLATION'
    },
    steps: {
      frontImg: '/demo/step1_front.jpg',
      mrpImg: '/demo/step2_mrp.jpg',
      mfgImg: '/demo/step3_mfg.jpg',
    }
  },
  demo_biscuit: {
    product: {
      id: 'prod_biscuit_1',
      name: 'Parle-G Gold Glucose Biscuits 100g',
      brand: 'Parle Products Pvt. Ltd.',
      barcode: '8901719101019',
      printedMrp: 10,
      expiryDate: '2026-12-30',
      mfgDate: '2026-06-01',
      netWeight: '100 g',
      manufacturer: 'Parle Products Pvt. Ltd., V.S. Khandekar Marg, Vile Parle East, Mumbai',
      customerCare: '022-66916911 / cs@parle.biz',
      violations: [],
      unitSalePrice: '₹0.10 / g',
      status: 'PASS'
    },
    steps: {
      frontImg: '/demo/step1_front.jpg',
      mrpImg: '/demo/step2_mrp.jpg',
      mfgImg: '/demo/step3_mfg.jpg',
    }
  }
};

export const ConsumerScanner: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sampleParam = searchParams.get('sample');

  // Mode: Defaults to camera for scanning real products, or demo mode if ?sample= is provided
  const [scanMode, setScanMode] = useState<'demo' | 'camera'>(sampleParam ? 'demo' : 'camera');
  const [selectedDemoKey, setSelectedDemoKey] = useState<string>(sampleParam || 'demo_chips');

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

  // Multi-product session cart
  const [cart, setCart] = useState<ScannedConsumerProduct[]>(() => {
    const raw = sessionStorage.getItem('metricheck_consumer_cart');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const { runningTasks, waitForAllTasks } = useAiBackgroundTasks();
  const [showCircleLoader, setShowCircleLoader] = useState(false);
  const [bgNotification, setBgNotification] = useState<string | null>(null);

  const activeDemoPreset = DEMO_PRESET_CATALOG[selectedDemoKey] || DEMO_PRESET_CATALOG['demo_chips'];

  const guideSteps: GuideStep[] = [
    {
      id: 'front',
      stepLabel: 'Step 1: Front',
      hi: 'उत्पाद का अगला भाग',
      en: 'Front Label Photo',
      hint: 'Product name, brand logo, and mandatory front declarations',
      icon: <Camera className="w-4 h-4" />,
      accentColor: 'text-amber-400',
      demoImage: activeDemoPreset.steps.frontImg,
    },
    {
      id: 'mrp',
      stepLabel: 'Step 2: MRP',
      hi: 'MRP / मूल्य स्टीकर',
      en: 'MRP & Price Tag',
      hint: 'MRP, taxes inclusive, and unit sale price',
      icon: <RotateCcw className="w-4 h-4" />,
      accentColor: 'text-emerald-400',
      demoImage: activeDemoPreset.steps.mrpImg,
    },
    {
      id: 'mfg',
      stepLabel: 'Step 3: Dates',
      hi: 'निर्माण व समाप्ति तारीख',
      en: 'MFG / EXP & Net Qty',
      hint: 'Manufacturing date, net quantity, batch & consumer care',
      icon: <Calendar className="w-4 h-4" />,
      accentColor: 'text-sky-400',
      demoImage: activeDemoPreset.steps.mfgImg,
    },
  ];

  const currentStep = guideSteps[currentStepIdx];
  const isLastStep = currentStepIdx === guideSteps.length - 1;
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

    canvas.toBlob(async (rawBlob) => {
      if (!rawBlob) return;
      try {
        const compressed = await compressImage(rawBlob, 1600, 0.82);
        processBlob(compressed.blob);
      } catch {
        processBlob(rawBlob);
      }
    }, 'image/webp', 0.85);
  }, [cameraState, processBlob]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (scanMode === 'demo') {
        setScanMode('camera');
      }
      try {
        const compressed = await compressImage(file, 1600, 0.82);
        processBlob(compressed.blob);
      } catch {
        processBlob(file);
      }
    }
  };

  const handleRetake = () => {
    if (capturedDataUrl) URL.revokeObjectURL(capturedDataUrl);
    setCapturedBlob(null);
    setCapturedDataUrl(null);
    setQualityReport(null);
    startCamera();
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

  const saveProductAndNavigate = (prod: ScannedConsumerProduct) => {
    // Save to active single product
    sessionStorage.setItem('metricheck_consumer_product', JSON.stringify(prod));

    // Update cart
    const existingIdx = cart.findIndex(p => p.id === prod.id);
    let updatedCart: ScannedConsumerProduct[];
    if (existingIdx >= 0) {
      updatedCart = [...cart];
      updatedCart[existingIdx] = prod;
    } else {
      updatedCart = [...cart, prod];
    }
    setCart(updatedCart);
    sessionStorage.setItem('metricheck_consumer_cart', JSON.stringify(updatedCart));

    // Navigate to scan result
    navigate('/consumer/result');
  };

  const handleCancelScanner = () => {
    stopCamera();
    const citizenUser = localStorage.getItem('metricheck_citizen_user');
    if (citizenUser) {
      if (cart.length > 0) {
        navigate('/consumer/summary');
      } else {
        navigate('/consumer/dashboard');
      }
    } else {
      // User cancelled scanner without logging in -> start login flow
      navigate('/consumer/auth?redirect=cancel');
    }
  };

  // ══ DEMO FLOW: STEP CONTROLS & BACKGROUND AI ══════════════════════════════
  const handleDemoNext = () => {
    if (!isLastStep) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      handleFinalSubmitDemo();
    }
  };

  const handleDemoPrev = () => {
    if (currentStepIdx > 0 && !isAnalyzing) {
      setCurrentStepIdx(prev => prev - 1);
    }
  };

  // 1. Scan Another Product in Demo Mode (Background AI Dispatch)
  const handleScanAnotherDemo = () => {
    const prod = activeDemoPreset.product;

    // Dispatch background upload & AI analysis
    aiBackgroundManager.dispatchTask(
      {
        productName: prod.name,
        type: 'CONSUMER'
      },
      async () => {
        await new Promise(r => setTimeout(r, 2200));
      }
    );

    // Add to multi-product cart
    const existingIdx = cart.findIndex(p => p.id === prod.id);
    let updatedCart = [...cart];
    if (existingIdx >= 0) {
      updatedCart[existingIdx] = prod;
    } else {
      updatedCart.push(prod);
    }
    setCart(updatedCart);
    sessionStorage.setItem('metricheck_consumer_cart', JSON.stringify(updatedCart));

    setCurrentStepIdx(0);
    setBgNotification(`"${prod.name}" का AI विश्लेषण पृष्ठभूमि में शुरू किया गया • AI processing in background`);
    setTimeout(() => setBgNotification(null), 4000);
  };

  // 2. Final Submit in Demo Mode (Waits for background tasks with circle loader)
  const handleFinalSubmitDemo = async () => {
    setShowCircleLoader(true);
    try {
      if (runningTasks.length > 0) {
        await waitForAllTasks();
      }
      saveProductAndNavigate(activeDemoPreset.product);
    } finally {
      setShowCircleLoader(false);
    }
  };

  // ══ CAMERA FLOW: STEP CONTROLS & BACKGROUND AI ════════════════════════════
  // 1. Scan Another Product in Camera Mode (Non-blocking background AI)
  const handleScanAnotherCamera = () => {
    const allBlobs = [...collectedBlobs, capturedBlob].filter(Boolean) as Blob[];
    if (allBlobs.length === 0) return;

    // Immediately free camera for the next product!
    if (capturedDataUrl) URL.revokeObjectURL(capturedDataUrl);
    setCapturedBlob(null);
    setCapturedDataUrl(null);
    setQualityReport(null);
    setCollectedBlobs([]);
    setCurrentStepIdx(0);
    startCamera();

    const tempName = `सामान #${cart.length + 1}`;
    setBgNotification(`"${tempName}" का AI विश्लेषण पृष्ठभूमि में शुरू हुआ • AI processing in background`);
    setTimeout(() => setBgNotification(null), 4000);

    // Dispatch real background AI task
    aiBackgroundManager.dispatchTask(
      {
        productName: tempName,
        type: 'CONSUMER'
      },
      async () => {
        const formData = new FormData();
        allBlobs.forEach((blob, idx) => {
          formData.append('images', blob, `capture_${idx + 1}.webp`);
        });

        const analyzedProduct = await fetchApi<ScannedConsumerProduct>('/consumer/analyze', {
          method: 'POST',
          body: formData
        });

        setCart(prev => {
          const updated = [...prev, analyzedProduct];
          sessionStorage.setItem('metricheck_consumer_cart', JSON.stringify(updated));
          return updated;
        });
      }
    );
  };

  // 2. Final Submit in Camera Mode (Calls real AI analysis API with fast fallback)
  const handleFinalSubmitCamera = async () => {
    const allBlobs = [...collectedBlobs, capturedBlob].filter(Boolean) as Blob[];
    if (allBlobs.length === 0) return;

    setShowCircleLoader(true);
    try {
      if (runningTasks.length > 0) {
        await waitForAllTasks();
      }

      const formData = new FormData();
      allBlobs.forEach((blob, idx) => {
        formData.append('images', blob, `capture_${idx + 1}.webp`);
      });

      const analyzedProduct = await fetchApi<ScannedConsumerProduct>('/consumer/analyze', {
        method: 'POST',
        body: formData
      });
      saveProductAndNavigate(analyzedProduct);
    } catch (err: any) {
      console.error('Real image consumer analysis error:', err);
      setErrorMessage(err.message || 'पैकेट के विश्लेषण में त्रुटि हुई। कृपया दोबारा फोटो लें या नेटवर्क जाँचें।');
      setCameraState('ERROR');
    } finally {
      setShowCircleLoader(false);
    }
  };

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
          /* ── DEMO PACKAGE VIEW ── */
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

            {/* Demo Product Preset Chips */}
            <div className="absolute top-28 z-20 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto max-w-full no-scrollbar">
              {Object.entries(DEMO_PRESET_CATALOG).map(([key, item]) => {
                const isSelected = selectedDemoKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedDemoKey(key);
                      setCurrentStepIdx(0);
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-navy-950 shadow-md shadow-amber-500/30'
                        : 'bg-navy-900/85 text-slate-300 border border-white/10 hover:bg-white/15'
                    }`}
                  >
                    {item.product.name.split(' ')[0]}
                    {item.product.status === 'VIOLATION' && ' (⚠)'}
                  </button>
                );
              })}
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
                <div className="w-12 h-12 rounded-2xl bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-400 shadow-xl">
                  <VideoOff className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">कैमरा रुका हुआ है • Camera Paused</h4>
                  <p className="text-xs text-slate-300 font-medium mt-1">कैमरा पुनः चालू करने हेतु नीचे बटन दबाएँ।</p>
                </div>
                <button
                  onClick={toggleCameraPause}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-navy-950 font-black text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>कैमरा चालू करें • Resume Camera</span>
                </button>
              </div>
            )}

            {/* Permission Loading State */}
            {!isPreviewMode && !isCameraPaused && cameraState === 'REQUESTING_PERMISSION' && (
              <div className="relative z-10 text-center space-y-2 p-6 bg-navy-950/80 backdrop-blur-md rounded-2xl border border-white/10">
                <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-300">Opening camera feed…</p>
              </div>
            )}

            {/* Viewfinder Target Reticle Frame */}
            {cameraState === 'READY' && !isCameraPaused && !isPreviewMode && (
              <div className="absolute inset-x-8 top-32 bottom-32 pointer-events-none border-2 border-dashed border-amber-400/50 rounded-3xl flex items-center justify-center max-w-md mx-auto">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-xl -mt-1 -ml-1" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-xl -mt-1 -mr-1" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-xl -mb-1 -ml-1" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-xl -mb-1 -mr-1" />
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400/70 to-transparent shadow-[0_0_12px_rgba(245,158,11,0.8)] animate-pulse" />
                <div className="absolute bottom-4 px-3 py-1 rounded-full bg-navy-950/80 backdrop-blur-md border border-white/10 text-[10px] text-amber-300 font-medium">
                  पैकेट को चौखट के भीतर रखें • Align package inside frame
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
            onClick={handleCancelScanner}
            className="w-9 h-9 rounded-xl bg-navy-900/80 hover:bg-white/15 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition active:scale-95 shadow-md cursor-pointer"
            aria-label="Cancel scan"
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

          {/* Right Controls: Finish Inspection button (if cart > 0) + Camera Mode Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {cart.length > 0 && (
              <button
                onClick={() => navigate('/consumer/summary')}
                className="py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-purple-900/30 cursor-pointer"
                title="सभी जाँचे गए उत्पाद देखें"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">जाँच पूर्ण करें ({cart.length})</span>
                <span className="sm:hidden">({cart.length})</span>
              </button>
            )}

            {scanMode === 'camera' && !isPreviewMode && (
              <>
                {/* Stop / Resume Camera Button */}
                <button
                  onClick={toggleCameraPause}
                  className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md shadow-lg transition active:scale-95 cursor-pointer ${
                    isCameraPaused
                      ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/40 animate-pulse'
                      : 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                  }`}
                  aria-label={isCameraPaused ? 'Resume camera' : 'Stop camera'}
                  title={isCameraPaused ? 'कैमरा चालू करें • Resume Camera' : 'कैमरा बंद करें • Stop Camera'}
                >
                  {isCameraPaused ? <Camera className="w-3.5 h-3.5 text-emerald-400" /> : <VideoOff className="w-3.5 h-3.5 text-red-400" />}
                  <span className="hidden sm:inline">{isCameraPaused ? 'चालू करें' : 'रोकें • Stop'}</span>
                </button>

                <button
                  onClick={toggleMirror}
                  className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-lg transition active:scale-95 cursor-pointer ${
                    isMirrored
                      ? 'bg-amber-500/25 text-amber-300 border-amber-500/50'
                      : 'bg-white/10 text-slate-300 border-white/15'
                  }`}
                  title={isMirrored ? 'Mirror: ON' : 'Mirror: OFF'}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isMirrored ? 'Mirrored' : 'Raw'}</span>
                </button>

                {hasMultipleCameras && (
                  <button
                    onClick={toggleFacingMode}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 flex items-center justify-center text-slate-200 transition active:scale-95 shadow-lg cursor-pointer"
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
            {guideSteps.map((step, idx) => {
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
                  {idx < guideSteps.length - 1 && (
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
              <button
                onClick={() => {
                  setScanMode('camera');
                  fileInputRef.current?.click();
                }}
                className="w-12 h-12 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl flex flex-col items-center justify-center text-slate-200 transition active:scale-95 shadow-md shrink-0 cursor-pointer"
                title="Upload Real Photo from Device"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span className="text-[8px] font-bold mt-0.5">Upload</span>
              </button>
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

              {isAnalyzing ? (
                <div className="flex-1 py-3.5 px-5 bg-amber-500/20 border border-amber-500/30 text-amber-300 font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>AI विश्लेषण जारी है… Analyzing Package…</span>
                </div>
              ) : isLastStep ? (
                <div className="flex flex-col sm:flex-row gap-2 flex-1">
                  <button
                    onClick={handleScanAnotherDemo}
                    className="flex-1 py-3.5 px-3 bg-navy-900 hover:bg-navy-800 text-amber-400 border border-amber-400/30 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>अगला सामान • Scan Next (Background AI)</span>
                  </button>
                  <button
                    onClick={handleFinalSubmitDemo}
                    className="flex-1 py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-navy-950 font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-[0_4px_20px_rgba(245,158,11,0.4)] transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-navy-950 shrink-0" />
                    <span>जाँच पूर्ण करें • Complete & Submit →</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleDemoNext}
                  className="flex-1 py-3.5 px-5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-navy-950 font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(245,158,11,0.4)] transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>
                    आगे बढ़ें • Next: {guideSteps[currentStepIdx + 1].stepLabel.split(': ')[1]} ({currentStepIdx + 2}/3)
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              )}
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
                  className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-slate-100 font-semibold text-xs rounded-xl border border-white/10 flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>Retake • पुनः लें</span>
                </button>

                {isLastStep ? (
                  <div className="flex flex-col sm:flex-row gap-2 flex-[2]">
                    <button
                      onClick={handleScanAnotherCamera}
                      className="flex-1 py-3 bg-navy-900 hover:bg-navy-800 text-amber-400 border border-amber-400/30 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>अगला सामान • Scan Next (Background)</span>
                    </button>
                    <button
                      onClick={handleFinalSubmitCamera}
                      className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-navy-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition active:scale-95 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-slate-950 fill-slate-950 shrink-0" />
                      <span>जाँच पूर्ण करें • Complete & Submit →</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 flex-[2]">
                    <button
                      onClick={handleFinalSubmitCamera}
                      className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-navy-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition active:scale-95 cursor-pointer"
                      title="Skip remaining steps and analyze this photo now"
                    >
                      <Zap className="w-3.5 h-3.5 fill-navy-950 shrink-0" />
                      <span>तुरंत विश्लेषण • Analyze Now</span>
                    </button>
                    <button
                      onClick={handleNextStepCamera}
                      disabled={isAnalyzing}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-slate-100 font-bold text-xs rounded-xl border border-white/15 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <span>Keep → Step {currentStepIdx + 2}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── LIVE CAMERA CONTROLS ── */
            <div className="bg-navy-950/85 backdrop-blur-xl border border-white/15 rounded-2xl p-2.5 shadow-2xl flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-14 h-14 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-200 transition active:scale-95 shadow-md shrink-0 cursor-pointer"
                title="Upload Photo from Device"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span className="text-[9px] font-bold mt-0.5">Upload</span>
              </button>

              <button
                onClick={toggleFacingMode}
                disabled={cameraState !== 'READY' || isCameraPaused}
                className="w-14 h-14 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-200 transition active:scale-95 shadow-md shrink-0 cursor-pointer disabled:opacity-40"
                title="Flip Camera (Front/Rear)"
              >
                <SwitchCamera className="w-4 h-4 text-sky-400" />
                <span className="text-[9px] font-bold mt-0.5">Flip</span>
              </button>

              {/* Stop / Resume Camera Button in Bottom Dock */}
              <button
                onClick={toggleCameraPause}
                className={`w-14 h-14 border rounded-xl flex flex-col items-center justify-center transition active:scale-95 shadow-md shrink-0 cursor-pointer ${
                  isCameraPaused
                    ? 'bg-emerald-600/30 hover:bg-emerald-600/40 border-emerald-500/50 text-emerald-300 animate-pulse'
                    : 'bg-red-600/20 hover:bg-red-600/30 border-red-500/40 text-red-300'
                }`}
                title={isCameraPaused ? 'कैमरा चालू करें • Resume Camera' : 'कैमरा रोकें • Stop Camera'}
              >
                {isCameraPaused ? (
                  <>
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span className="text-[9px] font-bold mt-0.5">Start</span>
                  </>
                ) : (
                  <>
                    <VideoOff className="w-4 h-4 text-red-400" />
                    <span className="text-[9px] font-bold mt-0.5">Stop</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCapture}
                disabled={cameraState !== 'READY' || isCameraPaused}
                className={`flex-1 h-14 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2.5 transition active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none cursor-pointer ${
                  isCameraPaused
                    ? 'bg-slate-800 text-slate-400 border border-white/10'
                    : isLastStep
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-navy-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-navy-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-navy-950/15 flex items-center justify-center">
                  {isCameraPaused ? <VideoOff className="w-4 h-4 text-slate-400" /> : <Camera className="w-4 h-4" />}
                </div>
                <span>
                  {isCameraPaused
                    ? 'कैमरा बंद है • Camera Paused'
                    : isLastStep
                    ? 'Capture & Analyze (Step 3/3)'
                    : `Snap Step ${currentStepIdx + 1}: ${guideSteps[currentStepIdx].stepLabel.split(': ')[1]}`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ══ BACKGROUND AI TASKS INDICATOR ══════════════════════════ */}
      {(runningTasks.length > 0 || bgNotification) && (
        <div className="absolute top-20 right-4 z-40 flex items-center gap-2 px-3.5 py-2 bg-navy-900/95 border border-amber-400/40 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-bold text-amber-300 animate-in fade-in slide-in-from-top-2">
          <Clock className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
          <span>{bgNotification || `AI पृष्ठभूमि विश्लेषण चालू (${runningTasks.length}) • Background AI Active`}</span>
        </div>
      )}

      {/* ══ CIRCLE LOADER MODAL FOR FINAL SUBMISSION ════════════════════════ */}
      <AiProcessingCircleLoader
        isOpen={showCircleLoader}
        tasks={runningTasks}
        title="AI विश्लेषण पूर्ण हो रहा है..."
        subtitle="कृपया प्रतीक्षा करें, पृष्ठभूमि में सभी जाँचे गए सामानों का OCR व मूल्य सत्यापन पूर्ण किया जा रहा है।"
        onClose={() => {
          setShowCircleLoader(false);
        }}
      />
    </div>
  );
};
