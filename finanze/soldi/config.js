/* Configurazione di Supabase per "Soldi".
 *
 * Incolla qui l'URL del progetto e la chiave "anon" (Supabase → Project
 * Settings → API). La chiave anon è fatta per stare in una pagina pubblica: a
 * proteggere i dati è la Row Level Security di supabase/schema.sql, che lascia
 * a ogni utente solo le sue righe.
 *
 * MAI la chiave "service_role" qui dentro: scavalca la Row Level Security.
 *
 * Con i due campi vuoti l'app funziona lo stesso, ma salva solo sul
 * dispositivo (come la vecchia versione fuori da claude.ai).
 */
window.SOLDI_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
};
