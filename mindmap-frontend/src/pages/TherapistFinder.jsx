import { useState, useEffect, useRef } from "react";
import { MapPin, Search, ExternalLink, Navigation, Loader2, AlertCircle } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default icon paths (Vite asset hashing breaks them)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const SPECIALTIES = ["All", "Anxiety", "Depression", "Trauma", "PTSD", "Couples", "Addiction"];
const MODES = ["All", "Online", "In-Person", "Both"];

// Custom user location icon (pulsing green dot)
const userIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:18px; height:18px; border-radius:50%;
    background:#10b981; border:3px solid white;
    box-shadow: 0 0 0 4px rgba(16,185,129,0.35), 0 2px 8px rgba(0,0,0,0.3);
    animation: pulse-loc 2s ease-in-out infinite;
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Therapist pin icon
const therapistIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:28px; height:28px; border-radius:50% 50% 50% 0;
    background: linear-gradient(135deg,#10b981,#059669);
    border:2px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.3);
    transform: rotate(-45deg);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

// Query Overpass API for nearby mental health places
const fetchNearbyTherapists = async (lat, lon, radiusKm = 10) => {
  const r = radiusKm * 1000;
  const query = `
    [out:json][timeout:15];
    (
      node["healthcare"="psychotherapist"](around:${r},${lat},${lon});
      node["healthcare"="psychiatrist"](around:${r},${lat},${lon});
      node["healthcare"="mental_health"](around:${r},${lat},${lon});
      node["amenity"="social_facility"]["social_facility"="mental_health"](around:${r},${lat},${lon});
      node["office"="therapist"](around:${r},${lat},${lon});
      way["healthcare"="psychotherapist"](around:${r},${lat},${lon});
      way["healthcare"="psychiatrist"](around:${r},${lat},${lon});
    );
    out center 30;
  `;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: "data=" + encodeURIComponent(query),
  });
  const data = await res.json();
  return (data.elements || []).map((el) => ({
    id: el.id,
    lat: el.lat ?? el.center?.lat,
    lon: el.lon ?? el.center?.lon,
    name: el.tags?.name || el.tags?.["name:en"] || "Mental Health Clinic",
    type: el.tags?.healthcare || el.tags?.office || "therapist",
    phone: el.tags?.phone || el.tags?.["contact:phone"] || null,
    website: el.tags?.website || el.tags?.["contact:website"] || null,
    addr: [el.tags?.["addr:street"], el.tags?.["addr:city"]].filter(Boolean).join(", ") || null,
  }));
};

