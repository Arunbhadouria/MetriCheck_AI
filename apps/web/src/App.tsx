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
import { CitizenHome } from './pages/consumer/CitizenHome';
import { ConsumerScanner } from './pages/consumer/ConsumerScanner';
import { ConsumerProductResult } from './pages/consumer/ConsumerProductResult';
import { ConsumerSessionSummary } from './pages/consumer/ConsumerSessionSummary';
import { ConsumerComplaintForm } from './pages/consumer/ConsumerComplaintForm';
import { ConsumerGrievanceTracker } from './pages/consumer/ConsumerGrievanceTracker';
import { ConsumerAuth } from './pages/consumer/ConsumerAuth';
import { ConsumerDashboard } from './pages/consumer/ConsumerDashboard';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';

import { RoleSwitchModal } from './components/RoleSwitchModal';
import { useNavigate } from 'react-router-dom';

const RootRoute: React.FC = () => {
  const inspectorToken = localStorage.getItem('metricheck_token');
  const citizenToken = localStorage.getItem('metricheck_citizen_token') || localStorage.getItem('metricheck_citizen_user');

  if (inspectorToken) {
    return <Navigate to="/inspector/dashboard" replace />;
  }
  if (citizenToken) {
    return <Navigate to="/consumer/dashboard" replace />;
  }
  return <Landing />;
};

const InspectorProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const inspectorToken = localStorage.getItem('metricheck_token');
  const citizenToken = localStorage.getItem('metricheck_citizen_token') || localStorage.getItem('metricheck_citizen_user');

  if (inspectorToken) {
    return <>{children}</>;
  }

  if (citizenToken) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <RoleSwitchModal
          isOpen={true}
          currentRole="CITIZEN"
          targetRole="INSPECTOR"
          onCancel={() => navigate('/consumer/dashboard')}
          onConfirm={() => {
            localStorage.removeItem('metricheck_citizen_token');
            localStorage.removeItem('metricheck_citizen_user');
            navigate('/login');
          }}
        />
      </div>
    );
  }

  return <Navigate to="/login" replace />;
};

const ConsumerProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const citizenToken = localStorage.getItem('metricheck_citizen_token') || localStorage.getItem('metricheck_citizen_user');
  const inspectorToken = localStorage.getItem('metricheck_token');

  if (citizenToken) {
    return <>{children}</>;
  }

  if (inspectorToken) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <RoleSwitchModal
          isOpen={true}
          currentRole="INSPECTOR"
          targetRole="CITIZEN"
          onCancel={() => navigate('/inspector/dashboard')}
          onConfirm={() => {
            localStorage.removeItem('metricheck_token');
            localStorage.removeItem('metricheck_user');
            navigate('/consumer/auth');
          }}
        />
      </div>
    );
  }

  return <Navigate to="/consumer/auth" replace />;
};

const LoginRoute: React.FC = () => {
  const navigate = useNavigate();
  const inspectorToken = localStorage.getItem('metricheck_token');
  const citizenToken = localStorage.getItem('metricheck_citizen_token') || localStorage.getItem('metricheck_citizen_user');

  if (inspectorToken) {
    return <Navigate to="/inspector/dashboard" replace />;
  }

  if (citizenToken) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <RoleSwitchModal
          isOpen={true}
          currentRole="CITIZEN"
          targetRole="INSPECTOR"
          onCancel={() => navigate('/consumer/dashboard')}
          onConfirm={() => {
            localStorage.removeItem('metricheck_citizen_token');
            localStorage.removeItem('metricheck_citizen_user');
            window.location.reload();
          }}
        />
      </div>
    );
  }

  return <Login />;
};

