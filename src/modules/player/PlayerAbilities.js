/**
 * PlayerAbilities - Módulo de habilidades del jugador
 * @module PlayerAbilities
 */

export class PlayerAbilities {
    /**
     * Crea una nueva instancia de PlayerAbilities
     * @param {Object} config - Configuración de habilidades
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        
        // Configuración de habilidades
        this.maxJumps = config.maxJumps || 2;
        this.dashForce = config.dashForce || 8;
        this.dashDuration = config.dashDuration || 200;
        this.dashCooldown = config.dashCooldown || 1000;
        
        // Estado de habilidades
        this.jumpsRemaining = this.maxJumps;
        this.jumpCount = 0;
        this.isDashAvailable = true;
        this.lastDashTime = 0;
        this.dashCooldownTimer = 0;
        
        // Estado avanzado de habilidades
        this.comboState = {
            lastAbilityUsed: null,
            lastAbilityTime: 0,
            comboWindow: 500, // 500ms para combos
            comboCount: 0
        };
        
        // Buffers de entrada para timing preciso
        this.inputBuffer = {
            jump: { pressed: false, time: 0, buffer: 100 },
            dash: { pressed: false, time: 0, buffer: 150 }
        };
        
        // Modificadores de habilidades
        this.modifiers = {
            jumpForceMultiplier: 1.0,
            dashForceMultiplier: 1.0,
            cooldownMultiplier: 1.0,
            gravityResistance: 0.0
        };
        
        // Configuración de salto
        this.jumpForce = config.jumpForce || -10;
        this.doubleJumpForce = config.doubleJumpForce || config.jumpForce * 0.8 || -8;
        
        console.log('[PlayerAbilities] Instancia creada');
    }

    /**
     * Inicializar el módulo de habilidades
     */
    init() {
        this.reset();
        console.log('[PlayerAbilities] Inicializado');
    }

    /**
     * Actualizar habilidades del jugador
     * @param {number} deltaTime - Tiempo transcurrido
     * @param {Object} state - Estado actual del jugador
     */
    update(deltaTime, state) {
        // Actualizar cooldown del dash
        this.updateDashCooldown(deltaTime);
        
        // Resetear saltos si está en el suelo
        if (state.isGrounded && this.jumpsRemaining < this.maxJumps) {
            this.resetJumps();
        }
        
        // Emitir evento de actualización de habilidades
        this.eventBus.emit('player:abilities-update', {
            jumpsRemaining: this.jumpsRemaining,
            isDashAvailable: this.isDashAvailable,
            dashCooldownTimer: this.dashCooldownTimer
        });
    }

    /**
     * Actualizar cooldown del dash
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updateDashCooldown(deltaTime) {
        if (!this.isDashAvailable) {
            this.dashCooldownTimer -= deltaTime;
            
            if (this.dashCooldownTimer <= 0) {
                this.isDashAvailable = true;
                this.dashCooldownTimer = 0;
                
                this.eventBus.emit('player:dash-ready', {
                    cooldownTime: this.dashCooldown
                });
                
                console.log('[PlayerAbilities] Dash disponible');
            }
        }
    }

    /**
     * Verificar si el jugador puede saltar
     * @param {boolean} isGrounded - Si el jugador está en el suelo
     * @returns {boolean} True si puede saltar
     */
    canJump(isGrounded) {
        // Puede saltar si está en el suelo o tiene saltos restantes
        return isGrounded || this.jumpsRemaining > 0;
    }

    /**
     * Realizar salto
     * @param {boolean} isInverted - Si la gravedad está invertida
     * @returns {number} Fuerza del salto (0 si no puede saltar)
     */
    performJump(isInverted = false) {
        if (!this.canJump(false)) {
            return 0;
        }
        
        let jumpForce;
        const isFirstJump = this.jumpsRemaining === this.maxJumps;
        
        // Determinar fuerza del salto
        if (isFirstJump) {
            // Primer salto (más fuerte)
            jumpForce = Math.abs(this.jumpForce);
        } else {
            // Saltos adicionales (más débiles)
            jumpForce = Math.abs(this.doubleJumpForce);
        }
        
        // Aplicar modificadores según el contexto
        if (isInverted) {
            // En gravedad invertida, ajustar la fuerza ligeramente
            jumpForce *= 1.1; // 10% más fuerte para compensar
        }
        
        // Consumir salto
        this.jumpsRemaining--;
        this.jumpCount++;
        
        // Ajustar dirección según gravedad
        if (isInverted) {
            jumpForce = -jumpForce; // Invertir dirección
        }
        
        this.eventBus.emit('player:ability-used', {
            ability: 'jump',
            force: jumpForce,
            jumpsRemaining: this.jumpsRemaining,
            isDoubleJump: !isFirstJump,
            isInverted: isInverted,
            jumpNumber: this.maxJumps - this.jumpsRemaining
        });
        
        console.log(`[PlayerAbilities] Salto realizado (fuerza: ${jumpForce}, restantes: ${this.jumpsRemaining}, tipo: ${isFirstJump ? 'normal' : 'doble'})`);
        
        return jumpForce;
    }

