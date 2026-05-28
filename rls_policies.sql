-- Activer Row Level Security (RLS) sur les tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Policies pour la table students
-- Les utilisateurs peuvent voir uniquement leurs propres élèves
CREATE POLICY "Users can view own students" ON students
    FOR SELECT USING (auth.uid() = user_id);

-- Les utilisateurs peuvent insérer uniquement leurs propres élèves
CREATE POLICY "Users can insert own students" ON students
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier uniquement leurs propres élèves
CREATE POLICY "Users can update own students" ON students
    FOR UPDATE USING (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer uniquement leurs propres élèves
CREATE POLICY "Users can delete own students" ON students
    FOR DELETE USING (auth.uid() = user_id);

-- Policies pour la table grades
-- Les utilisateurs peuvent voir uniquement leurs propres notes
CREATE POLICY "Users can view own grades" ON grades
    FOR SELECT USING (auth.uid() = user_id);

-- Les utilisateurs peuvent insérer uniquement leurs propres notes
CREATE POLICY "Users can insert own grades" ON grades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier uniquement leurs propres notes
CREATE POLICY "Users can update own grades" ON grades
    FOR UPDATE USING (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer uniquement leurs propres notes
CREATE POLICY "Users can delete own grades" ON grades
    FOR DELETE USING (auth.uid() = user_id);

-- Créer les tables si elles n'existent pas déjà
CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL,
    notes TEXT[] DEFAULT ARRAY[NULL, NULL, NULL, NULL],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, student_id, subject_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_grades_user_id ON grades(user_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
