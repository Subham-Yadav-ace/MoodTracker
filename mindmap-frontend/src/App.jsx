import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";

// Pages (lazy-ish — all imported upfront for Phase 1)
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MoodLog from "./pages/MoodLog";
import Analytics from "./pages/Analytics";
import PeerSupport from "./pages/PeerSupport";
import TherapistFinder from "./pages/TherapistFinder";
import Profile from "./pages/Profile";

// ─── App Layout — Sidebar + Page ─────────────────────────────
const AppLayout = () => (
  <div className="flex min-h-screen" style={{ background: "var(--bg-primary)" }}>
    <Sidebar />
    <main className="flex-1 overflow-auto">
      <Outlet />
    </main>
  </div>
);

// ─── 404 ─────────────────────────────────────────────────────
const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-screen gap-4">
    <h1 className="text-6xl font-bold gradient-text">404</h1>
    <p style={{ color: "var(--text-secondary)" }}>Page not found</p>
    <a href="/" className="btn-primary">Back to Dashboard</a>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              fontSize: "14px",
              fontFamily: "var(--font-sans)",
            },
            success: {
              iconTheme: { primary: "#10b981", secondary: "white" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "white" },
            },
          }}
        />

        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes — sidebar layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/log" element={<MoodLog />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/support" element={<PeerSupport />} />
              <Route path="/therapists" element={<TherapistFinder />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
