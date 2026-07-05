import React from 'react';
import Button from '../components/ui/Button';

function RoleSelection({ user, onSelectRole, onLogout }) {
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Utilisateur';

  const cardStyle = {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 14px 36px rgba(0, 0, 0, 0.12)'
  };

  const roleCardStyle = {
    ...cardStyle,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
    width: '100%'
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', padding: '32px', fontFamily: 'Palatino, Palatino Linotype, serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <main style={{ width: '100%', maxWidth: '980px', display: 'grid', gap: '1.5rem' }}>
        <section style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Bienvenue, {displayName}</div>
          <h1 style={{ color: 'var(--text-primary)', margin: '0 0 0.75rem', fontSize: '2rem' }}>Qui êtes-vous ?</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Choisissez votre espace de travail pour cette session.</p>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <button onClick={() => onSelectRole('director')} style={roleCardStyle}>
            <div style={{ fontSize: '2.25rem', marginBottom: '1rem' }}>🏫</div>
            <h2 style={{ color: 'var(--text-primary)', margin: '0 0 0.75rem', fontSize: '1.4rem' }}>Directeur</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>Accès complet au Dashboard, aux élèves, matières, notes, bilans, statistiques et moyennes générales.</p>
          </button>

          <button onClick={() => onSelectRole('teacher')} style={roleCardStyle}>
            <div style={{ fontSize: '2.25rem', marginBottom: '1rem' }}>👨‍🏫</div>
            <h2 style={{ color: 'var(--text-primary)', margin: '0 0 0.75rem', fontSize: '1.4rem' }}>Professeur</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>Accès limité à la liste des élèves et à une seule matière enseignée.</p>
          </button>
        </section>

        <div style={{ textAlign: 'center' }}>
          <Button onClick={onLogout} variant="secondary" size="small">Déconnexion</Button>
        </div>
      </main>
    </div>
  );
}

export default RoleSelection;
