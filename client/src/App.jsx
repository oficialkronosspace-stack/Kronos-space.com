import React, { Suspense, lazy, useContext, Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationToast from './components/NotificationToast';
import Welcome from './pages/Welcome';
import AdminDashboard from './admin/AdminDashboard';
import ProtectedAdminRoute from './admin/ProtectedAdminRoute';
import { AuthContext } from './context/AuthContext';
import DesktopSidebar from './components/kronos/DesktopSidebar';
import ExpandableBubbleNav from './components/kronos/ExpandableBubbleNav';

class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <div style={{ color: '#0a0a14', fontSize: 18, fontWeight: 700 }}>Algo salió mal</div>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 28px', borderRadius: 24, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function MyProfileRedirect() {
  const { user } = useContext(AuthContext);
  const id = user?._id || user?.id;
  return id ? <Navigate to={`/profile/${id}`} replace /> : <Navigate to="/auth/login" replace />;
}

// Layout con sidebar en desktop + Navbar + contenido
function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff', position: 'relative' }}>
      <DesktopSidebar />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        {children}
      </div>
    </div>
  );
}

// Lazy load modules
const SocialModule    = lazy(() => import('./social/SocialModule'));
const ShopModule      = lazy(() => import('./shop/ShopModule'));
const Login           = lazy(() => import('./components/Auth/Login'));
const Register        = lazy(() => import('./components/Auth/Register'));
const OAuthCallback   = lazy(() => import('./components/Auth/OAuthCallback'));
const ForgotPassword  = lazy(() => import('./components/Auth/ForgotPassword'));
const ResetPassword   = lazy(() => import('./components/Auth/ResetPassword'));
const UniversalSearch = lazy(() => import('./pages/Search'));
const HybridFeed      = lazy(() => import('./pages/Feed'));
const UserProfile     = lazy(() => import('./pages/Profile'));
const Settings        = lazy(() => import('./pages/Settings'));
const KronosMockups   = lazy(() => import('./pages/KronosMockups'));
const Pricing         = lazy(() => import('./pages/Pricing'));
const SubscriptionSuccess = lazy(() => import('./pages/SubscriptionSuccess'));
const SubscriptionCancel  = lazy(() => import('./pages/SubscriptionCancel'));
const Communities     = lazy(() => import('./pages/Communities'));
const CommunityDetail = lazy(() => import('./pages/CommunityDetail'));
const Live            = lazy(() => import('./pages/Live'));
const Marketplace     = lazy(() => import('./pages/Marketplace'));
const Wallet          = lazy(() => import('./pages/Wallet'));
const NotificationsPage = lazy(() => import('./pages/Notifications'));
const Reservations    = lazy(() => import('./pages/Reservations'));
const Health          = lazy(() => import('./pages/Health'));
const AvatarPage      = lazy(() => import('./pages/Avatar'));
const VideoEditorPage = lazy(() => import('./pages/VideoEditor'));
const EventsPage      = lazy(() => import('./pages/Events'));
const GamificationPage = lazy(() => import('./pages/Gamification'));
const Privacy         = lazy(() => import('./pages/Privacy'));
const Terms           = lazy(() => import('./pages/Terms'));

const LOADING = (
  <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ color: 'rgba(10,10,20,0.4)' }}>Cargando...</div>
  </div>
);

// Wrapper para rutas protegidas con AppLayout
function P({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <Router>
      <ExpandableBubbleNav />
      <NotificationToast />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255,255,255,0.98)',
            color: '#0a0a14',
            border: '1.5px solid rgba(79,172,254,0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(79,172,254,0.15)',
          }
        }}
      />
      <ErrorBoundary>
        <Suspense fallback={LOADING}>
          <Routes>
            {/* Públicas */}
            <Route path="/"                      element={<Welcome />} />
            <Route path="/mockups"               element={<KronosMockups />} />
            <Route path="/pricing"               element={<Pricing />} />
            <Route path="/privacy"               element={<Privacy />} />
            <Route path="/terms"                 element={<Terms />} />
            <Route path="/subscription/cancel"   element={<SubscriptionCancel />} />
            <Route path="/auth/login"            element={<Login />} />
            <Route path="/auth/register"         element={<Register />} />
            <Route path="/auth/callback"         element={<OAuthCallback />} />
            <Route path="/login"                 element={<Navigate to="/auth/login" />} />
            <Route path="/register"              element={<Navigate to="/auth/register" />} />
            <Route path="/forgot-password"       element={<ForgotPassword />} />
            <Route path="/reset-password"        element={<ResetPassword />} />

            {/* Protegidas — todas usan AppLayout (sidebar desktop + navbar + bubble nav) */}
            <Route path="/feed"                  element={<P><HybridFeed /></P>} />
            <Route path="/search"                element={<P><UniversalSearch /></P>} />
            <Route path="/profile/me"            element={<ProtectedRoute><MyProfileRedirect /></ProtectedRoute>} />
            <Route path="/profile/:userId"       element={<P><UserProfile /></P>} />
            <Route path="/social/*"              element={<P><SocialModule /></P>} />
            <Route path="/shop/*"                element={<P><ShopModule /></P>} />
            <Route path="/settings"              element={<P><Settings /></P>} />
            <Route path="/settings/:tab"         element={<P><Settings /></P>} />
            <Route path="/wallet"                element={<P><Wallet /></P>} />
            <Route path="/live"                  element={<P><Live /></P>} />
            <Route path="/notifications"         element={<P><NotificationsPage /></P>} />
            <Route path="/communities"           element={<P><Communities /></P>} />
            <Route path="/communities/:id"       element={<P><CommunityDetail /></P>} />
            <Route path="/marketplace"           element={<P><Marketplace /></P>} />
            <Route path="/reservations"          element={<P><Reservations /></P>} />
            <Route path="/health"                element={<P><Health /></P>} />
            <Route path="/avatar"                element={<P><AvatarPage /></P>} />
            <Route path="/video-editor"          element={<P><VideoEditorPage /></P>} />
            <Route path="/events"                element={<P><EventsPage /></P>} />
            <Route path="/gamification"          element={<P><GamificationPage /></P>} />
            <Route path="/subscription/success"  element={<ProtectedRoute><SubscriptionSuccess /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin/*" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
