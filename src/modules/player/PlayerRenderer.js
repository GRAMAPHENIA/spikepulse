/**
 * Sistema de renderizado del jugador para Spikepulse
 * @module PlayerRenderer
 */

export class PlayerRenderer {
    /**
     * Crea una nueva instancia del renderizador del jugador
     * @param {Player} player - Referencia al jugador
     * @param {Object} config - Configuración del juego
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(player, config, eventBus) {
        this.player = player;
        this.config = config;
        this.eventBus = eventBus;
        
        // Configuración visual
        this.visual = {
            color: config.player?.visual?.color || '#FFD700',
            glowColor: config.player?.visual?.glowColor || '#FFD700',
            glowIntensity: config.player?.visual?.glowIntensity || 20,
            trailLength: config.player?.visual?.trailLength || 10
        };
        
        // Estado de renderizado
        this.renderState = {
            position: { x: 0, y: 0 },
            rotation: 0,
            scale: { x: 1, y: 1 },
            alpha: 1,
            glowIntensity: 0,
            pulsePhase: 0
        };
        
        // Efectos de renderizado
        this.effects = {
            invulnerabilityFlash: false,
            dashGlow: false,
            gravityAura: false,
            deathAnimation: false
        };
        
        // Animaciones
        this.animations = {
            pulse: {
                speed: 0.05,
                intensity: 0.1,
                phase: 0
            },
            rotation: {
                speed: 0.02,
                current: 0
            },
            scale: {
                base: { x: 1, y: 1 },
                current: { x: 1, y: 1 },
                target: { x: 1, y: 1 }
            }
        };
        
        console.log('🎨 PlayerRenderer creado');
    }
    
    /**
     * Actualización del renderizador
     * @param {number} deltaTime - Delta time
     * @param {number} interpolation - Factor de interpolación
     */
    update(deltaTime, interpolation) {
        // Actualizar posición de renderizado con interpolación
        this.updateRenderPosition(interpolation);
        
        // Actualizar animaciones
        this.updateAnimations(deltaTime);
        
        // Actualizar efectos
        this.updateEffects(deltaTime);
    }
    
    /**
     * Actualiza la posición de renderizado con interpolación
     * @param {number} interpolation - Factor de interpolación
     */
    updateRenderPosition(interpolation) {
        if (this.player.playerPhysics) {
            const renderPos = this.player.playerPhysics.getRenderPosition();
            this.renderState.position = renderPos;
        } else {
            this.renderState.position = { ...this.player.state.position };
        }
    }
    
    /**
     * Actualiza animaciones
     * @param {number} deltaTime - Delta time
     */
    updateAnimations(deltaTime) {
        // Animación de pulso
        this.animations.pulse.phase += this.animations.pulse.speed;
        if (this.animations.pulse.phase > Math.PI * 2) {
            this.animations.pulse.phase -= Math.PI * 2;
        }
        
        // Animación de rotación sutil
        if (Math.abs(this.player.state.velocity.x) > 1) {
            this.animations.rotation.current += this.animations.rotation.speed * 
                Math.sign(this.player.state.velocity.x);
        }
        
        // Animación de escala
        this.updateScaleAnimation(deltaTime);
    }
    
    /**
     * Actualiza la animación de escala
     * @param {number} deltaTime - Delta time
     */
    updateScaleAnimation(deltaTime) {
        const scale = this.animations.scale;
        
        // Escala base según estado
        if (this.player.playerAbilities?.dash.isDashing) {
            scale.target.x = 1.2;
            scale.target.y = 0.8;
        } else if (this.player.physics.onGround) {
            scale.target.x = 1.0;
            scale.target.y = 1.0;
        } else {
            scale.target.x = 0.9;
            scale.target.y = 1.1;
        }
        
        // Interpolar hacia la escala objetivo
        const lerpSpeed = 0.1;
        scale.current.x += (scale.target.x - scale.current.x) * lerpSpeed;
        scale.current.y += (scale.target.y - scale.current.y) * lerpSpeed;
        
        this.renderState.scale = scale.current;
    }
    
    /**
     * Actualiza efectos visuales
     * @param {number} deltaTime - Delta time
     */
    updateEffects(deltaTime) {
        // Efecto de invulnerabilidad
        this.effects.invulnerabilityFlash = this.player.state.invulnerable && 
            Math.floor(Date.now() / 100) % 2 === 0;
        
        // Efecto de dash
        this.effects.dashGlow = this.player.playerAbilities?.dash.isDashing || false;
        
        // Efecto de aura de gravedad
        this.effects.gravityAura = this.player.physics.gravityInverted;
        
        // Efecto de muerte
        this.effects.deathAnimation = !this.player.state.isAlive;
        
        // Actualizar intensidad de brillo
        this.updateGlowIntensity(deltaTime);
    }
    
