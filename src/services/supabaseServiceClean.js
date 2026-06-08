import { supabase } from '../lib/supabase';

// Service pour gérer les élèves (NOUVELLE STRUCTURE PROPRE)
export const studentsService = {
  // Récupérer tous les élèves d'un utilisateur
  async getAll(userId) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des élèves:', error);
      return [];
    }
  },

  // Créer un nouvel élève avec vrai ID Supabase
  async create(userId, studentData) {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert({
          user_id: userId,
          name: `${studentData.first_name} ${studentData.last_name}`
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'élève:', error);
      throw error;
    }
  },

  // Supprimer un élève
  async delete(userId, studentId) {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'élève:', error);
      throw error;
    }
  }
};

// Service pour gérer les notes (NOUVELLE STRUCTURE PROPRE)
export const gradesService = {
  // Récupérer toutes les notes d'un utilisateur
  async getAll(userId) {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des notes:', error);
      return [];
    }
  },

  // Sauvegarder une note (VRAI UPSERT)
  async upsert(userId, gradeData) {
    try {
      const { data, error } = await supabase
        .from('grades')
        .upsert({
          user_id: userId,
          student_id: gradeData.student_id,
          subject: gradeData.subject,
          grade: gradeData.grade
        }, {
          onConflict: 'user_id,student_id,subject'
        })
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la note:', error);
      throw error;
    }
  },

  // Supprimer une note
  async delete(userId, studentId, subject) {
    try {
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('user_id', userId)
        .eq('student_id', studentId)
        .eq('subject', subject);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la suppression de la note:', error);
      throw error;
    }
  }
};
