/**
 * Sistema de habilidades del jugador para Spikepulse
 * @module PlayerAbilities
 */

export class PlayerAbilities {
    /**
     * Crea una nueva instancia de habilidades del jugador
     * @param {Player} player - Referencia al jugador
     * @param {Object} config - Configuración de física
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(player, config, eventBus) {
        this.player = player;
        this.config = config;
        this.eventBus = eventBus;
        
        // Configuración de salto
        this.jump = {
            force: config.jump?.force || -10,
            doubleJumpForce: config.jump?.doubleJumpForce || -8,
            variableHeight: config.jump?.variableHeight || true,
            minJumpTime: config.jump?.minJumpTime || 100,
            maxJumpTime: config.jump?.maxJumpTime || 300,
            maxJumps: config.abilities?.maxJumps || 2,
            jumpsLeft: config.abilities?.maxJumps || 2,
            isJumping: false,
            jumpTime: 0,
            jumpStartTime: 0
        };
        
        // Configuración de dash
        this.dash = {
            force: config.dash?.force || 8,
            duration: config.dash?.duration || 200,
            cooldown: config.dash?.cooldown || 1000,
            invulnerabilityTime: config.dash?.invulnerabilityTime || 150,
            friction: config.dash?.friction || 0.95,
            airResistance: config.dash?.airResistance || 0.98,
            available: true,
            isDashing: false,
            dashTime: 0,
            cooldownTime: 0,
            direction: { x: 1, y: 0 }
        };
        
        // Configuración de gravedad
        this.gravity = {
            toggleCooldown: config.abilities?.gravityToggleCooldown || 500,
            cooldownTime: 0,
            canToggle: true
        };
        
        // Efectos de habilidades
        this.effects = {
            jumpParticles: config.effects?.jumpParticles || 5,
            dashParticles: config.effects?.dashParticles || 10,
            gravityParticles: config.effects?.gravityParticles || 8,
            trailLength: config.effects?.trails?.dashTrailLength || 10
        };
        
        console.log('🦘 PlayerAbilities creado');
    }
    
    /**
     * Actualización con timestep fijo
     * @param {number} fixedDelta - Delta time fijo
     */
    fixedUpdate(fixedDelta) {
        // Actualizar salto
        this.updateJump(fixedDelta);
        
        // Actualizar dash
        this.updateDash(fixedDelta);
        
        // Actualizar cooldowns
        this.updateCooldowns(fixedDelta);
    }
    
    /**
     * Actualización con timestep variable
     * @param {number} deltaTime - Delta time variable
     * @param {number} interpolation - Factor de interpolación
     */
    update(deltaTime, interpolation) {
        // Actualizar efectos visuales
        this.updateEffects(deltaTime);
    }
    
    /**
     * Actualiza el sistema de salto
     * @param {number} deltaTime - Delta time
     */
    updateJump(deltaTime) {
        // Actualizar salto variable
        if (this.jump.isJumping) {
            this.jump.jumpTime += deltaTime;
            
            // Si se suelta el botón de salto o se alcanza el tiempo máximo
            if (!this.player.input.jump || this.jump.jumpTime >= this.jump.maxJumpTime) {
                this.endJump();
            }
            // Si no se ha alcanzado el tiempo mínimo, continuar aplicando fuerza
            else if (this.jump.jumpTime < this.jump.minJumpTime) {
                // Aplicar fuerza de salto continua para salto variable
                const jumpForce = this.jump.force * 0.3; // Fuerza reducida para continuidad
                this.player.playerPhysics.addForce(0, jumpForce);
            }
        }
    }
    
    /**
     * Actualiza el sistema de dash
     * @param {number} deltaTime - Delta time
     */
    updateDash(deltaTime) {
        if (this.dash.isDashing) {
            this.dash.dashTime += deltaTime;
            
            // Aplicar fuerza de dash
            const dashForce = this.dash.force;
            this.player.playerPhysics.addForce(
                dashForce * this.dash.direction.x,
                dashForce * this.dash.direction.y
            );
            
            // Aplicar resistencia del aire durante el dash
            const velocity = this.player.state.velocity;
            velocity.x *= this.dash.airResistance;
            velocity.y *= this.dash.airResistance;
            
            // Terminar dash si se acabó el tiempo
            if (this.dash.dashTime >= this.dash.duration) {
                this.endDash();
            }
        }
    }
    
