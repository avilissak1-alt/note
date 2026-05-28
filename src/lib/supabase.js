import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validation silencieuse des variables d'environnement
if (!supabaseUrl || !supabaseKey) {
  console.error('Variables Supabase manquantes. Vérifiez votre fichier .env')
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)
