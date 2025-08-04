/**
 * Gestor de obstáculos para Spikepulse
 * @module ObstacleManager
 */

export class ObstacleManager {
    /**
     * Crea una nueva instancia del gestor de obstáculos
     * @param {Object} config - Configuración de obstáculos
     * @param {EventBus} eventBus - Bus de eventos
     * @param {Object} worldBounds - Límites del mundo
     */
    constructor(config, eventBus, worldBounds) {
        this.config = config;
        this.eventBus = eventBus;
        this.worldBounds = worldBounds;
        this.isInitialized = false;
        
        // Configuración de obstáculos
        this.obstacleConfig = {
            spacing: config.spacing || { min: 150, max: 300 },
            types: config.types || ['spike', 'wall', 'moving', 'rotating'],
            colors: config.colors || {
                spike: '#FF6B6B',
                wall: '#666666',
                moving: '#9F7AEA',
                rotating: '#FF8C42'
            },
            difficulty: config.difficulty || {
                baseSpeed: 2,
                speedIncrease: 0.1,
                maxSpeed: 8,
                densityIncrease: 0.05
            }
        };
        
        // Lista de obstáculos activos
        this.obstacles = [];
        
        // Configuración de generación
        this.generation = {
            patterns: this.createObstaclePatterns(),
            lastPattern: null,
            patternStreak: 0,
            maxStreak: 3,
            seed: Date.now()
        };
        
        // Estado de dificultad
        this.currentDifficulty = 1.0;
        
        // Pool de objetos para optimización
        this.obstaclePool = {
            spike: [],
            wall: [],
            moving: [],
            rotating: []
        };
        
        console.log('🚧 ObstacleManager creado');
    }
    
    /**
     * Inicializa el gestor de obstáculos
     */
    async init() {
        try {
            console.log('🔧 Inicializando ObstacleManager...');
            
            // Inicializar pool de objetos
            this.initializeObjectPool();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ ObstacleManager inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando ObstacleManager:', error);
            throw error;
        }
    }
    
    /**
     * Inicializa el pool de objetos
     */
    initializeObjectPool() {
        const poolSize = 50;
        
        for (const type of this.obstacleConfig.types) {
            for (let i = 0; i < poolSize; i++) {
                this.obstaclePool[type].push(this.createObstacleObject(type));
            }
        }
        
        console.log('🏊 Pool de obstáculos inicializado');
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Escuchar eventos de colisión para efectos
        this.eventBus.on('collision:player-obstacle', this.handleObstacleCollision.bind(this));
        
        console.log('👂 Event listeners de ObstacleManager configurados');
    }
    
    /**
     * Crea patrones de obstáculos
     * @returns {Array} Array de patrones
     */
    createObstaclePatterns() {
        return [
            // Patrón simple - spikes individuales
            {
                name: 'single_spike',
                difficulty: 1,
                length: 100,
                generate: (startX, groundY) => [
                    { type: 'spike', x: startX + 50, y: groundY - 30, width: 30, height: 30 }
                ]
            },
            
            // Patrón de spikes dobles
            {
                name: 'double_spike',
                difficulty: 1.5,
                length: 150,
                generate: (startX, groundY) => [
                    { type: 'spike', x: startX + 30, y: groundY - 30, width: 30, height: 30 },
                    { type: 'spike', x: startX + 90, y: groundY - 30, width: 30, height: 30 }
                ]
            },
            
            // Patrón de pared
            {
                name: 'wall',
                difficulty: 2,
                length: 80,
                generate: (startX, groundY) => [
                    { type: 'wall', x: startX + 40, y: groundY - 100, width: 20, height: 100 }
                ]
            },
            
            // Patrón de obstáculo móvil
            {
                name: 'moving_spike',
                difficulty: 2.5,
                length: 200,
                generate: (startX, groundY) => [
                    { 
                        type: 'moving', 
                        x: startX + 100, 
                        y: groundY - 50, 
                        width: 30, 
                        height: 30,
                        moveRange: 80,
                        moveSpeed: 0.02,
                        moveOffset: 0
                    }
                ]
            },
            
            // Patrón de obstáculo rotatorio
            {
                name: 'rotating_blade',
                difficulty: 3,
                length: 120,
                generate: (startX, groundY) => [
                    { 
                        type: 'rotating', 
                        x: startX + 60, 
                        y: groundY - 60, 
                        width: 40, 
                        height: 40,
                        rotationSpeed: 0.05,
                        rotation: 0
                    }
                ]
            },
            
            // Patrón complejo - combinación
            {
                name: 'spike_wall_combo',
                difficulty: 2.8,
                length: 250,
                generate: (startX, groundY) => [
                    { type: 'spike', x: startX + 50, y: groundY - 30, width: 30, height: 30 },
                    { type: 'wall', x: startX + 150, y: groundY - 80, width: 20, height: 80 },
                    { type: 'spike', x: startX + 200, y: groundY - 30, width: 30, height: 30 }
                ]
            }
        ];
    }
    
