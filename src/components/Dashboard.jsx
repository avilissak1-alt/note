import React, { useState, useEffect, useRef } from 'react';
import NoteInput from './NoteInput';

const initialEleves = [
  { id: 1, firstName: "Avi", lastName: "Lissak", grades: { boker_sadot: 75, iyun: 60, boker_arav: 70, halka: 65, graphisme: 80, marketing: 55, developpement: 85, ia: 70, francais: 75 } },
  { id: 2, firstName: "Ethan", lastName: "Ben-Jakob", grades: { boker_sadot: 90, iyun: 80, boker_arav: 75, halka: 70, graphisme: 85, marketing: 80, developpement: 90, ia: 85, francais: 88 } },
  { id: 3, firstName: "Aaron", lastName: "Jaoui", grades: { boker_sadot: 60, iyun: 70, boker_arav: 65, halka: 75, graphisme: 70, marketing: 65, developpement: 75, ia: 72, francais: 68 } },
  { id: 4, firstName: "Aaron", lastName: "Assaraf", grades: { boker_sadot: 80, iyun: 75, boker_arav: 85, halka: 80, graphisme: 90, marketing: 85, developpement: 95, ia: 92, francais: 87 } },
  { id: 5, firstName: "Menahem Mendel", lastName: "Mouly", grades: { boker_sadot: 70, iyun: 65, boker_arav: 60, halka: 70, graphisme: 75, marketing: 70, developpement: 80, ia: 78, francais: 82 } },
  { id: 6, firstName: "Menahem Mendel", lastName: "Guedj", grades: { boker_sadot: 85, iyun: 70, boker_arav: 75, halka: 80, graphisme: 80, marketing: 75, developpement: 85, ia: 80, francais: 85 } },
  { id: 7, firstName: "Menahem Mendel", lastName: "Sitbon", grades: { boker_sadot: 75, iyun: 80, boker_arav: 70, halka: 75, graphisme: 85, marketing: 70, developpement: 80, ia: 85, francais: 80 } },
  { id: 8, firstName: "Mickael", lastName: "Bensimon", grades: { boker_sadot: 90, iyun: 85, boker_arav: 80, halka: 85, graphisme: 90, marketing: 85, developpement: 95, ia: 90, francais: 88 } },
  { id: 9, firstName: "Levi", lastName: "Attal", grades: { boker_sadot: 80, iyun: 75, boker_arav: 85, halka: 80, graphisme: 85, marketing: 80, developpement: 90, ia: 85, francais: 87 } },
  { id: 10, firstName: "Alexander", lastName: "Brodowitz", grades: { boker_sadot: 85, iyun: 80, boker_arav: 75, halka: 85, graphisme: 80, marketing: 85, developpement: 85, ia: 88, francais: 82 } },
  { id: 11, firstName: "Levi", lastName: "Touaty", grades: { boker_sadot: 75, iyun: 70, boker_arav: 80, halka: 75, graphisme: 80, marketing: 75, developpement: 85, ia: 80, francais: 85 } },
  { id: 12, firstName: "Gabriel", lastName: "Zekri", grades: { boker_sadot: 80, iyun: 85, boker_arav: 75, halka: 80, graphisme: 85, marketing: 80, developpement: 90, ia: 85, francais: 88 } }
];