const ConsumerAuthRoute: React.FC = () => {
  const navigate = useNavigate();
  const citizenToken = localStorage.getItem('metricheck_citizen_token') || localStorage.getItem('metricheck_citizen_user');
  const inspectorToken = localStorage.getItem('metricheck_token');

  if (citizenToken) {
    return <Navigate to="/consumer/dashboard" replace />;
  }

  if (inspectorToken) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <RoleSwitchModal
          isOpen={true}
          currentRole="INSPECTOR"
          targetRole="CITIZEN"
          onCancel={() => navigate('/inspector/dashboard')}
          onConfirm={() => {
            localStorage.removeItem('metricheck_token');
            localStorage.removeItem('metricheck_user');
            window.location.reload();
          }}
        />
      </div>
    );
  }

  return <ConsumerAuth />;
};

const LawsRedirectRoute: React.FC = () => {
  const inspectorToken = localStorage.getItem('metricheck_token');
  if (inspectorToken) {
    return <Navigate to="/inspector/laws" replace />;
  }
  return <Navigate to="/consumer/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<LoginRoute />} />
        {/* /laws is now redirected — Acts & Rules is restricted to Inspector Portal */}
        <Route path="/laws" element={<LawsRedirectRoute />} />
        
        {/* ══ CONSUMER / CITIZEN PORTAL ROUTES (PROTECTED) ════════════════ */}
        <Route path="/consumer" element={<Navigate to="/consumer/scan" replace />} />
        <Route path="/citizen" element={<Navigate to="/consumer/scan" replace />} />
        <Route path="/consumer/auth" element={<ConsumerAuthRoute />} />
        <Route path="/consumer/login" element={<ConsumerAuthRoute />} />
        <Route path="/consumer/register" element={<ConsumerAuthRoute />} />
        
        <Route path="/consumer/dashboard" element={<ConsumerProtectedRoute><ConsumerDashboard /></ConsumerProtectedRoute>} />
        <Route path="/consumer/home" element={<ConsumerProtectedRoute><CitizenHome /></ConsumerProtectedRoute>} />
        <Route path="/consumer/scan" element={<ConsumerProtectedRoute><ConsumerScanner /></ConsumerProtectedRoute>} />
        <Route path="/consumer/result" element={<ConsumerProtectedRoute><ConsumerProductResult /></ConsumerProtectedRoute>} />
        <Route path="/consumer/summary" element={<ConsumerProtectedRoute><ConsumerSessionSummary /></ConsumerProtectedRoute>} />
        <Route path="/consumer/complaint" element={<ConsumerProtectedRoute><ConsumerComplaintForm /></ConsumerProtectedRoute>} />
        <Route path="/consumer/track" element={<ConsumerProtectedRoute><ConsumerGrievanceTracker /></ConsumerProtectedRoute>} />

        {/* ══ INSPECTOR PORTAL ROUTES (PROTECTED) ══════════════════════════ */}
        <Route path="/inspector/laws" element={<InspectorProtectedRoute><LawAwareness /></InspectorProtectedRoute>} />
        <Route path="/inspector/dashboard" element={<InspectorProtectedRoute><Dashboard /></InspectorProtectedRoute>} />
        <Route path="/inspector/inspections" element={<InspectorProtectedRoute><AllInspections /></InspectorProtectedRoute>} />
        <Route path="/inspector/inspections/new" element={<InspectorProtectedRoute><JurisdictionSetup /></InspectorProtectedRoute>} />
        <Route path="/inspector/inspections/:id/scan" element={<InspectorProtectedRoute><Scanner /></InspectorProtectedRoute>} />
        <Route path="/inspector/inspections/:id/review" element={<InspectorProtectedRoute><ScanResult /></InspectorProtectedRoute>} />
        <Route path="/inspector/inspections/:id/summary" element={<InspectorProtectedRoute><SessionSummary /></InspectorProtectedRoute>} />
        <Route path="/inspector/inspections/:id/product/:productId" element={<InspectorProtectedRoute><ProductDetail /></InspectorProtectedRoute>} />
        <Route path="/inspector/inspections/:id/report" element={<InspectorProtectedRoute><ReportPreview /></InspectorProtectedRoute>} />
        <Route path="/inspector/inspections/:id/submitted" element={<InspectorProtectedRoute><ReportSubmitted /></InspectorProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <PwaInstallPrompt />
    </BrowserRouter>
  );
};

export default App;