    /**
     * Actualización con timestep fijo
     * @param {number} fixedDelta - Delta time fijo
     */
    fixedUpdate(fixedDelta) {
        if (!this.isInitialized) return;
        
        // Actualizar obstáculos móviles y rotatorios
        this.updateDynamicObstacles(fixedDelta);
    }
    
    /**
     * Actualiza obstáculos dinámicos
     * @param {number} deltaTime - Delta time
     */
    updateDynamicObstacles(deltaTime) {
        for (const obstacle of this.obstacles) {
            switch (obstacle.type) {
                case 'moving':
                    this.updateMovingObstacle(obstacle, deltaTime);
                    break;
                    
                case 'rotating':
                    this.updateRotatingObstacle(obstacle, deltaTime);
                    break;
            }
        }
    }
    
    /**
     * Actualiza un obstáculo móvil
     * @param {Object} obstacle - Obstáculo móvil
     * @param {number} deltaTime - Delta time
     */
    updateMovingObstacle(obstacle, deltaTime) {
        obstacle.moveOffset += obstacle.moveSpeed;
        
        // Calcular nueva posición
        const moveAmount = Math.sin(obstacle.moveOffset) * obstacle.moveRange;
        obstacle.currentY = obstacle.y + moveAmount;
        
        // Mantener dentro de los límites
        obstacle.currentY = Math.max(
            this.worldBounds.top,
            Math.min(this.worldBounds.bottom - obstacle.height, obstacle.currentY)
        );
    }
    
    /**
     * Actualiza un obstáculo rotatorio
     * @param {Object} obstacle - Obstáculo rotatorio
     * @param {number} deltaTime - Delta time
     */
    updateRotatingObstacle(obstacle, deltaTime) {
        obstacle.rotation += obstacle.rotationSpeed;
        
        // Normalizar rotación
        if (obstacle.rotation > Math.PI * 2) {
            obstacle.rotation -= Math.PI * 2;
        }
    }
    
    /**
     * Genera obstáculos en un rango
     * @param {number} startX - Posición X inicial
     * @param {number} endX - Posición X final
     */
    generateObstacles(startX, endX) {
        const groundY = 370; // Debería venir de la configuración del mundo
        let currentX = startX;
        
        while (currentX < endX) {
            // Seleccionar patrón basado en dificultad
            const pattern = this.selectPattern();
            
            // Generar obstáculos del patrón
            const patternObstacles = pattern.generate(currentX, groundY);
            
            // Añadir obstáculos al mundo
            for (const obstacleData of patternObstacles) {
                const obstacle = this.createObstacle(obstacleData);
                this.obstacles.push(obstacle);
            }
            
            // Avanzar posición
            currentX += pattern.length + this.getSpacing();
            
            // Actualizar streak del patrón
            this.updatePatternStreak(pattern);
        }
    }
    
    /**
     * Selecciona un patrón de obstáculos basado en dificultad
     * @returns {Object} Patrón seleccionado
     */
    selectPattern() {
        // Filtrar patrones por dificultad
        const availablePatterns = this.generation.patterns.filter(
            pattern => pattern.difficulty <= this.currentDifficulty
        );
        
        // Evitar repetir el mismo patrón muchas veces
        let validPatterns = availablePatterns;
        if (this.generation.lastPattern && this.generation.patternStreak >= this.generation.maxStreak) {
            validPatterns = availablePatterns.filter(
                pattern => pattern.name !== this.generation.lastPattern.name
            );
        }
        
        // Seleccionar patrón aleatorio
        const selectedPattern = validPatterns[Math.floor(Math.random() * validPatterns.length)];
        
        return selectedPattern || availablePatterns[0];
    }
    
    /**
     * Obtiene el espaciado entre obstáculos
     * @returns {number} Espaciado en píxeles
     */
    getSpacing() {
        const baseSpacing = this.obstacleConfig.spacing.min + 
            Math.random() * (this.obstacleConfig.spacing.max - this.obstacleConfig.spacing.min);
        
        // Reducir espaciado con la dificultad
        const difficultyMultiplier = Math.max(0.5, 1 - (this.currentDifficulty - 1) * 0.2);
        
        return baseSpacing * difficultyMultiplier;
    }
    
    /**
     * Actualiza el streak del patrón
     * @param {Object} pattern - Patrón usado
     */
    updatePatternStreak(pattern) {
        if (this.generation.lastPattern && this.generation.lastPattern.name === pattern.name) {
            this.generation.patternStreak++;
        } else {
            this.generation.patternStreak = 1;
        }
        
        this.generation.lastPattern = pattern;
    }
    
