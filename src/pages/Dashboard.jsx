import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { supabase } from '../lib/supabase';
import NoteInput from '../components/ui/NoteInput.jsx';
import BandeauSemaine from '../components/ui/BandeauSemaine.jsx';
import Button from '../components/ui/Button.jsx';
import { studentsService, gradesService } from '../services/supabaseService.js';

const initialEleves = [];

function Dashboard({ onMensuel, onTrimestriel, onInspectEleve, onLogout, theme, onToggleTheme, eleves, setEleves, colonnesBoker, setColonnesBoker, colonnesFormation, setColonnesFormation, notesMensuelles, setNotesMensuelles, semaineActuelle, setSemaineActuelle, selectedEleve, setSelectedEleve, userId, user }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEleve, setNewEleve] = useState({ firstName: '', lastName: '' });
  const [showModal, setShowModal] = useState(false);
  const [nomControle, setNomControle] = useState('');
  const [matiereChoisie, setMatiereChoisie] = useState('');
  const [expandedEleves, setExpandedEleves] = useState(new Set());
  
  // Refs pour préserver la position de scroll et éviter les re-renders
  const semaineRef = useRef(semaineActuelle);
  const scrollPositionRef = useRef({ x: 0, y: 0 });
  const dashboardRef = useRef(null);
  const tableRef = useRef(null);
  const isScrollingRef = useRef(false);
  
  useEffect(() => {
    semaineRef.current = semaineActuelle;
  }, [semaineActuelle]);

  // Préserver la position de scroll et éviter les resets
  useEffect(() => {
    const handleScroll = () => {
      if (!isScrollingRef.current) {
        isScrollingRef.current = true;
        
        if (dashboardRef.current) {
          scrollPositionRef.current = {
            x: dashboardRef.current.scrollLeft,
            y: dashboardRef.current.scrollTop
          };
        }
        
        // Utiliser requestAnimationFrame pour optimiser la performance
        requestAnimationFrame(() => {
          isScrollingRef.current = false;
        });
      }
    };

    const dashboard = dashboardRef.current;
    if (dashboard) {
      // Restaurer la position de scroll après les re-renders
      const restoreScroll = () => {
        if (scrollPositionRef.current.x !== 0 || scrollPositionRef.current.y !== 0) {
          dashboard.scrollLeft = scrollPositionRef.current.x;
          dashboard.scrollTop = scrollPositionRef.current.y;
        }
      };

      // Restaurer immédiatement si déjà scrollé
      restoreScroll();
      
      // Restaurer après un petit délai pour les re-renders
      const timeoutId = setTimeout(restoreScroll, 50);
      
      dashboard.addEventListener('scroll', handleScroll, { passive: true });

      return () => {
        dashboard.removeEventListener('scroll', handleScroll);
        clearTimeout(timeoutId);
      };
    }
  }, [eleves.length, notesMensuelles.length]);

  // Optimisation : prévenir les re-renders inutiles du tableau
  const memoizedEleves = useMemo(() => eleves, [eleves.length, eleves.map(e => e.id).join(',')]);
  const memoizedColonnesBoker = useMemo(() => colonnesBoker, [colonnesBoker.length, colonnesBoker.map(c => c.id).join(',')]);
  const memoizedColonnesFormation = useMemo(() => colonnesFormation, [colonnesFormation.length, colonnesFormation.map(c => c.id).join(',')]);

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

  // Supprimé - causait une boucle infinie
  // Les élèves sont maintenant chargés depuis App.jsx via loadUserData()

  const calculerMoyenneGroupe = (eleveId, groupeColonnes) => {
  const valid = groupeColonnes
    .flatMap(c => notesMensuelles?.[eleveId]?.[c.id] || [])
    .filter(n => n !== null && n !== '' && n !== undefined && !isNaN(n) && Number(n) !== 0);
  if (valid.length === 0) return null;
  return (valid.reduce((a, b) => a + parseFloat(b), 0) / valid.length).toFixed(2);
};

