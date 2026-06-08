-- DIAGNOSTIC ET CORRECTION DES MIGRATIONS SUPABASE
-- Exécuter ce script dans l'éditeur SQL Supabase

-- 1. Vérifier si le schéma supabase_migrations existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.schemata 
            WHERE schema_name = 'supabase_migrations'
        ) THEN '✅ Schéma supabase_migrations existe'
        ELSE '❌ Schéma supabase_migrations n''existe PAS'
    END as schema_status;

-- 2. Vérifier si la table schema_migrations existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'supabase_migrations' 
            AND table_name = 'schema_migrations'
        ) THEN '✅ Table schema_migrations existe'
        ELSE '❌ Table schema_migrations n''existe PAS'
    END as table_status;

-- 3. Créer le schéma et la table de migrations s'ils n'existent pas
DO $$
BEGIN
    -- Créer le schéma s'il n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = 'supabase_migrations'
    ) THEN
        EXECUTE 'CREATE SCHEMA supabase_migrations';
        RAISE NOTICE '✅ Schéma supabase_migrations créé';
    END IF;
    
    -- Créer la table s'elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'supabase_migrations' 
        AND table_name = 'schema_migrations'
    ) THEN
        EXECUTE '
            CREATE TABLE supabase_migrations.schema_migrations (
                version TEXT PRIMARY KEY,
                inserted_at TIMESTAMPTZ DEFAULT NOW()
            )';
        RAISE NOTICE '✅ Table schema_migrations créée';
    END IF;
END $$;

-- 4. Vérifier l'état final
SELECT 
    'VÉRIFICATION FINALE' as status,
    schema_name,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'supabase_migrations' 
ORDER BY table_name;

-- 5. Insérer une migration initiale si la table est vide
DO $$
BEGIN
    DECLARE
        migration_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO migration_count 
        FROM supabase_migrations.schema_migrations;
        
        IF migration_count = 0 THEN
            INSERT INTO supabase_migrations.schema_migrations (version) 
            VALUES ('20240101000000_initial_setup');
            RAISE NOTICE '✅ Migration initiale insérée';
        ELSE
            RAISE NOTICE 'ℹ️ Table de migrations contient déjà % enregistrements', migration_count;
        END IF;
    END;
END $$;

-- 6. Afficher toutes les migrations actuelles
SELECT 
    version,
    inserted_at
FROM supabase_migrations.schema_migrations 
ORDER BY inserted_at;

-- 7. Résumé final
SELECT 
    'MIGRATIONS SUPABASE CORRIGÉES' as status,
    now() as completion_time,
    'Prêt pour l''authentification' as next_step;
