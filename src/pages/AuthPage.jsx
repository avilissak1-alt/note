import React, { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { multiSchoolService } from '../services/multiSchoolService.js';
import Button from '../components/ui/Button.jsx';
import { theme, styles } from '../styles/theme.js';

const AuthPage = ({ expectedRole, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const submitTimeoutRef = useRef(null);
  const lastSubmitTimeRef = useRef(0);
  const blockTimeoutRef = useRef(null);

  const validateForm = () => {
    if (!email.trim()) {
      setError('L\'email est requis');
      return false;
    }
    if (!password.trim()) {
      setError('Le mot de passe est requis');
      return false;
    }
    if (!isLogin && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    return true;
  };

  const getErrorMessage = (error) => {
    // Gestion spécifique des erreurs Supabase avec messages précis
    const errorMessage = error?.message || '';
    
    // Erreurs de connexion
    if (errorMessage.includes('Invalid login credentials')) {
      return 'Mot de passe incorrect';
    }
    if (errorMessage.includes('Invalid email')) {
      return 'Email invalide';
    }
    
    // Utilisateur inexistant
    if (errorMessage.includes('User not found') || errorMessage.includes('No rows found')) {
      return 'Utilisateur inexistant';
    }
    
    // Rate limiting
    if (errorMessage.includes('Email rate limit exceeded') || errorMessage.includes('Too many requests')) {
      return 'Trop de tentatives. Veuillez attendre quelques minutes.';
    }
    
    // Erreurs d'inscription
    if (errorMessage.includes('User already registered')) {
      return 'Cet email est déjà utilisé. Essayez de vous connecter.';
    }
    if (errorMessage.includes('Password should be at least')) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }
    if (errorMessage.includes('Password is too short')) {
      return 'Le mot de passe est trop court';
    }
    
    // Erreurs de configuration
    if (errorMessage.includes('Invalid API key') || errorMessage.includes('Invalid JWT')) {
      return 'Erreur de configuration. Vérifiez les variables d\'environnement.';
    }
    
    // Erreurs réseau/serveur
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('ENOTFOUND')) {
      return 'Erreur de connexion au serveur. Vérifiez votre connexion internet.';
    }
    if (errorMessage.includes('timeout')) {
      return 'Le serveur met trop temps à répondre. Veuillez réessayer.';
    }
    
    // Erreur par défaut
    return errorMessage || 'Une erreur est survenue';
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    
    // DEBUG TEMPORAIRE - Afficher la configuration Supabase utilisée
    console.log('=== DEBUG AUTH ===');
    console.log('Supabase URL utilisée:', import.meta.env.VITE_SUPABASE_URL);
    
    // Vérifier si l'utilisateur est bloqué
    if (isBlocked) {
      setError(`Trop de tentatives. Veuillez attendre ${blockTimeRemaining} secondes`);
      return;
    }
    
    // Anti-spam intelligent : délai de 1 seconde entre tentatives
    const now = Date.now();
    if (now - lastSubmitTimeRef.current < 1000) {
      setError('Veuillez attendre avant de réessayer');
      return;
    }
    lastSubmitTimeRef.current = now;
    
    // Nettoyer tout timeout existant
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        // CONNEXION UNIQUEMENT - pas de signUp automatique
        
        // DEBUG: Vérifier les inputs avant envoi
        console.log('=== DEBUG LOGIN ===');
        console.log('Email brut:', email);
        console.log('Email type:', typeof email);
        console.log('Email undefined?', email === undefined);
        console.log('Password brut:', password);
        console.log('Password type:', typeof password);
        console.log('Password undefined?', password === undefined);
        console.log('Password length:', password?.length);
        
        // Validation stricte des inputs
        if (!email || typeof email !== 'string' || email.trim() === '') {
          setError('Email invalide ou manquant');
          setLoading(false);
          return;
        }
        
        if (!password || typeof password !== 'string' || password.trim() === '') {
          setError('Mot de passe invalide ou manquant');
          setLoading(false);
          return;
        }
        
        const cleanEmail = email.toLowerCase().trim();
        const cleanPassword = password.trim();
        
        console.log('Inputs nettoyés:');
        console.log('Email:', cleanEmail);
        console.log('Password length:', cleanPassword.length);
        console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
        
        // DEBUG COMPLET - Afficher exactement ce qui est envoyé
        console.log('=== DEBUG REQUÊTE POST ===');
        console.log('URL complète:', `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=password`);
        console.log('Email final:', cleanEmail);
        console.log('Password final:', cleanPassword);
        console.log('Password type:', typeof cleanPassword);
        console.log('Password length:', cleanPassword.length);
        console.log('Email vide?', cleanEmail === '');
        console.log('Password vide?', cleanPassword === '');
        
        // Vérification finale avant envoi
        if (!cleanEmail || cleanEmail === '') {
          console.error('❌ Email vide avant envoi');
          setError('Email invalide');
          setLoading(false);
          return;
        }
        
        if (!cleanPassword || cleanPassword === '') {
          console.error('❌ Password vide avant envoi');
          setError('Mot de passe invalide');
          setLoading(false);
          return;
        }
        
        // TENTER LA CONNEXION
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
        
        console.log('Réponse Supabase signInWithPassword:');
        console.log('Data:', data);
        console.log('Error:', error);
        
        if (error) {
          console.log('=== ERREUR 400 BAD REQUEST DÉTAILLÉE ===');
          console.log('Error object complet:', error);
          console.log('Error message:', error.message);
          console.log('Error status:', error.status);
          console.log('Error code:', error.status_code || error.code);
          console.log('Error name:', error.name);
          console.log('Error stack:', error.stack);
          
          // Analyse spécifique du 400 Bad Request
          if (error.status === 400) {
            console.log('=== ANALYSE 400 BAD REQUEST ===');
            console.log('Cause probable: invalid email ou password format');
            console.log('Email envoyé:', cleanEmail);
            console.log('Password envoyé:', cleanPassword ? '***' : 'NULL/VIDE');
            console.log('URL Supabase:', import.meta.env.VITE_SUPABASE_URL);
            
            // Essayer de voir si c'est un problème de format
            if (cleanEmail.includes('@') && cleanEmail.includes('.')) {
              console.log('✅ Email format OK');
            } else {
              console.log('❌ Email format INVALIDE');
            }
            
            if (cleanPassword.length >= 6) {
              console.log('✅ Password length OK');
            } else {
              console.log('❌ Password trop court');
            }
          }
          
          // CAS SPÉCIAL: user already exists - rediriger vers login
          if (error.message?.includes('user already exists') || error.message?.includes('User already registered')) {
            setError('Ce compte existe déjà. Utilisez le mode connexion.');
            setIsLogin(true);
            setLoading(false);
            return;
          }
          
          // Gérer les tentatives de connexion
          const newAttempts = loginAttempts + 1;
          setLoginAttempts(newAttempts);
          
          // Bloquer après 3 tentatives pendant 30 secondes
          if (newAttempts >= 3) {
            setIsBlocked(true);
            setBlockTimeRemaining(30);
            
            // Démarrer le compte à rebours
            let countdown = 30;
            const countdownInterval = setInterval(() => {
              countdown--;
              setBlockTimeRemaining(countdown);
              
              if (countdown <= 0) {
                clearInterval(countdownInterval);
                setIsBlocked(false);
                setLoginAttempts(0);
                setBlockTimeRemaining(0);
              }
            }, 1000);
            
            blockTimeoutRef.current = countdownInterval;
            
            setError('Trop de tentatives incorrectes. Veuillez attendre 30 secondes.');
          } else {
            // Message d'erreur clair pour les 2 premières tentatives
            const errorMessage = getErrorMessage(error);
            console.log('Message d\'erreur formaté:', errorMessage);
            setError(errorMessage);
          }
          
          return;
        }
        
        await multiSchoolService.buildSessionContext(data.user.id, expectedRole);
        
        setLoginAttempts(0);
        setIsBlocked(false);
        setBlockTimeRemaining(0);
        
        console.log('Connexion réussie pour:', email.toLowerCase().trim());
      } else {
        // INSCRIPTION - créer un nouveau compte
        console.log('Tentative d\'inscription avec:', email.toLowerCase().trim());
        
        const { data, error } = await supabase.auth.signUp({
          email: email.toLowerCase().trim(),
          password,
          options: {
            emailRedirectTo: undefined, // Désactiver la confirmation email en dev
            data: {
              // Données supplémentaires si nécessaire
            }
          }
        });
        
        if (error) {
          setError(getErrorMessage(error));
          return;
        }
        
        // Message de succès et basculer vers login
        setError('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
        setIsLogin(true);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        
        console.log('Inscription réussie pour:', email.toLowerCase().trim());
      }
    } catch (error) {
      await supabase.auth.signOut();
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [email, password, confirmPassword, isLogin, loginAttempts, isBlocked, blockTimeRemaining, expectedRole]);

  // Nettoyer les timeouts au démontage
  React.useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
      if (blockTimeoutRef.current) {
        clearInterval(blockTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div style={styles.page}>
      <div style={{
        ...theme.components.card,
        maxWidth: '450px',
        width: '100%',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: theme.spacing.xxl }}>
          <h1 style={{
            color: theme.colors.textPrimary,
            fontSize: theme.typography.fontSize.xxl,
            fontWeight: theme.typography.fontWeight.bold,
            marginBottom: theme.spacing.md,
            fontFamily: theme.typography.fontFamily
          }}>
            Gestion des Notes
          </h1>
          <p style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.lg,
            fontFamily: theme.typography.fontFamily
          }}>
            Connexion {expectedRole === 'director' ? 'Directeur' : 'Professeur'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={theme.components.input}
              onFocus={(e) => {
                e.target.style.borderColor = theme.colors.primary;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme.colors.border;
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            ...theme.components.input,
            padding: '0'
          }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                flex: 1,
                padding: '1rem',
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fbbf24',
                fontSize: '1rem',
                fontFamily: 'Palatino, Palatino Linotype, serif'
              }}
              onFocus={(e) => {
                e.target.parentElement.style.borderColor = '#fbbf24';
                e.target.parentElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
              }}
              onBlur={(e) => {
                e.target.parentElement.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                e.target.parentElement.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(251, 191, 36, 0.7)',
                cursor: 'pointer',
                padding: '0.75rem',
                borderRadius: '0 8px 8px 0',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#fbbf24';
                e.target.style.backgroundColor = 'rgba(251, 191, 36, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = 'rgba(251, 191, 36, 0.7)';
                e.target.style.backgroundColor = 'transparent';
              }}
              title={showPassword ? 'Masquer le mot de passe' : 'Voir le mot de passe'}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {showPassword ? (
                  // Œil barré (mot de passe masqué)
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 11 11 11a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </>
                ) : (
                  // Œil ouvert (mot de passe visible)
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </>
                )}
              </svg>
            </button>
          </div>

          {!isLogin && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              overflow: 'hidden'
            }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fbbf24',
                  fontSize: '1rem',
                  fontFamily: 'Palatino, Palatino Linotype, serif'
                }}
                onFocus={(e) => {
                  e.target.parentElement.style.borderColor = '#fbbf24';
                  e.target.parentElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.parentElement.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                  e.target.parentElement.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(251, 191, 36, 0.7)',
                  cursor: 'pointer',
                  padding: '0.75rem',
                  borderRadius: '0 8px 8px 0',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#fbbf24';
                  e.target.style.backgroundColor = 'rgba(251, 191, 36, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = 'rgba(251, 191, 36, 0.7)';
                  e.target.style.backgroundColor = 'transparent';
                }}
                title={showConfirmPassword ? 'Masquer le mot de passe' : 'Voir le mot de passe'}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {showConfirmPassword ? (
                    // Œil barré (mot de passe masqué)
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 11 11 11a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </>
                  ) : (
                    // Œil ouvert (mot de passe visible)
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </>
                  )}
                </svg>
              </button>
            </div>
          )}

          {error && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              color: '#ef4444',
              fontSize: '0.9rem',
              textAlign: 'center',
              fontFamily: 'Palatino, Palatino Linotype, serif'
            }}>
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || isBlocked}
            variant="premium"
            size="large"
            style={{
              width: '100%',
            }}
            onClick={(e) => {
              if (loading || isBlocked) {
                e.preventDefault();
                return;
              }
              // Laisser le comportement par défaut du formulaire gérer la soumission
            }}
          >
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'Créer un compte')}
          </Button>
          
          {/* Style pour l'animation de spinner */}
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Button
            type="button"
            onClick={onBack}
            variant="secondary"
            size="medium"
          >
            Retour au choix du rôle
          </Button>
        </div>
      </div>
    </div>
);
};

export default AuthPage;
