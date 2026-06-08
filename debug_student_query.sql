-- DEBUG SUPABASE EMPTY RESULT - ANALYSE REQUÊTE STUDENT BY ID
-- Pour identifier pourquoi les requêtes retournent des résultats vides

-- 1. Structure complète de la table students
SELECT 
    'STUDENTS TABLE STRUCTURE' as analysis_type,
    table_schema,
    table_name,
    column_name,
    ordinal_position,
    column_default,
    is_nullable,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'students' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Contraintes de la table students
SELECT 
    'STUDENTS CONSTRAINTS' as analysis_type,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = ccu.table_schema
WHERE tc.table_name = 'students' 
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_type;

-- 3. Données d'exemple dans students
SELECT 
    'STUDENTS SAMPLE DATA' as analysis_type,
    *
FROM students 
LIMIT 5;

-- 4. Vérifier les RLS policies sur students
SELECT 
    'STUDENTS RLS POLICIES' as analysis_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'students';

-- 5. Test de la requête exacte utilisée dans le code
-- Simuler: studentsService.getAll(userId)
SELECT 
    'TEST QUERY studentsService.getAll' as analysis_type,
    COUNT(*) as total_results,
    ARRAY_AGG(id ORDER BY created_at) as student_ids,
    ARRAY_AGG(name ORDER BY created_at) as student_names
FROM students 
WHERE user_id = 'YOUR_USER_ID_HERE'  -- À remplacer avec un vrai user_id
ORDER BY created_at ASC;

-- 6. Test avec un user_id spécifique (si connu)
-- Remplacer 'votre-user-id-ici' par un vrai UUID
SELECT 
    'TEST SPECIFIC USER_ID' as analysis_type,
    id,
    name,
    user_id,
    created_at,
    updated_at
FROM students 
WHERE user_id = 'votre-user-id-ici'
ORDER BY created_at;

-- 7. Vérifier s'il y a des students sans user_id
SELECT 
    'STUDENTS WITHOUT USER_ID' as analysis_type,
    COUNT(*) as count,
    'PROBLÈME: Students sans user_id' as issue
FROM students 
WHERE user_id IS NULL OR user_id = '';

-- 8. Vérifier les user_ids existants dans students
SELECT 
    'EXISTING USER_IDS IN STUDENTS' as analysis_type,
    user_id,
    COUNT(*) as student_count,
    ARRAY_AGG(name ORDER BY created_at) as student_names
FROM students 
WHERE user_id IS NOT NULL AND user_id != ''
GROUP BY user_id
ORDER BY student_count DESC;

-- 9. Vérifier la colonne 'name' vs 'first_name'/'last_name'
SELECT 
    'NAME COLUMNS ANALYSIS' as analysis_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'students' 
    AND table_schema = 'public'
    AND (
        column_name ILIKE '%name%'
        OR column_name ILIKE '%first%'
        OR column_name ILIKE '%last%'
    )
ORDER BY column_name;

-- 10. Test de la requête avec différents formats de nom
SELECT 
    'TEST DIFFERENT NAME FORMATS' as analysis_type,
    'Format attendu: name (first_name + last_name)' as expected_format,
    'Format alternatif: first_name, last_name séparés' as alternative_format
FROM students 
LIMIT 1;

-- 11. Vérifier si les IDs sont des UUID valides
SELECT 
    'UUID VALIDATION' as analysis_type,
    id,
    CASE 
        WHEN id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN '✅ UUID valide'
        ELSE '❌ UUID invalide'
    END as uuid_validity,
    LENGTH(id) as id_length
FROM students 
ORDER BY created_at DESC
LIMIT 5;

-- 12. Résumé des problèmes potentiels
SELECT 
    'POTENTIAL ISSUES SUMMARY' as analysis_type,
    'Vérifier RLS policies' as check1,
    'Vérifier user_id format' as check2,
    'Vérifier colonne name vs first_name/last_name' as check3,
    'Vérifier UUID validity' as check4,
    'Vérifier table permissions' as check5;

-- 13. Test de permission direct
-- Cette requête peut échouer si l'utilisateur n'a pas les permissions
SELECT 
    'PERMISSION TEST' as analysis_type,
    current_user as current_db_user,
    has_table_privilege('public', 'students', 'SELECT') as can_select,
    has_table_privilege('public', 'students', 'INSERT') as can_insert,
    has_table_privilege('public', 'students', 'UPDATE') as can_update,
    has_table_privilege('public', 'students', 'DELETE') as can_delete;
