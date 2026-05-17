import React, { useMemo } from 'react';

function EleveAnalysePage({ onBack, eleve, notesMensuelles, colonnesBoker, colonnesFormation, semaineActuelle }) {
  
  // Calculs basés sur les notes réelles
  const analyseData = useMemo(() => {
    const eleveNotes = notesMensuelles[eleve.id] || {};
    
    // A. Moyenne par matière
    const moyennesParMatiere = {};
    const toutesMatieres = [...colonnesBoker, ...colonnesFormation];
    
    toutesMatieres.forEach(col => {
      const notes = eleveNotes[col.id] || [];
      const notesValides = notes.filter(note => note !== null && note !== undefined && !isNaN(note));
      
      if (notesValides.length > 0) {
        const moyenne = notesValides.reduce((sum, note) => sum + parseFloat(note), 0) / notesValides.length;
        moyennesParMatiere[col.id] = {
          nom: col.nom,
          moyenne: moyenne.toFixed(2),
          nombreNotes: notesValides.length,
          notes: notesValides
        };
      }
    });
    
    // B. Progression par semaine
    const progressionParSemaine = {};
    const maxSemaines = 4;
    
    for (let semaine = 1; semaine <= maxSemaines; semaine++) {
      let totalNotes = 0;
      let countNotes = 0;
      
      toutesMatieres.forEach(col => {
        const notes = eleveNotes[col.id] || [];
        const noteSemaine = notes[semaine - 1]; // Index 0-based
        
        if (noteSemaine !== null && noteSemaine !== undefined && !isNaN(noteSemaine)) {
          totalNotes += parseFloat(noteSemaine);
          countNotes++;
        }
      });
      
      if (countNotes > 0) {
        progressionParSemaine[semaine] = (totalNotes / countNotes).toFixed(2);
      }
    }
    
    // C. Calcul de progression en pourcentage
    const progressionPourcentage = {};
    const semaines = Object.keys(progressionParSemaine).map(s => parseInt(s)).sort((a, b) => a - b);
    
    for (let i = 1; i < semaines.length; i++) {
      const semaineActuelle = semaines[i];
      const semainePrecedente = semaines[i - 1];
      
      const moyenneActuelle = parseFloat(progressionParSemaine[semaineActuelle]);
      const moyennePrecedente = parseFloat(progressionParSemaine[semainePrecedente]);
      
      if (moyennePrecedente > 0) {
        const progression = ((moyenneActuelle - moyennePrecedente) / moyennePrecedente) * 100;
        progressionPourcentage[semaineActuelle] = progression.toFixed(1);
      }
    }
    
    // D. Niveau global
    const toutesLesNotes = [];
    toutesMatieres.forEach(col => {
      const notes = eleveNotes[col.id] || [];
      notes.forEach(note => {
        if (note !== null && note !== undefined && !isNaN(note)) {
          toutesLesNotes.push(parseFloat(note));
        }
      });
    });
    
    const moyenneGenerale = toutesLesNotes.length > 0 
      ? (toutesLesNotes.reduce((sum, note) => sum + note, 0) / toutesLesNotes.length).toFixed(2)
      : null;
    
    // Tendance globale
    let tendance = '→';
    if (Object.keys(progressionPourcentage).length > 0) {
      const dernierPourcentage = parseFloat(Object.values(progressionPourcentage).pop());
      if (dernierPourcentage > 0) tendance = '↑';
      else if (dernierPourcentage < 0) tendance = '↓';
    }
    
    return {
      moyennesParMatiere,
      progressionParSemaine,
      progressionPourcentage,
      moyenneGenerale,
      tendance,
      nombreTotalNotes: toutesLesNotes.length,
      matieresAvecNotes: Object.keys(moyennesParMatiere)
    };
  }, [eleve, notesMensuelles, colonnesBoker, colonnesFormation]);

  const getClasseMoyenne = (moyenne) => {
    if (moyenne === null || moyenne === undefined) return '';
    const num = parseFloat(moyenne);
    if (num >= 16) return 'grade-green';
    if (num >= 12) return 'grade-orange';
    if (num >= 10) return 'grade-yellow';
    return 'grade-red';
  };

  const getClasseProgression = (pourcentage) => {
    if (pourcentage === undefined || pourcentage === null) return '';
    const num = parseFloat(pourcentage);
    if (num > 0) return 'progression-positive';
    if (num < 0) return 'progression-negative';
    return 'progression-stable';
  };

  // Préparer les données pour le graphique radar
  const radarData = analyseData.matieresAvecNotes.map(matiereId => {
    const matiere = analyseData.moyennesParMatiere[matiereId];
    return {
      matiere: matiere.nom,
      moyenne: parseFloat(matiere.moyenne),
      fullMark: 20
    };
  });

  
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
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>
            Analyse : {eleve.firstName} {eleve.lastName}
          </h1>
          <div style={{ width: '200px' }}></div>
        </div>
      </header>

      <main style={{ padding: '2rem 0' }}>
        {analyseData.nombreTotalNotes === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              Aucune donnée disponible
            </div>
            <div>
              Cet élève n'a aucune note enregistrée.
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            
            {/* Carte Résumé Global */}
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.5rem',
              fontFamily: 'Palatino, Palatino Linotype, serif'
            }}>
              <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '1rem', textAlign: 'center' }}>
                📊 Niveau Global
              </h2>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  Moyenne générale
                </div>
                <div className={getClasseMoyenne(analyseData.moyenneGenerale)} style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: 'bold',
                  margin: '0 0 1rem 0'
                }}>
                  {analyseData.moyenneGenerale} {analyseData.tendance}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {analyseData.nombreTotalNotes} note{analyseData.nombreTotalNotes !== 1 ? 's' : ''} analysée{analyseData.nombreTotalNotes !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Carte Progression */}
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.5rem',
              fontFamily: 'Palatino, Palatino Linotype, serif'
            }}>
              <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '1rem', textAlign: 'center' }}>
                📈 Progression par Semaine
              </h2>
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                {analyseData.progressionParSemaine && Object.entries(analyseData.progressionParSemaine).map(([semaine, moyenne]) => (
                  <div key={semaine} style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                      S{semaine}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      {moyenne}
                    </div>
                    {analyseData.progressionPourcentage[semaine] && (
                      <div className={getClasseProgression(analyseData.progressionPourcentage[semaine])} style={{ fontSize: '0.8rem' }}>
                        {parseFloat(analyseData.progressionPourcentage[semaine]) > 0 ? '+' : ''}{analyseData.progressionPourcentage[semaine]}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tableau détaillé par matière */}
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.5rem',
            fontFamily: 'Palatino, Palatino Linotype, serif'
          }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '1.5rem' }}>
              📚 Moyennes par Matière
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {analyseData.moyennesParMatiere && Object.entries(analyseData.moyennesParMatiere).map(([matiereId, data]) => (
                <div key={matiereId} style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {data.nom}
                  </div>
                  <div className={getClasseMoyenne(data.moyenne)} style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {data.moyenne}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    {data.nombreNotes} note{data.nombreNotes !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visualisation simplifiée */}
          {radarData.length > 0 && (
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginTop: '2rem',
              fontFamily: 'Palatino, Palatino Linotype, serif'
            }}>
              <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '1.5rem' }}>
                🎯 Forces et Faiblesses
              </h2>
              <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                {/* Matières fortes */}
                <div style={{ flex: '1', minWidth: '250px', marginRight: '1rem' }}>
                  <h3 style={{ color: 'var(--button-primary)', marginBottom: '1rem' }}>✅ Matières fortes</h3>
                  {Array.isArray(radarData) && radarData
                    .filter(item => item.moyenne >= 14)
                    .sort((a, b) => b.moyenne - a.moyenne)
                    .map(item => (
                      <div key={item.matiere} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '0.5rem 0',
                        borderBottom: '1px solid var(--border-color)'
                      }}>
                        <span>{item.matiere}</span>
                        <span className="grade-green" style={{ fontWeight: 'bold' }}>{item.moyenne}</span>
                      </div>
                    ))}
                  {Array.isArray(radarData) && radarData.filter(item => item.moyenne >= 14).length === 0 && (
                    <div style={{ color: 'var(--text-secondary)' }}>Aucune matière forte</div>
                  )}
                </div>

                {/* Matières à améliorer */}
                <div style={{ flex: '1', minWidth: '250px' }}>
                  <h3 style={{ color: '#dc2626', marginBottom: '1rem' }}>⚠️ À améliorer</h3>
                  {Array.isArray(radarData) && radarData
                    .filter(item => item.moyenne < 12)
                    .sort((a, b) => a.moyenne - b.moyenne)
                    .map(item => (
                      <div key={item.matiere} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '0.5rem 0',
                        borderBottom: '1px solid var(--border-color)'
                      }}>
                        <span>{item.matiere}</span>
                        <span className="grade-red" style={{ fontWeight: 'bold' }}>{item.moyenne}</span>
                      </div>
                    ))}
                  {Array.isArray(radarData) && radarData.filter(item => item.moyenne < 12).length === 0 && (
                    <div style={{ color: 'var(--text-secondary)' }}>Toutes les matières sont correctes</div>
                  )}
                </div>
              </div>
            </div>
          )}
        )
          </>
        )}
      </main>
    </div>
  );
}

export default EleveAnalysePage;
