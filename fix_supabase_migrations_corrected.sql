-- DIAGNOSTIC ET CORRECTION DES MIGRATIONS SUPABASE (SYNTAXE CORRIGÉE)
-- Exécuter ce script dans l'éditeur SQL Supabase

-- 1. Vérifier si le schéma supabase_migrations existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_namespace 
        WHERE nspname = 'supabase_migrations'
    ) THEN
        RAISE NOTICE '✅ Schéma supabase_migrations existe';
    ELSE
        RAISE NOTICE '❌ Schéma supabase_migrations n''existe PAS';
    END IF;
END $$;

-- 2. Vérifier si la table schema_migrations existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'supabase_migrations' 
        AND tablename = 'schema_migrations'
    ) THEN
        RAISE NOTICE '✅ Table schema_migrations existe';
    ELSE
        RAISE NOTICE '❌ Table schema_migrations n''existe PAS';
    END IF;
END $$;

-- 3. Créer le schéma et la table de migrations s'ils n'existent pas
DO $$
BEGIN
    -- Créer le schéma s'il n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM pg_namespace 
        WHERE nspname = 'supabase_migrations'
    ) THEN
        EXECUTE 'CREATE SCHEMA supabase_migrations';
        RAISE NOTICE '✅ Schéma supabase_migrations créé';
    END IF;
    
    -- Créer la table s'elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'supabase_migrations' 
        AND tablename = 'schema_migrations'
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
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'supabase_migrations' 
ORDER BY tablename;

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
