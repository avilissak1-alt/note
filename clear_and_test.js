// Script pour vider localStorage et tester la nouvelle structure
// Exécuter dans la console du navigateur

console.log('=== NETTOYAGE COMPLET LOCALSTORAGE ===');

// Vider tout localStorage
localStorage.clear();
console.log('✅ LocalStorage vidé');

// Recharger la page pour appliquer les changements
console.log('🔄 Rechargement de la page...');
setTimeout(() => {
  window.location.reload();
}, 1000);

// Instructions après rechargement :
// 1. Créer un nouvel élève
// 2. Ajouter une note
// 3. Vérifier dans Supabase SQL Editor :
//    SELECT * FROM students;
//    SELECT * FROM grades;
