-- Script SQL pour ajouter la contrainte unique sur la table grades
-- À exécuter dans le SQL Editor de Supabase

-- Étape 1 : Supprimer les doublons potentiels avant de créer la contrainte
DELETE FROM grades 
WHERE ctid NOT IN (
    SELECT max(ctid)
    FROM grades
    GROUP BY user_id, student_id, subject
);

-- Étape 2 : Ajouter la contrainte unique
ALTER TABLE grades 
ADD CONSTRAINT grades_user_student_subject_unique 
UNIQUE (user_id, student_id, subject);

-- Étape 3 : Vérifier que la contrainte a été créée
SELECT 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'grades'
    AND tc.constraint_type = 'UNIQUE';
