// CODE REACT / WINDSURF - VERSION SIMPLE CORRIGÉE
// Pour l'upsert des grades dans Supabase

import { supabase } from '../lib/supabase';

const updateGrade = async (eleveId, colId, noteValue, userId) => {
  try {
    // VERSION SIMPLE CORRIGÉE - Structure de données minimale
    const gradesData = {
      user_id: userId,        // Ajout du user_id pour RLS
      student_id: eleveId,    // ID de l'élève
      subject: colId,         // ID de la matière
      grade: noteValue        // Valeur de la note (peut être null)
    };

    // Upsert simple avec onConflict minimal
    const { data, error } = await supabase
      .from('grades')
      .upsert(gradesData, {
        onConflict: 'user_id,student_id,subject'  // Conflit sur ces 3 colonnes
      })
      .select();

    if (error) {
      console.error('❌ Erreur upsert grade:', error);
      throw error;
    }

    console.log('✅ Grade upsert réussi:', data);
    return data;

  } catch (error) {
    console.error('❌ Erreur complète updateGrade:', error);
    throw error;
  }
};

// Version avec retry automatique (recommandée)
const updateGradeWithRetry = async (eleveId, colId, noteValue, userId, maxRetries = 3) => {
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const gradesData = {
        user_id: userId,
        student_id: eleveId,
        subject: colId,
        grade: noteValue
      };

      const { data, error } = await supabase
        .from('grades')
        .upsert(gradesData, {
          onConflict: 'user_id,student_id,subject'
        })
        .select();

      if (error) throw error;
      
      console.log(`✅ Grade upsert réussi (tentative ${retryCount + 1}):`, data);
      return data;

    } catch (error) {
      retryCount++;
      console.error(`❌ Erreur tentative ${retryCount}/${maxRetries}:`, error);
      
      if (retryCount >= maxRetries) {
        throw new Error(`Échec après ${maxRetries} tentatives: ${error.message}`);
      }
      
      // Attendre avant de réessayer
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
};

// Usage dans un composant React
export const GradeUpdater = ({ eleveId, subject, userId, onSuccess, onError }) => {
  const handleGradeUpdate = async (value) => {
    try {
      const noteValue = value === '' ? null : parseFloat(value);
      
      // Validation
      if (noteValue !== null && (noteValue < 0 || noteValue > 100)) {
        throw new Error('La note doit être entre 0 et 100');
      }

      // Utiliser la version avec retry
      const result = await updateGradeWithRetry(eleveId, subject, noteValue, userId);
      
      // Callback succès
      onSuccess?.(result);
      
    } catch (error) {
      console.error('Erreur mise à jour note:', error);
      // Callback erreur
      onError?.(error);
    }
  };

  return (
    <input
      type="number"
      min="0"
      max="100"
      onChange={(e) => handleGradeUpdate(e.target.value)}
      placeholder="Note"
    />
  );
};

// Export des fonctions
export { updateGrade, updateGradeWithRetry };
export default updateGrade;
