import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DirectorDashboard from './pages/DirectorDashboard.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';
import TeachersManagementPage from './pages/TeachersManagementPage.jsx';
import RoleSelection from './pages/RoleSelection.jsx';
import BilanMensuel from './components/charts/BilanMensuel.jsx';
import BilanTrimestriel from './components/charts/BilanTrimestriel.jsx';
import EleveSelectionPage from './components/ui/EleveSelectionPage.jsx';
import EleveAnalysePage from './pages/EleveAnalysePage.jsx';
import ProfesseurPage from './pages/ProfesseurPage.jsx';
import ProfilPage from './pages/ProfilPage.jsx';
import BandeauSemaine from './components/ui/BandeauSemaine.jsx';
import { atomicSyncService } from './services/atomicSyncService.js';
import { multiSchoolService } from './services/multiSchoolService.js';
import './index.css';

function AppContent() {
  const { user, loading, signOut, initialized } = useAuth();
  const [currentPage, setCurrentPage] = useState('role-selection');
  const [role, setRole] = useState(null);
  const [expectedRole, setExpectedRole] = useState(null);
  const [sessionContext, setSessionContext] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark'
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [eleves, setEleves] = useState([]);
  const [colonnesBoker, setColonnesBoker] = useState([
    { id: 'boker_1', nom: 'חסידות בוקר', matiere: 'boker_sadot' },
    { id: 'boker_2', nom: 'עיון', matiere: 'iyun' },
    { id: 'boker_3', nom: 'חסידות ערב', matiere: 'boker_arav' },
    { id: 'boker_4', nom: 'הלכה', matiere: 'halka' },
  ]);
  const [colonnesFormation, setColonnesFormation] = useState([
    { id: 'form_1', nom: 'Graphisme', matiere: 'graphisme' },
    { id: 'form_2', nom: 'Marketing', matiere: 'marketing' },
    { id: 'form_3', nom: 'Développement', matiere: 'developpement' },
    { id: 'form_4', nom: 'IA', matiere: 'ia' },
    { id: 'form_5', nom: 'Français', matiere: 'francais' },
  ]);
  const [semaineActuelle, setSemaineActuelle] = useState(1);
  const [notesMensuelles, setNotesMensuelles] = useState([]);
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);

  // Gestion robuste de la session
  useEffect(() => {
    console.log('=== APP AUTH EFFECT ===');
    console.log('initialized:', initialized);
    console.log('loading:', loading);
    console.log('user présent:', !!user);
    console.log('user id:', user?.id || null);
    console.log('currentPage au moment auth effect:', currentPage);
    if (initialized && !loading) {
      setIsInitialized(true);
      
      // Redirection automatique selon l'état de l'utilisateur
      if (user) {
        const initializeSession = async () => {
          try {
            const selectedRole = expectedRole || localStorage.getItem(`activeRole_${user.id}`);

            if (!selectedRole) {
              setRole(null);
              setSessionContext(null);
              setCurrentPage('role-selection');
              return;
            }

            const nextSessionContext = await multiSchoolService.buildSessionContext(user.id, selectedRole);
            setRole(nextSessionContext.role);
            setSessionContext(nextSessionContext);
            localStorage.setItem(`activeRole_${user.id}`, nextSessionContext.role);
            setCurrentPage('dashboard');
            await loadUserData(nextSessionContext);
          } catch (error) {
            console.error('Erreur initialisation contexte multi-écoles:', error);
            setRole(null);
            setSessionContext(null);
            localStorage.removeItem(`activeRole_${user.id}`);
            await signOut();
          }
        };

        initializeSession();
      } else {
        console.log('APP AUTH EFFECT sans user: setEleves([])');
        setEleves([]);
        setNotesMensuelles([]);
        setRole(null);
        setSessionContext(null);
        setCurrentPage(expectedRole ? 'auth' : 'role-selection');
      }
    }
  }, [user, loading, initialized]);

  // Maintenir la session après refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Sauvegarder l'état avant le refresh
      if (user) {
        sessionStorage.setItem('lastActiveUser', user.id);
        sessionStorage.setItem('lastActiveTime', Date.now().toString());
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

  const loadUserData = async (nextSessionContext = sessionContext) => {
    if (!user) return;
    
    setDataLoading(true);
    try {
      console.log('=== CHARGEMENT DONNÉES UTILISATEUR - SYNCHRONISATION ATOMIQUE ===');
      
      // SYNCHRONISATION ATOMIQUE - charge students ET grades de manière cohérente
      console.log('1. Synchronisation atomique des données...');
      console.log('   - Timestamp début sync:', new Date().toISOString());
      console.log('   - User ID:', user.id);
      
      const atomicResult = await atomicSyncService.syncAtomicData(user.id, nextSessionContext);
      
      console.log('   - Timestamp fin sync:', new Date().toISOString());
      console.log('   - Students retournés:', atomicResult.students?.length || 0);
      console.log('   - IDs students retournés:', atomicResult.students?.map(student => student.id) || []);
      console.log('   - Grades retournés:', atomicResult.grades?.length || 0);
      
      // Mise à jour des states React avec les données atomiquement synchronisées
      console.log('2. Mise à jour des states React avec données cohérentes...');
      console.log('   - AVANT setEleves - eleves actuels:', eleves?.length || 0);
      console.log('   - setEleves va recevoir length:', atomicResult.students?.length || 0);
      console.log('   - setEleves va recevoir ids:', atomicResult.students?.map(student => student.id) || []);
      
      setEleves(atomicResult.students);
      
      console.log('   - APRÈS setEleves - nouvelle longueur:', atomicResult.students?.length || 0);
      console.log('   - AVANT setNotesMensuelles - notes actuelles:', notesMensuelles?.length || 0);
      
      setNotesMensuelles(atomicResult.grades);
      
      console.log('   - APRÈS setNotesMensuelles - nouvelle longueur:', atomicResult.grades?.length || 0);
      console.log('   - Timestamp fin mise à jour states:', new Date().toISOString());
      
      console.log('=== RÉSULTAT SYNCHRONISATION ATOMIQUE ===');
      console.log('Students synchronisés:', atomicResult.metadata.studentsCount);
      console.log('Grades synchronisés:', atomicResult.metadata.gradesCount);
      console.log('Grades orphelins supprimés:', atomicResult.metadata.orphanedGradesRemoved);
      console.log('Cohérence finale:', atomicResult.metadata.isConsistent ? '✅ PARFAITE' : '⚠️ PARTIELLE');
      
      if (!atomicResult.metadata.isConsistent) {
        console.warn('⚠️ Incohérences résiduelles détectées');
      } else {
        console.log('✅ SYNCHRONISATION ATOMIQUE RÉUSSIE - Application prête');
      }
      
      // Synchroniser les élèves locaux avec les données propres
      const localEleves = null;
      
      if (localEleves) {
        const parsedLocalEleves = JSON.parse(localEleves);
        // Fusionner les élèves locaux avec les données atomiquement synchronisées
        const mergedEleves = [...atomicResult.students];
        parsedLocalEleves.forEach(localEleve => {
          if (!atomicResult.students.find(s => s.id === localEleve.id)) {
            // L'élève local n'existe pas dans Supabase, l'ajouter
            mergedEleves.push(localEleve);
          }
        });
        console.log('4. setEleves fusion localStorage va recevoir length:', mergedEleves.length);
        console.log('4. setEleves fusion localStorage va recevoir ids:', mergedEleves.map(student => student.id));
        setEleves(mergedEleves);
        console.log('4. Élèves locaux fusionnés:', mergedEleves.length);
      }
    } finally {
      setDataLoading(false);
    }
  };

  // Appliquer le thème au document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Sauvegarde du thème
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Switch vers le thème premium
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    
    // Appliquer le thème au document
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  };

  // Afficher la page de chargement pendant la vérification de la session
  if (loading || !isInitialized) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Palatino, Palatino Linotype, serif'
      }}>
        <div style={{
          color: '#fbbf24',
          fontSize: '1.5rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(251, 191, 36, 0.3)',
            borderTop: '3px solid #fbbf24',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div>Vérification de la session...</div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Redirection automatique vers AuthPage si non connecté
  if (!user) {
    if (!expectedRole) {
      return (
        <RoleSelection
          user={null}
          onSelectRole={(nextRole) => {
            setExpectedRole(nextRole);
            setCurrentPage('auth');
          }}
          onLogout={() => {}}
        />
      );
    }

    return <AuthPage expectedRole={expectedRole} onBack={() => setExpectedRole(null)} />;
  }

  const selectRole = async (nextRole) => {
    try {
      const nextSessionContext = await multiSchoolService.buildSessionContext(user.id, nextRole);
      setRole(nextSessionContext.role);
      setExpectedRole(nextSessionContext.role);
      setSessionContext(nextSessionContext);
      localStorage.setItem(`activeRole_${user.id}`, nextSessionContext.role);
      setCurrentPage('dashboard');
      await loadUserData(nextSessionContext);
    } catch (error) {
      console.error('Rôle non autorisé:', error);
      alert(error.message || 'Rôle non autorisé');
    }
  };

  const clearRole = () => {
    setRole(null);
    setExpectedRole(null);
    setSessionContext(null);
    localStorage.removeItem(`activeRole_${user.id}`);
    setCurrentPage('role-selection');
  };

  if (currentPage === 'role-selection' || !role) {
    return (
      <RoleSelection
        user={user}
        onSelectRole={selectRole}
        onLogout={async () => {
          setExpectedRole(null);
          setSessionContext(null);
          await signOut();
        }}
      />
    );
  }

  // Wrapper pour les pages avec bandeau
  const PageAvecBandeau = ({ children }) => (
    <div>
      <BandeauSemaine 
        theme={theme}
        semaineActuelle={semaineActuelle}
        setSemaineActuelle={setSemaineActuelle}
        onMensuel={() => setCurrentPage('mensuel')}
        onTrimestriel={() => setCurrentPage('trimestriel')}
        onInspectEleve={() => setCurrentPage('inspect-eleve-selection')}
        onProfil={() => setCurrentPage('profil')}
        onTeachers={() => setCurrentPage('teachers-management')}
        onToggleTheme={toggleTheme}
        onLogout={async () => {
          setExpectedRole(null);
          setSessionContext(null);
          await signOut();
        }}
        user={user}
      />
      {children}
    </div>
  );

  if (currentPage === 'mensuel') {
    console.log('=== APP RENDER BILAN MENSUEL ===');
    console.log('App render mensuel eleves length:', eleves?.length || 0);
    console.log('App render mensuel eleves ids:', eleves?.map(eleve => eleve.id) || []);
    console.log('App render mensuel notesMensuelles length:', notesMensuelles?.length || 0);
    console.log('App render mensuel user id:', user?.id || null);
    return (
      <PageAvecBandeau>
        <BilanMensuel 
          onBack={() => setCurrentPage('dashboard')} 
          theme={theme}
          eleves={eleves}
          setEleves={setEleves}
          colonnesBoker={colonnesBoker}
          setColonnesBoker={setColonnesBoker}
          colonnesFormation={colonnesFormation}
          setColonnesFormation={setColonnesFormation}
          notesMensuelles={notesMensuelles}
          setNotesMensuelles={setNotesMensuelles}
          semaineActuelle={semaineActuelle}
          userId={user.id}
          sessionContext={sessionContext}
        />  
      </PageAvecBandeau>
    );
  }

  if (currentPage === 'trimestriel') {
    return (
      <PageAvecBandeau>
        <BilanTrimestriel 
          onBack={() => setCurrentPage('dashboard')} 
          theme={theme}
          eleves={eleves}
          setEleves={setEleves}
          colonnesBoker={colonnesBoker}
          setColonnesBoker={setColonnesBoker}
          colonnesFormation={colonnesFormation}
          setColonnesFormation={setColonnesFormation}
          notesMensuelles={notesMensuelles}
        />
      </PageAvecBandeau>
    );
  }

  if (currentPage === 'inspect-eleve-selection') {
    return (
      <EleveSelectionPage 
        onBack={() => setCurrentPage('dashboard')}
        onEleveSelect={(eleve) => {
          setSelectedEleve(eleve);
          setCurrentPage('inspect-eleve-analyse');
        }}
        eleves={eleves}
        notesMensuelles={notesMensuelles}
        colonnesBoker={colonnesBoker}
        colonnesFormation={colonnesFormation}
      />
    );
  }

  if (currentPage === 'inspect-eleve-analyse') {
    return (
      <EleveAnalysePage 
        onBack={() => {
          setSelectedEleve(null);
          setCurrentPage('inspect-eleve-selection');
        }}
        eleve={selectedEleve}
        notesMensuelles={notesMensuelles}
        colonnesBoker={colonnesBoker}
        colonnesFormation={colonnesFormation}
        semaineActuelle={semaineActuelle}
      />
    );
  }

  if (currentPage === 'teachers-management') {
    return (
      <TeachersManagementPage
        onBack={() => setCurrentPage('dashboard')}
        sessionContext={sessionContext}
        colonnesBoker={colonnesBoker}
        colonnesFormation={colonnesFormation}
      />
    );
  }

  if (currentPage === 'professeur') {
    return (
      <ProfesseurPage 
        user={user}
        onLogout={async () => {
          setExpectedRole(null);
          setSessionContext(null);
          await signOut();
        }}
        onBack={() => setCurrentPage('dashboard')}
      />
    );
  }

  if (currentPage === 'profil') {
    return (
      <ProfilPage
        user={user}
        onLogout={async () => {
          setExpectedRole(null);
          setSessionContext(null);
          await signOut();
        }}
        onBack={() => setCurrentPage('dashboard')}
        onTeachers={() => setCurrentPage('teachers-management')}
      />
    );
  }

  if (role === 'teacher') {
    return (
      <TeacherDashboard
        user={user}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={async () => {
          setExpectedRole(null);
          setSessionContext(null);
          await signOut();
        }}
        onBackToRoles={clearRole}
        eleves={eleves}
        colonnesBoker={colonnesBoker}
        colonnesFormation={colonnesFormation}
        notesMensuelles={notesMensuelles}
        setNotesMensuelles={setNotesMensuelles}
        semaineActuelle={semaineActuelle}
        setSemaineActuelle={setSemaineActuelle}
        userId={user.id}
        sessionContext={sessionContext}
      />
    );
  }

  // Page par défaut : Dashboard Directeur
  return (
    <DirectorDashboard 
      onMensuel={() => setCurrentPage('mensuel')} 
      onTrimestriel={() => setCurrentPage('trimestriel')}
      onInspectEleve={() => setCurrentPage('inspect-eleve-selection')}
      onProfil={() => setCurrentPage('profil')}
      onTeachers={() => setCurrentPage('teachers-management')}
      onLogout={async () => {
        setExpectedRole(null);
        setSessionContext(null);
        await signOut();
      }}
      theme={theme}
      onToggleTheme={toggleTheme}
      eleves={eleves}
      setEleves={setEleves}
      colonnesBoker={colonnesBoker}
      setColonnesBoker={setColonnesBoker}
      colonnesFormation={colonnesFormation}
      setColonnesFormation={setColonnesFormation}
      notesMensuelles={notesMensuelles}
      setNotesMensuelles={setNotesMensuelles}
      semaineActuelle={semaineActuelle}
      setSemaineActuelle={setSemaineActuelle}
      userId={user.id}
      user={user}
      sessionContext={sessionContext}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
