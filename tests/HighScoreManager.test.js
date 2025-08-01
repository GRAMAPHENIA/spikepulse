/**
 * Tests para HighScoreManager
 * @module HighScoreManagerTests
 */

import { testFramework, expect, createMock } from './TestFramework.js';
import { HighScoreManager } from '../src/utils/HighScoreManager.js';
import { StorageManager } from '../src/utils/StorageManager.js';

// Mock de StorageManager para testing
class MockStorageManager {
    constructor() {
        this.data = {};
    }

    hasKey(key) {
        return key in this.data;
    }

    get(key, defaultValue = null) {
        return this.data[key] !== undefined ? this.data[key] : defaultValue;
    }

    set(key, value) {
        this.data[key] = value;
        return true;
    }

    remove(key) {
        delete this.data[key];
        return true;
    }

    clear() {
        this.data = {};
        return true;
    }
}

testFramework.describe('HighScoreManager', () => {
    let highScoreManager;
    let mockStorage;

    function beforeEach() {
        mockStorage = new MockStorageManager();
        highScoreManager = new HighScoreManager(mockStorage);
    }

    function afterEach() {
        highScoreManager = null;
        mockStorage = null;
    }

    testFramework.test('debe inicializarse correctamente', () => {
        beforeEach();
        
        expect(highScoreManager).toBeDefined();
        expect(highScoreManager.maxHighScores).toBe(10);
        expect(highScoreManager.storage).toBe(mockStorage);
        
        afterEach();
    });

    testFramework.test('debe inicializar array de puntuaciones altas vacío', () => {
        beforeEach();
        
        const highScores = highScoreManager.getHighScores();
        expect(highScores).toEqual([]);
        
        afterEach();
    });

    testFramework.test('debe agregar primera puntuación alta correctamente', () => {
        beforeEach();
        
        const scoreData = {
            distance: 100,
            time: 5000,
            jumps: 10,
            dashes: 5,
            gravityChanges: 2,
            playerName: 'Test Player'
        };

        const result = highScoreManager.addHighScore(scoreData);
        
        expect(result.success).toBeTruthy();
        expect(result.position).toBe(1);
        expect(result.isNewRecord).toBeTruthy();
        
        const highScores = highScoreManager.getHighScores();
        expect(highScores).toHaveLength(1);
        expect(highScores[0].distance).toBe(100);
        expect(highScores[0].playerName).toBe('Test Player');
        
        afterEach();
    });

    testFramework.test('debe ordenar puntuaciones por distancia descendente', () => {
        beforeEach();
        
        // Agregar puntuaciones en orden aleatorio
        highScoreManager.addHighScore({ distance: 50, time: 1000, jumps: 5 });
        highScoreManager.addHighScore({ distance: 150, time: 2000, jumps: 15 });
        highScoreManager.addHighScore({ distance: 100, time: 1500, jumps: 10 });
        
        const highScores = highScoreManager.getHighScores();
        
        expect(highScores).toHaveLength(3);
        expect(highScores[0].distance).toBe(150); // Mayor distancia primero
        expect(highScores[1].distance).toBe(100);
        expect(highScores[2].distance).toBe(50);
        
        afterEach();
    });

    testFramework.test('debe detectar nuevo récord correctamente', () => {
        beforeEach();
        
        // Agregar puntuación inicial
        highScoreManager.addHighScore({ distance: 100, time: 1000, jumps: 10 });
        
        // Verificar que una puntuación mayor es nuevo récord
        expect(highScoreManager.isNewHighScore(150)).toBeTruthy();
        
        // Verificar que una puntuación menor no es nuevo récord
        expect(highScoreManager.isNewHighScore(50)).toBeTruthy(); // Aún hay espacio en el top 10
        
        afterEach();
    });

    testFramework.test('debe limitar a máximo 10 puntuaciones altas', () => {
        beforeEach();
        
        // Agregar 12 puntuaciones
        for (let i = 1; i <= 12; i++) {
            highScoreManager.addHighScore({
                distance: i * 10,
                time: i * 1000,
                jumps: i * 2
            });
        }
        
        const highScores = highScoreManager.getHighScores();
        
        expect(highScores).toHaveLength(10); // Máximo 10
        expect(highScores[0].distance).toBe(120); // Mayor distancia
        expect(highScores[9].distance).toBe(30); // Menor distancia en el top 10
        
        afterEach();
    });

    testFramework.test('debe calcular posición correctamente', () => {
        beforeEach();
        
        // Agregar algunas puntuaciones
        highScoreManager.addHighScore({ distance: 100, time: 1000, jumps: 10 });
        highScoreManager.addHighScore({ distance: 200, time: 2000, jumps: 20 });
        highScoreManager.addHighScore({ distance: 50, time: 500, jumps: 5 });
        
        // Verificar posiciones
        expect(highScoreManager.getScorePosition(250)).toBe(1); // Nueva mejor puntuación
        expect(highScoreManager.getScorePosition(150)).toBe(2); // Entre 200 y 100
        expect(highScoreManager.getScorePosition(75)).toBe(3); // Entre 100 y 50
        expect(highScoreManager.getScorePosition(25)).toBe(4); // Última posición
        
        afterEach();
    });

    testFramework.test('debe validar datos de puntuación', () => {
        beforeEach();
        
        // Datos válidos
        const validScore = { distance: 100, time: 1000, jumps: 10 };
        const result1 = highScoreManager.addHighScore(validScore);
        expect(result1.success).toBeTruthy();
        
        // Datos inválidos - sin distancia
        const invalidScore1 = { time: 1000, jumps: 10 };
        const result2 = highScoreManager.addHighScore(invalidScore1);
        expect(result2.success).toBeFalsy();
        
        // Datos inválidos - distancia negativa
        const invalidScore2 = { distance: -50, time: 1000, jumps: 10 };
        const result3 = highScoreManager.addHighScore(invalidScore2);
        expect(result3.success).toBeFalsy();
        
        // Datos inválidos - tiempo negativo
        const invalidScore3 = { distance: 100, time: -1000, jumps: 10 };
        const result4 = highScoreManager.addHighScore(invalidScore3);
        expect(result4.success).toBeFalsy();
        
        afterEach();
    });

    testFramework.test('debe actualizar estadísticas del jugador', () => {
        beforeEach();
        
        // Estadísticas iniciales
        const initialStats = highScoreManager.getPlayerStats();
        expect(initialStats.gamesPlayed).toBe(0);
        expect(initialStats.totalDistance).toBe(0);
        
        // Agregar primera puntuación
        highScoreManager.addHighScore({
            distance: 100,
            time: 5000,
            jumps: 10,
            dashes: 5
        });
        
        let stats = highScoreManager.getPlayerStats();
        expect(stats.gamesPlayed).toBe(1);
        expect(stats.totalDistance).toBe(100);
        expect(stats.totalJumps).toBe(10);
        expect(stats.totalDashes).toBe(5);
        expect(stats.bestDistance).toBe(100);
        expect(stats.averageDistance).toBe(100);
        
        // Agregar segunda puntuación
        highScoreManager.addHighScore({
            distance: 200,
            time: 8000,
            jumps: 20,
            dashes: 10
        });
        
        stats = highScoreManager.getPlayerStats();
        expect(stats.gamesPlayed).toBe(2);
        expect(stats.totalDistance).toBe(300);
        expect(stats.totalJumps).toBe(30);
        expect(stats.totalDashes).toBe(15);
        expect(stats.bestDistance).toBe(200); // Nueva mejor distancia
        expect(stats.averageDistance).toBe(150); // (100 + 200) / 2
        
        afterEach();
    });

    testFramework.test('debe obtener mejor puntuación', () => {
        beforeEach();
        
        // Sin puntuaciones
        expect(highScoreManager.getBestScore()).toBeNull();
        
        // Agregar puntuaciones
        highScoreManager.addHighScore({ distance: 100, time: 1000, jumps: 10 });
        highScoreManager.addHighScore({ distance: 200, time: 2000, jumps: 20 });
        highScoreManager.addHighScore({ distance: 50, time: 500, jumps: 5 });
        
        const bestScore = highScoreManager.getBestScore();
        expect(bestScore).toBeDefined();
        expect(bestScore.distance).toBe(200);
        
        afterEach();
    });

    testFramework.test('debe formatear puntuaciones para mostrar', () => {
        beforeEach();
        
        highScoreManager.addHighScore({
            distance: 1500,
            time: 60000, // 60 segundos
            jumps: 25,
            dashes: 12,
            playerName: 'Test Player'
        });
        
        const formattedScores = highScoreManager.getFormattedHighScores();
        
        expect(formattedScores).toHaveLength(1);
        
        const score = formattedScores[0];
        expect(score.position).toBe(1);
        expect(score.distance).toBe('1,5km'); // Formateado en km
        expect(score.time).toBe('1min 0s'); // Formateado en min/s
        expect(score.jumps).toBe(25);
        expect(score.dashes).toBe(12);
        expect(score.playerName).toBe('Test Player');
        
        afterEach();
    });

    testFramework.test('debe limpiar puntuaciones altas', () => {
        beforeEach();
        
        // Agregar algunas puntuaciones
        highScoreManager.addHighScore({ distance: 100, time: 1000, jumps: 10 });
        highScoreManager.addHighScore({ distance: 200, time: 2000, jumps: 20 });
        
        expect(highScoreManager.getHighScores()).toHaveLength(2);
        
        const success = highScoreManager.clearHighScores();
        expect(success).toBeTruthy();
        
        expect(highScoreManager.getHighScores()).toHaveLength(0);
        
        afterEach();
    });

    testFramework.test('debe eliminar puntuación específica', () => {
        beforeEach();
        
        // Agregar puntuaciones
        highScoreManager.addHighScore({ distance: 100, time: 1000, jumps: 10 });
        highScoreManager.addHighScore({ distance: 200, time: 2000, jumps: 20 });
        highScoreManager.addHighScore({ distance: 150, time: 1500, jumps: 15 });
        
        expect(highScoreManager.getHighScores()).toHaveLength(3);
        
        // Eliminar la segunda puntuación (índice 1)
        const success = highScoreManager.removeHighScore(1);
        expect(success).toBeTruthy();
        
        const remainingScores = highScoreManager.getHighScores();
        expect(remainingScores).toHaveLength(2);
        expect(remainingScores[0].distance).toBe(200); // Primera (mejor)
        expect(remainingScores[1].distance).toBe(100); // Tercera (ahora segunda)
        
        afterEach();
    });

    testFramework.test('debe exportar e importar puntuaciones', () => {
        beforeEach();
        
        // Agregar puntuaciones
        highScoreManager.addHighScore({ distance: 100, time: 1000, jumps: 10 });
        highScoreManager.addHighScore({ distance: 200, time: 2000, jumps: 20 });
        
        // Exportar
        const exportData = highScoreManager.exportHighScores();
        expect(exportData).toBeDefined();
        expect(exportData.version).toBe('1.0');
        expect(exportData.highScores).toHaveLength(2);
        expect(exportData.playerStats).toBeDefined();
        
        // Limpiar datos actuales
        highScoreManager.clearHighScores();
        expect(highScoreManager.getHighScores()).toHaveLength(0);
        
        // Importar
        const success = highScoreManager.importHighScores(exportData);
        expect(success).toBeTruthy();
        
        const importedScores = highScoreManager.getHighScores();
        expect(importedScores).toHaveLength(2);
        expect(importedScores[0].distance).toBe(200);
        expect(importedScores[1].distance).toBe(100);
        
        afterEach();
    });

    testFramework.test('debe obtener estadísticas de puntuaciones altas', () => {
        beforeEach();
        
        // Sin puntuaciones
        let stats = highScoreManager.getHighScoreStats();
        expect(stats.count).toBe(0);
        expect(stats.bestDistance).toBe(0);
        expect(stats.averageDistance).toBe(0);
        
        // Con puntuaciones
        highScoreManager.addHighScore({ distance: 100, time: 5000, jumps: 10 });
        highScoreManager.addHighScore({ distance: 200, time: 8000, jumps: 20 });
        highScoreManager.addHighScore({ distance: 150, time: 6000, jumps: 15 });
        
        stats = highScoreManager.getHighScoreStats();
        expect(stats.count).toBe(3);
        expect(stats.bestDistance).toBe(200);
        expect(stats.averageDistance).toBe(150); // (100 + 200 + 150) / 3
        expect(stats.totalTime).toBe(19000); // 5000 + 8000 + 6000
        expect(stats.averageTime).toBe(Math.round(19000 / 3));
        
        afterEach();
    });

    testFramework.test('debe rechazar puntuación que no entra en el top cuando está lleno', () => {
        beforeEach();
        
        // Llenar el top 10 con puntuaciones de 100 a 1000
        for (let i = 1; i <= 10; i++) {
            highScoreManager.addHighScore({
                distance: i * 100,
                time: i * 1000,
                jumps: i * 10
            });
        }
        
        expect(highScoreManager.getHighScores()).toHaveLength(10);
        
        // Intentar agregar puntuación muy baja
        const result = highScoreManager.addHighScore({
            distance: 50, // Menor que la peor puntuación (100)
            time: 500,
            jumps: 5
        });
        
        expect(result.success).toBeFalsy();
        expect(result.position).toBe(-1);
        expect(highScoreManager.getHighScores()).toHaveLength(10); // No debe cambiar
        
        afterEach();
    });
});