export const GRADES_COLUMNS = {
  USER_ID: 'user_id',
  STUDENT_ID: 'student_id',
  SUBJECT: 'subject',
  GRADE: 'grade',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  ID: 'id'
};

export const GRADES_CONFLICT_COLUMNS = [
  GRADES_COLUMNS.USER_ID,
  GRADES_COLUMNS.STUDENT_ID,
  GRADES_COLUMNS.SUBJECT
];

export const GRADES_MAPPING = {};

export const validateGradeData = (data) => {
  const required = [
    GRADES_COLUMNS.USER_ID,
    GRADES_COLUMNS.STUDENT_ID,
    GRADES_COLUMNS.SUBJECT
  ];

  const missing = required.filter(col => !data[col]);
  if (missing.length > 0) {
    throw new Error(`Colonnes requises manquantes: ${missing.join(', ')}`);
  }

  const gradeValue = data[GRADES_COLUMNS.GRADE];
  if (gradeValue !== null && gradeValue !== undefined && gradeValue !== '') {
    const grade = parseFloat(gradeValue);
    if (isNaN(grade) || grade < 0 || grade > 100) {
      throw new Error(`La note doit être entre 0 et 100, reçu: ${gradeValue}`);
    }
  }

  return true;
};
