import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Layout from './components/Layout'
import LoadingSpinner from './components/common/LoadingSpinner'

// Lazy load pages for better performance
const LoginPage = lazy(() => import('./pages/Auth/Login'))
const DashboardPage = lazy(() => import('./pages/Dashboard'))
const BillSearchPage = lazy(() => import('./pages/BillSearch'))
const BillWarehousePage = lazy(() => import('./pages/BillWarehouse'))
const CustomersPage = lazy(() => import('./pages/Customers'))
const SalesPage = lazy(() => import('./pages/Sales'))
const ReportsPage = lazy(() => import('./pages/Reports'))
const ProxyManagerPage = lazy(() => import('./components/proxy/ProxyManager'))

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            <Suspense fallback={<LoadingSpinner />}>
              <LoginPage />
            </Suspense>
          } />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={
              <Suspense fallback={<LoadingSpinner />}>
                <DashboardPage />
              </Suspense>
            } />
            <Route path="bill-search" element={
              <Suspense fallback={<LoadingSpinner />}>
                <BillSearchPage />
              </Suspense>
            } />
            <Route path="warehouse" element={
              <Suspense fallback={<LoadingSpinner />}>
                <BillWarehousePage />
              </Suspense>
            } />
            <Route path="customers" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CustomersPage />
              </Suspense>
            } />
            <Route path="sales" element={
              <Suspense fallback={<LoadingSpinner />}>
                <SalesPage />
              </Suspense>
            } />
            <Route path="reports" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ReportsPage />
              </Suspense>
            } />
            <Route path="proxy" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ProxyManagerPage />
              </Suspense>
            } />
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
