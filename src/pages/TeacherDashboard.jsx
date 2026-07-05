import React, { useMemo, useState, useCallback } from 'react';
import BandeauSemaine from '../components/ui/BandeauSemaine.jsx';
import Button from '../components/ui/Button.jsx';
import NoteInput from '../components/ui/NoteInput.jsx';
import { gradesService } from '../services/supabaseService.js';
import { getWeeklySubjectKey } from '../utils/gradeAnalysis.js';

function TeacherDashboard({ user, theme, onToggleTheme, onLogout, onBackToRoles, eleves, colonnesBoker, colonnesFormation, notesMensuelles, setNotesMensuelles, semaineActuelle, setSemaineActuelle, userId, sessionContext }) {
  const allSubjects = useMemo(() => [...(colonnesBoker || []), ...(colonnesFormation || [])], [colonnesBoker, colonnesFormation]);
  const teacherName = sessionContext?.teacher?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Professeur';
  const teacherSubjectId = sessionContext?.teacherSubject || '';
  const teacherSubject = allSubjects.find((subject) => subject.id === teacherSubjectId) || null;
  const safeNotesMensuelles = Array.isArray(notesMensuelles) ? notesMensuelles : [];

  const updateNote = useCallback(async (eleveId, value) => {
    if (!teacherSubject) return;

    const noteValue = value === '' ? null : parseFloat(value);
    if (noteValue !== null && (noteValue < 0 || noteValue > 100)) return;

    try {
      await gradesService.upsert(userId, {
        student_id: eleveId,
        subject: getWeeklySubjectKey(teacherSubject.id, semaineActuelle),
        grade: noteValue
      }, sessionContext);

      const updatedNotes = await gradesService.getAll(userId, sessionContext);
      setNotesMensuelles(updatedNotes);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la note professeur:', error);
      alert('Erreur lors de la sauvegarde de la note');
    }
  }, [teacherSubject, semaineActuelle, userId, setNotesMensuelles, sessionContext]);

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', width: '100vw', overflowX: 'hidden' }}>
      <BandeauSemaine
        theme={theme}
        semaineActuelle={semaineActuelle}
        setSemaineActuelle={setSemaineActuelle}
        onToggleTheme={onToggleTheme}
        onLogout={onLogout}
        user={user}
      />

      <main style={{ padding: '24px 32px', display: 'grid', gap: '1.5rem', fontFamily: 'Palatino, Palatino Linotype, serif' }}>
        <section style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.45rem' }}>Professeur</div>
            <input value={teacherName} readOnly style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--input-text)', fontWeight: 'bold' }} />
          </div>

          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.45rem' }}>Matière enseignée</div>
            <input value={teacherSubject?.nom || 'Matière non configurée'} readOnly style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--input-text)', fontWeight: 'bold' }} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button onClick={onBackToRoles} variant="secondary" size="small">Changer de rôle</Button>
          </div>
        </section>

        <section style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.5rem' }}>Espace professeur</h1>
              <p style={{ color: 'var(--text-secondary)', margin: '0.35rem 0 0' }}>Vous voyez uniquement les notes de votre matière.</p>
            </div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>Semaine {semaineActuelle} · {teacherSubject?.nom || 'Aucune matière'}</div>
          </div>

          {!teacherSubject ? (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem' }}>Aucune matière disponible.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff', fontSize: '14px', fontFamily: 'Arial, sans-serif', borderRadius: '8px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f4e4c1' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'left', border: '1px solid #d4af37', color: '#5d4e37' }}>Élève</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', border: '1px solid #d4af37', color: '#5d4e37' }}>{teacherSubject.nom}</th>
                  </tr>
                </thead>
                <tbody>
                  {(eleves || []).map((eleve, index) => {
                    const weeklySubject = getWeeklySubjectKey(teacherSubject.id, semaineActuelle);
                    const note = safeNotesMensuelles.find((entry) => entry.student_id === eleve.id && entry.subject === weeklySubject);

                    return (
                      <tr key={eleve.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#faf8f3' }}>
                        <td style={{ padding: '12px 8px', border: '1px solid #e8dcc0', fontWeight: 'bold', color: '#5d4e37' }}>{eleve.firstName} {eleve.lastName}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', border: '1px solid #e8dcc0' }}>
                          <NoteInput value={note?.grade ?? ''} onChange={(value) => updateNote(eleve.id, value)} width="70px" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default TeacherDashboard;
