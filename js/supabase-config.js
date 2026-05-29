/**
 * Configuração Supabase
 * Basta colocar sua URL e ANON KEY aqui.
 */

const SUPABASE_URL = "https://qvacbqiiosfiohycpiwz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nIegbkIKLTaYM3feW2baIg_oGkMSrN0";

let supabaseClient = null;

// Tenta criar o cliente Supabase se a lib foi carregada
if (typeof window.supabase !== "undefined") {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("[Supabase] Cliente inicializado com sucesso");
  } catch (error) {
    console.error("[Supabase] Erro ao criar cliente:", error);
    supabaseClient = null;
  }
} else {
  console.warn("[Supabase] Biblioteca Supabase não carregada. App funcionará em modo offline.");
}

function isSupabaseConfigured() {
  return (
    supabaseClient !== null &&
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes("YOUR_SUPABASE_PROJECT") &&
    !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY")
  );
}

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured()) {
    console.warn(
      "[Supabase] Supabase não está configurado ou não foi carregado. App funcionará em modo offline."
    );
  }
}
