import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { supabase } from '../lib/supabase';
import NoteInput from '../components/ui/NoteInput.jsx';
import BandeauSemaine from '../components/ui/BandeauSemaine.jsx';
import Button from '../components/ui/Button.jsx';
import { studentsService, gradesService } from '../services/supabaseService.js';
import { useDataSync } from '../hooks/useDataSync.js';
import { getBaseSubjectKey, getWeeklySubjectKey } from '../utils/gradeAnalysis.js';

const initialEleves = [];

function Dashboard({ onMensuel, onTrimestriel, onInspectEleve, onProfil, onTeachers, onLogout, theme, onToggleTheme, eleves, setEleves, colonnesBoker, setColonnesBoker, colonnesFormation, setColonnesFormation, notesMensuelles, setNotesMensuelles, semaineActuelle, setSemaineActuelle, selectedEleve, setSelectedEleve, userId, user, sessionContext }) {
  // LOGGING DES PROPS AU CHARGEMENT DU COMPOSANT
  console.log('=== DASHBOARD COMPOSANT CHARGÉ ===');
  console.log('1. PROPS REÇUES:');
  console.log('   - user:', user ? '✅ PRÉSENT' : '❌ NULL');
  console.log('   - userId:', userId || '❌ NULL');
  console.log('   - eleves.length:', eleves?.length || '❌ NULL/UNDEFINED');
  console.log('   - notesMensuelles.length:', notesMensuelles?.length || '❌ NULL/UNDEFINED');
  
  console.log('2. ELEVES IDS REÇUS:');
  if (eleves && Array.isArray(eleves)) {
    console.log('   - Nombre d\'élèves:', eleves.length);
    console.log('   - 5 premiers IDs:', eleves.slice(0, 5).map(e => e.id));
  } else {
    console.log('   - eleves invalide:', typeof eleves);
  }
  
  console.log('3. TIMESTAMP CHARGEMENT DASHBOARD:', new Date().toISOString());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEleve, setNewEleve] = useState({ firstName: '', lastName: '' });
  const [showModal, setShowModal] = useState(false);
  const [nomControle, setNomControle] = useState('');
  const [matiereChoisie, setMatiereChoisie] = useState('');
  const [expandedEleves, setExpandedEleves] = useState(new Set());
  
  // Hook de synchronisation des données
  const { syncAfterStudentAdd, syncAfterStudentDelete, syncAfterGradeUpdate, syncStatus } = useDataSync(userId, sessionContext);
  
  // Refs pour préserver la position de scroll et éviter les re-renders
  const semaineRef = useRef(semaineActuelle);
  const scrollPositionRef = useRef({ x: 0, y: 0 });
  const dashboardRef = useRef(null);
  const tableRef = useRef(null);
  const isScrollingRef = useRef(false);
  
  useEffect(() => {
    semaineRef.current = semaineActuelle;
  }, [semaineActuelle]);
  
  // DEBUG GLOBAL - État des données au chargement
  useEffect(() => {
    console.log('=== DASHBOARD - ÉTAT DES DONNÉES ===');
    console.log('1. User ID:', userId);
    console.log('2. Élèves chargés:', eleves?.length || 0);
    console.log('3. Students IDs:', eleves?.map(s => s.id) || []);

    // Stocker l'état initial pour comparaison
    if (typeof window !== 'undefined') {
      window.initialDashboardState = {
        timestamp: new Date().toISOString(),
        userId: userId,
        elevesLength: eleves?.length || 0,
        elevesIds: eleves?.map(e => e.id) || []
      };
    }
    console.log('4. Notes chargées:', notesMensuelles?.length || 0);
    console.log('5. Grades student_ids:', (Array.isArray(notesMensuelles) ? notesMensuelles : []).map(g => g.student_id) || []);

    // Vérifier tous les orphelins
    const studentIds = new Set(eleves?.map(s => s.id) || []);
    const gradeStudentIds = new Set((Array.isArray(notesMensuelles) ? notesMensuelles : []).map(g => g.student_id).filter(Boolean) || []);
    const allOrphanedGrades = [...gradeStudentIds].filter(id => !studentIds.has(id));
    
    if (allOrphanedGrades.length > 0) {
      console.log('7. TOUS LES GRADES ORPHELINS:', allOrphanedGrades);
      console.log('   Ces grades vont causer des erreurs systématiques');
    }
    
  }, [eleves, notesMensuelles, userId]);

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
  }, [userId]); // Dépendance UNIQUEMENT de userId pour éviter les boucles infinies

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
  console.log('=== DEBUG MOYENNE GROUPE ===');
  console.log('1. Élève ID demandé:', eleveId);
  console.log('2. Students disponibles:', eleves?.map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}` })) || []);
  console.log('3. Students IDs:', eleves?.map(s => s.id) || []);
  
  // CAPTURE ÉTAT PRÉCIS AVANT ERREUR
  console.log('=== CAPTURE ÉTAT ÉLÈVES AVANT VÉRIFICATION ===');
  console.log('1. Variable eleves type:', typeof eleves);
  console.log('2. Variable eleves est array:', Array.isArray(eleves));
  console.log('3. Longueur eleves:', eleves?.length || 0);
  console.log('4. Contenu complet eleves:', eleves?.map(e => ({ 
    id: e.id, 
    name: `${e.firstName} ${e.lastName}`,
    idLength: e.id?.length,
    idType: typeof e.id,
    isProblematic: e.id === eleveId
  })) || 'VARIABLE UNDEFINED OU NULL');
  
  // Vérification spécifique ID problématique
  const problematicStudent = eleves?.find(e => e.id === eleveId);
  console.log('5. Recherche ID problématique:', eleveId);
  console.log('6. Élève problématique trouvé:', problematicStudent ? '✅ OUI' : '❌ NON');
  if (problematicStudent) {
    console.log('7. Détails élève problématique:', problematicStudent);
  } else {
    console.log('7. IDs disponibles dans eleves:', eleves?.map(e => e.id) || []);
  }
  
  // Vérifier si l'élève existe
  const eleveExists = eleves?.some(e => e.id === eleveId);
  console.log('8. Élève existe dans students:', eleveExists);
  
  if (!eleveExists) {
    console.error('❌ ÉLÈVE NON TROUVÉ DANS STUDENTS:', eleveId);
    
    // CAPTURE PRÉCISE AU MOMENT EXACT DE L'ERREUR
    console.log('🔍 ENQUÊTE PRÉCISE - VALEUR RÉELLE AU MOMENT ERREUR');
    console.log('1. ELEVEID RECHERCHÉ:', eleveId);
    console.log('2. ELEVES.LENGTH:', eleves?.length || 'UNDEFINED');
    console.log('3. ELEVES EST ARRAY:', Array.isArray(eleves));
    console.log('4. ELEVES EST NULL/UNDEFINED:', eleves === null || eleves === undefined);
    
    // Afficher les 10 premiers IDs si disponibles
    if (eleves && Array.isArray(eleves) && eleves.length > 0) {
      console.log('5. 10 PREMIERS IDS ELEVES:');
      eleves.slice(0, 10).forEach((e, index) => {
        console.log(`   [${index}] ID: ${e.id}, Name: ${e.firstName} ${e.lastName}`);
      });
      
      // Vérifier si l'ID problématique est dans les 10 premiers
      const inFirstTen = eleves.slice(0, 10).some(e => e.id === eleveId);
      console.log('6. ID PROBLÉMATIQUE DANS 10 PREMIERS:', inFirstTen);
    } else {
      console.log('5. ELEVES VIDE OU INVALIDE - PAS D\'IDS À AFFICHER');
    }
    
    // Test direct du some()
    const directSomeTest = eleves?.some(e => e.id === eleveId);
    console.log('7. TEST DIRECT eleves.some(e => e.id === eleveId):', directSomeTest);
    
    // Recherche manuelle détaillée
    if (eleves && Array.isArray(eleves)) {
      console.log('8. RECHERCHE MANUELLE DÉTAILLÉE:');
      let foundIndex = -1;
      let foundStudent = null;
      
      eleves.forEach((student, index) => {
        if (student.id === eleveId) {
          foundIndex = index;
          foundStudent = student;
        }
      });
      
      console.log('   - Index trouvé:', foundIndex);
      console.log('   - Élève trouvé:', foundStudent ? '✅ OUI' : '❌ NON');
      
      if (foundStudent) {
        console.log('9. CONTENU COMPLET OBJET ÉLÈVE TROUVÉ:');
        console.log('   - ID:', foundStudent.id);
        console.log('   - FirstName:', foundStudent.firstName);
        console.log('   - LastName:', foundStudent.lastName);
        console.log('   - Type ID:', typeof foundStudent.id);
        console.log('   - Longueur ID:', foundStudent.id?.length);
        console.log('   - ID === eleveId:', foundStudent.id === eleveId);
        console.log('   - ID == eleveId:', foundStudent.id == eleveId);
        console.log('   - ID.localeCompare(eleveId):', foundStudent.id?.localeCompare(eleveId));
      }
    }
    
    // Vérifier si eleves est vide
    const isEmpty = !eleves || (Array.isArray(eleves) && eleves.length === 0);
    console.log('10. ELEVES EST VIDE:', isEmpty);
    
    // Vérifier le timestamp actuel
    console.log('11. TIMESTAMP ERREUR:', new Date().toISOString());
    
    // Vérifier les props Dashboard si possible
    console.log('12. VERIFICATION PROPS DASHBOARD:');
    console.log('   - Props disponibles:', Object.keys(arguments[0] || {}));
    
    // Vérifier si plusieurs états eleves existent
    console.log('13. DÉTECTION MULTIPLES ÉTATS:');
    if (typeof window !== 'undefined') {
      const globalEleves = window.eleves;
      console.log('   - window.eleves:', globalEleves?.length || 'UNDEFINED');
    }
    
    // État complet pour debugging
    console.log('14. ÉTAT COMPLET FINAL:');
    console.log('   - eleveId:', eleveId);
    console.log('   - typeof eleveId:', typeof eleveId);
    console.log('   - eleveId.length:', eleveId?.length);
    console.log('   - eleves:', eleves);
    console.log('   - typeof eleves:', typeof eleves);
    console.log('   - Array.isArray(eleves):', Array.isArray(eleves));
    console.log('   - eleves?.length:', eleves?.length);
    console.log('   - eleveExists:', eleveExists);
    console.log('   - problematicStudent:', problematicStudent);
    
    console.log('Cet élève va causer des erreurs de calcul de moyenne');
    return null;
  }
  
  // Vérifier les grades pour cet élève (PROTECTION ARRAY)
  const eleveGrades = (Array.isArray(notesMensuelles) ? notesMensuelles : []).filter(n => n.student_id === eleveId) || [];
  console.log('5. Grades pour cet élève:', eleveGrades.map(g => ({ student_id: g.student_id, subject: g.subject, grade: g.grade })));
  console.log('6. Grades student_ids:', (Array.isArray(notesMensuelles) ? notesMensuelles : []).map(g => g.student_id) || []);
  
  // Vérifier les orphelins (PROTECTION ARRAY)
  const studentIds = new Set(eleves?.map(s => s.id) || []);
  const gradeStudentIds = new Set((Array.isArray(notesMensuelles) ? notesMensuelles : []).map(g => g.student_id).filter(Boolean) || []);
  const orphanedGrades = [...gradeStudentIds].filter(id => !studentIds.has(id));
  
  if (orphanedGrades.length > 0) {
    console.log('7. Grades orphelins détectés:', orphanedGrades);
    console.log('   Ces grades vont causer des erreurs de calcul');
  }
  
  const valid = groupeColonnes
    .flatMap(c => (Array.isArray(notesMensuelles) ? notesMensuelles : [])
      .filter(n => n.student_id === eleveId && getBaseSubjectKey(n.subject) === c.id)
      .map(n => n.grade)
    )
    .filter(n => n !== null && n !== undefined && !isNaN(n) && Number(n) !== 0);
    
  console.log('8. Notes valides pour moyenne:', valid);
  
  if (valid.length === 0) return null;
  return (valid.reduce((a, b) => a + parseFloat(b), 0) / valid.length).toFixed(2);
};

const calculerMoyenneGenerale = (eleveId) => {
  console.log('=== DEBUG MOYENNE GÉNÉRALE ===');
  console.log('1. Élève ID demandé:', eleveId);
  console.log('2. Students disponibles:', eleves?.map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}` })) || []);
  
  // CAPTURE ÉTAT PRÉCIS AVANT ERREUR - MOYENNE GÉNÉRALE
  console.log('=== CAPTURE ÉTAT ÉLÈVES AVANT VÉRIFICATION (MOYENNE GÉNÉRALE) ===');
  console.log('1. Variable eleves type:', typeof eleves);
  console.log('2. Variable eleves est array:', Array.isArray(eleves));
  console.log('3. Longueur eleves:', eleves?.length || 0);
  console.log('4. Contenu complet eleves:', eleves?.map(e => ({ 
    id: e.id, 
    name: `${e.firstName} ${e.lastName}`,
    idLength: e.id?.length,
    idType: typeof e.id,
    isProblematic: e.id === eleveId
  })) || 'VARIABLE UNDEFINED OU NULL');
  
  // Vérification spécifique ID problématique
  const problematicStudent = eleves?.find(e => e.id === eleveId);
  console.log('5. Recherche ID problématique:', eleveId);
  console.log('6. Élève problématique trouvé:', problematicStudent ? '✅ OUI' : '❌ NON');
  if (problematicStudent) {
    console.log('7. Détails élève problématique:', problematicStudent);
  } else {
    console.log('7. IDs disponibles dans eleves:', eleves?.map(e => e.id) || []);
  }
  
  // Vérifier si l'élève existe
  const eleveExists = eleves?.some(e => e.id === eleveId);
  console.log('8. Élève existe dans students:', eleveExists);
  
  if (!eleveExists) {
    console.error('❌ ÉLÈVE NON TROUVÉ DANS STUDENTS:', eleveId);
    
    // CAPTURE PRÉCISE AU MOMENT EXACT DE L'ERREUR - MOYENNE GÉNÉRALE
    console.log('🔍 ENQUÊTE PRÉCISE (MOYENNE GÉNÉRALE) - VALEUR RÉELLE AU MOMENT ERREUR');
    console.log('1. ELEVEID RECHERCHÉ:', eleveId);
    console.log('2. ELEVES.LENGTH:', eleves?.length || 'UNDEFINED');
    console.log('3. ELEVES EST ARRAY:', Array.isArray(eleves));
    console.log('4. ELEVES EST NULL/UNDEFINED:', eleves === null || eleves === undefined);
    
    // Afficher les 10 premiers IDs si disponibles
    if (eleves && Array.isArray(eleves) && eleves.length > 0) {
      console.log('5. 10 PREMIERS IDS ELEVES (MOYENNE GÉNÉRALE):');
      eleves.slice(0, 10).forEach((e, index) => {
        console.log(`   [${index}] ID: ${e.id}, Name: ${e.firstName} ${e.lastName}`);
      });
      
      // Vérifier si l'ID problématique est dans les 10 premiers
      const inFirstTen = eleves.slice(0, 10).some(e => e.id === eleveId);
      console.log('6. ID PROBLÉMATIQUE DANS 10 PREMIERS:', inFirstTen);
    } else {
      console.log('5. ELEVES VIDE OU INVALIDE - PAS D\'IDS À AFFICHER');
    }
    
    // Test direct du some()
    const directSomeTest = eleves?.some(e => e.id === eleveId);
    console.log('7. TEST DIRECT eleves.some(e => e.id === eleveId):', directSomeTest);
    
    // Recherche manuelle détaillée
    if (eleves && Array.isArray(eleves)) {
      console.log('8. RECHERCHE MANUELLE DÉTAILLÉE (MOYENNE GÉNÉRALE):');
      let foundIndex = -1;
      let foundStudent = null;
      
      eleves.forEach((student, index) => {
        if (student.id === eleveId) {
          foundIndex = index;
          foundStudent = student;
        }
      });
      
      console.log('   - Index trouvé:', foundIndex);
      console.log('   - Élève trouvé:', foundStudent ? '✅ OUI' : '❌ NON');
      
      if (foundStudent) {
        console.log('9. CONTENU COMPLET OBJET ÉLÈVE TROUVÉ (MOYENNE GÉNÉRALE):');
        console.log('   - ID:', foundStudent.id);
        console.log('   - FirstName:', foundStudent.firstName);
        console.log('   - LastName:', foundStudent.lastName);
        console.log('   - Type ID:', typeof foundStudent.id);
        console.log('   - Longueur ID:', foundStudent.id?.length);
        console.log('   - ID === eleveId:', foundStudent.id === eleveId);
        console.log('   - ID == eleveId:', foundStudent.id == eleveId);
        console.log('   - ID.localeCompare(eleveId):', foundStudent.id?.localeCompare(eleveId));
      }
    }
    
    // Vérifier si eleves est vide
    const isEmpty = !eleves || (Array.isArray(eleves) && eleves.length === 0);
    console.log('10. ELEVES EST VIDE:', isEmpty);
    
    // Vérifier le timestamp actuel
    console.log('11. TIMESTAMP ERREUR (MOYENNE GÉNÉRALE):', new Date().toISOString());
    
    // Vérifier les props Dashboard si possible
    console.log('12. VERIFICATION PROPS DASHBOARD (MOYENNE GÉNÉRALE):');
    console.log('   - Props disponibles:', Object.keys(arguments[0] || {}));
    
    // Vérifier si plusieurs états eleves existent
    console.log('13. DÉTECTION MULTIPLES ÉTATS (MOYENNE GÉNÉRALE):');
    if (typeof window !== 'undefined') {
      const globalEleves = window.eleves;
      console.log('   - window.eleves:', globalEleves?.length || 'UNDEFINED');
    }
    
    // État complet pour debugging
    console.log('14. ÉTAT COMPLET FINAL (MOYENNE GÉNÉRALE):');
    console.log('   - eleveId:', eleveId);
    console.log('   - typeof eleveId:', typeof eleveId);
    console.log('   - eleveId.length:', eleveId?.length);
    console.log('   - eleves:', eleves);
    console.log('   - typeof eleves:', typeof eleves);
    console.log('   - Array.isArray(eleves):', Array.isArray(eleves));
    console.log('   - eleves?.length:', eleves?.length);
    console.log('   - eleveExists:', eleveExists);
    console.log('   - problematicStudent:', problematicStudent);
    
    console.log('Cet élève va causer des erreurs de calcul de moyenne générale');
    return null;
  }
  
  const toutes = [...colonnesBoker, ...colonnesFormation];
  const valid = toutes
    .flatMap(c => (Array.isArray(notesMensuelles) ? notesMensuelles : [])
      .filter(n => n.student_id === eleveId && getBaseSubjectKey(n.subject) === c.id)
      .map(n => n.grade)
    )
    .filter(n => n !== null && n !== undefined && !isNaN(n) && Number(n) !== 0);
    
  console.log('4. Notes valides pour moyenne générale:', valid);
  
  if (valid.length === 0) return null;
  return (valid.reduce((a, b) => a + parseFloat(b), 0) / valid.length).toFixed(2);
};

  const getClasseMoyenne = (moyenne) => {
    if (moyenne === null) return '';
    if (moyenne < 50) return 'grade-red';
    if (moyenne < 70) return 'grade-orange';
    return 'grade-green';
  };

  // Fonction updateNote (NOUVELLE STRUCTURE PROPRE)
  const updateNote = useCallback(async (eleveId, subject, value) => {
    const noteValue = value === '' ? null : parseFloat(value);
    
    // Validation des notes 0-100
    if (noteValue !== null && (noteValue < 0 || noteValue > 100)) {
      console.error('Note hors limites (0-100):', noteValue);
      return;
    }
    
    console.log("=== RECHERCHE ÉLÈVE ===");
    console.log("eleves.length:", eleves?.length);
    console.log("Array.isArray(eleves):", Array.isArray(eleves));
    console.log("eleveId:", eleveId);
    console.log("typeof eleveId:", typeof eleveId);
    console.log("JSON.stringify(eleveId):", JSON.stringify(eleveId));
    console.log("eleves:", eleves);
    console.log("ids disponibles avec types:", eleves?.map(e => ({
      id: e.id,
      type: typeof e.id
    })));
    
    // Trouver l'élève dans la liste locale
    const eleve = eleves.find(e => {
      console.log("comparaison", e.id, eleveId, e.id === eleveId);
      return e.id === eleveId;
    });
    console.log("résultat exact du find:", eleve);
    if (!eleve) {
      console.error('Élève non trouvé:', eleveId);
      return;
    }
    
    try {
      // Sauvegarder la note avec la nouvelle structure
      await gradesService.upsert(userId, {
        student_id: eleveId,
        subject: getWeeklySubjectKey(subject, semaineActuelle),
        grade: noteValue
      }, sessionContext);
      
      console.log(`Note sauvegardée: ${noteValue} pour ${eleve.name}, ${subject}`);
      
      // Recharger les notes pour synchronisation
      const updatedNotes = await gradesService.getAll(userId, sessionContext);
      setNotesMensuelles(updatedNotes);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la note:', error);
    }
  }, [userId, eleves, setNotesMensuelles, semaineActuelle, sessionContext]);

  // Composant pour afficher une matière avec sa note
  const MatiereRow = memo(({ eleveId, subject, onUpdateNote, onDeleteControle }) => {
    // Protection pour garantir que notesMensuelles est toujours un array
    const safeNotes = Array.isArray(notesMensuelles) ? notesMensuelles : [];
    
    // Récupérer les notes pour cette matière et cet élève
    const subjectNotes = safeNotes.filter(note => 
      note.student_id === eleveId && note.subject === getWeeklySubjectKey(subject, semaineActuelle)
    );
    
    const gradeEntry = subjectNotes[0] || null;
    
    // Calculer la moyenne
    const validNotes = [gradeEntry?.grade].filter(n => n !== null && n !== undefined && n !== '' && !isNaN(n));
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
          <NoteInput
            key={`${eleveId}-${subject}`}
            value={gradeEntry?.grade ?? ''}
            onChange={(value) => onUpdateNote?.(eleveId, subject, value)}
            width="55px"
          />
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
                    <div key={`${safeKey}-${col.id || col.nom}`} style={{
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
    console.log('=== AJOUT ÉLÈVE - DÉBUT PROCESSUS ===');
    console.log('1. Données formulaire:', newEleve);
    console.log('2. User ID:', userId);
    console.log('3. Élèves actuels avant ajout:', eleves?.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}` })) || []);
    
    if (newEleve.firstName.trim() && newEleve.lastName.trim()) {
      try {
        const studentData = {
          first_name: newEleve.firstName.trim(),
          last_name: newEleve.lastName.trim(),
        };
        
        console.log('4. StudentData pour Supabase:', studentData);
        
        // Optimistic update : ajouter l'élève localement immédiatement
        const tempId = `temp-${Date.now()}`;
        const optimisticStudent = {
          id: tempId,
          firstName: newEleve.firstName.trim(),
          lastName: newEleve.lastName.trim(),
        };
        
        console.log('5. Élève optimiste (temporaire):', optimisticStudent);
        
        // Ajouter immédiatement au state pour un feedback instantané
        setEleves(prev => {
          const newEleves = [...prev, optimisticStudent];
          console.log('6. Élèves après ajout optimiste:', newEleves.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}` })));
          return newEleves;
        });
        
        setNewEleve({ firstName: '', lastName: '' });
        setShowAddForm(false);
        
        console.log('7. Création dans Supabase en cours...');
        
        // Créer l'élève dans Supabase
        const newStudent = await studentsService.create(userId, studentData, sessionContext);
        console.log('8. ÉLÈVE CRÉÉ DANS SUPABASE:', newStudent);
        console.log('   - newStudent.id:', newStudent?.id);
        console.log('   - newStudent.name:', newStudent?.name);
        console.log('   - newStudent.user_id:', newStudent?.user_id);
        
        // DEBUG FINAL - Vérification critique
        console.log('=== DEBUG FINAL - CRITICAL POINTS ===');
        console.log('create response:', newStudent);
        console.log('tempId:', tempId);
        console.log('newStudent.id:', newStudent?.id);
        console.log('tempId type:', typeof tempId);
        console.log('newStudent.id type:', typeof newStudent?.id);
        console.log('tempId === newStudent.id:', tempId === newStudent?.id);
        
        if (!newStudent?.id) {
          console.error('❌ ERREUR CRITIQUE: newStudent.id est null ou undefined');
          throw new Error('ID Supabase non généré');
        }
        
        const formattedStudent = {
          id: newStudent.id,
          firstName: newEleve.firstName.trim(),
          lastName: newEleve.lastName.trim(),
        };
        
        console.log('9. ÉLÈVE FORMATÉ POUR STATE:', formattedStudent);
        
        // Remplacer l'élève temporaire par l'élève réel
        setEleves(prev => {
          console.log('=== REMPLACEMENT OPTIMISTIC UPDATE ===');
          console.log('Élèves avant remplacement:', prev.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, isTemp: e.id === tempId })));
          console.log('Recherche de tempId:', tempId);
          console.log('Élève à remplacer trouvé:', prev.some(e => e.id === tempId));
          
          const updatedEleves = prev.map(e => {
            if (e.id === tempId) {
              console.log('✅ Élève temporaire trouvé et remplacé:', e.id, '→', formattedStudent.id);
              return formattedStudent;
            }
            return e;
          });
          
          console.log('Élèves après remplacement:', updatedEleves.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, wasTemp: e.id === tempId })));
          
          // Vérifier qu'il n'y a pas de double
          const tempStillExists = updatedEleves.some(e => e.id === tempId);
          const realExists = updatedEleves.some(e => e.id === formattedStudent.id);
          
          console.log('Vérification post-remplacement:');
          console.log('- tempId existe encore:', tempStillExists);
          console.log('- newStudent.id existe:', realExists);
          
          if (tempStillExists) {
            console.error('❌ ERREUR: tempId existe encore après remplacement');
          }
          if (!realExists) {
            console.error('❌ ERREUR: newStudent.id pas trouvé après remplacement');
          }
          
          return updatedEleves;
        });
        
        // SYNCHRONISATION AUTOMATIQUE APRÈS CRÉATION
        console.log('=== SYNCHRONISATION AUTOMATIQUE APRÈS CRÉATION ÉLÈVE ===');
        
        try {
          const syncResult = await syncAfterStudentAdd();
          
          if (syncResult) {
            // Mettre à jour les states avec les données synchronisées
            setEleves(syncResult.students);
            if (setNotesMensuelles) {
              setNotesMensuelles(syncResult.grades);
            }
            
            console.log('✅ SYNCHRONISATION RÉUSSIE APRÈS CRÉATION:');
            console.log('   - Students:', syncResult.students.length);
            console.log('   - Grades:', syncResult.grades.length);
            console.log('   - Cohérent:', syncResult.isConsistent);
            
            if (!syncResult.isConsistent) {
              console.warn('   - Grades orphelins restants:', syncResult.orphanedCount);
            }
          }
        } catch (syncError) {
          console.error('❌ Erreur synchronisation après création:', syncError);
          // En cas d'erreur de sync, recharger manuellement
          const refreshedStudents = await studentsService.getAll(userId, sessionContext);
          const formattedStudents = refreshedStudents.map(student => {
            const nameParts = student.name ? student.name.split(' ') : ['', ''];
            return {
              id: student.id,
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
            };
          });
          setEleves(formattedStudents);
        }
        
      } catch (error) {
        console.error('❌ ERREUR LORS DE L\'AJOUT DE L\'ÉLÈVE:', error);
        console.error('Détails complets de l\'erreur:', error.message, error.code, error.details);
        
        // En cas d'erreur, recharger les élèves pour corriger l'état
        console.log('🔄 RECHARGEMENT DES ÉLÈVES APRÈS ERREUR...');
        const { studentsService } = await import('../services/supabaseService.js');
        const data = await studentsService.getAll(userId, sessionContext);
        setEleves(data || []);
        
        alert(`Erreur lors de l'ajout de l'élève: ${error.message}`);
      }
    }
  };

  const supprimerEleve = async (eleveId) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet élève ?')) {
      try {
        // Optimistic update : supprimer immédiatement du state
        const originalEleves = [...eleves];
        const originalNotes = [...notesMensuelles];
        
        setEleves(prev => prev.filter(e => e.id !== eleveId));
        
        // Mettre à jour les notes locales (garde toujours un array)
        setNotesMensuelles(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          return safePrev.filter(note => note.student_id !== eleveId);
        });
        
        // Supprimer l'élève dans Supabase
        await studentsService.delete(userId, eleveId);
        
        // Supprimer aussi les notes de l'élève dans Supabase
        const allColonnes = [...colonnesBoker, ...colonnesFormation];
        for (const col of allColonnes) {
          await gradesService.delete(userId, eleveId, col.id);
        }
        
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'élève:', error);
        // En cas d'erreur, restaurer l'état original
        setEleves(originalEleves);
        setNotesMensuelles(originalNotes);
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

  const reinitialiserToutesNotes = async () => {
    if (!window.confirm('Réinitialiser toutes les notes ?')) return;

    try {
      await gradesService.deleteAll(userId);
      setNotesMensuelles([]);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des notes:', error);
      alert('Erreur lors de la réinitialisation des notes');
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

  // Les élèves sont chargés par App.jsx et transmis via props.

  // Protection pour garantir que notesMensuelles est toujours un array
  const safeNotesMensuelles = Array.isArray(notesMensuelles) ? notesMensuelles : [];
  
  // Optimisation : calculer les moyennes avec la nouvelle structure Supabase
  const elevesAvecMoyennes = useMemo(() => {
    // S'assurer que les données sont valides
    if (!memoizedEleves || memoizedEleves.length === 0) {
      return [];
    }
    
    return memoizedEleves.map(eleve => {
      const toutesColonnes = [...memoizedColonnesBoker, ...memoizedColonnesFormation];
      
      // Utiliser safeNotesMensuelles (garanti array)
      const eleveNotes = safeNotesMensuelles.filter(note => note.student_id === eleve.id);
      
      // Calculer les moyennes par matière
      const moyennesParMatiere = {};
      toutesColonnes.forEach(col => {
        const subjectNotes = eleveNotes.filter(note => getBaseSubjectKey(note.subject) === col.id);
        const validNotes = subjectNotes.map(note => note.grade).filter(n => n !== null && n !== undefined && !isNaN(n));
        moyennesParMatiere[col.id] = calculerMoyenne(validNotes);
      });
      
      // Calculer la moyenne générale
      const toutesNotes = eleveNotes.map(note => note.grade).filter(n => n !== null && n !== undefined && !isNaN(n));
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

      {/* Bandeau semaine - SEUL header authentique */}
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
        onProfil={onProfil}
        onTeachers={onTeachers}
        user={user}
      />

      {/* Boutons d'action principaux */}
      <div style={{ padding: '1rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <Button onClick={() => setShowAddForm(!showAddForm)} variant="premium" size="medium">+ Ajouter un élève</Button>
        <Button onClick={() => setShowModal(true)} variant="premium" size="medium">+ Ajouter un contrôle</Button>
        <Button onClick={reinitialiserToutesNotes} variant="secondary" size="medium">Réinitialiser les notes</Button>
      </div>

      {/* Dashboard vide - afficher un message clair */}
      {memoizedEleves.length === 0 && (
        <div style={{ 
          padding: '3rem 1.5rem', 
          textAlign: 'center',
          backgroundColor: '#faf8f3',
          margin: '1rem 1.5rem',
          borderRadius: '8px',
          border: '1px solid #e8dcc0'
        }}>
          <h3 style={{ color: '#5d4e37', marginBottom: '1rem' }}>
            Bienvenue sur votre espace de gestion
          </h3>
          <p style={{ color: '#5d4e37', marginBottom: '2rem' }}>
            Commencez par ajouter votre premier élève pour commencer à suivre les notes.
          </p>
          <Button 
            onClick={() => setShowAddForm(true)} 
            variant="premium" 
            size="large"
            style={{ padding: '12px 24px' }}
          >
            Ajouter un élève
          </Button>
        </div>
      )}

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
                <th key={`boker-${col.id || col.nom}`} style={{ 
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
                <th key={`formation-${col.id || col.nom}`} style={{ 
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
              // Clé composée robuste - jamais null
              const safeKey = `eleve-${eleve.id || `${eleve.firstName}-${eleve.lastName}`}-${index}`;
              
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{eleve.firstName} {eleve.lastName}</span>
                        <button
                          onClick={() => supprimerEleve(eleve.id)}
                          style={{
                            backgroundColor: '#ff4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            marginLeft: '8px'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#cc0000'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#ff4444'}
                          title="Supprimer l'élève"
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  {/* Colonnes Boker */}
                  {memoizedColonnesBoker.map(col => {
                    // Utiliser safeNotesMensuelles (garanti array)
                    const eleveNotes = safeNotesMensuelles.filter(note => note.student_id === eleve.id && note.subject === getWeeklySubjectKey(col.id, semaineActuelle));
                    const validNotes = eleveNotes.map(note => note.grade).filter(n => n !== null && n !== undefined && !isNaN(n));
                    const moyenne = validNotes.length > 0 
                      ? (validNotes.reduce((a, b) => a + parseFloat(b), 0) / validNotes.length).toFixed(2)
                      : null;
                    
                    return (
                      <td key={`${safeKey}-${col.id || col.nom}`} style={{ 
                        padding: '12px 8px', 
                        textAlign: 'center', 
                        border: '1px solid #e8dcc0',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#faf8f3'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                          <NoteInput
                            value={eleveNotes[0]?.grade ?? ''}
                            onChange={(value) => updateNote(eleve.id, col.id, value)}
                            width="60px"
                          />
                        </div>
                      </td>
                    );
                  })}
                  {/* Colonnes Formation */}
                  {memoizedColonnesFormation.map(col => {
                    // Utiliser safeNotesMensuelles (garanti array)
                    const eleveNotes = safeNotesMensuelles.filter(note => note.student_id === eleve.id && note.subject === getWeeklySubjectKey(col.id, semaineActuelle));
                    const validNotes = eleveNotes.map(note => note.grade).filter(n => n !== null && n !== undefined && !isNaN(n));
                    const moyenne = validNotes.length > 0 
                      ? (validNotes.reduce((a, b) => a + parseFloat(b), 0) / validNotes.length).toFixed(2)
                      : null;
                    
                    return (
                      <td key={`${safeKey}-${col.id || col.nom}`} style={{ 
                        padding: '12px 8px', 
                        textAlign: 'center', 
                        border: '1px solid #e8dcc0',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#faf8f3'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                          <NoteInput
                            value={eleveNotes[0]?.grade ?? ''}
                            onChange={(value) => updateNote(eleve.id, col.id, value)}
                            width="60px"
                          />
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