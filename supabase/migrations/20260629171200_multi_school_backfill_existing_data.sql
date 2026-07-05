BEGIN;

CREATE TEMP TABLE IF NOT EXISTS migration_backfill_counts (
  metric text PRIMARY KEY,
  value integer NOT NULL DEFAULT 0
) ON COMMIT DROP;

TRUNCATE migration_backfill_counts;

WITH inserted_school AS (
  INSERT INTO public.schools (name, logo_url)
  VALUES ('École par défaut', NULL)
  ON CONFLICT (name) DO NOTHING
  RETURNING id
)
INSERT INTO migration_backfill_counts (metric, value)
SELECT 'schools_created', COUNT(*)::integer FROM inserted_school;

WITH default_school AS (
  SELECT id FROM public.schools WHERE name = 'École par défaut' LIMIT 1
), owner_users AS (
  SELECT DISTINCT user_id AS id
  FROM public.students
  WHERE user_id IS NOT NULL
  UNION
  SELECT DISTINCT user_id AS id
  FROM public.grades
  WHERE user_id IS NOT NULL
), inserted_profiles AS (
  INSERT INTO public.profiles (id, school_id, role, full_name, email)
  SELECT
    owner_users.id,
    default_school.id,
    'director'::public.app_role,
    COALESCE(auth_users.raw_user_meta_data ->> 'full_name', auth_users.raw_user_meta_data ->> 'name', split_part(auth_users.email, '@', 1)),
    auth_users.email
  FROM owner_users
  CROSS JOIN default_school
  JOIN auth.users auth_users ON auth_users.id = owner_users.id
  ON CONFLICT (id) DO NOTHING
  RETURNING id
)
INSERT INTO migration_backfill_counts (metric, value)
SELECT 'profiles_created', COUNT(*)::integer FROM inserted_profiles;

WITH default_school AS (
  SELECT id FROM public.schools WHERE name = 'École par défaut' LIMIT 1
), owner_users AS (
  SELECT DISTINCT user_id AS id
  FROM public.students
  WHERE user_id IS NOT NULL
  UNION
  SELECT DISTINCT user_id AS id
  FROM public.grades
  WHERE user_id IS NOT NULL
)
UPDATE public.profiles
SET school_id = default_school.id,
    role = 'director'::public.app_role,
    email = COALESCE(public.profiles.email, auth_users.email),
    full_name = COALESCE(public.profiles.full_name, auth_users.raw_user_meta_data ->> 'full_name', auth_users.raw_user_meta_data ->> 'name', split_part(auth_users.email, '@', 1)),
    updated_at = now()
FROM owner_users
CROSS JOIN default_school
JOIN auth.users auth_users ON auth_users.id = owner_users.id
WHERE public.profiles.id = owner_users.id
  AND (
    public.profiles.school_id IS DISTINCT FROM default_school.id
    OR public.profiles.role IS DISTINCT FROM 'director'::public.app_role
    OR public.profiles.email IS NULL
    OR public.profiles.full_name IS NULL
  );

WITH default_school AS (
  SELECT id FROM public.schools WHERE name = 'École par défaut' LIMIT 1
), updated_students AS (
  UPDATE public.students
  SET school_id = default_school.id
  FROM default_school
  WHERE public.students.school_id IS NULL
  RETURNING public.students.id
)
INSERT INTO migration_backfill_counts (metric, value)
SELECT 'students_updated_this_run', COUNT(*)::integer FROM updated_students;

DO $$
DECLARE
  projected_duplicate_count integer;
BEGIN
  WITH default_school AS (
    SELECT id FROM public.schools WHERE name = 'École par défaut' LIMIT 1
  ), projected_grades AS (
    SELECT
      COALESCE(grades.school_id, default_school.id) AS projected_school_id,
      grades.student_id,
      grades.subject
    FROM public.grades grades
    CROSS JOIN default_school
  )
  SELECT COUNT(*)::integer
  INTO projected_duplicate_count
  FROM (
    SELECT projected_school_id, student_id, subject, COUNT(*)
    FROM projected_grades
    WHERE projected_school_id IS NOT NULL
      AND student_id IS NOT NULL
      AND subject IS NOT NULL
    GROUP BY projected_school_id, student_id, subject
    HAVING COUNT(*) > 1
  ) duplicates;

  IF projected_duplicate_count > 0 THEN
    RAISE EXCEPTION 'Backfill aborted before updating grades: projected duplicate grades for (school_id, student_id, subject): %', projected_duplicate_count;
  END IF;
END $$;

