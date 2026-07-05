BEGIN;

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

DROP TRIGGER IF EXISTS set_updated_at_on_schools ON public.schools;
DROP TRIGGER IF EXISTS set_updated_at_on_profiles ON public.profiles;
DROP TRIGGER IF EXISTS set_updated_at_on_teachers ON public.teachers;

DROP FUNCTION IF EXISTS public.current_teacher_id();
DROP FUNCTION IF EXISTS public.current_profile_role();
DROP FUNCTION IF EXISTS public.current_profile_school_id();

DROP INDEX IF EXISTS public.idx_profiles_school_id;
DROP INDEX IF EXISTS public.idx_profiles_role;
DROP INDEX IF EXISTS public.idx_teachers_school_id;
DROP INDEX IF EXISTS public.idx_teachers_user_id;
DROP INDEX IF EXISTS public.idx_teachers_school_subject;
DROP INDEX IF EXISTS public.idx_students_school_id;
DROP INDEX IF EXISTS public.idx_grades_school_id;
DROP INDEX IF EXISTS public.idx_grades_teacher_id;
DROP INDEX IF EXISTS public.idx_grades_school_student_subject;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'grades_school_student_subject_unique'
      AND conrelid = 'public.grades'::regclass
  ) THEN
    ALTER TABLE public.grades DROP CONSTRAINT grades_school_student_subject_unique;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'grades_user_student_subject_unique'
      AND conrelid = 'public.grades'::regclass
  ) THEN
    ALTER TABLE public.grades
      ADD CONSTRAINT grades_user_student_subject_unique UNIQUE (user_id, student_id, subject);
  END IF;
END $$;

ALTER TABLE public.grades DROP COLUMN IF EXISTS teacher_id;
ALTER TABLE public.grades DROP COLUMN IF EXISTS school_id;
ALTER TABLE public.students DROP COLUMN IF EXISTS school_id;

ALTER TABLE public.teachers DROP CONSTRAINT IF EXISTS teachers_school_subject_email_unique;
ALTER TABLE public.teachers DROP CONSTRAINT IF EXISTS teachers_school_email_unique;
ALTER TABLE public.teachers DROP COLUMN IF EXISTS updated_at;
ALTER TABLE public.teachers DROP COLUMN IF EXISTS created_by;
ALTER TABLE public.teachers DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.teachers DROP COLUMN IF EXISTS school_id;

DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.schools CASCADE;
DROP TYPE IF EXISTS public.app_role;

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teachers are readable by authenticated users" ON public.teachers;
CREATE POLICY "Teachers are readable by authenticated users"
  ON public.teachers
  FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own students" ON public.students
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own students" ON public.students
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own students" ON public.students
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own students" ON public.students
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own grades" ON public.grades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own grades" ON public.grades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grades" ON public.grades
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grades" ON public.grades
  FOR DELETE USING (auth.uid() = user_id);

COMMIT;
