import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import BilanMensuel from './components/charts/BilanMensuel.jsx';
import BilanTrimestriel from './components/charts/BilanTrimestriel.jsx';
import EleveSelectionPage from './components/ui/EleveSelectionPage.jsx';
import EleveAnalysePage from './pages/EleveAnalysePage.jsx';
import ProfesseurPage from './pages/ProfesseurPage.jsx';
import BandeauSemaine from './components/ui/BandeauSemaine.jsx';
import { studentsService, gradesService } from './services/supabaseService.js';
import './index.css';

function AppContent() {
  const { user, loading, signOut, initialized } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
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
  const [notesMensuelles, setNotesMensuelles] = useState({});
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);

  // Gestion robuste de la session
  useEffect(() => {
    if (initialized && !loading) {
      setIsInitialized(true);
      
      // Redirection automatique selon l'état de l'utilisateur
      if (user) {
        // Utilisateur connecté : charger ses données
        loadUserData();
        setCurrentPage('dashboard');
      } else {
        // Utilisateur non connecté : réinitialiser et rediriger vers login
        setEleves([]);
        setNotesMensuelles({});
        setCurrentPage('auth');
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

  const loadUserData = async () => {
    if (!user) return;
    
    setDataLoading(true);
    try {
      // Charger les élèves depuis Supabase
      const supabaseStudents = await studentsService.getAll(user.id);
      const formattedStudents = supabaseStudents.map(student => {
        // Gérer l'ancienne et la nouvelle structure
        if (student.first_name && student.last_name) {
          return {
            id: student.id,
            firstName: student.first_name,
            lastName: student.last_name,
          };
        } else if (student.name) {
          // Nouvelle structure : diviser le nom en firstName/lastName
          const nameParts = student.name.split(' ');
          return {
            id: student.id,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
          };
        } else {
          // Fallback
          return {
            id: student.id,
            firstName: 'Élève',
            lastName: 'Inconnu',
          };
        }
      });
      setEleves(formattedStudents);

      // Charger les notes depuis Supabase (NOUVELLE STRUCTURE)
      const gradesData = await gradesService.getAll(user.id);
      setNotesMensuelles(gradesData);
      
      // Synchroniser uniquement les élèves locaux (pas les notes)
      const localEleves = localStorage.getItem(`eleves_${user.id}`);
      
      if (localEleves) {
        const parsedLocalEleves = JSON.parse(localEleves);
        // Fusionner les élèves locaux avec Supabase
        const mergedEleves = [...formattedStudents];
        parsedLocalEleves.forEach(localEleve => {
          if (!formattedStudents.find(s => s.id === localEleve.id)) {
            // L'élève local n'existe pas dans Supabase, l'ajouter
            mergedEleves.push(localEleve);
          }
        });
        setEleves(mergedEleves);
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
    return <AuthPage />;
  }

  // Wrapper pour les pages avec bandeau
  const PageAvecBandeau = ({ children }) => (
    <div>
      <BandeauSemaine 
        theme={theme}
        semaineActuelle={semaineActuelle}
        setSemaineActuelle={setSemaineActuelle}
      />
      {children}
    </div>
  );

  if (currentPage === 'mensuel') {
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

  if (currentPage === 'professeur') {
    return (
      <ProfesseurPage 
        user={user}
        onLogout={signOut}
        onBack={() => setCurrentPage('dashboard')}
      />
    );
  }

  // Page par défaut : Dashboard
  return (
    <Dashboard 
      onMensuel={() => setCurrentPage('mensuel')} 
      onTrimestriel={() => setCurrentPage('trimestriel')}
      onInspectEleve={(page) => setCurrentPage(page)}
      onLogout={signOut}
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
