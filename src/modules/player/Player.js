/**
 * Player - Módulo principal del jugador con física modular
 * @module Player
 */

import { PlayerPhysics } from './PlayerPhysics.js';
import { PlayerAbilities } from './PlayerAbilities.js';
import { PlayerRenderer } from './PlayerRenderer.js';
import { CollisionDetection } from '../../utils/CollisionDetection.js';
import { SPANISH_TEXT } from '../../config/SpanishText.js';

export class Player {
    /**
     * Crea una nueva instancia del Player
     * @param {Object} config - Configuración del jugador
     * @param {EventBus} eventBus - Bus de eventos para comunicación
     */
    constructor(config, eventBus) {
        this.config = config.player || {};
        this.eventBus = eventBus;
        this.isInitialized = false;
        this.isActive = false;
        
        // Posición y estado básico
        this.position = { 
            x: this.config.startPosition?.x || 100, 
            y: this.config.startPosition?.y || 300 
        };
        this.size = { 
            width: this.config.size?.width || 30, 
            height: this.config.size?.height || 30 
        };
        
        // Módulos especializados
        this.physics = new PlayerPhysics(this.config.physics || {}, this.eventBus);
        this.abilities = new PlayerAbilities(this.config.abilities || {}, this.eventBus);
        this.renderer = new PlayerRenderer(this.config.visual || {}, this.eventBus);
        
        // Estado del jugador
        this.state = {
            isGrounded: false,
            isDashing: false,
            isInverted: false,
            isAlive: true,
            lastGroundTime: 0
        };
        
        // Estadísticas del jugador
        this.stats = {
            distance: 0,
            jumps: 0,
            dashes: 0,
            timeAlive: 0
        };
        
        // Hitbox para colisiones
        this.hitbox = {
            x: this.position.x,
            y: this.position.y,
            width: this.size.width,
            height: this.size.height
        };
        
        console.log('[Player] Instancia creada');
    }

    /**
     * Inicializar el módulo del jugador
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {EventBus} eventBus - Bus de eventos
     * @param {Object} config - Configuración del juego
     */
    init(ctx, eventBus, config) {
        if (this.isInitialized) {
            console.warn('[Player] Ya está inicializado');
            return;
        }

        // Inicializar módulos especializados
        this.physics.init(this.position, this.size);
        this.abilities.init();
        this.renderer.init(ctx);
        
        // Configurar listeners de eventos
        this.setupEventListeners();
        
        // Resetear posición inicial
        this.resetPosition();
        
        this.isInitialized = true;
        this.isActive = true;
        
        console.log('[Player] Inicializado correctamente');
        this.eventBus.emit('player:initialized', { position: this.position });
    }

    /**
     * Configurar listeners de eventos
     * @private
     */
    setupEventListeners() {
        // Eventos de entrada del usuario
        this.eventBus.on('input:jump', this.handleJumpInput, this);
        this.eventBus.on('input:dash', this.handleDashInput, this);
        this.eventBus.on('input:gravity', this.handleGravityInput, this);
        
        // Eventos del juego
        this.eventBus.on('game:start', this.handleGameStart, this);
        this.eventBus.on('game:stop', this.handleGameStop, this);
        this.eventBus.on('game:reset', this.handleGameReset, this);
        
        // Eventos de colisión
        this.eventBus.on('collision:ground', this.handleGroundCollision, this);
        this.eventBus.on('collision:obstacle', this.handleObstacleCollision, this);
        this.eventBus.on('collision:ceiling', this.handleCeilingCollision, this);
        
        // Eventos de estado
        this.eventBus.on('state:change', this.handleStateChange, this);
        
        console.log('[Player] Event listeners configurados');
    }

