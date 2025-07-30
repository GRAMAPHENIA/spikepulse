/**
 * PlayerRenderer - Módulo de renderizado del jugador
 * @module PlayerRenderer
 */

export class PlayerRenderer {
    /**
     * Crea una nueva instancia de PlayerRenderer
     * @param {Object} config - Configuración visual
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        
        // Configuración visual
        this.color = config.color || '#FFD700';
        this.glowColor = config.glowColor || '#FFA500';
        this.dashColor = config.dashColor || '#FF6B6B';
        this.gravityColor = config.gravityColor || '#9F7AEA';
        
        // Estado de renderizado
        this.rotation = 0;
        this.scale = 1;
        this.opacity = 1;
        this.glowIntensity = 0.5;
        
        // Efectos visuales
        this.pulseTimer = 0;
        this.dashTrail = [];
        this.maxTrailLength = 8;
        this.trailFadeSpeed = 0.1;
        
        // Sistema de partículas
        this.particles = [];
        this.maxParticles = 20;
        
        // Efectos especiales
        this.specialEffects = {
            landing: { active: false, timer: 0, duration: 300 },
            combo: { active: false, timer: 0, duration: 500, type: 'none' },
            gravityChange: { active: false, timer: 0, duration: 400 },
            death: { active: false, timer: 0, duration: 1000 }
        };
        
        // Animaciones
        this.animationState = 'idle';
        this.animationTimer = 0;
        this.rotationSpeed = 0;
        
        console.log('[PlayerRenderer] Instancia creada');
    }

    /**
     * Inicializar el módulo de renderizado
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    init(ctx) {
        this.ctx = ctx;
        this.reset();
        this.setupEffectListeners();
        
        console.log('[PlayerRenderer] Inicializado');
    }

    /**
     * Renderizar el jugador
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} position - Posición del jugador
     * @param {Object} size - Tamaño del jugador
     * @param {Object} state - Estado del jugador
     * @param {Object} abilitiesState - Estado de las habilidades
     */
    render(ctx, position, size, state, abilitiesState) {
        // Actualizar efectos visuales
        this.updateVisualEffects(state, abilitiesState);
        
        // Actualizar partículas
        this.updateParticles(16); // Aproximadamente 60fps
        
        // Actualizar efectos especiales
        this.updateSpecialEffects(16);
        
        // Renderizar partículas (detrás del jugador)
        this.renderParticles(ctx);
        
        if (!state.isAlive) {
            this.renderDeathEffect(ctx, position, size);
            return;
        }

        // Renderizar trail del dash
        if (state.isDashing) {
            this.renderDashTrail(ctx, position, size);
        }
        
        // Renderizar el jugador principal
        this.renderPlayer(ctx, position, size, state);
        
        // Renderizar efectos adicionales
        this.renderEffects(ctx, position, size, state, abilitiesState);
        
        // Renderizar efectos especiales
        this.renderSpecialEffects(ctx, position, size);
    }

    /**
     * Actualizar efectos visuales
     * @param {Object} state - Estado del jugador
     * @param {Object} abilitiesState - Estado de las habilidades
     * @private
     */
    updateVisualEffects(state, abilitiesState) {
        // Actualizar timer de pulso
        this.pulseTimer += 16; // Aproximadamente 60fps
        
        // Actualizar rotación basada en movimiento
        if (state.isDashing) {
            this.rotationSpeed = 0.3;
            this.animationState = 'dashing';
        } else if (!state.isGrounded) {
            this.rotationSpeed = 0.1;
            this.animationState = 'jumping';
        } else {
            this.rotationSpeed = 0.05;
            this.animationState = 'idle';
        }
        
        this.rotation += this.rotationSpeed;
        
        // Actualizar escala basada en estado
        if (state.isDashing) {
            this.scale = 1.2;
        } else if (!state.isGrounded) {
            this.scale = 1.1;
        } else {
            this.scale = 1.0;
        }
        
        // Actualizar intensidad del glow
        this.glowIntensity = 0.5 + Math.sin(this.pulseTimer * 0.01) * 0.3;
        
        // Actualizar trail del dash
        if (state.isDashing) {
            this.updateDashTrail(state.position || { x: 0, y: 0 });
        } else {
            this.fadeDashTrail();
        }
    }

