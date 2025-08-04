/**
 * Sistema de física del jugador para Spikepulse
 * @module PlayerPhysics
 */

export class PlayerPhysics {
    /**
     * Crea una nueva instancia de física del jugador
     * @param {Player} player - Referencia al jugador
     * @param {Object} config - Configuración de física
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(player, config, eventBus) {
        this.player = player;
        this.config = config;
        this.eventBus = eventBus;
        
        // Configuración de física
        this.gravity = {
            normal: config.gravity?.normal || 0.5,
            inverted: config.gravity?.inverted || -0.5,
            current: config.gravity?.normal || 0.5,
            transitionSpeed: config.gravity?.transitionSpeed || 0.1
        };
        
        this.movement = {
            acceleration: config.movement?.acceleration || 0.8,
            deceleration: config.movement?.deceleration || 0.85,
            maxSpeed: config.movement?.maxSpeed || 8,
            airControl: config.movement?.airControl || 0.6,
            groundFriction: config.movement?.groundFriction || 0.85,
            airFriction: config.movement?.airFriction || 0.98
        };
        
        this.surface = {
            groundFriction: config.surface?.groundFriction || 0.85,
            wallFriction: config.surface?.wallFriction || 0.7,
            bounciness: config.surface?.bounciness || 0.1
        };
        
        // Estado interno de física
        this.forces = {
            gravity: { x: 0, y: 0 },
            movement: { x: 0, y: 0 },
            friction: { x: 0, y: 0 },
            external: { x: 0, y: 0 }
        };
        
        // Coyote time y jump buffering
        this.coyoteTime = config.jump?.coyoteTime || 100;
        this.jumpBuffering = config.jump?.jumpBuffering || 150;
        this.lastGroundTime = 0;
        this.jumpBufferTime = 0;
        
        // Interpolación para renderizado suave
        this.interpolation = {
            previousPosition: { x: 0, y: 0 },
            currentPosition: { x: 0, y: 0 },
            renderPosition: { x: 0, y: 0 }
        };
        
        console.log('⚡ PlayerPhysics creado');
    }
    
    /**
     * Actualización con timestep fijo para física consistente
     * @param {number} fixedDelta - Delta time fijo
     */
    fixedUpdate(fixedDelta) {
        // Guardar posición anterior para interpolación
        this.interpolation.previousPosition = { ...this.player.state.position };
        
        // Limpiar fuerzas del frame anterior
        this.clearForces();
        
        // Aplicar gravedad
        this.applyGravity(fixedDelta);
        
        // Aplicar movimiento horizontal
        this.applyMovement(fixedDelta);
        
        // Aplicar fricción
        this.applyFriction(fixedDelta);
        
        // Aplicar fuerzas externas
        this.applyExternalForces(fixedDelta);
        
        // Integrar fuerzas en aceleración
        this.integrateForces();
        
        // Integrar velocidad y posición
        this.integrateMotion(fixedDelta);
        
        // Aplicar límites de velocidad
        this.applyVelocityLimits();
        
        // Actualizar estado de física
        this.updatePhysicsState(fixedDelta);
        
        // Guardar posición actual para interpolación
        this.interpolation.currentPosition = { ...this.player.state.position };
    }
    
    /**
     * Actualización con timestep variable para interpolación
     * @param {number} deltaTime - Delta time variable
     * @param {number} interpolation - Factor de interpolación
     */
    update(deltaTime, interpolation) {
        // Interpolar posición para renderizado suave
        this.interpolatePosition(interpolation);
        
        // Actualizar timers
        this.updateTimers(deltaTime);
    }
    
    /**
     * Limpia todas las fuerzas
     */
    clearForces() {
        this.forces.gravity.x = 0;
        this.forces.gravity.y = 0;
        this.forces.movement.x = 0;
        this.forces.movement.y = 0;
        this.forces.friction.x = 0;
        this.forces.friction.y = 0;
        this.forces.external.x = 0;
        this.forces.external.y = 0;
    }
    
    /**
     * Aplica la fuerza de gravedad
     * @param {number} deltaTime - Delta time
     */
    applyGravity(deltaTime) {
        // Transición suave de gravedad
        const targetGravity = this.player.physics.gravityInverted ? 
            this.gravity.inverted : this.gravity.normal;
        
        this.gravity.current += (targetGravity - this.gravity.current) * 
            this.gravity.transitionSpeed;
        
        // Aplicar gravedad
        this.forces.gravity.y = this.gravity.current;
        
        // Limitar velocidad de caída/subida
        const maxFallSpeed = this.config.gravity?.maxFallSpeed || 15;
        const maxRiseSpeed = this.config.gravity?.maxRiseSpeed || -15;
        
        if (this.player.state.velocity.y > maxFallSpeed) {
            this.player.state.velocity.y = maxFallSpeed;
        } else if (this.player.state.velocity.y < maxRiseSpeed) {
            this.player.state.velocity.y = maxRiseSpeed;
        }
    }
    
