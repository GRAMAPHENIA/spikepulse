/**
 * Detector de colisiones optimizado para Spikepulse
 * @module CollisionDetector
 */

export class CollisionDetector {
    /**
     * Crea una nueva instancia del detector de colisiones
     * @param {Object} config - Configuración de física
     * @param {EventBus} eventBus - Bus de eventos
     * @param {Object} worldBounds - Límites del mundo
     */
    constructor(config, eventBus, worldBounds) {
        this.config = config;
        this.eventBus = eventBus;
        this.worldBounds = worldBounds;
        this.isInitialized = false;
        
        // Configuración de colisiones
        this.collisionConfig = {
            playerHitbox: config.collision?.playerHitbox || {
                width: 28,
                height: 28,
                offsetX: 1,
                offsetY: 1
            },
            obstacleMargin: config.collision?.obstacleMargin || 2,
            precisionSteps: config.collision?.precisionSteps || 4
        };
        
        // Spatial hashing para optimización
        this.spatialHash = {
            enabled: config.optimization?.spatialHashingEnabled !== false,
            gridSize: config.optimization?.collisionGridSize || 50,
            grid: new Map()
        };
        
        // Broad phase collision detection
        this.broadPhase = {
            enabled: config.optimization?.broadPhaseEnabled !== false,
            aabb: []
        };
        
        // Estadísticas de performance
        this.stats = {
            totalChecks: 0,
            broadPhaseFiltered: 0,
            narrowPhaseChecks: 0,
            collisionsDetected: 0,
            lastResetTime: Date.now()
        };
        
        console.log('🎯 CollisionDetector creado');
    }
    
    /**
     * Inicializa el detector de colisiones
     */
    async init() {
        try {
            console.log('🔧 Inicializando CollisionDetector...');
            
            // Inicializar spatial hash si está habilitado
            if (this.spatialHash.enabled) {
                this.initializeSpatialHash();
            }
            
            this.isInitialized = true;
            console.log('✅ CollisionDetector inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando CollisionDetector:', error);
            throw error;
        }
    }
    
    /**
     * Inicializa el sistema de spatial hashing
     */
    initializeSpatialHash() {
        this.spatialHash.grid.clear();
        console.log('🗂️ Spatial hash inicializado');
    }
    
    /**
     * Actualización con timestep fijo
     * @param {number} fixedDelta - Delta time fijo
     */
    fixedUpdate(fixedDelta) {
        if (!this.isInitialized) return;
        
        // Actualizar spatial hash si está habilitado
        if (this.spatialHash.enabled) {
            this.updateSpatialHash();
        }
        
        // Resetear estadísticas periódicamente
        this.updateStats();
    }
    
    /**
     * Actualiza el spatial hash
     */
    updateSpatialHash() {
        // El spatial hash se actualiza dinámicamente durante las verificaciones
        // Aquí solo limpiamos entradas antiguas si es necesario
        if (this.spatialHash.grid.size > 1000) {
            this.spatialHash.grid.clear();
        }
    }
    
    /**
     * Actualiza estadísticas de performance
     */
    updateStats() {
        const currentTime = Date.now();
        if (currentTime - this.stats.lastResetTime > 5000) { // Reset cada 5 segundos
            this.stats.totalChecks = 0;
            this.stats.broadPhaseFiltered = 0;
            this.stats.narrowPhaseChecks = 0;
            this.stats.collisionsDetected = 0;
            this.stats.lastResetTime = currentTime;
        }
    }
    
    /**
     * Verifica colisión entre rectángulos
     * @param {Object} rectA - Primer rectángulo {x, y, width, height}
     * @param {Object} rectB - Segundo rectángulo {x, y, width, height}
     * @returns {boolean} True si hay colisión
     */
    checkRectangleCollision(rectA, rectB) {
        this.stats.totalChecks++;
        
        // AABB collision detection
        const collision = rectA.x < rectB.x + rectB.width &&
                         rectA.x + rectA.width > rectB.x &&
                         rectA.y < rectB.y + rectB.height &&
                         rectA.y + rectA.height > rectB.y;
        
        if (collision) {
            this.stats.collisionsDetected++;
        }
        
        return collision;
    }
    
