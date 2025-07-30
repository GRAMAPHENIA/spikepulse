/**
 * ObstacleGenerator - Generador procedural de obstáculos
 * @module ObstacleGenerator
 */

import { SpikeObstacle } from './obstacles/SpikeObstacle.js';
import { TechObstacle } from './obstacles/TechObstacle.js';
import { PulseObstacle } from './obstacles/PulseObstacle.js';

export class ObstacleGenerator {
    /**
     * Crea una nueva instancia del ObstacleGenerator
     * @param {Object} config - Configuración de obstáculos
     * @param {EventBus} eventBus - Bus de eventos para comunicación
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isInitialized = false;
        
        // Configuración de generación
        this.obstacleTypes = ['spike', 'tech', 'pulse'];
        this.patterns = new Map();
        this.currentPattern = null;
        this.patternProgress = 0;
        
        // Configuración de dificultad
        this.difficultySettings = {
            1: { density: 0.3, complexity: 0.2, speed: 1.0 },
            2: { density: 0.4, complexity: 0.3, speed: 1.1 },
            3: { density: 0.5, complexity: 0.4, speed: 1.2 },
            4: { density: 0.6, complexity: 0.5, speed: 1.3 },
            5: { density: 0.7, complexity: 0.6, speed: 1.4 },
            6: { density: 0.8, complexity: 0.7, speed: 1.5 },
            7: { density: 0.85, complexity: 0.8, speed: 1.6 },
            8: { density: 0.9, complexity: 0.85, speed: 1.7 },
            9: { density: 0.95, complexity: 0.9, speed: 1.8 },
            10: { density: 1.0, complexity: 1.0, speed: 2.0 }
        };
        
        // Estadísticas de generación
        this.stats = {
            totalGenerated: 0,
            byType: {},
            byDifficulty: {}
        };
        
        console.log('[ObstacleGenerator] Instancia creada');
    }

    /**
     * Inicializar el generador de obstáculos
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {EventBus} eventBus - Bus de eventos
     * @param {Object} config - Configuración del juego
     */
    init(ctx, eventBus, config) {
        if (this.isInitialized) {
            console.warn('[ObstacleGenerator] Ya está inicializado');
            return;
        }

        this.ctx = ctx;
        this.canvasWidth = ctx.canvas.width;
        this.canvasHeight = ctx.canvas.height;
        this.groundHeight = config.world?.groundHeight || 100;
        
        // Inicializar patrones de obstáculos
        this.initializePatterns();
        
        // Inicializar estadísticas
        this.obstacleTypes.forEach(type => {
            this.stats.byType[type] = 0;
        });
        
        Object.keys(this.difficultySettings).forEach(difficulty => {
            this.stats.byDifficulty[difficulty] = 0;
        });
        
        this.isInitialized = true;
        console.log('[ObstacleGenerator] Inicializado correctamente');
    }

    /**
     * Inicializar patrones de obstáculos
     * @private
     */
    initializePatterns() {
        // Patrón simple: obstáculo único
        this.patterns.set('single', {
            name: 'single',
            length: 1,
            generate: (x, difficulty) => [this.createRandomObstacle(x, difficulty)]
        });
        
        // Patrón doble: dos obstáculos seguidos
        this.patterns.set('double', {
            name: 'double',
            length: 2,
            generate: (x, difficulty) => [
                this.createRandomObstacle(x, difficulty),
                this.createRandomObstacle(x + 100, difficulty)
            ]
        });
        
        // Patrón escalera: obstáculos de altura creciente
        this.patterns.set('stairs', {
            name: 'stairs',
            length: 3,
            generate: (x, difficulty) => {
                const obstacles = [];
                for (let i = 0; i < 3; i++) {
                    const height = 40 + (i * 20);
                    obstacles.push(this.createObstacle('spike', x + (i * 80), height, difficulty));
                }
                return obstacles;
            }
        });
        
        // Patrón zigzag: obstáculos alternando altura
        this.patterns.set('zigzag', {
            name: 'zigzag',
            length: 4,
            generate: (x, difficulty) => {
                const obstacles = [];
                const heights = [30, 60, 30, 60];
                for (let i = 0; i < 4; i++) {
                    obstacles.push(this.createObstacle('spike', x + (i * 60), heights[i], difficulty));
                }
                return obstacles;
            }
        });
        
        // Patrón tech: obstáculos tecnológicos complejos
        this.patterns.set('tech_complex', {
            name: 'tech_complex',
            length: 2,
            generate: (x, difficulty) => [
                this.createObstacle('tech', x, 50, difficulty),
                this.createObstacle('pulse', x + 120, 40, difficulty)
            ]
        });
        
        console.log(`[ObstacleGenerator] ${this.patterns.size} patrones inicializados`);
    }