    /**
     * Aplica fuerzas de movimiento horizontal
     * @param {number} deltaTime - Delta time
     */
    applyMovement(deltaTime) {
        const input = this.player.input;
        let moveForce = 0;
        
        // Calcular fuerza de movimiento basada en input
        if (input.moveLeft && !input.moveRight) {
            moveForce = -this.movement.acceleration;
        } else if (input.moveRight && !input.moveLeft) {
            moveForce = this.movement.acceleration;
        }
        
        // Aplicar control en el aire reducido
        if (!this.player.physics.onGround) {
            moveForce *= this.movement.airControl;
        }
        
        this.forces.movement.x = moveForce;
    }
    
    /**
     * Aplica fricción
     * @param {number} deltaTime - Delta time
     */
    applyFriction(deltaTime) {
        const velocity = this.player.state.velocity;
        
        // Fricción horizontal
        let frictionCoeff = this.movement.airFriction;
        
        if (this.player.physics.onGround) {
            frictionCoeff = this.movement.groundFriction;
        } else if (this.player.physics.onWall) {
            frictionCoeff = this.surface.wallFriction;
        }
        
        // Aplicar fricción solo si no hay input de movimiento
        if (!this.player.input.moveLeft && !this.player.input.moveRight) {
            this.forces.friction.x = -velocity.x * (1 - frictionCoeff);
        }
        
        // Fricción vertical en paredes (wall sliding)
        if (this.player.physics.onWall && !this.player.physics.onGround) {
            const wallSlideSpeed = this.config.movement?.wallSlideSpeed || 2;
            if (Math.abs(velocity.y) > wallSlideSpeed) {
                this.forces.friction.y = -velocity.y * 0.1;
            }
        }
    }
    
    /**
     * Aplica fuerzas externas (dash, knockback, etc.)
     * @param {number} deltaTime - Delta time
     */
    applyExternalForces(deltaTime) {
        // Las fuerzas externas se añaden desde otros sistemas
        // (PlayerAbilities, colisiones, etc.)
    }
    
    /**
     * Integra todas las fuerzas en aceleración
     */
    integrateForces() {
        this.player.state.acceleration.x = 
            this.forces.gravity.x + 
            this.forces.movement.x + 
            this.forces.friction.x + 
            this.forces.external.x;
            
        this.player.state.acceleration.y = 
            this.forces.gravity.y + 
            this.forces.movement.y + 
            this.forces.friction.y + 
            this.forces.external.y;
    }
    
    /**
     * Integra velocidad y posición usando Verlet integration
     * @param {number} deltaTime - Delta time
     */
    integrateMotion(deltaTime) {
        const state = this.player.state;
        const dt = deltaTime / 1000; // Convertir a segundos
        
        // Integrar velocidad
        state.velocity.x += state.acceleration.x * dt;
        state.velocity.y += state.acceleration.y * dt;
        
        // Integrar posición
        state.position.x += state.velocity.x * dt;
        state.position.y += state.velocity.y * dt;
    }
    
    /**
     * Aplica límites de velocidad
     */
    applyVelocityLimits() {
        const velocity = this.player.state.velocity;
        
        // Límite de velocidad horizontal
        if (Math.abs(velocity.x) > this.movement.maxSpeed) {
            velocity.x = Math.sign(velocity.x) * this.movement.maxSpeed;
        }
        
        // Límites de velocidad vertical ya aplicados en applyGravity
    }
    
    /**
     * Actualiza el estado de física (ground detection, etc.)
     * @param {number} deltaTime - Delta time
     */
    updatePhysicsState(deltaTime) {
        const currentTime = Date.now();
        
        // Actualizar coyote time
        if (this.player.physics.onGround) {
            this.lastGroundTime = currentTime;
        }
        
        // Verificar si perdió contacto con el suelo
        if (!this.player.physics.onGround && 
            currentTime - this.lastGroundTime > this.coyoteTime) {
            // Ya no puede usar coyote time
        }
        
        // Reset flags de colisión (se actualizan por el sistema de colisiones)
        this.player.physics.onGround = false;
        this.player.physics.onCeiling = false;
        this.player.physics.onWall = false;
    }
    
