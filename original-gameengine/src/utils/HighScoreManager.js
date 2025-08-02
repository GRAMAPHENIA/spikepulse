/**
 * HighScoreManager - Sistema de gestión de puntuaciones altas
 * @module HighScoreManager
 */

import { StorageManager } from './StorageManager.js';
import { SPANISH_TEXT, formatDistance, formatTime } from '../config/SpanishText.js';

export class HighScoreManager {
    /**
     * Crea una nueva instancia del HighScoreManager
     * @param {StorageManager} storageManager - Instancia del StorageManager
     */
    constructor(storageManager) {
        this.storage = storageManager || new StorageManager();
        this.maxHighScores = 10; // Máximo número de puntuaciones altas a mantener
        
        this.init();
    }

    /**
     * Inicializar el sistema de puntuaciones altas
     * @private
     */
    init() {
        // Asegurar que existe la estructura de puntuaciones altas
        if (!this.storage.hasKey('highScores')) {
            this.storage.set('highScores', []);
        }

        console.log('[HighScoreManager] Sistema de puntuaciones altas inicializado');
    }

    /**
     * Obtener todas las puntuaciones altas
     * @returns {Array} Array de puntuaciones altas ordenadas
     */
    getHighScores() {
        const highScores = this.storage.get('highScores', []);
        
        // Asegurar que están ordenadas por distancia (descendente)
        return highScores.sort((a, b) => b.distance - a.distance);
    }

    /**
     * Verificar si una puntuación es un nuevo récord
     * @param {number} distance - Distancia alcanzada
     * @returns {boolean} True si es un nuevo récord
     */
    isNewHighScore(distance) {
        const highScores = this.getHighScores();
        
        // Si hay menos de maxHighScores, siempre es un récord
        if (highScores.length < this.maxHighScores) {
            return true;
        }
        
        // Verificar si supera la puntuación más baja
        const lowestScore = highScores[highScores.length - 1];
        return distance > lowestScore.distance;
    }

    /**
     * Obtener la posición que ocuparía una nueva puntuación
     * @param {number} distance - Distancia alcanzada
     * @returns {number} Posición (1-based) o -1 si no entra en el top
     */
    getScorePosition(distance) {
        const highScores = this.getHighScores();
        
        for (let i = 0; i < highScores.length; i++) {
            if (distance > highScores[i].distance) {
                return i + 1; // Posición 1-based
            }
        }
        
        // Si no supera ninguna puntuación existente
        if (highScores.length < this.maxHighScores) {
            return highScores.length + 1;
        }
        
        return -1; // No entra en el top
    }

    /**
     * Agregar una nueva puntuación alta
     * @param {Object} scoreData - Datos de la puntuación
     * @returns {Object} Resultado de la operación
     */
    addHighScore(scoreData) {
        try {
            // Validar datos de entrada
            const validatedScore = this.validateScoreData(scoreData);
            if (!validatedScore.isValid) {
                return {
                    success: false,
                    error: validatedScore.error,
                    position: -1
                };
            }

            const distance = scoreData.distance;
            const position = this.getScorePosition(distance);
            
            // Verificar si la puntuación entra en el top
            if (position === -1) {
                return {
                    success: false,
                    error: 'La puntuación no entra en el top ' + this.maxHighScores,
                    position: -1
                };
            }

            // Crear objeto de puntuación completo
            const newScore = {
                distance: distance,
                time: scoreData.time || 0,
                jumps: scoreData.jumps || 0,
                dashes: scoreData.dashes || 0,
                gravityChanges: scoreData.gravityChanges || 0,
                date: new Date().toISOString(),
                playerName: scoreData.playerName || 'Jugador',
                difficulty: scoreData.difficulty || 'normal',
                version: '1.0'
            };

            // Obtener puntuaciones actuales
            const highScores = this.getHighScores();
            
            // Insertar en la posición correcta
            highScores.splice(position - 1, 0, newScore);
            
            // Mantener solo el máximo número de puntuaciones
            if (highScores.length > this.maxHighScores) {
                highScores.splice(this.maxHighScores);
            }

            // Guardar las puntuaciones actualizadas
            const saveSuccess = this.storage.set('highScores', highScores);
            
            if (!saveSuccess) {
                return {
                    success: false,
                    error: 'Error guardando la puntuación',
                    position: -1
                };
            }

            // Actualizar estadísticas del jugador
            this.updatePlayerStats(scoreData);

            console.log(`[HighScoreManager] Nueva puntuación agregada en posición ${position}: ${distance}m`);

            return {
                success: true,
                position: position,
                isNewRecord: position === 1,
                score: newScore
            };

        } catch (error) {
            console.error('[HighScoreManager] Error agregando puntuación alta:', error);
            return {
                success: false,
                error: error.message,
                position: -1
            };
        }
    }

