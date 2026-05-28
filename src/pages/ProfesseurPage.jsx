import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button.jsx';

const ProfesseurPage = ({ user, onLogout, onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-primary)',
        fontSize: '18px'
      }}>
        Chargement...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      padding: '20px',
      color: 'var(--text-primary)'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'var(--text-primary)'
          }}>
            Profil Professeur
          </h1>
          <p style={{
            margin: '5px 0 0 0',
            fontSize: '14px',
            color: 'var(--text-secondary)'
          }}>
            Gérez vos informations personnelles
          </p>
        </div>
        <Button
          onClick={onBack}
          variant="secondary"
          size="medium"
        >
          ← Retour au Dashboard
        </Button>
      </div>

      {/* Contenu principal */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Section Profil */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          padding: '30px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '30px',
            marginBottom: '30px'
          }}>
            {/* Avatar */}
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: '#6c757d',
              border: '3px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg
                width="50"
                height="50"
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
            </div>

            {/* Informations */}
            <div style={{ flex: 1 }}>
              <h2 style={{
                margin: '0 0 10px 0',
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'var(--text-primary)'
              }}>
                Professeur
              </h2>
              <p style={{
                margin: '0 0 20px 0',
                fontSize: '16px',
                color: 'var(--text-secondary)'
              }}>
                Compte actif
              </p>
              <Button
                variant="premium"
                size="small"
              >
                📷 Changer la photo
              </Button>
            </div>
          </div>

          {/* Informations du compte */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '5px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'var(--text-primary)'
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                readOnly
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '5px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'var(--text-primary)'
              }}>
                Rôle
              </label>
              <input
                type="text"
                value="Professeur"
                readOnly
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Section Paramètres */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          padding: '30px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'var(--text-primary)'
          }}>
            Paramètres
          </h3>

          <div style={{
            padding: '20px',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Cette section sera disponible dans une future version.
            </p>
          </div>
        </div>

        {/* Section Actions */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          padding: '30px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'var(--text-primary)'
          }}>
            Actions
          </h3>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <Button
              variant="premium"
              size="medium"
              style={{
                textAlign: 'left',
                justifyContent: 'flex-start'
              }}
            >
              📊 Statistiques d'utilisation
            </Button>

            <Button
              variant="secondary"
              size="medium"
              onClick={onLogout}
              style={{
                textAlign: 'left',
                justifyContent: 'flex-start'
              }}
            >
              🚪 Déconnexion
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfesseurPage;