function Dashboard({ onMensuel, onTrimestriel, onInspectEleve, onLogout, theme, onToggleTheme, eleves, setEleves, colonnesBoker, setColonnesBoker, colonnesFormation, setColonnesFormation, notesMensuelles, setNotesMensuelles, semaineActuelle }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEleve, setNewEleve] = useState({ firstName: '', lastName: '' });
  const [showModal, setShowModal] = useState(false);
  const [nomControle, setNomControle] = useState('');
  const [matiereChoisie, setMatiereChoisie] = useState('');
  const [expandedEleves, setExpandedEleves] = useState(new Set());
  
  // Ref pour capturer la semaine actuelle au moment de la création des fonctions
  const semaineRef = useRef(semaineActuelle);
  
  useEffect(() => {
    semaineRef.current = semaineActuelle;
  }, [semaineActuelle]);

  // Gérer l'accordéon
  const toggleEleve = (eleveId) => {
    setExpandedEleves(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eleveId)) {
        newSet.delete(eleveId);
      } else {
        newSet.add(eleveId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (eleves.length === 0) setEleves([...initialEleves]);
  }, [eleves, setEleves]);

  const calculerMoyenneGroupe = (eleveId, groupeColonnes) => {
  const valid = groupeColonnes
    .map(c => notesMensuelles?.[eleveId]?.[c.id]?.[semaineActuelle - 1])
    .filter(n => n !== null && n !== '' && n !== undefined && !isNaN(n) && Number(n) !== 0);
  if (valid.length === 0) return null;
  return (valid.reduce((a, b) => a + parseFloat(b), 0) / valid.length).toFixed(2);
};

const calculerMoyenneGenerale = (eleveId) => {
  const toutes = [...colonnesBoker, ...colonnesFormation];
  const valid = toutes
    .map(c => notesMensuelles?.[eleveId]?.[c.id]?.[semaineActuelle - 1])
    .filter(n => n !== null && n !== '' && n !== undefined && !isNaN(n) && Number(n) !== 0);
  if (valid.length === 0) return null;
  return (valid.reduce((a, b) => a + parseFloat(b), 0) / valid.length).toFixed(2);
};

  const getClasseMoyenne = (moyenne) => {
    if (moyenne === null) return '';
    if (moyenne < 50) return 'grade-red';
    if (moyenne < 70) return 'grade-orange';
    return 'grade-green';
  };

  // Composant pour afficher une matière avec ses notes
  const MatiereRow = ({ eleveId, col, isBoker }) => {
    const notes = notesMensuelles?.[eleveId]?.[col.id] || [null, null, null, null];
    const validNotes = notes.filter(n => n !== null && n !== '' && n !== undefined && !isNaN(n) && Number(n) !== 0);
    const moyenne = validNotes.length > 0 
      ? (validNotes.reduce((a, b) => a + parseFloat(b), 0) / validNotes.length).toFixed(2)
      : null;

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-primary)',
        gap: '12px'
      }}>
        <div style={{
          flex: '0 0 120px',
          fontSize: '13px',
          fontWeight: '500',
          color: 'var(--text-primary)',
          direction: isBoker ? 'rtl' : 'ltr'
        }}>
          {col.nom}
          {col.id.startsWith('custom_') && (
            <button 
              onClick={() => supprimerControle(col.id, isBoker ? 'boker' : 'formation')}
              style={{ 
                fontSize: '10px', 
                color: '#ef4444', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                marginLeft: '4px' 
              }}
            >
              🗑
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
          {[0, 1, 2, 3].map(index => (
            <div key={index} style={{ flex: '0 0 55px' }}>
              <NoteInput 
                key={`${eleveId}-${col.id}-note${index}`}
                value={notes[index] ?? ''}
                onChange={v => {
                  // Mise à jour directe dans notesMensuelles
                  const noteValue = v === '' ? null : parseFloat(v);
                  setNotesMensuelles(prev => {
                    const copy = structuredClone(prev);
                    if (!copy[eleveId]) copy[eleveId] = {};
                    if (!copy[eleveId][col.id]) {
                      copy[eleveId][col.id] = [null, null, null, null];
                    }
                    copy[eleveId][col.id][index] = noteValue;
                    return copy;
                  });
                }}
                width="55px"
              />
            </div>
          ))}
        </div>
        
        <div style={{
          flex: '0 0 50px',
          fontSize: '13px',
          fontWeight: 'bold',
          textAlign: 'center',
          color: 'var(--text-primary)',
          backgroundColor: isBoker ? '#ede9fe' : '#d1fae5',
          padding: '4px 8px',
          borderRadius: '4px'
        }}>
          <span className={getClasseMoyenne(moyenne)}>{moyenne ?? '—'}</span>
        </div>
      </div>
    );
  };

  const ajouterEleve = () => {
    if (newEleve.firstName && newEleve.lastName) {
      const eleve = {
        id: Date.now(),
        firstName: newEleve.firstName,
        lastName: newEleve.lastName,
        grades: {}
      };
      setEleves([...eleves, eleve]);
      setNewEleve({ firstName: '', lastName: '' });
      setShowAddForm(false);
    }
  };

  const supprimerEleve = (eleveId) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet élève ?')) {
      setEleves(eleves.filter(e => e.id !== eleveId));
    }
  };