    /**
     * Renderizar el jugador principal
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} position - Posición del jugador
     * @param {Object} size - Tamaño del jugador
     * @param {Object} state - Estado del jugador
     * @private
     */
    renderPlayer(ctx, position, size, state) {
        ctx.save();
        
        // Trasladar al centro del jugador
        const centerX = position.x + size.width / 2;
        const centerY = position.y + size.height / 2;
        ctx.translate(centerX, centerY);
        
        // Aplicar escala
        ctx.scale(this.scale, this.scale);
        
        // Aplicar rotación
        ctx.rotate(this.rotation);
        
        // Determinar color basado en estado
        let currentColor = this.color;
        if (state.isDashing) {
            currentColor = this.dashColor;
        } else if (state.isInverted) {
            currentColor = this.gravityColor;
        }
        
        // Renderizar glow
        this.renderGlow(ctx, size, currentColor);
        
        // Renderizar cuerpo principal
        this.renderBody(ctx, size, currentColor, state);
        
        // Renderizar detalles
        this.renderDetails(ctx, size, state);
        
        ctx.restore();
    }

    /**
     * Renderizar efecto de glow
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} size - Tamaño del jugador
     * @param {string} color - Color del glow
     * @private
     */
    renderGlow(ctx, size, color) {
        const glowSize = Math.max(size.width, size.height) * 1.5;
        const glowRadius = glowSize / 2;
        
        // Crear gradiente radial para el glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
        gradient.addColorStop(0, `${color}${Math.floor(this.glowIntensity * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(0.5, `${color}${Math.floor(this.glowIntensity * 128).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${color}00`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(-glowRadius, -glowRadius, glowSize, glowSize);
    }

    /**
     * Renderizar cuerpo principal del jugador
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} size - Tamaño del jugador
     * @param {string} color - Color principal
     * @param {Object} state - Estado del jugador
     * @private
     */
    renderBody(ctx, size, color, state) {
        const halfWidth = size.width / 2;
        const halfHeight = size.height / 2;
        
        // Cuerpo principal (cubo con bordes redondeados)
        ctx.fillStyle = color;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        
        // Dibujar cubo con esquinas redondeadas
        const radius = 4;
        ctx.beginPath();
        ctx.roundRect(-halfWidth, -halfHeight, size.width, size.height, radius);
        ctx.fill();
        ctx.stroke();
        
        // Efecto de brillo interno
        const innerGradient = ctx.createLinearGradient(-halfWidth, -halfHeight, halfWidth, halfHeight);
        innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        innerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.roundRect(-halfWidth, -halfHeight, size.width, size.height, radius);
        ctx.fill();
    }

    /**
     * Renderizar detalles del jugador
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} size - Tamaño del jugador
     * @param {Object} state - Estado del jugador
     * @private
     */
    renderDetails(ctx, size, state) {
        const halfWidth = size.width / 2;
        const halfHeight = size.height / 2;
        
        // Indicador de gravedad
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const gravitySymbol = state.isInverted ? '↑' : '↓';
        ctx.fillText(gravitySymbol, 0, 0);
        
        // Líneas de detalle (patrón de Spikepulse)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        
        // Líneas diagonales
        ctx.beginPath();
        ctx.moveTo(-halfWidth * 0.5, -halfHeight * 0.5);
        ctx.lineTo(halfWidth * 0.5, halfHeight * 0.5);
        ctx.moveTo(halfWidth * 0.5, -halfHeight * 0.5);
        ctx.lineTo(-halfWidth * 0.5, halfHeight * 0.5);
        ctx.stroke();
    }

    /**
     * Renderizar trail del dash
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} position - Posición actual
     * @param {Object} size - Tamaño del jugador
     * @private
     */
    renderDashTrail(ctx, position, size) {
        if (this.dashTrail.length < 2) return;
        
        ctx.save();
        
        for (let i = 0; i < this.dashTrail.length - 1; i++) {
            const current = this.dashTrail[i];
            const next = this.dashTrail[i + 1];
            
            if (!current || !next) continue;
            
            const alpha = current.alpha * 0.7;
            const width = (size.width * current.scale) * 0.8;
            const height = (size.height * current.scale) * 0.8;
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.dashColor;
            
            ctx.fillRect(
                current.x - width / 2,
                current.y - height / 2,
                width,
                height
            );
        }
        
        ctx.restore();
    }

    /**
     * Actualizar trail del dash
     * @param {Object} position - Posición actual
     * @private
     */
    updateDashTrail(position) {
        // Agregar nueva posición al trail
        this.dashTrail.unshift({
            x: position.x,
            y: position.y,
            alpha: 1.0,
            scale: 1.0,
            time: Date.now()
        });
        
        // Limitar longitud del trail
        if (this.dashTrail.length > this.maxTrailLength) {
            this.dashTrail.pop();
        }
        
        // Actualizar alpha y escala de las posiciones existentes
        for (let i = 0; i < this.dashTrail.length; i++) {
            const trail = this.dashTrail[i];
            const age = i / this.dashTrail.length;
            trail.alpha = 1.0 - age;
            trail.scale = 1.0 - (age * 0.5);
        }
    }

    /**
     * Desvanecer trail del dash
     * @private
     */
    fadeDashTrail() {
        for (let i = this.dashTrail.length - 1; i >= 0; i--) {
            this.dashTrail[i].alpha -= this.trailFadeSpeed;
            
            if (this.dashTrail[i].alpha <= 0) {
                this.dashTrail.splice(i, 1);
            }
        }
    }

    /**
     * Renderizar efectos adicionales
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} position - Posición del jugador
     * @param {Object} size - Tamaño del jugador
     * @param {Object} state - Estado del jugador
     * @param {Object} abilitiesState - Estado de las habilidades
     * @private
     */
    renderEffects(ctx, position, size, state, abilitiesState) {
        // Efecto de salto
        if (!state.isGrounded && abilitiesState.jumpsRemaining < abilitiesState.maxJumps) {
            this.renderJumpEffect(ctx, position, size);
        }
        
        // Efecto de dash cooldown
        if (!abilitiesState.isDashAvailable) {
            this.renderDashCooldownEffect(ctx, position, size, abilitiesState);
        }
        
        // Efecto de gravedad invertida
        if (state.isInverted) {
            this.renderGravityEffect(ctx, position, size);
        }
    }

    /**
     * Renderizar efecto de salto
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} position - Posición del jugador
     * @param {Object} size - Tamaño del jugador
     * @private
     */
    renderJumpEffect(ctx, position, size) {
        ctx.save();
        
        const centerX = position.x + size.width / 2;
        const centerY = position.y + size.height / 2;
        
        // Anillos de energía
        ctx.strokeStyle = `${this.color}80`;
        ctx.lineWidth = 2;
        
        const ringRadius = (size.width + Math.sin(this.pulseTimer * 0.02) * 10) * 0.8;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }

    /**
     * Renderizar efecto de cooldown del dash
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} position - Posición del jugador
     * @param {Object} size - Tamaño del jugador
     * @param {Object} abilitiesState - Estado de las habilidades
     * @private
     */
    renderDashCooldownEffect(ctx, position, size, abilitiesState) {
        ctx.save();
        
        const centerX = position.x + size.width / 2;
        const centerY = position.y + size.height / 2;
        const radius = Math.max(size.width, size.height) * 0.7;
        
        // Círculo de cooldown
        const cooldownPercentage = abilitiesState.dashCooldownPercentage || 0;
        const angle = (1 - cooldownPercentage) * Math.PI * 2 - Math.PI / 2;
        
        ctx.strokeStyle = `${this.dashColor}60`;
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, angle);
        ctx.stroke();
        
        ctx.restore();
    }

    /**
     * Renderizar efecto de gravedad invertida
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} position - Posición del jugador
     * @param {Object} size - Tamaño del jugador
     * @private
     */
    renderGravityEffect(ctx, position, size) {
        ctx.save();
        
        const centerX = position.x + size.width / 2;
        const centerY = position.y + size.height / 2;
        
        // Partículas de gravedad
        ctx.fillStyle = `${this.gravityColor}60`;
        
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + this.pulseTimer * 0.01;
            const distance = size.width * 0.8;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    /**
     * Renderizar efecto de muerte
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} position - Posición del jugador
     * @param {Object} size - Tamaño del jugador
     * @private
     */
    renderDeathEffect(ctx, position, size) {
        ctx.save();
        
        const centerX = position.x + size.width / 2;
        const centerY = position.y + size.height / 2;
        
        // Efecto de explosión
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const length = size.width * 1.5;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + Math.cos(angle) * length,
                centerY + Math.sin(angle) * length
            );
            ctx.stroke();
        }
        
        ctx.restore();
    }

    /**
     * Renderizar efectos especiales
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} position - Posición del jugador
     * @param {Object} size - Tamaño del jugador
     * @private
     */
    renderSpecialEffects(ctx, position, size) {
        const centerX = position.x + size.width / 2;
        const centerY = position.y + size.height / 2;
        
        // Efecto de aterrizaje
        if (this.specialEffects.landing.active) {
            const progress = this.specialEffects.landing.timer / this.specialEffects.landing.duration;
            const alpha = 1 - progress;
            const radius = size.width * (1 + progress * 2);
            
            ctx.save();
            ctx.globalAlpha = alpha * 0.5;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, position.y + size.height, radius, 0, Math.PI, true);
            ctx.stroke();
            ctx.restore();
        }
        
        // Efecto de combo
        if (this.specialEffects.combo.active) {
            const progress = this.specialEffects.combo.timer / this.specialEffects.combo.duration;
            const alpha = 1 - progress;
            const scale = 1 + progress * 0.5;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(centerX, centerY);
            ctx.scale(scale, scale);
            
            // Anillo de combo
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, size.width * 1.2, 0, Math.PI * 2);
            ctx.stroke();
            
            // Texto de combo
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('COMBO!', 0, -size.height);
            
            ctx.restore();
        }
        
        // Efecto de cambio de gravedad
        if (this.specialEffects.gravityChange.active) {
            const progress = this.specialEffects.gravityChange.timer / this.specialEffects.gravityChange.duration;
            const alpha = 1 - progress;
            const rotation = progress * Math.PI * 4;
            
            ctx.save();
            ctx.globalAlpha = alpha * 0.7;
            ctx.translate(centerX, centerY);
            ctx.rotate(rotation);
            
            // Anillos de gravedad
            ctx.strokeStyle = this.gravityColor;
            ctx.lineWidth = 2;
            
            for (let i = 0; i < 3; i++) {
                const radius = size.width * (0.8 + i * 0.3);
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            ctx.restore();
        }
    }

    /**
     * Resetear estado visual
     */
    reset() {
        this.rotation = 0;
        this.scale = 1;
        this.opacity = 1;
        this.glowIntensity = 0.5;
        this.pulseTimer = 0;
        this.dashTrail = [];
        this.particles = [];
        this.animationState = 'idle';
        this.animationTimer = 0;
        this.rotationSpeed = 0;
        
        // Resetear efectos especiales
        Object.keys(this.specialEffects).forEach(effectName => {
            this.specialEffects[effectName].active = false;
            this.specialEffects[effectName].timer = 0;
        });
        
        console.log('[PlayerRenderer] Estado visual reseteado');
    }

    /**
     * Obtener información de debug del renderizado
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            rotation: this.rotation,
            scale: this.scale,
            opacity: this.opacity,
            glowIntensity: this.glowIntensity,
            animationState: this.animationState,
            dashTrailLength: this.dashTrail.length,
            pulseTimer: this.pulseTimer
        };
    }

    /**
     * Crear partícula
     * @param {Object} position - Posición inicial
     * @param {Object} velocity - Velocidad inicial
     * @param {Object} options - Opciones de la partícula
     * @private
     */
    createParticle(position, velocity, options = {}) {
        if (this.particles.length >= this.maxParticles) {
            this.particles.shift(); // Remover la más antigua
        }
        
        const particle = {
            x: position.x,
            y: position.y,
            vx: velocity.x + (Math.random() - 0.5) * 2,
            vy: velocity.y + (Math.random() - 0.5) * 2,
            life: options.life || 1.0,
            maxLife: options.life || 1.0,
            size: options.size || 3,
            color: options.color || this.color,
            gravity: options.gravity || 0.1,
            friction: options.friction || 0.98,
            type: options.type || 'default'
        };
        
        this.particles.push(particle);
    }

    /**
     * Actualizar partículas
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Actualizar posición
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Aplicar física
            particle.vy += particle.gravity;
            particle.vx *= particle.friction;
            particle.vy *= particle.friction;
            
            // Actualizar vida
            particle.life -= deltaTime / 1000;
            
            // Remover partículas muertas
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Renderizar partículas
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @private
     */
    renderParticles(ctx) {
        ctx.save();
        
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            const size = particle.size * alpha;
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            
            if (particle.type === 'spark') {
                // Renderizar como línea brillante
                ctx.strokeStyle = particle.color;
                ctx.lineWidth = size;
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(particle.x - particle.vx * 2, particle.y - particle.vy * 2);
                ctx.stroke();
            } else {
                // Renderizar como círculo
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        ctx.restore();
    }

    /**
     * Activar efecto especial
     * @param {string} effectName - Nombre del efecto
     * @param {Object} options - Opciones del efecto
     */
    activateSpecialEffect(effectName, options = {}) {
        if (this.specialEffects[effectName]) {
            this.specialEffects[effectName].active = true;
            this.specialEffects[effectName].timer = 0;
            
            // Configurar opciones específicas del efecto
            if (effectName === 'combo') {
                this.specialEffects[effectName].type = options.type || 'none';
            }
            
            console.log(`[PlayerRenderer] Efecto especial activado: ${effectName}`);
        }
    }

    /**
     * Actualizar efectos especiales
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updateSpecialEffects(deltaTime) {
        Object.keys(this.specialEffects).forEach(effectName => {
            const effect = this.specialEffects[effectName];
            
            if (effect.active) {
                effect.timer += deltaTime;
                
                if (effect.timer >= effect.duration) {
                    effect.active = false;
                    effect.timer = 0;
                }
            }
        });
    }

    /**
     * Crear efecto de aterrizaje
     * @param {Object} position - Posición del aterrizaje
     * @param {Object} size - Tamaño del jugador
     * @private
     */
    createLandingEffect(position, size) {
        const centerX = position.x + size.width / 2;
        const groundY = position.y + size.height;
        
        // Crear partículas de impacto
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const speed = 3 + Math.random() * 2;
            
            this.createParticle(
                { x: centerX, y: groundY },
                { 
                    x: Math.cos(angle) * speed, 
                    y: Math.sin(angle) * speed - 2 
                },
                {
                    life: 0.5 + Math.random() * 0.3,
                    size: 2 + Math.random() * 2,
                    color: '#FFD700',
                    gravity: 0.2
                }
            );
        }
        
        this.activateSpecialEffect('landing');
    }

    /**
     * Crear efecto de salto
     * @param {Object} position - Posición del salto
     * @param {Object} size - Tamaño del jugador
     * @param {boolean} isDoubleJump - Si es un salto doble
     * @private
     */
    createJumpEffect(position, size, isDoubleJump = false) {
        const centerX = position.x + size.width / 2;
        const centerY = position.y + size.height / 2;
        
        const particleCount = isDoubleJump ? 12 : 6;
        const particleColor = isDoubleJump ? '#9F7AEA' : '#FFD700';
        
        // Crear partículas de salto
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            
            this.createParticle(
                { x: centerX, y: centerY },
                { 
                    x: Math.cos(angle) * speed, 
                    y: Math.sin(angle) * speed 
                },
                {
                    life: 0.4 + Math.random() * 0.4,
                    size: isDoubleJump ? 3 : 2,
                    color: particleColor,
                    gravity: 0.1,
                    type: isDoubleJump ? 'spark' : 'default'
                }
            );
        }
    }

    /**
     * Crear efecto de dash
     * @param {Object} position - Posición del dash
     * @param {Object} size - Tamaño del jugador
     * @private
     */
    createDashEffect(position, size) {
        const centerX = position.x + size.width / 2;
        const centerY = position.y + size.height / 2;
        
        // Crear partículas de dash (hacia atrás)
        for (let i = 0; i < 10; i++) {
            this.createParticle(
                { x: centerX - size.width, y: centerY + (Math.random() - 0.5) * size.height },
                { 
                    x: -3 - Math.random() * 2, 
                    y: (Math.random() - 0.5) * 2 
                },
                {
                    life: 0.3 + Math.random() * 0.2,
                    size: 2 + Math.random(),
                    color: this.dashColor,
                    gravity: 0,
                    friction: 0.95,
                    type: 'spark'
                }
            );
        }
    }

    /**
     * Crear efecto de cambio de gravedad
     * @param {Object} position - Posición del cambio
     * @param {Object} size - Tamaño del jugador
     * @param {boolean} isInverted - Si la gravedad está invertida
     * @private
     */
    createGravityChangeEffect(position, size, isInverted) {
        const centerX = position.x + size.width / 2;
        const centerY = position.y + size.height / 2;
        
        // Crear partículas de gravedad
        for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            
            this.createParticle(
                { x: centerX, y: centerY },
                { 
                    x: Math.cos(angle) * speed, 
                    y: Math.sin(angle) * speed * (isInverted ? -1 : 1)
                },
                {
                    life: 0.6 + Math.random() * 0.4,
                    size: 1 + Math.random() * 2,
                    color: this.gravityColor,
                    gravity: isInverted ? -0.05 : 0.05,
                    friction: 0.99
                }
            );
        }
        
        this.activateSpecialEffect('gravityChange');
    }

    /**
     * Crear efecto de combo
     * @param {Object} position - Posición del combo
     * @param {Object} size - Tamaño del jugador
     * @param {string} comboType - Tipo de combo
     * @private
     */
    createComboEffect(position, size, comboType) {
        const centerX = position.x + size.width / 2;
        const centerY = position.y + size.height / 2;
        
        let comboColor = '#FFFFFF';
        let particleCount = 20;
        
        switch (comboType) {
            case 'jump-dash':
                comboColor = '#FF6B6B';
                break;
            case 'dash-jump':
                comboColor = '#9F7AEA';
                break;
        }
        
        // Crear partículas de combo
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 4 + Math.random() * 3;
            
            this.createParticle(
                { x: centerX, y: centerY },
                { 
                    x: Math.cos(angle) * speed, 
                    y: Math.sin(angle) * speed 
                },
                {
                    life: 0.8 + Math.random() * 0.4,
                    size: 3 + Math.random() * 2,
                    color: comboColor,
                    gravity: 0.05,
                    friction: 0.97,
                    type: 'spark'
                }
            );
        }
        
        this.activateSpecialEffect('combo', { type: comboType });
    }

    /**
     * Configurar listeners de eventos para efectos
     */
    setupEffectListeners() {
        if (!this.eventBus) return;
        
        // Efecto de aterrizaje
        this.eventBus.on('player:landed', (data) => {
            this.createLandingEffect(data.position, { width: 30, height: 30 });
        });
        
        // Efecto de salto
        this.eventBus.on('player:jumped', (data) => {
            this.createJumpEffect(data.position, { width: 30, height: 30 }, data.isDoubleJump);
        });
        
        // Efecto de dash
        this.eventBus.on('player:dashed', (data) => {
            this.createDashEffect(data.position, { width: 30, height: 30 });
        });
        
        // Efecto de cambio de gravedad
        this.eventBus.on('player:gravity-changed', (data) => {
            this.createGravityChangeEffect(data.position, { width: 30, height: 30 }, data.isInverted);
        });
        
        // Efecto de combo
        this.eventBus.on('player:combo-performed', (data) => {
            // Necesitamos la posición del jugador, se puede obtener del último evento
            // Por ahora usamos una posición por defecto
            this.createComboEffect({ x: 100, y: 300 }, { width: 30, height: 30 }, data.type);
        });
    }

    /**
     * Limpiar recursos
     */
    destroy() {
        this.dashTrail = [];
        this.particles = [];
        this.ctx = null;
        
        // Limpiar event listeners si existen
        if (this.eventBus) {
            this.eventBus.offContext(this);
        }
        
        console.log('[PlayerRenderer] Módulo destruido');
    }
}