    /**
     * Verificar si el jugador puede hacer dash
     * @returns {boolean} True si puede hacer dash
     */
    canDash() {
        return this.isDashAvailable;
    }

    /**
     * Realizar dash
     * @returns {number} Fuerza del dash (0 si no puede hacer dash)
     */
    performDash() {
        if (!this.canDash()) {
            return 0;
        }
        
        // Activar dash
        this.isDashAvailable = false;
        this.lastDashTime = Date.now();
        this.dashCooldownTimer = this.dashCooldown;
        
        this.eventBus.emit('player:ability-used', {
            ability: 'dash',
            force: this.dashForce,
            duration: this.dashDuration,
            cooldown: this.dashCooldown
        });
        
        console.log(`[PlayerAbilities] Dash realizado (fuerza: ${this.dashForce})`);
        
        return this.dashForce;
    }

    /**
     * Resetear saltos disponibles
     */
    resetJumps() {
        if (this.jumpsRemaining < this.maxJumps) {
            this.jumpsRemaining = this.maxJumps;
            
            this.eventBus.emit('player:jumps-reset', {
                jumpsAvailable: this.jumpsRemaining
            });
            
            console.log('[PlayerAbilities] Saltos reseteados');
        }
    }

    /**
     * Resetear dash
     */
    resetDash() {
        this.isDashAvailable = true;
        this.dashCooldownTimer = 0;
        
        this.eventBus.emit('player:dash-reset');
        
        console.log('[PlayerAbilities] Dash reseteado');
    }

    /**
     * Obtener número de saltos realizados
     * @returns {number} Número de saltos
     */
    getJumpCount() {
        return this.jumpCount;
    }

    /**
     * Obtener saltos restantes
     * @returns {number} Saltos restantes
     */
    getJumpsRemaining() {
        return this.jumpsRemaining;
    }

    /**
     * Verificar si el dash está en cooldown
     * @returns {boolean} True si está en cooldown
     */
    isDashOnCooldown() {
        return !this.isDashAvailable;
    }

    /**
     * Obtener tiempo restante de cooldown del dash
     * @returns {number} Tiempo en milisegundos
     */
    getDashCooldownRemaining() {
        return Math.max(0, this.dashCooldownTimer);
    }

    /**
     * Obtener porcentaje de cooldown del dash
     * @returns {number} Porcentaje (0-1)
     */
    getDashCooldownPercentage() {
        if (this.isDashAvailable) return 0;
        return Math.max(0, this.dashCooldownTimer / this.dashCooldown);
    }

    /**
     * Verificar si una habilidad específica está disponible
     * @param {string} ability - Nombre de la habilidad ('jump', 'dash')
     * @returns {boolean} True si está disponible
     */
    isAbilityAvailable(ability) {
        switch (ability) {
            case 'jump':
                return this.jumpsRemaining > 0;
            case 'dash':
                return this.isDashAvailable;
            default:
                return false;
        }
    }

    /**
     * Obtener información de todas las habilidades
     * @returns {Object} Estado de las habilidades
     */
    getAbilitiesInfo() {
        return {
            jump: {
                available: this.jumpsRemaining > 0,
                remaining: this.jumpsRemaining,
                max: this.maxJumps,
                force: this.jumpForce,
                doubleJumpForce: this.doubleJumpForce
            },
            dash: {
                available: this.isDashAvailable,
                cooldownRemaining: this.getDashCooldownRemaining(),
                cooldownPercentage: this.getDashCooldownPercentage(),
                force: this.dashForce,
                duration: this.dashDuration,
                cooldown: this.dashCooldown
            }
        };
    }

    /**
     * Obtener estado actual de las habilidades
     * @returns {Object} Estado de las habilidades
     */
    getState() {
        return {
            jumpsRemaining: this.jumpsRemaining,
            jumpCount: this.jumpCount,
            isDashAvailable: this.isDashAvailable,
            dashCooldownTimer: this.dashCooldownTimer,
            lastDashTime: this.lastDashTime
        };
    }

