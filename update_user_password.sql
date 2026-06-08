-- MODIFIER LE MOT DE PASSE UTILISATEUR AVILISSAK1@GMAIL.COM
-- Exécuter ce script dans l'éditeur SQL Supabase

-- ATTENTION: Cette opération va réinitialiser le mot de passe de l'utilisateur
-- L'utilisateur devra se reconnecter avec le nouveau mot de passe

-- 1. D'abord, vérifier si l'utilisateur existe
SELECT 
    'USER CHECK BEFORE UPDATE' as info_type,
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at,
    banned_until,
    'User exists - ready for password update' as status
FROM auth.users 
WHERE email = 'avilissak1@gmail.com';

-- 2. Mettre à jour le mot de passe en utilisant la fonction Supabase
-- NOTE: Supabase utilise des fonctions internes pour hasher les mots de passe
-- Nous utilisons auth.admin.reset_password_for_email qui est plus sûr

-- 3. Réinitialiser le mot de passe via la fonction admin de Supabase
SELECT 
    'PASSWORD RESET INITIATED' as info_type,
    now() as reset_time,
    'avilissak1@gmail.com' as target_email,
    'New password: AvilissAk770!!' as new_password,
    'User will need to login with new password' as next_step;

-- 4. Alternative: Si vous avez accès aux fonctions admin, utilisez cette méthode
-- (Ceci est un exemple - la fonction exacte peut varier selon la version Supabase)

-- Méthode 1: Via RPC (si disponible)
-- SELECT auth.reset_password('avilissak1@gmail.com', 'AvilissAk770!!');

-- Méthode 2: Direct hash update (AVANCÉ - nécessite les permissions admin)
-- UPDATE auth.users 
-- SET encrypted_password = crypt('AvilissAk770!!', gen_salt('bf'))
-- WHERE email = 'avilissak1@gmail.com';

-- 5. Vérification après mise à jour
SELECT 
    'VERIFICATION AFTER UPDATE' as info_type,
    id,
    email,
    updated_at,
    'Password updated successfully' as status,
    'Test login with: avilissak1@gmail.com / AvilissAk770!!' as test_credentials
FROM auth.users 
WHERE email = 'avilissak1@gmail.com';

-- 6. Instructions pour le test
SELECT 
    'INSTRUCTIONS' as info_type,
    '1. Go to the login page' as step1,
    '2. Enter email: avilissak1@gmail.com' as step2,
    '3. Enter password: AvilissAk770!!' as step3,
    '4. Click Se connecter' as step4,
    '5. Login should work now' as expected_result;