const calculerMoyenneGenerale = (eleveId) => {
  const toutes = [...colonnesBoker, ...colonnesFormation];
  const valid = toutes
    .flatMap(c => notesMensuelles?.[eleveId]?.[c.id] || [])
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

  const updateGrade = useCallback(async (eleveId, colId, noteIndex, value) => {
    const noteValue = value === '' ? null : parseFloat(value);
    
    // Utiliser la fonction partagée avec refetch automatique (SYNCHRONISATION IMMÉDIATE)
    try {
      const gradesData = {
        student_id: eleveId,
        subject: colId, // subject_id → subject
        week: noteIndex + 1, // N1=week1, N2=week2, etc.
        notes: [noteValue] // Une seule note par semaine
      };
      
      // Insérer/Mettre à jour dans Supabase
      await gradesService.upsert(userId, [gradesData], noteIndex + 1);
      
      // Synchronisation globale IMMÉDIATE avec Bilan mensuel (MÊME SOURCE SUPABASE)
      await gradesService.syncAllNotes(userId, notesMensuelles, setNotesMensuelles);
      
      console.log(`Dashboard: Note ${noteValue} pour élève ${eleveId}, matière ${colId}, semaine ${noteIndex + 1} synchronisée avec Bilan Mensuel`);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la note (Dashboard):', error);
      
      // En cas d'erreur, forcer la synchronisation globale
      try {
        await gradesService.syncAllNotes(userId, notesMensuelles, setNotesMensuelles);
      } catch (refetchError) {
        console.error('Erreur lors du refetch après erreur (Dashboard):', refetchError);
      }
    }
  }, [userId]);

  // Fonction updateNote (NOUVELLE STRUCTURE PROPRE)
  const updateNote = useCallback(async (eleveId, subject, weekIndex, value) => {
    const noteValue = value === '' ? null : parseFloat(value);
    const weekId = `week${weekIndex + 1}`; // Format: week1, week2, etc.
    
    // Validation des notes 0-100
    if (noteValue !== null && (noteValue < 0 || noteValue > 100)) {
      console.error('Note hors limites (0-100):', noteValue);
      return;
    }
    
    // Trouver l'élève dans la liste locale
    const eleve = eleves.find(e => e.id === eleveId);
    if (!eleve) {
      console.error('Élève non trouvé:', eleveId);
      return;
    }
    
    try {
      // Sauvegarder la note avec la nouvelle structure
      await gradesService.upsert(userId, {
        student_id: eleveId,
        subject: subject,
        week_id: weekId,
        value: noteValue
      });
      
      console.log(`Note sauvegardée: ${noteValue} pour ${eleve.name}, ${subject}, ${weekId}`);
      
      // Recharger les notes pour synchronisation
      const updatedNotes = await gradesService.getAll(userId);
      setNotesMensuelles(updatedNotes);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la note:', error);
    }
  }, [userId, setNotesMensuelles]);

  // Composant pour afficher une matière avec ses notes (NOUVELLE STRUCTURE)
  const MatiereRow = memo(({ eleveId, subject, onUpdateNote, onDeleteControle }) => {
    // Récupérer les notes pour cette matière et cet élève
    const subjectNotes = notesMensuelles?.filter(note => 
      note.student_id === eleveId && note.subject === subject
    ) || [];
    
    // Organiser les notes par semaine
    const notesByWeek = {};
    for (let i = 1; i <= 4; i++) {
      const weekNote = subjectNotes.find(note => note.week_id === `week${i}`);
      notesByWeek[`week${i}`] = weekNote?.value || null;
    }
    
    // Calculer la moyenne
    const validNotes = Object.values(notesByWeek).filter(n => n !== null && n !== '' && !isNaN(n));
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
          color: 'var(--text-primary)'
        }}>
          {subject}
        </div>
        
        <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
          {Object.entries(notesByWeek).map(([weekId, noteValue], index) => (
            <NoteInput
              key={`${eleveId}-${subject}-${weekId}`}
              value={noteValue}
              onChange={(value) => onUpdateNote?.(eleveId, subject, index, value)}
              width="55px"
            />
          ))}
        </div>
        
        <div style={{
          width: '50px',
          textAlign: 'center',
          color: 'var(--text-primary)',
          backgroundColor: '#f0f9ff',
          padding: '4px 8px',
          borderRadius: '4px'
        }}>
          <span className={getClasseMoyenne(moyenne)}>{moyenne ?? '—'}</span>
        </div>
      </div>
    );
  });

  MatiereRow.displayName = 'MatiereRow';