    /**
     * Actualizar el jugador
     * @param {number} deltaTime - Tiempo transcurrido desde la última actualización
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    update(deltaTime, ctx) {
        if (!this.isInitialized || !this.isActive) {
            return;
        }

        // Actualizar estadísticas
        this.updateStats(deltaTime);
        
        // Actualizar física
        this.physics.update(deltaTime, this.position, this.state);
        
        // Actualizar habilidades
        this.abilities.update(deltaTime, this.state);
        
        // Verificar entradas buffereadas
        this.checkBufferedInputs();
        
        // Actualizar hitbox
        this.updateHitbox();
        
        // Verificar límites del mundo
        this.checkWorldBounds();
        
        // Emitir evento de actualización
        this.eventBus.emit('player:update', {
            position: this.position,
            velocity: this.physics.velocity,
            state: this.state,
            stats: this.stats
        });
    }

    /**
     * Renderizar el jugador
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    render(ctx) {
        if (!this.isInitialized || !this.isActive) {
            return;
        }

        // Renderizar usando el módulo de renderizado
        this.renderer.render(ctx, this.position, this.size, this.state, this.abilities.getState());
    }

    /**
     * Actualizar estadísticas del jugador
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updateStats(deltaTime) {
        if (this.state.isAlive) {
            this.stats.timeAlive += deltaTime;
            // La distancia se actualiza basada en el movimiento del mundo
        }
    }

    /**
     * Actualizar hitbox para colisiones
     * @private
     */
    updateHitbox() {
        this.hitbox.x = this.position.x;
        this.hitbox.y = this.position.y;
        this.hitbox.width = this.size.width;
        this.hitbox.height = this.size.height;
    }

    /**
     * Verificar límites del mundo
     * @private
     */
    checkWorldBounds() {
        // Obtener dimensiones del canvas desde la configuración global
        const canvasHeight = 400; // Valor por defecto, se puede obtener del canvas real
        const groundHeight = 100; // Valor por defecto
        
        // Verificar si el jugador está en el suelo
        const groundY = canvasHeight - groundHeight;
        const ceilingY = 0;
        
        if (!this.state.isInverted) {
            // Gravedad normal - verificar suelo
            if (this.position.y + this.size.height >= groundY) {
                this.position.y = groundY - this.size.height;
                this.handleGroundContact();
            }
            
            // Verificar techo
            if (this.position.y <= ceilingY) {
                this.position.y = ceilingY;
                this.physics.velocity.y = Math.max(0, this.physics.velocity.y);
            }
        } else {
            // Gravedad invertida - verificar techo como suelo
            if (this.position.y <= ceilingY) {
                this.position.y = ceilingY;
                this.handleGroundContact();
            }
            
            // Verificar suelo como techo
            if (this.position.y + this.size.height >= groundY) {
                this.position.y = groundY - this.size.height;
                this.physics.velocity.y = Math.min(0, this.physics.velocity.y);
            }
        }
        
        // Verificar límites laterales (muerte si sale por la izquierda)
        if (this.position.x + this.size.width < 0) {
            this.handleDeath('out_of_bounds');
        }
    }

    /**
     * Verificar entradas buffereadas y ejecutarlas si es posible
     * @private
     */
    checkBufferedInputs() {
        // Verificar salto buffereado
        if (this.abilities.hasBufferedInput('jump') && this.abilities.canJump(this.state.isGrounded)) {
            this.jump();
        }
        
        // Verificar dash buffereado
        if (this.abilities.hasBufferedInput('dash') && this.abilities.canDash()) {
            this.dash();
        }
    }

    /**
     * Manejar contacto con el suelo
     * @private
     */
    handleGroundContact() {
        if (!this.state.isGrounded) {
            this.state.isGrounded = true;
            this.state.lastGroundTime = Date.now();
            this.physics.velocity.y = 0;
            this.abilities.resetJumps();
            
            this.eventBus.emit('player:landed', { 
                position: this.position,
                wasInverted: this.state.isInverted 
            });
        }
    }

    /**
     * Manejar entrada de salto
     * @private
     */
    handleJumpInput() {
        if (!this.isActive || !this.state.isAlive) return;
        
        // Buffer la entrada para timing preciso
        this.abilities.bufferInput('jump');
        
        const canJump = this.abilities.canJump(this.state.isGrounded);
        
        if (canJump) {
            this.jump();
        } else if (this.abilities.hasBufferedInput('jump')) {
            // Mantener el buffer para cuando sea posible saltar
            console.log('[Player] Salto buffereado');
        }
    }

