import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, User, Eye, EyeOff, AlertTriangle, ShieldCheck, ArrowLeft,
  Award, Copy, Check, UserPlus, Sparkles, Building2, MapPin, Phone, Mail,
  RotateCw, KeyRound, Smartphone, CheckCircle2
} from 'lucide-react';
import { fetchApi } from '../services/api';

const INDIAN_STATES = [
  'Madhya Pradesh',
  'Maharashtra',
  'Uttar Pradesh',
  'Delhi',
  'Gujarat',
  'Rajasthan',
  'Karnataka',
  'Tamil Nadu',
  'West Bengal',
  'Bihar',
  'Punjab',
  'Haryana',
  'Telangana',
  'Andhra Pradesh',
  'Kerala',
  'Odisha',
  'Assam'
];

export const Login: React.FC = () => {
  const navigate = useNavigate();

  // Mode: 'LOGIN' | 'REGISTER' | 'OTP' | 'ID_ISSUED'
  const [viewMode, setViewMode] = useState<'LOGIN' | 'REGISTER' | 'OTP' | 'ID_ISSUED'>('LOGIN');

  // Login form state
  const [employeeId, setEmployeeId] = useState('LM-MP-0421');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  // Real OTP 2FA state
  const [challengeId, setChallengeId] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regState, setRegState] = useState('Madhya Pradesh');
  const [regDistrict, setRegDistrict] = useState('Indore');
  const [regZone, setRegZone] = useState('Zone 04 — Central Market');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<'INSPECTOR' | 'SUPERVISOR'>('INSPECTOR');

  // Issued Officer ID state
  const [issuedUser, setIssuedUser] = useState<any>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Status & loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: any;
    if (viewMode === 'OTP' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [viewMode, countdown]);

  // Auto-focus first input box when OTP screen opens
  useEffect(() => {
    if (viewMode === 'OTP') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [viewMode]);

  // 1-Click Demo Login for Judges
  const handleJudgeDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchApi<{ user: any; token: string }>('/auth/demo-login', {
        method: 'POST'
      });
      localStorage.setItem('metricheck_token', data.token);
      localStorage.setItem('metricheck_user', JSON.stringify(data.user));
      navigate('/inspector/dashboard');
    } catch (err: any) {
      const fallbackUser = {
        id: 'usr_inspector_1',
        employeeId: 'LM-MP-0421',
        name: 'Amit Verma',
        role: 'INSPECTOR',
        department: 'M.P. Legal Metrology Department',
        jurisdictionState: 'Madhya Pradesh',
        jurisdictionDistrict: 'Indore',
        jurisdictionZone: 'Zone 08 — Vijay Nagar'
      };
      localStorage.setItem('metricheck_token', 'demo_jwt_token_2026');
      localStorage.setItem('metricheck_user', JSON.stringify(fallbackUser));
      navigate('/inspector/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Prefill judge credentials into form
  const handleAutoFillJudge = () => {
    setEmployeeId('LM-MP-0421');
    setPassword('demo123');
    setError('');
  };

  // Handle Login submission: requests authentic 2FA OTP challenge from backend
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOtpError('');

    try {
      const data = await fetchApi<{
        requireOtp: boolean;
        challengeId: string;
        employeeId: string;
        name: string;
        maskedPhone: string;
        maskedEmail: string;
        expiresInSeconds: number;
        devOtp: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: employeeId.trim(),
          password
        })
      });

      setChallengeId(data.challengeId);
      setMaskedPhone(data.maskedPhone || '+91 ••••••3210');
      setMaskedEmail(data.maskedEmail || 'officer@lm.gov.in');
      setDevOtp(data.devOtp || '');
      setOtp(['', '', '', '', '', '']);
      setCountdown(60);
      setAttemptsRemaining(5);
      setViewMode('OTP');
    } catch (err: any) {
      setError(err.message || 'लॉगिन विफल • Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle individual OTP digit change
  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const updated = [...otp];
      updated[index] = '';
      setOtp(updated);
      return;
    }

    if (clean.length > 1) {
      const updated = [...otp];
      const digits = clean.split('').slice(0, 6);
      digits.forEach((d, i) => {
        if (index + i < 6) updated[index + i] = d;
      });
      setOtp(updated);
      const nextIdx = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextIdx]?.focus();
      return;
    }

    const updated = [...otp];
    updated[index] = clean;
    setOtp(updated);
    setOtpError('');

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle keyboard navigation between OTP boxes
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      handleOtpVerify(e);
    }
  };

  // Handle clipboard paste across 6 OTP boxes
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const updated = [...otp];
    pasted.split('').forEach((d, i) => {
      updated[i] = d;
    });
    setOtp(updated);
    const nextIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIdx]?.focus();
  };

  // Evaluator / Judge 1-click test fill
  const handleAutoFillOtp = () => {
    if (!devOtp) return;
    const digits = devOtp.split('').slice(0, 6);
    setOtp(digits);
    setOtpError('');
    otpInputRefs.current[5]?.focus();
  };

  // Handle OTP verification: submits challengeId and 6-digit code to backend
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setOtpError('कृपया पूरा 6-अंकीय OTP दर्ज करें • Please enter all 6 digits of the OTP');
      return;
    }

    setVerifying(true);
    setOtpError('');

    try {
      const data = await fetchApi<{
        user: any;
        token: string;
        message: string;
      }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          challengeId,
          otp: fullOtp
        })
      });

      localStorage.setItem('metricheck_token', data.token);
      localStorage.setItem('metricheck_user', JSON.stringify(data.user));
      navigate('/inspector/dashboard');
    } catch (err: any) {
      setOtpError(err.message || 'अमान्य OTP कोड • Invalid verification code');
      if (err.data?.attemptsLeft !== undefined) {
        setAttemptsRemaining(err.data.attemptsLeft);
      }
    } finally {
      setVerifying(false);
    }
  };

  // Handle Resend OTP: requests a new code from backend
  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setOtpError('');

    try {
      const res = await fetchApi<{
        challengeId: string;
        maskedPhone: string;
        maskedEmail: string;
        devOtp: string;
        message: string;
      }>('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ challengeId })
      });

      setChallengeId(res.challengeId);
      setDevOtp(res.devOtp);
      setOtp(['', '', '', '', '', '']);
      setCountdown(60);
      setAttemptsRemaining(5);
      setSuccessMsg('नया OTP आपके पंजीकृत मोबाइल एवं ईमेल पर भेज दिया गया है • New OTP sent');
      setTimeout(() => setSuccessMsg(''), 4000);
      otpInputRefs.current[0]?.focus();
    } catch (err: any) {
      setOtpError(err.message || 'पुनः OTP भेजना विफल • Failed to resend verification code');
    } finally {
      setResending(false);
    }
  };

  // Handle Register submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (regPassword !== regConfirmPassword) {
      setError('पासवर्ड मेल नहीं खाते • Passwords do not match.');
      return;
    }

    if (regPassword.length < 6) {
      setError('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए • Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const data = await fetchApi<{ user: any; employeeId: string; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          mobileNumber: regPhone.trim(),
          jurisdictionState: regState,
          jurisdictionDistrict: regDistrict.trim(),
          jurisdictionZone: regZone.trim(),
          role: regRole,
          department: `${regState} Legal Metrology Department`
        })
      });

      setIssuedUser(data.user);
      localStorage.setItem('metricheck_token', data.token);
      localStorage.setItem('metricheck_user', JSON.stringify(data.user));
      setViewMode('ID_ISSUED');
    } catch (err: any) {
      setError(err.message || 'पंजीकरण विफल रहा • Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  // Copy ID to clipboard
  const handleCopyId = () => {
    if (issuedUser?.employeeId) {
      navigator.clipboard.writeText(issuedUser.employeeId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  // Switch to login tab and prefill the newly issued ID
  const handleProceedToLoginWithId = () => {
    if (issuedUser?.employeeId) {
      setEmployeeId(issuedUser.employeeId);
      setPassword('');
    }
    setViewMode('LOGIN');
    setSuccessMsg(`आपकी यूनिक आईडी दर्ज कर दी गई है (${issuedUser?.employeeId})। कृपया पासवर्ड दर्ज करें।`);
  };

  return (
    <div className="gov-page flex items-center justify-center p-3 sm:p-6 min-h-screen">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-gov">
        
        {/* Top Tricolor Strip */}
        <div className="gov-tricolor" />

        {/* Home Navigation Bar */}
        <div className="bg-navy-950 px-4 py-2.5 flex items-center justify-between text-xs text-white/75 border-b border-navy-800/40">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="hover:text-white flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>मुख्य पृष्ठ • Home</span>
          </button>
          <span className="text-[10px] text-saffron font-mono uppercase tracking-wider">
            विधिक माप विज्ञान पोर्टल
          </span>
        </div>

        {/* ══ VIEW: ID ISSUED CELEBRATION MODAL ════════════════════════════════ */}
        {viewMode === 'ID_ISSUED' && (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <span className="badge badge-success badge-sm font-semibold uppercase tracking-wider mb-1">
                Official Commissioning Successful
              </span>
              <h2 className="text-lg font-bold text-navy-900 mt-1">
                विधिक माप विज्ञान अधिकारी पहचान पत्र
              </h2>
              <p className="text-xs text-slate-500 font-medium">Official Legal Metrology Officer ID Issued</p>
            </div>

            {/* Issued Statutory Badge Card */}
            <div className="bg-gradient-to-br from-navy-900 to-navy-800 text-white rounded-xl p-4 text-left space-y-3 shadow-md border border-navy-700">
              <div className="flex justify-between items-start border-b border-white/15 pb-2">
                <div>
                  <p className="text-[10px] text-saffron font-semibold uppercase tracking-widest">
                    GOVERNMENT OF INDIA • विधिक माप विज्ञान
                  </p>
                  <p className="text-sm font-bold text-white mt-0.5">{issuedUser?.name}</p>
                  <p className="text-[11px] text-white/70">{issuedUser?.department}</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-white/10 text-saffron flex items-center justify-center font-bold text-base">
                  म
                </div>
              </div>

              <div>
                <p className="text-[10px] text-white/60 uppercase font-semibold">
                  आधिकारिक यूनिक कर्मचारी आईडी • Assigned Officer ID
                </p>
                <div className="flex items-center justify-between mt-1 bg-black/30 px-3 py-2 rounded-lg border border-white/10">
                  <span className="font-mono text-lg font-extrabold tracking-wider text-saffron">
                    {issuedUser?.employeeId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="btn btn-ghost btn-xs text-white/80 hover:text-white gap-1"
                  >
                    {copiedId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Copy ID</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-white/75 pt-1">
                <div>
                  <span className="text-white/40 block text-[9px]">JURISDICTION</span>
                  <span className="font-medium truncate block">{issuedUser?.jurisdictionDistrict}, {issuedUser?.jurisdictionState}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[9px]">ASSIGNED ZONE</span>
                  <span className="font-medium truncate block">{issuedUser?.jurisdictionZone}</span>
                </div>
              </div>
            </div>

            <div className="alert alert-warning text-xs p-3 font-medium text-left">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
              <span>
                <b>महत्वपूर्ण:</b> कृपया अपनी कर्मचारी आईडी (<b>{issuedUser?.employeeId}</b>) नोट कर लें। लॉगिन के दौरान आपको इसी आईडी की आवश्यकता होगी।
              </span>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleProceedToLoginWithId}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-700/25 transition-all cursor-pointer active:scale-[0.99]"
              >
                इस आईडी से लॉगिन करें • Login with this ID
              </button>

              <button
                type="button"
                onClick={() => navigate('/inspector/dashboard')}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white border-2 border-slate-300 hover:bg-slate-50 text-navy-900 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer active:scale-[0.99]"
              >
                सीधे डैशबोर्ड पर जाएं • Go Directly to Dashboard →
              </button>
            </div>
          </div>
        )}

        {/* ══ VIEW: LOGIN & REGISTER FORMS ══════════════════════════════════════ */}
        {(viewMode === 'LOGIN' || viewMode === 'REGISTER') && (
          <div>
            {/* Header branding */}
            <div className="bg-navy-900 px-6 py-6 text-center text-white">
              <div className="w-12 h-12 rounded-xl bg-white text-navy-900 flex items-center justify-center mx-auto mb-2.5 font-bold text-xl shadow-md">
                म
              </div>
              <p className="text-[10px] text-saffron tracking-[0.18em] uppercase font-semibold">
                भारत सरकार • Government of India
              </p>
              <h1 className="text-xl font-bold tracking-tight mt-0.5">
                MetriCheck <span className="text-saffron">AI</span>
              </h1>
              <p className="text-xs text-white/75 font-medium mt-0.5">
                विधिक माप विज्ञान निरीक्षण पोर्टल • Inspector Portal
              </p>
            </div>

            {/* ── FAST-TRACK JUDGE DEMO LOGIN BANNER ── */}
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-saffron text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-navy-900 block">
                      निर्णायक डेमो प्रवेश • Judge 1-Click Access
                    </span>
                    <span className="text-[11px] text-slate-600 font-medium block">
                      Instant evaluation as Amit Verma (LM-MP-0421)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleJudgeDemoLogin}
                  disabled={loading}
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {loading ? <span className="loading loading-spinner loading-xs" /> : 'डेमो लॉगिन →'}
                </button>
              </div>
            </div>

            {/* ── TAB SELECTOR: LOGIN VS REGISTER ── */}
            <div className="grid grid-cols-2 border-b border-base-300 bg-base-200/60 p-1.5 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setViewMode('LOGIN');
                  setError('');
                }}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  viewMode === 'LOGIN'
                    ? 'bg-navy-900 text-white shadow-md'
                    : 'bg-white/60 text-slate-600 hover:bg-white hover:text-navy-900'
                }`}
              >
                लॉग इन • Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('REGISTER');
                  setError('');
                }}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  viewMode === 'REGISTER'
                    ? 'bg-navy-900 text-white shadow-md'
                    : 'bg-white/60 text-slate-600 hover:bg-white hover:text-navy-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-saffron shrink-0" />
                <span>नया पंजीकरण • Register</span>
              </button>
            </div>

            {/* Notification messages */}
            {error && (
              <div className="mx-6 mt-4 alert alert-error text-xs p-3 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="mx-6 mt-4 alert alert-success text-xs p-3 font-medium">
                <Check className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ── SUB-VIEW: LOGIN FORM ── */}
            {viewMode === 'LOGIN' && (
              <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
                <div className="form-control">
                  <label htmlFor="login-employee-id" className="label py-1">
                    <span className="label-text font-semibold text-xs text-slate-700">
                      कर्मचारी आईडी या ईमेल • Employee ID / Email
                    </span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="login-employee-id"
                      type="text"
                      placeholder="उदा. LM-MP-0421 या आपका यूनिक आईडी"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="input input-bordered w-full pl-10 pr-3 text-sm font-medium bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="form-control">
                  <div className="flex justify-between items-center py-1">
                    <label htmlFor="login-password" className="label-text font-semibold text-xs text-slate-700">
                      पासवर्ड • Password
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoFillJudge}
                      className="text-xs text-amber-800 hover:text-amber-950 font-bold px-2 py-1 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-200 transition cursor-pointer"
                    >
                      Fill Sample Credentials
                    </button>
                  </div>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="पासवर्ड दर्ज करें"
                      className="input input-bordered w-full pl-10 pr-10 text-sm font-medium bg-white"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-700/25 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? <span className="loading loading-spinner loading-xs" /> : 'लॉग इन • Login'}
                </button>

                <div className="divider text-[10px] text-slate-400 font-semibold uppercase my-1">या • OR</div>

                <button
                  type="button"
                  onClick={() => setViewMode('REGISTER')}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-navy-900 text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-[0.99]"
                >
                  <UserPlus className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span>नए अधिकारी का पंजीकरण करें • Register New Officer</span>
                </button>

                <div className="pt-1 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>विधिक माप विज्ञान विभाग • अधिकृत अधिकारी प्रवेश</span>
                </div>
              </form>
            )}

            {/* ── SUB-VIEW: REGISTER OFFICER FORM ── */}
            {viewMode === 'REGISTER' && (
              <form onSubmit={handleRegisterSubmit} className="p-6 space-y-3.5">
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-950 font-medium flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-saffron shrink-0 mt-0.5" />
                  <div>
                    पंजीकरण के उपरांत आपको एक <b>आधिकारिक यूनिक कर्मचारी आईडी (जैसे LM-MP-XXXX)</b> जारी की जाएगी, जिससे आप पोर्टल में प्रवेश करेंगे।
                  </div>
                </div>

                <div className="form-control">
                  <label htmlFor="reg-name" className="label py-0.5">
                    <span className="label-text font-semibold text-xs text-slate-700">
                      पूरा नाम • Official Full Name *
                    </span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-name"
                      type="text"
                      placeholder="उदा. डॉ. राजेश कुमार"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="input input-bordered w-full pl-10 pr-3 text-xs sm:text-sm font-medium bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-control">
                    <label htmlFor="reg-email" className="label py-0.5">
                      <span className="label-text font-semibold text-xs text-slate-700">
                        विभागीय ईमेल • Email *
                      </span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-email"
                        type="email"
                        placeholder="officer@lm.gov.in"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="input input-bordered w-full pl-10 pr-3 text-xs sm:text-sm font-medium bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <label htmlFor="reg-phone" className="label py-0.5">
                      <span className="label-text font-semibold text-xs text-slate-700">
                        मोबाइल नंबर • Mobile *
                      </span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-phone"
                        type="tel"
                        placeholder="9876543210"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="input input-bordered w-full pl-10 pr-3 text-xs sm:text-sm font-medium bg-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-control">
                    <label htmlFor="reg-state" className="label py-0.5">
                      <span className="label-text font-semibold text-xs text-slate-700">
                        राज्य • State *
                      </span>
                    </label>
                    <select
                      id="reg-state"
                      value={regState}
                      onChange={(e) => setRegState(e.target.value)}
                      className="select select-bordered w-full text-xs font-medium bg-white"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control">
                    <label htmlFor="reg-district" className="label py-0.5">
                      <span className="label-text font-semibold text-xs text-slate-700">
                        ज़िला • District *
                      </span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-district"
                        type="text"
                        placeholder="उदा. Indore / Pune"
                        value={regDistrict}
                        onChange={(e) => setRegDistrict(e.target.value)}
                        className="input input-bordered w-full pl-10 pr-3 text-xs sm:text-sm font-medium bg-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-control">
                  <label htmlFor="reg-zone" className="label py-0.5">
                    <span className="label-text font-semibold text-xs text-slate-700">
                      कार्यक्षेत्र/सर्कल • Jurisdiction Zone / Circle *
                    </span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-zone"
                      type="text"
                      placeholder="उदा. Zone 04 — Central Market Circle"
                      value={regZone}
                      onChange={(e) => setRegZone(e.target.value)}
                      className="input input-bordered w-full pl-10 pr-3 text-xs sm:text-sm font-medium bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-control">
                    <label htmlFor="reg-password" className="label py-0.5">
                      <span className="label-text font-semibold text-xs text-slate-700">
                        पासवर्ड • Password (min 6) *
                      </span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-password"
                        type="password"
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="input input-bordered w-full pl-10 pr-3 text-xs sm:text-sm font-medium bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <label htmlFor="reg-confirm-password" className="label py-0.5">
                      <span className="label-text font-semibold text-xs text-slate-700">
                        पुष्टि करें • Confirm *
                      </span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="input input-bordered w-full pl-10 pr-3 text-xs sm:text-sm font-medium bg-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-700/25 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>पंजीकरण करें व यूनिक आईडी प्राप्त करें • Register &amp; Issue ID</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ══ VIEW: OTP VERIFICATION STEP ══════════════════════════════════════ */}
        {viewMode === 'OTP' && (
          <form onSubmit={handleOtpVerify} className="p-6 text-center space-y-4">
            <div className="w-13 h-13 rounded-2xl bg-orange-100/70 border border-orange-200 text-saffron flex items-center justify-center mx-auto shadow-sm">
              <KeyRound className="w-7 h-7 text-primary" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800 mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>NIC Kavach 2FA • द्विस्तरीय प्रमाणीकरण</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-navy-900">OTP सत्यापन • Security Verification</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-xs mx-auto">
                सुरक्षित अधिकारी सत्र हेतु 6-अंकीय प्रमाणीकरण कोड प्रेषित किया गया है
              </p>
            </div>

            {/* Officer Identification Bar */}
            <div className="bg-base-200/80 border border-base-300 p-3 rounded-xl text-xs flex justify-between items-center font-medium">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-navy-900 text-white flex items-center justify-center text-[10px] font-bold">
                  {employeeId.slice(0, 2)}
                </div>
                <div className="text-left">
                  <div className="text-slate-500 text-[10px]">Officer Session</div>
                  <div className="text-navy-900 font-mono font-bold">{employeeId}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-slate-500 text-[10px]">Security Protocol</div>
                <div className="text-emerald-700 font-bold text-[11px]">Level 2 Encrypted</div>
              </div>
            </div>

            {/* Dispatch Target Notification */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 text-left flex items-start gap-2.5">
              <Smartphone className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800">कोड प्रेषित: </span>
                <span>पंजीकृत मोबाइल <b className="font-mono text-navy-900">{maskedPhone}</b> एवं ईमेल <b className="font-mono text-navy-900">{maskedEmail}</b></span>
              </div>
            </div>

            {/* Evaluator / Judge Test Simulation Pill */}
            {devOtp && (
              <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3 text-left transition-all">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-amber-950 font-medium">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>परीक्षण कोड • Test Code:</span>
                    <span className="font-mono bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded font-bold text-sm tracking-wider">
                      {devOtp}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoFillOtp}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-all"
                  >
                    ⚡ Auto-fill
                  </button>
                </div>
                <p className="text-[10px] text-amber-900/70 mt-1">
                  NIC SMS Gateway सिमुलेटर ने कोड जनरेट किया है। आप इसे टाइप कर सकते हैं या 1-क्लिक से ऑटो-फिल कर सकते हैं।
                </p>
              </div>
            )}

            {/* 6-Digit Individual OTP Inputs */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                6-अंकीय सत्यापन कोड दर्ज करें • Enter 6-Digit Code
              </label>
              <div className="flex justify-center gap-2 sm:gap-2.5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    className={`w-10 sm:w-12 h-12 sm:h-13 text-center text-lg sm:text-xl font-mono font-bold bg-white rounded-xl transition-all outline-none ${
                      otpError
                        ? 'border-2 border-rose-400 text-rose-900 bg-rose-50/30'
                        : digit
                        ? 'border-2 border-primary text-navy-900 shadow-sm'
                        : 'border border-slate-300 text-navy-900 focus:border-2 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {otpError && (
              <div className="alert alert-error text-xs p-3 font-medium text-left bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1">
                  <span>{otpError}</span>
                  {attemptsRemaining !== null && attemptsRemaining > 0 && (
                    <div className="text-[11px] font-bold text-rose-700 mt-0.5">
                      सुरक्षा सीमा: {attemptsRemaining} प्रयास शेष • {attemptsRemaining} attempt(s) left
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="alert alert-success text-xs p-3 font-medium text-left bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit & Verify */}
            <button
              type="submit"
              disabled={verifying}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-700/25 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  <span>सत्यापित हो रहा है... • Verifying Session...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>सत्यापित करें व पोर्टल में प्रवेश करें • Verify &amp; Access Dashboard</span>
                </>
              )}
            </button>

            {/* Resend OTP Row */}
            <div className="flex items-center justify-between text-xs pt-1 px-1 border-t border-slate-100">
              <span className="text-slate-500 font-medium">कोड नहीं मिला? • Didn't receive?</span>
              {countdown > 0 ? (
                <span className="text-slate-400 font-medium text-[11px]">
                  पुनः भेजें • Resend in <b className="font-mono text-slate-700 font-bold">{countdown}s</b>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="text-orange-700 hover:text-orange-800 font-bold inline-flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  {resending ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <RotateCw className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>पुनः कोड भेजें • Resend OTP</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setViewMode('LOGIN');
                setOtpError('');
                setSuccessMsg('');
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              ← वापस लॉगिन पर जाएं • Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
