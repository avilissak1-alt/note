import React, { useState, useEffect } from 'react';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import BilanMensuel from './components/BilanMensuel.jsx';
import BilanTrimestriel from './components/BilanTrimestriel.jsx';
import EleveSelectionPage from './components/EleveSelectionPage.jsx';
import EleveAnalysePage from './components/EleveAnalysePage.jsx';
import BandeauSemaine from './components/BandeauSemaine.jsx';
import './index.css';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light'
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
  const [notesMensuelles, setNotesMensuelles] = useState(() => {
    return JSON.parse(localStorage.getItem('notesMensuelles')) || {};
  });
  const [selectedEleve, setSelectedEleve] = useState(null);

  useEffect(() => {
    localStorage.setItem(
      'notesMensuelles',
      JSON.stringify(notesMensuelles)
    );
  }, [notesMensuelles]);

  // Initialisation du thème et de l'authentification
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedAuth = localStorage.getItem('isAuthenticated') === 'true';
    const savedEleves = localStorage.getItem('eleves');
    const savedBoker = localStorage.getItem('colonnesBoker');
    const savedFormation = localStorage.getItem('colonnesFormation');
    
    setTheme(savedTheme);
    if (savedAuth) {
      setIsAuthenticated(true);
      setCurrentPage('dashboard');
    }
    
    if (savedEleves) {
      setEleves(JSON.parse(savedEleves));
    }
    
    if (savedBoker) {
      setColonnesBoker(JSON.parse(savedBoker));
    }
    
    if (savedFormation) {
      setColonnesFormation(JSON.parse(savedFormation));
    }
  }, []);

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

  // Sauvegarde des élèves
  useEffect(() => {
    localStorage.setItem('eleves', JSON.stringify(eleves));
  }, [eleves]);

  // Sauvegarde des colonnes
  useEffect(() => {
    localStorage.setItem('colonnesBoker', JSON.stringify(colonnesBoker));
  }, [colonnesBoker]);

  useEffect(() => {
    localStorage.setItem('colonnesFormation', JSON.stringify(colonnesFormation));
  }, [colonnesFormation]);

  
  
  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
    localStorage.setItem('isAuthenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('login');
    localStorage.setItem('isAuthenticated', 'false');
  };

  
  // Rendu des composants selon la page actuelle
  if (currentPage === 'login') {
    return <Login onLogin={handleLogin} theme={theme} />;
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

  // Page par défaut : Dashboard
  return (
    <PageAvecBandeau>
      <Dashboard 
        onMensuel={() => setCurrentPage('mensuel')} 
        onTrimestriel={() => setCurrentPage('trimestriel')}
        onInspectEleve={() => setCurrentPage('inspect-eleve-selection')}
        onLogout={handleLogout}
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
      />
    </PageAvecBandeau>
  );
}

export default App;
