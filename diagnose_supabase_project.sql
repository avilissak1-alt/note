-- DIAGNOSTIC COMPLET DU PROJET SUPABASE
-- Exécuter ce script dans l'éditeur SQL Supabase pour identifier le problème

-- 1. Vérifier que nous sommes sur le bon projet
SELECT 
    'Project Info' as info_type,
    current_database as database_name,
    version() as postgres_version,
    now() as current_time;

-- 2. Lister toutes les tables dans le schéma public
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 3. Vérifier si la table students existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'students'
        ) THEN '✅ Table students existe'
        ELSE '❌ Table students n''existe PAS'
    END as students_table_status;

-- 4. Si students existe, afficher ses colonnes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'students'
    ) THEN
        RAISE NOTICE '=== COLONNES DE LA TABLE STUDENTS ===';
        FOR col_info IN 
            SELECT 
                column_name, 
                data_type, 
                is_nullable, 
                column_default
            FROM information_schema.columns 
            WHERE table_name = 'students' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Colonne: % | Type: % | Nullable: % | Default: %', 
                col_info.column_name, 
                col_info.data_type, 
                col_info.is_nullable, 
                col_info.column_default;
        END LOOP;
    ELSE
        RAISE NOTICE '❌ La table students n''existe pas - impossible d''afficher les colonnes';
    END IF;
END $$;

-- 5. Vérifier si la table grades existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'grades'
        ) THEN '✅ Table grades existe'
        ELSE '❌ Table grades n''existe PAS'
    END as grades_table_status;

-- 6. Si grades existe, afficher ses colonnes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'grades'
    ) THEN
        RAISE NOTICE '=== COLONNES DE LA TABLE GRADES ===';
        FOR col_info IN 
            SELECT 
                column_name, 
                data_type, 
                is_nullable, 
                column_default
            FROM information_schema.columns 
            WHERE table_name = 'grades' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Colonne: % | Type: % | Nullable: % | Default: %', 
                col_info.column_name, 
                col_info.data_type, 
                col_info.is_nullable, 
                col_info.column_default;
        END LOOP;
    ELSE
        RAISE NOTICE '❌ La table grades n''existe pas - impossible d''afficher les colonnes';
    END IF;
END $$;

-- 7. Tester une insertion simple pour voir l'erreur exacte
DO $$
BEGIN
    -- Tenter d'insérer un test pour voir l'erreur exacte
    INSERT INTO students (user_id, name) 
    VALUES (gen_random_uuid(), 'Test Student');
    
    RAISE NOTICE '✅ Insertion test réussie - la structure est correcte';
    
    -- Supprimer le test
    DELETE FROM students WHERE name = 'Test Student';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ERREUR LORS DE L''INSERTION TEST: %', SQLERRM;
    RAISE NOTICE 'Code d''erreur: %', SQLSTATE;
END $$;

-- 8. Vérifier les politiques RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('students', 'grades')
ORDER BY tablename, policyname;

-- 9. Vérifier si RLS est activé
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('students', 'grades');

-- 10. Résumé final
SELECT 
    'DIAGNOSTIC COMPLETE' as status,
    now() as completion_time;