    /**
     * Forzar uso de habilidad (para testing o efectos especiales)
     * @param {string} ability - Nombre de la habilidad
     * @param {Object} params - Parámetros adicionales
     */
    forceUseAbility(ability, params = {}) {
        switch (ability) {
            case 'jump':
                this.jumpsRemaining = Math.max(0, this.jumpsRemaining - 1);
                this.jumpCount++;
                break;
            case 'dash':
                this.isDashAvailable = false;
                this.dashCooldownTimer = params.cooldown || this.dashCooldown;
                this.lastDashTime = Date.now();
                break;
        }
        
        console.log(`[PlayerAbilities] Habilidad forzada: ${ability}`);
    }

    /**
     * Modificar configuración de habilidades en tiempo real
     * @param {Object} newConfig - Nueva configuración
     */
    updateConfig(newConfig) {
        if (newConfig.maxJumps !== undefined) {
            this.maxJumps = newConfig.maxJumps;
            // Ajustar saltos actuales si es necesario
            this.jumpsRemaining = Math.min(this.jumpsRemaining, this.maxJumps);
        }
        
        if (newConfig.dashForce !== undefined) {
            this.dashForce = newConfig.dashForce;
        }
        
        if (newConfig.dashCooldown !== undefined) {
            this.dashCooldown = newConfig.dashCooldown;
        }
        
        if (newConfig.jumpForce !== undefined) {
            this.jumpForce = newConfig.jumpForce;
        }
        
        if (newConfig.doubleJumpForce !== undefined) {
            this.doubleJumpForce = newConfig.doubleJumpForce;
        }
        
        console.log('[PlayerAbilities] Configuración actualizada');
    }

    /**
     * Resetear todas las habilidades a estado inicial
     */
    reset() {
        this.jumpsRemaining = this.maxJumps;
        this.jumpCount = 0;
        this.isDashAvailable = true;
        this.lastDashTime = 0;
        this.dashCooldownTimer = 0;
        
        console.log('[PlayerAbilities] Habilidades reseteadas');
    }

    /**
     * Obtener información de debug
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            jumpsRemaining: this.jumpsRemaining,
            jumpCount: this.jumpCount,
            maxJumps: this.maxJumps,
            isDashAvailable: this.isDashAvailable,
            dashCooldownTimer: this.dashCooldownTimer,
            dashCooldownPercentage: this.getDashCooldownPercentage(),
            lastDashTime: this.lastDashTime,
            abilities: this.getAbilitiesInfo()
        };
    }

    /**
     * Actualizar buffer de entrada para una habilidad
     * @param {string} ability - Nombre de la habilidad
     */
    bufferInput(ability) {
        if (this.inputBuffer[ability]) {
            this.inputBuffer[ability].pressed = true;
            this.inputBuffer[ability].time = Date.now();
        }
    }

    /**
     * Verificar si hay entrada buffereada para una habilidad
     * @param {string} ability - Nombre de la habilidad
     * @returns {boolean} True si hay entrada buffereada válida
     */
    hasBufferedInput(ability) {
        const buffer = this.inputBuffer[ability];
        if (!buffer || !buffer.pressed) return false;
        
        const timeSinceInput = Date.now() - buffer.time;
        return timeSinceInput <= buffer.buffer;
    }

    /**
     * Consumir entrada buffereada
     * @param {string} ability - Nombre de la habilidad
     */
    consumeBufferedInput(ability) {
        if (this.inputBuffer[ability]) {
            this.inputBuffer[ability].pressed = false;
            this.inputBuffer[ability].time = 0;
        }
    }

    /**
     * Verificar y ejecutar combos de habilidades
     * @param {string} currentAbility - Habilidad actual
     * @returns {Object} Información del combo
     */
    checkCombo(currentAbility) {
        const now = Date.now();
        const timeSinceLastAbility = now - this.comboState.lastAbilityTime;
        
        let comboInfo = {
            isCombo: false,
            type: 'none',
            multiplier: 1.0
        };
        
        // Verificar si estamos dentro de la ventana de combo
        if (timeSinceLastAbility <= this.comboState.comboWindow && 
            this.comboState.lastAbilityUsed !== null) {
            
            const lastAbility = this.comboState.lastAbilityUsed;
            
            // Combo Jump -> Dash
            if (lastAbility === 'jump' && currentAbility === 'dash') {
                comboInfo = {
                    isCombo: true,
                    type: 'jump-dash',
                    multiplier: 1.3
                };
                this.comboState.comboCount++;
            }
            // Combo Dash -> Jump
            else if (lastAbility === 'dash' && currentAbility === 'jump') {
                comboInfo = {
                    isCombo: true,
                    type: 'dash-jump',
                    multiplier: 1.2
                };
                this.comboState.comboCount++;
            }
        } else {
            // Reset combo si ha pasado mucho tiempo
            this.comboState.comboCount = 0;
        }
        
        // Actualizar estado del combo
        this.comboState.lastAbilityUsed = currentAbility;
        this.comboState.lastAbilityTime = now;
        
        if (comboInfo.isCombo) {
            this.eventBus.emit('player:combo-performed', {
                type: comboInfo.type,
                multiplier: comboInfo.multiplier,
                comboCount: this.comboState.comboCount
            });
            
            console.log(`[PlayerAbilities] Combo realizado: ${comboInfo.type} (x${comboInfo.multiplier})`);
        }
        
        return comboInfo;
    }

