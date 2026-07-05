import { supabase } from '../lib/supabase';

// Service pour gérer les élèves (NOUVELLE STRUCTURE PROPRE)
export const studentsService = {
  // Récupérer tous les élèves d'un utilisateur
  async getAll(userId, sessionContext = null) {
    try {
      console.log('=== STUDENTS SERVICE GETALL ===');
      console.log('studentsService.getAll userId:', userId);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('studentsService.getAll session error:', sessionError);
      console.log('studentsService.getAll session.user.id:', sessionData?.session?.user?.id || null);
      console.log('studentsService.getAll userId === session.user.id:', userId === sessionData?.session?.user?.id);
      console.log('studentsService.getAll requête:', ".from('students').select('*').eq('user_id', userId).order('created_at', { ascending: true })");
      const { data: visibleStudents, error: visibleStudentsError } = await supabase
        .from('students')
        .select('*')
        .limit(5);
      console.log('studentsService.getAll RLS visible students error:', visibleStudentsError);
      console.log('studentsService.getAll RLS visible students length:', visibleStudents?.length || 0);
      console.log('studentsService.getAll RLS visible students rows:', visibleStudents || []);
      let query = supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: true });

      if (sessionContext?.schoolId) {
        query = query.eq('school_id', sessionContext.schoolId);
      } else if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      console.log('studentsService.getAll error:', error);
      console.log('studentsService.getAll data isArray:', Array.isArray(data));
      console.log('studentsService.getAll data length:', data?.length || 0);
      console.log('studentsService.getAll raw ids:', Array.isArray(data) ? data.map(student => student.id) : []);
      console.log('studentsService.getAll raw rows:', data || []);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des élèves:', error);
      return [];
    }
  },

  // Créer un nouvel élève avec vrai ID Supabase
  async create(userId, studentData, sessionContext = null) {
    console.log('=== STUDENTS SERVICE - CRÉATION ÉLÈVE ===');
    console.log('1. User ID:', userId);
    console.log('2. StudentData reçu:', studentData);
    
    try {
      const studentName = `${studentData.first_name} ${studentData.last_name}`;
      console.log('3. Nom complet généré:', studentName);
      
      const insertData = {
        user_id: userId,
        name: studentName,
        ...(sessionContext?.schoolId ? { school_id: sessionContext.schoolId } : {})
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
  async getAll(userId, sessionContext = null) {
    try {
      console.log('=== DIAGNOSTIC TABLES SUPABASE ===');
      
      // Vérifier la structure de la table grades
      let gradesDiagnosticQuery = supabase
        .from('grades')
        .select('*')
        .limit(1);

      if (sessionContext?.schoolId) {
        gradesDiagnosticQuery = gradesDiagnosticQuery.eq('school_id', sessionContext.schoolId);
      } else if (userId) {
        gradesDiagnosticQuery = gradesDiagnosticQuery.eq('user_id', userId);
      }

      const { data: gradesData, error: gradesError } = await gradesDiagnosticQuery;

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
      let studentsDiagnosticQuery = supabase
        .from('students')
        .select('*')
        .limit(1);

      if (sessionContext?.schoolId) {
        studentsDiagnosticQuery = studentsDiagnosticQuery.eq('school_id', sessionContext.schoolId);
      } else if (userId) {
        studentsDiagnosticQuery = studentsDiagnosticQuery.eq('user_id', userId);
      }

      const { data: studentsData, error: studentsError } = await studentsDiagnosticQuery;

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
      let query = supabase
        .from('grades')
        .select('*')
        .order('created_at', { ascending: true });

      if (sessionContext?.schoolId) {
        query = query.eq('school_id', sessionContext.schoolId);
      } else if (userId) {
        query = query.eq('user_id', userId);
      }

      if (sessionContext?.role === 'teacher') {
        if (sessionContext.teacherId) {
          query = query.eq('teacher_id', sessionContext.teacherId);
        }
        if (sessionContext.teacherSubject) {
          query = query.like('subject', `${sessionContext.teacherSubject}_week_%`);
        }
      }

      const { data, error } = await query;

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
  async upsert(userId, gradeData, sessionContext = null) {
    try {
      console.log('=== SAUVEGARDE NOTE AVEC VÉRIFICATION ===');
      console.log('Données à sauvegarder:', gradeData);
      
      // 1. Vérifier que l'élève existe
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, school_id')
        .eq('id', gradeData.student_id)
        .single();

      if (studentError || !studentData) {
        console.error('❌ Élève non trouvé:', gradeData.student_id);
        throw new Error(`Élève ${gradeData.student_id} non trouvé dans la base de données`);
      }
      
      if (sessionContext?.schoolId && studentData.school_id !== sessionContext.schoolId) {
        throw new Error('Accès interdit à cet élève.');
      }
      
      console.log('✅ Élève vérifié:', studentData);

      // 2. Tenter l'upsert avec la structure CORRIGÉE et VALIDÉE
      console.log('2. VALIDATION STRUCTURE DONNÉES...');
      
      // Validation et normalisation des données avant envoi
      if (sessionContext?.role === 'teacher') {
        const allowedSubject = sessionContext.teacherSubject;
        const requestedSubject = String(gradeData.subject || '');

        if (!allowedSubject || !requestedSubject.startsWith(`${allowedSubject}_week_`)) {
          throw new Error('Accès interdit à cette matière.');
        }
      }

      const normalizedGradeData = {
        user_id: userId,
        student_id: gradeData.student_id,
        subject: gradeData.subject,
        grade: gradeData.grade,
        ...(sessionContext?.schoolId ? { school_id: sessionContext.schoolId } : {}),
        ...(sessionContext?.teacherId ? { teacher_id: sessionContext.teacherId } : {})
      };
      
      console.log('Données normalisées:', normalizedGradeData);
      
      const { data, error } = await supabase
        .from('grades')
        .upsert(normalizedGradeData, {
          onConflict: sessionContext?.schoolId ? 'school_id,student_id,subject' : 'user_id,student_id,subject'
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
  },

  // Supprimer toutes les notes de l'utilisateur connecté
  async deleteAll(userId) {
    try {
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la suppression de toutes les notes:', error);
      throw error;
    }
  }
};
