// UTILITAIRES DE SÉCURISATION DES TABLEAUX
// Prévient les crashes "map is not a function"

/**
 * Garantit que la valeur est un tableau avant d'appliquer .map()
 * @param {*} data - Données potentiellement non-array
 * @param {Function} mapFn - Fonction de mapping
 * @param {Array} fallback - Tableau de fallback par défaut
 * @returns {Array} - Toujours un tableau
 */
export const safeMap = (data, mapFn, fallback = []) => {
  if (!Array.isArray(data)) {
    console.warn('⚠️ safeMap: data n\'est pas un array:', typeof data, data);
    return fallback;
  }
  
  if (typeof mapFn !== 'function') {
    console.warn('⚠️ safeMap: mapFn n\'est pas une fonction');
    return data;
  }
  
  try {
    return data.map(mapFn);
  } catch (error) {
    console.error('❌ safeMap: erreur pendant le mapping:', error);
    return fallback;
  }
};

/**
 * Garantit que la valeur est un tableau avant d'appliquer .filter()
 * @param {*} data - Données potentiellement non-array
 * @param {Function} filterFn - Fonction de filtrage
 * @param {Array} fallback - Tableau de fallback par défaut
 * @returns {Array} - Toujours un tableau
 */
export const safeFilter = (data, filterFn, fallback = []) => {
  if (!Array.isArray(data)) {
    console.warn('⚠️ safeFilter: data n\'est pas un array:', typeof data, data);
    return fallback;
  }
  
  if (typeof filterFn !== 'function') {
    console.warn('⚠️ safeFilter: filterFn n\'est pas une fonction');
    return data;
  }
  
  try {
    return data.filter(filterFn);
  } catch (error) {
    console.error('❌ safeFilter: erreur pendant le filtrage:', error);
    return fallback;
  }
};

/**
 * Garantit que la valeur est un tableau
 * @param {*} data - Données potentiellement non-array
 * @param {Array} fallback - Tableau de fallback par défaut
 * @returns {Array} - Toujours un tableau
 */
export const ensureArray = (data, fallback = []) => {
  if (Array.isArray(data)) {
    return data;
  }
  
  console.warn('⚠️ ensureArray: conversion forcée en array:', typeof data, data);
  return fallback;
};

/**
 * Version sécurisée de .find() pour les tableaux
 * @param {*} data - Données potentiellement non-array
 * @param {Function} findFn - Fonction de recherche
 * @returns {*} - Élément trouvé ou undefined
 */
export const safeFind = (data, findFn) => {
  if (!Array.isArray(data)) {
    console.warn('⚠️ safeFind: data n\'est pas un array:', typeof data, data);
    return undefined;
  }
  
  if (typeof findFn !== 'function') {
    console.warn('⚠️ safeFind: findFn n\'est pas une fonction');
    return undefined;
  }
  
  try {
    return data.find(findFn);
  } catch (error) {
    console.error('❌ safeFind: erreur pendant la recherche:', error);
    return undefined;
  }
};

/**
 * Version sécurisée de .some() pour les tableaux
 * @param {*} data - Données potentiellement non-array
 * @param {Function} someFn - Fonction de test
 * @returns {boolean} - Résultat du test
 */
export const safeSome = (data, someFn) => {
  if (!Array.isArray(data)) {
    console.warn('⚠️ safeSome: data n\'est pas un array:', typeof data, data);
    return false;
  }
  
  if (typeof someFn !== 'function') {
    console.warn('⚠️ safeSome: someFn n\'est pas une fonction');
    return false;
  }
  
  try {
    return data.some(someFn);
  } catch (error) {
    console.error('❌ safeSome: erreur pendant le test:', error);
    return false;
  }
};

/**
 * Version sécurisée de .flatMap() pour les tableaux
 * @param {*} data - Données potentiellement non-array
 * @param {Function} flatMapFn - Fonction de flat mapping
 * @param {Array} fallback - Tableau de fallback par défaut
 * @returns {Array} - Toujours un tableau
 */
export const safeFlatMap = (data, flatMapFn, fallback = []) => {
  if (!Array.isArray(data)) {
    console.warn('⚠️ safeFlatMap: data n\'est pas un array:', typeof data, data);
    return fallback;
  }
  
  if (typeof flatMapFn !== 'function') {
    console.warn('⚠️ safeFlatMap: flatMapFn n\'est pas une fonction');
    return data;
  }
  
  try {
    return data.flatMap(flatMapFn);
  } catch (error) {
    console.error('❌ safeFlatMap: erreur pendant le flat mapping:', error);
    return fallback;
  }
};
