-- VÉRIFICATION MOT DE PASSE UTILISATEUR AVILISSAK1@GMAIL.COM (VERSION SIMPLE)
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
    'Password hashé (non visible)' as password_status
FROM auth.users 
WHERE email = 'avilissak1@gmail.com';

-- 2. Vérifier les métadonnées de l'utilisateur
SELECT 
    'USER METADATA' as info_type,
    id,
    email,
    raw_user_meta_data,
    CASE 
        WHEN raw_user_meta_data IS NOT NULL THEN 
            'Métadonnées présentes'
        ELSE 
            'Pas de métadonnées'
    END as metadata_status
FROM auth.users 
WHERE email = 'avilissak1@gmail.com';

-- 3. Vérifier s'il y a des enregistrements dans auth.identities
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

-- 4. Compter les providers d'authentification
SELECT 
    'PROVIDERS COUNT' as info_type,
    COUNT(*) as provider_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'Aucun provider trouvé'
        ELSE 'Providers trouvés'
    END as provider_status
FROM auth.identities 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'avilissak1@gmail.com'
);

-- 5. Diagnostic simple de l'état du compte
SELECT 
    'ACCOUNT STATUS' as info_type,
    id,
    email,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Email confirmé: OUI'
        ELSE 'Email confirmé: NON'
    END as email_status,
    CASE 
        WHEN banned_until IS NOT NULL AND banned_until > NOW() THEN 'Compte bloqué: OUI'
        ELSE 'Compte bloqué: NON'
    END as banned_status,
    CASE 
        WHEN last_sign_in_at IS NOT NULL THEN 'Dernière connexion: ' || last_sign_in_at::TEXT
        ELSE 'Dernière connexion: Jamais'
    END as last_login_status,
    CASE 
        WHEN email_confirmed_at IS NOT NULL AND (banned_until IS NULL OR banned_until <= NOW()) THEN 'Compte prêt pour login'
        ELSE 'Problème de login probable'
    END as login_readiness
FROM auth.users 
WHERE email = 'avilissak1@gmail.com';

-- 6. Afficher la structure de auth.users pour référence
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

-- 7. Résumé final
SELECT 
    'DIAGNOSTIC COMPLETE' as status,
    now() as timestamp,
    'Analyser les résultats ci-dessus pour identifier le problème de login' as next_step;
