import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { AcquisitionPage } from './pages/AcquisitionPage';
import { SellBuildPage } from './pages/SellBuildPage';
import { SoldItemsPage } from './pages/SoldItemsPage';
import { MonthlySummaryPage } from './pages/MonthlySummaryPage';
import { PriceIndexPage } from './pages/PriceIndexPage';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/acquisition" element={<AcquisitionPage />} />
                <Route path="/sell-build" element={<SellBuildPage />} />
                <Route path="/sold-items" element={<SoldItemsPage />} />
                <Route path="/monthly-summary" element={<MonthlySummaryPage />} />
                <Route path="/price-index" element={<PriceIndexPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
