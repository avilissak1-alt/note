-- Schéma officiel unique de la table grades
-- Colonnes: id, user_id, student_id, subject, grade, created_at, updated_at
-- Contrainte unique: (user_id, student_id, subject)

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'grades'
ORDER BY ordinal_position;

WITH expected_columns AS (
  SELECT 'id' AS column_name
  UNION ALL SELECT 'user_id'
  UNION ALL SELECT 'student_id'
  UNION ALL SELECT 'subject'
  UNION ALL SELECT 'grade'
  UNION ALL SELECT 'created_at'
  UNION ALL SELECT 'updated_at'
), actual_columns AS (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'grades'
)
SELECT
  expected_columns.column_name,
  CASE
    WHEN actual_columns.column_name IS NULL THEN 'missing'
    ELSE 'ok'
  END AS status
FROM expected_columns
LEFT JOIN actual_columns USING (column_name)
ORDER BY expected_columns.column_name;

SELECT
  tc.constraint_name,
  tc.constraint_type,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'grades'
GROUP BY tc.constraint_name, tc.constraint_type
ORDER BY tc.constraint_name;
