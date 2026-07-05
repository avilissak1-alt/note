import React, { useMemo, useState } from 'react';
import Button from './Button';

function EleveSelectionPage({ onBack, onEleveSelect, eleves, notesMensuelles, colonnesBoker, colonnesFormation }) {
  const [searchTerm, setSearchTerm] = useState('');
  const notesArray = Array.isArray(notesMensuelles) ? notesMensuelles : [];
  const allColumns = [...(colonnesBoker || []), ...(colonnesFormation || [])];

  const students = useMemo(() => {
    return (Array.isArray(eleves) ? eleves : []).map((eleve) => {
      const studentNotes = notesArray.filter((note) => note.student_id === eleve.id);
      const validNotes = studentNotes.map((note) => Number(note.grade)).filter((grade) => !Number.isNaN(grade));
      const average = validNotes.length > 0 ? (validNotes.reduce((sum, grade) => sum + grade, 0) / validNotes.length).toFixed(2) : null;
      return { ...eleve, average, notesCount: validNotes.length, subjectsCount: new Set(studentNotes.map((note) => note.subject)).size };
    });
  }, [eleves, notesArray]);

  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return students;
    return students.filter((eleve) => `${eleve.firstName || ''} ${eleve.lastName || ''}`.toLowerCase().includes(term));
  }, [students, searchTerm]);

  const getAverageColor = (average) => {
    if (average === null) return 'var(--text-secondary)';
    const value = Number(average);
    if (value >= 70) return '#16a34a';
    if (value >= 50) return '#ea580c';
    return '#dc2626';
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '92vh', width: '98vw', maxWidth: 'none', margin: '0', padding: '24px 32px', fontFamily: 'Palatino, Palatino Linotype, serif' }}>
      <header style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', padding: '0 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          <Button onClick={onBack} variant="secondary" size="medium">← Retour</Button>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>Module Élèves</h1>
          <div style={{ width: '96px' }} />
        </div>
      </header>
      <main style={{ padding: '2rem 0' }}>
        <section style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 10px 28px rgba(0, 0, 0, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem', fontSize: '1.5rem' }}>Liste des élèves</h2>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Consultez le dossier détaillé de chaque élève et préparez les futurs exports.</p>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>{students.length} élève{students.length !== 1 ? 's' : ''} · {allColumns.length} matière{allColumns.length !== 1 ? 's' : ''}</div>
          </div>
        </section>
        <div style={{ maxWidth: '680px', margin: '0 auto 2rem' }}>
          <input type="text" placeholder="Rechercher un élève..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} style={{ width: '100%', padding: '12px 16px', backgroundColor: 'var(--input-bg)', color: 'var(--input-text)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '16px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredStudents.map((eleve) => (
            <article key={eleve.id} style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.35rem', boxShadow: '0 8px 22px rgba(0, 0, 0, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                <div><h3 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', margin: '0 0 0.35rem', fontWeight: 'bold' }}>{eleve.firstName} {eleve.lastName}</h3><p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{eleve.notesCount} note{eleve.notesCount !== 1 ? 's' : ''} · {eleve.subjectsCount} matière{eleve.subjectsCount !== 1 ? 's' : ''}</p></div>
                <div style={{ textAlign: 'right' }}><div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Moyenne</div><div style={{ color: getAverageColor(eleve.average), fontSize: '1.35rem', fontWeight: 'bold' }}>{eleve.average ?? '—'}</div></div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}><Button onClick={() => onEleveSelect(eleve)} variant="premium" size="small">Voir le dossier</Button><Button variant="secondary" size="small" title="Fonction visuelle pour une future transmission">Transférer</Button></div>
            </article>
          ))}
        </div>
        {filteredStudents.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px' }}>{searchTerm ? 'Aucun élève ne correspond à cette recherche.' : 'Aucun élève enregistré.'}</div>}
      </main>
    </div>
  );
}

export default EleveSelectionPage;
