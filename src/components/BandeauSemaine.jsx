import React, { useState, useEffect } from 'react';

function BandeauSemaine({ theme, semaineActuelle, setSemaineActuelle }) {
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
      justifyContent: 'center',
      alignItems: 'center',
      gap: '30px'
    }}>
      {/* Bouton semaine précédente */}
      <button
        onClick={semainePrecedente}
        disabled={semaineActuelle <= 1}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          cursor: semaineActuelle <= 1 ? 'not-allowed' : 'pointer',
          opacity: semaineActuelle <= 1 ? 0.5 : 1,
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        ← Semaine précédente
      </button>

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
      <button
        onClick={semaineSuivante}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        Semaine suivante →
      </button>
    </div>
  );
}

export default BandeauSemaine;
