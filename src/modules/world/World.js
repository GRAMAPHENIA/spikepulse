/**
 * World - Módulo principal del mundo con generación procedural
 * @module World
 */

import { ObstacleGenerator } from './ObstacleGenerator.js';
import { Background } from './Background.js';
import { SPANISH_TEXT } from '../../config/SpanishText.js';

export class World {
    /**
     * Crea una nueva instancia del World
     * @param {Object} config - Configuración del mundo
     * @param {EventBus} eventBus - Bus de eventos para comunicación
     */
    constructor(config, eventBus) {
        this.config = config.world || {};
        this.eventBus = eventBus;
        this.isInitialized = false;
        this.isActive = false;
        
        // Configuración del mundo
        this.scrollSpeed = this.config.scrollSpeed || 4;
        this.groundHeight = this.config.groundHeight || 100;
        this.scrollOffset = 0;
        this.totalDistance = 0;
        
        // Generador de obstáculos
        this.obstacleGenerator = new ObstacleGenerator(config.obstacles || {}, this.eventBus);
        
        // Sistema de fondo
        this.background = new Background(this.config, this.eventBus);
        
        // Lista de obstáculos activos
        this.obstacles = [];
        this.maxObstacles = 20; // Límite para optimización
        
        // Configuración de generación
        this.lastObstacleX = 0;
        this.minObstacleDistance = this.config.minObstacleDistance || 200;
        this.maxObstacleDistance = this.config.maxObstacleDistance || 400;
        
        // Estado del mundo
        this.state = {
            isScrolling: false,
            difficulty: 1,
            biome: 'industrial'
        };
        
        console.log('[World] Instancia creada');
    }

    /**
     * Inicializar el módulo del mundo
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {EventBus} eventBus - Bus de eventos
     * @param {Object} config - Configuración del juego
     */
    init(ctx, eventBus, config) {
        if (this.isInitialized) {
            console.warn('[World] Ya está inicializado');
            return;
        }

        // Guardar referencia al contexto
        this.ctx = ctx;
        this.canvasWidth = ctx.canvas.width;
        this.canvasHeight = ctx.canvas.height;
        
        // Inicializar subsistemas
        this.obstacleGenerator.init(ctx, eventBus, config);
        this.background.init(ctx, eventBus, config);
        
        // Configurar listeners de eventos
        this.setupEventListeners();
        
        // Resetear estado inicial
        this.reset();
        
        this.isInitialized = true;
        this.isActive = false; // Se activa cuando empieza el juego
        
        console.log('[World] Inicializado correctamente');
        this.eventBus.emit('world:initialized');
    }

    /**
     * Configurar listeners de eventos
     * @private
     */
    setupEventListeners() {
        // Eventos del juego
        this.eventBus.on('game:start', this.handleGameStart, this);
        this.eventBus.on('game:stop', this.handleGameStop, this);
        this.eventBus.on('game:reset', this.handleGameReset, this);
        
        // Eventos del jugador
        this.eventBus.on('player:update', this.handlePlayerUpdate, this);
        this.eventBus.on('player:died', this.handlePlayerDied, this);
        
        // Eventos de estado
        this.eventBus.on('state:change', this.handleStateChange, this);
        
        // Eventos de configuración
        this.eventBus.on('world:set-scroll-speed', this.handleSetScrollSpeed, this);
        this.eventBus.on('world:set-difficulty', this.handleSetDifficulty, this);
        
        console.log('[World] Event listeners configurados');
    }

