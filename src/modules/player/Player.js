/**
 * Módulo del jugador principal de Spikepulse
 * @module Player
 */

import { PlayerPhysics } from './PlayerPhysics.js';
import { PlayerRenderer } from './PlayerRenderer.js';
import { PlayerAbilities } from './PlayerAbilities.js';
import { getPhysicsConfig } from '../../config/index.js';

export class Player {
    /**
     * Crea una nueva instancia del jugador
     * @param {Object} config - Configuración del juego
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isInitialized = false;
        
        // Estado del jugador
        this.state = {
            position: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            acceleration: { x: 0, y: 0 },
            size: { width: 30, height: 30 },
            rotation: 0,
            scale: { x: 1, y: 1 },
            isAlive: true,
            isVisible: true,
            invulnerable: false,
            invulnerabilityTime: 0
        };
        
        // Estado de física
        this.physics = {
            onGround: false,
            onCeiling: false,
            onWall: false,
            gravityInverted: false,
            lastGroundTime: 0,
            lastWallTime: 0,
            groundNormal: { x: 0, y: -1 },
            wallNormal: { x: 0, y: 0 }
        };
        
        // Hitbox del jugador
        this.hitbox = {
            offset: { x: 3, y: 3 },
            size: { width: 24, height: 24 }
        };
        
        // Sistemas del jugador
        this.playerPhysics = null;
        this.playerRenderer = null;
        this.playerAbilities = null;
        
        // Efectos visuales
        this.effects = {
            trail: [],
            particles: [],
            screenShake: { intensity: 0, duration: 0, time: 0 }
        };
        
        // Input state
        this.input = {
            jump: false,
            dash: false,
            gravityToggle: false,
            moveLeft: false,
            moveRight: false,
            jumpPressed: false,
            dashPressed: false,
            gravityPressed: false
        };
        
        console.log('👤 Player creado');
        this.init();
    }
    
    /**
     * Inicializa el jugador
     */
    async init() {
        try {
            // Cargar configuración de física
            const physicsConfig = await getPhysicsConfig();
            
            // Configurar posición inicial
            const startPos = this.config.player?.startPosition || { x: 100, y: 300 };
            this.state.position = { ...startPos };
            
            // Configurar tamaño
            const size = this.config.player?.visual?.size || { width: 30, height: 30 };
            this.state.size = { ...size };
            
            // Configurar hitbox
            const hitboxConfig = physicsConfig.collision?.playerHitbox;
            if (hitboxConfig) {
                this.hitbox.size.width = hitboxConfig.width;
                this.hitbox.size.height = hitboxConfig.height;
                this.hitbox.offset.x = hitboxConfig.offsetX;
                this.hitbox.offset.y = hitboxConfig.offsetY;
            }
            
            // Inicializar sistemas
            this.playerPhysics = new PlayerPhysics(this, physicsConfig, this.eventBus);
            this.playerRenderer = new PlayerRenderer(this, this.config, this.eventBus);
            this.playerAbilities = new PlayerAbilities(this, physicsConfig, this.eventBus);
            
            // Configurar event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ Player inicializado');
            
            // Emitir evento de inicialización
            this.eventBus.emit('player:initialized', {
                position: this.state.position,
                size: this.state.size
            });
            
        } catch (error) {
            console.error('❌ Error inicializando Player:', error);
            throw error;
        }
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Input events
        this.eventBus.on('input:jump', this.handleJumpInput.bind(this));
        this.eventBus.on('input:dash', this.handleDashInput.bind(this));
        this.eventBus.on('input:gravity-toggle', this.handleGravityToggleInput.bind(this));
        this.eventBus.on('input:move-left', this.handleMoveLeftInput.bind(this));
        this.eventBus.on('input:move-right', this.handleMoveRightInput.bind(this));
        
        // Game events
        this.eventBus.on('game:reset', this.reset.bind(this));
        this.eventBus.on('collision:player-obstacle', this.handleObstacleCollision.bind(this));
        this.eventBus.on('collision:player-ground', this.handleGroundCollision.bind(this));
        this.eventBus.on('collision:player-ceiling', this.handleCeilingCollision.bind(this));
        this.eventBus.on('collision:player-wall', this.handleWallCollision.bind(this));
        
        // State events
        this.eventBus.on('state:changed', this.handleStateChange.bind(this));
        
        console.log('👂 Player event listeners configurados');
    }
    
