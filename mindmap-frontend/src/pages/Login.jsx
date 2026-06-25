import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brain, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email";
    if (!form.password) errs.password = "Password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back! 👋");
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid email or password";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Left panel — decorative */}
      <div className="hidden lg:flex flex-col flex-1 items-center justify-center p-16 relative overflow-hidden">
        {/* Gradient orbs */}
        <div
          className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #d946ef, transparent)" }}
        />

        <div className="relative z-10 max-w-md text-center animate-fade-in">
          {/* Logo */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center gradient-bg animate-pulse-glow"
            >
              <Brain size={32} color="white" strokeWidth={2} />
            </div>
          </div>

          <h2
            className="text-5xl font-bold mb-6 leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Understand your{" "}
            <span className="gradient-text">mental patterns</span>
          </h2>
          <p className="text-lg mb-12" style={{ color: "var(--text-secondary)" }}>
            MindMap uses AI-powered sentiment analysis to detect how you truly feel — beyond the numbers.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              "🧠 Divergence Detection",
              "📊 Mood Analytics",
              "💬 Peer Support",
              "🆘 Crisis Alerts",
            ].map((f) => (
              <span
                key={f}
                className="px-4 py-2 rounded-full text-sm font-medium glass"
                style={{ color: "var(--text-secondary)" }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div
        className="flex flex-col justify-center w-full lg:max-w-md p-8 lg:p-12"
        style={{ background: "var(--bg-secondary)", borderLeft: "1px solid var(--border)" }}
      >
        <div className="animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center gradient-bg">
              <Brain size={20} color="white" />
            </div>
            <span className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
              MindMap
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              Welcome back
            </h1>
            <p style={{ color: "var(--text-secondary)" }}>
              Sign in to continue your mental wellness journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  id="login-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-base pl-10"
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-xs mt-1.5 text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-base pl-10 pr-10"
                  placeholder="Your password"
                  autoComplete="current-password"
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors hover:text-white"
                  style={{ color: "var(--text-muted)" }}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs mt-1.5 text-red-400">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          <div className="divider" />

          <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold transition-colors"
              style={{ color: "var(--brand-from)" }}
            >
              Create one free
            </Link>
          </p>

          {/* Demo hint */}
          <div
            className="mt-6 p-4 rounded-xl flex items-start gap-3"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            <Sparkles size={16} className="flex-shrink-0 mt-0.5" style={{ color: "var(--brand-from)" }} />
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Track your mood daily, get AI-powered insights, and connect with peers — completely private.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