    /**
     * Manejar entrada de dash
     * @private
     */
    handleDashInput() {
        if (!this.isActive || !this.state.isAlive) return;
        
        // Buffer la entrada para timing preciso
        this.abilities.bufferInput('dash');
        
        const canDash = this.abilities.canDash();
        
        if (canDash) {
            this.dash();
        } else if (this.abilities.hasBufferedInput('dash')) {
            // Mantener el buffer para cuando sea posible hacer dash
            console.log('[Player] Dash buffereado');
        }
    }

    /**
     * Manejar entrada de gravedad
     * @private
     */
    handleGravityInput() {
        if (!this.isActive || !this.state.isAlive) return;
        
        this.toggleGravity();
    }

    /**
     * Realizar salto
     */
    jump() {
        // Verificar combos antes de realizar el salto
        const comboInfo = this.abilities.checkCombo('jump');
        
        const jumpForce = this.abilities.performJump(this.state.isInverted);
        
        if (jumpForce !== 0) {
            // Aplicar multiplicador de combo si existe
            let finalJumpForce = jumpForce;
            if (comboInfo.isCombo) {
                finalJumpForce *= comboInfo.multiplier;
            }
            
            this.physics.applyJumpForce(finalJumpForce, this.state.isInverted);
            this.state.isGrounded = false;
            this.stats.jumps++;
            
            // Consumir entrada buffereada
            this.abilities.consumeBufferedInput('jump');
            
            this.eventBus.emit('player:jumped', {
                position: this.position,
                force: finalJumpForce,
                originalForce: jumpForce,
                isInverted: this.state.isInverted,
                jumpCount: this.abilities.getJumpCount(),
                isCombo: comboInfo.isCombo,
                comboType: comboInfo.type
            });
            
            console.log(`[Player] Salto realizado (fuerza: ${finalJumpForce}${comboInfo.isCombo ? ` - combo ${comboInfo.type}` : ''})`);
        }
    }

    /**
     * Realizar dash
     */
    dash() {
        // Verificar combos antes de realizar el dash
        const comboInfo = this.abilities.checkCombo('dash');
        
        const dashForce = this.abilities.performDash();
        
        if (dashForce !== 0) {
            // Aplicar multiplicador de combo si existe
            let finalDashForce = dashForce;
            if (comboInfo.isCombo) {
                finalDashForce *= comboInfo.multiplier;
            }
            
            this.physics.applyDashForce(finalDashForce);
            this.state.isDashing = true;
            this.stats.dashes++;
            
            // Consumir entrada buffereada
            this.abilities.consumeBufferedInput('dash');
            
            // El dash dura un tiempo limitado
            const dashDuration = this.config.abilities?.dashDuration || 200;
            setTimeout(() => {
                this.state.isDashing = false;
            }, dashDuration);
            
            this.eventBus.emit('player:dashed', {
                position: this.position,
                force: finalDashForce,
                originalForce: dashForce,
                duration: dashDuration,
                isCombo: comboInfo.isCombo,
                comboType: comboInfo.type
            });
            
            console.log(`[Player] Dash realizado (fuerza: ${finalDashForce}${comboInfo.isCombo ? ` - combo ${comboInfo.type}` : ''})`);
        }
    }

    /**
     * Alternar gravedad
     */
    toggleGravity() {
        this.state.isInverted = !this.state.isInverted;
        this.physics.setGravityDirection(this.state.isInverted ? -1 : 1);
        
        this.eventBus.emit('player:gravity-changed', {
            position: this.position,
            isInverted: this.state.isInverted
        });
        
        console.log(`[Player] Gravedad ${this.state.isInverted ? 'invertida' : 'normal'}`);
    }