    /**
     * Aplicar modificadores temporales a las habilidades
     * @param {Object} modifiers - Modificadores a aplicar
     * @param {number} duration - Duración en milisegundos
     */
    applyTemporaryModifiers(modifiers, duration = 5000) {
        // Guardar modificadores anteriores
        const previousModifiers = { ...this.modifiers };
        
        // Aplicar nuevos modificadores
        Object.assign(this.modifiers, modifiers);
        
        this.eventBus.emit('player:modifiers-applied', {
            modifiers: modifiers,
            duration: duration
        });
        
        // Restaurar modificadores después del tiempo especificado
        setTimeout(() => {
            this.modifiers = previousModifiers;
            this.eventBus.emit('player:modifiers-expired', {
                modifiers: modifiers
            });
        }, duration);
        
        console.log(`[PlayerAbilities] Modificadores aplicados por ${duration}ms:`, modifiers);
    }

    /**
     * Verificar si el jugador puede realizar una habilidad específica con condiciones avanzadas
     * @param {string} ability - Nombre de la habilidad
     * @param {Object} context - Contexto adicional (estado del jugador, etc.)
     * @returns {Object} Información de disponibilidad
     */
    getAbilityAvailability(ability, context = {}) {
        const availability = {
            available: false,
            reason: 'unknown',
            cooldownRemaining: 0,
            requirements: []
        };
        
        switch (ability) {
            case 'jump':
                availability.available = this.canJump(context.isGrounded);
                availability.reason = availability.available ? 'ready' : 
                    (this.jumpsRemaining <= 0 ? 'no_jumps' : 'grounded_required');
                availability.requirements = ['jumps_remaining'];
                break;
                
            case 'dash':
                availability.available = this.canDash();
                availability.reason = availability.available ? 'ready' : 'cooldown';
                availability.cooldownRemaining = this.getDashCooldownRemaining();
                availability.requirements = ['dash_cooldown'];
                break;
                
            case 'double_jump':
                availability.available = this.jumpsRemaining > 0 && this.jumpsRemaining < this.maxJumps;
                availability.reason = availability.available ? 'ready' : 
                    (this.jumpsRemaining >= this.maxJumps ? 'first_jump_required' : 'no_jumps');
                availability.requirements = ['airborne', 'jumps_remaining'];
                break;
        }
        
        return availability;
    }

    /**
     * Obtener estadísticas avanzadas de habilidades
     * @returns {Object} Estadísticas detalladas
     */
    getAdvancedStats() {
        return {
            basic: this.getAbilitiesInfo(),
            combo: {
                lastAbilityUsed: this.comboState.lastAbilityUsed,
                comboCount: this.comboState.comboCount,
                timeSinceLastAbility: Date.now() - this.comboState.lastAbilityTime
            },
            inputBuffer: {
                jump: {
                    buffered: this.hasBufferedInput('jump'),
                    timeRemaining: this.inputBuffer.jump.pressed ? 
                        Math.max(0, this.inputBuffer.jump.buffer - (Date.now() - this.inputBuffer.jump.time)) : 0
                },
                dash: {
                    buffered: this.hasBufferedInput('dash'),
                    timeRemaining: this.inputBuffer.dash.pressed ? 
                        Math.max(0, this.inputBuffer.dash.buffer - (Date.now() - this.inputBuffer.dash.time)) : 0
                }
            },
            modifiers: { ...this.modifiers }
        };
    }

    /**
     * Limpiar recursos
     */
    destroy() {
        // Limpiar timers si los hay
        this.comboState = null;
        this.inputBuffer = null;
        this.modifiers = null;
        
        console.log('[PlayerAbilities] Módulo destruido');
    }
}