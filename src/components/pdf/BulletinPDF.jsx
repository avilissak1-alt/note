import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image, Font } from '@react-pdf/renderer';

const PDF_FONT_FAMILY = 'Noto Sans Hebrew';

Font.register({
  family: PDF_FONT_FAMILY,
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/notosanshebrew/v50/or3HQ7v33eiDljA1IufXTtVf7V6RvEEdhQlk0LlGxCyaeNKYZC0sqk3xXGiXd4qtog.ttf',
      fontWeight: 400
    },
    {
      src: 'https://fonts.gstatic.com/s/notosanshebrew/v50/or3HQ7v33eiDljA1IufXTtVf7V6RvEEdhQlk0LlGxCyaeNKYZC0sqk3xXGiXkI2tog.ttf',
      fontWeight: 700
    }
  ]
});

const containsHebrew = (value) => /[\u0590-\u05FF]/.test(String(value || ''));
const getTextDirectionStyle = (value) => containsHebrew(value) ? styles.rtlText : styles.ltrText;

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 8,
    color: '#1f2937',
    backgroundColor: '#ffffff'
  },
  rtlText: {
    direction: 'rtl',
    textAlign: 'right'
  },
  ltrText: {
    direction: 'ltr',
    textAlign: 'left'
  },
  centerText: {
    textAlign: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#d4af37',
    paddingBottom: 10,
    marginBottom: 12
  },
  logo: {
    width: 42,
    height: 42,
    objectFit: 'contain'
  },
  schoolName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5d4e37'
  },
  subtitle: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 3
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827'
  },
  summary: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10
  },
  summaryBox: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  label: {
    fontSize: 7,
    color: '#6b7280',
    marginBottom: 3
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827'
  },
  appreciation: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 10
  },
  appreciationText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1d4ed8'
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 7,
    color: '#5d4e37'
  },
  monthHeader: {
    flexDirection: 'row',
    marginBottom: 0
  },
  monthSpacer: {
    width: 120,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb'
  },
  monthCell: {
    width: 144,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fef3c7',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  monthEndSpacer: {
    width: 76,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#5d4e37'
  },
  tableRow: {
    flexDirection: 'row',
    minHeight: 24
  },
  subjectCell: {
    width: 120,
    padding: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    fontSize: 8,
    fontWeight: 'bold'
  },
  noteCell: {
    width: 36,
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: '#d1d5db',
    fontSize: 8,
    textAlign: 'center'
  },
  averageCell: {
    width: 48,
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: '#d1d5db',
    fontSize: 8,
    fontWeight: 'bold',
    color: '#16a34a',
    textAlign: 'center'
  },
  trendCell: {
    width: 28,
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: '#d1d5db',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  headerText: {
    color: '#ffffff',
    fontWeight: 'bold'
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 9
  },
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 24,
    right: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 5,
    color: '#9ca3af',
    fontSize: 7,
    textAlign: 'center'
  }
});

const getAppreciation = (average) => {
  const value = Number(average);
  if (Number.isNaN(value)) return 'Aucune appréciation disponible';
  if (value >= 16) return 'Excellent';
  if (value >= 14) return 'Très bien';
  if (value >= 12) return 'Bien';
  if (value >= 10) return 'Assez bien';
  return 'Doit progresser';
};

const formatDate = (value) => new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
}).format(value ? new Date(value) : new Date());

const noteColumns = Array.from({ length: 12 }, (_, index) => `N${index + 1}`);
const monthGroups = ['M1 : N1 N2 N3 N4', 'M2 : N5 N6 N7 N8', 'M3 : N9 N10 N11 N12'];

const normalizeTrimesterNotes = (notes) => {
  const sourceNotes = Array.isArray(notes) ? notes : [];
  return noteColumns.map((label, index) => sourceNotes[index]?.value ?? '—');
};

const getSubjectTrend = (notes) => {
  const numericNotes = (Array.isArray(notes) ? notes : [])
    .map((note) => Number(note.value))
    .filter((value) => !Number.isNaN(value));

  if (numericNotes.length < 2) return '→';

  const first = numericNotes[0];
  const last = numericNotes[numericNotes.length - 1];

  if (last > first) return '↑';
  if (last < first) return '↓';
  return '→';
};

function BulletinPDF({ student }) {
  const subjects = Array.isArray(student?.subjects) ? student.subjects : [];
  const studentName = student?.studentName || 'Élève';
  const schoolName = student?.schoolName || 'École';
  const totalAverage = student?.totalAverage ?? '—';
  const appreciation = getAppreciation(totalAverage);

  return (
    <Document title={`Bulletin - ${studentName}`} author={schoolName}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.schoolName, getTextDirectionStyle(schoolName)]}>{schoolName}</Text>
            <Text style={styles.subtitle}>Bulletin de notes</Text>
          </View>
          {student?.logoSrc ? <Image src={student.logoSrc} style={styles.logo} /> : null}
        </View>

        <Text style={[styles.title, getTextDirectionStyle(studentName)]}>Bulletin de {studentName}</Text>

        <View style={styles.summary}>
          <View style={styles.summaryBox}>
            <Text style={styles.label}>Élève</Text>
            <Text style={[styles.value, getTextDirectionStyle(studentName)]}>{studentName}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.label}>Date de génération</Text>
            <Text style={styles.value}>{formatDate(student?.generatedAt)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.label}>Moyenne générale</Text>
            <Text style={styles.value}>{totalAverage}</Text>
          </View>
        </View>

        <View style={styles.appreciation}>
          <Text style={styles.label}>Appréciation automatique</Text>
          <Text style={styles.appreciationText}>{appreciation}</Text>
        </View>

        <Text style={styles.sectionTitle}>Relevé détaillé du trimestre</Text>
        {subjects.length === 0 ? (
          <Text style={styles.emptyText}>Aucune note disponible.</Text>
        ) : (
          <View>
            <View style={styles.monthHeader} fixed>
              <Text style={styles.monthSpacer}></Text>
              {monthGroups.map((month) => <Text key={month} style={styles.monthCell}>{month}</Text>)}
              <Text style={styles.monthEndSpacer}></Text>
            </View>
            <View style={styles.tableHeader} fixed>
              <Text style={[styles.subjectCell, styles.headerText]}>Matière</Text>
              {noteColumns.map((label) => <Text key={label} style={[styles.noteCell, styles.headerText]}>{label}</Text>)}
              <Text style={[styles.averageCell, styles.headerText]}>Moy.</Text>
              <Text style={[styles.trendCell, styles.headerText]}>Év.</Text>
            </View>
            {subjects.map((subject) => {
              const trimesterNotes = normalizeTrimesterNotes(subject.notes);
              const trend = getSubjectTrend(subject.notes);

              return (
                <View key={subject.id || subject.name} style={styles.tableRow} wrap={false}>
                  <Text style={[styles.subjectCell, getTextDirectionStyle(subject.name)]}>{subject.name}</Text>
                  {trimesterNotes.map((note, index) => <Text key={`${subject.id || subject.name}-${index}`} style={styles.noteCell}>{note}</Text>)}
                  <Text style={styles.averageCell}>{subject.average ?? '—'}</Text>
                  <Text style={styles.trendCell}>{trend}</Text>
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.footer}>Bulletin généré automatiquement depuis les données actuellement affichées.</Text>
      </Page>
    </Document>
  );
}

export const generateStudentPDF = async (student) => {
  return pdf(<BulletinPDF student={student} />).toBlob();
};

export default BulletinPDF;
