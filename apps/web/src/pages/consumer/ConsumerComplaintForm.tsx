import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, ArrowLeft, MapPin, Building, Phone, User, ShieldCheck,
  AlertTriangle, Camera, CheckCircle2, Sparkles, Store
} from 'lucide-react';
import { ScannedConsumerProduct } from './ConsumerScanner';
import { fetchApi } from '../../services/api';

export const ConsumerComplaintForm: React.FC = () => {
  const navigate = useNavigate();
  const [product, setProduct] = useState<ScannedConsumerProduct | null>(null);

  // Form Fields
  const [shopName, setShopName] = useState('गुप्ता किराना एवं जनरल स्टोर्स');
  const [shopAddress, setShopAddress] = useState('दुकान 12, विजय नगर मेन मार्केट, इंदौर');
  const [state, setState] = useState('Madhya Pradesh');
  const [district, setDistrict] = useState('Indore');
  const [zone, setZone] = useState('Zone 08 — Vijay Nagar');
  const [consumerName, setConsumerName] = useState('राहुल शर्मा');
  const [consumerPhone, setConsumerPhone] = useState('9826012345');
  const [chargedPrice, setChargedPrice] = useState<number>(25);
  const [selectedViolations, setSelectedViolations] = useState<string[]>([
    'DUAL_MRP_STICKER', 'SECTION_36_OVERCHARGING'
  ]);

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>({
    latitude: 22.7533,
    longitude: 75.8937
  });
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const citizenUserRaw = localStorage.getItem('metricheck_citizen_user');
    if (!citizenUserRaw) {
      navigate('/consumer/auth?redirect=complaint');
      return;
    } else {
      try {
        const u = JSON.parse(citizenUserRaw);
        if (u.name) setConsumerName(u.name);
        if (u.phone) setConsumerPhone(u.phone);
      } catch {}
    }

    const raw = sessionStorage.getItem('metricheck_consumer_product');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setProduct(parsed);
        if (parsed.stickerPrice) {
          setChargedPrice(parsed.stickerPrice);
        } else {
          setChargedPrice(parsed.printedMrp + 5);
        }
        if (parsed.violations && parsed.violations.length > 0) {
          setSelectedViolations(parsed.violations);
        }
      } catch {
        navigate('/consumer/scan');
      }
    } else {
      navigate('/consumer/scan');
    }

    // Try acquiring GPS in background
    if (navigator.geolocation) {
      setIsGettingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
          setIsGettingGps(false);
        },
        () => setIsGettingGps(false),
        { timeout: 5000 }
      );
    }
  }, [navigate]);

  const toggleViolation = (v: string) => {
    setSelectedViolations(prev => 
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    const payload = {
      productName: product.name,
      brand: product.brand,
      barcode: product.barcode,
      printedMrp: product.printedMrp,
      chargedPrice,
      expiryDate: product.expiryDate,
      violations: selectedViolations,
      shopName,
      shopAddress,
      state,
      district,
      zone,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      photoUrl: (product as any)?.stepImages?.front || (product as any)?.stepImages?.mrp || (product as any)?.photoUrl || undefined,
      consumerName,
      consumerPhone
    };

    try {
      const created = await fetchApi<any>('/complaints', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      try {
        const rawExisting = localStorage.getItem('metricheck_citizen_complaints');
        const existingComplaints = rawExisting ? JSON.parse(rawExisting) : [];
        localStorage.setItem('metricheck_citizen_complaints', JSON.stringify([created, ...existingComplaints]));
      } catch (saveErr) {
        console.warn('Error caching citizen complaint', saveErr);
      }
      // Navigate to tracker page with success tracking ID
      navigate(`/consumer/track?id=${encodeURIComponent(created.trackingId)}&new=true`);
    } catch (err: any) {
      setErrorMsg(err.message || 'नेटवर्क त्रुटि: शिकायत दर्ज नहीं हो सकी। कृपया पुनः प्रयास करें।');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <div className="gov-page text-base-content min-h-screen pb-28 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-navy-950 text-white shadow-md">
        <div className="gov-tricolor" />
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/consumer/result')}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition active:scale-95 cursor-pointer"
            aria-label="Back to product result"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-white text-center">
              शिकायत दर्ज करें • File Complaint
            </h1>
            <p className="text-[10px] text-slate-300 text-center font-medium">
              विधिक मापविज्ञान अधिनियम 2009 (धारा 36)
            </p>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-xl lg:max-w-3xl xl:max-w-4xl mx-auto p-4 md:p-6 space-y-5">
        {/* Officer Assignment Notice Card */}
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950 font-medium leading-relaxed">
            यह शिकायत सीधे <b>{zone}</b> के अधिकृत विधिक मापविज्ञान निरीक्षक (Officer: <b>Amit Verma, LM-MP-0421</b>) के डैशबोर्ड पर सत्यापन व चालान हेतु भेजी जाएगी।
          </div>
        </div>

        {errorMsg && (
          <div className="alert alert-error text-xs font-bold text-white p-3">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ══ PRODUCT SUMMARY ACCORDION ════════════════════════════════════ */}
          <div className="gov-card p-4 bg-white space-y-2 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              स्कैन किया गया उत्पाद • Scanned Commodity
            </span>
            <h3 className="text-sm font-bold text-navy-950">
              {product.name}
            </h3>
            <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
              <span className="text-slate-600">मुद्रित MRP: <b>₹{product.printedMrp}</b></span>
              <span className="text-red-600 font-bold">मांगी गई दर: <b>₹{chargedPrice}</b></span>
            </div>
          </div>

          {/* ══ VIOLATIONS CHECKBOXES ════════════════════════════════════════ */}
          <div className="gov-card p-4 bg-white space-y-2.5 border border-slate-200">
            <label className="text-xs font-bold text-navy-950 block">
              उल्लंघन का प्रकार चुनें • Violation Category <span className="text-red-500">*</span>
            </label>

            <div className="space-y-2">
              {[
                { id: 'DUAL_MRP_STICKER', label: 'अवैध स्टिकर चिपकाकर अधिक वसूली (Dual Pricing Sticker)' },
                { id: 'SECTION_36_OVERCHARGING', label: 'मुद्रित MRP से अधिक वसूली (Overcharging above MRP)' },
                { id: 'EXPIRED_PRODUCT', label: 'समाप्ति तिथि (Expiry Date) के बाद बिक्री' },
                { id: 'MISSING_DECLARATIONS', label: 'अनिवार्य घोषणाएं (Net Qty, Address) गायब या अस्पष्ट' }
              ].map((v) => (
                <label
                  key={v.id}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-medium"
                >
                  <input
                    type="checkbox"
                    checked={selectedViolations.includes(v.id)}
                    onChange={() => toggleViolation(v.id)}
                    className="checkbox checkbox-warning checkbox-sm mt-0.5"
                  />
                  <span className="text-slate-800">{v.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ══ SHOP & LOCATION DETAILS ══════════════════════════════════════ */}
          <div className="gov-card p-4 bg-white space-y-3 border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-orange-600" />
                <span>दुकान व स्थान विवरण • Store Information</span>
              </label>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>GPS Lock {coords ? '22.75°N, 75.89°E' : 'Locating…'}</span>
              </span>
            </div>

            <div className="form-control">
              <label htmlFor="shop-name-input" className="label py-1">
                <span className="label-text font-bold text-xs text-slate-700">दुकान का नाम • Shop / Merchant Name *</span>
              </label>
              <input
                id="shop-name-input"
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="उदा. गुप्ता सुपरमार्ट या प्लेटफॉर्म स्टॉल"
                className="input input-bordered w-full text-xs font-semibold bg-slate-50"
                required
              />
            </div>

            <div className="form-control">
              <label htmlFor="shop-address-input" className="label py-1">
                <span className="label-text font-bold text-xs text-slate-700">बाज़ार या निकटतम लैंडमार्क • Market / Area *</span>
              </label>
              <input
                id="shop-address-input"
                type="text"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                placeholder="उदा. बस स्टैंड के सामने, विजय नगर, इंदौर"
                className="input input-bordered w-full text-xs font-semibold bg-slate-50"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600 pt-1">
              <div className="p-2 rounded-lg bg-slate-100 border border-slate-200">
                <span className="text-[9px] text-slate-500 font-bold block">ज़िला (District)</span>
                <span className="font-bold text-navy-950">{district}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-100 border border-slate-200">
                <span className="text-[9px] text-slate-500 font-bold block">सर्कल मंडल (Zone)</span>
                <span className="font-bold text-navy-950 truncate block">{zone}</span>
              </div>
            </div>
          </div>

          {/* ══ CONSUMER CONTACT (FOR SMS & TRACKING) ════════════════════════ */}
          <div className="gov-card p-4 bg-white space-y-3 border border-slate-200">
            <label className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
              <User className="w-4 h-4 text-orange-600" />
              <span>शिकायतकर्ता विवरण • Consumer Contact</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="form-control">
                <label htmlFor="consumer-name-input" className="label py-1">
                  <span className="label-text font-bold text-xs text-slate-700">नाम • Your Name</span>
                </label>
                <input
                  id="consumer-name-input"
                  type="text"
                  value={consumerName}
                  onChange={(e) => setConsumerName(e.target.value)}
                  placeholder="उदा. राहुल शर्मा"
                  className="input input-bordered w-full text-xs font-medium bg-slate-50"
                />
              </div>

              <div className="form-control">
                <label htmlFor="consumer-phone-input" className="label py-1">
                  <span className="label-text font-bold text-xs text-slate-700">मोबाइल नंबर • Mobile (SMS Tracking)</span>
                </label>
                <input
                  id="consumer-phone-input"
                  type="tel"
                  value={consumerPhone}
                  onChange={(e) => setConsumerPhone(e.target.value)}
                  placeholder="98260XXXXX"
                  className="input input-bordered w-full text-xs font-medium bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* ══ SUBMIT BUTTON ════════════════════════════════════════════════ */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full py-4 text-sm sm:text-base font-black flex items-center justify-center gap-2 shadow-xl shadow-orange-600/30 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                <span>अधिकारी को शिकायत भेजी जा रही है…</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5 shrink-0" />
                <span>शिकायत आधिकारिक रूप से दर्ज करें • Dispatch Complaint</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
};