    /**
     * Actualizar el mundo
     * @param {number} deltaTime - Tiempo transcurrido desde la última actualización
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    update(deltaTime, ctx) {
        if (!this.isInitialized || !this.isActive) {
            return;
        }

        // Actualizar scroll del mundo
        this.updateScroll(deltaTime);
        
        // Actualizar fondo
        this.background.update(deltaTime, this.scrollOffset);
        
        // Generar nuevos obstáculos si es necesario
        this.generateObstacles();
        
        // Actualizar obstáculos existentes
        this.updateObstacles(deltaTime);
        
        // Limpiar obstáculos fuera de pantalla
        this.cleanupObstacles();
        
        // Actualizar dificultad basada en distancia
        this.updateDifficulty();
        
        // Emitir evento de actualización
        this.eventBus.emit('world:update', {
            scrollOffset: this.scrollOffset,
            totalDistance: this.totalDistance,
            obstacleCount: this.obstacles.length,
            difficulty: this.state.difficulty
        });
    }

    /**
     * Renderizar el mundo
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    render(ctx) {
        if (!this.isInitialized) {
            return;
        }

        // Renderizar fondo
        this.background.render(ctx, this.scrollOffset);
        
        // Renderizar suelo
        this.renderGround(ctx);
        
        // Renderizar obstáculos
        this.renderObstacles(ctx);
        
        // Renderizar efectos atmosféricos si están activos
        if (this.isActive) {
            this.renderAtmosphericEffects(ctx);
        }
    }

    /**
     * Actualizar scroll del mundo
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updateScroll(deltaTime) {
        if (this.state.isScrolling) {
            const scrollDelta = this.scrollSpeed * (deltaTime / 16.67); // Normalizar a 60fps
            this.scrollOffset += scrollDelta;
            this.totalDistance += scrollDelta;
            
            // Emitir evento de scroll
            this.eventBus.emit('world:scrolled', {
                delta: scrollDelta,
                offset: this.scrollOffset,
                totalDistance: this.totalDistance
            });
        }
    }

    /**
     * Generar nuevos obstáculos
     * @private
     */
    generateObstacles() {
        // Calcular posición del próximo obstáculo
        const screenRightEdge = this.scrollOffset + this.canvasWidth;
        const nextObstacleX = this.lastObstacleX + this.getNextObstacleDistance();
        
        // Generar obstáculo si es necesario
        if (nextObstacleX < screenRightEdge + 200) { // Buffer de 200px
            const obstacle = this.obstacleGenerator.generateObstacle(nextObstacleX, this.state.difficulty);
            
            if (obstacle) {
                this.obstacles.push(obstacle);
                this.lastObstacleX = nextObstacleX;
                
                this.eventBus.emit('world:obstacle-generated', {
                    obstacle,
                    position: nextObstacleX,
                    difficulty: this.state.difficulty
                });
            }
        }
    }

    /**
     * Obtener distancia al próximo obstáculo
     * @returns {number} Distancia en píxeles
     * @private
     */
    getNextObstacleDistance() {
        // Variar distancia basada en dificultad
        const baseDistance = this.minObstacleDistance;
        const maxVariation = this.maxObstacleDistance - this.minObstacleDistance;
        const difficultyFactor = Math.max(0.3, 1 - (this.state.difficulty - 1) * 0.1);
        
        const variation = Math.random() * maxVariation * difficultyFactor;
        return baseDistance + variation;
    }

    /**
     * Actualizar obstáculos existentes
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updateObstacles(deltaTime) {
        this.obstacles.forEach(obstacle => {
            if (obstacle.update) {
                obstacle.update(deltaTime, this.scrollOffset);
            }
        });
    }

    /**
     * Limpiar obstáculos fuera de pantalla
     * @private
     */
    cleanupObstacles() {
        const screenLeftEdge = this.scrollOffset - 100; // Buffer de 100px
        
        const initialCount = this.obstacles.length;
        this.obstacles = this.obstacles.filter(obstacle => {
            const shouldKeep = obstacle.x + obstacle.width > screenLeftEdge;
            
            if (!shouldKeep && obstacle.destroy) {
                obstacle.destroy();
            }
            
            return shouldKeep;
        });
        
        const removedCount = initialCount - this.obstacles.length;
        if (removedCount > 0) {
            this.eventBus.emit('world:obstacles-cleaned', {
                removedCount,
                remainingCount: this.obstacles.length
            });
        }
    }

    /**
     * Actualizar dificultad basada en distancia
     * @private
     */
    updateDifficulty() {
        const newDifficulty = Math.floor(this.totalDistance / 1000) + 1;
        
        if (newDifficulty !== this.state.difficulty) {
            const oldDifficulty = this.state.difficulty;
            this.state.difficulty = Math.min(newDifficulty, 10); // Máximo nivel 10
            
            this.eventBus.emit('world:difficulty-changed', {
                oldDifficulty,
                newDifficulty: this.state.difficulty,
                distance: this.totalDistance
            });
            
            console.log(`[World] Dificultad aumentada a nivel ${this.state.difficulty}`);
        }
    }

