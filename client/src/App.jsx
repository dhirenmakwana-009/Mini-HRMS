import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AttendanceDashboard from './pages/Dashboard';
import { MainLayout } from './layout/MainLayout';
import './App.css'
import AttendanceHistory from './pages/AttendaceHistory';
import { Login } from './pages/Login'
import AdminDashboard from './pages/AdminDashboard';
import { AuthProvider, useAuth } from './hooks/useAuth';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function App() {

  return (

    <AuthProvider>
    <Router>
      <Routes>
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>} >
          <Route element={<AttendanceDashboard />} path='/' />
          <Route element={<AttendanceHistory />} path='/attendance-history' />
        </Route>
        <Route>
          <Route element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} path='admin-dashboard' />
          <Route element={<Login />} path='/login' />
        </Route>
          <Route path='*' element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </AuthProvider>
  )
}

export default App