const updateGrade = (eleveId, colonneId, value) => {
  const noteValue = value === '' ? null : parseFloat(value);
  
  const index = semaineActuelle - 1;

  setNotesMensuelles(prev => {
    const copy = structuredClone(prev);

    if (!copy[eleveId]) {
      copy[eleveId] = {};
    }

    if (!copy[eleveId][colonneId]) {
      copy[eleveId][colonneId] = [
        null,
        null,
        null,
        null
      ];
    }

    copy[eleveId][colonneId][index] = noteValue;

    return copy;
  });
};
  const ajouterControle = () => {
    if (!nomControle.trim() || !matiereChoisie) return;
    const groupeBoker = ['boker_sadot', 'iyun', 'boker_arav', 'halka'];
    const newCol = { id: 'custom_' + Date.now(), nom: nomControle.trim(), matiere: matiereChoisie };
    if (groupeBoker.includes(matiereChoisie)) {
      setColonnesBoker(prev => [...prev, newCol]);
    } else {
      setColonnesFormation(prev => [...prev, newCol]);
    }
    setNomControle('');
    setMatiereChoisie('');
    setShowModal(false);
  };

  const supprimerControle = (colonneId, groupe) => {
    const liste = groupe === 'boker' ? colonnesBoker : colonnesFormation;
    const colonne = liste.find(c => c.id === colonneId);
    if (!colonne?.id.startsWith('custom_')) { alert('Impossible de supprimer une matière de base.'); return; }
    if (!window.confirm(`Supprimer le contrôle "${colonne.nom}" ?`)) return;
    if (groupe === 'boker') setColonnesBoker(prev => prev.filter(c => c.id !== colonneId));
    else setColonnesFormation(prev => prev.filter(c => c.id !== colonneId));
  };

  const reinitialiserToutesNotes = () => {
    if (window.confirm('Réinitialiser toutes les notes ?')) {
      setNotesMensuelles({});
    }
  };

  const thBase = {
    padding: '10px 8px',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    borderBottom: '2px solid var(--border-color)',
    whiteSpace: 'nowrap'
  };

  console.log('Dashboard render - eleves:', eleves);
