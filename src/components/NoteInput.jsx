import React, { useState, useEffect } from 'react';

function NoteInput({ value, onChange, width = '65px' }) {
  const [localValue, setLocalValue] = useState(value ?? '');
  
  useEffect(() => {
    setLocalValue(value ?? '');
  }, [value]);
  
  return (
    <input
      type="number"
      min="0"
      max="100"
      step="0.5"
      value={localValue}
      onChange={e => {
        const v = e.target.value
        setLocalValue(v)
      }}
      onBlur={e => {
        let v = e.target.value
        if (v !== '' && parseFloat(v) > 100) v = '100'
        onChange(v)
      }}
      style={{
        width: width,
        textAlign: 'center',
        padding: '4px',
        backgroundColor: 'var(--input-bg)',
        color: 'var(--input-text)',
        border: '1px solid var(--border-color)',
        borderRadius: '4px'
      }}
      placeholder="—"
    />
  );
}

export default NoteInput;