    /**
     * Actualiza la intensidad del brillo
     * @param {number} deltaTime - Delta time
     */
    updateGlowIntensity(deltaTime) {
        let targetIntensity = this.visual.glowIntensity;
        
        if (this.effects.dashGlow) {
            targetIntensity *= 2;
        }
        
        if (this.effects.gravityAura) {
            targetIntensity *= 1.5;
        }
        
        if (this.effects.invulnerabilityFlash) {
            targetIntensity *= 0.3;
        }
        
        // Añadir pulso
        const pulseMultiplier = 1 + Math.sin(this.animations.pulse.phase) * this.animations.pulse.intensity;
        targetIntensity *= pulseMultiplier;
        
        // Interpolar suavemente
        this.renderState.glowIntensity += (targetIntensity - this.renderState.glowIntensity) * 0.1;
    }
    
    /**
     * Renderiza el jugador
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    render(ctx) {
        if (!this.player.state.isVisible) return;
        
        ctx.save();
        
        // Aplicar transformaciones
        this.applyTransforms(ctx);
        
        // Renderizar efectos de fondo
        this.renderBackgroundEffects(ctx);
        
        // Renderizar trail
        this.renderTrail(ctx);
        
        // Renderizar cuerpo principal
        this.renderBody(ctx);
        
        // Renderizar efectos de primer plano
        this.renderForegroundEffects(ctx);
        
        // Renderizar partículas
        this.renderParticles(ctx);
        
        ctx.restore();
    }
    
    /**
     * Aplica transformaciones de renderizado
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    applyTransforms(ctx) {
        const pos = this.renderState.position;
        const size = this.player.state.size;
        
        // Trasladar al centro del jugador
        ctx.translate(
            pos.x + size.width / 2,
            pos.y + size.height / 2
        );
        
        // Aplicar rotación
        ctx.rotate(this.animations.rotation.current);
        
        // Aplicar escala
        ctx.scale(this.renderState.scale.x, this.renderState.scale.y);
        
        // Aplicar alpha
        ctx.globalAlpha = this.renderState.alpha;
    }
    
    /**
     * Renderiza efectos de fondo
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    renderBackgroundEffects(ctx) {
        const size = this.player.state.size;
        
        // Aura de gravedad
        if (this.effects.gravityAura) {
            ctx.save();
            
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size.width);
            gradient.addColorStop(0, 'rgba(255, 107, 107, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 107, 107, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(-size.width, -size.height, size.width * 2, size.height * 2);
            
            ctx.restore();
        }
        
        // Brillo de dash
        if (this.effects.dashGlow) {
            ctx.save();
            
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size.width * 1.5);
            gradient.addColorStop(0, 'rgba(159, 122, 234, 0.5)');
            gradient.addColorStop(1, 'rgba(159, 122, 234, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(-size.width * 1.5, -size.height * 1.5, size.width * 3, size.height * 3);
            
            ctx.restore();
        }
    }
    
    /**
     * Renderiza el trail del jugador
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    renderTrail(ctx) {
        const trail = this.player.effects.trail;
        if (trail.length < 2) return;
        
        ctx.save();
        
        // Resetear transformaciones para el trail
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        ctx.strokeStyle = this.visual.color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        for (let i = 1; i < trail.length; i++) {
            const point = trail[i];
            const prevPoint = trail[i - 1];
            
            ctx.globalAlpha = point.alpha * 0.7;
            ctx.lineWidth = 3 * point.alpha;
            
            ctx.beginPath();
            ctx.moveTo(prevPoint.x, prevPoint.y);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    /**
     * Renderiza el cuerpo principal del jugador
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    renderBody(ctx) {
        const size = this.player.state.size;
        
        // Configurar estilo
        let fillColor = this.visual.color;
        
        // Modificar color según efectos
        if (this.effects.invulnerabilityFlash) {
            fillColor = 'rgba(255, 255, 255, 0.5)';
        } else if (this.effects.deathAnimation) {
            fillColor = '#FF6B6B';
        }
        
        // Renderizar sombra/brillo
        if (this.renderState.glowIntensity > 0) {
            ctx.save();
            ctx.shadowColor = this.visual.glowColor;
            ctx.shadowBlur = this.renderState.glowIntensity;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            ctx.fillStyle = fillColor;
            ctx.fillRect(-size.width / 2, -size.height / 2, size.width, size.height);
            
            ctx.restore();
        }
        
        // Renderizar cuerpo principal
        ctx.fillStyle = fillColor;
        ctx.fillRect(-size.width / 2, -size.height / 2, size.width, size.height);
        
        // Renderizar borde
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-size.width / 2, -size.height / 2, size.width, size.height);
        
        // Renderizar detalles adicionales
        this.renderBodyDetails(ctx);
    }
    
    /**
     * Renderiza detalles del cuerpo
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    renderBodyDetails(ctx) {
        const size = this.player.state.size;
        
        // Indicador de dirección
        if (Math.abs(this.player.state.velocity.x) > 0.5) {
            ctx.save();
            
            const direction = Math.sign(this.player.state.velocity.x);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            
            // Pequeña flecha direccional
            ctx.beginPath();
            ctx.moveTo(direction * size.width * 0.2, 0);
            ctx.lineTo(direction * size.width * 0.1, -size.height * 0.1);
            ctx.lineTo(direction * size.width * 0.1, size.height * 0.1);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
        
        // Indicador de gravedad
        if (this.player.physics.gravityInverted) {
            ctx.save();
            
            ctx.fillStyle = '#FF6B6B';
            ctx.font = `${size.height * 0.3}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('↑', 0, 0);
            
            ctx.restore();
        }
    }
    
    /**
     * Renderiza efectos de primer plano
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    renderForegroundEffects(ctx) {
        // Efecto de dash
        if (this.effects.dashGlow) {
            ctx.save();
            
            const size = this.player.state.size;
            ctx.strokeStyle = '#9F7AEA';
            ctx.lineWidth = 4;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(-size.width / 2 - 2, -size.height / 2 - 2, size.width + 4, size.height + 4);
            
            ctx.restore();
        }
    }
    
    /**
     * Renderiza partículas
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    renderParticles(ctx) {
        const particles = this.player.effects.particles;
        if (particles.length === 0) return;
        
        ctx.save();
        
        // Resetear transformaciones para las partículas
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        for (const particle of particles) {
            ctx.save();
            
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    /**
     * Obtiene objetos de renderizado para el sistema de capas
     * @returns {Array} Objetos de renderizado
     */
    getRenderObjects() {
        return [
            {
                layer: 'player',
                zIndex: 0,
                render: (ctx) => this.render(ctx)
            }
        ];
    }
    
