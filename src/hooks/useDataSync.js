// HOOK REACT POUR LA SYNCHRONISATION DES DONNÉES
// Garantit la cohérence UI après chaque mutation

import { useState, useEffect, useCallback } from 'react';
import { dataSyncService } from '../services/dataSyncService.js';

export const useDataSync = (userId) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSync, setLastSync] = useState(null);

  // Synchronisation complète des données
  const syncData = useCallback(async () => {
    if (!userId) return null;
    
    setIsSyncing(true);
    setSyncStatus('syncing');
    
    try {
      console.log('🔄 SYNCHRONISATION AUTOMATIQUE DES DONNÉES...');
      
      const result = await dataSyncService.syncAllData(userId);
      const validation = await dataSyncService.validateDataConsistency(userId);
      
      setSyncStatus(validation.isConsistent ? 'success' : 'warning');
      setLastSync(new Date());
      
      console.log('✅ SYNCHRONISATION TERMINÉE:', {
        students: result.students.length,
        grades: result.grades.length,
        status: result.syncStatus,
        orphaned: result.orphanedCount
      });
      
      return {
        students: result.students,
        grades: result.grades,
        isConsistent: validation.isConsistent,
        orphanedCount: result.orphanedCount
      };
      
    } catch (error) {
      console.error('❌ ERREUR SYNCHRONISATION:', error);
      setSyncStatus('error');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [userId]);

  // Synchronisation après ajout d'élève
  const syncAfterStudentAdd = useCallback(async () => {
    console.log('🔄 SYNC APRÈS AJOUT ÉLÈVE...');
    return await syncData();
  }, [syncData]);

  // Synchronisation après suppression d'élève
  const syncAfterStudentDelete = useCallback(async () => {
    console.log('🔄 SYNC APRÈS SUPPRESSION ÉLÈVE...');
    return await syncData();
  }, [syncData]);

  // Synchronisation après modification de note
  const syncAfterGradeUpdate = useCallback(async () => {
    console.log('🔄 SYNC APRÈS MODIFICATION NOTE...');
    return await syncData();
  }, [syncData]);

  // Validation rapide sans synchronisation
  const validateData = useCallback(async () => {
    if (!userId) return null;
    
    try {
      const validation = await dataSyncService.validateDataConsistency(userId);
      setSyncStatus(validation.isConsistent ? 'success' : 'warning');
      return validation;
    } catch (error) {
      console.error('❌ ERREUR VALIDATION:', error);
      setSyncStatus('error');
      return null;
    }
  }, [userId]);

  // Auto-synchronisation périodique (optionnel)
  useEffect(() => {
    if (!userId) return;
    
    // Sync initial
    syncData();
    
    // Optionnel: sync toutes les 30 secondes
    const interval = setInterval(() => {
      validateData(); // Validation légère, pas sync complète
    }, 30000);
    
    return () => clearInterval(interval);
  }, [userId, syncData, validateData]);

  return {
    isSyncing,
    syncStatus,
    lastSync,
    syncData,
    syncAfterStudentAdd,
    syncAfterStudentDelete,
    syncAfterGradeUpdate,
    validateData
  };
};
