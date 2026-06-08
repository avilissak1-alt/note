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
    console.log('=== STUDENTS SERVICE - CRÉATION ÉLÈVE ===');
    console.log('1. User ID:', userId);
    console.log('2. StudentData reçu:', studentData);
    
    try {
      const studentName = `${studentData.first_name} ${studentData.last_name}`;
      console.log('3. Nom complet généré:', studentName);
      
      const insertData = {
        user_id: userId,
        name: studentName
      };
      
      console.log('4. Données pour insertion Supabase:', insertData);
      
      const { data, error } = await supabase
        .from('students')
        .insert(insertData)
        .select()
        .single();

      console.log('5. Réponse Supabase - Data:', data);
      console.log('6. Réponse Supabase - Error:', error);

      if (error) {
        console.error('❌ Erreur Supabase lors de la création:', error);
        throw error;
      }
      
      console.log('✅ Élève créé avec succès:', data);
      return data;
    } catch (error) {
      console.error('❌ Erreur complète lors de la création de l\'élève:', error);
      console.error('Détails de l\'erreur:', error.message, error.code, error.details);
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

      // Récupérer toutes les notes avec validation stricte
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ ERREUR FETCH GRADES:', error);
        throw error;
      }
      
      // VALIDATION CRITIQUE - garantir que data est toujours un array
      const validatedData = Array.isArray(data) ? data : [];
      
      if (!Array.isArray(data)) {
        console.error('❌ CRITICAL: Supabase a retourné des données non-array:', typeof data, data);
        console.log('   - Data brute:', data);
        console.log('   - Conversion forcée en array vide');
      }
      
      console.log('✅ GRADES FETCH VALIDÉ:', {
        count: validatedData.length,
        isArray: Array.isArray(validatedData),
        firstItem: validatedData[0] || null
      });
      
      return validatedData;
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

      // 2. Tenter l'upsert avec la structure CORRIGÉE et VALIDÉE
      console.log('2. VALIDATION STRUCTURE DONNÉES...');
      
      // Validation et normalisation des données avant envoi
      const normalizedGradeData = {
        user_id: userId,
        student_id: gradeData.student_id,
        subject: gradeData.subject,
        grade: gradeData.grade
      };
      
      console.log('Données normalisées:', normalizedGradeData);
      
      const { data, error } = await supabase
        .from('grades')
        .upsert(normalizedGradeData, {
          onConflict: 'user_id,student_id,subject'
        })
        .select();

      if (error) {
        console.error('❌ Erreur upsert:', error);
        console.error('Code erreur:', error.code);
        console.error('Message erreur:', error.message);
        
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