    /**
     * Actualización con timestep fijo para física
     * @param {number} fixedDelta - Delta time fijo
     */
    fixedUpdate(fixedDelta) {
        if (!this.isInitialized || !this.state.isAlive) return;
        
        // Actualizar física
        this.playerPhysics.fixedUpdate(fixedDelta);
        
        // Actualizar habilidades
        this.playerAbilities.fixedUpdate(fixedDelta);
        
        // Actualizar efectos
        this.updateEffects(fixedDelta);
        
        // Verificar límites del mundo
        this.checkWorldBounds();
        
        // Emitir evento de actualización
        this.eventBus.emit('player:updated', {
            position: this.state.position,
            velocity: this.state.velocity,
            physics: this.physics
        });
    }
    
    /**
     * Actualización con timestep variable para interpolación
     * @param {number} deltaTime - Delta time variable
     * @param {number} interpolation - Factor de interpolación
     */
    update(deltaTime, interpolation) {
        if (!this.isInitialized || !this.state.isAlive) return;
        
        // Actualizar sistemas con interpolación
        this.playerPhysics.update(deltaTime, interpolation);
        this.playerRenderer.update(deltaTime, interpolation);
        this.playerAbilities.update(deltaTime, interpolation);
        
        // Actualizar invulnerabilidad
        this.updateInvulnerability(deltaTime);
        
        // Limpiar input flags
        this.clearInputFlags();
    }
    
    /**
     * Actualiza efectos visuales
     * @param {number} deltaTime - Delta time
     */
    updateEffects(deltaTime) {
        // Actualizar trail
        this.updateTrail(deltaTime);
        
        // Actualizar partículas
        this.updateParticles(deltaTime);
        
        // Actualizar screen shake
        this.updateScreenShake(deltaTime);
    }
    
    /**
     * Actualiza el trail del jugador
     * @param {number} deltaTime - Delta time
     */
    updateTrail(deltaTime) {
        // Añadir nueva posición al trail si se está moviendo
        if (Math.abs(this.state.velocity.x) > 0.1 || Math.abs(this.state.velocity.y) > 0.1) {
            this.effects.trail.push({
                x: this.state.position.x + this.state.size.width / 2,
                y: this.state.position.y + this.state.size.height / 2,
                alpha: 1.0,
                time: 0
            });
        }
        
        // Actualizar y limpiar trail
        const maxTrailLength = 10;
        const trailFadeSpeed = 0.05;
        
        this.effects.trail = this.effects.trail.filter(point => {
            point.time += deltaTime;
            point.alpha -= trailFadeSpeed;
            return point.alpha > 0 && this.effects.trail.length <= maxTrailLength;
        });
        
        // Mantener longitud máxima
        if (this.effects.trail.length > maxTrailLength) {
            this.effects.trail = this.effects.trail.slice(-maxTrailLength);
        }
    }
    
