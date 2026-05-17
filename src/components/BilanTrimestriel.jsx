import React, { useState, useEffect } from 'react';

function BilanTrimestriel({ onBack, theme, eleves, setEleves, colonnesBoker = [], setColonnesBoker = () => {}, colonnesFormation = [], setColonnesFormation = () => {} }) {
  const [notesTrimestrielles, setNotesTrimestrielles] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [nomControle, setNomControle] = useState('');
  const [matiereChoisie, setMatiereChoisie] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('notesTrimestrielles');
    if (saved) setNotesTrimestrielles(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('notesTrimestrielles', JSON.stringify(notesTrimestrielles));
  }, [notesTrimestrielles]);

  const updateNote = (eleveId, trimestre, colonneId, value) => {
    setNotesTrimestrielles(prev => ({
      ...prev,
      [eleveId]: {
        ...(prev[eleveId] || {}),
        [trimestre]: {
          ...((prev[eleveId] || {})[trimestre] || {}),
          [colonneId]: value === '' ? null : parseFloat(value)
        }
      }
    }));
  };

  const getNotes = (eleveId, trimestre) => {
    return notesTrimestrielles?.[eleveId]?.[trimestre] || {};
  };

  const calculerMoyenneGroupe = (notes, groupeColonnes) => {
    const valid = groupeColonnes
      .map(c => notes?.[c.id])
      .filter(n => n !== null && n !== '' && n !== undefined && !isNaN(n) && Number(n) !== 0);
    if (valid?.length === 0) return null;
    return (valid.reduce((a, b) => a + parseFloat(b), 0) / valid?.length).toFixed(2);
  };

  const calculerMoyenneTrimestre = (notes) => {
    const toutes = [...colonnesBoker, ...colonnesFormation];
    const valid = toutes
      .map(c => notes?.[c.id])
      .filter(n => n !== null && n !== '' && n !== undefined && !isNaN(n) && Number(n) !== 0);
    if (valid?.length === 0) return null;
    return (valid.reduce((a, b) => a + parseFloat(b), 0) / valid?.length).toFixed(2);
  };

  const calculerMoyenneAnnuelle = (m1, m2, m3) => {
    const valid = [m1, m2, m3].filter(m => m !== null && !isNaN(m));
    if (valid?.length === 0) return null;
    return (valid.reduce((a, b) => a + parseFloat(b), 0) / valid?.length).toFixed(2);
  };

  const getClasseMoyenne = (moyenne) => {
    if (moyenne === null) return '';
    if (moyenne < 50) return 'grade-red';
    if (moyenne < 70) return 'grade-orange';
    return 'grade-green';
  };

  const supprimerEleve = (eleveId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet élève ?')) return;
    setEleves(prev => prev.filter(e => e.id !== eleveId));
    setNotesTrimestrielles(prev => { const u = { ...prev }; delete u[eleveId]; return u; });
  };

  const ajouterControle = () => {
    if (!nomControle.trim() || !matiereChoisie) return;
    const groupeBoker = ['boker_sadot', 'iyun', 'boker_arav', 'halka'];
    const newCol = { id: 'custom_' + Date.now(), nom: nomControle.trim(), matiere: matiereChoisie };
    if (groupeBoker.includes(matiereChoisie)) setColonnesBoker(prev => [...prev, newCol]);
    else setColonnesFormation(prev => [...prev, newCol]);
    setNomControle(''); setMatiereChoisie(''); setShowModal(false);
  };

  const supprimerControle = (colonneId, groupe) => {
    const liste = groupe === 'boker' ? colonnesBoker : colonnesFormation;
    const col = liste.find(c => c.id === colonneId);
    if (!col?.id.startsWith('custom_')) { alert('Impossible de supprimer une matière de base.'); return; }
    if (!window.confirm(`Supprimer le contrôle "${col.nom}" ?`)) return;
    if (groupe === 'boker') setColonnesBoker(prev => prev.filter(c => c.id !== colonneId));
    else setColonnesFormation(prev => prev.filter(c => c.id !== colonneId));
  };

  const thBase = { padding: '10px 8px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', borderBottom: '2px solid var(--border-color)', whiteSpace: 'nowrap' };

  const trimestres = [
    { key: 'T1', label: 'Trimestre 1', color: '#3b82f6', colorDark: '#1e40af', colorBoker: '#5b21b6', colorForm: '#065f46' },
    { key: 'T2', label: 'Trimestre 2', color: '#f59e0b', colorDark: '#d97706', colorBoker: '#5b21b6', colorForm: '#065f46' },
    { key: 'T3', label: 'Trimestre 3', color: '#10b981', colorDark: '#047857', colorBoker: '#5b21b6', colorForm: '#065f46' },
  ];

  const totalColsParTrimestre = colonnesBoker?.length + 1 + colonnesFormation?.length + 1;

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <header style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', padding: '0 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 'bold' }}>📈 Bilan Trimestriel</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowModal(true)} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#059669', color: 'white', border: 'none', cursor: 'pointer' }}>+ Ajouter un contrôle</button>
            <button onClick={onBack} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#6b7280', color: 'white', border: 'none', cursor: 'pointer' }}>← Retour</button>
          </div>
        </div>
      </header>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '2rem', borderRadius: '12px', minWidth: '400px', border: '1px solid var(--border-color)' }}>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Nouveau contrôle</h2>
            <input type="text" value={nomControle} onChange={e => setNomControle(e.target.value)} placeholder="Ex: Contrôle 3, Devoir maison..."
              style={{ width: '100%', padding: '8px', marginBottom: '1rem', backgroundColor: 'var(--input-bg)', color: 'var(--input-text)', border: '1px solid var(--border-color)', borderRadius: '6px' }} />
            <select value={matiereChoisie} onChange={e => setMatiereChoisie(e.target.value)}
              style={{ width: '100%', padding: '8px', marginBottom: '1rem', backgroundColor: 'var(--input-bg)', color: 'var(--input-text)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
              <option value="">Choisir une matière...</option>
              <optgroup label="בוקר"><option value="boker_sadot">חסידות בוקר</option><option value="iyun">עיון</option><option value="boker_arav">חסידות ערב</option><option value="halka">הלכה</option></optgroup>
              <optgroup label="Formation Professionnelle"><option value="graphisme">Graphisme</option><option value="marketing">Marketing</option><option value="developpement">Développement</option><option value="ia">IA</option><option value="francais">Français</option></optgroup>
            </select>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); setNomControle(''); setMatiereChoisie(''); }} style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#6b7280', color: 'white', border: 'none', cursor: 'pointer' }}>Annuler</button>
              <button onClick={ajouterControle} disabled={!nomControle.trim() || !matiereChoisie} style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: (!nomControle.trim() || !matiereChoisie) ? '#9ca3af' : '#059669', color: 'white', border: 'none', cursor: 'pointer' }}>Ajouter</button>
            </div>
          </div>
        </div>
      )}

      <main style={{ padding: '1.5rem 1rem' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ borderCollapse: 'collapse', minWidth: 'max-content' }}>
            <thead>

              {/* LIGNE 1 — Trimestres */}
              <tr>
                <th rowSpan={3} style={{ ...thBase, textAlign: 'left', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-header)', position: 'sticky', left: 0, zIndex: 4, minWidth: '160px', verticalAlign: 'middle' }}>
                  Nom de l'élève
                </th>
                {trimestres.map(t => (
                  <th key={t.key} colSpan={totalColsParTrimestre} style={{ ...thBase, backgroundColor: t.color, color: 'white', fontSize: '14px' }}>
                    {t.label}
                  </th>
                ))}
                <th rowSpan={3} style={{ ...thBase, backgroundColor: '#1f2937', color: 'white', minWidth: '130px', verticalAlign: 'middle', position: 'sticky', right: 0, zIndex: 4 }}>
                  Moyenne Annuelle
                </th>
                <th rowSpan={3} style={{ ...thBase, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-header)', position: 'sticky', right: 0, zIndex: 4, minWidth: '120px', verticalAlign: 'middle' }}>
                  Actions
                </th>
              </tr>

              {/* LIGNE 2 — Groupes בוקר / Formation + Moy. T */}
              <tr>
                {trimestres.map(t => (
                  <React.Fragment key={t.key}>
                    <th colSpan={colonnesBoker?.length} style={{ ...thBase, backgroundColor: '#7c3aed', color: 'white', fontSize: '11px' }}>בוקר</th>
                    <th rowSpan={2} style={{ ...thBase, backgroundColor: '#5b21b6', color: 'white', minWidth: '100px', verticalAlign: 'middle' }}>Moy. בוקר</th>
                    <th colSpan={colonnesFormation?.length} style={{ ...thBase, backgroundColor: '#059669', color: 'white', fontSize: '11px' }}>Formation Pro</th>
                    <th rowSpan={2} style={{ ...thBase, backgroundColor: '#065f46', color: 'white', minWidth: '100px', verticalAlign: 'middle' }}>Moy. Formation</th>
                  </React.Fragment>
                ))}
              </tr>

              {/* LIGNE 3 — Noms des matières */}
              <tr>
                {trimestres.map(t => (
                  <React.Fragment key={t.key}>
                    {colonnesBoker.map(col => (
                      <th key={`${t.key}-${col.id}`} style={{ ...thBase, backgroundColor: '#8b5cf6', color: 'white', direction: 'rtl', minWidth: '90px', fontSize: '11px' }}>
                        <div>{col.nom}</div>
                        {col.id.startsWith('custom_') && t.key === 'T1' && (
                          <button onClick={() => supprimerControle(col.id, 'boker')} style={{ fontSize: '10px', color: '#fca5a5', background: 'none', border: 'none', cursor: 'pointer' }}>🗑</button>
                        )}
                      </th>
                    ))}
                    {colonnesFormation.map(col => (
                      <th key={`${t.key}-${col.id}`} style={{ ...thBase, backgroundColor: '#10b981', color: 'white', minWidth: '90px', fontSize: '11px' }}>
                        <div>{col.nom}</div>
                        {col.id.startsWith('custom_') && t.key === 'T1' && (
                          <button onClick={() => supprimerControle(col.id, 'formation')} style={{ fontSize: '10px', color: '#fca5a5', background: 'none', border: 'none', cursor: 'pointer' }}>🗑</button>
                        )}
                      </th>
                    ))}
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody>
              {eleves.map((eleve, i) => {
                const rowBg = i % 2 === 0 ? 'var(--bg-table)' : 'var(--bg-secondary)';
                const notesT1 = getNotes(eleve.id, 'T1');
                const notesT2 = getNotes(eleve.id, 'T2');
                const notesT3 = getNotes(eleve.id, 'T3');
                const moyT1 = calculerMoyenneTrimestre(notesT1);
                const moyT2 = calculerMoyenneTrimestre(notesT2);
                const moyT3 = calculerMoyenneTrimestre(notesT3);
                const moyAnnuelle = calculerMoyenneAnnuelle(moyT1, moyT2, moyT3);

                const renderNotesTrimestre = (trimKey, notes) => (
                  <React.Fragment key={trimKey}>
                    {colonnesBoker.map(col => (
                      <td key={`${trimKey}-${col.id}`} style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
                        <input type="number" min="0" max="100" step="0.5"
                          value={notes[col.id] ?? ''}
                          onChange={e => { let v = e.target.value; if (v !== '' && parseFloat(v) > 100) v = '100'; updateNote(eleve.id, trimKey, col.id, v); }}
                          style={{ width: '60px', textAlign: 'center', padding: '3px', backgroundColor: 'var(--input-bg)', color: 'var(--input-text)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                          placeholder="—" />
                      </td>
                    ))}
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#ede9fe', borderBottom: '1px solid var(--border-color)' }}>
                      <span className={getClasseMoyenne(calculerMoyenneGroupe(notes, colonnesBoker))}>
                        {calculerMoyenneGroupe(notes, colonnesBoker) ?? '—'}
                      </span>
                    </td>
                    {colonnesFormation.map(col => (
                      <td key={`${trimKey}-${col.id}`} style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
                        <input type="number" min="0" max="100" step="0.5"
                          value={notes[col.id] ?? ''}
                          onChange={e => { let v = e.target.value; if (v !== '' && parseFloat(v) > 100) v = '100'; updateNote(eleve.id, trimKey, col.id, v); }}
                          style={{ width: '60px', textAlign: 'center', padding: '3px', backgroundColor: 'var(--input-bg)', color: 'var(--input-text)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                          placeholder="—" />
                      </td>
                    ))}
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#d1fae5', borderBottom: '1px solid var(--border-color)' }}>
                      <span className={getClasseMoyenne(calculerMoyenneGroupe(notes, colonnesFormation))}>
                        {calculerMoyenneGroupe(notes, colonnesFormation) ?? '—'}
                      </span>
                    </td>
                  </React.Fragment>
                );

                return (
                  <tr key={eleve.id} style={{ backgroundColor: rowBg }}>
                    <td style={{ padding: '10px 16px', fontWeight: 'bold', color: 'var(--text-primary)', backgroundColor: i % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-table)', position: 'sticky', left: 0, zIndex: 1, borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>
                      {eleve.firstName} {eleve.lastName}
                    </td>
                    {renderNotesTrimestre('T1', notesT1)}
                    {renderNotesTrimestre('T2', notesT2)}
                    {renderNotesTrimestre('T3', notesT3)}
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f3f4f6', borderBottom: '1px solid var(--border-color)', position: 'sticky', right: 0, zIndex: 1 }}>
                      <span className={getClasseMoyenne(moyAnnuelle)}>{moyAnnuelle ?? '—'}</span>
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', position: 'sticky', right: 0, zIndex: 1, backgroundColor: rowBg, borderBottom: '1px solid var(--border-color)' }}>
                      <button onClick={() => supprimerEleve(eleve.id)} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>🗑 Supprimer</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default BilanTrimestriel;