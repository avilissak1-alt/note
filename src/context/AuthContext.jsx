import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Fonction optimisée pour récupérer la session
  const getSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erreur getSession:', error);
        setUser(null);
        return null;
      }
      
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      // Vérifier si la session est encore valide
      if (currentUser && session && session.expires_at) {
        const sessionAge = Date.now() - new Date(session.expires_at * 1000).getTime();
        if (sessionAge > 0) {
          // Session expirée
          console.log('Session expirée, déconnexion...');
          await supabase.auth.signOut();
          setUser(null);
          return null;
        }
      }
      
      return currentUser;
    } catch (error) {
      console.error('Erreur lors de la récupération de la session:', error);
      setUser(null);
      return null;
    }
  }, []);

  // Vérifier et restaurer la session au chargement
  useEffect(() => {
    let mounted = true;
    let subscription = null;

    // Vérifier la session initiale avec retry
    const initializeAuth = async (retryCount = 0) => {
      try {
        if (!mounted) return;
        
        // Vérifier s'il y a une session précédente
        const lastActiveUser = sessionStorage.getItem('lastActiveUser');
        const lastActiveTime = sessionStorage.getItem('lastActiveTime');
        
        if (lastActiveUser && lastActiveTime) {
          const timeDiff = Date.now() - parseInt(lastActiveTime);
          // Si moins de 30 minutes, essayer de restaurer la session
          if (timeDiff < 30 * 60 * 1000) {
            console.log('Tentative de restauration de session...');
          }
        }
        
        const sessionUser = await getSession();
        
        if (!mounted) return;
        
        setSessionChecked(true);
        
        // Écouter les changements d'état d'authentification
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;
            
            console.log('Auth state change:', event, session?.user?.email);
            
            switch (event) {
              case 'SIGNED_IN':
                setUser(session?.user ?? null);
                setLoading(false);
                setInitialized(true);
                // Sauvegarder la session active
                if (session?.user) {
                  sessionStorage.setItem('lastActiveUser', session.user.id);
                  sessionStorage.setItem('lastActiveTime', Date.now().toString());
                }
                break;
              case 'SIGNED_OUT':
                setUser(null);
                setLoading(false);
                setInitialized(true);
                // Nettoyer la session
                sessionStorage.removeItem('lastActiveUser');
                sessionStorage.removeItem('lastActiveTime');
                break;
              case 'TOKEN_REFRESHED':
                // Mettre à jour l'utilisateur si nécessaire
                if (session?.user) {
                  setUser(session.user);
                  sessionStorage.setItem('lastActiveTime', Date.now().toString());
                }
                break;
              default:
                setLoading(false);
                setInitialized(true);
            }
          }
        );
        
        subscription = authSubscription;
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'auth:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
          setInitialized(true);
          setSessionChecked(true);
        }
        
        // Retry mechanism pour les erreurs réseau
        if (retryCount < 2 && error.message?.includes('fetch')) {
          console.log(`Retry ${retryCount + 1} pour l'initialisation...`);
          setTimeout(() => initializeAuth(retryCount + 1), 1000 * (retryCount + 1));
        }
      }
    };

    initializeAuth();

    // Nettoyage
    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [getSession]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erreur signOut:', error);
        throw error;
      }
      
      // L'état sera mis à jour par onAuthStateChange
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      setUser(null);
      setLoading(false);
      throw error;
    }
  }, []);

  const value = {
    user,
    loading: loading || !sessionChecked,
    initialized,
    sessionChecked,
    signOut,
    getSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export default AuthContext;