    /**
     * Actualiza partículas
     * @param {number} deltaTime - Delta time
     */
    updateParticles(deltaTime) {
        this.effects.particles = this.effects.particles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            particle.alpha = Math.max(0, particle.life / particle.maxLife);
            return particle.life > 0;
        });
    }
    
    /**
     * Actualiza screen shake
     * @param {number} deltaTime - Delta time
     */
    updateScreenShake(deltaTime) {
        if (this.effects.screenShake.duration > 0) {
            this.effects.screenShake.time += deltaTime;
            this.effects.screenShake.duration -= deltaTime;
            
            if (this.effects.screenShake.duration <= 0) {
                this.effects.screenShake.intensity = 0;
                this.effects.screenShake.time = 0;
            }
        }
    }
    
    /**
     * Actualiza invulnerabilidad
     * @param {number} deltaTime - Delta time
     */
    updateInvulnerability(deltaTime) {
        if (this.state.invulnerable) {
            this.state.invulnerabilityTime -= deltaTime;
            if (this.state.invulnerabilityTime <= 0) {
                this.state.invulnerable = false;
                this.state.invulnerabilityTime = 0;
            }
        }
    }
    
    /**
     * Limpia flags de input
     */
    clearInputFlags() {
        this.input.jumpPressed = false;
        this.input.dashPressed = false;
        this.input.gravityPressed = false;
    }
    
    /**
     * Verifica límites del mundo
     */
    checkWorldBounds() {
        const bounds = this.config.world?.bounds;
        if (!bounds) return;
        
        // Verificar límites horizontales
        if (this.state.position.x < bounds.left) {
            this.state.position.x = bounds.left;
            this.state.velocity.x = Math.max(0, this.state.velocity.x);
        } else if (this.state.position.x + this.state.size.width > bounds.right) {
            this.state.position.x = bounds.right - this.state.size.width;
            this.state.velocity.x = Math.min(0, this.state.velocity.x);
        }
        
        // Verificar límites verticales (muerte)
        if (this.state.position.y > bounds.bottom || this.state.position.y + this.state.size.height < bounds.top) {
            this.die('out-of-bounds');
        }
    }
    
    /**
     * Renderiza el jugador
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    render(ctx) {
        if (!this.isInitialized || !this.state.isVisible) return;
        
        this.playerRenderer.render(ctx);
    }
    
    /**
     * Obtiene objetos de renderizado para el sistema de capas
     * @returns {Array} Objetos de renderizado
     */
    getRenderObjects() {
        if (!this.isInitialized || !this.state.isVisible) return [];
        
        return this.playerRenderer.getRenderObjects();
    }    

    // ===== MANEJO DE INPUT =====
    
    /**
     * Maneja input de salto
     * @param {Object} data - Datos del input
     */
    handleJumpInput(data) {
        this.input.jump = data.pressed;
        if (data.pressed && !this.input.jumpPressed) {
            this.input.jumpPressed = true;
            this.playerAbilities.jump();
        }
    }
    
    /**
     * Maneja input de dash
     * @param {Object} data - Datos del input
     */
    handleDashInput(data) {
        this.input.dash = data.pressed;
        if (data.pressed && !this.input.dashPressed) {
            this.input.dashPressed = true;
            this.playerAbilities.dash();
        }
    }
    
    /**
     * Maneja input de cambio de gravedad
     * @param {Object} data - Datos del input
     */
    handleGravityToggleInput(data) {
        this.input.gravityToggle = data.pressed;
        if (data.pressed && !this.input.gravityPressed) {
            this.input.gravityPressed = true;
            this.playerAbilities.toggleGravity();
        }
    }
    
    /**
     * Maneja input de movimiento izquierda
     * @param {Object} data - Datos del input
     */
    handleMoveLeftInput(data) {
        this.input.moveLeft = data.pressed;
    }
    
    /**
     * Maneja input de movimiento derecha
     * @param {Object} data - Datos del input
     */
    handleMoveRightInput(data) {
        this.input.moveRight = data.pressed;
    }
    
    // ===== MANEJO DE COLISIONES =====
    
    /**
     * Maneja colisión con obstáculo
     * @param {Object} data - Datos de la colisión
     */
    handleObstacleCollision(data) {
        if (this.state.invulnerable) return;
        
        console.log('💥 Player colisionó con obstáculo');
        this.die('obstacle-collision');
    }
    
    /**
     * Maneja colisión con el suelo
     * @param {Object} data - Datos de la colisión
     */
    handleGroundCollision(data) {
        this.physics.onGround = true;
        this.physics.lastGroundTime = Date.now();
        this.physics.groundNormal = data.normal || { x: 0, y: -1 };
        
        // Resetear saltos disponibles
        this.playerAbilities.resetJumps();
        
        // Crear partículas de aterrizaje si la velocidad es alta
        if (Math.abs(this.state.velocity.y) > 5) {
            this.createLandingParticles();
        }
        
        // Ajustar posición para evitar hundimiento
        if (data.correction) {
            this.state.position.y += data.correction.y;
        }
    }
    
    /**
     * Maneja colisión con el techo
     * @param {Object} data - Datos de la colisión
     */
    handleCeilingCollision(data) {
        this.physics.onCeiling = true;
        
        // Detener velocidad vertical hacia arriba
        if (this.state.velocity.y < 0) {
            this.state.velocity.y = 0;
        }
        
        // Ajustar posición
        if (data.correction) {
            this.state.position.y += data.correction.y;
        }
    }
    
    /**
     * Maneja colisión con pared
     * @param {Object} data - Datos de la colisión
     */
    handleWallCollision(data) {
        this.physics.onWall = true;
        this.physics.lastWallTime = Date.now();
        this.physics.wallNormal = data.normal || { x: 1, y: 0 };
        
        // Detener velocidad horizontal hacia la pared
        if ((data.normal.x > 0 && this.state.velocity.x < 0) ||
            (data.normal.x < 0 && this.state.velocity.x > 0)) {
            this.state.velocity.x = 0;
        }
        
        // Ajustar posición
        if (data.correction) {
            this.state.position.x += data.correction.x;
        }
    }
    
    /**
     * Maneja cambios de estado del juego
     * @param {Object} data - Datos del cambio de estado
     */
    handleStateChange(data) {
        const { to, from } = data;
        
        switch (to) {
            case 'playing':
                if (from === 'menu' || from === 'gameOver') {
                    this.reset();
                }
                break;
                
            case 'paused':
                // El jugador se pausa automáticamente con el game loop
                break;
                
            case 'gameOver':
                this.state.isAlive = false;
                break;
        }
    }
    
    // ===== MÉTODOS DE ACCIÓN =====
    
    /**
     * Mata al jugador
     * @param {string} cause - Causa de la muerte
     */
    die(cause = 'unknown') {
        if (!this.state.isAlive) return;
        
        this.state.isAlive = false;
        
        console.log(`💀 Player murió por: ${cause}`);
        
        // Crear efecto de muerte
        this.createDeathEffect();
        
        // Emitir evento de muerte
        this.eventBus.emit('player:died', {
            cause,
            position: this.state.position,
            velocity: this.state.velocity
        });
        
        // Cambiar estado del juego
        this.eventBus.emit('ui:change-state', { state: 'gameOver' });
    }
    
    /**
     * Resetea el jugador al estado inicial
     */
    reset() {
        console.log('🔄 Reseteando Player');
        
        // Resetear posición
        const startPos = this.config.player?.startPosition || { x: 100, y: 300 };
        this.state.position = { ...startPos };
        
        // Resetear física
        this.state.velocity = { x: 0, y: 0 };
        this.state.acceleration = { x: 0, y: 0 };
        this.state.rotation = 0;
        this.state.scale = { x: 1, y: 1 };
        
        // Resetear estado
        this.state.isAlive = true;
        this.state.isVisible = true;
        this.state.invulnerable = false;
        this.state.invulnerabilityTime = 0;
        
        // Resetear física
        this.physics.onGround = false;
        this.physics.onCeiling = false;
        this.physics.onWall = false;
        this.physics.gravityInverted = false;
        this.physics.lastGroundTime = 0;
        this.physics.lastWallTime = 0;
        
        // Resetear efectos
        this.effects.trail = [];
        this.effects.particles = [];
        this.effects.screenShake = { intensity: 0, duration: 0, time: 0 };
        
        // Resetear input
        this.input = {
            jump: false,
            dash: false,
            gravityToggle: false,
            moveLeft: false,
            moveRight: false,
            jumpPressed: false,
            dashPressed: false,
            gravityPressed: false
        };
        
        // Resetear sistemas
        if (this.playerPhysics) this.playerPhysics.reset();
        if (this.playerRenderer) this.playerRenderer.reset();
        if (this.playerAbilities) this.playerAbilities.reset();
        
        // Emitir evento de reset
        this.eventBus.emit('player:reset', {
            position: this.state.position
        });
    }
    
    /**
     * Hace al jugador invulnerable temporalmente
     * @param {number} duration - Duración en ms
     */
    makeInvulnerable(duration = 1000) {
        this.state.invulnerable = true;
        this.state.invulnerabilityTime = duration;
        
        console.log(`🛡️ Player invulnerable por ${duration}ms`);
    }
    
    // ===== EFECTOS VISUALES =====
    
    /**
     * Crea partículas de aterrizaje
     */
    createLandingParticles() {
        const particleCount = 5;
        const baseX = this.state.position.x + this.state.size.width / 2;
        const baseY = this.state.position.y + this.state.size.height;
        
        for (let i = 0; i < particleCount; i++) {
            this.effects.particles.push({
                x: baseX + (Math.random() - 0.5) * this.state.size.width,
                y: baseY,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 3,
                life: 500 + Math.random() * 300,
                maxLife: 500 + Math.random() * 300,
                alpha: 1,
                color: '#FFD700',
                size: 2 + Math.random() * 2
            });
        }
    }
    
    /**
     * Crea efecto de muerte
     */
    createDeathEffect() {
        // Screen shake
        this.effects.screenShake = {
            intensity: 8,
            duration: 500,
            time: 0
        };
        
        // Partículas de explosión
        const particleCount = 15;
        const baseX = this.state.position.x + this.state.size.width / 2;
        const baseY = this.state.position.y + this.state.size.height / 2;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 3 + Math.random() * 4;
            
            this.effects.particles.push({
                x: baseX,
                y: baseY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 800 + Math.random() * 400,
                maxLife: 800 + Math.random() * 400,
                alpha: 1,
                color: '#FF6B6B',
                size: 3 + Math.random() * 3
            });
        }
        
        // Emitir evento de screen shake
        this.eventBus.emit('camera:shake', {
            intensity: this.effects.screenShake.intensity,
            duration: this.effects.screenShake.duration
        });
    }
    
    // ===== GETTERS Y UTILIDADES =====
    
    /**
     * Obtiene la hitbox actual del jugador
     * @returns {Object} Hitbox con posición y tamaño
     */
    getHitbox() {
        return {
            x: this.state.position.x + this.hitbox.offset.x,
            y: this.state.position.y + this.hitbox.offset.y,
            width: this.hitbox.size.width,
            height: this.hitbox.size.height
        };
    }
    
    /**
     * Obtiene el centro del jugador
     * @returns {Object} Posición del centro
     */
    getCenter() {
        return {
            x: this.state.position.x + this.state.size.width / 2,
            y: this.state.position.y + this.state.size.height / 2
        };
    }
    
    /**
     * Obtiene información de debug del jugador
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            state: { ...this.state },
            physics: { ...this.physics },
            input: { ...this.input },
            hitbox: this.getHitbox(),
            center: this.getCenter(),
            effects: {
                trailLength: this.effects.trail.length,
                particleCount: this.effects.particles.length,
                screenShake: this.effects.screenShake.intensity > 0
            },
            abilities: this.playerAbilities ? this.playerAbilities.getDebugInfo() : null
        };
    }
    
    /**
     * Obtiene el estado actual del jugador
     * @returns {Object} Estado del jugador
     */
    getState() {
        return {
            position: { ...this.state.position },
            velocity: { ...this.state.velocity },
            isAlive: this.state.isAlive,
            physics: { ...this.physics },
            abilities: this.playerAbilities ? this.playerAbilities.getState() : null
        };
    }
    
    /**
     * Limpia recursos del jugador
     */
    destroy() {
        console.log('🧹 Destruyendo Player...');
        
        // Limpiar event listeners
        this.eventBus.off('*', this);
        
        // Destruir sistemas
        if (this.playerPhysics) {
            this.playerPhysics.destroy();
            this.playerPhysics = null;
        }
        
        if (this.playerRenderer) {
            this.playerRenderer.destroy();
            this.playerRenderer = null;
        }
        
        if (this.playerAbilities) {
            this.playerAbilities.destroy();
            this.playerAbilities = null;
        }
        
        // Limpiar efectos
        this.effects.trail = [];
        this.effects.particles = [];
        
        this.isInitialized = false;
        
        console.log('✅ Player destruido');
    }
}