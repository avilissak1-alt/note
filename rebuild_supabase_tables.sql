-- SCRIPT DE RECONSTRUCTION PROPRE DES TABLES SUPABASE
-- Exécuter dans Supabase → SQL Editor

-- 1. Supprimer complètement les anciennes tables cassées
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- 2. Recréer proprement la table students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Recréer proprement la table grades
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  week_id TEXT NOT NULL,
  value NUMERIC NOT NULL CHECK (value >= 0 AND value <= 100),
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, student_id, subject, week_id)
);

-- 4. Vérifier que les tables existent et sont vides
SELECT 'students' as table_name, COUNT(*) as row_count FROM students
UNION ALL
SELECT 'grades' as table_name, COUNT(*) as row_count FROM grades;

-- 5. Afficher la structure des tables pour vérification
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name IN ('students', 'grades')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