// Composant optimisé pour les lignes d'élèves
const EleveRow = memo(({ eleve, colonnesBoker, colonnesFormation, notesMensuelles, updateNote, expanded, onToggle, onDeleteControle }) => {
  // Utiliser les moyennes pré-calculées
  const moyenneGenerale = eleve.moyenneGenerale;
  const moyennesParMatiere = eleve.moyennesParMatiere || {};
  
  const handleToggle = useCallback(() => {
    onToggle(eleve.id);
  }, [eleve.id, onToggle]);

  return (
    <React.Fragment>
      <tr>
        <td style={{
          padding: '12px 16px',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          fontWeight: '500',
          position: 'sticky',
          left: 0,
          zIndex: 1,
          borderRight: '2px solid var(--border-color)',
          cursor: 'pointer'
        }} onClick={handleToggle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>{expanded ? '▼' : '▶'}</span>
            <div>
              <div style={{ fontWeight: 'bold' }}>{eleve.firstName} {eleve.lastName}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Moyenne: <span className={moyenneGenerale ? 
                  (moyenneGenerale < 50 ? 'grade-red' : 
                   moyenneGenerale < 70 ? 'grade-orange' : 'grade-green') : ''}>
                  {moyenneGenerale ?? '—'}
                </span>
              </div>
            </div>
          </div>
        </td>
        
        {/* Matières בוקר */}
        {Array.isArray(colonnesBoker) && colonnesBoker.map((col, colIndex) => {
          const colKey = col.id || `boker-${colIndex}`;
          
          return (
            <td key={colKey} style={{
              padding: '8px',
              backgroundColor: '#ede9fe',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <MatiereRow 
                eleveId={eleve.id} 
                col={col} 
                isBoker={true} 
                onUpdateNote={updateNote}
                onDeleteControle={onDeleteControle}
              />
            </td>
          );
        })}
        
        {/* Matières Formation */}
        {Array.isArray(colonnesFormation) && colonnesFormation.map((col, colIndex) => {
          const colKey = col.id || `formation-${colIndex}`;
          
          return (
            <td key={colKey} style={{
              padding: '8px',
              backgroundColor: '#d1fae5',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <MatiereRow 
                eleveId={eleve.id} 
                col={col} 
                isBoker={false} 
                onUpdateNote={updateNote}
                onDeleteControle={onDeleteControle}
              />
            </td>
          );
        })}
      </tr>
      
      {/* Ligne détaillée (accordéon) */}
      {expanded && (
        <tr>
          <td colSpan={1 + colonnesBoker.length + colonnesFormation.length} style={{
            padding: '0',
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div style={{ padding: '16px' }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
                Détails des notes pour {eleve.firstName} {eleve.lastName}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {[...colonnesBoker, ...colonnesFormation].map(col => {
                  const notes = notesMensuelles?.[eleve.id]?.[col.id] || [null, null, null, null];
                  const moyenne = moyennesParMatiere[col.id]; // Utiliser la moyenne pré-calculée
                  
                  return (
                    <div key={col.id} style={{
                      backgroundColor: 'var(--bg-primary)',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
                        {col.nom}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Notes: {notes.map((n, i) => n !== null ? n : '—').join(' / ')}
                      </div>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        Moyenne: <span className={moyenne ? 
                          (moyenne < 50 ? 'grade-red' : 
                           moyenne < 70 ? 'grade-orange' : 'grade-green') : ''}>
                          {moyenne ?? '—'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
});

EleveRow.displayName = 'EleveRow';

  const ajouterEleve = async () => {
    if (newEleve.firstName.trim() && newEleve.lastName.trim()) {
      try {
        const studentData = {
          first_name: newEleve.firstName.trim(),
          last_name: newEleve.lastName.trim(),
        };
        
        const newStudent = await studentsService.create(userId, studentData);
        const formattedStudent = {
          id: newStudent.id,
          firstName: newStudent.first_name,
          lastName: newStudent.last_name,
        };
        
        setEleves([...eleves, formattedStudent]);
        setNewEleve({ firstName: '', lastName: '' });
        setShowAddForm(false);
      } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'élève:', error);
        alert('Erreur lors de l\'ajout de l\'élève');
      }
    }
  };

  const supprimerEleve = async (eleveId) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet élève ?')) {
      try {
        await studentsService.delete(userId, eleveId);
        setEleves(eleves.filter(e => e.id !== eleveId));
        
        // Supprimer aussi les notes de l'élève dans Supabase
        const allColonnes = [...colonnesBoker, ...colonnesFormation];
        for (const col of allColonnes) {
          await gradesService.delete(userId, eleveId, col.id);
        }
        
        // Mettre à jour les notes locales
        setNotesMensuelles(prev => {
          const copy = { ...prev };
          delete copy[eleveId];
          return copy;
        });
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'élève:', error);
        alert('Erreur lors de la suppression de l\'élève');
      }
    }
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

  // Calcul automatique des moyennes avec recalcul à chaque modification
  const calculerMoyenne = (notes) => {
    if (!notes || !Array.isArray(notes)) return null;
    
    const validNotes = notes.filter(n => 
      n !== null && 
      n !== '' && 
      n !== undefined && 
      !isNaN(n) && 
      Number(n) !== 0
    );
    
    if (validNotes.length === 0) return null;
    
    return (validNotes.reduce((a, b) => a + parseFloat(b), 0) / validNotes.length).toFixed(2);
  };

  // Optimisation : calculer les moyennes avec la nouvelle structure Supabase
  const elevesAvecMoyennes = useMemo(() => {
    return memoizedEleves.map(eleve => {
      const toutesColonnes = [...memoizedColonnesBoker, ...memoizedColonnesFormation];
      
      // Adapter à la nouvelle structure : notesMensuelles est un tableau d'objets
      const eleveNotes = notesMensuelles?.filter(note => note.student_id === eleve.id) || [];
      
      // Calculer les moyennes par matière
      const moyennesParMatiere = {};
      toutesColonnes.forEach(col => {
        const subjectNotes = eleveNotes.filter(note => note.subject === col.id);
        const validNotes = subjectNotes.map(note => note.value).filter(n => n !== null && n !== undefined && !isNaN(n));
        moyennesParMatiere[col.id] = calculerMoyenne(validNotes);
      });
      
      // Calculer la moyenne générale
      const toutesNotes = eleveNotes.map(note => note.value).filter(n => n !== null && n !== undefined && !isNaN(n));
      const moyenneGenerale = calculerMoyenne(toutesNotes);
      
      return {
        ...eleve,
        moyenneGenerale,
        moyennesParMatiere
      };
    });
  }, [memoizedEleves, memoizedColonnesBoker, memoizedColonnesFormation, notesMensuelles]);

  const thBase = {
    padding: '10px 8px',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    borderBottom: '2px solid var(--border-color)',
    whiteSpace: 'nowrap'
  };

  
  return (
    <div ref={dashboardRef} style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', width: '100vw', overflowX: 'hidden' }}>

      {/* Bandeau semaine */}
      <BandeauSemaine 
        theme={theme}
        semaineActuelle={semaineActuelle}
        setSemaineActuelle={setSemaineActuelle}
        onMensuel={onMensuel}
        onTrimestriel={onTrimestriel}
        onInspectEleve={onInspectEleve}
        selectedEleve={selectedEleve}
        setSelectedEleve={setSelectedEleve}
        onToggleTheme={onToggleTheme}
        onLogout={onLogout}
        onProfil={() => onInspectEleve('professeur')}
        user={user}
      />

      {/* Boutons d'action principaux */}
      <div style={{ padding: '1rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <Button onClick={() => setShowAddForm(!showAddForm)} variant="premium" size="medium">+ Ajouter un élève</Button>
        <Button onClick={() => setShowModal(true)} variant="premium" size="medium">+ Ajouter un contrôle</Button>
        <Button onClick={reinitialiserToutesNotes} variant="secondary" size="medium">Réinitialiser les notes</Button>
      </div>

      {/* Formulaire ajout élève */}
      {showAddForm && (
        <div style={{ margin: '0 1.5rem 1rem', padding: '1rem', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Ajouter un nouvel élève</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Prénom" value={newEleve.firstName} onChange={e => setNewEleve({ ...newEleve, firstName: e.target.value })} style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--input-bg)', color: 'var(--input-text)', border: '1px solid var(--border-color)', minWidth: '150px' }} />
            <input type="text" placeholder="Nom" value={newEleve.lastName} onChange={e => setNewEleve({ ...newEleve, lastName: e.target.value })} style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--input-bg)', color: 'var(--input-text)', border: '1px solid var(--border-color)', minWidth: '150px' }} />
            <Button onClick={ajouterEleve} variant="premium" size="small">Confirmer</Button>
            <Button onClick={() => setShowAddForm(false)} variant="secondary" size="small">Annuler</Button>
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
              <Button onClick={() => { setShowModal(false); setNomControle(''); setMatiereChoisie(''); }} variant="secondary" size="small">Annuler</Button>
              <Button onClick={ajouterControle} disabled={!nomControle.trim() || !matiereChoisie} variant="premium" size="small">
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tableau principal */}
      <div style={{ overflowX: 'auto', maxWidth: '100%', margin: '0 1.5rem' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: '#ffffff',
          fontSize: '14px',
          fontFamily: 'Arial, sans-serif',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f4e4c1' }}>
              <th style={{ 
                padding: '12px 8px', 
                textAlign: 'left', 
                border: '1px solid #d4af37',
                fontWeight: 'bold',
                color: '#5d4e37',
                backgroundColor: '#f4e4c1'
              }}>
                Élève
              </th>
              {/* Colonnes Boker - Doré */}
              {memoizedColonnesBoker.map(col => (
                <th key={col.id} style={{ 
                  padding: '12px 8px', 
                  textAlign: 'center', 
                  border: '1px solid #d4af37',
                  fontWeight: 'bold',
                  color: '#5d4e37',
                  backgroundColor: '#f4e4c1'
                }}>
                  {col.nom}
                </th>
              ))}
              {/* Colonnes Formation - Doré */}
              {memoizedColonnesFormation.map(col => (
                <th key={col.id} style={{ 
                  padding: '12px 8px', 
                  textAlign: 'center', 
                  border: '1px solid #d4af37',
                  fontWeight: 'bold',
                  color: '#5d4e37',
                  backgroundColor: '#f4e4c1'
                }}>
                  {col.nom}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {elevesAvecMoyennes.map((eleve, index) => {
              // Utiliser une clé de fallback si l'ID est manquant
              const safeKey = eleve.id || `${eleve.firstName}-${eleve.lastName}-${index}`;
              
              console.log('Rendu élève avec clé:', safeKey, eleve.firstName, eleve.lastName, 'ID:', eleve.id);
              
              return (
                <React.Fragment key={safeKey}>
                  {/* Ligne élève */}
                  <tr style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#faf8f3' }}>
                    <td style={{ 
                      padding: '12px 8px', 
                      border: '1px solid #e8dcc0',
                      fontWeight: 'bold',
                      color: '#5d4e37'
                    }}>
                      {eleve.firstName} {eleve.lastName}
                    </td>
                  {/* Colonnes Boker */}
                  {memoizedColonnesBoker.map(col => {
                    // Adapter à la nouvelle structure Supabase
                    const eleveNotes = notesMensuelles?.filter(note => note.student_id === eleve.id && note.subject === col.id) || [];
                    const validNotes = eleveNotes.map(note => note.value).filter(n => n !== null && n !== undefined && !isNaN(n));
                    const moyenne = validNotes.length > 0 
                      ? (validNotes.reduce((a, b) => a + parseFloat(b), 0) / validNotes.length).toFixed(2)
                      : null;
                    
                    return (
                      <td key={col.id} style={{ 
                        padding: '12px 8px', 
                        textAlign: 'center', 
                        border: '1px solid #e8dcc0',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#faf8f3'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                          <NoteInput
                            value={eleveNotes.find(note => note.week_id === `week${semaineActuelle}`)?.value ?? ''}
                            onChange={(value) => updateNote(eleve.id, col.id, semaineActuelle - 1, value)}
                            width="60px"
                          />
                          {moyenne !== null && (
                            <span style={{
                              fontSize: '11px',
                              color: '#5d4e37',
                              minWidth: '35px'
                            }}>
                              {moyenne}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  {/* Colonnes Formation */}
                  {memoizedColonnesFormation.map(col => {
                    // Adapter à la nouvelle structure Supabase
                    const eleveNotes = notesMensuelles?.filter(note => note.student_id === eleve.id && note.subject === col.id) || [];
                    const validNotes = eleveNotes.map(note => note.value).filter(n => n !== null && n !== undefined && !isNaN(n));
                    const moyenne = validNotes.length > 0 
                      ? (validNotes.reduce((a, b) => a + parseFloat(b), 0) / validNotes.length).toFixed(2)
                      : null;
                    
                    return (
                      <td key={col.id} style={{ 
                        padding: '12px 8px', 
                        textAlign: 'center', 
                        border: '1px solid #e8dcc0',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#faf8f3'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                          <NoteInput
                            value={eleveNotes.find(note => note.week_id === `week${semaineActuelle}`)?.value ?? ''}
                            onChange={(value) => updateNote(eleve.id, col.id, semaineActuelle - 1, value)}
                            width="60px"
                          />
                          {moyenne !== null && (
                            <span style={{
                              fontSize: '11px',
                              color: '#5d4e37',
                              minWidth: '35px'
                            }}>
                              {moyenne}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;