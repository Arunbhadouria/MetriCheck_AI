import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User, Lock, Phone, Mail, ArrowLeft, ShieldCheck, Sparkles,
  CheckCircle2, ArrowRight, Eye, EyeOff, Building, MapPin,
  ShoppingBag, Award, AlertCircle
} from 'lucide-react';
import { ScannedConsumerProduct } from './ConsumerScanner';
import {
  appendCitizenHistory,
  getCitizenHistory,
  saveCitizenHistory,
  DEMO_CITIZEN_HISTORY
} from '../../services/consumerStorage';

export const ConsumerAuth: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect'); // 'complaint' | 'history' | null

  // Tab: 'LOGIN' | 'REGISTER'
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('9826012345');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCity, setRegCity] = useState('Indore');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle post-login redirection and history saving
  const finalizeAuth = (user: any) => {
    localStorage.setItem('metricheck_citizen_user', JSON.stringify(user));
    localStorage.setItem('metricheck_citizen_token', `citizen_token_${Date.now()}`);

    // If redirected for saving history, save current scan cart/product into history
    if (redirectTarget === 'history') {
      try {
        const rawCart = sessionStorage.getItem('metricheck_consumer_cart');
        const rawSingle = sessionStorage.getItem('metricheck_consumer_product');
        let productsToSave: ScannedConsumerProduct[] = [];

        if (rawCart) {
          productsToSave = JSON.parse(rawCart);
        } else if (rawSingle) {
          productsToSave = [JSON.parse(rawSingle)];
        }

        if (productsToSave.length > 0) {
          // Add timestamp and store name if missing
          const timestampedItems = productsToSave.map(p => ({
            ...p,
            scannedAt: new Date().toISOString(),
            storeName: 'गुप्ता किराना एवं जनरल स्टोर्स, इंदौर'
          }));

          appendCitizenHistory(timestampedItems as any, user.phone);
        }
      } catch (err) {
        console.warn('Failed to persist history', err);
      }
      navigate('/consumer/dashboard?tab=history');
      return;
    }

    // If redirected for filing complaint, navigate straight to complaint form
    if (redirectTarget === 'complaint') {
      navigate('/consumer/complaint');
      return;
    }

    // Default: go to consumer dashboard
    navigate('/consumer/dashboard');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const user = {
        name: loginIdentifier === '9826012345' ? 'राहुल शर्मा' : 'नागरिक उपयोगकर्ता',
        phone: loginIdentifier,
        email: 'rahul.sharma@citizen.local',
        city: 'Indore',
        state: 'Madhya Pradesh',
        verified: true,
        joinedDate: 'Sep 2026'
      };
      finalizeAuth(user);
    }, 600);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim() || !regPassword.trim()) {
      setErrorMsg('कृपया सभी आवश्यक विवरण भरें।');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const user = {
        name: regName.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim() || `${regPhone.trim()}@citizen.local`,
        city: regCity.trim() || 'Indore',
        state: 'Madhya Pradesh',
        verified: true,
        joinedDate: 'Sep 2026'
      };
      finalizeAuth(user);
    }, 700);
  };

  const handle1ClickDemoLogin = () => {
    const demoUser = {
      name: 'राहुल शर्मा',
      phone: '9826012345',
      email: 'rahul.sharma@citizen.local',
      city: 'Indore',
      state: 'Madhya Pradesh',
      verified: true,
      joinedDate: 'Sep 2026'
    };
    // Seed demo scans exclusively for the demo user if not already present
    const existing = getCitizenHistory(demoUser.phone);
    if (!existing || existing.length === 0) {
      saveCitizenHistory(DEMO_CITIZEN_HISTORY, demoUser.phone);
    }
    finalizeAuth(demoUser);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Gov Tricolor Line */}
      <div className="gov-tricolor" />

      {/* Top Navigation */}
      <div className="p-4 flex items-center justify-between max-w-lg mx-auto w-full">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition active:scale-95 cursor-pointer"
          title="Go Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>विधिक माप विज्ञान नागरिक सेवा</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
          {/* Header */}
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-600/30">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-white">
              {tab === 'LOGIN' ? 'नागरिक लॉगिन' : 'उपभोक्ता पंजीकरण'}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {redirectTarget === 'complaint'
                ? 'शिकायत दर्ज करने हेतु अपने नागरिक खाते में लॉगिन करें'
                : redirectTarget === 'history'
                ? 'स्कैन इतिहास सहेजने व डैशबोर्ड देखने हेतु लॉगिन करें'
                : redirectTarget === 'cancel'
                ? 'नागरिक सेवा डैशबोर्ड में प्रवेश हेतु लॉगिन करें या नया खाता बनाएं'
                : 'उपभोक्ता संरक्षण एवं विधिक माप विज्ञान पोर्टल'}
            </p>
          </div>

          {/* 1-Click Demo Login Banner for Evaluators */}
          <button
            type="button"
            onClick={handle1ClickDemoLogin}
            className="w-full p-3 rounded-2xl bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-purple-900/60 hover:from-purple-900/80 hover:to-indigo-900/80 border border-purple-500/40 text-left transition active:scale-[0.99] cursor-pointer group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs border border-purple-500/30">
                  ⚡
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-purple-200 flex items-center gap-1.5">
                    <span>1-क्लिक डेमो नागरिक लॉगिन</span>
                    <span className="badge badge-warning badge-xs font-extrabold text-[9px]">SIH DEMO</span>
                  </h4>
                  <p className="text-[11px] text-slate-300">राहुल शर्मा (9826012345) के रूप में तुरंत जारी रखें</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Tab Switcher: Login vs Register */}
          <div className="flex p-1 bg-slate-900/80 rounded-xl border border-slate-700/60 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setTab('LOGIN'); setErrorMsg(''); }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                tab === 'LOGIN'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              लॉगिन • Login
            </button>
            <button
              type="button"
              onClick={() => { setTab('REGISTER'); setErrorMsg(''); }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                tab === 'REGISTER'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              नया पंजीकरण • Register
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          {tab === 'LOGIN' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">
                  मोबाइल नंबर या ईमेल आईडी • Mobile / Email
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="जैसे 9826012345"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 pl-10 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">
                  पासवर्ड • Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 pl-10 pr-10 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-70 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>लॉगिन करें व जारी रखें</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">
                  पूरा नाम • Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="जैसे राहुल शर्मा"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 pl-10 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">
                  मोबाइल नंबर • Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="10 अंकों का मोबाइल नंबर"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 pl-10 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    शहर / ज़िला • City
                  </label>
                  <input
                    type="text"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    placeholder="जैसे इंदौर"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    ईमेल (वैकल्पिक)
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@mail.com"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">
                  पासवर्ड • Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="कम से कम 6 अक्षर"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 pl-10 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-70 cursor-pointer pt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>खाता बनाएँ व जारी रखें</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer note */}
          <p className="text-center text-[10px] text-slate-500">
            विधिक माप विज्ञान (डिब्बा बंद वस्तुएं) नियम 2011 के अंतर्गत सुरक्षित उपभोक्ता पोर्टल
          </p>
        </div>
      </div>
    </div>
  );
};
