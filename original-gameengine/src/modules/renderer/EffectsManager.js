/**
 * EffectsManager - Gestor de efectos visuales optimizado para Spikepulse
 * @module EffectsManager
 */

import { ObjectPool } from '../../utils/ObjectPool.js';

export class EffectsManager {
    /**
     * Crea una nueva instancia de EffectsManager
     * @param {Object} config - Configuración de efectos
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        
        // Efectos activos organizados por tipo
        this.activeEffects = new Map();
        this.effectTypes = ['particles', 'glow', 'trails', 'screen', 'ui'];
        
        // Object pools para diferentes tipos de efectos
        this.particlePool = null;
        this.glowPool = null;
        this.trailPool = null;
        
        // Configuración de optimización
        this.maxParticles = config.maxParticles || 500;
        this.maxGlowEffects = config.maxGlowEffects || 50;
        this.maxTrailSegments = config.maxTrailSegments || 200;
        this.enablePooling = config.enablePooling !== false;
        
        // Métricas de efectos
        this.metrics = {
            particlesActive: 0,
            glowEffectsActive: 0,
            trailsActive: 0,
            screenEffectsActive: 0,
            totalEffectsRendered: 0,
            lastRenderTime: 0
        };
        
        // Inicializar pools y efectos
        this.initializeEffectTypes();
        this.initializeObjectPools();
        
        console.log('[EffectsManager] Inicializado con configuración:', config);
    }

    /**
     * Inicializar tipos de efectos
     * @private
     */
    initializeEffectTypes() {
        this.effectTypes.forEach(type => {
            this.activeEffects.set(type, []);
        });
    }

    /**
     * Inicializar object pools para efectos
     * @private
     */
    initializeObjectPools() {
        if (!this.enablePooling) {
            return;
        }
        
        // Pool de partículas
        this.particlePool = new ObjectPool(
            () => ({
                x: 0, y: 0, vx: 0, vy: 0,
                life: 1, maxLife: 1, size: 1,
                color: '#FFFFFF', alpha: 1,
                gravity: 0, friction: 1,
                type: 'default', active: false
            }),
            (particle) => {
                particle.x = 0; particle.y = 0; particle.vx = 0; particle.vy = 0;
                particle.life = 1; particle.maxLife = 1; particle.size = 1;
                particle.color = '#FFFFFF'; particle.alpha = 1;
                particle.gravity = 0; particle.friction = 1;
                particle.type = 'default'; particle.active = false;
            },
            this.maxParticles
        );
        
        // Pool de efectos de glow
        this.glowPool = new ObjectPool(
            () => ({
                x: 0, y: 0, radius: 10, intensity: 1,
                color: '#FFFFFF', alpha: 1, life: 1,
                maxLife: 1, pulseSpeed: 0, active: false
            }),
            (glow) => {
                glow.x = 0; glow.y = 0; glow.radius = 10; glow.intensity = 1;
                glow.color = '#FFFFFF'; glow.alpha = 1; glow.life = 1;
                glow.maxLife = 1; glow.pulseSpeed = 0; glow.active = false;
            },
            this.maxGlowEffects
        );
        
        // Pool de segmentos de trail
        this.trailPool = new ObjectPool(
            () => ({
                x: 0, y: 0, width: 1, height: 1,
                alpha: 1, color: '#FFFFFF', age: 0,
                maxAge: 1, active: false
            }),
            (segment) => {
                segment.x = 0; segment.y = 0; segment.width = 1; segment.height = 1;
                segment.alpha = 1; segment.color = '#FFFFFF'; segment.age = 0;
                segment.maxAge = 1; segment.active = false;
            },
            this.maxTrailSegments
        );
        
        console.log('[EffectsManager] Object pools inicializados');
    }

    /**
     * Actualizar todos los efectos
     * @param {number} deltaTime - Tiempo transcurrido
     */
    update(deltaTime) {
        this.resetMetrics();
        
        // Actualizar cada tipo de efecto
        this.effectTypes.forEach(type => {
            const effects = this.activeEffects.get(type);
            this.updateEffectType(effects, type, deltaTime);
        });
    }

