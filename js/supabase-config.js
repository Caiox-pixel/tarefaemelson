/**
 * Configuração Supabase
 * Basta colocar sua URL e ANON KEY aqui.
 */

const SUPABASE_URL = "https://qvacbqiiosfiohycpiwz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nIegbkIKLTaYM3feW2baIg_oGkMSrN0";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function isSupabaseConfigured() {
  return (
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes("https://qvacbqiiosfiohycpiwz.supabase.co") &&
    !SUPABASE_ANON_KEY.includes("sb_publishable_nIegbkIKLTaYM3feW2baIg_oGkMSrN0")
  );
}

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase não está configurado. Defina SUPABASE_URL e SUPABASE_ANON_KEY em js/supabase-config.js"
    );
  }
}
