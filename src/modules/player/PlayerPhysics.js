/**
 * PlayerPhysics - Módulo de física del jugador
 * @module PlayerPhysics
 */

export class PlayerPhysics {
    /**
     * Crea una nueva instancia de PlayerPhysics
     * @param {Object} config - Configuración de física
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        
        // Propiedades físicas
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        
        // Configuración de física
        this.gravity = config.gravity || 0.5;
        this.jumpForce = config.jumpForce || -10;
        this.maxSpeed = config.maxSpeed || 8;
        this.moveSpeed = config.moveSpeed || 5;
        this.friction = config.friction || 0.85;
        this.ceilingGravity = config.ceilingGravity || -0.5;
        
        // Estado de física
        this.gravityDirection = 1; // 1 = normal, -1 = invertida
        this.isGrounded = false;
        this.terminalVelocity = 15;
        
        console.log('[PlayerPhysics] Instancia creada');
    }

    /**
     * Inicializar el módulo de física
     * @param {Object} position - Posición inicial del jugador
     * @param {Object} size - Tamaño del jugador
     */
    init(position, size) {
        this.position = position;
        this.size = size;
        this.reset();
        
        console.log('[PlayerPhysics] Inicializado');
    }

    /**
     * Actualizar física del jugador
     * @param {number} deltaTime - Tiempo transcurrido
     * @param {Object} position - Posición actual del jugador
     * @param {Object} state - Estado actual del jugador
     */
    update(deltaTime, position, state) {
        // Convertir deltaTime a segundos para cálculos más precisos
        const dt = deltaTime / 1000;
        
        // Aplicar gravedad
        this.applyGravity(dt);
        
        // Aplicar fricción
        this.applyFriction(dt);
        
        // Limitar velocidades
        this.limitVelocity();
        
        // Actualizar posición basada en velocidad
        this.updatePosition(dt, position);
        
        // Actualizar estado de física
        this.isGrounded = state.isGrounded;
        
        // Emitir evento de actualización de física
        this.eventBus.emit('player:physics-update', {
            velocity: this.velocity,
            acceleration: this.acceleration,
            gravityDirection: this.gravityDirection
        });
    }

    /**
     * Aplicar gravedad
     * @param {number} dt - Delta time en segundos
     * @private
     */
    applyGravity(dt) {
        const currentGravity = this.gravityDirection > 0 ? this.gravity : this.ceilingGravity;
        this.acceleration.y = currentGravity * this.gravityDirection;
        this.velocity.y += this.acceleration.y * dt * 60; // Multiplicar por 60 para mantener consistencia con 60fps
    }

    /**
     * Aplicar fricción
     * @param {number} dt - Delta time en segundos
     * @private
     */
    applyFriction(dt) {
        // Fricción horizontal (solo cuando está en el suelo)
        if (this.isGrounded) {
            this.velocity.x *= Math.pow(this.friction, dt * 60);
        }
        
        // Resistencia del aire vertical (muy ligera)
        this.velocity.y *= Math.pow(0.995, dt * 60);
    }