    /**
     * Validar datos de puntuación
     * @param {Object} scoreData - Datos a validar
     * @returns {Object} Resultado de la validación
     * @private
     */
    validateScoreData(scoreData) {
        if (!scoreData || typeof scoreData !== 'object') {
            return {
                isValid: false,
                error: 'Datos de puntuación inválidos'
            };
        }

        if (typeof scoreData.distance !== 'number' || scoreData.distance < 0) {
            return {
                isValid: false,
                error: 'Distancia inválida'
            };
        }

        if (scoreData.time !== undefined && (typeof scoreData.time !== 'number' || scoreData.time < 0)) {
            return {
                isValid: false,
                error: 'Tiempo inválido'
            };
        }

        if (scoreData.jumps !== undefined && (typeof scoreData.jumps !== 'number' || scoreData.jumps < 0)) {
            return {
                isValid: false,
                error: 'Número de saltos inválido'
            };
        }

        return { isValid: true };
    }

    /**
     * Actualizar estadísticas del jugador
     * @param {Object} scoreData - Datos de la partida
     * @private
     */
    updatePlayerStats(scoreData) {
        try {
            const currentStats = this.storage.get('playerStats', {
                totalDistance: 0,
                totalJumps: 0,
                totalDashes: 0,
                totalPlayTime: 0,
                gamesPlayed: 0,
                bestDistance: 0,
                averageDistance: 0
            });

            // Actualizar estadísticas
            currentStats.totalDistance += scoreData.distance || 0;
            currentStats.totalJumps += scoreData.jumps || 0;
            currentStats.totalDashes += scoreData.dashes || 0;
            currentStats.totalPlayTime += scoreData.time || 0;
            currentStats.gamesPlayed += 1;
            
            // Actualizar mejor distancia
            if (scoreData.distance > currentStats.bestDistance) {
                currentStats.bestDistance = scoreData.distance;
            }
            
            // Calcular distancia promedio
            currentStats.averageDistance = Math.round(currentStats.totalDistance / currentStats.gamesPlayed);

            // Guardar estadísticas actualizadas
            this.storage.set('playerStats', currentStats);
            
            console.log('[HighScoreManager] Estadísticas del jugador actualizadas');
        } catch (error) {
            console.error('[HighScoreManager] Error actualizando estadísticas:', error);
        }
    }

    /**
     * Obtener estadísticas del jugador
     * @returns {Object} Estadísticas del jugador
     */
    getPlayerStats() {
        return this.storage.get('playerStats', {
            totalDistance: 0,
            totalJumps: 0,
            totalDashes: 0,
            totalPlayTime: 0,
            gamesPlayed: 0,
            bestDistance: 0,
            averageDistance: 0
        });
    }

    /**
     * Obtener la mejor puntuación
     * @returns {Object|null} Mejor puntuación o null si no hay puntuaciones
     */
    getBestScore() {
        const highScores = this.getHighScores();
        return highScores.length > 0 ? highScores[0] : null;
    }

