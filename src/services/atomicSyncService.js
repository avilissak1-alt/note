// SERVICE DE SYNCHRONISATION ATOMIQUE
// Garantit que students et grades sont toujours cohérents

import { studentsService, gradesService } from './supabaseService.js';

export const atomicSyncService = {
  // Synchronisation atomique - charge students ET grades dans une seule transaction logique
  async syncAtomicData(userId) {
    console.log('=== SYNCHRONISATION ATOMIQUE DES DONNÉES ===');
    
    try {
      // ÉTAPE 1: Charger les students (obligatoire)
      console.log('1. Chargement des students...');
      const studentsData = await studentsService.getAll(userId);
      
      if (!Array.isArray(studentsData)) {
        console.error('❌ studentsData n\'est pas un array:', typeof studentsData);
        throw new Error('Format de données students invalide');
      }
      
      console.log('✅ Students chargés:', studentsData.length);
      
      // ÉTAPE 2: Charger les grades (dépendant des students)
      console.log('2. Chargement des grades...');
      const gradesData = await gradesService.getAll(userId);
      
      if (!Array.isArray(gradesData)) {
        console.error('❌ gradesData n\'est pas un array:', typeof gradesData);
        throw new Error('Format de données grades invalide');
      }
      
      console.log('✅ Grades chargés:', gradesData.length);
      
      // ÉTAPE 3: Validation de la cohérence
      console.log('3. Validation de la cohérence...');
      const studentIds = new Set(studentsData.map(s => s.id));
      const gradeStudentIds = new Set(gradesData.map(g => g.student_id).filter(Boolean));
      
      const orphanedGrades = [...gradeStudentIds].filter(id => !studentIds.has(id));
      
      console.log('   - Students IDs:', studentIds.size);
      console.log('   - Grades student_ids:', gradeStudentIds.size);
      console.log('   - Grades orphelins:', orphanedGrades.length);
      
      // ÉTAPE 4: Nettoyage des grades orphelins (si nécessaire)
      let cleanedGrades = gradesData;
      if (orphanedGrades.length > 0) {
        console.log('4. Nettoyage des grades orphelins...');
        cleanedGrades = gradesData.filter(g => studentIds.has(g.student_id));
        console.log('   - Grades avant nettoyage:', gradesData.length);
        console.log('   - Grades après nettoyage:', cleanedGrades.length);
        
        // Optionnel: supprimer les grades orphelins de la base de données
        console.log('   - Suppression des grades orphelins de la base...');
        for (const orphanedId of orphanedGrades) {
          try {
            // Supprimer tous les grades pour cet étudiant orphelin
            const orphanedStudentGrades = gradesData.filter(g => g.student_id === orphanedId);
            for (const grade of orphanedStudentGrades) {
              await gradesService.delete(userId, grade.student_id, grade.subject);
            }
            console.log(`   - Grades orphelins supprimés pour l'étudiant ${orphanedId}`);
          } catch (deleteError) {
            console.warn(`   - Impossible de supprimer les grades orphelins pour ${orphanedId}:`, deleteError);
          }
        }
      }
      
      // ÉTAPE 5: Formatage des données pour le frontend
      console.log('5. Formatage des données pour le frontend...');
      console.log('   - Students bruts reçus:', studentsData.length);
      console.log('   - IDs students bruts:', studentsData.map(s => s.id));
      
      const formattedStudents = studentsData.map(student => {
        const nameParts = student.name ? student.name.split(' ') : ['', ''];
        return {
          id: student.id,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
        };
      });
      
      console.log('   - Students formatés:', formattedStudents.length);
      console.log('   - IDs students formatés:', formattedStudents.map(s => s.id));
      console.log('   - Vérification ID problématique 588b1c6f-d386-4250-a51e-7d0c981d6c3d:', 
        formattedStudents.some(s => s.id === '588b1c6f-d386-4250-a51e-7d0c981d6c3d') ? '✅ PRÉSENT' : '❌ ABSENT');
      
      // Normaliser les grades pour garantir la cohérence
      const normalizedGrades = cleanedGrades.map(grade => ({
        id: grade.id,
        user_id: grade.user_id,
        student_id: grade.student_id,
        subject: grade.subject,
        grade: grade.grade,
        created_at: grade.created_at,
        updated_at: grade.updated_at
      }));
      
      // ÉTAPE 6: Validation finale
      console.log('6. Validation finale...');
      const finalStudentIds = new Set(formattedStudents.map(s => s.id));
      const finalGradeStudentIds = new Set(normalizedGrades.map(g => g.student_id).filter(Boolean));
      const finalOrphaned = [...finalGradeStudentIds].filter(id => !finalStudentIds.has(id));
      
      const syncResult = {
        students: formattedStudents,
        grades: normalizedGrades,
        metadata: {
          studentsCount: formattedStudents.length,
          gradesCount: normalizedGrades.length,
          orphanedGradesRemoved: orphanedGrades.length,
          finalOrphanedCount: finalOrphaned.length,
          isConsistent: finalOrphaned.length === 0,
          syncTimestamp: new Date().toISOString()
        }
      };
      
      if (syncResult.metadata.isConsistent) {
        console.log('✅ SYNCHRONISATION ATOMIQUE RÉUSSIE - Données 100% cohérentes');
      } else {
        console.warn('⚠️ SYNCHRONISATION ATOMIQUE PARTIELLE - Quelques incohérences restent');
        console.warn('   - Grades orphelins restants:', finalOrphaned);
      }
      
      return syncResult;
      
    } catch (error) {
      console.error('❌ ERREUR CRITIQUE SYNCHRONISATION ATOMIQUE:', error);
      throw new Error(`Échec de la synchronisation atomique: ${error.message}`);
    }
  },

  // Synchronisation après mutation (ajout/suppression/modification)
  async syncAfterMutation(userId, mutationType, data) {
    console.log(`=== SYNCHRONISATION APRÈS MUTATION: ${mutationType} ===`);
    
    try {
      // Attendre un peu pour que la base de données soit à jour
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refaire une synchronisation atomique complète
      const syncResult = await this.syncAtomicData(userId);
      
      console.log(`✅ Synchronisation après ${mutationType} réussie:`, {
        students: syncResult.metadata.studentsCount,
        grades: syncResult.metadata.gradesCount,
        consistency: syncResult.metadata.isConsistent
      });
      
      return syncResult;
      
    } catch (error) {
      console.error(`❌ Erreur synchronisation après ${mutationType}:`, error);
      throw error;
    }
  },

  // Validation de l'état actuel sans modification
  async validateCurrentState(userId) {
    console.log('=== VALIDATION ÉTAT ACTUEL ===');
    
    try {
      const students = await studentsService.getAll(userId);
      const grades = await gradesService.getAll(userId);
      
      const studentIds = new Set(students.map(s => s.id));
      const gradeStudentIds = new Set(grades.map(g => g.student_id).filter(Boolean));
      const orphanedGrades = [...gradeStudentIds].filter(id => !studentIds.has(id));
      
      const validation = {
        studentsCount: students.length,
        gradesCount: grades.length,
        orphanedGrades: orphanedGrades.length,
        isConsistent: orphanedGrades.length === 0,
        issues: []
      };
      
      if (!validation.isConsistent) {
        validation.issues.push(`${orphanedGrades.length} grades orphelins détectés`);
      }
      
      if (!Array.isArray(students)) {
        validation.issues.push('students n\'est pas un array');
      }
      
      if (!Array.isArray(grades)) {
        validation.issues.push('grades n\'est pas un array');
      }
      
      console.log('Résultat validation:', validation);
      
      return validation;
      
    } catch (error) {
      console.error('❌ Erreur validation état actuel:', error);
      throw error;
    }
  }
};
