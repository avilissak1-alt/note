import React, { memo, useCallback } from 'react';
import NoteInput from '../ui/NoteInput';

const getClasseMoyenne = (moyenne) => {
  if (moyenne === null) return '';
  if (moyenne < 50) return 'grade-red';
  if (moyenne < 70) return 'grade-orange';
  return 'grade-green';
};

// Composant optimisé pour afficher une matière avec ses notes
const MatiereRow = memo(({ eleveId, col, isBoker, onUpdateNote, onDeleteControle, notesMensuelles }) => {
  const notes = notesMensuelles?.[eleveId]?.[col.id] || [null, null, null, null];
  const validNotes = notes.filter(n => n !== null && n !== '' && n !== undefined && !isNaN(n) && Number(n) !== 0);
  const moyenne = validNotes.length > 0 
    ? (validNotes.reduce((a, b) => a + parseFloat(b), 0) / validNotes.length).toFixed(2)
    : null;

  const handleDeleteControle = useCallback((e) => {
    e.stopPropagation();
    onDeleteControle?.(col.id, isBoker ? 'boker' : 'formation');
  }, [col.id, isBoker, onDeleteControle]);

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
            onClick={handleDeleteControle}
            style={{ 
              fontSize: '10px', 
              color: '#ef4444', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              marginLeft: '8px',
              padding: '2px'
            }}
            title="Supprimer ce contrôle"
          >
            ✕
          </button>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
        {notes.map((note, index) => (
          <NoteInput
            key={`${eleveId}-${col.id}-${index}`}
            value={note}
            onChange={(value) => onUpdateNote?.(eleveId, col.id, index, value)}
            width="55px"
          />
        ))}
      </div>
      
      <div style={{
        width: '50px',
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
    <>
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
        {Array.isArray(colonnesBoker) && colonnesBoker.map(col => (
          <td key={col.id} style={{
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
              notesMensuelles={notesMensuelles}
            />
          </td>
        ))}
        
        {/* Matières Formation */}
        {Array.isArray(colonnesFormation) && colonnesFormation.map(col => (
          <td key={col.id} style={{
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
              notesMensuelles={notesMensuelles}
            />
          </td>
        ))}
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
    </>
  );
});

EleveRow.displayName = 'EleveRow';

// Composant principal du tableau d'élèves
const StudentTable = memo(({ 
  elevesAvecMoyennes, 
  colonnesBoker, 
  colonnesFormation, 
  notesMensuelles, 
  updateNote, 
  expandedEleves, 
  toggleEleve, 
  onDeleteControle 
}) => {
  const thBase = {
    padding: '10px 8px',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    borderBottom: '2px solid var(--border-color)',
    whiteSpace: 'nowrap'
  };

  return (
    <table style={{
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: 'var(--bg-primary)',
      fontSize: '13px'
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
            <th key={col.id} style={thBase}>
              {col.nom}
            </th>
          ))}
          
          {/* Matières Formation */}
          {Array.isArray(colonnesFormation) && colonnesFormation.map(col => (
            <th key={col.id} style={thBase}>
              {col.nom}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {elevesAvecMoyennes.map((eleve) => (
          <EleveRow 
            key={eleve.id}
            eleve={eleve}
            colonnesBoker={colonnesBoker}
            colonnesFormation={colonnesFormation}
            notesMensuelles={notesMensuelles}
            updateNote={updateNote}
            expanded={expandedEleves.has(eleve.id)}
            onToggle={toggleEleve}
            onDeleteControle={onDeleteControle}
          />
        ))}
      </tbody>
    </table>
  );
});

StudentTable.displayName = 'StudentTable';

export default StudentTable;
