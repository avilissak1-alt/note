-- Vérifier la structure réelle de la table grades
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'grades' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier quelques exemples de données pour voir la structure
SELECT * FROM grades LIMIT 5;

-- Vérifier les contraintes de la table
SELECT 
    constraint_name,
    constraint_type,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'grades' 
    AND tc.table_schema = 'public';
