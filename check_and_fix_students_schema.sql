-- Vérifier et corriger le schéma de la table students
-- Exécuter ce script dans l'éditeur SQL Supabase

-- 1. Vérifier les colonnes actuelles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Si la table n'existe pas ou n'a pas la bonne structure, la recréer
DROP TABLE IF EXISTS students CASCADE;

-- 3. Créer la table students avec le bon schéma
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 4. Activer RLS (Row Level Security)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- 5. Créer les politiques RLS pour que chaque utilisateur ne voie que ses élèves
CREATE POLICY "Users can view their own students" ON students
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own students" ON students
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own students" ON students
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own students" ON students
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Vérifier que la table est correctement créée
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Test d'insertion (optionnel - commenter si déjà des données existent)
-- INSERT INTO students (user_id, name) VALUES 
--   (auth.uid(), 'Test Student');
