// CODE REACT / WINDSURF - VERSION MINIMALE CORRIGÉE
// Exactement comme demandé par l'utilisateur

import { supabase } from '../lib/supabase';

// Version simple (CORRIGÉE) - Exactement le code de l'utilisateur
const updateGrade = async (eleveId, colId, noteValue, userId) => {
  const gradesData = {
    user_id: userId,        // Ajouté pour RLS
    student_id: eleveId,    // ID de l'élève
    subject: colId,         // ID de la matière
    grade: noteValue        // Valeur de la note
  };

  const { data, error } = await supabase
    .from('grades')
    .upsert(gradesData, {
      onConflict: 'user_id,student_id,subject'
    });

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
};

export default updateGrade;
