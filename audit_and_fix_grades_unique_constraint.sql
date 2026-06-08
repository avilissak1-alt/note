-- Audit et correction de la contrainte unique requise par :
-- onConflict: 'user_id,student_id,subject'

BEGIN;

-- 1. Contraintes existantes sur grades
SELECT
  'constraints_before' AS section,
  c.conname AS constraint_name,
  c.contype AS constraint_type,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'grades'
ORDER BY c.conname;

-- 2. Index existants sur grades
SELECT
  'indexes_before' AS section,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'grades'
ORDER BY indexname;

-- 3. Clés uniques existantes sur grades
SELECT
  'unique_constraints_before' AS section,
  c.conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS constraint_definition,
  array_agg(a.attname ORDER BY k.ordinality) AS columns
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
JOIN unnest(c.conkey) WITH ORDINALITY AS k(attnum, ordinality) ON true
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
WHERE n.nspname = 'public'
  AND t.relname = 'grades'
  AND c.contype IN ('u', 'p')
GROUP BY c.oid, c.conname
ORDER BY c.conname;

-- 4. Création de la contrainte si elle n'existe pas exactement
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'grades'
      AND c.contype = 'u'
      AND c.conkey = ARRAY[
        (SELECT attnum FROM pg_attribute WHERE attrelid = t.oid AND attname = 'user_id'),
        (SELECT attnum FROM pg_attribute WHERE attrelid = t.oid AND attname = 'student_id'),
        (SELECT attnum FROM pg_attribute WHERE attrelid = t.oid AND attname = 'subject')
      ]::smallint[]
  ) THEN
    ALTER TABLE public.grades
      ADD CONSTRAINT grades_user_student_subject_unique
      UNIQUE (user_id, student_id, subject);
  END IF;
END $$;

-- 5. Vérification pg_constraint après correction
SELECT
  'constraints_after' AS section,
  c.conname AS constraint_name,
  c.contype AS constraint_type,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'grades'
ORDER BY c.conname;

-- 6. Vérification pg_indexes après correction
SELECT
  'indexes_after' AS section,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'grades'
ORDER BY indexname;

-- 7. Test technique ON CONFLICT avec rollback final de la ligne test
DO $$
DECLARE
  test_user_id uuid;
  test_student_id uuid;
BEGIN
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  SELECT id INTO test_student_id FROM public.students WHERE user_id = test_user_id LIMIT 1;

  IF test_user_id IS NULL OR test_student_id IS NULL THEN
    RAISE NOTICE 'upsert_test_skipped: missing test user or student';
  ELSE
    INSERT INTO public.grades (user_id, student_id, subject, grade)
    VALUES (test_user_id, test_student_id, '__constraint_test__', 1)
    ON CONFLICT (user_id, student_id, subject)
    DO UPDATE SET grade = EXCLUDED.grade, updated_at = NOW();

    DELETE FROM public.grades
    WHERE user_id = test_user_id
      AND student_id = test_student_id
      AND subject = '__constraint_test__';

    RAISE NOTICE 'upsert_test_success: ON CONFLICT(user_id, student_id, subject) works';
  END IF;
END $$;

COMMIT;
