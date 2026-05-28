import React, { useState, useEffect } from 'react';
import Button from './Button';

function BandeauSemaine({ theme, semaineActuelle, setSemaineActuelle, onMensuel, onTrimestriel, onInspectEleve, selectedEleve, setSelectedEleve, onToggleTheme, onLogout, onProfil, user }) {
  const [dateDepart, setDateDepart] = useState(new Date());
  const [maintenant, setMaintenant] = useState(new Date());

  // Horloge temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setMaintenant(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Initialiser la date de départ depuis localStorage
  useEffect(() => {
    const savedDateDepart = localStorage.getItem('dateDepart');
    
    // Initialiser la date de départ une seule fois
    if (!savedDateDepart) {
      const maintenant = new Date();
      localStorage.setItem('dateDepart', maintenant.toISOString());
      setDateDepart(maintenant);
    } else {
      setDateDepart(new Date(savedDateDepart));
    }
  }, []);

  // Calculer la date affichée en fonction de la semaine actuelle
  const getDateAffichee = () => {
    const date = new Date(maintenant);
    date.setDate(date.getDate() + (semaineActuelle - 1) * 7);
    return date;
  };

  // Fonctions pour naviguer entre les semaines
  const semainePrecedente = () => {
    if (semaineActuelle > 1) {
      const nouvelle = semaineActuelle - 1;
      setSemaineActuelle(nouvelle);
      localStorage.setItem('semaineActuelle', nouvelle.toString());
    }
  };

  const semaineSuivante = () => {
    const nouvelle = semaineActuelle + 1;
    setSemaineActuelle(nouvelle);
    localStorage.setItem('semaineActuelle', nouvelle.toString());
  };

  // Affichage du jour et de la date en français
  const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  const dateAffichee = getDateAffichee();
  const jourNom = jours[dateAffichee.getDay()];
  const jour = dateAffichee.getDate();
  const moisNom = mois[dateAffichee.getMonth()];
  const annee = dateAffichee.getFullYear();

  const dateFormatee = `${jourNom} ${jour} ${moisNom} ${annee}`;

  // Format de l'heure réelle
  const heure = maintenant.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      padding: '12px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '30px'
    }}>
      {/* Section gauche - Utilisateur */}
      <div style={{
        fontSize: '14px',
        color: 'var(--text-secondary)',
        fontWeight: '500'
      }}>
        {user?.email ? user.email.split('@')[0] : 'Utilisateur'}
      </div>

      {/* Bloc semaine avec navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        {/* Bouton semaine précédente */}
        <Button
          onClick={semainePrecedente}
          disabled={semaineActuelle <= 1}
          variant="secondary"
          size="medium"
        >
          ← Semaine précédente
        </Button>

        {/* Informations de la semaine et de la date */}
        <div style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'var(--text-primary)'
          }}>
            Semaine {semaineActuelle}
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: 'var(--text-primary)'
          }}>
            {dateFormatee}
          </div>
          <div style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            fontFamily: 'monospace'
          }}>
            {heure}
          </div>
        </div>

        {/* Bouton semaine suivante */}
        <Button
          onClick={semaineSuivante}
          variant="secondary"
          size="medium"
        >
          Semaine suivante →
        </Button>
      </div>

      {/* Section droite - Boutons de navigation et profil */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        {/* Boutons de navigation */}
        <Button onClick={onMensuel} variant="premium" size="small">📊 Mensuel</Button>
        <Button onClick={onTrimestriel} variant="premium" size="small">📈 Trimestriel</Button>
        <Button onClick={onInspectEleve} variant="premium" size="small">🔍 Élève</Button>
        
        {/* Bouton thème */}
        <Button
          onClick={onToggleTheme}
          variant="secondary"
          size="small"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </Button>

        {/* Icône profil */}
        <Button
          onClick={onProfil}
          variant="premium"
          size="small"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Profil"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </Button>
      </div>
    </div>
  );
}

export default BandeauSemaine;
