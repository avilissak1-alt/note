// SCRIPT DE CAPTURE PRÉCISE DE L'ÉTAT ÉLÈVES
// À exécuter dans la console du navigateur

const PROBLEMATIC_ID = '588b1c6f-d386-4250-a51e-7d0c981d6c3d';

// Variable globale pour stocker les états capturés
window.elevesStateHistory = [];
window.captureCount = 0;

// Fonction pour capturer l'état actuel des élèves
function captureElevesState(context = 'UNKNOWN') {
  const timestamp = new Date().toISOString();
  const state = {
    timestamp,
    context,
    captureId: ++window.captureCount
  };
  
  // Capturer depuis localStorage
  const localEleves = localStorage.getItem('eleves');
  if (localEleves) {
    try {
      state.localStorage = {
        exists: true,
        data: JSON.parse(localEleves),
        count: JSON.parse(localEleves).length,
        hasProblematicId: JSON.parse(localEleves).some(e => e.id === PROBLEMATIC_ID)
      };
    } catch (e) {
      state.localStorage = { exists: true, error: e.message };
    }
  } else {
    state.localStorage = { exists: false };
  }
  
  // Capturer depuis les éléments DOM (data attributes)
  const dashboardElements = document.querySelectorAll('[data-student-id], [data-eleve-id]');
  state.domElements = {
    count: dashboardElements.length,
    ids: Array.from(dashboardElements).map(el => ({
      id: el.getAttribute('data-student-id') || el.getAttribute('data-eleve-id'),
      element: el.tagName + (el.className ? '.' + el.className : '')
    })),
    hasProblematicId: Array.from(dashboardElements).some(el => 
      (el.getAttribute('data-student-id') || el.getAttribute('data-eleve-id')) === PROBLEMATIC_ID
    )
  };
  
  // Afficher la capture
  console.log(`📊 CAPTURE ÉTAT ÉLÈVES #${state.captureId} - ${context}`);
  console.log('Timestamp:', timestamp);
  console.log('LocalStorage:', state.localStorage);
  console.log('DOM Elements:', state.domElements);
  
  // Stocker l'historique
  window.elevesStateHistory.push(state);
  
  return state;
}

// Intercepter les appels à console.error pour capturer l'état au moment de l'erreur
const originalConsoleError = console.error;
console.error = function(...args) {
  const message = args.join(' ');
  
  if (message.includes('ÉLÈVE NON TROUVÉ') && message.includes(PROBLEMATIC_ID)) {
    console.log('🚨 ERREUR CIBLE DÉTECTÉE - CAPTURE IMMÉDIATE');
    
    // Capturer l'état exact au moment de l'erreur
    const errorState = captureElevesState('ERREUR_ELEVE_NON_TROUVE');
    
    // Analyse détaillée de l'erreur
    console.log('🔍 ANALYSE DÉTAILLÉE DE L\'ERREUR:');
    console.log('Message erreur:', message);
    console.log('Arguments:', args);
    console.log('Stack trace:', new Error().stack);
    
    // Vérifier les variables React si disponibles
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('🔧 TENTATIVE ACCÈS VARIABLES REACT...');
      // Essayer d'accéder aux états React via DevTools
    }
    
    // Vérifier les fetch en cours
    if (window.activeFetches) {
      console.log('📡 Fetch actifs:', window.activeFetches);
    }
  }
  
  originalConsoleError.apply(console, args);
};

// Intercepter les fetch Supabase pour suivre les chargements
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  let fetchId = ++(window.fetchCount || 0);
  
  if (typeof url === 'string' && (url.includes('supabase') || url.includes('students') || url.includes('grades'))) {
    console.log(`📡 FETCH #${fetchId}: ${url}`);
    
    // Suivre les fetch actifs
    if (!window.activeFetches) window.activeFetches = [];
    window.activeFetches.push({ id: fetchId, url, startTime: Date.now(), status: 'pending' });
    
    return originalFetch.apply(this, args).then(response => {
      console.log(`📥 FETCH #${fetchId} RESPONSE: ${response.status} ${url}`);
      
      // Mettre à jour le statut du fetch
      const fetchIndex = window.activeFetches.findIndex(f => f.id === fetchId);
      if (fetchIndex !== -1) {
        window.activeFetches[fetchIndex].status = 'completed';
        window.activeFetches[fetchIndex].responseStatus = response.status;
      }
      
      // Capturer l'état après les fetch de données
      if (url.includes('students') || url.includes('grades')) {
        setTimeout(() => {
          captureElevesState(`APRES_FETCH_${url.includes('students') ? 'STUDENTS' : 'GRADES'}`);
        }, 100);
      }
      
      return response;
    }).catch(error => {
      console.log(`❌ FETCH #${fetchId} ERROR: ${url}`, error);
      
      const fetchIndex = window.activeFetches.findIndex(f => f.id === fetchId);
      if (fetchIndex !== -1) {
        window.activeFetches[fetchIndex].status = 'error';
        window.activeFetches[fetchIndex].error = error.message;
      }
      
      throw error;
    });
  }
  
  return originalFetch.apply(this, args);
};

// Intercepter les setState React si possible
if (window.React) {
  console.log('🔧 React détecté - tentative interception setState...');
}

// Démarrer la surveillance
console.log('🔍 DÉMARRAGE SURVEILLANCE ÉTAT ÉLÈVES');
console.log('ID problématique surveillé:', PROBLEMATIC_ID);

// Capture initiale
captureElevesState('INITIALISATION');

// Captures périodiques
setInterval(() => {
  captureElevesState('PERIODIQUE');
}, 10000); // Toutes les 10 secondes

// Fonction pour analyser l'historique
window.analyzeElevesHistory = function() {
  console.log('📈 ANALYSE HISTORIQUE ÉTATS ÉLÈVES:');
  console.log('Nombre total de captures:', window.elevesStateHistory.length);
  
  const problematicStates = window.elevesStateHistory.filter(state => 
    state.localStorage.hasProblematicId || state.domElements.hasProblematicId
  );
  
  console.log('États avec ID problématique:', problematicStates.length);
  
  if (problematicStates.length > 0) {
    console.log('Première apparition ID problématique:', problematicStates[0]);
    console.log('Dernière apparition ID problématique:', problematicStates[problematicStates.length - 1]);
  }
  
  // Analyser les changements d'état
  const stateChanges = [];
  for (let i = 1; i < window.elevesStateHistory.length; i++) {
    const prev = window.elevesStateHistory[i - 1];
    const curr = window.elevesStateHistory[i];
    
    if (prev.localStorage.count !== curr.localStorage.count) {
      stateChanges.push({
        from: prev.localStorage.count,
        to: curr.localStorage.count,
        timestamp: curr.timestamp,
        context: curr.context
      });
    }
  }
  
  console.log('Changements d\'état détectés:', stateChanges);
  
  return {
    totalCaptures: window.elevesStateHistory.length,
    problematicStates: problematicStates.length,
    stateChanges: stateChanges
  };
};

console.log('✅ SCRIPT SURVEILLANCE ACTIVÉ');
console.log('📞 Commandes disponibles:');
console.log('   - captureElevesState("contexte") : capture manuelle');
console.log('   - analyzeElevesHistory() : analyse historique');
console.log('   - window.elevesStateHistory : voir toutes les captures');
