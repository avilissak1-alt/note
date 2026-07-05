export const normalizeSubjectKey = (value) => String(value ?? '').trim().toLowerCase();

export const getWeeklySubjectKey = (subject, week) => `${subject}__week_${week}`;

export const getBaseSubjectKey = (subject) => String(subject ?? '').replace(/__week_[1-4]$/, '');

export const getSubjectWeek = (subject) => {
  const match = String(subject ?? '').match(/__week_([1-4])$/);
  return match ? Number(match[1]) : null;
};

export const getColumnSubjectKeys = (column) => {
  return [column?.id, column?.matiere, column?.nom]
    .map(normalizeSubjectKey)
    .filter(Boolean);
};

export const findColumnForSubject = (subject, columns) => {
  const normalizedSubject = normalizeSubjectKey(getBaseSubjectKey(subject));
  return (columns || []).find((column) => getColumnSubjectKeys(column).includes(normalizedSubject)) || null;
};

export const formatAverage = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
  return Number(value).toFixed(2);
};

export const formatGrade = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toFixed(2).replace(/\.00$/, '');
};

const computeAverageFromGrades = (grades) => {
  const validGrades = grades
    .map((grade) => Number(grade))
    .filter((grade) => !Number.isNaN(grade) && grade !== 0);

  if (validGrades.length === 0) return null;
  return validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length;
};

const buildSubjectReports = (notes, columns, sectionName) => {
  return (columns || []).map((column) => {
    const columnKeys = getColumnSubjectKeys(column);
    const subjectNotes = notes
      .filter((note) => columnKeys.includes(normalizeSubjectKey(getBaseSubjectKey(note.subject))))
      .map((note) => ({
        ...note,
        gradeNumber: Number(note.grade),
        week: getSubjectWeek(note.subject),
        subjectName: column.nom || note.subject,
        sectionName
      }))
      .filter((note) => !Number.isNaN(note.gradeNumber) && note.gradeNumber !== 0);

    const averageValue = computeAverageFromGrades(subjectNotes.map((note) => note.gradeNumber));

    return {
      id: column.id,
      matiere: column.matiere,
      name: column.nom,
      notes: subjectNotes,
      averageValue,
      average: formatAverage(averageValue)
    };
  });
};

const flattenNotes = (subjects) => subjects.flatMap((subject) => subject.notes);

export const buildStudentGradeReport = ({ eleveId, notesMensuelles, colonnesBoker, colonnesFormation }) => {
  const notesArray = Array.isArray(notesMensuelles) ? notesMensuelles : [];
  const studentNotes = notesArray.filter((note) => note.student_id === eleveId);

  const bokerSubjects = buildSubjectReports(studentNotes, colonnesBoker, 'Boker');
  const formationSubjects = buildSubjectReports(studentNotes, colonnesFormation, 'Formation Professionnelle');
  const bokerNotes = flattenNotes(bokerSubjects);
  const formationNotes = flattenNotes(formationSubjects);
  const allResolvedNotes = [...bokerNotes, ...formationNotes];
  const allColumns = [...(colonnesBoker || []), ...(colonnesFormation || [])];
  const orphanNotes = studentNotes
    .filter((note) => !findColumnForSubject(note.subject, allColumns))
    .map((note) => ({
      ...note,
      gradeNumber: Number(note.grade),
      subjectName: note.subject,
      sectionName: 'Non classé'
    }))
    .filter((note) => !Number.isNaN(note.gradeNumber) && note.gradeNumber !== 0);

  const bokerAverageValue = computeAverageFromGrades(bokerNotes.map((note) => note.gradeNumber));
  const formationAverageValue = computeAverageFromGrades(formationNotes.map((note) => note.gradeNumber));
  const totalAverageValue = computeAverageFromGrades(allResolvedNotes.map((note) => note.gradeNumber));
  const sortedDesc = [...allResolvedNotes].sort((a, b) => b.gradeNumber - a.gradeNumber);
  const sortedAsc = [...allResolvedNotes].sort((a, b) => a.gradeNumber - b.gradeNumber);

  return {
    bokerSubjects,
    formationSubjects,
    orphanNotes,
    bokerNotes,
    formationNotes,
    allNotes: allResolvedNotes,
    bokerAverageValue,
    formationAverageValue,
    totalAverageValue,
    bokerAverage: formatAverage(bokerAverageValue),
    formationAverage: formatAverage(formationAverageValue),
    totalAverage: formatAverage(totalAverageValue),
    best: sortedDesc[0] || null,
    worst: sortedAsc[0] || null,
    weakSubjects: [...bokerSubjects, ...formationSubjects]
      .filter((subject) => subject.averageValue !== null)
      .sort((a, b) => a.averageValue - b.averageValue),
    sortedDesc,
    sortedAsc
  };
};
