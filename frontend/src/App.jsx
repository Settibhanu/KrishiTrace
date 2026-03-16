import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import HarvestPage from './pages/HarvestPage';
import LedgerPage from './pages/LedgerPage';
import QRScanPage from './pages/QRScanPage';
import GISPage from './pages/GISPage';
import IoTPage from './pages/IoTPage';
import ReportsPage from './pages/ReportsPage';
import QRVerifyPage from './pages/QRVerifyPage';

function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify/:recordId" element={<QRVerifyPage />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="harvest" element={<PrivateRoute roles={['farmer']}><HarvestPage /></PrivateRoute>} />
            <Route path="ledger" element={<LedgerPage />} />
            <Route path="scan" element={<QRScanPage />} />
            <Route path="gis" element={<GISPage />} />
            <Route path="iot" element={<IoTPage />} />
            <Route path="reports" element={<PrivateRoute roles={['fpo_admin', 'operator']}><ReportsPage /></PrivateRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