    /**
     * Generar un obstáculo en la posición especificada
     * @param {number} x - Posición X del obstáculo
     * @param {number} difficulty - Nivel de dificultad (1-10)
     * @returns {Object|null} Obstáculo generado o null
     */
    generateObstacle(x, difficulty = 1) {
        if (!this.isInitialized) {
            console.warn('[ObstacleGenerator] No está inicializado');
            return null;
        }

        // Seleccionar patrón basado en dificultad
        const pattern = this.selectPattern(difficulty);
        if (!pattern) {
            return this.createRandomObstacle(x, difficulty);
        }

        // Generar obstáculos del patrón
        const obstacles = pattern.generate(x, difficulty);
        
        // Por ahora retornamos solo el primer obstáculo
        // En el futuro se puede extender para manejar patrones múltiples
        const obstacle = obstacles[0];
        
        if (obstacle) {
            this.updateStats(obstacle.type, difficulty);
            
            this.eventBus.emit('obstacle:generated', {
                obstacle,
                pattern: pattern.name,
                difficulty,
                position: x
            });
        }
        
        return obstacle;
    }

    /**
     * Seleccionar patrón basado en dificultad
     * @param {number} difficulty - Nivel de dificultad
     * @returns {Object|null} Patrón seleccionado
     * @private
     */
    selectPattern(difficulty) {
        const settings = this.difficultySettings[difficulty] || this.difficultySettings[1];
        const complexity = settings.complexity;
        
        // Patrones disponibles basados en complejidad
        let availablePatterns = ['single'];
        
        if (complexity >= 0.3) availablePatterns.push('double');
        if (complexity >= 0.5) availablePatterns.push('stairs');
        if (complexity >= 0.7) availablePatterns.push('zigzag');
        if (complexity >= 0.8) availablePatterns.push('tech_complex');
        
        // Seleccionar patrón aleatoriamente
        const patternName = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
        return this.patterns.get(patternName);
    }

    /**
     * Crear un obstáculo aleatorio
     * @param {number} x - Posición X
     * @param {number} difficulty - Nivel de dificultad
     * @returns {Object} Obstáculo creado
     * @private
     */
    createRandomObstacle(x, difficulty) {
        const type = this.selectObstacleType(difficulty);
        const height = this.calculateObstacleHeight(difficulty);
        return this.createObstacle(type, x, height, difficulty);
    }

    /**
     * Seleccionar tipo de obstáculo basado en dificultad
     * @param {number} difficulty - Nivel de dificultad
     * @returns {string} Tipo de obstáculo
     * @private
     */
    selectObstacleType(difficulty) {
        const settings = this.difficultySettings[difficulty] || this.difficultySettings[1];
        
        // Probabilidades basadas en dificultad
        const probabilities = {
            spike: 0.6 - (difficulty * 0.05), // Menos spikes en dificultades altas
            tech: 0.2 + (difficulty * 0.03),  // Más tech en dificultades altas
            pulse: 0.2 + (difficulty * 0.02)  // Más pulse en dificultades altas
        };
        
        const random = Math.random();
        let cumulative = 0;
        
        for (const [type, probability] of Object.entries(probabilities)) {
            cumulative += probability;
            if (random <= cumulative) {
                return type;
            }
        }
        
        return 'spike'; // Fallback
    }

    /**
     * Calcular altura del obstáculo basada en dificultad
     * @param {number} difficulty - Nivel de dificultad
     * @returns {number} Altura del obstáculo
     * @private
     */
    calculateObstacleHeight(difficulty) {
        const minHeight = this.config.minHeight || 30;
        const maxHeight = this.config.maxHeight || 80;
        const settings = this.difficultySettings[difficulty] || this.difficultySettings[1];
        
        // Altura base más variación aleatoria
        const baseHeight = minHeight + (maxHeight - minHeight) * settings.density * 0.5;
        const variation = (maxHeight - minHeight) * 0.3 * Math.random();
        
        return Math.floor(baseHeight + variation);
    }