    /**
     * Interpola posición para renderizado suave
     * @param {number} alpha - Factor de interpolación
     */
    interpolatePosition(alpha) {
        const prev = this.interpolation.previousPosition;
        const curr = this.interpolation.currentPosition;
        
        this.interpolation.renderPosition.x = prev.x + (curr.x - prev.x) * alpha;
        this.interpolation.renderPosition.y = prev.y + (curr.y - prev.y) * alpha;
    }
    
    /**
     * Actualiza timers de física
     * @param {number} deltaTime - Delta time
     */
    updateTimers(deltaTime) {
        // Actualizar jump buffer
        if (this.jumpBufferTime > 0) {
            this.jumpBufferTime -= deltaTime;
        }
    }
    
    /**
     * Añade una fuerza externa
     * @param {number} x - Fuerza X
     * @param {number} y - Fuerza Y
     */
    addForce(x, y) {
        this.forces.external.x += x;
        this.forces.external.y += y;
    }
    
    /**
     * Establece velocidad directamente
     * @param {number} x - Velocidad X
     * @param {number} y - Velocidad Y
     */
    setVelocity(x, y) {
        if (x !== undefined) this.player.state.velocity.x = x;
        if (y !== undefined) this.player.state.velocity.y = y;
    }
    
    /**
     * Añade velocidad
     * @param {number} x - Velocidad X a añadir
     * @param {number} y - Velocidad Y a añadir
     */
    addVelocity(x, y) {
        this.player.state.velocity.x += x;
        this.player.state.velocity.y += y;
    }
    
    /**
     * Verifica si puede usar coyote time para saltar
     * @returns {boolean} True si puede usar coyote time
     */
    canUseCoyoteTime() {
        const currentTime = Date.now();
        return !this.player.physics.onGround && 
               (currentTime - this.lastGroundTime) <= this.coyoteTime;
    }
    
    /**
     * Establece jump buffer
     */
    setJumpBuffer() {
        this.jumpBufferTime = this.jumpBuffering;
    }
    
    /**
     * Verifica si hay jump buffer activo
     * @returns {boolean} True si hay jump buffer
     */
    hasJumpBuffer() {
        return this.jumpBufferTime > 0;
    }
    
    /**
     * Consume jump buffer
     */
    consumeJumpBuffer() {
        this.jumpBufferTime = 0;
    }
    
    /**
     * Invierte la gravedad
     */
    invertGravity() {
        this.player.physics.gravityInverted = !this.player.physics.gravityInverted;
        
        console.log(`🔄 Gravedad ${this.player.physics.gravityInverted ? 'invertida' : 'normal'}`);
        
        // Emitir evento
        this.eventBus.emit('player:gravity-changed', {
            inverted: this.player.physics.gravityInverted,
            position: this.player.state.position
        });
    }
    
    /**
     * Obtiene la posición de renderizado interpolada
     * @returns {Object} Posición interpolada
     */
    getRenderPosition() {
        return { ...this.interpolation.renderPosition };
    }
    
    /**
     * Resetea el sistema de física
     */
    reset() {
        // Reset fuerzas
        this.clearForces();
        
        // Reset gravedad
        this.gravity.current = this.gravity.normal;
        
        // Reset timers
        this.lastGroundTime = 0;
        this.jumpBufferTime = 0;
        
        // Reset interpolación
        this.interpolation.previousPosition = { ...this.player.state.position };
        this.interpolation.currentPosition = { ...this.player.state.position };
        this.interpolation.renderPosition = { ...this.player.state.position };
        
        console.log('🔄 PlayerPhysics reseteado');
    }
    
    /**
     * Obtiene información de debug
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            gravity: {
                current: this.gravity.current,
                inverted: this.player.physics.gravityInverted
            },
            forces: { ...this.forces },
            velocity: { ...this.player.state.velocity },
            acceleration: { ...this.player.state.acceleration },
            onGround: this.player.physics.onGround,
            onWall: this.player.physics.onWall,
            onCeiling: this.player.physics.onCeiling,
            coyoteTime: this.canUseCoyoteTime(),
            jumpBuffer: this.hasJumpBuffer(),
            renderPosition: this.getRenderPosition()
        };
    }
    
    /**
     * Limpia recursos
     */
    destroy() {
        // No hay recursos específicos que limpiar
        console.log('🧹 PlayerPhysics destruido');
    }
}