    /**
     * Actualiza cooldowns
     * @param {number} deltaTime - Delta time
     */
    updateCooldowns(deltaTime) {
        // Cooldown de dash
        if (this.dash.cooldownTime > 0) {
            this.dash.cooldownTime -= deltaTime;
            if (this.dash.cooldownTime <= 0) {
                this.dash.available = true;
                this.eventBus.emit('player:dash-ready');
            }
        }
        
        // Cooldown de gravedad
        if (this.gravity.cooldownTime > 0) {
            this.gravity.cooldownTime -= deltaTime;
            if (this.gravity.cooldownTime <= 0) {
                this.gravity.canToggle = true;
            }
        }
    }
    
    /**
     * Actualiza efectos visuales
     * @param {number} deltaTime - Delta time
     */
    updateEffects(deltaTime) {
        // Los efectos se manejan en el Player principal
        // Aquí se podrían añadir efectos específicos de habilidades
    }
    
    // ===== HABILIDADES =====
    
    /**
     * Ejecuta salto
     * @returns {boolean} True si el salto fue exitoso
     */
    jump() {
        // Verificar si puede saltar
        if (!this.canJump()) {
            // Activar jump buffer si no puede saltar ahora
            this.player.playerPhysics.setJumpBuffer();
            return false;
        }
        
        // Consumir jump buffer si está activo
        if (this.player.playerPhysics.hasJumpBuffer()) {
            this.player.playerPhysics.consumeJumpBuffer();
        }
        
        // Determinar fuerza de salto
        let jumpForce = this.jump.force;
        if (this.jump.jumpsLeft < this.jump.maxJumps) {
            jumpForce = this.jump.doubleJumpForce;
        }
        
        // Aplicar fuerza de salto
        this.player.playerPhysics.setVelocity(undefined, jumpForce);
        
        // Actualizar estado de salto
        this.jump.jumpsLeft--;
        this.jump.isJumping = this.jump.variableHeight;
        this.jump.jumpTime = 0;
        this.jump.jumpStartTime = Date.now();
        
        // Crear efectos
        this.createJumpEffects();
        
        console.log(`🦘 Player saltó (saltos restantes: ${this.jump.jumpsLeft})`);
        
        // Emitir evento
        this.eventBus.emit('player:jumped', {
            position: this.player.state.position,
            force: jumpForce,
            jumpsLeft: this.jump.jumpsLeft,
            isDoubleJump: this.jump.jumpsLeft < this.jump.maxJumps - 1
        });
        
        return true;
    }
    
    /**
     * Termina el salto variable
     */
    endJump() {
        this.jump.isJumping = false;
        this.jump.jumpTime = 0;
        
        // Reducir velocidad vertical si está subiendo
        if (this.player.state.velocity.y < 0) {
            this.player.state.velocity.y *= 0.5;
        }
    }
    
    /**
     * Ejecuta dash
     * @returns {boolean} True si el dash fue exitoso
     */
    dash() {
        if (!this.canDash()) {
            return false;
        }
        
        // Determinar dirección del dash
        this.calculateDashDirection();
        
        // Iniciar dash
        this.dash.isDashing = true;
        this.dash.dashTime = 0;
        this.dash.available = false;
        this.dash.cooldownTime = this.dash.cooldown;
        
        // Hacer invulnerable temporalmente
        this.player.makeInvulnerable(this.dash.invulnerabilityTime);
        
        // Aplicar velocidad inicial de dash
        const dashVelocity = this.dash.force * 1.5;
        this.player.playerPhysics.setVelocity(
            dashVelocity * this.dash.direction.x,
            dashVelocity * this.dash.direction.y
        );
        
        // Crear efectos
        this.createDashEffects();
        
        console.log(`💨 Player hizo dash en dirección (${this.dash.direction.x}, ${this.dash.direction.y})`);
        
        // Emitir evento
        this.eventBus.emit('player:dashed', {
            position: this.player.state.position,
            direction: this.dash.direction,
            force: this.dash.force
        });
        
        return true;
    }
    
