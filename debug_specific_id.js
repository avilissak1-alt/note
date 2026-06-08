// SCRIPT DE DEBUGGING PRÉCIS POUR L'ID PROBLÉMATIQUE
// À exécuter dans la console du navigateur quand l'erreur apparaît

// ID problématique
const PROBLEMATIC_ID = '588b1c6f-d386-4250-a51e-7d0c981d6c3d';

// Fonction pour capturer l'état exact au moment de l'erreur
function captureErrorState() {
  console.log('=== CAPTURE ÉTAT ERREUR ID PROBLÉMATIQUE ===');
  console.log('ID recherché:', PROBLEMATIC_ID);
  
  // 1. Vérifier si l'ID est dans le state React (accessible via window)
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__ && window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers) {
    console.log('1. TENTATIVE ACCÈS STATE REACT...');
    
    // Chercher le composant Dashboard dans l'arbre React
    const reactRoot = document.querySelector('#root');
    if (reactRoot) {
      console.log('   - React root trouvé');
      
      // Utiliser React DevTools si disponible
      try {
        const devtools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (devtools && devtools.onCommitFiberRoot) {
          console.log('   - React DevTools disponible');
        }
      } catch (e) {
        console.log('   - React DevTools non accessible');
      }
    }
  }
  
  // 2. Vérifier les données dans localStorage
  console.log('2. VÉRIFICATION LOCALSTORAGE:');
  Object.keys(localStorage).forEach(key => {
    if (key.includes('eleve') || key.includes('student') || key.includes('grade')) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        console.log(`   - ${key}:`, data);
        
        // Chercher l'ID problématique dans les données
        if (Array.isArray(data)) {
          const found = data.filter(item => 
            item.id === PROBLEMATIC_ID || 
            item.student_id === PROBLEMATIC_ID
          );
          if (found.length > 0) {
            console.log(`   ✅ ID TROUVÉ dans ${key}:`, found);
          }
        }
      } catch (e) {
        console.log(`   - ${key}: erreur parsing`, e);
      }
    }
  });
  
  // 3. Vérifier les fetch Supabase en cours
  console.log('3. VÉRIFICATION FETCH SUPABASE:');
  if (window.fetch) {
    const originalFetch = window.fetch;
    console.log('   - fetch intercepté pour debugging');
    
    // Surveiller les appels Supabase
    window.fetch = function(...args) {
      const url = args[0];
      if (typeof url === 'string' && url.includes('supabase')) {
        console.log('   📡 APPEL SUPABASE DÉTECTÉ:', url);
        
        return originalFetch.apply(this, args).then(response => {
          console.log('   📥 RÉPONSE SUPABASE:', response.status, response.url);
          
          // Cloner la réponse pour inspecter le contenu
          response.clone().json().then(data => {
            console.log('   📄 DONNÉES SUPABASE:', data);
            
            // Chercher l'ID problématique
            if (Array.isArray(data)) {
              const found = data.filter(item => 
                item.id === PROBLEMATIC_ID || 
                item.student_id === PROBLEMATIC_ID
              );
              if (found.length > 0) {
                console.log('   ✅ ID TROUVÉ dans réponse Supabase:', found);
              }
            }
          }).catch(e => {
            console.log('   ❌ Erreur parsing réponse:', e);
          });
          
          return response;
        }).catch(error => {
          console.log('   ❌ ERREUR FETCH SUPABASE:', error);
          throw error;
        });
      }
      
      return originalFetch.apply(this, args);
    };
  }
  
  // 4. Vérifier les erreurs console
  console.log('4. SURVEILLANCE ERREURS CONSOLE:');
  const originalError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    
    if (message.includes('ÉLÈVE NON TROUVÉ') || message.includes('588b1c6f-d386-4250-a51e-7d0c981d6c3d')) {
      console.log('🚨 ERREUR CIBLE DÉTECTÉE:');
      console.log('   Message:', message);
      console.log('   Timestamp:', new Date().toISOString());
      console.log('   Stack trace:', new Error().stack);
      
      // Capturer l'état complet à ce moment précis
      console.log('   📊 ÉTAT COMPLET AU MOMENT DE L\'ERREUR:');
      
      // Vérifier les variables globales potentiellement accessibles
      if (typeof window !== 'undefined') {
        console.log('   - Variables globales:', Object.keys(window).filter(k => k.includes('eleve') || k.includes('student')));
      }
      
      // Vérifier les éléments DOM potentiels
      const dashboardElements = document.querySelectorAll('[data-testid*="dashboard"], [class*="dashboard"], [id*="dashboard"]');
      console.log('   - Éléments Dashboard trouvés:', dashboardElements.length);
      
      dashboardElements.forEach((el, index) => {
        console.log(`   - Élément ${index}:`, el.tagName, el.className);
        
        // Chercher des attributs data contenant l'ID
        Array.from(el.attributes).forEach(attr => {
          if (attr.value && attr.value.includes(PROBLEMATIC_ID)) {
            console.log(`   ✅ ID TROUVÉ dans attribut ${attr.name}:`, attr.value);
          }
        });
      });
    }
    
    originalError.apply(console, args);
  };
  
  console.log('5. CAPTURE ÉTAT TERMINÉE - Surveillez la console pour les erreurs');
}

// Fonction pour vérifier directement les données Supabase
async function checkSupabaseData() {
  console.log('=== VÉRIFICATION DIRECTE SUPABASE ===');
  
  try {
    // Remplacer par votre clé Supabase réelle
    const SUPABASE_URL = 'https://votre-projet.supabase.co';
    const SUPABASE_ANON_KEY = 'votre-clé-anon';
    
    // Vérifier students
    const studentsResponse = await fetch(`${SUPABASE_URL}/rest/v1/students?id=eq.${PROBLEMATIC_ID}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (studentsResponse.ok) {
      const studentsData = await studentsResponse.json();
      console.log('📋 STUDENTS DATA:', studentsData);
    } else {
      console.log('❌ Erreur students:', studentsResponse.status);
    }
    
    // Vérifier grades
    const gradesResponse = await fetch(`${SUPABASE_URL}/rest/v1/grades?student_id=eq.${PROBLEMATIC_ID}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (gradesResponse.ok) {
      const gradesData = await gradesResponse.json();
      console.log('📋 GRADES DATA:', gradesData);
    } else {
      console.log('❌ Erreur grades:', gradesResponse.status);
    }
    
  } catch (error) {
    console.log('❌ Erreur vérification Supabase:', error);
  }
}

// Fonction pour analyser le format de l'ID
function analyzeIdFormat() {
  console.log('=== ANALYSE FORMAT ID ===');
  console.log('ID problématique:', PROBLEMATIC_ID);
  console.log('Longueur:', PROBLEMATIC_ID.length);
  console.log('Type:', typeof PROBLEMATIC_ID);
  console.log('Est UUID valide:', /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(PROBLEMATIC_ID));
  
  // Vérifier s'il y a des caractères cachés
  console.log('Caractères:', PROBLEMATIC_ID.split('').map((char, index) => ({
    index,
    char,
    code: char.charCodeAt(0),
    hex: '0x' + char.charCodeAt(0).toString(16)
  })));
}

// Lancer la capture
console.log('🔍 DÉMARRAGE DEBUG ID PROBLÉMATIQUE');
captureErrorState();
analyzeIdFormat();

// Auto-vérification toutes les 5 secondes
setInterval(() => {
  console.log('🔄 VÉRIFICATION PÉRIODIQUE...');
  analyzeIdFormat();
}, 5000);

console.log('✅ SCRIPT DEBUG ACTIVÉ - Surveillez la console');