// ─── Main Component ───────────────────────────────────────────────────────────
const TherapistFinder = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const therapistMarkersRef = useRef([]);

  const [specialty, setSpecialty] = useState("All");
  const [mode, setMode] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [locStatus, setLocStatus] = useState("idle"); // idle | loading | done | error
  const [locError, setLocError] = useState("");
  const [therapists, setTherapists] = useState([]);
  const [userCoords, setUserCoords] = useState(null);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [searching, setSearching] = useState(false);

  // ── Initialize map once
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629], // India center
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Clear therapist markers helper
  const clearTherapistMarkers = () => {
    therapistMarkersRef.current.forEach((m) => m.remove());
    therapistMarkersRef.current = [];
  };

  // ── Drop therapist markers on map
  const plotTherapists = (list, map) => {
    clearTherapistMarkers();
    list.forEach((t) => {
      if (!t.lat || !t.lon) return;
      const marker = L.marker([t.lat, t.lon], { icon: therapistIcon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:sans-serif;min-width:180px">
            <p style="font-weight:700;margin:0 0 4px;color:#065f46">${t.name}</p>
            <p style="margin:0 0 2px;font-size:12px;color:#555;text-transform:capitalize">${t.type.replace(/_/g," ")}</p>
            ${t.addr ? `<p style="margin:0 0 2px;font-size:11px;color:#777">${t.addr}</p>` : ""}
            ${t.phone ? `<p style="margin:0 0 4px;font-size:11px"><a href="tel:${t.phone}" style="color:#10b981">${t.phone}</a></p>` : ""}
            ${t.website ? `<a href="${t.website}" target="_blank" style="font-size:11px;color:#10b981">Visit website →</a>` : ""}
          </div>`
        );
      marker.on("click", () => setSelectedTherapist(t));
      therapistMarkersRef.current.push(marker);
    });
  };

  // ── Locate Me
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      setLocStatus("error");
      return;
    }
    setLocStatus("loading");
    setLocError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setUserCoords({ lat, lon });
        setLocStatus("done");

        const map = mapRef.current;
        if (!map) return;

        // Remove old user marker
        if (userMarkerRef.current) userMarkerRef.current.remove();
        userMarkerRef.current = L.marker([lat, lon], { icon: userIcon })
          .addTo(map)
          .bindPopup("<b>You are here</b>")
          .openPopup();

        map.flyTo([lat, lon], 13, { animate: true, duration: 1.5 });

        // Fetch nearby therapists via Overpass
        try {
          const results = await fetchNearbyTherapists(lat, lon, 15);
          setTherapists(results);
          plotTherapists(results, map);
        } catch {
          // Overpass may time out — silently degrade
          setTherapists([]);
        }
      },
      (err) => {
        setLocStatus("error");
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocError("Location access denied. Please allow location in your browser settings.");
            break;
          case err.POSITION_UNAVAILABLE:
            setLocError("Location unavailable. Try searching by city instead.");
            break;
          default:
            setLocError("Could not get your location. Try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── City Search via Nominatim
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchInput + " India")}&format=json&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const map = mapRef.current;
        if (!map) return;

        map.flyTo([parseFloat(lat), parseFloat(lon)], 13, { animate: true, duration: 1.5 });

        // Search therapists near that city
        const results = await fetchNearbyTherapists(parseFloat(lat), parseFloat(lon), 15);
        setTherapists(results);
        plotTherapists(results, map);
      }
    } catch {
      // silently fail
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto page-enter">
      {/* Pulse animation */}
      <style>{`
        @keyframes pulse-loc {
          0%, 100% { box-shadow: 0 0 0 4px rgba(16,185,129,0.35), 0 2px 8px rgba(0,0,0,0.3); }
          50%       { box-shadow: 0 0 0 10px rgba(16,185,129,0.12), 0 2px 8px rgba(0,0,0,0.3); }
        }
      `}</style>

      {/* Header */}
      <div className="mb-6">
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
              Find mental health professionals near you — using your live location or city search
            </p>
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        {/* Locate Me button */}
        <button
          id="locate-me-btn"
          onClick={handleLocateMe}
          disabled={locStatus === "loading"}
          className="btn-primary flex items-center gap-2"
          style={{ padding: "10px 18px" }}
        >
          {locStatus === "loading" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Navigation size={16} />
          )}
          {locStatus === "loading" ? "Locating…" : locStatus === "done" ? "Re-locate Me" : "Use My Location"}
        </button>

        {/* City search */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[220px]">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              id="therapist-city-search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input-base pl-9"
              placeholder="Or search by city (Mumbai, Pune…)"
            />
          </div>
          <button
            type="submit"
            id="therapist-search-btn"
            className="btn-primary px-5"
            disabled={searching}
          >
            {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          </button>
        </form>
      </div>

      {/* Location error */}
      {locStatus === "error" && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}
        >
          <AlertCircle size={15} />
          {locError}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Specialty</p>
          <div className="flex gap-2 flex-wrap">
            {SPECIALTIES.map((s) => (
              <button
                key={s}
                onClick={() => setSpecialty(s)}
                id={`specialty-${s.toLowerCase()}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${specialty === s ? "gradient-bg text-white" : ""}`}
                style={specialty !== s ? { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" } : {}}
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
                id={`mode-${m.toLowerCase().replace("-","").replace(" ","")}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${mode === m ? "gradient-bg text-white" : ""}`}
                style={mode !== m ? { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" } : {}}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map + Sidebar */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Leaflet Map */}
        <div className="lg:col-span-2">
          <div
            className="rounded-2xl overflow-hidden relative"
            style={{ height: 460, border: "1px solid var(--border)" }}
          >
            <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

            {/* Legend */}
            <div
              className="absolute bottom-3 left-3 flex flex-col gap-1.5 px-3 py-2 rounded-xl text-xs"
              style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", boxShadow: "0 2px 10px rgba(0,0,0,0.12)" }}
            >
              <div className="flex items-center gap-2">
                <div style={{ width:12, height:12, borderRadius:"50%", background:"#10b981", border:"2px solid white", boxShadow:"0 0 0 2px rgba(16,185,129,0.4)" }} />
                <span style={{ color:"#333" }}>Your location</span>
              </div>
              <div className="flex items-center gap-2">
                <div style={{ width:12, height:12, borderRadius:"50% 50% 50% 0", background:"linear-gradient(135deg,#10b981,#059669)", transform:"rotate(-45deg)" }} />
                <span style={{ color:"#333" }}>Therapist / Clinic</span>
              </div>
            </div>

            {/* OSM attribution is rendered by Leaflet itself */}
          </div>

          {/* Located status */}
          {locStatus === "done" && userCoords && (
            <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <Navigation size={12} style={{ color: "#10b981" }} />
              Live location active · {therapists.length} therapists found within 15 km
            </p>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Nearby therapists list (if any) */}
          {therapists.length > 0 && (
            <div className="card p-4" style={{ maxHeight: 260, overflowY: "auto" }}>
              <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--text-primary)" }}>
                📍 Nearby ({therapists.length})
              </h3>
              <div className="space-y-2">
                {therapists.slice(0, 12).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTherapist(t);
                      mapRef.current?.flyTo([t.lat, t.lon], 16, { animate: true });
                    }}
                    className="w-full text-left p-2.5 rounded-xl transition-all"
                    style={{
                      background: selectedTherapist?.id === t.id ? "rgba(16,185,129,0.1)" : "var(--bg-secondary)",
                      border: `1px solid ${selectedTherapist?.id === t.id ? "rgba(16,185,129,0.4)" : "var(--border)"}`,
                    }}
                  >
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{t.name}</p>
                    <p className="text-xs capitalize mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {t.type.replace(/_/g, " ")}
                      {t.addr ? ` · ${t.addr}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recommended resources */}
          <div className="card p-5">
            <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              🌟 Recommended Resources
            </h3>
            <div className="space-y-3">
              {[
                { name: "iCall", url: "https://icallhelpline.org", desc: "TISS psychologists, ₹0–500/session", phone: "9152987821" },
                { name: "YourDost", url: "https://yourdost.com", desc: "Online counseling platform", phone: null },
                { name: "MindPeers", url: "https://mindpeers.co", desc: "Affordable therapy sessions", phone: null },
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
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{r.name}</p>
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