    /**
     * Termina el dash
     */
    endDash() {
        this.dash.isDashing = false;
        this.dash.dashTime = 0;
        
        // Aplicar fricción final
        const velocity = this.player.state.velocity;
        velocity.x *= this.dash.friction;
        velocity.y *= this.dash.friction;
        
        console.log('💨 Dash terminado');
        
        // Emitir evento
        this.eventBus.emit('player:dash-ended', {
            position: this.player.state.position,
            velocity: this.player.state.velocity
        });
    }
    
    /**
     * Alterna la gravedad
     * @returns {boolean} True si se pudo alternar
     */
    toggleGravity() {
        if (!this.canToggleGravity()) {
            return false;
        }
        
        // Alternar gravedad
        this.player.playerPhysics.invertGravity();
        
        // Aplicar cooldown
        this.gravity.canToggle = false;
        this.gravity.cooldownTime = this.gravity.toggleCooldown;
        
        // Crear efectos
        this.createGravityEffects();
        
        console.log('🔄 Gravedad alternada');
        
        // Emitir evento
        this.eventBus.emit('player:gravity-toggled', {
            position: this.player.state.position,
            inverted: this.player.physics.gravityInverted
        });
        
        return true;
    }
    
    // ===== VERIFICACIONES =====
    
    /**
     * Verifica si puede saltar
     * @returns {boolean} True si puede saltar
     */
    canJump() {
        // Puede saltar si está en el suelo o tiene saltos restantes
        if (this.player.physics.onGround || this.player.playerPhysics.canUseCoyoteTime()) {
            return true;
        }
        
        // O si tiene saltos dobles disponibles
        return this.jump.jumpsLeft > 0;
    }
    
    /**
     * Verifica si puede hacer dash
     * @returns {boolean} True si puede hacer dash
     */
    canDash() {
        return this.dash.available && !this.dash.isDashing;
    }
    
    /**
     * Verifica si puede alternar gravedad
     * @returns {boolean} True si puede alternar gravedad
     */
    canToggleGravity() {
        return this.gravity.canToggle;
    }
    
    // ===== UTILIDADES =====
    
    /**
     * Calcula la dirección del dash basada en input
     */
    calculateDashDirection() {
        let x = 0;
        let y = 0;
        
        // Dirección horizontal
        if (this.player.input.moveLeft && !this.player.input.moveRight) {
            x = -1;
        } else if (this.player.input.moveRight && !this.player.input.moveLeft) {
            x = 1;
        } else {
            // Si no hay input horizontal, dash hacia adelante
            x = this.player.state.velocity.x >= 0 ? 1 : -1;
        }
        
        // Dirección vertical (opcional, basada en gravedad)
        if (this.player.physics.gravityInverted) {
            y = -0.2; // Dash ligeramente hacia arriba si la gravedad está invertida
        } else {
            y = 0.2; // Dash ligeramente hacia abajo si la gravedad es normal
        }
        
        // Normalizar dirección
        const magnitude = Math.sqrt(x * x + y * y);
        if (magnitude > 0) {
            this.dash.direction.x = x / magnitude;
            this.dash.direction.y = y / magnitude;
        } else {
            this.dash.direction.x = 1;
            this.dash.direction.y = 0;
        }
    }
    
    /**
     * Resetea los saltos disponibles
     */
    resetJumps() {
        this.jump.jumpsLeft = this.jump.maxJumps;
        
        // Procesar jump buffer si está activo
        if (this.player.playerPhysics.hasJumpBuffer()) {
            setTimeout(() => {
                if (this.player.playerPhysics.hasJumpBuffer()) {
                    this.jump();
                }
            }, 16); // Próximo frame
        }
    }
    
    // ===== EFECTOS =====
    