    /**
     * Verifica colisión entre el jugador y un obstáculo
     * @param {Object} playerHitbox - Hitbox del jugador
     * @param {Object} obstacle - Obstáculo
     * @returns {boolean} True si hay colisión
     */
    checkObstacleCollision(playerHitbox, obstacle) {
        this.stats.totalChecks++;
        
        // Broad phase: verificación rápida de AABB
        if (!this.broadPhaseCheck(playerHitbox, obstacle)) {
            this.stats.broadPhaseFiltered++;
            return false;
        }
        
        this.stats.narrowPhaseChecks++;
        
        // Narrow phase: verificación precisa según el tipo de obstáculo
        switch (obstacle.type) {
            case 'spike':
                return this.checkSpikeCollision(playerHitbox, obstacle);
                
            case 'wall':
                return this.checkWallCollision(playerHitbox, obstacle);
                
            case 'moving':
                return this.checkMovingObstacleCollision(playerHitbox, obstacle);
                
            case 'rotating':
                return this.checkRotatingObstacleCollision(playerHitbox, obstacle);
                
            default:
                return this.checkRectangleCollision(playerHitbox, obstacle);
        }
    }
    
    /**
     * Verificación broad phase (AABB rápida)
     * @param {Object} playerHitbox - Hitbox del jugador
     * @param {Object} obstacle - Obstáculo
     * @returns {boolean} True si pasa la verificación broad phase
     */
    broadPhaseCheck(playerHitbox, obstacle) {
        if (!this.broadPhase.enabled) return true;
        
        // Expandir ligeramente los límites para el broad phase
        const margin = this.collisionConfig.obstacleMargin;
        
        return playerHitbox.x < obstacle.x + obstacle.width + margin &&
               playerHitbox.x + playerHitbox.width > obstacle.x - margin &&
               playerHitbox.y < obstacle.y + obstacle.height + margin &&
               playerHitbox.y + playerHitbox.height > obstacle.y - margin;
    }
    
