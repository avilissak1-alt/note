BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('director', 'teacher');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT schools_name_unique UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  full_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_school_email_unique UNIQUE (school_id, email),
  CONSTRAINT profiles_teacher_email_required CHECK (role <> 'teacher' OR email IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  subject text NOT NULL,
  email text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'teachers_school_email_unique'
      AND conrelid = 'public.teachers'::regclass
  ) THEN
    ALTER TABLE public.teachers
      ADD CONSTRAINT teachers_school_email_unique UNIQUE (school_id, email);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'teachers_school_subject_email_unique'
      AND conrelid = 'public.teachers'::regclass
  ) THEN
    ALTER TABLE public.teachers
      ADD CONSTRAINT teachers_school_subject_email_unique UNIQUE (school_id, subject, email);
  END IF;
END $$;

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON public.profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON public.teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON public.teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_school_subject ON public.teachers(school_id, subject);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_grades_school_id ON public.grades(school_id);
CREATE INDEX IF NOT EXISTS idx_grades_teacher_id ON public.grades(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grades_school_student_subject ON public.grades(school_id, student_id, subject);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'grades_user_student_subject_unique'
      AND conrelid = 'public.grades'::regclass
  ) THEN
    ALTER TABLE public.grades DROP CONSTRAINT grades_user_student_subject_unique;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'grades_school_student_subject_unique'
      AND conrelid = 'public.grades'::regclass
  ) THEN
    ALTER TABLE public.grades
      ADD CONSTRAINT grades_school_student_subject_unique UNIQUE (school_id, student_id, subject);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at_on_schools ON public.schools;
CREATE TRIGGER set_updated_at_on_schools
  BEFORE UPDATE ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_on_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_on_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_on_teachers ON public.teachers;
CREATE TRIGGER set_updated_at_on_teachers
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.current_profile_school_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_teacher_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.teachers WHERE user_id = auth.uid();
$$;

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own students" ON public.students;
DROP POLICY IF EXISTS "Users can insert own students" ON public.students;
DROP POLICY IF EXISTS "Users can update own students" ON public.students;
DROP POLICY IF EXISTS "Users can delete own students" ON public.students;
DROP POLICY IF EXISTS "Users can view their own students" ON public.students;
DROP POLICY IF EXISTS "Users can insert their own students" ON public.students;
DROP POLICY IF EXISTS "Users can update their own students" ON public.students;
DROP POLICY IF EXISTS "Users can delete their own students" ON public.students;

DROP POLICY IF EXISTS "Users can view own grades" ON public.grades;
DROP POLICY IF EXISTS "Users can insert own grades" ON public.grades;
DROP POLICY IF EXISTS "Users can update own grades" ON public.grades;
DROP POLICY IF EXISTS "Users can delete own grades" ON public.grades;
DROP POLICY IF EXISTS "Users can view their own grades" ON public.grades;
DROP POLICY IF EXISTS "Users can insert their own grades" ON public.grades;
DROP POLICY IF EXISTS "Users can update their own grades" ON public.grades;
DROP POLICY IF EXISTS "Users can delete their own grades" ON public.grades;

DROP POLICY IF EXISTS "Teachers are readable by authenticated users" ON public.teachers;

DROP POLICY IF EXISTS "School members can view their school" ON public.schools;
DROP POLICY IF EXISTS "Directors can update their school" ON public.schools;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Directors can view school profiles" ON public.profiles;
DROP POLICY IF EXISTS "Directors can manage school profiles" ON public.profiles;
DROP POLICY IF EXISTS "Directors can view school teachers" ON public.teachers;
DROP POLICY IF EXISTS "Teachers can view own teacher record" ON public.teachers;
DROP POLICY IF EXISTS "Directors can insert school teachers" ON public.teachers;
DROP POLICY IF EXISTS "Directors can update school teachers" ON public.teachers;
DROP POLICY IF EXISTS "Directors can delete school teachers" ON public.teachers;
DROP POLICY IF EXISTS "School members can view school students" ON public.students;
DROP POLICY IF EXISTS "Directors can insert school students" ON public.students;
DROP POLICY IF EXISTS "Directors can update school students" ON public.students;
DROP POLICY IF EXISTS "Directors can delete school students" ON public.students;
DROP POLICY IF EXISTS "Directors can view school grades" ON public.grades;
DROP POLICY IF EXISTS "Teachers can view own subject grades" ON public.grades;
DROP POLICY IF EXISTS "Directors can insert school grades" ON public.grades;
DROP POLICY IF EXISTS "Teachers can insert own subject grades" ON public.grades;
DROP POLICY IF EXISTS "Directors can update school grades" ON public.grades;
DROP POLICY IF EXISTS "Teachers can update own grades" ON public.grades;
DROP POLICY IF EXISTS "Directors can delete school grades" ON public.grades;

