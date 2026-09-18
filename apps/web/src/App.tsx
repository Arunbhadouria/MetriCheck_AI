import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { JurisdictionSetup } from './pages/JurisdictionSetup';
import { Scanner } from './pages/Scanner';
import { ScanResult } from './pages/ScanResult';
import { SessionSummary } from './pages/SessionSummary';
import { ProductDetail } from './pages/ProductDetail';
import { ReportPreview } from './pages/ReportPreview';
import { ReportSubmitted } from './pages/ReportSubmitted';
import { Dashboard } from './pages/Dashboard';
import { AllInspections } from './pages/AllInspections';
import { LawAwareness } from './pages/LawAwareness';

const RootRoute: React.FC = () => {
  const token = localStorage.getItem('metricheck_token');
  if (token) {
    return <Navigate to="/inspector/dashboard" replace />;
  }
  return <Landing />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/laws" element={<LawAwareness />} />
        <Route path="/inspector/laws" element={<LawAwareness />} />
        <Route path="/inspector/dashboard" element={<Dashboard />} />
        <Route path="/inspector/inspections" element={<AllInspections />} />
        <Route path="/inspector/inspections/new" element={<JurisdictionSetup />} />
        <Route path="/inspector/inspections/:id/scan" element={<Scanner />} />
        <Route path="/inspector/inspections/:id/review" element={<ScanResult />} />
        <Route path="/inspector/inspections/:id/summary" element={<SessionSummary />} />
        <Route path="/inspector/inspections/:id/product/:productId" element={<ProductDetail />} />
        <Route path="/inspector/inspections/:id/report" element={<ReportPreview />} />
        <Route path="/inspector/inspections/:id/submitted" element={<ReportSubmitted />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
