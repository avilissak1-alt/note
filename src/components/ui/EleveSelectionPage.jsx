import React, { useState, useMemo } from 'react';

function EleveSelectionPage({ onBack, onEleveSelect, eleves, notesMensuelles, colonnesBoker, colonnesFormation }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Calculer la moyenne générale pour chaque élève
  const elevesAvecMoyennes = useMemo(() => {
    return eleves.map(eleve => {
      const eleveNotes = notesMensuelles[eleve.id] || {};
      
      // Calculer la moyenne générale
      let totalNotes = 0;
      let countNotes = 0;
      
      // Parcourir toutes les matières (Boker + Formation)
      [...colonnesBoker, ...colonnesFormation].forEach(col => {
        if (eleveNotes[col.id]) {
          eleveNotes[col.id].forEach(note => {
            if (note !== null && note !== undefined && !isNaN(note)) {
              totalNotes += parseFloat(note);
              countNotes++;
            }
          });
        }
      });
      
      const moyenneGenerale = countNotes > 0 ? (totalNotes / countNotes).toFixed(2) : null;
      
      return {
        ...eleve,
        moyenneGenerale,
        nombreNotes: countNotes
      };
    });
  }, [eleves, notesMensuelles, colonnesBoker, colonnesFormation]);

  // Filtrer les élèves selon le terme de recherche
  const elevesFiltres = useMemo(() => {
    if (!searchTerm) return elevesAvecMoyennes;
    
    const term = searchTerm.toLowerCase();
    return elevesAvecMoyennes.filter(eleve => 
      eleve.firstName.toLowerCase().includes(term) ||
      eleve.lastName.toLowerCase().includes(term)
    );
  }, [elevesAvecMoyennes, searchTerm]);

  const getClasseMoyenne = (moyenne) => {
    if (moyenne === null) return '';
    if (moyenne >= 16) return 'grade-green';
    if (moyenne >= 12) return 'grade-orange';
    if (moyenne >= 10) return 'grade-yellow';
    return 'grade-red';
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
          <button onClick={onBack} style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ← Retour
          </button>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>🔍 Inspecter Élève</h1>
          <div style={{ width: '200px' }}></div>
        </div>
      </header>

      <main style={{ padding: '2rem 0' }}>
        {/* Barre de recherche */}
        <div style={{ marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          <input
            type="text"
            placeholder="Rechercher un élève..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: 'var(--input-bg)',
              color: 'var(--input-text)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '16px',
              fontFamily: 'Palatino, Palatino Linotype, serif'
            }}
          />
        </div>

        {/* Grille d'élèves */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '1.5rem',
          padding: '0 1rem'
        }}>
          {elevesFiltres.map(eleve => (
            <div
              key={eleve.id}
              onClick={() => onEleveSelect(eleve)}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'Palatino, Palatino Linotype, serif'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(214, 185, 140, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                    {eleve.firstName} {eleve.lastName}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                    {eleve.nombreNotes} note{eleve.nombreNotes !== 1 ? 's' : ''} enregistrée{eleve.nombreNotes !== 1 ? 's' : ''}
                  </p>
                </div>
                <div style={{ 
                  backgroundColor: 'var(--button-primary)', 
                  color: 'var(--button-text)', 
                  padding: '8px 12px', 
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  Détails →
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                {eleve.moyenneGenerale ? (
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      Moyenne générale
                    </div>
                    <div className={getClasseMoyenne(parseFloat(eleve.moyenneGenerale))} style={{ 
                      fontSize: '1.8rem', 
                      fontWeight: 'bold',
                      margin: 0
                    }}>
                      {eleve.moyenneGenerale}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                    Aucune note enregistrée
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {elevesFiltres.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
              Aucun élève trouvé
            </div>
            <div>
              {searchTerm ? 'Essayez une autre recherche' : 'Aucun élève enregistré'}
            </div>
          </div>
        )}
      </main>

      <style>{`
        .grade-green { color: #16a34a; }
        .grade-orange { color: #ea580c; }
        .grade-yellow { color: #ca8a04; }
        .grade-red { color: #dc2626; }
      `}</style>
    </div>
  );
}

export default EleveSelectionPage;
