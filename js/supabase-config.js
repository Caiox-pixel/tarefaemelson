/**
 * Configuração Supabase
 * Basta colocar sua URL e ANON KEY aqui.
 */

const SUPABASE_URL = "https://qvacbqiiosfiohycpiwz.supabase.co";
const SUPABASE_ANON_KEY = "sb_secret_iNS4ysICUEvUd5XmLpe4bA_qSGSZhmw";

const supabaseClient = supabase.createClient(https://qvacbqiiosfiohycpiwz.supabase.co, sb_secret_iNS4ysICUEvUd5XmLpe4bA_qSGSZhmw);

function isSupabaseConfigured() {
  return (
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes("YOUR_SUPABASE_PROJECT") &&
    !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY")
  );
}

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase não está configurado. Defina SUPABASE_URL e SUPABASE_ANON_KEY em js/supabase-config.js"
    );
  }
}
