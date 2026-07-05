import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Button from '../ui/Button';
import NoteInput from '../ui/NoteInput';
import { gradesService } from '../../services/supabaseService.js';
import { theme as themeConstants, styles } from '../../styles/theme.js';
import { buildStudentGradeReport, formatGrade, getWeeklySubjectKey } from '../../utils/gradeAnalysis.js';

function BilanMensuel({ onBack, theme: propTheme, eleves, setEleves, colonnesBoker, setColonnesBoker, colonnesFormation, setColonnesFormation, notesMensuelles, setNotesMensuelles, semaineActuelle, userId, sessionContext }) {
  // Utiliser le thème des props avec fallback vers le thème importé
  const theme = propTheme || themeConstants;
  
  // Loading state pour éviter les traitements prématurés
  const [isDataReady, setIsDataReady] = useState(false);
  
  // Vérifier que les données sont synchronisées avant d'afficher
  useEffect(() => {
    const checkDataReady = () => {
      const studentsReady = eleves && eleves.length > 0;
      const gradesReady = notesMensuelles && Array.isArray(notesMensuelles);
      const hasNoGrades = gradesReady && notesMensuelles.length === 0;
      
      console.log('=== BILAN MENSUEL - ÉTAT DES DONNÉES ===');
      console.log('Students ready:', studentsReady);
      console.log('Grades ready:', gradesReady);
      console.log('Students count:', eleves?.length || 0);
      console.log('Students prop isArray:', Array.isArray(eleves));
      console.log('Students prop ids:', Array.isArray(eleves) ? eleves.map(student => student.id) : []);
      console.log('Students prop rows:', eleves || []);
      console.log('Grades count:', notesMensuelles?.length || 0);
      
      if (gradesReady && (studentsReady || hasNoGrades)) {
        // Validation finale de la synchronisation
        const studentIds = new Set(eleves.map(s => s.id));
        const gradeStudentIds = new Set(notesMensuelles.map(g => g.student_id).filter(Boolean));
        const hasValidRelations = notesMensuelles.every(g => 
          !g.student_id || studentIds.has(g.student_id)
        );
        
        console.log('Relations valides:', hasValidRelations);
        console.log('Grades orphelins:', [...gradeStudentIds].filter(id => !studentIds.has(id)).length);
        
        setIsDataReady(true);
        console.log('✅ Bilan Mensuel prêt à afficher');
      } else {
        setIsDataReady(false);
        console.log('⏳ Bilan Mensuel en attente des données...');
      }
    };
    
    checkDataReady();
  }, [eleves, notesMensuelles]);
  
  // Fallbacks sécurisés pour éviter les crashes
  const backgroundWhite = theme?.colors?.backgroundWhite ?? '#ffffff';
  const backgroundAlternate = theme?.colors?.backgroundAlternate ?? '#faf8f3';
  const textPrimary = theme?.colors?.textPrimary ?? '#5d4e37';
  const border = theme?.colors?.border ?? '#e8dcc0';
  const primaryLight = theme?.colors?.primaryLight ?? '#f4e4c1';
  const success = theme?.colors?.success ?? '#4caf50';
  const [showModal, setShowModal] = useState(false);
  const [nomControle, setNomControle] = useState('');
  const [matiereChoisie, setMatiereChoisie] = useState('');
  const [commentaires, setCommentaires] = useState({});

  const rapportsParEleve = useMemo(() => {
    console.log('=== DEBUG OBLIGATOIRE SYNCHRO FRONTEND ===');
    
    // Vérifier si students est chargé avant tout traitement
    if (!eleves || eleves.length === 0) {
      console.log('❌ ERREUR: students pas encore chargé - impossible de calculer le bilan');
      return {};
    }
    
    console.log('1. STUDENTS IDS (state React):', eleves.map(s => s.id));
    console.log('2. GRADES STUDENT_IDS (données brutes):', notesMensuelles?.map(g => g.student_id).filter(Boolean) || []);
    
    // Comparaison directe des arrays
    const studentIds = new Set(eleves.map(s => s.id));
    const gradeStudentIds = new Set(notesMensuelles?.map(g => g.student_id).filter(Boolean) || []);
    
    const validStudentIds = [...gradeStudentIds].filter(id => studentIds.has(id));
    const orphanedStudentIds = [...gradeStudentIds].filter(id => !studentIds.has(id));
    
    console.log('3. COMPARAISON DIRECTE:');
    console.log('   - Students dans state:', studentIds.size);
    console.log('   - Grades student_ids:', gradeStudentIds.size);
    console.log('   - IDs valides (communs):', validStudentIds.length);
    console.log('   - IDs orphelins (grades only):', orphanedStudentIds.length);
    
    if (orphanedStudentIds.length > 0) {
      console.log('   - ORPHELINS DÉTAILLÉS:', orphanedStudentIds);
      console.log('   - CES grades seront ignorés dans le bilan');
    }
    
    console.log('4. ÉLÈVES CHARGÉS:', eleves?.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}` })) || []);
    console.log('5. NOTES MENSUELLES BRUTES:', notesMensuelles?.map(n => ({ student_id: n.student_id, subject: n.subject, grade: n.grade })) || []);
    
    // Validation finale des relations
    const allRelationsValid = notesMensuelles.every(g => 
      g.student_id && studentIds.has(g.student_id)
    );
    console.log('6. VALIDATION FINALE - toutes les relations valides:', allRelationsValid);
    
    if (!Array.isArray(notesMensuelles)) {
      console.log('❌ notesMensuelles n\'est pas un array');
      return {};
    }
    
    const transformed = {};
    const studentIdsInGrades = new Set();
    const validStudentIdsFromEleves = new Set(eleves?.map(e => e.id) || []);
    
    notesMensuelles.forEach(note => {
      if (!note.student_id) {
        console.log('⚠️ Note sans student_id:', note);
        return;
      }
      
      studentIdsInGrades.add(note.student_id);
      
      // Vérifier si le student_id existe dans la liste des élèves
      if (!validStudentIdsFromEleves.has(note.student_id)) {
        console.log('❌ ÉLÈVE NON TROUVÉ pour note:', {
          student_id: note.student_id,
          subject: note.subject,
          grade: note.grade
        });
        return; // Ignorer les notes avec student_id invalides
      }
      
      transformed[note.student_id] = buildStudentGradeReport({
        eleveId: note.student_id,
        notesMensuelles,
        colonnesBoker,
        colonnesFormation
      });
    });
    
    console.log('3. Student_id dans grades:', Array.from(studentIdsInGrades));
    console.log('4. Student_id valides:', Array.from(validStudentIds));
    console.log('5. Notes transformées (élèves valides seulement):', Object.keys(transformed));
    
    return transformed;
  }, [notesMensuelles, eleves, colonnesBoker, colonnesFormation]);

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

  const getClasseMoyenne = (moyenne) => {
    if (moyenne === null) return '';
    if (moyenne < 50) return 'grade-red';
    if (moyenne < 70) return 'grade-orange';
    return 'grade-green';
  };

  const getReportForEleve = (eleve) => rapportsParEleve[eleve.id] || buildStudentGradeReport({
    eleveId: eleve.id,
    notesMensuelles,
    colonnesBoker,
    colonnesFormation
  });

  const getWeeklyCellValue = (subjectReport, week) => {
    const notes = subjectReport.notes || [];
    const explicitWeeklyNotes = notes.filter(note => note.week === week);
    const fallbackWeeklyNote = notes.every(note => note.week === null)
      ? notes[week - 1]
      : null;
    const weeklyGrades = explicitWeeklyNotes.length > 0
      ? explicitWeeklyNotes.map(note => note.gradeNumber)
      : fallbackWeeklyNote
        ? [fallbackWeeklyNote.gradeNumber]
        : [];

    if (weeklyGrades.length === 0) return '';
    const weeklyAverage = weeklyGrades.reduce((sum, grade) => sum + grade, 0) / weeklyGrades.length;
    return formatGrade(weeklyAverage);
  };

  const updateNote = useCallback(async (eleveId, subject, value, week = semaineActuelle) => {
    console.log('=== UPDATE NOTE BILAN MENSUEL ===');
    console.log('1. Élève ID demandé:', eleveId);
    console.log('2. Élèves disponibles:', eleves?.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}` })) || []);
    
    const noteValue = value === '' ? null : parseFloat(value);
    // Validation des notes 0-100
    if (noteValue !== null && (noteValue < 0 || noteValue > 100)) {
      console.warn('Note hors limites (0-100):', noteValue);
      return;
    }
    
    // Protection: si students pas encore chargé, ignorer silencieusement
    if (!eleves || eleves.length === 0) {
      console.warn('⚠️ Students pas encore chargés - updateNote ignoré');
      return;
    }
    
    // Trouver l'élève dans la liste locale
    const eleve = eleves.find(e => e.id === eleveId);
    if (!eleve) {
      // Protection: ignorer silencieusement au lieu de crasher
      console.warn('⚠️ ÉLÈVE NON TROUVÉ dans la liste locale:', eleveId);
      console.log('IDs disponibles:', eleves?.map(e => e.id) || []);
      
      // Optionnel: essayer de recharger les élèves depuis Supabase (une seule tentative)
      console.log('🔄 Tentative de rechargement des élèves...');
      try {
        const { data: reloadedStudents } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', userId);
        
        if (reloadedStudents && reloadedStudents.length > 0) {
          console.log('Élèves rechargés:', reloadedStudents.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}` })));
          
          const reloadedEleve = reloadedStudents.find(e => e.id === eleveId);
          if (reloadedEleve) {
            console.log('✅ Élève trouvé après rechargement:', reloadedEleve);
            // Mettre à jour la liste locale et continuer
            setEleves(reloadedStudents);
          } else {
            console.warn('⚠️ Élève toujours non trouvé après rechargement - updateNote ignoré');
            return;
          }
        } else {
          console.warn('⚠️ Aucun élève rechargé - updateNote ignoré');
          return;
        }
      } catch (error) {
        console.warn('⚠️ Erreur lors du rechargement des élèves:', error);
        return;
      }
    }
    
    try {
      // Sauvegarder la note avec la nouvelle structure (MÊME LOGIQUE QUE DASHBOARD)
      await gradesService.upsert(userId, {
        student_id: eleveId,
        subject: getWeeklySubjectKey(subject, week),
        grade: noteValue
      }, sessionContext);
      
      console.log(`Bilan Mensuel: Note ${noteValue} pour ${eleve.name || `${eleve.firstName} ${eleve.lastName}`}, ${subject}`);
      
      // Recharger les notes pour synchronisation (MÊME LOGIQUE QUE DASHBOARD)
      const updatedNotes = await gradesService.getAll(userId, sessionContext);
      setNotesMensuelles(updatedNotes);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la note (Bilan Mensuel):', error);
    }
  }, [userId, eleves, setNotesMensuelles, semaineActuelle, sessionContext]);

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

  const resetNotes = async () => {
    if (!window.confirm(`Voulez-vous vraiment réinitialiser toutes les notes du bulletin mensuel ?\nCette action effacera toutes les notes N1, N2, N3, N4 pour tous les élèves.`)) return;

    try {
      await gradesService.deleteAll(userId);
      setNotesMensuelles([]);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des notes du bulletin mensuel:', error);
      alert('Erreur lors de la réinitialisation des notes');
    }
  };

  const thBase = { padding: '14px', textAlign: 'center', fontSize: '15px', fontWeight: 'bold', borderBottom: '2px solid var(--border-color)', whiteSpace: 'nowrap' };
  const hasNoMonthlyNotes = Array.isArray(notesMensuelles) && notesMensuelles.length === 0;

  
  // Afficher l'écran de loading si les données ne sont pas synchronisées
  if (!isDataReady) {
    return (
      <div style={{ 
        backgroundColor: 'var(--bg-primary)', 
        minHeight: '92vh',
        width: '98vw',
        maxWidth: 'none',
        margin: '0',
        padding: '24px 32px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Chargement du bulletin mensuel...</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Synchronisation des élèves et des notes en cours
          </p>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid var(--border-color)', 
            borderTop: '4px solid var(--primary-color)', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (hasNoMonthlyNotes) {
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
            <Button onClick={onBack} variant="secondary" size="medium">
              ← Retour
            </Button>
            <h1 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>Bulletin Mensuel</h1>
            <div style={{ width: '90px' }} />
          </div>
        </header>

        <main style={{ 
          minHeight: 'calc(92vh - 112px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem'
        }}>
          <div style={{
            maxWidth: '620px',
            width: '100%',
            textAlign: 'center',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '18px',
            padding: '3rem 2rem',
            boxShadow: '0 18px 45px rgba(0, 0, 0, 0.12)'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              backgroundColor: 'var(--primary-light, rgba(251, 191, 36, 0.16))',
              color: 'var(--primary-color, #f59e0b)',
              fontSize: '2rem'
            }}>
              📝
            </div>
            <h2 style={{
              color: 'var(--text-primary)',
              fontSize: '1.8rem',
              margin: '0 0 0.75rem',
              fontWeight: '700'
            }}>
              Vous n'avez encore saisi aucune note.
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              lineHeight: '1.6',
              margin: '0 auto 2rem',
              maxWidth: '480px'
            }}>
              Ajoutez des notes depuis le tableau de bord pour générer automatiquement le bilan mensuel.
            </p>
            <Button onClick={onBack} variant="premium" size="medium">
              Retour au tableau de bord
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const renderSectionTable = (title, subjectsKey, averageKey, headerColor, headerBg) => {
    const firstReport = Array.isArray(eleves) && eleves.length > 0 ? getReportForEleve(eleves[0]) : null;
    const subjects = firstReport?.[subjectsKey] || [];
    const weekColumns = [1, 2, 3, 4];

    return (
      <section style={{ marginBottom: '2rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem' }}>
        <h2 style={{ color: headerColor, margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 'bold' }}>{title}</h2>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: `${Math.max(900, 180 + subjects.length * 5 * 90)}px` }}>
            <thead>
              <tr>
                <th rowSpan={2} style={{ ...thBase, textAlign: 'left', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-header)', position: 'sticky', left: 0, zIndex: 4, minWidth: '160px', verticalAlign: 'middle' }}>Nom de l'élève</th>
                {subjects.map(subjectReport => (
                  <th key={subjectReport.id} colSpan={5} style={{ ...thBase, backgroundColor: headerBg, color: headerColor, minWidth: '400px' }}>{subjectReport.name}</th>
                ))}
                <th rowSpan={2} style={{ ...thBase, backgroundColor: headerColor, color: 'white', minWidth: '140px', verticalAlign: 'middle' }}>Moyenne générale</th>
              </tr>
              <tr>
                {subjects.map(subjectReport => (
                  <React.Fragment key={`${subjectReport.id}-notes-header`}>
                    {weekColumns.map((week) => (
                      <th key={`${subjectReport.id}-week-${week}`} style={{ ...thBase, backgroundColor: headerBg, color: headerColor, minWidth: '80px', fontSize: '11px' }}>N{week}</th>
                    ))}
                    <th key={`${subjectReport.id}-average`} style={{ ...thBase, backgroundColor: headerColor, color: 'white', minWidth: '90px', fontSize: '11px' }}>Moy.</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.isArray(eleves) && eleves.map((eleve, eleveIndex) => {
                const rapport = getReportForEleve(eleve);
                const rowSubjects = rapport[subjectsKey] || [];
                const rowBg = eleveIndex % 2 === 0 ? backgroundWhite : backgroundAlternate;
                return (
                  <tr key={`${title}-${eleve.id}`} style={{ backgroundColor: rowBg }}>
                    <td style={{ padding: '14px 18px', fontWeight: 'bold', color: textPrimary, backgroundColor: rowBg, position: 'sticky', left: 0, zIndex: 1, borderBottom: `1px solid ${border}`, whiteSpace: 'nowrap' }}>
                      {eleve.firstName} {eleve.lastName}
                    </td>
                    {rowSubjects.map(subjectReport => (
                      <React.Fragment key={`${eleve.id}-${subjectReport.id}`}>
                        {weekColumns.map((week) => {
                          const weeklyValue = getWeeklyCellValue(subjectReport, week);
                          return (
                          <td key={`${eleve.id}-${subjectReport.id}-week-${week}`} style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${border}` }}>
                            <NoteInput value={weeklyValue} onChange={v => updateNote(eleve.id, subjectReport.id, v, week)} width="55px" />
                          </td>
                          );
                        })}
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', backgroundColor: headerBg, borderBottom: `1px solid ${border}` }}>
                          <span className={getClasseMoyenne(subjectReport.average)}>{subjectReport.average ?? '—'}</span>
                        </td>
                      </React.Fragment>
                    ))}
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', backgroundColor: headerBg, borderBottom: `1px solid ${border}` }}>
                      <span className={getClasseMoyenne(rapport[averageKey])}>{rapport[averageKey] ?? '—'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

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
          <Button onClick={onBack} variant="secondary" size="medium">
            ← Retour
          </Button>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>Bulletin Mensuel</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button onClick={resetNotes} variant="premium" size="medium" style={{ backgroundColor: '#dc2626' }}>
              🔄 Réinitialiser les notes
            </Button>
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
              <Button onClick={() => { setShowModal(false); setNomControle(''); setMatiereChoisie(''); }} variant="secondary" size="small">Annuler</Button>
              <Button onClick={ajouterControle} disabled={!nomControle.trim() || !matiereChoisie} variant="premium" size="small">Ajouter</Button>
            </div>
          </div>
        </div>
      )}

      <main style={{ padding: '1.5rem 1rem' }}>
        {renderSectionTable('SECTION BOKER', 'bokerSubjects', 'bokerAverage', '#1976d2', '#e3f2fd')}
        {renderSectionTable('SECTION FORMATION PROFESSIONNELLE', 'formationSubjects', 'formationAverage', '#e65100', '#fff3e0')}

        <section style={{ marginTop: '2rem', marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--border-color)', borderRadius: '14px' }}>
          <h2 style={{ color: 'var(--text-primary)', margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 'bold' }}>RÉCAPITULATIF GLOBAL</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {Array.isArray(eleves) && eleves.map((eleve) => {
              const rapport = getReportForEleve(eleve);
              return (
                <div key={`global-${eleve.id}`} style={{ padding: '1rem', borderRadius: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ color: textPrimary, fontWeight: 'bold', marginBottom: '0.75rem' }}>{eleve.firstName} {eleve.lastName}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}><span>Moyenne Boker</span><strong>{rapport.bokerAverage ?? '—'}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}><span>Moyenne Formation</span><strong>{rapport.formationAverage ?? '—'}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: textPrimary, fontSize: '1.1rem', fontWeight: 'bold', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}><span>Moyenne Générale Totale</span><span className={getClasseMoyenne(rapport.totalAverage)}>{rapport.totalAverage ?? '—'}</span></div>
                </div>
              );
            })}
          </div>
        </section>

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
      </main>
    </div>
  );
}

export default BilanMensuel;