    /**
     * Renderiza información de debug
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    renderDebug(ctx) {
        if (!this.config.debug?.enabled) return;
        
        ctx.save();
        
        // Resetear transformaciones
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        const pos = this.renderState.position;
        const size = this.player.state.size;
        
        // Renderizar hitbox
        if (this.config.debug.showHitboxes) {
            const hitbox = this.player.getHitbox();
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
        }
        
        // Renderizar centro
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.arc(pos.x + size.width / 2, pos.y + size.height / 2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Renderizar vector de velocidad
        const center = this.player.getCenter();
        const velocity = this.player.state.velocity;
        
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(center.x + velocity.x * 5, center.y + velocity.y * 5);
        ctx.stroke();
        
        ctx.restore();
    }
    
    /**
     * Resetea el renderizador
     */
    reset() {
        // Reset estado de renderizado
        this.renderState.rotation = 0;
        this.renderState.scale = { x: 1, y: 1 };
        this.renderState.alpha = 1;
        this.renderState.glowIntensity = 0;
        this.renderState.pulsePhase = 0;
        
        // Reset efectos
        this.effects.invulnerabilityFlash = false;
        this.effects.dashGlow = false;
        this.effects.gravityAura = false;
        this.effects.deathAnimation = false;
        
        // Reset animaciones
        this.animations.pulse.phase = 0;
        this.animations.rotation.current = 0;
        this.animations.scale.current = { x: 1, y: 1 };
        this.animations.scale.target = { x: 1, y: 1 };
        
        console.log('🔄 PlayerRenderer reseteado');
    }
    
    /**
     * Obtiene información de debug del renderizador
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            renderState: { ...this.renderState },
            effects: { ...this.effects },
            animations: {
                pulse: { ...this.animations.pulse },
                rotation: { ...this.animations.rotation },
                scale: { ...this.animations.scale }
            },
            visual: { ...this.visual }
        };
    }
    
    /**
     * Limpia recursos del renderizador
     */
    destroy() {
        // No hay recursos específicos que limpiar
        console.log('🧹 PlayerRenderer destruido');
    }
}