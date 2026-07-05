import React, { useMemo } from 'react';
import Button from '../components/ui/Button';
import { buildStudentGradeReport, formatGrade } from '../utils/gradeAnalysis.js';
import { generateStudentPDF } from '../components/pdf/BulletinPDF.jsx';
import schoolLogo from '../assets/hero.png';

const trendConfig = {
  up: { arrow: '↑', label: 'Progression', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)' },
  down: { arrow: '↓', label: 'Baisse', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)' },
  stable: { arrow: '→', label: 'Stable', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)' }
};

const getTrend = (notes) => {
  if (!Array.isArray(notes) || notes.length < 2) return trendConfig.stable;

  const previousNotes = notes.slice(0, -1);
  const currentNote = notes[notes.length - 1];
  const previousAverage = previousNotes.reduce((sum, note) => sum + note.gradeNumber, 0) / previousNotes.length;

  if (currentNote.gradeNumber > previousAverage) return trendConfig.up;
  if (currentNote.gradeNumber < previousAverage) return trendConfig.down;
  return trendConfig.stable;
};

const getSubjectStats = (subject) => {
  const grades = subject.notes.map((note) => note.gradeNumber);
  const lastGrade = grades.length > 0 ? grades[grades.length - 1] : null;
  const bestGrade = grades.length > 0 ? Math.max(...grades) : null;
  const worstGrade = grades.length > 0 ? Math.min(...grades) : null;

  return {
    lastGrade,
    bestGrade,
    worstGrade,
    trend: getTrend(subject.notes)
  };
};

const getHistoryTrend = (notes, index) => {
  if (index === 0) return trendConfig.stable;

  const currentGrade = notes[index].gradeNumber;
  const previousGrade = notes[index - 1].gradeNumber;

  if (currentGrade > previousGrade) return trendConfig.up;
  if (currentGrade < previousGrade) return trendConfig.down;
  return trendConfig.stable;
};

const sanitizeFilenamePart = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9-]/g, '-');

