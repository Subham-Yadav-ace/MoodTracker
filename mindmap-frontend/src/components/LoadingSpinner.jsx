const LoadingSpinner = ({ fullPage = false, size = "md", message }) => {
  const sizes = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
  };

  const spinner = (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`${sizes[size]} rounded-full border-indigo-500/30 border-t-indigo-500 animate-spin`}
        style={{ borderWidth: size === "lg" ? "3px" : "2px" }}
      />
      {message && (
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {message}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="flex flex-col items-center gap-6">
          {/* Brain icon / logo */}
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center gradient-bg animate-pulse-glow"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
                  fill="white"
                  opacity="0.9"
                />
              </svg>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin"
            />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {message || "Loading MindMap..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
