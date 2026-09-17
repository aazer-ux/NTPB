import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables d\'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY manquantes. ' +
    'Créez un fichier .env à la racine (voir .env.example).'
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);