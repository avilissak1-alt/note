import React from 'react';
import Button from '../components/ui/Button';

function ProfilPage({ user, onBack, onLogout, onTeachers }) {
  const metadata = user?.user_metadata || {};
  const displayName = metadata.full_name || metadata.name || user?.email?.split('@')[0] || 'Professeur';
  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }) : 'Non disponible';

  const cardStyle = {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '14px',
    padding: '1.5rem',
    boxShadow: '0 10px 28px rgba(0, 0, 0, 0.08)'
  };

  const mutedStyle = {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    lineHeight: '1.6'
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '92vh', width: '98vw', maxWidth: 'none', margin: 0, padding: '24px 32px', fontFamily: 'Palatino, Palatino Linotype, serif' }}>
      <header style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', padding: '0 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          <Button onClick={onBack} variant="secondary" size="medium">← Retour</Button>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>Profil</h1>
          <Button onClick={onLogout} variant="secondary" size="small">Déconnexion</Button>
        </div>
      </header>

      <main style={{ padding: '2rem 1rem', display: 'grid', gap: '1.5rem' }}>
        <section style={cardStyle}>
          <h2 style={{ color: 'var(--text-primary)', margin: '0 0 1rem', fontSize: '1.25rem' }}>Informations du professeur</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>Nom</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.1rem' }}>{displayName}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>Email</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.1rem' }}>{user?.email || 'Non disponible'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>Date de création du compte</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.1rem' }}>{createdAt}</div>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ color: 'var(--text-primary)', margin: '0 0 1rem', fontSize: '1.25rem' }}>Établissement</h2>
          <p style={mutedStyle}>Aucune information d’établissement n’est encore renseignée.</p>
          <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '10px', backgroundColor: 'var(--bg-primary)', border: '1px dashed var(--border-color)', color: 'var(--text-secondary)' }}>
            Structure prévue : Établissement → Professeurs → Élèves → Bulletins → Emails.
          </div>
        </section>

        {onTeachers && (
          <section style={cardStyle}>
            <h2 style={{ color: 'var(--text-primary)', margin: '0 0 1rem', fontSize: '1.25rem' }}>Gestion des professeurs</h2>
            <p style={mutedStyle}>Créer les comptes professeurs, attribuer les matières, désactiver les accès et réinitialiser les mots de passe.</p>
            <div style={{ marginTop: '1rem' }}>
              <Button onClick={onTeachers} variant="premium" size="medium">👨‍🏫 Ouvrir la gestion des professeurs</Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default ProfilPage;