    /**
     * Crear un obstáculo específico
     * @param {string} type - Tipo de obstáculo
     * @param {number} x - Posición X
     * @param {number} height - Altura del obstáculo
     * @param {number} difficulty - Nivel de dificultad
     * @returns {Object} Obstáculo creado
     * @private
     */
    createObstacle(type, x, height, difficulty) {
        const width = this.config.width || 30;
        const groundY = this.canvasHeight - this.groundHeight;
        const y = groundY - height;
        
        const baseConfig = {
            x,
            y,
            width,
            height,
            difficulty,
            color: this.config.color || '#E53E3E'
        };
        
        switch (type) {
            case 'spike':
                return new SpikeObstacle(baseConfig, this.eventBus);
            case 'tech':
                return new TechObstacle(baseConfig, this.eventBus);
            case 'pulse':
                return new PulseObstacle(baseConfig, this.eventBus);
            default:
                console.warn(`[ObstacleGenerator] Tipo de obstáculo desconocido: ${type}`);
                return new SpikeObstacle(baseConfig, this.eventBus);
        }
    }

    /**
     * Actualizar estadísticas de generación
     * @param {string} type - Tipo de obstáculo
     * @param {number} difficulty - Nivel de dificultad
     * @private
     */
    updateStats(type, difficulty) {
        this.stats.totalGenerated++;
        this.stats.byType[type] = (this.stats.byType[type] || 0) + 1;
        this.stats.byDifficulty[difficulty] = (this.stats.byDifficulty[difficulty] || 0) + 1;
    }

    /**
     * Generar múltiples obstáculos en un área
     * @param {number} startX - Posición X inicial
     * @param {number} endX - Posición X final
     * @param {number} difficulty - Nivel de dificultad
     * @returns {Array} Array de obstáculos generados
     */
    generateObstaclesInArea(startX, endX, difficulty = 1) {
        const obstacles = [];
        const settings = this.difficultySettings[difficulty] || this.difficultySettings[1];
        const spacing = 150 / settings.density; // Espaciado basado en densidad
        
        for (let x = startX; x < endX; x += spacing) {
            const obstacle = this.generateObstacle(x, difficulty);
            if (obstacle) {
                obstacles.push(obstacle);
            }
        }
        
        return obstacles;
    }

    /**
     * Resetear el generador
     */
    reset() {
        this.currentPattern = null;
        this.patternProgress = 0;
        
        // Resetear estadísticas
        this.stats.totalGenerated = 0;
        Object.keys(this.stats.byType).forEach(type => {
            this.stats.byType[type] = 0;
        });
        Object.keys(this.stats.byDifficulty).forEach(difficulty => {
            this.stats.byDifficulty[difficulty] = 0;
        });
        
        console.log('[ObstacleGenerator] Generador reseteado');
    }

    /**
     * Obtener estadísticas del generador
     * @returns {Object} Estadísticas de generación
     */
    getStats() {
        return {
            ...this.stats,
            patternsAvailable: this.patterns.size,
            obstacleTypesAvailable: this.obstacleTypes.length,
            difficultyLevels: Object.keys(this.difficultySettings).length
        };
    }

    /**
     * Obtener configuración de dificultad
     * @param {number} difficulty - Nivel de dificultad
     * @returns {Object} Configuración de dificultad
     */
    getDifficultySettings(difficulty) {
        return { ...this.difficultySettings[difficulty] } || { ...this.difficultySettings[1] };
    }

    /**
     * Agregar patrón personalizado
     * @param {string} name - Nombre del patrón
     * @param {Object} pattern - Configuración del patrón
     */
    addPattern(name, pattern) {
        if (typeof pattern.generate === 'function') {
            this.patterns.set(name, pattern);
            console.log(`[ObstacleGenerator] Patrón '${name}' agregado`);
        } else {
            console.error(`[ObstacleGenerator] Patrón '${name}' inválido - debe tener función generate`);
        }
    }

    /**
     * Remover patrón
     * @param {string} name - Nombre del patrón
     */
    removePattern(name) {
        if (this.patterns.delete(name)) {
            console.log(`[ObstacleGenerator] Patrón '${name}' removido`);
        } else {
            console.warn(`[ObstacleGenerator] Patrón '${name}' no encontrado`);
        }
    }

    /**
     * Limpiar recursos del generador
     */
    destroy() {
        if (!this.isInitialized) return;
        
        this.patterns.clear();
        this.stats = {
            totalGenerated: 0,
            byType: {},
            byDifficulty: {}
        };
        
        this.isInitialized = false;
        console.log('[ObstacleGenerator] Generador destruido');
    }
}