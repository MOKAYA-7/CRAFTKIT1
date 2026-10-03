const SUPABASE_URL = "https://ylqlqfezkxvgmrnsftim.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Y75FGOGEQjtesLFX_EgJBg_0m5ASIQt";

const isSupabaseConfigured = Boolean(
  window.supabase &&
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("YOUR_PROJECT_ID") &&
  SUPABASE_PUBLISHABLE_KEY &&
  !SUPABASE_PUBLISHABLE_KEY.includes("YOUR_SUPABASE_")
);

const supabaseClient = isSupabaseConfigured
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
    })
  : null;

function requireSupabase() {
  if (!supabaseClient) {
    throw new Error("Supabase is not configured yet. Add your project URL and publishable key in supabase-config.js.");
  }
  return supabaseClient;
}