    /**
     * Actualizar efectos de un tipo específico
     * @param {Array} effects - Array de efectos
     * @param {string} type - Tipo de efecto
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updateEffectType(effects, type, deltaTime) {
        for (let i = effects.length - 1; i >= 0; i--) {
            const effect = effects[i];
            
            if (!effect.active) {
                continue;
            }
            
            // Actualizar efecto según su tipo
            switch (type) {
                case 'particles':
                    this.updateParticle(effect, deltaTime);
                    break;
                case 'glow':
                    this.updateGlowEffect(effect, deltaTime);
                    break;
                case 'trails':
                    this.updateTrailEffect(effect, deltaTime);
                    break;
                case 'screen':
                    this.updateScreenEffect(effect, deltaTime);
                    break;
                case 'ui':
                    this.updateUIEffect(effect, deltaTime);
                    break;
            }
            
            // Remover efectos que han terminado
            if (effect.life <= 0 || !effect.active) {
                this.removeEffectFromArray(effects, i, type);
            }
        }
    }

    /**
     * Actualizar partícula
     * @param {Object} particle - Partícula a actualizar
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updateParticle(particle, deltaTime) {
        const dt = deltaTime / 1000; // Convertir a segundos
        
        // Actualizar posición
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        
        // Aplicar gravedad
        particle.vy += particle.gravity * dt;
        
        // Aplicar fricción
        particle.vx *= particle.friction;
        particle.vy *= particle.friction;
        
        // Actualizar vida
        particle.life -= dt;
        particle.alpha = Math.max(0, particle.life / particle.maxLife);
        
        // Efectos especiales según el tipo
        switch (particle.type) {
            case 'spark':
                particle.size *= 0.98; // Las chispas se encogen
                break;
            case 'smoke':
                particle.size *= 1.02; // El humo se expande
                particle.alpha *= 0.95; // Se desvanece más rápido
                break;
            case 'energy':
                // Efecto de pulso para partículas de energía
                particle.size = particle.baseSize * (1 + Math.sin(Date.now() * 0.01) * 0.2);
                break;
        }
        
        this.metrics.particlesActive++;
    }

    /**
     * Actualizar efecto de glow
     * @param {Object} glow - Efecto de glow
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updateGlowEffect(glow, deltaTime) {
        const dt = deltaTime / 1000;
        
        // Actualizar vida
        glow.life -= dt;
        glow.alpha = Math.max(0, glow.life / glow.maxLife);
        
        // Efecto de pulso si está configurado
        if (glow.pulseSpeed > 0) {
            const pulsePhase = (Date.now() * glow.pulseSpeed * 0.001) % (Math.PI * 2);
            glow.intensity = glow.baseIntensity * (1 + Math.sin(pulsePhase) * 0.3);
        }
        
        this.metrics.glowEffectsActive++;
    }

    /**
     * Actualizar efecto de trail
     * @param {Object} trail - Efecto de trail
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updateTrailEffect(trail, deltaTime) {
        const dt = deltaTime / 1000;
        
        // Actualizar segmentos del trail
        if (trail.segments) {
            for (let i = trail.segments.length - 1; i >= 0; i--) {
                const segment = trail.segments[i];
                segment.age += dt;
                segment.alpha = Math.max(0, 1 - (segment.age / segment.maxAge));
                
                if (segment.alpha <= 0) {
                    // Devolver segmento al pool
                    if (this.trailPool) {
                        this.trailPool.release(segment);
                    }
                    trail.segments.splice(i, 1);
                }
            }
        }
        
        // Actualizar vida del trail
        trail.life -= dt;
        
        this.metrics.trailsActive++;
    }

    /**
     * Actualizar efecto de pantalla
     * @param {Object} effect - Efecto de pantalla
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updateScreenEffect(effect, deltaTime) {
        const dt = deltaTime / 1000;
        
        // Actualizar vida
        effect.life -= dt;
        effect.alpha = Math.max(0, effect.life / effect.maxLife);
        
        // Efectos específicos de pantalla
        switch (effect.type) {
            case 'shake':
                effect.intensity *= 0.95; // Reducir intensidad gradualmente
                break;
            case 'flash':
                effect.alpha = Math.max(0, effect.life / effect.maxLife);
                break;
            case 'fade':
                effect.alpha = effect.fadeIn ? 
                    (1 - effect.life / effect.maxLife) : 
                    (effect.life / effect.maxLife);
                break;
        }
        
        this.metrics.screenEffectsActive++;
    }

    /**
     * Actualizar efecto de UI
     * @param {Object} effect - Efecto de UI
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updateUIEffect(effect, deltaTime) {
        const dt = deltaTime / 1000;
        
        // Actualizar vida
        effect.life -= dt;
        effect.alpha = Math.max(0, effect.life / effect.maxLife);
        
        // Animaciones de UI
        if (effect.animation) {
            const progress = 1 - (effect.life / effect.maxLife);
            
            switch (effect.animation.type) {
                case 'slideIn':
                    effect.x = effect.startX + (effect.targetX - effect.startX) * progress;
                    effect.y = effect.startY + (effect.targetY - effect.startY) * progress;
                    break;
                case 'scale':
                    effect.scale = effect.startScale + (effect.targetScale - effect.startScale) * progress;
                    break;
                case 'rotate':
                    effect.rotation = effect.startRotation + (effect.targetRotation - effect.startRotation) * progress;
                    break;
            }
        }
    }

    /**
     * Renderizar todos los efectos
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} renderState - Estado de renderizado
     */
    render(ctx, renderState) {
        const startTime = performance.now();
        this.metrics.totalEffectsRendered = 0;
        
        // Renderizar efectos en orden específico
        const renderOrder = ['screen', 'glow', 'particles', 'trails', 'ui'];
        
        renderOrder.forEach(type => {
            const effects = this.activeEffects.get(type);
            if (effects && effects.length > 0) {
                this.renderEffectType(ctx, effects, type, renderState);
            }
        });
        
        this.metrics.lastRenderTime = performance.now() - startTime;
    }