console.log('Dashboard render - colonnesBoker:', colonnesBoker);
console.log('Dashboard render - colonnesFormation:', colonnesFormation);
console.log('Dashboard render - notesMensuelles:', notesMensuelles);

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', width: '100vw', overflowX: 'hidden' }}>

      {/* En-tête */}
      <header style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', padding: '0 1.5rem' }}>
        {console.log("HEADER RENDER - Recherche carré blanc")}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 'bold' }}>Gestion des Notes Scolaires</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={onToggleTheme} className="premium-button" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Palatino, Palatino Linotype, serif' }}>
              <span style={{ fontSize: '16px' }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{theme === 'dark' ? 'Clair' : 'Sombre'}</span>
            </button>
            <button onClick={onLogout} style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#ef4444', color: 'white', border: 'none' }}>
              Se déconnecter
            </button>
          </div>
        </div>
      </header>

      {/* Boutons d'action */}
      <div style={{ padding: '1rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <button onClick={() => setShowAddForm(!showAddForm)} className="premium-button" style={{ fontFamily: 'Palatino, Palatino Linotype, serif' }}>+ Ajouter un élève</button>
        <button onClick={() => setShowModal(true)} className="premium-button" style={{ fontFamily: 'Palatino, Palatino Linotype, serif' }}>+ Ajouter un contrôle</button>
        <button onClick={reinitialiserToutesNotes} className="premium-button" style={{ fontFamily: 'Palatino, Palatino Linotype, serif' }}>Réinitialiser les notes</button>
        <button onClick={onMensuel} className="premium-button glow-effect" style={{ fontFamily: 'Palatino, Palatino Linotype, serif', fontWeight: '600' }}>📊 Bilan Mensuel</button>
        <button onClick={onTrimestriel} className="premium-button" style={{ fontFamily: 'Palatino, Palatino Linotype, serif', fontWeight: '600' }}>📈 Bilan Trimestriel</button>
        <button onClick={onInspectEleve} className="premium-button glow-effect" style={{ fontFamily: 'Palatino, Palatino Linotype, serif', fontWeight: '600' }}>🔍 Inspecter Élève</button>
      </div>

      {/* Formulaire ajout élève */}
      {showAddForm && (
        <div style={{ margin: '0 1.5rem 1rem', padding: '1rem', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Ajouter un nouvel élève</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Prénom" value={newEleve.firstName} onChange={e => setNewEleve({ ...newEleve, firstName: e.target.value })} style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--input-bg)', color: 'var(--input-text)', border: '1px solid var(--border-color)', minWidth: '150px' }} />
            <input type="text" placeholder="Nom" value={newEleve.lastName} onChange={e => setNewEleve({ ...newEleve, lastName: e.target.value })} style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--input-bg)', color: 'var(--input-text)', border: '1px solid var(--border-color)', minWidth: '150px' }} />
            <button onClick={ajouterEleve} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#059669', color: 'white', border: 'none', cursor: 'pointer' }}>Confirmer</button>
            <button onClick={() => setShowAddForm(false)} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#6b7280', color: 'white', border: 'none', cursor: 'pointer' }}>Annuler</button>
          </div>
        </div>
      )}

      {/* Modal ajout contrôle */}
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
              <optgroup label="בוקר">
                <option value="boker_sadot">חסידות בוקר</option>
                <option value="iyun">עיון</option>
                <option value="boker_arav">חסידות ערב</option>
                <option value="halka">הלכה</option>
              </optgroup>
              <optgroup label="Formation Professionnelle">
                <option value="graphisme">Graphisme</option>
                <option value="marketing">Marketing</option>
                <option value="developpement">Développement</option>
                <option value="ia">IA</option>
                <option value="francais">Français</option>
              </optgroup>
            </select>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); setNomControle(''); setMatiereChoisie(''); }} style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#6b7280', color: 'white', border: 'none', cursor: 'pointer' }}>Annuler</button>
              <button onClick={ajouterControle} disabled={!nomControle.trim() || !matiereChoisie}
                style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: (!nomControle.trim() || !matiereChoisie) ? '#9ca3af' : '#8b5cf6', color: 'white', border: 'none', cursor: 'pointer' }}>
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tableau classique du Dashboard */}
      <div style={{ padding: '1.5rem', maxWidth: 'none', overflowX: 'auto' }}>
        <div style={{
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          backgroundColor: 'var(--bg-primary)',
          overflow: 'hidden'
        }}>
          <table style={{ 
            borderCollapse: 'collapse', 
            width: '100%', 
            minWidth: '1200px'
          }}>
            <thead>
              <tr>
                <th style={{
                  padding: '10px 16px',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  borderBottom: '2px solid var(--border-color)',
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                  minWidth: '150px'
                }}>
                  Élève
                </th>
                
                {/* Matières בוקר */}
                {Array.isArray(colonnesBoker) && colonnesBoker.map(col => (
                  <th key={col.id} style={{
                    padding: '10px 16px',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    borderBottom: '2px solid var(--border-color)',
                    direction: 'rtl',
                    minWidth: '120px'
                  }}>
                    <div>{col.nom}</div>
                    {col.id.startsWith('custom_') && (
                      <button 
                        onClick={() => supprimerControle(col.id, 'boker')}
                        style={{ 
                          fontSize: '10px', 
                          color: '#fca5a5', 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          marginTop: '2px' 
                        }}
                      >
                        🗑
                      </button>
                    )}
                  </th>
                ))}

                {/* Matières Formation */}
                {Array.isArray(colonnesFormation) && colonnesFormation.map(col => (
                  <th key={col.id} style={{
                    padding: '10px 16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    borderBottom: '2px solid var(--border-color)',
                    minWidth: '120px'
                  }}>
                    <div>{col.nom}</div>
                    {col.id.startsWith('custom_') && (
                      <button 
                        onClick={() => supprimerControle(col.id, 'formation')}
                        style={{ 
                          fontSize: '10px', 
                          color: '#fca5a5', 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          marginTop: '2px' 
                        }}
                      >
                        🗑
                      </button>
                    )}
                  </th>
                ))}

                {/* Moyenne Générale */}
                <th style={{
                  padding: '12px 16px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  borderBottom: '2px solid var(--border-color)',
                  minWidth: '80px'
                }}>
                  Moyenne
                </th>

                {/* Actions */}
                <th style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  borderBottom: '2px solid var(--border-color)',
                  position: 'sticky',
                  right: 0,
                  zIndex: 3,
                  minWidth: '100px'
                }}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {Array.isArray(eleves) && eleves.map((eleve, i) => {
                const moyGenerale = calculerMoyenneGenerale(eleve.id);
                const rowBg = i % 2 === 0 ? 'var(--bg-table)' : 'var(--bg-secondary)';

                return (
                  <tr key={eleve.id} style={{ backgroundColor: rowBg }}>
                    {/* Nom de l'élève */}
                    <td style={{
                      padding: '10px 16px',
                      fontWeight: 'bold',
                      color: 'var(--text-primary)',
                      backgroundColor: i % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-table)',
                      position: 'sticky',
                      left: 0,
                      zIndex: 1,
                      borderBottom: '1px solid var(--border-color)',
                      whiteSpace: 'nowrap'
                    }}>
                      {eleve.firstName} {eleve.lastName}
                    </td>

                    {/* Notes בוקר - 1 seule case par matière selon semaine active */}
                    {Array.isArray(colonnesBoker) && colonnesBoker.map(col => (
                      <td key={col.id} style={{
                        padding: '6px',
                        textAlign: 'center',
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-primary)'
                      }}>
                        <NoteInput 
                          key={`${eleve.id}-${col.id}-${semaineActuelle}`}
                          value={
                            notesMensuelles?.[eleve.id]
                            ?.[col.id]
                            ?.[semaineActuelle - 1] ?? ''
                          }
                          onChange={v => updateGrade(eleve.id, col.id, v)}
                          width="80px"
                        />
                      </td>
                    ))}

                    {/* Notes Formation - 1 seule case par matière selon semaine active */}
                    {Array.isArray(colonnesFormation) && colonnesFormation.map(col => (
                      <td key={col.id} style={{
                        padding: '6px',
                        textAlign: 'center',
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-primary)'
                      }}>
                        <NoteInput 
                          key={`${eleve.id}-${col.id}-${semaineActuelle}`}
                          value={
                            notesMensuelles?.[eleve.id]
                            ?.[col.id]
                            ?.[semaineActuelle - 1] ?? ''
                          }
                          onChange={v => updateGrade(eleve.id, col.id, v)}
                          width="80px"
                        />
                      </td>
                    ))}

                    {/* Moyenne Générale */}
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      backgroundColor: '#fef3c7',
                      borderBottom: '1px solid var(--border-color)'
                    }}>
                      <span className={getClasseMoyenne(moyGenerale)}>
                        {moyGenerale ?? '—'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      position: 'sticky',
                      right: 0,
                      zIndex: 1,
                      backgroundColor: rowBg,
                      borderBottom: '1px solid var(--border-color)'
                    }}>
                      <button 
                        onClick={() => supprimerEleve(eleve.id)}
                        style={{ 
                          padding: '6px 12px', 
                          backgroundColor: '#ef4444', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '6px', 
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;