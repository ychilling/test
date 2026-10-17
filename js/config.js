window.AppConfig = (() => {
  const cfg = window.RUNTIME_CONFIG || {};
  const url = String(cfg.SUPABASE_URL || "").trim();
  const key = String(cfg.SUPABASE_PUBLISHABLE_KEY || "").trim();
  const configured = url.startsWith("https://") && !url.includes("YOUR_SUPABASE") && key.length > 20 && !key.includes("YOUR_SUPABASE");
  return {
    supabaseUrl: url,
    supabaseKey: key,
    isSupabaseConfigured: configured,
    previewMode: document.documentElement.dataset.mode === "preview"
  };
})();