    /**
     * Verifica colisión con un spike (forma triangular)
     * @param {Object} playerHitbox - Hitbox del jugador
     * @param {Object} spike - Obstáculo spike
     * @returns {boolean} True si hay colisión
     */
    checkSpikeCollision(playerHitbox, spike) {
        // Verificar colisión básica primero
        if (!this.checkRectangleCollision(playerHitbox, spike)) {
            return false;
        }
        
        // Verificación más precisa para la forma triangular
        const spikeCenterX = spike.x + spike.width / 2;
        const spikeCenterY = spike.y + spike.height / 2;
        const spikeTop = spike.y;
        const spikeBottom = spike.y + spike.height;
        const spikeLeft = spike.x;
        const spikeRight = spike.x + spike.width;
        
        // Verificar si algún punto del jugador está dentro del triángulo
        const playerPoints = [
            { x: playerHitbox.x, y: playerHitbox.y },
            { x: playerHitbox.x + playerHitbox.width, y: playerHitbox.y },
            { x: playerHitbox.x, y: playerHitbox.y + playerHitbox.height },
            { x: playerHitbox.x + playerHitbox.width, y: playerHitbox.y + playerHitbox.height }
        ];
        
        for (const point of playerPoints) {
            if (this.pointInTriangle(point, 
                { x: spikeCenterX, y: spikeTop },
                { x: spikeLeft, y: spikeBottom },
                { x: spikeRight, y: spikeBottom })) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Verifica si un punto está dentro de un triángulo
     * @param {Object} point - Punto a verificar
     * @param {Object} a - Vértice A del triángulo
     * @param {Object} b - Vértice B del triángulo
     * @param {Object} c - Vértice C del triángulo
     * @returns {boolean} True si el punto está dentro
     */
    pointInTriangle(point, a, b, c) {
        const denom = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
        const alpha = ((b.y - c.y) * (point.x - c.x) + (c.x - b.x) * (point.y - c.y)) / denom;
        const beta = ((c.y - a.y) * (point.x - c.x) + (a.x - c.x) * (point.y - c.y)) / denom;
        const gamma = 1 - alpha - beta;
        
        return alpha >= 0 && beta >= 0 && gamma >= 0;
    }
    
    /**
     * Verifica colisión con una pared
     * @param {Object} playerHitbox - Hitbox del jugador
     * @param {Object} wall - Obstáculo pared
     * @returns {boolean} True si hay colisión
     */
    checkWallCollision(playerHitbox, wall) {
        // Para paredes, usar colisión rectangular estándar
        return this.checkRectangleCollision(playerHitbox, wall);
    }
    
    /**
     * Verifica colisión con un obstáculo móvil
     * @param {Object} playerHitbox - Hitbox del jugador
     * @param {Object} movingObstacle - Obstáculo móvil
     * @returns {boolean} True si hay colisión
     */
    checkMovingObstacleCollision(playerHitbox, movingObstacle) {
        // Usar la posición actual del obstáculo móvil
        const currentObstacle = {
            x: movingObstacle.x,
            y: movingObstacle.currentY || movingObstacle.y,
            width: movingObstacle.width,
            height: movingObstacle.height
        };
        
        return this.checkRectangleCollision(playerHitbox, currentObstacle);
    }
    
    /**
     * Verifica colisión con un obstáculo rotatorio
     * @param {Object} playerHitbox - Hitbox del jugador
     * @param {Object} rotatingObstacle - Obstáculo rotatorio
     * @returns {boolean} True si hay colisión
     */
    checkRotatingObstacleCollision(playerHitbox, rotatingObstacle) {
        const centerX = rotatingObstacle.x + rotatingObstacle.width / 2;
        const centerY = rotatingObstacle.y + rotatingObstacle.height / 2;
        const radius = rotatingObstacle.width / 2;
        
        // Verificar si algún punto del jugador está dentro del círculo rotatorio
        const playerPoints = [
            { x: playerHitbox.x, y: playerHitbox.y },
            { x: playerHitbox.x + playerHitbox.width, y: playerHitbox.y },
            { x: playerHitbox.x, y: playerHitbox.y + playerHitbox.height },
            { x: playerHitbox.x + playerHitbox.width, y: playerHitbox.y + playerHitbox.height },
            { x: playerHitbox.x + playerHitbox.width / 2, y: playerHitbox.y + playerHitbox.height / 2 }
        ];
        
        for (const point of playerPoints) {
            const distance = Math.sqrt(
                Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2)
            );
            
            if (distance <= radius) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Verifica colisión con múltiples pasos para objetos de alta velocidad
     * @param {Object} startHitbox - Hitbox inicial
     * @param {Object} endHitbox - Hitbox final
     * @param {Object} obstacle - Obstáculo
     * @returns {boolean} True si hay colisión en algún paso
     */
    checkContinuousCollision(startHitbox, endHitbox, obstacle) {
        const steps = this.collisionConfig.precisionSteps;
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const interpolatedHitbox = {
                x: startHitbox.x + (endHitbox.x - startHitbox.x) * t,
                y: startHitbox.y + (endHitbox.y - startHitbox.y) * t,
                width: startHitbox.width,
                height: startHitbox.height
            };
            
            if (this.checkObstacleCollision(interpolatedHitbox, obstacle)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Calcula la corrección de posición para una colisión
     * @param {Object} playerHitbox - Hitbox del jugador
     * @param {Object} obstacle - Obstáculo
     * @returns {Object} Vector de corrección {x, y}
     */
    calculateCollisionCorrection(playerHitbox, obstacle) {
        // Calcular solapamiento en cada eje
        const overlapX = Math.min(
            playerHitbox.x + playerHitbox.width - obstacle.x,
            obstacle.x + obstacle.width - playerHitbox.x
        );
        
        const overlapY = Math.min(
            playerHitbox.y + playerHitbox.height - obstacle.y,
            obstacle.y + obstacle.height - playerHitbox.y
        );
        
        // Corregir en el eje con menor solapamiento
        if (overlapX < overlapY) {
            // Corrección horizontal
            const direction = playerHitbox.x < obstacle.x ? -1 : 1;
            return { x: overlapX * direction, y: 0 };
        } else {
            // Corrección vertical
            const direction = playerHitbox.y < obstacle.y ? -1 : 1;
            return { x: 0, y: overlapY * direction };
        }
    }
    
    /**
     * Obtiene la normal de colisión
     * @param {Object} playerHitbox - Hitbox del jugador
     * @param {Object} obstacle - Obstáculo
     * @returns {Object} Vector normal {x, y}
     */
    getCollisionNormal(playerHitbox, obstacle) {
        const playerCenterX = playerHitbox.x + playerHitbox.width / 2;
        const playerCenterY = playerHitbox.y + playerHitbox.height / 2;
        const obstacleCenterX = obstacle.x + obstacle.width / 2;
        const obstacleCenterY = obstacle.y + obstacle.height / 2;
        
        const dx = playerCenterX - obstacleCenterX;
        const dy = playerCenterY - obstacleCenterY;
        
        // Normalizar
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) return { x: 0, y: -1 };
        
        return { x: dx / length, y: dy / length };
    }
    
    /**
     * Añade un objeto al spatial hash
     * @param {Object} object - Objeto a añadir
     * @param {string} id - ID único del objeto
     */
    addToSpatialHash(object, id) {
        if (!this.spatialHash.enabled) return;
        
        const gridX = Math.floor(object.x / this.spatialHash.gridSize);
        const gridY = Math.floor(object.y / this.spatialHash.gridSize);
        const key = `${gridX},${gridY}`;
        
        if (!this.spatialHash.grid.has(key)) {
            this.spatialHash.grid.set(key, []);
        }
        
        this.spatialHash.grid.get(key).push({ object, id });
    }
    
    /**
     * Obtiene objetos cercanos usando spatial hash
     * @param {Object} queryObject - Objeto de consulta
     * @returns {Array} Objetos cercanos
     */
    getNearbyObjects(queryObject) {
        if (!this.spatialHash.enabled) return [];
        
        const nearby = [];
        const gridSize = this.spatialHash.gridSize;
        
        // Verificar celdas adyacentes
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const gridX = Math.floor(queryObject.x / gridSize) + dx;
                const gridY = Math.floor(queryObject.y / gridSize) + dy;
                const key = `${gridX},${gridY}`;
                
                const cell = this.spatialHash.grid.get(key);
                if (cell) {
                    nearby.push(...cell);
                }
            }
        }
        
        return nearby;
    }
    
    /**
     * Limpia el spatial hash
     */
    clearSpatialHash() {
        if (this.spatialHash.enabled) {
            this.spatialHash.grid.clear();
        }
    }
    
    /**
     * Resetea el detector de colisiones
     */
    reset() {
        this.clearSpatialHash();
        
        // Resetear estadísticas
        this.stats.totalChecks = 0;
        this.stats.broadPhaseFiltered = 0;
        this.stats.narrowPhaseChecks = 0;
        this.stats.collisionsDetected = 0;
        this.stats.lastResetTime = Date.now();
        
        console.log('🔄 CollisionDetector reseteado');
    }
    
    /**
     * Obtiene estadísticas de performance
     * @returns {Object} Estadísticas de colisiones
     */
    getPerformanceStats() {
        const totalTime = Date.now() - this.stats.lastResetTime;
        const checksPerSecond = totalTime > 0 ? (this.stats.totalChecks / (totalTime / 1000)) : 0;
        
        return {
            totalChecks: this.stats.totalChecks,
            broadPhaseFiltered: this.stats.broadPhaseFiltered,
            narrowPhaseChecks: this.stats.narrowPhaseChecks,
            collisionsDetected: this.stats.collisionsDetected,
            checksPerSecond: Math.round(checksPerSecond),
            broadPhaseEfficiency: this.stats.totalChecks > 0 ? 
                (this.stats.broadPhaseFiltered / this.stats.totalChecks) * 100 : 0,
            spatialHashSize: this.spatialHash.grid.size
        };
    }
    
    /**
     * Obtiene información de debug
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            config: { ...this.collisionConfig },
            spatialHash: {
                enabled: this.spatialHash.enabled,
                gridSize: this.spatialHash.gridSize,
                cellCount: this.spatialHash.grid.size
            },
            broadPhase: { ...this.broadPhase },
            performance: this.getPerformanceStats()
        };
    }
    
    /**
     * Limpia recursos del detector de colisiones
     */
    destroy() {
        console.log('🧹 Destruyendo CollisionDetector...');
        
        // Limpiar spatial hash
        this.clearSpatialHash();
        
        this.isInitialized = false;
        
        console.log('✅ CollisionDetector destruido');
    }
}