    /**
     * Renderizar efectos de un tipo específico
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Array} effects - Array de efectos
     * @param {string} type - Tipo de efecto
     * @param {Object} renderState - Estado de renderizado
     * @private
     */
    renderEffectType(ctx, effects, type, renderState) {
        ctx.save();
        
        effects.forEach(effect => {
            if (!effect.active || effect.alpha <= 0) {
                return;
            }
            
            ctx.save();
            ctx.globalAlpha *= effect.alpha;
            
            switch (type) {
                case 'particles':
                    this.renderParticle(ctx, effect);
                    break;
                case 'glow':
                    this.renderGlowEffect(ctx, effect);
                    break;
                case 'trails':
                    this.renderTrailEffect(ctx, effect);
                    break;
                case 'screen':
                    this.renderScreenEffect(ctx, effect, renderState);
                    break;
                case 'ui':
                    this.renderUIEffect(ctx, effect);
                    break;
            }
            
            ctx.restore();
            this.metrics.totalEffectsRendered++;
        });
        
        ctx.restore();
    }

    /**
     * Renderizar partícula
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} particle - Partícula a renderizar
     * @private
     */
    renderParticle(ctx, particle) {
        switch (particle.type) {
            case 'spark':
                this.renderSparkParticle(ctx, particle);
                break;
            case 'smoke':
                this.renderSmokeParticle(ctx, particle);
                break;
            case 'energy':
                this.renderEnergyParticle(ctx, particle);
                break;
            case 'debris':
                this.renderDebrisParticle(ctx, particle);
                break;
            default:
                this.renderDefaultParticle(ctx, particle);
                break;
        }
    }