function EleveAnalysePage({ onBack, eleve, notesMensuelles, colonnesBoker, colonnesFormation }) {
  const analysis = useMemo(() => {
    const report = buildStudentGradeReport({
      eleveId: eleve?.id,
      notesMensuelles,
      colonnesBoker,
      colonnesFormation
    });
    const subjects = [...report.bokerSubjects, ...report.formationSubjects].filter((subject) => subject.notes.length > 0);
    const subjectsWithStats = subjects.map((subject) => ({ ...subject, stats: getSubjectStats(subject) }));
    const strengths = [...subjectsWithStats].filter((subject) => subject.averageValue !== null).sort((a, b) => b.averageValue - a.averageValue).slice(0, 3);
    const improvements = [...subjectsWithStats].filter((subject) => subject.averageValue !== null).sort((a, b) => a.averageValue - b.averageValue).slice(0, 3);

    return {
      ...report,
      subjects: subjectsWithStats,
      strengths,
      improvements,
      generalTrend: getTrend(report.allNotes)
    };
  }, [eleve, notesMensuelles, colonnesBoker, colonnesFormation]);

  if (!eleve) {
    return <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '92vh', padding: '24px 32px' }}><Button onClick={onBack} variant="secondary" size="medium">← Retour</Button><div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '4rem' }}>Aucun élève sélectionné.</div></div>;
  }

  const handleDownloadPDF = async () => {
    try {
      const pdfData = {
        schoolName: 'École',
        logoSrc: schoolLogo,
        studentName: `${eleve.firstName} ${eleve.lastName}`,
        generatedAt: new Date().toISOString(),
        totalAverage: analysis.totalAverage,
        subjects: analysis.subjects.map((subject) => ({
          id: subject.id,
          name: subject.name,
          average: subject.average,
          notes: subject.notes.map((note, index) => ({
            label: `N${index + 1}`,
            value: formatGrade(note.gradeNumber),
            gradeNumber: note.gradeNumber
          }))
        }))
      };
      const blob = await generateStudentPDF(pdfData);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bulletin-${sanitizeFilenamePart(eleve.lastName)}-${sanitizeFilenamePart(eleve.firstName)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de la génération du bulletin PDF:', error);
      alert('Erreur lors de la génération du bulletin PDF');
    }
  };

  const pageStyle = { backgroundColor: 'var(--bg-primary)', minHeight: '92vh', width: '98vw', maxWidth: 'none', margin: 0, padding: '24px 32px', fontFamily: 'Palatino, Palatino Linotype, serif' };
  const cardStyle = { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '18px', padding: '1.4rem', boxShadow: '0 10px 28px rgba(0, 0, 0, 0.08)' };
  const miniCardStyle = { backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1rem' };
  const labelStyle = { color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.45rem' };
  const valueStyle = { color: 'var(--text-primary)', fontSize: '2rem', fontWeight: 'bold' };

  return (
    <div style={pageStyle}>
      <header style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', padding: '0 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          <Button onClick={onBack} variant="secondary" size="medium">← Retour</Button>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>Fiche élève</h1>
          <Button onClick={handleDownloadPDF} variant="premium" size="medium">Télécharger PDF</Button>
        </div>
      </header>

      <main style={{ padding: '2rem 0', display: 'grid', gap: '1.5rem' }}>
        <section style={{ ...cardStyle, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          <div>
            <div style={labelStyle}>Élève</div>
            <div style={{ ...valueStyle, fontSize: '2.15rem' }}>{eleve.firstName} {eleve.lastName}</div>
          </div>
          <div>
            <div style={labelStyle}>Moyenne générale</div>
            <div style={valueStyle}>{analysis.totalAverage ?? '—'}</div>
          </div>
          <div>
            <div style={labelStyle}>Évolution globale</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', backgroundColor: analysis.generalTrend.bg, color: analysis.generalTrend.color, borderRadius: '999px', padding: '0.65rem 1rem', fontWeight: 'bold', fontSize: '1.25rem' }}>
              <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{analysis.generalTrend.arrow}</span>
              <span>{analysis.generalTrend.label}</span>
            </div>
          </div>
        </section>

        {analysis.subjects.length === 0 ? (
          <section style={{ ...cardStyle, textAlign: 'center', padding: '3rem 2rem' }}>
            <h2 style={{ color: 'var(--text-primary)', margin: '0 0 0.75rem' }}>Aucune matière à analyser</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Les matières apparaîtront dès que des notes seront enregistrées.</p>
          </section>
        ) : (
          <>
            <section style={cardStyle}>
              <h2 style={{ color: 'var(--text-primary)', margin: '0 0 1rem', fontSize: '1.35rem' }}>Matières étudiées</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {analysis.subjects.map((subject) => (
                  <div key={subject.id} style={miniCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.15rem' }}>{subject.name}</h3>
                        <div style={{ color: subject.stats.trend.color, marginTop: '0.35rem', fontWeight: 'bold' }}>{subject.average ?? '—'} {subject.stats.trend.arrow}</div>
                      </div>
                      <div style={{ backgroundColor: subject.stats.trend.bg, color: subject.stats.trend.color, borderRadius: '999px', padding: '0.45rem 0.75rem', fontWeight: 'bold' }}>{subject.stats.trend.label}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
                      <div><div style={labelStyle}>Moyenne</div><div style={{ ...valueStyle, fontSize: '1.45rem' }}>{subject.average ?? '—'}</div></div>
                      <div><div style={labelStyle}>Dernière note</div><div style={{ ...valueStyle, fontSize: '1.45rem' }}>{subject.stats.lastGrade !== null ? formatGrade(subject.stats.lastGrade) : '—'}</div></div>
                      <div><div style={labelStyle}>Meilleure note</div><div style={{ ...valueStyle, fontSize: '1.45rem', color: '#16a34a' }}>{subject.stats.bestGrade !== null ? formatGrade(subject.stats.bestGrade) : '—'}</div></div>
                      <div><div style={labelStyle}>Plus faible</div><div style={{ ...valueStyle, fontSize: '1.45rem', color: '#f97316' }}>{subject.stats.worstGrade !== null ? formatGrade(subject.stats.worstGrade) : '—'}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div style={cardStyle}>
                <h2 style={{ color: 'var(--text-primary)', margin: '0 0 1rem', fontSize: '1.25rem' }}>Points à améliorer</h2>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {analysis.improvements.map((subject) => <div key={subject.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-primary)', backgroundColor: 'rgba(249, 115, 22, 0.12)', borderRadius: '12px', padding: '0.85rem 1rem' }}><span>{subject.name}</span><strong>{subject.average}</strong></div>)}
                </div>
              </div>

              <div style={cardStyle}>
                <h2 style={{ color: 'var(--text-primary)', margin: '0 0 1rem', fontSize: '1.25rem' }}>Points forts</h2>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {analysis.strengths.map((subject) => <div key={subject.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-primary)', backgroundColor: 'rgba(22, 163, 74, 0.12)', borderRadius: '12px', padding: '0.85rem 1rem' }}><span>{subject.name}</span><strong>{subject.average}</strong></div>)}
                </div>
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={{ color: 'var(--text-primary)', margin: '0 0 1rem', fontSize: '1.35rem' }}>Historique des notes</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {analysis.subjects.map((subject) => (
                  <div key={`${subject.id}-history`} style={miniCardStyle}>
                    <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.85rem', fontSize: '1.1rem' }}>{subject.name}</h3>
                    <div style={{ display: 'grid', gap: '0.55rem' }}>
                      {subject.notes.map((note, index) => {
                        const noteTrend = getHistoryTrend(subject.notes, index);
                        const noteLabel = `N${index + 1}`;

                        return (
                          <div key={`${note.id || subject.id}-history-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: noteTrend.bg, color: noteTrend.color, borderRadius: '10px', padding: '0.65rem 0.8rem', fontWeight: 'bold' }}>
                            <span>{noteLabel} : {formatGrade(note.gradeNumber)}</span>
                            <span style={{ fontSize: '1.25rem' }}>{noteTrend.arrow}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default EleveAnalysePage;
