// SERVICE DE SYNCHRONISATION ET NETTOYAGE DES DONNÉES
// Solution définitive pour les problèmes students ↔ grades

import { studentsService, gradesService } from './supabaseService.js';

export const dataSyncService = {
  // Nettoyer les grades orphelins (student_id sans student correspondant)
  async cleanupOrphanedGrades(userId, sessionContext = null) {
    console.log('=== NETTOYAGE GRADES ORPHELINS ===');
    
    try {
      // Récupérer tous les students et grades
      const students = await studentsService.getAll(userId, sessionContext);
      const grades = await gradesService.getAll(userId, sessionContext);
      
      console.log('1. Students chargés:', students.length);
      console.log('2. Grades chargés:', grades.length);
      
      // Identifier les student_ids valides
      const validStudentIds = new Set(students.map(s => s.id));
      console.log('3. Student IDs valides:', Array.from(validStudentIds));
      
      // Identifier les grades orphelins
      const orphanedGrades = grades.filter(g => !validStudentIds.has(g.student_id));
      console.log('4. Grades orphelins trouvés:', orphanedGrades.length);
      
      if (orphanedGrades.length > 0) {
        console.log('   - IDs orphelins:', [...new Set(orphanedGrades.map(g => g.student_id))]);
        
        // Supprimer les grades orphelins
        for (const orphanedGrade of orphanedGrades) {
          try {
            if (sessionContext?.role !== 'teacher') {
              await gradesService.delete(userId, orphanedGrade.student_id, orphanedGrade.subject);
            }
            console.log('   - Grade orphelin supprimé:', {
              student_id: orphanedGrade.student_id,
              subject: orphanedGrade.subject
            });
          } catch (error) {
            console.error('   - Erreur suppression grade orphelin:', error);
          }
        }
        
        console.log('✅ Nettoyage des grades orphelins terminé');
      } else {
        console.log('✅ Aucun grade orphelin trouvé');
      }
      
      return {
        studentsCount: students.length,
        gradesCount: grades.length,
        orphanedCount: orphanedGrades.length,
        cleaned: orphanedGrades.length > 0
      };
      
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des grades orphelins:', error);
      throw error;
    }
  },

  // Synchronisation complète des données (students + grades)
  async syncAllData(userId, sessionContext = null) {
    console.log('=== SYNCHRONISATION COMPLÈTE DES DONNÉES ===');
    
    try {
      // Étape 1: Nettoyer les grades orphelins
      const cleanupResult = await this.cleanupOrphanedGrades(userId, sessionContext);
      
      // Étape 2: Récupérer les données propres
      const students = await studentsService.getAll(userId, sessionContext);
      const grades = await gradesService.getAll(userId, sessionContext);
      
      // Étape 3: Validation finale
      const studentIds = new Set(students.map(s => s.id));
      const gradeStudentIds = new Set(grades.map(g => g.student_id).filter(Boolean));
      const finalOrphaned = [...gradeStudentIds].filter(id => !studentIds.has(id));
      
      console.log('=== VALIDATION FINALE SYNCHRO ===');
      console.log('Students:', students.length);
      console.log('Grades:', grades.length);
      console.log('Grades orphelins restants:', finalOrphaned.length);
      
      if (finalOrphaned.length === 0) {
        console.log('✅ SYNCHRONISATION PARFAITE - Aucun grade orphelin');
      } else {
        console.warn('⚠️ Grades orphelins restants:', finalOrphaned);
      }
      
      return {
        students: students.map(s => ({
          id: s.id,
          firstName: s.name?.split(' ')[0] || '',
          lastName: s.name?.split(' ').slice(1).join(' ') || ''
        })),
        grades,
        syncStatus: finalOrphaned.length === 0 ? 'perfect' : 'warning',
        orphanedCount: finalOrphaned.length
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation complète:', error);
      throw error;
    }
  },

  // Validation de la cohérence des données
  async validateDataConsistency(userId, sessionContext = null) {
    console.log('=== VALIDATION COHÉRENCE DONNÉES ===');
    
    try {
      const students = await studentsService.getAll(userId, sessionContext);
      const grades = await gradesService.getAll(userId, sessionContext);
      
      const studentIds = new Set(students.map(s => s.id));
      const gradeStudentIds = new Set(grades.map(g => g.student_id).filter(Boolean));
      
      const issues = {
        studentsCount: students.length,
        gradesCount: grades.length,
        orphanedGrades: [...gradeStudentIds].filter(id => !studentIds.has(id)),
        missingStudents: [...studentIds].filter(id => !gradeStudentIds.has(id)),
        isConsistent: false
      };
      
      issues.isConsistent = issues.orphanedGrades.length === 0;
      
      console.log('Résultats validation:', issues);
      
      return issues;
      
    } catch (error) {
      console.error('❌ Erreur validation cohérence:', error);
      throw error;
    }
  }
};