    /**
     * Obtener puntuaciones formateadas para mostrar
     * @returns {Array} Array de puntuaciones formateadas
     */
    getFormattedHighScores() {
        const highScores = this.getHighScores();
        
        return highScores.map((score, index) => ({
            position: index + 1,
            distance: formatDistance(score.distance),
            time: formatTime(score.time / 1000), // Convertir ms a segundos
            jumps: score.jumps,
            dashes: score.dashes,
            date: new Date(score.date).toLocaleDateString('es-ES'),
            playerName: score.playerName,
            difficulty: score.difficulty,
            raw: score
        }));
    }

    /**
     * Limpiar todas las puntuaciones altas
     * @returns {boolean} True si se limpiaron correctamente
     */
    clearHighScores() {
        try {
            const success = this.storage.set('highScores', []);
            if (success) {
                console.log('[HighScoreManager] Puntuaciones altas limpiadas');
            }
            return success;
        } catch (error) {
            console.error('[HighScoreManager] Error limpiando puntuaciones:', error);
            return false;
        }
    }

    /**
     * Eliminar una puntuación específica
     * @param {number} index - Índice de la puntuación a eliminar
     * @returns {boolean} True si se eliminó correctamente
     */
    removeHighScore(index) {
        try {
            const highScores = this.getHighScores();
            
            if (index < 0 || index >= highScores.length) {
                console.warn('[HighScoreManager] Índice de puntuación inválido:', index);
                return false;
            }

            highScores.splice(index, 1);
            const success = this.storage.set('highScores', highScores);
            
            if (success) {
                console.log(`[HighScoreManager] Puntuación ${index + 1} eliminada`);
            }
            
            return success;
        } catch (error) {
            console.error('[HighScoreManager] Error eliminando puntuación:', error);
            return false;
        }
    }

    /**
     * Exportar puntuaciones altas
     * @returns {Object} Datos de puntuaciones exportadas
     */
    exportHighScores() {
        return {
            version: '1.0',
            exportDate: new Date().toISOString(),
            highScores: this.getHighScores(),
            playerStats: this.getPlayerStats()
        };
    }

    /**
     * Importar puntuaciones altas
     * @param {Object} importData - Datos a importar
     * @returns {boolean} True si se importaron correctamente
     */
    importHighScores(importData) {
        try {
            if (!importData || !Array.isArray(importData.highScores)) {
                throw new Error('Formato de datos inválido');
            }

            // Validar cada puntuación
            const validScores = importData.highScores.filter(score => {
                const validation = this.validateScoreData(score);
                return validation.isValid;
            });

            // Combinar con puntuaciones existentes
            const currentScores = this.getHighScores();
            const allScores = [...currentScores, ...validScores];
            
            // Ordenar y mantener solo las mejores
            allScores.sort((a, b) => b.distance - a.distance);
            const topScores = allScores.slice(0, this.maxHighScores);

            // Guardar puntuaciones importadas
            const success = this.storage.set('highScores', topScores);
            
            // Importar estadísticas si están disponibles
            if (importData.playerStats && success) {
                this.storage.set('playerStats', importData.playerStats);
            }

            if (success) {
                console.log(`[HighScoreManager] ${validScores.length} puntuaciones importadas`);
            }

            return success;
        } catch (error) {
            console.error('[HighScoreManager] Error importando puntuaciones:', error);
            return false;
        }
    }

    /**
     * Obtener estadísticas de las puntuaciones altas
     * @returns {Object} Estadísticas de puntuaciones
     */
    getHighScoreStats() {
        const highScores = this.getHighScores();
        
        if (highScores.length === 0) {
            return {
                count: 0,
                bestDistance: 0,
                averageDistance: 0,
                totalTime: 0,
                averageTime: 0
            };
        }

        const totalDistance = highScores.reduce((sum, score) => sum + score.distance, 0);
        const totalTime = highScores.reduce((sum, score) => sum + (score.time || 0), 0);

        return {
            count: highScores.length,
            bestDistance: highScores[0].distance,
            averageDistance: Math.round(totalDistance / highScores.length),
            totalTime: totalTime,
            averageTime: Math.round(totalTime / highScores.length)
        };
    }
}