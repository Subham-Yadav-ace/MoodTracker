import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brain, Mail, Lock, Eye, EyeOff, User, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.trim().length < 2) errs.name = "Name must be at least 2 characters";
    if (!form.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email address";
    if (!form.password || form.password.length < 6) errs.password = "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords don't match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.name.trim(), form.email, form.password);
      toast.success("Account created! Welcome to MindMap 🎉");
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6) return { label: "Weak", color: "#ef4444", width: "33%" };
    if (p.length < 10) return { label: "Fair", color: "#f59e0b", width: "66%" };
    return { label: "Strong", color: "#10b981", width: "100%" };
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>
      {/* Left — decorative */}
      <div className="hidden lg:flex flex-col flex-1 items-center justify-center p-16 relative overflow-hidden">
        <div
          className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />

        <div className="relative z-10 max-w-2xl text-center animate-fade-in px-8">
          <div className="flex items-center justify-center mb-10">
            <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-3xl flex items-center justify-center gradient-bg animate-pulse-glow">
              <Brain className="w-10 h-10 lg:w-12 lg:h-12" color="white" strokeWidth={2} />
            </div>
          </div>

          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 leading-tight" style={{ color: "var(--text-primary)" }}>
            Start your{" "}
            <br className="hidden lg:block" />
            <span className="gradient-text">wellness journey</span>{" "}
            today
          </h2>
          <p className="mb-10 text-lg lg:text-xl xl:text-2xl max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            Join thousands tracking their mental health with AI-powered insights.
          </p>

          {/* Benefits */}
          <div className="space-y-6 text-left max-w-md mx-auto">
            {[
              { icon: "🧠", text: "AI detects what your words truly reveal" },
              { icon: "📊", text: "Visualize mood patterns over time" },
              { icon: "💬", text: "Anonymous peer support rooms" },
              { icon: "🔔", text: "Crisis alerts to your trusted contact" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-4">
                <span className="text-3xl lg:text-4xl">{icon}</span>
                <p className="text-base lg:text-lg" style={{ color: "var(--text-secondary)" }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div
        className="flex flex-col justify-center w-full lg:w-[500px] xl:w-[600px] shrink-0 p-8 lg:p-16 xl:p-20 overflow-y-auto"
        style={{ background: "var(--bg-secondary)", borderLeft: "1px solid var(--border)" }}
      >
        <div className="animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Brain size={20} color="white" />
            </div>
            <span className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>MindMap</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              Create account
            </h1>
            <p style={{ color: "var(--text-secondary)" }}>
              Free forever. No credit card needed.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name */}
            <div>
              <label htmlFor="reg-name" className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                Full name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                <input
                  id="reg-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-base pl-10"
                  placeholder="Subham Yadav"
                  autoComplete="name"
                />
              </div>
              {errors.name && <p className="text-xs mt-1.5 text-red-400">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                <input
                  id="reg-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-base pl-10"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-xs mt-1.5 text-red-400">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                <input
                  id="reg-password"
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-base pl-10 pr-10"
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength bar */}
              {strength && (
                <div className="mt-2">
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-card)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: strength.width, background: strength.color }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: strength.color }}>{strength.label}</p>
                </div>
              )}
              {errors.password && <p className="text-xs mt-1.5 text-red-400">{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                Confirm password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                <input
                  id="reg-confirm"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="input-base pl-10 pr-10"
                  placeholder="Repeat password"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <CheckCircle2 size={16} className="absolute right-10 top-1/2 -translate-y-1/2 text-emerald-400" />
                )}
              </div>
              {errors.confirmPassword && <p className="text-xs mt-1.5 text-red-400">{errors.confirmPassword}</p>}
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create Account
                  <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          <div className="divider" />

          <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <Link to="/login" className="font-semibold" style={{ color: "var(--brand-from)" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
