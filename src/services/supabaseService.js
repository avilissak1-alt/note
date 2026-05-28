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
      console.log('=== DIAGNOSTIC TABLES SUPABASE ===');
      
      // Vérifier la structure de la table grades
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('*')
        .eq('user_id', userId)
        .limit(1);

      if (gradesError) {
        console.error('Erreur grades:', gradesError);
        console.log('Vérification si la table grades existe...');
        
        // Essayer de voir les tables disponibles
        const { data: tablesData } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_type', 'BASE TABLE');
        
        if (tablesData) {
          console.log('Tables disponibles:', tablesData.map(t => t.table_name));
        }
      } else {
        console.log('✅ Table grades accessible');
        if (gradesData && gradesData.length > 0) {
          console.log('Colonnes grades:', Object.keys(gradesData[0]));
          console.log('Exemple grade:', gradesData[0]);
        } else {
          console.log('Table grades vide ou aucune donnée');
        }
      }
      
      // Vérifier la structure de la table students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .limit(1);

      if (studentsError) {
        console.error('Erreur students:', studentsError);
      } else {
        console.log('✅ Table students accessible');
        if (studentsData && studentsData.length > 0) {
          console.log('Colonnes students:', Object.keys(studentsData[0]));
          console.log('Exemple student:', studentsData[0]);
        } else {
          console.log('Table students vide ou aucune donnée');
        }
      }

      // Récupérer toutes les notes
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

  // Sauvegarder une note (AVEC GESTION ERREURS FOREIGN KEY)
  async upsert(userId, gradeData) {
    try {
      console.log('=== SAUVEGARDE NOTE AVEC VÉRIFICATION ===');
      console.log('Données à sauvegarder:', gradeData);
      
      // 1. Vérifier que l'élève existe
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('id', gradeData.student_id)
        .eq('user_id', userId)
        .single();

      if (studentError || !studentData) {
        console.error('❌ Élève non trouvé:', gradeData.student_id);
        throw new Error(`Élève ${gradeData.student_id} non trouvé dans la base de données`);
      }
      
      console.log('✅ Élève vérifié:', studentData);

      // 2. Tenter l'upsert avec la bonne structure
      const { data, error } = await supabase
        .from('grades')
        .upsert({
          user_id: userId,
          student_id: gradeData.student_id,
          subject: gradeData.subject,
          week_id: gradeData.week_id,
          value: gradeData.value
        }, {
          onConflict: 'user_id,student_id,subject,week_id'
        })
        .select();

      if (error) {
        console.error('❌ Erreur upsert:', error);
        
        // Si erreur de foreign key, essayer avec différentes structures de colonnes
        if (error.code === '23503' || error.message?.includes('foreign key')) {
          console.log('🔄 Tentative avec structure alternative...');
          
          // Vérifier si les colonnes existent vraiment
          const { data: columnData } = await supabase
            .from('information_schema.columns')
            .select('column_name')
            .eq('table_name', 'grades')
            .eq('table_schema', 'public');
          
          if (columnData) {
            const columns = columnData.map(c => c.column_name);
            console.log('Colonnes disponibles dans grades:', columns);
            
            // Adapter selon les colonnes réelles
            let adaptedData = {
              user_id: userId,
              student_id: gradeData.student_id,
              value: gradeData.value
            };
            
            if (columns.includes('subject')) {
              adaptedData.subject = gradeData.subject;
            }
            if (columns.includes('week_id')) {
              adaptedData.week_id = gradeData.week_id;
            } else if (columns.includes('week')) {
              adaptedData.week = gradeData.week_id;
            }
            
            console.log('Données adaptées:', adaptedData);
            
            const { data: retryData, error: retryError } = await supabase
              .from('grades')
              .upsert(adaptedData)
              .select();
              
            if (retryError) {
              console.error('❌ Échec même avec adaptation:', retryError);
              throw retryError;
            }
            
            console.log('✅ Sauvegarde réussie avec adaptation:', retryData);
            return retryData || [];
          }
        }
        
        throw error;
      }
      
      console.log('✅ Sauvegarde réussie:', data);
      return data || [];
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de la note:', error);
      throw error;
    }
  },

  // Supprimer une note
  async delete(userId, studentId, subject, weekId) {
    try {
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('user_id', userId)
        .eq('student_id', studentId)
        .eq('subject', subject)
        .eq('week_id', weekId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la suppression de la note:', error);
      throw error;
    }
  }
};
