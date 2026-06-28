import { useState } from "react";
import { MapPin, Search, ExternalLink } from "lucide-react";

// Note: Full Google Maps integration requires VITE_GOOGLE_MAPS_KEY env var
// This component shows the full UI with a placeholder map area

const SPECIALTIES = ["All", "Anxiety", "Depression", "Trauma", "PTSD", "Couples", "Addiction"];
const MODES = ["All", "Online", "In-Person", "Both"];

const TherapistFinder = () => {
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("All");
  const [mode, setMode] = useState("All");
  const [searchInput, setSearchInput] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setCity(searchInput.trim());
  };

  const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto page-enter">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 4px 14px rgba(16,185,129,0.35)" }}
          >
            <MapPin size={22} color="white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              Therapist Finder
            </h1>
            <p style={{ color: "var(--text-secondary)" }}>
              Find mental health professionals near you
            </p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              id="therapist-city-search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input-base pl-11"
              placeholder="Enter your city (e.g. Mumbai, Pune, Bangalore)"
            />
          </div>
          <button type="submit" id="therapist-search-btn" className="btn-primary px-6">
            <Search size={16} />
            Search
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Specialty</p>
          <div className="flex gap-2 flex-wrap">
            {SPECIALTIES.map((s) => (
              <button
                key={s}
                onClick={() => setSpecialty(s)}
                id={`specialty-${s.toLowerCase()}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  specialty === s ? "gradient-bg text-white" : ""
                }`}
                style={
                  specialty !== s
                    ? { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }
                    : {}
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Mode</p>
          <div className="flex gap-2">
            {MODES.map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                id={`mode-${m.toLowerCase()}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  mode === m ? "gradient-bg text-white" : ""
                }`}
                style={
                  mode !== m
                    ? { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }
                    : {}
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map area */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              height: 420,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            {MAPS_KEY ? (
              // When Google Maps key is available, embed the map
              <iframe
                title="Therapist Map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps/embed/v1/search?key=${MAPS_KEY}&q=therapist+psychologist+${city || "India"}&zoom=12`}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(16,185,129,0.1)" }}
                >
                  <MapPin size={30} style={{ color: "#10b981" }} />
                </div>
                <div className="text-center">
                  <p className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                    Google Maps Integration
                  </p>
                  <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                    Add your Google Maps API key to <code className="px-1 py-0.5 rounded" style={{ background: "var(--bg-secondary)" }}>VITE_GOOGLE_MAPS_KEY</code> in the frontend <code>.env</code> to enable map search.
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/therapist+psychologist+${city || "near+me"}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary mx-auto w-fit"
                    id="therapist-maps-link"
                  >
                    <ExternalLink size={15} />
                    Search on Google Maps
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info panel */}
        <div className="space-y-4">
          {/* iCall info */}
          <div className="card p-5">
            <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              🌟 Recommended Resources
            </h3>
            <div className="space-y-3">
              {[
                { name: "iCall", url: "https://icallhelpline.org", desc: "TISS psychologists, ₹0-500/session", phone: "9152987821" },
                { name: "YourDost", url: "https://yourdost.com", desc: "Online counseling platform", phone: null },
                { name: "MindPeers", url: "https://mindpeers.co", desc: "Affordable therapy sessions", phone: null },
                { name: "Practo Mental Health", url: "https://practo.com/mental-health", desc: "Find verified therapists", phone: null },
              ].map((r) => (
                <a
                  key={r.name}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-white/5"
                  style={{ border: "1px solid var(--border)" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(16,185,129,0.12)" }}
                  >
                    <ExternalLink size={13} style={{ color: "#10b981" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {r.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{r.desc}</p>
                    {r.phone && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--brand-from)" }}>{r.phone}</p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div
            className="p-4 rounded-xl"
            style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--brand-from)" }}>
              💡 Finding the right therapist
            </p>
            <ul className="space-y-1.5">
              {[
                "First session is usually a trial — it's okay to switch",
                "Ask about their experience with your specific concern",
                "Online therapy is equally effective as in-person",
                "iCall offers subsidized rates for students",
              ].map((tip) => (
                <li key={tip} className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  · {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapistFinder;
