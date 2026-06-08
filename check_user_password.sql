-- VÉRIFICATION MOT DE PASSE UTILISATEUR AVILISSAK1@GMAIL.COM
-- Exécuter ce script dans l'éditeur SQL Supabase

-- 1. Vérifier si l'utilisateur existe et afficher ses informations d'authentification
SELECT 
    'USER AUTH INFO' as info_type,
    id,
    email,
    created_at,
    updated_at,
    last_sign_in_at,
    email_confirmed_at,
    phone_confirmed_at,
    banned_until,
    is_super_admin,
    raw_user_meta_data,
    -- Note: Supabase ne stocke pas le mot de passe en clair, seulement le hash
    'Password hashé (non visible)' as password_status
FROM auth.users 
WHERE email = 'avilissak1@gmail.com';

-- 2. Vérifier les métadonnées de l'utilisateur qui peuvent contenir des infos de password
SELECT 
    'USER METADATA' as info_type,
    id,
    email,
    raw_user_meta_data,
    -- Extraire les métadonnées en format JSON pour inspection
    CASE 
        WHEN raw_user_meta_data IS NOT NULL THEN 
            'Métadonnées présentes - vérifier ci-dessous'
        ELSE 
            'Pas de métadonnées'
    END as metadata_status
FROM auth.users 
WHERE email = 'avilissak1@gmail.com';

-- 3. Vérifier s'il y a des enregistrements dans auth.identities (liés aux providers externes)
SELECT 
    'AUTH IDENTITIES' as info_type,
    id,
    user_id,
    provider,
    identity_data,
    created_at,
    updated_at,
    last_sign_in_at
FROM auth.identities 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'avilissak1@gmail.com'
);

-- 4. Diagnostic complet du problème de mot de passe
DO $$
DECLARE
    user_exists BOOLEAN;
    target_user_id UUID;
    email_confirmed BOOLEAN;
    is_banned BOOLEAN;
    last_signin TIMESTAMP;
BEGIN
    -- Vérifier si l'utilisateur existe
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE email = 'avilissak1@gmail.com'
    ) INTO user_exists;
    
    IF user_exists THEN
        SELECT id INTO target_user_id FROM auth.users WHERE email = 'avilissak1@gmail.com';
        SELECT email_confirmed_at IS NOT NULL INTO email_confirmed FROM auth.users WHERE email = 'avilissak1@gmail.com';
        SELECT banned_until IS NOT NULL AND banned_until > NOW() INTO is_banned FROM auth.users WHERE email = 'avilissak1@gmail.com';
        SELECT last_sign_in_at INTO last_signin FROM auth.users WHERE email = 'avilissak1@gmail.com';
        
        RAISE NOTICE '✅ Utilisateur avilissak1@gmail.com existe';
        RAISE NOTICE '🆔 User ID: %', target_user_id;
        RAISE NOTICE '📧 Email confirmé: %', CASE WHEN email_confirmed THEN 'OUI' ELSE 'NON' END;
        RAISE NOTICE '🚫 Compte bloqué: %', CASE WHEN is_banned THEN 'OUI' ELSE 'NON' END;
        RAISE NOTICE '📅 Dernière connexion: %', COALESCE(last_signin::TEXT, 'Jamais');
        
        -- Analyse du problème de mot de passe
        IF NOT email_confirmed THEN
            RAISE NOTICE '⚠️ PROBLÈME: Email non confirmé - peut bloquer le login';
        END IF;
        
        IF is_banned THEN
            RAISE NOTICE '❌ PROBLÈME: Compte bloqué - login impossible';
        END IF;
        
        IF email_confirmed AND NOT is_banned THEN
            RAISE NOTICE '🔍 ANALYSE: Si login échoue avec "Mot de passe incorrect":';
            RAISE NOTICE '   1. Le mot de passe "AvilissAk770!!" est incorrect';
            RAISE NOTICE '   2. Le mot de passe a été changé';
            RAISE NOTICE '   3. Problème de hash de mot de passe';
            RAISE NOTICE '   4. Solution: Réinitialiser le mot de passe';
        END IF;
        
        -- Vérifier les providers d'authentification
        DECLARE
            provider_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO provider_count 
            FROM auth.identities 
            WHERE user_id = target_user_id;
            
            RAISE NOTICE '🔐 Providers d''authentification: %', provider_count;
            
            IF provider_count = 0 THEN
                RAISE NOTICE '⚠️ Aucun provider d''authentification trouvé';
            ELSE
                -- Afficher les providers
                DECLARE
                    provider_record RECORD;
                BEGIN
                    FOR provider_record IN (
                        SELECT provider, identity_data 
                        FROM auth.identities 
                        WHERE user_id = target_user_id
                    ) LOOP
                        RAISE NOTICE '📱 Provider: % | Data: %', provider_record.provider, provider_record.identity_data::TEXT;
                    END LOOP;
                END;
            END IF;
        END;
        
    ELSE
        RAISE NOTICE '❌ Utilisateur avilissak1@gmail.com N''EXISTE PAS';
        RAISE NOTICE '🔧 Solution: Créer le compte avec signUp';
    END IF;
END $$;

-- 5. Afficher la structure complète de auth.users pour référence
SELECT 
    'AUTH USERS STRUCTURE' as info_type,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'auth'
ORDER BY ordinal_position;

-- 6. Résumé final
SELECT 
    'PASSWORD DIAGNOSTIC COMPLETE' as status,
    now() as timestamp,
    'Vérifier les logs ci-dessus pour le diagnostic complet' as next_step;