WITH default_school AS (
  SELECT id FROM public.schools WHERE name = 'École par défaut' LIMIT 1
), updated_grades AS (
  UPDATE public.grades
  SET school_id = default_school.id
  FROM default_school
  WHERE public.grades.school_id IS NULL
  RETURNING public.grades.id
)
INSERT INTO migration_backfill_counts (metric, value)
SELECT 'grades_updated_this_run', COUNT(*)::integer FROM updated_grades;

DO $$
DECLARE
  duplicate_count integer;
  orphan_grades_count integer;
  null_owner_count integer;
  missing_student_school_count integer;
  missing_grade_school_count integer;
  missing_profile_count integer;
  grade_student_school_mismatch_count integer;
BEGIN
  SELECT COUNT(*)::integer
  INTO duplicate_count
  FROM (
    SELECT school_id, student_id, subject, COUNT(*)
    FROM public.grades
    WHERE school_id IS NOT NULL
    GROUP BY school_id, student_id, subject
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Backfill aborted: duplicate grades detected for (school_id, student_id, subject): %', duplicate_count;
  END IF;

  SELECT COUNT(*)::integer
  INTO orphan_grades_count
  FROM public.grades grades
  LEFT JOIN public.students students ON students.id = grades.student_id
  WHERE grades.student_id IS NOT NULL
    AND students.id IS NULL;

  IF orphan_grades_count > 0 THEN
    RAISE EXCEPTION 'Backfill aborted: orphan grades detected without matching students: %', orphan_grades_count;
  END IF;

  SELECT COUNT(*)::integer
  INTO null_owner_count
  FROM (
    SELECT id FROM public.students WHERE user_id IS NULL
    UNION ALL
    SELECT id FROM public.grades WHERE user_id IS NULL
  ) rows_without_owner;

  IF null_owner_count > 0 THEN
    RAISE EXCEPTION 'Backfill aborted: rows without user_id cannot be attached to a director profile: %', null_owner_count;
  END IF;

  SELECT COUNT(*)::integer
  INTO missing_student_school_count
  FROM public.students
  WHERE school_id IS NULL;

  IF missing_student_school_count > 0 THEN
    RAISE EXCEPTION 'Backfill aborted: students still have school_id NULL: %', missing_student_school_count;
  END IF;

  SELECT COUNT(*)::integer
  INTO missing_grade_school_count
  FROM public.grades
  WHERE school_id IS NULL;

  IF missing_grade_school_count > 0 THEN
    RAISE EXCEPTION 'Backfill aborted: grades still have school_id NULL: %', missing_grade_school_count;
  END IF;

  SELECT COUNT(*)::integer
  INTO missing_profile_count
  FROM (
    SELECT DISTINCT user_id AS id FROM public.students WHERE user_id IS NOT NULL
    UNION
    SELECT DISTINCT user_id AS id FROM public.grades WHERE user_id IS NOT NULL
  ) owners
  LEFT JOIN public.profiles profiles ON profiles.id = owners.id
  WHERE profiles.id IS NULL;

  IF missing_profile_count > 0 THEN
    RAISE EXCEPTION 'Backfill aborted: owner users without director profile: %', missing_profile_count;
  END IF;

  SELECT COUNT(*)::integer
  INTO grade_student_school_mismatch_count
  FROM public.grades grades
  JOIN public.students students ON students.id = grades.student_id
  WHERE grades.school_id IS DISTINCT FROM students.school_id;

  IF grade_student_school_mismatch_count > 0 THEN
    RAISE EXCEPTION 'Backfill aborted: grades and students have different school_id values: %', grade_student_school_mismatch_count;
  END IF;
END $$;

WITH default_school AS (
  SELECT id FROM public.schools WHERE name = 'École par défaut' LIMIT 1
), final_counts AS (
  SELECT
    COALESCE((SELECT value FROM migration_backfill_counts WHERE metric = 'schools_created'), 0) AS schools_created,
    (SELECT COUNT(*)::integer FROM public.students, default_school WHERE public.students.school_id = default_school.id) AS students_migrated,
    (SELECT COUNT(*)::integer FROM public.grades, default_school WHERE public.grades.school_id = default_school.id) AS grades_migrated,
    COALESCE((SELECT value FROM migration_backfill_counts WHERE metric = 'profiles_created'), 0) AS profiles_created,
    (
      (SELECT COUNT(*)::integer FROM public.students WHERE school_id IS NULL)
      +
      (SELECT COUNT(*)::integer FROM public.grades WHERE school_id IS NULL)
    ) AS rows_remaining_with_school_id_null
)
SELECT
  schools_created,
  students_migrated,
  grades_migrated,
  profiles_created,
  rows_remaining_with_school_id_null
FROM final_counts;

COMMIT;
