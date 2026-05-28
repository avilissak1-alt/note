-- SCRIPT DE VÉRIFICATION ET RÉPARATION DES TABLES SUPABASE
-- Exécuter dans Supabase → SQL Editor

-- 1. Vérifier les tables existantes
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('students', 'grades')
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 2. Vérifier les contraintes foreign key
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('students', 'grades');

-- 3. Vérifier les contraintes unique
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc
WHERE tc.table_name IN ('students', 'grades')
    AND tc.constraint_type = 'UNIQUE';

-- 4. Si les tables n'existent pas ou sont cassées, les recréer proprement
-- Décommenter ces lignes si nécessaire

-- DROP TABLE IF EXISTS grades CASCADE;
-- DROP TABLE IF EXISTS students CASCADE;

-- CREATE TABLE students (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID NOT NULL,
--   name TEXT NOT NULL,
--   created_at TIMESTAMP DEFAULT NOW()
-- );

-- CREATE TABLE grades (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID NOT NULL,
--   student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
--   subject TEXT NOT NULL,
--   week_id TEXT NOT NULL,
--   value NUMERIC NOT NULL CHECK (value >= 0 AND value <= 100),
--   created_at TIMESTAMP DEFAULT NOW(),
--   UNIQUE(user_id, student_id, subject, week_id)
-- );

-- 5. Test d'insertion pour vérifier la structure
-- Décommenter pour tester

-- INSERT INTO students (user_id, name) 
-- VALUES ('test-user-id', 'Élève Test')
-- RETURNING *;

-- INSERT INTO grades (user_id, student_id, subject, week_id, value)
-- VALUES ('test-user-id', (SELECT id FROM students WHERE name = 'Élève Test' LIMIT 1), 'test-subject', 'week1', 85.5)
-- RETURNING *;

-- 6. Nettoyer les données de test
-- Décommenter pour nettoyer

-- DELETE FROM grades WHERE user_id = 'test-user-id';
-- DELETE FROM students WHERE user_id = 'test-user-id';