CREATE POLICY "School members can view their school" ON public.schools
  FOR SELECT TO authenticated
  USING (id = public.current_profile_school_id());

CREATE POLICY "Directors can update their school" ON public.schools
  FOR UPDATE TO authenticated
  USING (id = public.current_profile_school_id() AND public.current_profile_role() = 'director')
  WITH CHECK (id = public.current_profile_school_id() AND public.current_profile_role() = 'director');

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Directors can view school profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (school_id = public.current_profile_school_id() AND public.current_profile_role() = 'director');

CREATE POLICY "Directors can manage school profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (school_id = public.current_profile_school_id() AND public.current_profile_role() = 'director')
  WITH CHECK (school_id = public.current_profile_school_id() AND public.current_profile_role() = 'director');

CREATE POLICY "Directors can view school teachers" ON public.teachers
  FOR SELECT TO authenticated
  USING (school_id = public.current_profile_school_id() AND public.current_profile_role() = 'director');

CREATE POLICY "Teachers can view own teacher record" ON public.teachers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND school_id = public.current_profile_school_id());

CREATE POLICY "Directors can insert school teachers" ON public.teachers
  FOR INSERT TO authenticated
  WITH CHECK (school_id = public.current_profile_school_id() AND public.current_profile_role() = 'director');

CREATE POLICY "Directors can update school teachers" ON public.teachers
  FOR UPDATE TO authenticated
  USING (school_id = public.current_profile_school_id() AND public.current_profile_role() = 'director')
  WITH CHECK (school_id = public.current_profile_school_id() AND public.current_profile_role() = 'director');

CREATE POLICY "Directors can delete school teachers" ON public.teachers
  FOR DELETE TO authenticated
  USING (school_id = public.current_profile_school_id() AND public.current_profile_role() = 'director');

CREATE POLICY "School members can view school students" ON public.students
  FOR SELECT TO authenticated
  USING (school_id = public.current_profile_school_id());

CREATE POLICY "Directors can insert school students" ON public.students
  FOR INSERT TO authenticated
  WITH CHECK (school_id = public.current_profile_school_id() AND public.current_profile_role() = 'director');

CREATE POLICY "Directors can update school students" ON public.students
  FOR UPDATE TO authenticated
  USING (school_id = public.current_profile_school_id() AND public.current_profile_role() = 'director')
  WITH CHECK (school_id = public.current_profile_school_id() AND public.current_profile_role() = 'director');

CREATE POLICY "Directors can delete school students" ON public.students
  FOR DELETE TO authenticated
  USING (school_id = public.current_profile_school_id() AND public.current_profile_role() = 'director');

CREATE POLICY "Directors can view school grades" ON public.grades
  FOR SELECT TO authenticated
  USING (school_id = public.current_profile_school_id() AND public.current_profile_role() = 'director');

CREATE POLICY "Teachers can view own subject grades" ON public.grades
  FOR SELECT TO authenticated
  USING (
    school_id = public.current_profile_school_id()
    AND public.current_profile_role() = 'teacher'
    AND teacher_id = public.current_teacher_id()
  );

CREATE POLICY "Directors can insert school grades" ON public.grades
  FOR INSERT TO authenticated
  WITH CHECK (school_id = public.current_profile_school_id() AND public.current_profile_role() = 'director');

CREATE POLICY "Teachers can insert own subject grades" ON public.grades
  FOR INSERT TO authenticated
  WITH CHECK (
    school_id = public.current_profile_school_id()
    AND public.current_profile_role() = 'teacher'
    AND teacher_id = public.current_teacher_id()
  );

CREATE POLICY "Directors can update school grades" ON public.grades
  FOR UPDATE TO authenticated
  USING (school_id = public.current_profile_school_id() AND public.current_profile_role() = 'director')
  WITH CHECK (school_id = public.current_profile_school_id() AND public.current_profile_role() = 'director');

CREATE POLICY "Teachers can update own grades" ON public.grades
  FOR UPDATE TO authenticated
  USING (
    school_id = public.current_profile_school_id()
    AND public.current_profile_role() = 'teacher'
    AND teacher_id = public.current_teacher_id()
  )
  WITH CHECK (
    school_id = public.current_profile_school_id()
    AND public.current_profile_role() = 'teacher'
    AND teacher_id = public.current_teacher_id()
  );

CREATE POLICY "Directors can delete school grades" ON public.grades
  FOR DELETE TO authenticated
  USING (school_id = public.current_profile_school_id() AND public.current_profile_role() = 'director');

COMMIT;