    /**
     * Renderizar el suelo
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @private
     */
    renderGround(ctx) {
        const groundY = this.canvasHeight - this.groundHeight;
        
        // Fondo del suelo
        ctx.fillStyle = this.config.groundColor || '#2D3748';
        ctx.fillRect(0, groundY, this.canvasWidth, this.groundHeight);
        
        // Línea superior del suelo con efecto Spikepulse
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        
        // Crear efecto de pulso en la línea del suelo
        const pulseOffset = Math.sin(Date.now() * 0.003) * 2;
        for (let x = 0; x < this.canvasWidth; x += 20) {
            const y = groundY + Math.sin((x + this.scrollOffset) * 0.01) * 3 + pulseOffset;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(this.canvasWidth, groundY);
        ctx.stroke();
        
        // Resetear sombra
        ctx.shadowBlur = 0;
    }

    /**
     * Renderizar obstáculos
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @private
     */
    renderObstacles(ctx) {
        this.obstacles.forEach(obstacle => {
            if (obstacle.render) {
                obstacle.render(ctx, this.scrollOffset);
            }
        });
    }

    /**
     * Renderizar efectos atmosféricos
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @private
     */
    renderAtmosphericEffects(ctx) {
        // Efecto de niebla sutil
        const fogAlpha = 0.1 + Math.sin(Date.now() * 0.001) * 0.05;
        ctx.fillStyle = `rgba(100, 100, 120, ${fogAlpha})`;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Partículas flotantes (efecto industrial)
        this.renderFloatingParticles(ctx);
    }

    /**
     * Renderizar partículas flotantes
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @private
     */
    renderFloatingParticles(ctx) {
        const particleCount = 5;
        const time = Date.now() * 0.001;
        
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        
        for (let i = 0; i < particleCount; i++) {
            const x = (this.scrollOffset * 0.1 + i * 150 + Math.sin(time + i) * 50) % (this.canvasWidth + 100);
            const y = 50 + Math.sin(time * 0.5 + i * 2) * 30;
            const size = 2 + Math.sin(time + i) * 1;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Obtener obstáculos en un área específica
     * @param {number} x - Posición X
     * @param {number} width - Ancho del área
     * @returns {Array} Obstáculos en el área
     */
    getObstaclesInArea(x, width) {
        return this.obstacles.filter(obstacle => {
            return obstacle.x < x + width && obstacle.x + obstacle.width > x;
        });
    }

    /**
     * Verificar colisión con obstáculos
     * @param {Object} hitbox - Hitbox a verificar {x, y, width, height}
     * @returns {Object|null} Obstáculo colisionado o null
     */
    checkObstacleCollision(hitbox) {
        for (const obstacle of this.obstacles) {
            if (obstacle.checkCollision && obstacle.checkCollision(hitbox)) {
                return obstacle;
            }
        }
        return null;
    }

    /**
     * Resetear el mundo
     */
    reset() {
        this.scrollOffset = 0;
        this.totalDistance = 0;
        this.lastObstacleX = this.canvasWidth || 800; // Primer obstáculo fuera de pantalla
        
        // Limpiar obstáculos
        this.obstacles.forEach(obstacle => {
            if (obstacle.destroy) obstacle.destroy();
        });
        this.obstacles = [];
        
        // Resetear subsistemas
        this.obstacleGenerator.reset();
        this.background.reset();
        
        // Resetear estado
        this.state.isScrolling = false;
        this.state.difficulty = 1;
        
        console.log('[World] Mundo reseteado');
        this.eventBus.emit('world:reset');
    }

    // ===== EVENT HANDLERS =====

    /**
     * Manejar inicio del juego
     * @private
     */
    handleGameStart() {
        this.isActive = true;
        this.state.isScrolling = true;
        console.log('[World] Juego iniciado - mundo activo');
    }

    /**
     * Manejar parada del juego
     * @private
     */
    handleGameStop() {
        this.state.isScrolling = false;
        console.log('[World] Juego detenido - scroll pausado');
    }

    /**
     * Manejar reset del juego
     * @private
     */
    handleGameReset() {
        this.reset();
        console.log('[World] Juego reseteado');
    }

    /**
     * Manejar actualización del jugador
     * @param {Object} data - Datos del jugador
     * @private
     */
    handlePlayerUpdate(data) {
        // Verificar colisiones con obstáculos
        if (data.position && this.isActive) {
            const playerHitbox = {
                x: data.position.x,
                y: data.position.y,
                width: 30, // Tamaño por defecto del jugador
                height: 30
            };
            
            const collidedObstacle = this.checkObstacleCollision(playerHitbox);
            if (collidedObstacle) {
                this.eventBus.emit('collision:obstacle', {
                    obstacle: collidedObstacle,
                    player: playerHitbox
                });
            }
        }
    }

    /**
     * Manejar muerte del jugador
     * @param {Object} data - Datos de la muerte
     * @private
     */
    handlePlayerDied(data) {
        this.state.isScrolling = false;
        this.isActive = false;
        console.log('[World] Jugador murió - mundo pausado');
    }

    /**
     * Manejar cambio de estado del juego
     * @param {Object} data - Datos del cambio de estado
     * @private
     */
    handleStateChange(data) {
        const { to } = data;
        
        switch (to) {
            case 'playing':
                this.isActive = true;
                this.state.isScrolling = true;
                break;
            case 'paused':
                this.state.isScrolling = false;
                break;
            case 'gameOver':
            case 'menu':
                this.isActive = false;
                this.state.isScrolling = false;
                break;
        }
    }

    /**
     * Manejar cambio de velocidad de scroll
     * @param {Object} data - Datos de velocidad
     * @private
     */
    handleSetScrollSpeed(data) {
        const { speed } = data;
        if (typeof speed === 'number' && speed > 0) {
            this.scrollSpeed = speed;
            console.log(`[World] Velocidad de scroll cambiada a ${speed}`);
        }
    }

    /**
     * Manejar cambio de dificultad
     * @param {Object} data - Datos de dificultad
     * @private
     */
    handleSetDifficulty(data) {
        const { difficulty } = data;
        if (typeof difficulty === 'number' && difficulty >= 1 && difficulty <= 10) {
            this.state.difficulty = difficulty;
            console.log(`[World] Dificultad cambiada a ${difficulty}`);
        }
    }

    // ===== GETTERS PÚBLICOS =====

    /**
     * Obtener offset de scroll actual
     * @returns {number} Offset de scroll
     */
    getScrollOffset() {
        return this.scrollOffset;
    }

    /**
     * Obtener distancia total recorrida
     * @returns {number} Distancia total
     */
    getTotalDistance() {
        return this.totalDistance;
    }

    /**
     * Obtener lista de obstáculos activos
     * @returns {Array} Obstáculos activos
     */
    getObstacles() {
        return [...this.obstacles];
    }

    /**
     * Obtener estado actual del mundo
     * @returns {Object} Estado del mundo
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Obtener estadísticas del mundo
     * @returns {Object} Estadísticas del mundo
     */
    getStats() {
        return {
            isActive: this.isActive,
            scrollOffset: this.scrollOffset,
            totalDistance: this.totalDistance,
            obstacleCount: this.obstacles.length,
            difficulty: this.state.difficulty,
            scrollSpeed: this.scrollSpeed,
            isScrolling: this.state.isScrolling
        };
    }

    /**
     * Limpiar recursos del módulo
     */
    destroy() {
        if (!this.isInitialized) return;
        
        // Limpiar event listeners
        this.eventBus.offContext(this);
        
        // Limpiar obstáculos
        this.obstacles.forEach(obstacle => {
            if (obstacle.destroy) obstacle.destroy();
        });
        this.obstacles = [];
        
        // Limpiar subsistemas
        if (this.obstacleGenerator) this.obstacleGenerator.destroy();
        if (this.background) this.background.destroy();
        
        this.isInitialized = false;
        this.isActive = false;
        
        console.log('[World] Módulo destruido');
    }
}