    /**
     * Crea efectos de salto
     */
    createJumpEffects() {
        const particleCount = this.effects.jumpParticles;
        const baseX = this.player.state.position.x + this.player.state.size.width / 2;
        const baseY = this.player.state.position.y + this.player.state.size.height;
        
        for (let i = 0; i < particleCount; i++) {
            this.player.effects.particles.push({
                x: baseX + (Math.random() - 0.5) * this.player.state.size.width,
                y: baseY,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 2 + 1,
                life: 300 + Math.random() * 200,
                maxLife: 300 + Math.random() * 200,
                alpha: 1,
                color: '#FFD700',
                size: 1 + Math.random() * 2
            });
        }
    }
    
    /**
     * Crea efectos de dash
     */
    createDashEffects() {
        const particleCount = this.effects.dashParticles;
        const baseX = this.player.state.position.x + this.player.state.size.width / 2;
        const baseY = this.player.state.position.y + this.player.state.size.height / 2;
        
        for (let i = 0; i < particleCount; i++) {
            // Partículas en dirección opuesta al dash
            const angle = Math.atan2(-this.dash.direction.y, -this.dash.direction.x) + 
                         (Math.random() - 0.5) * Math.PI / 3;
            const speed = 2 + Math.random() * 3;
            
            this.player.effects.particles.push({
                x: baseX,
                y: baseY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 400 + Math.random() * 300,
                maxLife: 400 + Math.random() * 300,
                alpha: 1,
                color: '#9F7AEA',
                size: 2 + Math.random() * 2
            });
        }
        
        // Añadir trail más largo durante el dash
        for (let i = 0; i < this.effects.trailLength; i++) {
            this.player.effects.trail.push({
                x: baseX - this.dash.direction.x * i * 5,
                y: baseY - this.dash.direction.y * i * 5,
                alpha: 1.0 - (i / this.effects.trailLength),
                time: 0
            });
        }
    }
    
    /**
     * Crea efectos de cambio de gravedad
     */
    createGravityEffects() {
        const particleCount = this.effects.gravityParticles;
        const baseX = this.player.state.position.x + this.player.state.size.width / 2;
        const baseY = this.player.state.position.y + this.player.state.size.height / 2;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 1 + Math.random() * 2;
            
            this.player.effects.particles.push({
                x: baseX,
                y: baseY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 600 + Math.random() * 400,
                maxLife: 600 + Math.random() * 400,
                alpha: 1,
                color: '#FF6B6B',
                size: 1 + Math.random() * 2
            });
        }
    }
    
    /**
     * Resetea todas las habilidades
     */
    reset() {
        // Reset salto
        this.jump.jumpsLeft = this.jump.maxJumps;
        this.jump.isJumping = false;
        this.jump.jumpTime = 0;
        this.jump.jumpStartTime = 0;
        
        // Reset dash
        this.dash.available = true;
        this.dash.isDashing = false;
        this.dash.dashTime = 0;
        this.dash.cooldownTime = 0;
        this.dash.direction = { x: 1, y: 0 };
        
        // Reset gravedad
        this.gravity.canToggle = true;
        this.gravity.cooldownTime = 0;
        
        console.log('🔄 PlayerAbilities reseteado');
    }
    
    /**
     * Obtiene el estado actual de las habilidades
     * @returns {Object} Estado de las habilidades
     */
    getState() {
        return {
            jump: {
                jumpsLeft: this.jump.jumpsLeft,
                maxJumps: this.jump.maxJumps,
                isJumping: this.jump.isJumping,
                canJump: this.canJump()
            },
            dash: {
                available: this.dash.available,
                isDashing: this.dash.isDashing,
                cooldownTime: this.dash.cooldownTime,
                canDash: this.canDash()
            },
            gravity: {
                canToggle: this.gravity.canToggle,
                cooldownTime: this.gravity.cooldownTime,
                inverted: this.player.physics.gravityInverted
            }
        };
    }
    
    /**
     * Obtiene información de debug
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            jump: {
                ...this.jump,
                canJump: this.canJump()
            },
            dash: {
                ...this.dash,
                canDash: this.canDash()
            },
            gravity: {
                ...this.gravity,
                canToggle: this.canToggleGravity()
            }
        };
    }
    
    /**
     * Limpia recursos
     */
    destroy() {
        // No hay recursos específicos que limpiar
        console.log('🧹 PlayerAbilities destruido');
    }
}