    /**
     * Manejar muerte del jugador
     * @param {string} cause - Causa de la muerte
     * @private
     */
    handleDeath(cause = 'unknown') {
        if (!this.state.isAlive) return;
        
        this.state.isAlive = false;
        this.isActive = false;
        
        this.eventBus.emit('player:died', {
            position: this.position,
            cause: cause,
            stats: this.stats
        });
        
        console.log(`[Player] Jugador murió por: ${cause}`);
    }

    /**
     * Resetear posición del jugador
     */
    resetPosition() {
        this.position.x = this.config.startPosition?.x || 100;
        this.position.y = this.config.startPosition?.y || 300;
        
        this.physics.reset();
        this.abilities.reset();
        
        this.state.isGrounded = false;
        this.state.isDashing = false;
        this.state.isInverted = false;
        this.state.isAlive = true;
        this.state.lastGroundTime = 0;
        
        this.stats.distance = 0;
        this.stats.jumps = 0;
        this.stats.dashes = 0;
        this.stats.timeAlive = 0;
        
        this.isActive = true;
        
        console.log('[Player] Posición reseteada');
    }

    // ===== EVENT HANDLERS =====

    /**
     * Manejar inicio del juego
     * @private
     */
    handleGameStart() {
        this.resetPosition();
        this.isActive = true;
        console.log('[Player] Juego iniciado');
    }

    /**
     * Manejar parada del juego
     * @private
     */
    handleGameStop() {
        this.isActive = false;
        console.log('[Player] Juego detenido');
    }

    /**
     * Manejar reset del juego
     * @private
     */
    handleGameReset() {
        this.resetPosition();
        console.log('[Player] Juego reseteado');
    }

    /**
     * Manejar colisión con el suelo
     * @param {Object} data - Datos de la colisión
     * @private
     */
    handleGroundCollision(data) {
        this.handleGroundContact();
    }

    /**
     * Manejar colisión con obstáculo
     * @param {Object} data - Datos de la colisión
     * @private
     */
    handleObstacleCollision(data) {
        this.handleDeath('obstacle');
    }

    /**
     * Manejar colisión con techo
     * @param {Object} data - Datos de la colisión
     * @private
     */
    handleCeilingCollision(data) {
        if (!this.state.isInverted) {
            this.physics.velocity.y = Math.max(0, this.physics.velocity.y);
        } else {
            this.handleGroundContact();
        }
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
                break;
            case 'paused':
            case 'gameOver':
            case 'menu':
                this.isActive = false;
                break;
        }
    }

    // ===== GETTERS PÚBLICOS =====

    /**
     * Obtener posición actual del jugador
     * @returns {Object} Posición {x, y}
     */
    getPosition() {
        return { ...this.position };
    }

    /**
     * Obtener hitbox del jugador
     * @returns {Object} Hitbox {x, y, width, height}
     */
    getHitbox() {
        return { ...this.hitbox };
    }

    /**
     * Obtener estado actual del jugador
     * @returns {Object} Estado del jugador
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Obtener estadísticas del jugador
     * @returns {Object} Estadísticas del jugador
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Obtener velocidad actual
     * @returns {Object} Velocidad {x, y}
     */
    getVelocity() {
        return this.physics.getVelocity();
    }

    /**
     * Verificar si el jugador está vivo
     * @returns {boolean} True si está vivo
     */
    isAlive() {
        return this.state.isAlive;
    }

    /**
     * Actualizar distancia recorrida
     * @param {number} distance - Nueva distancia
     */
    updateDistance(distance) {
        this.stats.distance = distance;
    }

    /**
     * Limpiar recursos del módulo
     */
    destroy() {
        if (!this.isInitialized) return;
        
        // Limpiar event listeners
        this.eventBus.offContext(this);
        
        // Limpiar módulos especializados
        if (this.physics) this.physics.destroy();
        if (this.abilities) this.abilities.destroy();
        if (this.renderer) this.renderer.destroy();
        
        this.isInitialized = false;
        this.isActive = false;
        
        console.log('[Player] Módulo destruido');
    }
}