    /**
     * Renderizar partícula de chispa
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} particle - Partícula
     * @private
     */
    renderSparkParticle(ctx, particle) {
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = particle.size;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particle.x - particle.vx * 0.1, particle.y - particle.vy * 0.1);
        ctx.stroke();
    }

    /**
     * Renderizar partícula de humo
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} particle - Partícula
     * @private
     */
    renderSmokeParticle(ctx, particle) {
        const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, particle.color + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Renderizar partícula de energía
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} particle - Partícula
     * @private
     */
    renderEnergyParticle(ctx, particle) {
        // Glow exterior
        const glowGradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 2
        );
        glowGradient.addColorStop(0, particle.color);
        glowGradient.addColorStop(0.5, particle.color + '80');
        glowGradient.addColorStop(1, particle.color + '00');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Núcleo brillante
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Renderizar partícula de escombros
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} particle - Partícula
     * @private
     */
    renderDebrisParticle(ctx, particle) {
        ctx.fillStyle = particle.color;
        ctx.fillRect(
            particle.x - particle.size / 2,
            particle.y - particle.size / 2,
            particle.size,
            particle.size
        );
    }

    /**
     * Renderizar partícula por defecto
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} particle - Partícula
     * @private
     */
    renderDefaultParticle(ctx, particle) {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Renderizar efecto de glow
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} glow - Efecto de glow
     * @private
     */
    renderGlowEffect(ctx, glow) {
        const gradient = ctx.createRadialGradient(
            glow.x, glow.y, 0,
            glow.x, glow.y, glow.radius * glow.intensity
        );
        gradient.addColorStop(0, glow.color);
        gradient.addColorStop(0.5, glow.color + '80');
        gradient.addColorStop(1, glow.color + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(glow.x, glow.y, glow.radius * glow.intensity, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Renderizar efecto de trail
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} trail - Efecto de trail
     * @private
     */
    renderTrailEffect(ctx, trail) {
        if (!trail.segments || trail.segments.length < 2) {
            return;
        }
        
        ctx.strokeStyle = trail.color || '#FFFFFF';
        ctx.lineWidth = trail.width || 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(trail.segments[0].x, trail.segments[0].y);
        
        for (let i = 1; i < trail.segments.length; i++) {
            const segment = trail.segments[i];
            ctx.globalAlpha *= segment.alpha;
            ctx.lineTo(segment.x, segment.y);
        }
        
        ctx.stroke();
    }

    /**
     * Renderizar efecto de pantalla
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} effect - Efecto de pantalla
     * @param {Object} renderState - Estado de renderizado
     * @private
     */
    renderScreenEffect(ctx, effect, renderState) {
        switch (effect.type) {
            case 'flash':
                ctx.fillStyle = effect.color || '#FFFFFF';
                ctx.fillRect(0, 0, renderState.canvasWidth || 800, renderState.canvasHeight || 600);
                break;
            case 'fade':
                ctx.fillStyle = effect.color || '#000000';
                ctx.fillRect(0, 0, renderState.canvasWidth || 800, renderState.canvasHeight || 600);
                break;
            case 'vignette':
                this.renderVignetteEffect(ctx, effect, renderState);
                break;
        }
    }

    /**
     * Renderizar efecto de viñeta
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} effect - Efecto de viñeta
     * @param {Object} renderState - Estado de renderizado
     * @private
     */
    renderVignetteEffect(ctx, effect, renderState) {
        const centerX = (renderState.canvasWidth || 800) / 2;
        const centerY = (renderState.canvasHeight || 600) / 2;
        const radius = Math.max(centerX, centerY) * (effect.radius || 1);
        
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius
        );
        gradient.addColorStop(0, (effect.color || '#000000') + '00');
        gradient.addColorStop(0.7, (effect.color || '#000000') + '00');
        gradient.addColorStop(1, effect.color || '#000000');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, renderState.canvasWidth || 800, renderState.canvasHeight || 600);
    }

    /**
     * Renderizar efecto de UI
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} effect - Efecto de UI
     * @private
     */
    renderUIEffect(ctx, effect) {
        ctx.save();
        
        // Aplicar transformaciones
        ctx.translate(effect.x || 0, effect.y || 0);
        if (effect.rotation) {
            ctx.rotate(effect.rotation);
        }
        if (effect.scale) {
            ctx.scale(effect.scale, effect.scale);
        }
        
        // Renderizar según el tipo de efecto de UI
        switch (effect.type) {
            case 'text':
                ctx.font = effect.font || '16px Arial';
                ctx.fillStyle = effect.color || '#FFFFFF';
                ctx.fillText(effect.text || '', 0, 0);
                break;
            case 'icon':
                if (effect.image) {
                    ctx.drawImage(effect.image, 0, 0, effect.width || 32, effect.height || 32);
                }
                break;
        }
        
        ctx.restore();
    }

    /**
     * Remover efecto de un array
     * @param {Array} effects - Array de efectos
     * @param {number} index - Índice del efecto
     * @param {string} type - Tipo de efecto
     * @private
     */
    removeEffectFromArray(effects, index, type) {
        const effect = effects[index];
        
        // Devolver al pool si es aplicable
        if (this.enablePooling) {
            switch (type) {
                case 'particles':
                    if (this.particlePool) {
                        this.particlePool.release(effect);
                    }
                    break;
                case 'glow':
                    if (this.glowPool) {
                        this.glowPool.release(effect);
                    }
                    break;
            }
        }
        
        effects.splice(index, 1);
    }

    /**
     * Resetear métricas del frame
     * @private
     */
    resetMetrics() {
        this.metrics.particlesActive = 0;
        this.metrics.glowEffectsActive = 0;
        this.metrics.trailsActive = 0;
        this.metrics.screenEffectsActive = 0;
        this.metrics.totalEffectsRendered = 0;
    }

    // ===== API PÚBLICA PARA CREAR EFECTOS =====

    /**
     * Crear efecto de partículas
     * @param {Object} config - Configuración del efecto
     * @returns {Object} Efecto creado
     */
    createParticleEffect(config) {
        const particle = this.enablePooling && this.particlePool ? 
            this.particlePool.acquire() : 
            {
                x: 0, y: 0, vx: 0, vy: 0,
                life: 1, maxLife: 1, size: 1,
                color: '#FFFFFF', alpha: 1,
                gravity: 0, friction: 1,
                type: 'default', active: false
            };
        
        // Configurar partícula
        Object.assign(particle, config);
        particle.active = true;
        particle.maxLife = particle.life;
        particle.baseSize = particle.size;
        
        this.activeEffects.get('particles').push(particle);
        return particle;
    }

    /**
     * Crear efecto de glow
     * @param {Object} config - Configuración del efecto
     * @returns {Object} Efecto creado
     */
    createGlowEffect(config) {
        const glow = this.enablePooling && this.glowPool ? 
            this.glowPool.acquire() : 
            {
                x: 0, y: 0, radius: 10, intensity: 1,
                color: '#FFFFFF', alpha: 1, life: 1,
                maxLife: 1, pulseSpeed: 0, active: false
            };
        
        Object.assign(glow, config);
        glow.active = true;
        glow.maxLife = glow.life;
        glow.baseIntensity = glow.intensity;
        
        this.activeEffects.get('glow').push(glow);
        return glow;
    }

    /**
     * Crear efecto de trail
     * @param {Object} config - Configuración del efecto
     * @returns {Object} Efecto creado
     */
    createTrailEffect(config) {
        const trail = {
            segments: [],
            color: config.color || '#FFFFFF',
            width: config.width || 2,
            maxSegments: config.maxSegments || 20,
            life: config.life || 2,
            maxLife: config.life || 2,
            active: true
        };
        
        this.activeEffects.get('trails').push(trail);
        return trail;
    }

    /**
     * Crear efecto de pantalla
     * @param {Object} config - Configuración del efecto
     * @returns {Object} Efecto creado
     */
    createScreenEffect(config) {
        const effect = {
            type: config.type || 'flash',
            color: config.color || '#FFFFFF',
            life: config.life || 0.5,
            maxLife: config.life || 0.5,
            alpha: config.alpha || 1,
            intensity: config.intensity || 1,
            active: true
        };
        
        this.activeEffects.get('screen').push(effect);
        return effect;
    }

    /**
     * Agregar efecto existente
     * @param {Object} effect - Efecto a agregar
     */
    addEffect(effect) {
        const type = effect.effectType || 'particles';
        const effects = this.activeEffects.get(type);
        
        if (effects) {
            effects.push(effect);
        }
    }

    /**
     * Remover efecto por ID
     * @param {string} effectId - ID del efecto
     */
    removeEffect(effectId) {
        this.effectTypes.forEach(type => {
            const effects = this.activeEffects.get(type);
            const index = effects.findIndex(effect => effect.id === effectId);
            
            if (index > -1) {
                this.removeEffectFromArray(effects, index, type);
            }
        });
    }

    /**
     * Limpiar todos los efectos
     */
    clear() {
        this.effectTypes.forEach(type => {
            this.activeEffects.get(type).length = 0;
        });
        
        console.log('[EffectsManager] Todos los efectos limpiados');
    }

    /**
     * Obtener número de efectos activos
     * @returns {number} Número total de efectos activos
     */
    getActiveEffectsCount() {
        let total = 0;
        this.effectTypes.forEach(type => {
            total += this.activeEffects.get(type).length;
        });
        return total;
    }

    /**
     * Obtener métricas de efectos
     * @returns {Object} Métricas
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * Establecer tiempo del último renderizado
     * @param {number} time - Tiempo en milisegundos
     */
    setLastRenderTime(time) {
        this.metrics.lastRenderTime = time;
    }

    /**
     * Crear efecto de distorsión de pantalla
     * @param {Object} config - Con
    destroy() {
        this.clear();
        
        // Limpiar pools
        if (this.particlePool) this.particlePool.clear();
        if (this.glowPool) this.glowPool.clear();
        if (this.trailPool) this.trailPool.clear();
        
        console.log('[EffectsManager] Destruido');
    }
}