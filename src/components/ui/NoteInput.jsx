import React, { useState, useEffect, useCallback, useRef, memo } from 'react';

const NoteInput = memo(({ value, onChange, width = '65px' }) => {
  const [localValue, setLocalValue] = useState(value ?? '');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const isUpdatingRef = useRef(false);
  
  useEffect(() => {
    if (!isUpdatingRef.current) {
      setLocalValue(value ?? '');
    }
    isUpdatingRef.current = false;
  }, [value]);
  
  const handleChange = useCallback((e) => {
    let v = e.target.value;
    
    // Bloquer activement les valeurs hors plage
    if (v !== '') {
      const num = parseFloat(v);
      if (!isNaN(num)) {
        // Bloquer les valeurs < 0
        if (num < 0) {
          v = '0'; // Forcer à 0
          setError('Minimum: 0 (corrigé automatiquement)');
        }
        // Bloquer les valeurs > 100
        else if (num > 100) {
          v = '100'; // Forcer à 100
          setError('Maximum: 100 (corrigé automatiquement)');
        } else {
          setError('');
        }
      } else {
        setError('Nombre invalide');
      }
    } else {
      setError('');
    }
    
    setLocalValue(v);
    isUpdatingRef.current = true;
  }, []);
  
  const handleBlur = useCallback((e) => {
    let v = e.target.value;
    
    if (v !== '') {
      const num = parseFloat(v);
      if (isNaN(num)) {
        v = ''; // Annuler si invalide
        setError('Nombre invalide (annulé)');
      } else {
        // Validation stricte pour empêcher l'envoi vers Supabase
        if (num < 0) {
          v = '0'; // Corriger automatiquement
          setError('Minimum: 0 (corrigé)');
        } else if (num > 100) {
          v = '100'; // Corriger automatiquement
          setError('Maximum: 100 (corrigé)');
        } else {
          setError(''); // Valide
        }
      }
    } else {
      setError('');
    }
    
    // Mettre à jour la valeur finale validée
    setLocalValue(v);
    onChange(v);
  }, [onChange]);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <input
        ref={inputRef}
        type="number"
        min="0"
        max="100"
        step="0.5"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        style={{
          width: width,
          textAlign: 'center',
          padding: '4px',
          backgroundColor: 'var(--input-bg)',
          color: 'var(--input-text)',
          border: error ? '1px solid #dc3545' : '1px solid var(--border-color)',
          borderRadius: '4px',
          fontSize: '12px'
        }}
        placeholder="—"
      />
      {error && (
        <div style={{
          fontSize: '10px',
          color: '#dc3545',
          marginTop: '2px',
          textAlign: 'center',
          maxWidth: width
        }}>
          {error}
        </div>
      )}
    </div>
  );
});

NoteInput.displayName = 'NoteInput';

export default NoteInput;
