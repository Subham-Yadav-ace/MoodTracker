import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  Bell,
  Save,
  Trash2,
  LogOut,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { format } from "date-fns";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "contact", label: "Trusted Contact", icon: Shield },
  { id: "account", label: "Account", icon: Bell },
];

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile form
  const [profileForm, setProfileForm] = useState({ name: user?.name || "", email: user?.email || "" });
  const [profileLoading, setProfileLoading] = useState(false);

  // Trusted contact form
  const [contactForm, setContactForm] = useState({ name: "", phone: "" });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactLoaded, setContactLoaded] = useState(false);

  // Load profile
  useEffect(() => {
    setProfileForm({ name: user?.name || "", email: user?.email || "" });
  }, [user]);

  // Load trusted contact
  useEffect(() => {
    if (activeTab === "contact" && !contactLoaded) {
      api.get("/user/profile").then(({ data }) => {
        if (data.user?.trustedContact?.name) {
          setContactForm({
            name: data.user.trustedContact.name,
            phone: data.user.trustedContact.phone || "",
          });
        }
        setContactLoaded(true);
      }).catch(() => setContactLoaded(true));
    }
  }, [activeTab, contactLoaded]);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim() || profileForm.name.length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    setProfileLoading(true);
    try {
      const { data } = await api.put("/user/profile", { name: profileForm.name.trim() });
      updateUser(data.user);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setProfileLoading(false);
    }
  };

  const saveTrustedContact = async (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    setContactLoading(true);
    try {
      await api.put("/user/trusted-contact", contactForm);
      toast.success("Trusted contact saved! They'll be notified in a crisis.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save contact");
    } finally {
      setContactLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm(
      "Are you sure? This will permanently delete your account and all mood data. This cannot be undone."
    );
    if (!confirm) return;
    try {
      await api.delete("/user/profile");
      await logout();
      toast.success("Account deleted");
    } catch {
      toast.error("Failed to delete account");
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto page-enter">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 gradient-bg"
            style={{ boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              {user?.name}
            </h1>
            <p style={{ color: "var(--text-secondary)" }}>{user?.email}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Member since {user?.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            id={`profile-tab-${id}`}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === id ? "gradient-bg text-white" : ""
            }`}
            style={
              activeTab !== id
                ? {
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                  }
                : {}
            }
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="card p-6 animate-fade-in">
          <h2 className="text-base font-semibold mb-5" style={{ color: "var(--text-primary)" }}>
            Personal Information
          </h2>
          <form onSubmit={saveProfile} className="space-y-5">
            <div>
              <label htmlFor="profile-name" className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                Full name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                <input
                  id="profile-name"
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="input-base pl-10"
                  placeholder="Your name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile-email" className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                <input
                  id="profile-email"
                  type="email"
                  value={profileForm.email}
                  disabled
                  className="input-base pl-10 opacity-60 cursor-not-allowed"
                />
              </div>
              <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                Email cannot be changed
              </p>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              id="profile-save-btn"
              className="btn-primary"
            >
              {profileLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save size={15} />
                  Save Changes
                </span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Trusted Contact Tab */}
      {activeTab === "contact" && (
        <div className="space-y-5 animate-fade-in">
          <div className="card p-6">
            <div className="flex items-start gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(99,102,241,0.12)" }}
              >
                <Shield size={18} style={{ color: "var(--brand-from)" }} />
              </div>
              <div>
                <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  Trusted Contact
                </h2>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  If MindMap detects a crisis pattern (3+ consecutive low entries), this person will receive an SMS.
                </p>
              </div>
            </div>

            <form onSubmit={saveTrustedContact} className="space-y-4">
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                  Contact&apos;s Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input
                    id="contact-name"
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="input-base pl-10"
                    placeholder="e.g. Mom, Best Friend"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-phone" className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                  Phone Number (with country code)
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input
                    id="contact-phone"
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="input-base pl-10"
                    placeholder="+919876543210"
                  />
                </div>
                <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                  Format: +91XXXXXXXXXX for India
                </p>
              </div>

              <button
                type="submit"
                disabled={contactLoading}
                id="contact-save-btn"
                className="btn-primary"
              >
                {contactLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save size={15} />
                    Save Trusted Contact
                  </span>
                )}
              </button>
            </form>
          </div>

          <div
            className="p-4 rounded-xl"
            style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            <div className="flex gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Your contact will receive an SMS like: &quot;Hi [Name], this is MindMap. [Your Name] may be going through a difficult time. Please check in with them.&quot;
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === "account" && (
        <div className="space-y-5 animate-fade-in">
          <div className="card p-6">
            <h2 className="font-semibold mb-5" style={{ color: "var(--text-primary)" }}>
              Account Settings
            </h2>
            <div className="space-y-4">
              <div
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: "var(--bg-secondary)" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    Weekly Email Report
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Sent every Sunday at 9 AM IST
                  </p>
                </div>
                <span
                  className="px-2 py-1 rounded-lg text-xs"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}
                >
                  Active
                </span>
              </div>

              <div
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: "var(--bg-secondary)" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    Crisis Detection
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Runs nightly at 8 PM IST
                  </p>
                </div>
                <span
                  className="px-2 py-1 rounded-lg text-xs"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}
                >
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div
            className="card p-6"
            style={{ border: "1px solid rgba(239,68,68,0.25)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-red-400" />
              <h2 className="font-semibold text-red-400">Danger Zone</h2>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => { logout(); }}
                id="account-logout-btn"
                className="btn-secondary w-full text-left flex items-center gap-3"
              >
                <LogOut size={15} />
                Sign out of all devices
              </button>

              <button
                onClick={handleDeleteAccount}
                id="account-delete-btn"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "#f87171",
                }}
              >
                <Trash2 size={15} />
                Delete account permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