    /**
     * Limitar velocidades máximas
     * @private
     */
    limitVelocity() {
        // Limitar velocidad horizontal
        this.velocity.x = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.velocity.x));
        
        // Limitar velocidad vertical (terminal velocity)
        this.velocity.y = Math.max(-this.terminalVelocity, Math.min(this.terminalVelocity, this.velocity.y));
    }

    /**
     * Actualizar posición basada en velocidad
     * @param {number} dt - Delta time en segundos
     * @param {Object} position - Referencia a la posición del jugador
     * @private
     */
    updatePosition(dt, position) {
        // Actualizar posición
        position.x += this.velocity.x * dt * 60;
        position.y += this.velocity.y * dt * 60;
    }

    /**
     * Aplicar fuerza de salto
     * @param {number} force - Fuerza del salto
     * @param {boolean} isInverted - Si la gravedad está invertida
     */
    applyJumpForce(force, isInverted = false) {
        if (isInverted) {
            // En gravedad invertida, el salto va hacia abajo
            this.velocity.y = Math.abs(force);
        } else {
            // En gravedad normal, el salto va hacia arriba
            this.velocity.y = -Math.abs(force);
        }
        
        console.log(`[PlayerPhysics] Fuerza de salto aplicada: ${force} (invertida: ${isInverted})`);
    }

    /**
     * Aplicar fuerza de dash
     * @param {number} force - Fuerza del dash
     */
    applyDashForce(force) {
        // El dash siempre es horizontal hacia la derecha
        this.velocity.x += force;
        
        // Reducir ligeramente la velocidad vertical durante el dash
        this.velocity.y *= 0.7;
        
        console.log(`[PlayerPhysics] Fuerza de dash aplicada: ${force}`);
    }

    /**
     * Aplicar fuerza horizontal (para movimiento lateral)
     * @param {number} force - Fuerza horizontal
     */
    applyHorizontalForce(force) {
        this.velocity.x += force;
    }

    /**
     * Establecer dirección de gravedad
     * @param {number} direction - Dirección (1 = normal, -1 = invertida)
     */
    setGravityDirection(direction) {
        this.gravityDirection = direction;
        
        // Ajustar velocidad vertical al cambiar gravedad
        if (Math.abs(this.velocity.y) < 1) {
            this.velocity.y *= -0.5; // Pequeño impulso en la nueva dirección
        }
        
        console.log(`[PlayerPhysics] Dirección de gravedad: ${direction > 0 ? 'normal' : 'invertida'}`);
    }

    /**
     * Detener movimiento vertical (para colisiones)
     */
    stopVerticalMovement() {
        this.velocity.y = 0;
        this.acceleration.y = 0;
    }

    /**
     * Detener movimiento horizontal
     */
    stopHorizontalMovement() {
        this.velocity.x = 0;
        this.acceleration.x = 0;
    }

    /**
     * Detener todo movimiento
     */
    stopAllMovement() {
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.acceleration.x = 0;
        this.acceleration.y = 0;
    }

    /**
     * Aplicar impulso instantáneo
     * @param {Object} impulse - Impulso {x, y}
     */
    applyImpulse(impulse) {
        this.velocity.x += impulse.x || 0;
        this.velocity.y += impulse.y || 0;
    }

    /**
     * Verificar si el jugador está cayendo
     * @returns {boolean} True si está cayendo
     */
    isFalling() {
        if (this.gravityDirection > 0) {
            return this.velocity.y > 0.1;
        } else {
            return this.velocity.y < -0.1;
        }
    }

    /**
     * Verificar si el jugador está subiendo
     * @returns {boolean} True si está subiendo
     */
    isRising() {
        if (this.gravityDirection > 0) {
            return this.velocity.y < -0.1;
        } else {
            return this.velocity.y > 0.1;
        }
    }

    /**
     * Obtener velocidad actual
     * @returns {Object} Velocidad {x, y}
     */
    getVelocity() {
        return { ...this.velocity };
    }

    /**
     * Obtener aceleración actual
     * @returns {Object} Aceleración {x, y}
     */
    getAcceleration() {
        return { ...this.acceleration };
    }

    /**
     * Obtener velocidad total (magnitud)
     * @returns {number} Velocidad total
     */
    getTotalSpeed() {
        return Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    }

    /**
     * Obtener dirección de movimiento en radianes
     * @returns {number} Ángulo en radianes
     */
    getMovementAngle() {
        return Math.atan2(this.velocity.y, this.velocity.x);
    }

    /**
     * Verificar si el jugador se está moviendo
     * @returns {boolean} True si se está moviendo
     */
    isMoving() {
        return Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1;
    }

    /**
     * Resetear física a estado inicial
     */
    reset() {
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.acceleration.x = 0;
        this.acceleration.y = 0;
        this.gravityDirection = 1;
        this.isGrounded = false;
        
        console.log('[PlayerPhysics] Física reseteada');
    }

    /**
     * Obtener información de debug
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            velocity: { ...this.velocity },
            acceleration: { ...this.acceleration },
            gravityDirection: this.gravityDirection,
            isGrounded: this.isGrounded,
            totalSpeed: this.getTotalSpeed(),
            movementAngle: this.getMovementAngle(),
            isFalling: this.isFalling(),
            isRising: this.isRising(),
            isMoving: this.isMoving()
        };
    }

    /**
     * Limpiar recursos
     */
    destroy() {
        // Limpiar referencias
        this.position = null;
        this.size = null;
        
        console.log('[PlayerPhysics] Módulo destruido');
    }
}