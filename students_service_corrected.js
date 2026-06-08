// STUDENTS SERVICE CORRIGÉ - RÉSOLUTION SUPABASE EMPTY RESULT
// Version finale avec debugging et fallback robuste

import { supabase } from '../lib/supabase';

export const studentsService = {
  // Récupérer tous les élèves d'un utilisateur (VERSION CORRIGÉE)
  async getAll(userId) {
    try {
      console.log('=== STUDENTS SERVICE - GETALL DEBUG ===');
      console.log('1. User ID reçu:', userId);
      console.log('2. Type user_id:', typeof userId);
      console.log('3. User_id length:', userId?.length);
      
      // Validation UUID stricte
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!userId || !uuidRegex.test(userId)) {
        console.error('❌ User ID invalide ou UUID incorrect:', userId);
        return [];
      }
      
      // ÉTAPE 1: Essayer la requête principale (format attendu)
      console.log('4. Requête principale - format name');
      let { data, error } = await supabase
        .from('students')
        .select('id, name, user_id, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      console.log('5. Résultat requête principale:');
      console.log('   - Data:', data);
      console.log('   - Error:', error);
      console.log('   - Data length:', data?.length || 0);

      if (error) {
        console.error('❌ Erreur requête principale:', error);
        throw error;
      }

      // ÉTAPE 2: Si aucun résultat, essayer format alternatif (first_name/last_name)
      if (!data || data.length === 0) {
        console.log('6. Aucun résultat - tentative format alternatif first_name/last_name');
        
        const { data: altData, error: altError } = await supabase
          .from('students')
          .select('id, first_name, last_name, user_id, created_at, updated_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        console.log('7. Résultat format alternatif:');
        console.log('   - AltData:', altData);
        console.log('   - AltError:', altError);
        console.log('   - AltData length:', altData?.length || 0);

        if (!altError && altData && altData.length > 0) {
          console.log('✅ Données trouvées avec format first_name/last_name');
          
          // Transformer en format standard
          data = altData.map(student => ({
            id: student.id,
            name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
            firstName: student.first_name,
            lastName: student.last_name,
            user_id: student.user_id,
            created_at: student.created_at,
            updated_at: student.updated_at
          }));
        } else {
          console.log('❌ Aucune donnée trouvée avec les deux formats');
        }
      }

      // ÉTAPE 3: Validation finale
      if (!data || data.length === 0) {
        console.warn('⚠️ Aucun étudiant trouvé pour user_id:', userId);
        
        // Diagnostic: vérifier tous les user_ids existants
        try {
          const { data: allUsers } = await supabase
            .from('students')
            .select('user_id, COUNT(*) as count')
            .group('user_id');
            
          console.log('8. User_ids existants dans students:', allUsers);
        } catch (diagError) {
          console.log('Impossible de diagnostiquer les user_ids:', diagError);
        }
      }

      console.log('9. Résultat final:', {
        count: data?.length || 0,
        firstStudent: data?.[0] || null,
        success: !!(data && data.length > 0)
      });

      return data || [];

    } catch (error) {
      console.error('❌ Erreur complète studentsService.getAll:', error);
      console.error('Détails:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return [];
    }
  },

  // Créer un nouvel élève (VERSION CORRIGÉE)
  async create(userId, studentData) {
    try {
      console.log('=== STUDENTS SERVICE - CREATE DEBUG ===');
      console.log('1. User ID:', userId);
      console.log('2. StudentData reçu:', studentData);
      
      // Validation UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!userId || !uuidRegex.test(userId)) {
        throw new Error('User ID invalide');
      }

      // ÉTAPE 1: Essayer format name (standard)
      const studentName = `${studentData.first_name} ${studentData.last_name}`;
      console.log('3. Nom complet généré:', studentName);
      
      const insertData = {
        user_id: userId,
        name: studentName
      };
      
      console.log('4. Données pour insertion (format name):', insertData);
      
      let { data, error } = await supabase
        .from('students')
        .insert(insertData)
        .select()
        .single();

      console.log('5. Résultat insertion format name:');
      console.log('   - Data:', data);
      console.log('   - Error:', error);

      // ÉTAPE 2: Si erreur de colonne, essayer format first_name/last_name
      if (error && (error.code === 'PGRST204' || error.message?.includes('column'))) {
        console.log('6. Erreur colonne - tentative format first_name/last_name');
        
        const altInsertData = {
          user_id: userId,
          first_name: studentData.first_name,
          last_name: studentData.last_name
        };
        
        console.log('7. Données pour insertion (format first_name/last_name):', altInsertData);
        
        const { data: altData, error: altError } = await supabase
          .from('students')
          .insert(altInsertData)
          .select()
          .single();

        if (!altError && altData) {
          console.log('✅ Insertion réussie avec format first_name/last_name');
          
          // Transformer en format standard
          data = {
            ...altData,
            name: `${altData.first_name || ''} ${altData.last_name || ''}`.trim()
          };
          error = null;
        } else {
          console.log('❌ Les deux formats ont échoué');
        }
      }

      if (error) {
        console.error('❌ Erreur Supabase lors de la création:', error);
        throw error;
      }
      
      console.log('✅ Élève créé avec succès:', data);
      return data;

    } catch (error) {
      console.error('❌ Erreur complète lors de la création de l\'élève:', error);
      throw error;
    }
  },

  // Supprimer un élève (VERSION CORRIGÉE)
  async delete(userId, studentId) {
    try {
      console.log('=== STUDENTS SERVICE - DELETE DEBUG ===');
      console.log('1. User ID:', userId);
      console.log('2. Student ID:', studentId);
      
      // Validation UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!userId || !studentId || !uuidRegex.test(userId) || !uuidRegex.test(studentId)) {
        throw new Error('User ID ou Student ID invalide');
      }

      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Erreur suppression élève:', error);
        throw error;
      }
      
      console.log('✅ Élève supprimé avec succès');

    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'élève:', error);
      throw error;
    }
  },

  // Diagnostic de la structure (NOUVEAU)
  async diagnoseTable() {
    try {
      console.log('=== STUDENTS SERVICE - DIAGNOSTIC TABLE ===');
      
      // Vérifier si la table existe et est accessible
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .limit(1);

      console.log('1. Test accès table:');
      console.log('   - Data:', data);
      console.log('   - Error:', error);

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('❌ Table students non trouvée');
        } else if (error.code === '42501') {
          console.log('❌ Permission refusée (RLS)');
        } else {
          console.log('❌ Autre erreur:', error);
        }
        return { accessible: false, error };
      }

      // Analyser la structure des colonnes
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log('2. Colonnes détectées:', columns);
        
        const hasName = columns.includes('name');
        const hasFirstName = columns.includes('first_name');
        const hasLastName = columns.includes('last_name');
        
        console.log('3. Analyse colonnes:');
        console.log('   - Has name:', hasName);
        console.log('   - Has first_name:', hasFirstName);
        console.log('   - Has last_name:', hasLastName);
        
        return {
          accessible: true,
          columns,
          format: hasName ? 'name' : (hasFirstName && hasLastName ? 'first_last' : 'unknown')
        };
      }

      return { accessible: true, columns: [], format: 'empty' };

    } catch (error) {
      console.error('❌ Erreur diagnostic:', error);
      return { accessible: false, error };
    }
  }
};

export default studentsService;
