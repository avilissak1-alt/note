-- CONFIGURATION RLS SUPABASE - STUDENTS & GRADES
-- Exécuter ce script dans l'éditeur SQL Supabase

-- =====================================================
-- 1. ACTIVATION RLS SUR LES TABLES
-- =====================================================

-- Activer RLS sur la table students
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur la table grades  
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. SUPPRESSION DES ANCIENNES POLICIES (si elles existent)
-- =====================================================

-- Supprimer les anciennes policies pour students
DROP POLICY IF EXISTS "Users can view own students" ON students;
DROP POLICY IF EXISTS "Users can insert own students" ON students;
DROP POLICY IF EXISTS "Users can update own students" ON students;
DROP POLICY IF EXISTS "Users can delete own students" ON students;

-- Supprimer les anciennes policies pour grades
DROP POLICY IF EXISTS "Users can view own grades" ON grades;
DROP POLICY IF EXISTS "Users can insert own grades" ON grades;
DROP POLICY IF EXISTS "Users can update own grades" ON grades;
DROP POLICY IF EXISTS "Users can delete own grades" ON grades;

-- =====================================================
-- 3. POLICIES RLS POUR STUDENTS
-- =====================================================

-- Policy SELECT : Un utilisateur peut voir uniquement ses élèves
CREATE POLICY "Users can view own students" ON students
    FOR SELECT USING (auth.uid() = user_id);

-- Policy INSERT : Un utilisateur peut insérer ses propres élèves
-- Le user_id sera automatiquement défini par le trigger
CREATE POLICY "Users can insert own students" ON students
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy UPDATE : Un utilisateur peut modifier uniquement ses élèves
CREATE POLICY "Users can update own students" ON students
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy DELETE : Un utilisateur peut supprimer uniquement ses élèves
CREATE POLICY "Users can delete own students" ON students
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 4. POLICIES RLS POUR GRADES
-- =====================================================

-- Policy SELECT : Un utilisateur peut voir uniquement ses notes
CREATE POLICY "Users can view own grades" ON grades
    FOR SELECT USING (auth.uid() = user_id);

-- Policy INSERT : Un utilisateur peut insérer ses propres notes
CREATE POLICY "Users can insert own grades" ON grades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy UPDATE : Un utilisateur peut modifier uniquement ses notes
CREATE POLICY "Users can update own grades" ON grades
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy DELETE : Un utilisateur peut supprimer uniquement ses notes
CREATE POLICY "Users can delete own grades" ON grades
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 5. TRIGGER POUR USER_ID AUTOMATIQUE SUR STUDENTS
-- =====================================================

-- Supprimer le trigger s'il existe
DROP TRIGGER IF EXISTS set_user_id_on_students_insert ON students;
DROP FUNCTION IF EXISTS set_user_id();

-- Créer la fonction pour définir automatiquement user_id
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Définir user_id automatiquement avec l'ID de l'utilisateur connecté
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger qui s'exécute avant chaque INSERT sur students
CREATE TRIGGER set_user_id_on_students_insert
    BEFORE INSERT ON students
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

-- =====================================================
-- 6. TRIGGER POUR USER_ID AUTOMATIQUE SUR GRADES
-- =====================================================

-- Supprimer le trigger s'il existe
DROP TRIGGER IF EXISTS set_user_id_on_grades_insert ON grades;

-- Créer le trigger qui s'exécute avant chaque INSERT sur grades
CREATE TRIGGER set_user_id_on_grades_insert
    BEFORE INSERT ON grades
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

-- =====================================================
-- 7. VÉRIFICATION DE LA CONFIGURATION
-- =====================================================

-- Vérifier que RLS est activé
SELECT 
    'RLS STATUS' as info_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('students', 'grades')
ORDER BY tablename;

-- Vérifier les policies créées
SELECT 
    'POLICIES CREATED' as info_type,
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

-- Vérifier les triggers créés
SELECT 
    'TRIGGERS CREATED' as info_type,
    event_object_table as table_name,
    trigger_name,
    event_manipulation as event,
    action_timing as timing,
    action_condition as condition
FROM information_schema.triggers 
WHERE event_object_table IN ('students', 'grades')
ORDER BY table_name, trigger_name;

-- =====================================================
-- 8. RÉSUMÉ FINAL
-- =====================================================

SELECT 
    'SETUP COMPLETE' as status,
    now() as completion_time,
    'RLS policies configured for students and grades' as result,
    'Users can now manage their own data only' as security_level,
    'Test adding a student - should work now!' as next_step;