    /**
     * Crea un obstáculo desde datos
     * @param {Object} data - Datos del obstáculo
     * @returns {Object} Obstáculo creado
     */
    createObstacle(data) {
        // Intentar obtener del pool
        let obstacle = this.getFromPool(data.type);
        
        if (!obstacle) {
            obstacle = this.createObstacleObject(data.type);
        }
        
        // Configurar propiedades
        Object.assign(obstacle, data);
        
        // Propiedades específicas por tipo
        switch (data.type) {
            case 'moving':
                obstacle.currentY = obstacle.y;
                obstacle.moveOffset = data.moveOffset || 0;
                break;
                
            case 'rotating':
                obstacle.rotation = data.rotation || 0;
                break;
        }
        
        obstacle.active = true;
        obstacle.color = this.obstacleConfig.colors[data.type];
        
        return obstacle;
    }
    
    /**
     * Crea un objeto obstáculo básico
     * @param {string} type - Tipo de obstáculo
     * @returns {Object} Objeto obstáculo
     */
    createObstacleObject(type) {
        return {
            type,
            x: 0,
            y: 0,
            width: 30,
            height: 30,
            active: false,
            color: this.obstacleConfig.colors[type] || '#FF6B6B',
            // Propiedades específicas se añaden según el tipo
        };
    }
    
    /**
     * Obtiene un obstáculo del pool
     * @param {string} type - Tipo de obstáculo
     * @returns {Object|null} Obstáculo del pool o null
     */
    getFromPool(type) {
        const pool = this.obstaclePool[type];
        if (pool && pool.length > 0) {
            return pool.pop();
        }
        return null;
    }
    
    /**
     * Devuelve un obstáculo al pool
     * @param {Object} obstacle - Obstáculo a devolver
     */
    returnToPool(obstacle) {
        obstacle.active = false;
        
        const pool = this.obstaclePool[obstacle.type];
        if (pool) {
            pool.push(obstacle);
        }
    }
    
    /**
     * Remueve un obstáculo
     * @param {Object} obstacle - Obstáculo a remover
     */
    removeObstacle(obstacle) {
        const index = this.obstacles.indexOf(obstacle);
        if (index > -1) {
            this.obstacles.splice(index, 1);
            this.returnToPool(obstacle);
        }
    }
    
    /**
     * Obtiene todos los obstáculos activos
     * @returns {Array} Array de obstáculos
     */
    getObstacles() {
        return this.obstacles.filter(obstacle => obstacle.active);
    }
    
    /**
     * Obtiene obstáculos en un rango
     * @param {number} minX - X mínima
     * @param {number} maxX - X máxima
     * @returns {Array} Obstáculos en el rango
     */
    getObstaclesInRange(minX, maxX) {
        return this.obstacles.filter(obstacle => 
            obstacle.active && 
            obstacle.x >= minX && 
            obstacle.x <= maxX
        );
    }
    
    /**
     * Obtiene objetos de renderizado
     * @returns {Array} Objetos de renderizado
     */
    getRenderObjects() {
        return this.obstacles
            .filter(obstacle => obstacle.active)
            .map(obstacle => ({
                layer: 'obstacles',
                zIndex: 0,
                render: (ctx) => this.renderObstacle(ctx, obstacle)
            }));
    }
    
    /**
     * Renderiza un obstáculo
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} obstacle - Obstáculo a renderizar
     */
    renderObstacle(ctx, obstacle) {
        ctx.save();
        
        // Obtener posición de renderizado
        const renderY = obstacle.type === 'moving' ? obstacle.currentY : obstacle.y;
        
        ctx.translate(obstacle.x + obstacle.width / 2, renderY + obstacle.height / 2);
        
        // Aplicar rotación si es necesario
        if (obstacle.type === 'rotating') {
            ctx.rotate(obstacle.rotation);
        }
        
        // Renderizar según tipo
        switch (obstacle.type) {
            case 'spike':
                this.renderSpike(ctx, obstacle);
                break;
                
            case 'wall':
                this.renderWall(ctx, obstacle);
                break;
                
            case 'moving':
                this.renderMovingObstacle(ctx, obstacle);
                break;
                
            case 'rotating':
                this.renderRotatingObstacle(ctx, obstacle);
                break;
        }
        
        ctx.restore();
    }
    
