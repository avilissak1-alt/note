BEGIN;

DROP TABLE IF EXISTS grades CASCADE;

CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  grade NUMERIC CHECK (grade >= 0 AND grade <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT grades_user_student_subject_unique UNIQUE (user_id, student_id, subject)
);

ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own grades" ON grades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own grades" ON grades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grades" ON grades
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grades" ON grades
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_grades_user_id ON grades(user_id);
CREATE INDEX idx_grades_student_id ON grades(student_id);
CREATE INDEX idx_grades_subject ON grades(subject);

COMMIT;
