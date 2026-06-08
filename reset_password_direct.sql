-- RÉINITIALISATION DIRECTE DU MOT DE PASSE - AVILISSAK1@GMAIL.COM
-- Exécuter ce script dans l'éditeur SQL Supabase

-- 1. Vérifier l'existence de l'utilisateur
SELECT 
    'USER EXISTS CHECK' as step,
    id,
    email,
    created_at,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Email confirmed'
        ELSE 'Email NOT confirmed'
    END as email_status
FROM auth.users 
WHERE email = 'avilissak1@gmail.com';

-- 2. Méthode directe : Mise à jour du hash du mot de passe
-- NOTE: Ceci utilise crypt() avec bcrypt pour générer un hash valide

UPDATE auth.users 
SET 
    encrypted_password = crypt('AvilissAk770!!', gen_salt('bf')),
    updated_at = now()
WHERE email = 'avilissak1@gmail.com';

-- 3. Vérifier que la mise à jour a fonctionné
SELECT 
    'PASSWORD UPDATE VERIFICATION' as step,
    id,
    email,
    updated_at,
    'Password hash updated with bcrypt' as status,
    'New password: AvilissAk770!!' as new_password_info
FROM auth.users 
WHERE email = 'avilissak1@gmail.com';

-- 4. Confirmer que le hash a été généré
SELECT 
    'HASH VERIFICATION' as step,
    email,
    LENGTH(encrypted_password) as hash_length,
    CASE 
        WHEN LENGTH(encrypted_password) > 50 THEN 'Hash looks valid (bcrypt)'
        ELSE 'Hash may be invalid'
    END as hash_status,
    updated_at
FROM auth.users 
WHERE email = 'avilissak1@gmail.com';

-- 5. Instructions de test
SELECT 
    'TEST INSTRUCTIONS' as step,
    '1. Go to login page' as instruction1,
    '2. Email: avilissak1@gmail.com' as instruction2,
    '3. Password: AvilissAk770!!' as instruction3,
    '4. Click "Se connecter"' as instruction4,
    'Should work now!' as expected_result;
