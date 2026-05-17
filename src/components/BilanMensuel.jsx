import React, { useState, useEffect } from 'react';
import NoteInput from './NoteInput';

function BilanMensuel({ onBack, theme, eleves, setEleves, colonnesBoker, setColonnesBoker, colonnesFormation, setColonnesFormation, notesMensuelles, setNotesMensuelles, semaineActuelle }) {
  const [showModal, setShowModal] = useState(false);
  const [nomControle, setNomControle] = useState('');
  const [matiereChoisie, setMatiereChoisie] = useState('');
  const [commentaires, setCommentaires] = useState({});

  // Charger et sauvegarder les commentaires
  useEffect(() => {
    const savedCommentaires = localStorage.getItem('commentairesMensuels');
    if (savedCommentaires) {
      setCommentaires(JSON.parse(savedCommentaires));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('commentairesMensuels', JSON.stringify(commentaires));
  }, [commentaires]);

  // Mettre à jour le commentaire d'un élève
  const updateCommentaire = (eleveId, commentaire) => {
    setCommentaires(prev => ({
      ...prev,
      [eleveId]: commentaire
    }));
  };

  const calculerMoyenneMatiere = (notes) => {
    if (!Array.isArray(notes)) return null;

    const notesValides = notes.filter(
      n => n !== null && n !== undefined && n !== '' && !isNaN(n) && Number(n) !== 0
    );

    if (notesValides.length === 0) return null;

    const somme = notesValides.reduce(
      (acc, n) => acc + Number(n),
      0
    );

    return (somme / notesValides.length).toFixed(1);
  };

  const calculerMoyenneGroupe = (eleveNotes, groupeColonnes) => {
    const valid = groupeColonnes
      .map(c => calculerMoyenneMatiere(notesMensuelles?.[eleveNotes]?.[c.id]))
      .filter(n => n !== null && n !== undefined && !isNaN(n));
    if (valid.length === 0) return null;
    return (valid.reduce((a, b) => a + parseFloat(b), 0) / valid.length).toFixed(2);
  };

  const calculerMoyenneGenerale = (eleveNotes) => {
    const toutes = [...colonnesBoker, ...colonnesFormation];
    const valid = toutes
      .map(c => calculerMoyenneMatiere(notesMensuelles?.[eleveNotes]?.[c.id]))
      .filter(n => n !== null && n !== undefined && !isNaN(n));
    if (valid.length === 0) return null;
    return (valid.reduce((a, b) => a + parseFloat(b), 0) / valid.length).toFixed(2);
  };

  const getClasseMoyenne = (moyenne) => {
    if (moyenne === null) return '';
    if (moyenne < 50) return 'grade-red';
    if (moyenne < 70) return 'grade-orange';
    return 'grade-green';
  };

  const updateNote = (eleveId, matiereId, noteNum, value) => {
    const noteValue = value === '' ? null : parseFloat(value);
    
    setNotesMensuelles(prev => {
      const copy = structuredClone(prev);
      
      if (!copy[eleveId]) copy[eleveId] = {};
      if (!copy[eleveId][matiereId]) {
        copy[eleveId][matiereId] = [null, null, null, null];
      }
      
      copy[eleveId][matiereId][noteNum - 1] = noteValue;
      
      return copy;
    });
  };

  const supprimerEleve = (eleveId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet élève ?')) return;
    setEleves(prev => prev.filter(e => e.id !== eleveId));
    setNotesMensuelles(prev => { const u = { ...prev }; delete u[eleveId]; return u; });
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
    const colonne = liste.find(c => c.id === colonneId);
    if (!colonne?.id.startsWith('custom_')) { alert('Impossible de supprimer une matière de base.'); return; }
    if (!window.confirm(`Supprimer le contrôle "${colonne.nom}" ?`)) return;
    if (groupe === 'boker') setColonnesBoker(prev => prev.filter(c => c.id !== colonneId));
    else setColonnesFormation(prev => prev.filter(c => c.id !== colonneId));
    setNotesMensuelles(prev => {
      const u = { ...prev };
      Object.keys(u).forEach(id => { const c = { ...u[id] }; delete c[colonneId]; u[id] = c; });
      return u;
    });
  };

  const resetNotes = () => {
    if (!window.confirm(`Voulez-vous vraiment réinitialiser toutes les notes du bulletin mensuel ?\nCette action effacera toutes les notes N1, N2, N3, N4 pour tous les élèves.`)) return;
    
    setNotesMensuelles({});
  };

  const thBase = { padding: '14px', textAlign: 'center', fontSize: '15px', fontWeight: 'bold', borderBottom: '2px solid var(--border-color)', whiteSpace: 'nowrap' };

  
  return (
    <div style={{ 
      backgroundColor: 'var(--bg-primary)', 
      minHeight: '92vh',
      width: '98vw',
      maxWidth: 'none',
      margin: '0',
      padding: '24px 32px'
    }}>
      <header style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', padding: '0 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          <button onClick={onBack} style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ← Retour
          </button>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>Bulletin Mensuel</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={resetNotes} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#dc2626', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🔄 Réinitialiser les notes
            </button>
          </div>
        </div>
      </header>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
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
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1400px' }}>
            <thead>
              {/* LIGNE 1 — Groupes */}
              <tr>
                <th rowSpan={3} style={{ ...thBase, textAlign: 'left', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-header)', position: 'sticky', left: 0, zIndex: 4, minWidth: '160px', verticalAlign: 'middle' }}>Nom de l'élève</th>
                <th colSpan={colonnesBoker.length * 4} style={{ ...thBase, backgroundColor: '#7c3aed', color: 'white' }}>בוקר</th>
                <th rowSpan={3} style={{ ...thBase, backgroundColor: '#5b21b6', color: 'white', minWidth: '110px', verticalAlign: 'middle' }}>Moy. בוקר</th>
                <th colSpan={colonnesFormation.length * 4} style={{ ...thBase, backgroundColor: '#059669', color: 'white' }}>Formation Professionnelle</th>
                <th rowSpan={3} style={{ ...thBase, backgroundColor: '#065f46', color: 'white', minWidth: '110px', verticalAlign: 'middle' }}>Moy. Formation</th>
                <th rowSpan={3} style={{ ...thBase, backgroundColor: '#1f2937', color: 'white', minWidth: '130px', verticalAlign: 'middle' }}>Moyenne Générale</th>
                <th rowSpan={3} style={{ ...thBase, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-header)', position: 'sticky', right: 0, zIndex: 4, minWidth: '120px', verticalAlign: 'middle' }}>Actions</th>
              </tr>
              
              {/* LIGNE 2 — Matières */}
              <tr>
                {Array.isArray(colonnesBoker) && colonnesBoker.map(col => (
                  <th key={col.id} colSpan={4} style={{ ...thBase, backgroundColor: '#8b5cf6', color: 'white', direction: 'rtl' }}>{col.nom}</th>
                ))}
                {Array.isArray(colonnesFormation) && colonnesFormation.map(col => (
                  <th key={col.id} colSpan={4} style={{ ...thBase, backgroundColor: '#10b981', color: 'white' }}>{col.nom}</th>
                ))}
              </tr>
              
              {/* LIGNE 3 — Notes de la semaine active */}
              <tr>
                {Array.isArray(colonnesBoker) && colonnesBoker.map(col => (
                  <React.Fragment key={col.id}>
                    {[1, 2, 3, 4].map(noteNum => (
                      <th key={`${col.id}_note${noteNum}`} style={{ ...thBase, backgroundColor: '#6366f1', color: 'white', fontSize: '10px', minWidth: '60px' }}>N{noteNum}</th>
                    ))}
                  </React.Fragment>
                ))}
                {Array.isArray(colonnesFormation) && colonnesFormation.map(col => (
                  <React.Fragment key={col.id}>
                    {[1, 2, 3, 4].map(noteNum => (
                      <th key={`${col.id}_note${noteNum}`} style={{ ...thBase, backgroundColor: '#047857', color: 'white', fontSize: '10px', minWidth: '60px' }}>N{noteNum}</th>
                    ))}
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.isArray(eleves) && eleves.map((eleve, i) => {
                const eleveNotes = notesMensuelles[eleve.id] || {};
                const moyBoker = calculerMoyenneGroupe(eleveNotes, colonnesBoker);
                const moyFormation = calculerMoyenneGroupe(eleveNotes, colonnesFormation);
                const moyGenerale = calculerMoyenneGenerale(eleveNotes);
                const rowBg = i % 2 === 0 ? 'var(--bg-table)' : 'var(--bg-secondary)';
                return (
                  <tr key={eleve.id} style={{ backgroundColor: rowBg }}>
                    <td style={{ padding: '14px 18px', fontWeight: 'bold', color: 'var(--text-primary)', backgroundColor: i % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-table)', position: 'sticky', left: 0, zIndex: 1, borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap', fontSize: '15px' }}>
                      {eleve.firstName} {eleve.lastName}
                    </td>
                    {Array.isArray(colonnesBoker) && colonnesBoker.map(col => (
                      <React.Fragment key={col.id}>
                        {[1, 2, 3, 4].map(noteNum => {
                          const value = eleveNotes?.[col.id]?.[noteNum - 1];
                          return (
                            <td key={`${col.id}_note${noteNum}`} style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
                              <NoteInput 
                                key={`${eleve.id}-${col.id}-note${noteNum}`}
                                value={value}
                                onChange={v => updateNote(eleve.id, col.id, noteNum, v)}
                                width="55px"
                              />
                            </td>
                          );
                        })}
                      </React.Fragment>
                    ))}
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#ede9fe', borderBottom: '1px solid var(--border-color)' }}>
                      <span className={getClasseMoyenne(moyBoker)}>{moyBoker ?? '—'}</span>
                    </td>
                    {Array.isArray(colonnesFormation) && colonnesFormation.map(col => (
                      <React.Fragment key={col.id}>
                        {[1, 2, 3, 4].map(noteNum => {
                          const value = eleveNotes?.[col.id]?.[noteNum - 1];
                          return (
                            <td key={`${col.id}_note${noteNum}`} style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
                              <NoteInput 
                                key={`${eleve.id}-${col.id}-note${noteNum}`}
                                value={value}
                                onChange={v => updateNote(eleve.id, col.id, noteNum, v)}
                                width="55px"
                              />
                            </td>
                          );
                        })}
                      </React.Fragment>
                    ))}
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#d1fae5', borderBottom: '1px solid var(--border-color)' }}>
                      <span className={getClasseMoyenne(moyFormation)}>{moyFormation ?? '—'}</span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f3f4f6', borderBottom: '1px solid var(--border-color)' }}>
                      <span className={getClasseMoyenne(moyGenerale)}>{moyGenerale ?? '—'}</span>
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', position: 'sticky', right: 0, zIndex: 1, backgroundColor: rowBg, borderBottom: '1px solid var(--border-color)' }}>
                      <button onClick={() => supprimerEleve(eleve.id)} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>🗑 Supprimer</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Section Commentaires Professeur */}
          <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '18px', fontWeight: 'bold' }}>
              📝 Commentaires du professeur
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {eleves.map((eleve, i) => (
                <div key={`commentaire-${eleve.id}`} style={{
                  backgroundColor: 'var(--bg-primary)',
                  padding: '1rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{
                    fontWeight: 'bold',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
                    fontSize: '14px'
                  }}>
                    {eleve.firstName} {eleve.lastName}
                  </div>
                  <textarea
                    value={commentaires[eleve.id] || ''}
                    onChange={(e) => updateCommentaire(eleve.id, e.target.value)}
                    placeholder="Ajouter une appréciation..."
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '8px 12px',
                      backgroundColor: 'var(--input-bg)',
                      color: 'var(--input-text)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      lineHeight: '1.4'
                    }}
                  />
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    marginTop: '4px',
                    textAlign: 'right'
                  }}>
                    {(commentaires[eleve.id] || '').length} caractères
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default BilanMensuel;