    /**
     * Renderiza un spike
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} obstacle - Obstáculo spike
     */
    renderSpike(ctx, obstacle) {
        const halfWidth = obstacle.width / 2;
        const halfHeight = obstacle.height / 2;
        
        ctx.fillStyle = obstacle.color;
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth = 2;
        
        // Dibujar forma de spike (triángulo)
        ctx.beginPath();
        ctx.moveTo(0, -halfHeight);
        ctx.lineTo(-halfWidth, halfHeight);
        ctx.lineTo(halfWidth, halfHeight);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    /**
     * Renderiza una pared
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} obstacle - Obstáculo pared
     */
    renderWall(ctx, obstacle) {
        const halfWidth = obstacle.width / 2;
        const halfHeight = obstacle.height / 2;
        
        ctx.fillStyle = obstacle.color;
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 2;
        
        // Dibujar rectángulo
        ctx.fillRect(-halfWidth, -halfHeight, obstacle.width, obstacle.height);
        ctx.strokeRect(-halfWidth, -halfHeight, obstacle.width, obstacle.height);
        
        // Añadir detalles de textura
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const y = -halfHeight + (obstacle.height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(-halfWidth, y);
            ctx.lineTo(halfWidth, y);
            ctx.stroke();
        }
    }
    
    /**
     * Renderiza un obstáculo móvil
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} obstacle - Obstáculo móvil
     */
    renderMovingObstacle(ctx, obstacle) {
        const halfWidth = obstacle.width / 2;
        const halfHeight = obstacle.height / 2;
        
        ctx.fillStyle = obstacle.color;
        ctx.strokeStyle = '#7C3AED';
        ctx.lineWidth = 2;
        
        // Dibujar diamante
        ctx.beginPath();
        ctx.moveTo(0, -halfHeight);
        ctx.lineTo(halfWidth, 0);
        ctx.lineTo(0, halfHeight);
        ctx.lineTo(-halfWidth, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Añadir efecto de movimiento
        ctx.strokeStyle = 'rgba(159, 122, 234, 0.5)';
        ctx.lineWidth = 4;
        ctx.stroke();
    }
    
    /**
     * Renderiza un obstáculo rotatorio
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} obstacle - Obstáculo rotatorio
     */
    renderRotatingObstacle(ctx, obstacle) {
        const radius = obstacle.width / 2;
        
        ctx.fillStyle = obstacle.color;
        ctx.strokeStyle = '#EA580C';
        ctx.lineWidth = 2;
        
        // Dibujar círculo central
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Dibujar cuchillas
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            const x1 = Math.cos(angle) * radius * 0.3;
            const y1 = Math.sin(angle) * radius * 0.3;
            const x2 = Math.cos(angle) * radius;
            const y2 = Math.sin(angle) * radius;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineWidth = 6;
            ctx.stroke();
        }
    }
    
    /**
     * Maneja colisiones con obstáculos
     * @param {Object} data - Datos de la colisión
     */
    handleObstacleCollision(data) {
        const obstacle = data.objectB;
        
        // Crear efecto de colisión
        this.createCollisionEffect(obstacle, data.position);
        
        console.log(`💥 Colisión con obstáculo tipo: ${obstacle.type}`);
    }
    
    /**
     * Crea efecto visual de colisión
     * @param {Object} obstacle - Obstáculo colisionado
     * @param {Object} position - Posición de la colisión
     */
    createCollisionEffect(obstacle, position) {
        // Crear partículas de colisión
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10;
            const speed = 3 + Math.random() * 2;
            
            this.eventBus.emit('effects:create-particle', {
                x: position.x,
                y: position.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 400,
                color: obstacle.color,
                size: 2 + Math.random() * 2
            });
        }
    }
    
    /**
     * Establece la dificultad
     * @param {number} difficulty - Nueva dificultad
     */
    setDifficulty(difficulty) {
        this.currentDifficulty = Math.max(1.0, Math.min(3.0, difficulty));
        console.log(`⚙️ Dificultad de obstáculos: ${this.currentDifficulty}`);
    }
    
    /**
     * Resetea el gestor de obstáculos
     */
    reset() {
        // Devolver todos los obstáculos al pool
        for (const obstacle of this.obstacles) {
            this.returnToPool(obstacle);
        }
        
        this.obstacles = [];
        this.currentDifficulty = 1.0;
        this.generation.lastPattern = null;
        this.generation.patternStreak = 0;
        
        console.log('🔄 ObstacleManager reseteado');
    }
    
    /**
     * Obtiene información de debug
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            obstacleCount: this.obstacles.length,
            activeObstacles: this.getObstacles().length,
            currentDifficulty: this.currentDifficulty,
            generation: { ...this.generation },
            poolSizes: Object.fromEntries(
                Object.entries(this.obstaclePool).map(([type, pool]) => [type, pool.length])
            )
        };
    }
    
    /**
     * Limpia recursos del gestor de obstáculos
     */
    destroy() {
        console.log('🧹 Destruyendo ObstacleManager...');
        
        // Limpiar event listeners
        this.eventBus.off('*', this);
        
        // Limpiar obstáculos
        this.obstacles = [];
        
        // Limpiar pools
        for (const type in this.obstaclePool) {
            this.obstaclePool[type] = [];
        }
        
        this.isInitialized = false;
        
        console.log('✅ ObstacleManager destruido');
    }
}