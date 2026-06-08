import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// DEBUG TEMPORAIRE - Afficher la configuration Supabase
console.log('=== CONFIGURATION SUPABASE ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);
console.log('Supabase Key length:', supabaseKey?.length);
console.log('Environment:', import.meta.env.MODE);

// Validation silencieuse des variables d'environnement
if (!supabaseUrl || !supabaseKey) {
  console.error('Variables Supabase manquantes. Vérifiez votre fichier .env');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'EXISTS' : 'MISSING');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)
