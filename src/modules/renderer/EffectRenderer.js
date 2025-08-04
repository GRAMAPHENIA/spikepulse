/**
 * Renderizador de efectos para Spikepulse
 * @module EffectRenderer
 */

export class EffectRenderer {
    /**
     * Crea una nueva instancia del renderizador de efectos
     * @param {Object} config - Configuración de efectos
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isInitialized = false;
        
        // Configuración de efectos
        this.effectConfig = {
            enableParticles: config.enableParticles !== false,
            enablePostProcessing: config.enablePostProcessing !== false,
            enableScreenEffects: config.enableScreenEffects !== false,
            maxParticles: config.maxParticles || 100,
            particlePoolSize: config.particlePoolSize || 200
        };
        
        // Sistemas de efectos
        this.effects = new Map();
        this.particles = [];
        this.screenEffects = [];
        this.postProcessingEffects = [];
        
        // Pool de partículas para optimización
        this.particlePool = [];
        this.activeParticles = [];
        
        // Buffers para post-processing
        this.buffers = {
            main: null,
            temp: null
        };
        
        // Estadísticas
        this.stats = {
            particlesActive: 0,
            particlesPooled: 0,
            effectsActive: 0,
            renderTime: 0
        };
        
        console.log('✨ EffectRenderer creado');
    }
    
    /**
     * Inicializa el renderizador de efectos
     */
    async init() {
        try {
            console.log('🔧 Inicializando EffectRenderer...');
            
            // Inicializar pool de partículas
            this.initParticlePool();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ EffectRenderer inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando EffectRenderer:', error);
            throw error;
        }
    }
    
    /**
     * Inicializa el pool de partículas
     */
    initParticlePool() {
        for (let i = 0; i < this.effectConfig.particlePoolSize; i++) {
            this.particlePool.push(this.createParticle());
        }
        
        console.log(`🎭 Pool de partículas inicializado: ${this.particlePool.length} partículas`);
    }
    
    /**
     * Crea una nueva partícula
     * @returns {Object} Nueva partícula
     */
    createParticle() {
        return {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            life: 1,
            maxLife: 1,
            size: 1,
            color: '#FFFFFF',
            alpha: 1,
            rotation: 0,
            rotationSpeed: 0,
            gravity: 0,
            friction: 1,
            active: false,
            type: 'default',
            data: {}
        };\n    }
    
    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Eventos de efectos
        this.eventBus.on('effect:add', this.addEffect.bind(this));
        this.eventBus.on('effect:remove', this.removeEffect.bind(this));
        this.eventBus.on('effect:clear', this.clearEffects.bind(this));
        
        // Eventos de partículas
        this.eventBus.on('particle:spawn', this.spawnParticle.bind(this));
        this.eventBus.on('particle:burst', this.spawnParticleBurst.bind(this));
        this.eventBus.on('particle:clear', this.clearParticles.bind(this));
        
        // Eventos de screen effects
        this.eventBus.on('screen-effect:add', this.addScreenEffect.bind(this));
        this.eventBus.on('screen-effect:remove', this.removeScreenEffect.bind(this));
        
        console.log('👂 Event listeners de efectos configurados');
    }
    
    /**
     * Actualiza el renderizador de efectos
     * @param {number} deltaTime - Delta time
     */
    update(deltaTime) {
        if (!this.isInitialized) return;
        
        // Actualizar partículas
        this.updateParticles(deltaTime);
        
        // Actualizar efectos
        this.updateEffects(deltaTime);
        
        // Actualizar screen effects
        this.updateScreenEffects(deltaTime);
        
        // Actualizar estadísticas
        this.updateStats();
    }
    
    /**
     * Actualiza las partículas
     * @param {number} deltaTime - Delta time
     */
    updateParticles(deltaTime) {
        if (!this.effectConfig.enableParticles) return;
        
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];
            
            // Actualizar vida
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                // Devolver al pool
                this.releaseParticle(particle);
                this.activeParticles.splice(i, 1);
                continue;
            }
            
            // Actualizar física
            this.updateParticlePhysics(particle, deltaTime);
            
            // Actualizar propiedades visuales
            this.updateParticleVisuals(particle, deltaTime);
        }
    }
    
    /**
     * Actualiza la física de una partícula
     * @param {Object} particle - Partícula a actualizar
     * @param {number} deltaTime - Delta time
     */
    updateParticlePhysics(particle, deltaTime) {
        // Aplicar gravedad
        if (particle.gravity !== 0) {
            particle.vy += particle.gravity * deltaTime * 60;
        }
        
        // Aplicar fricción
        if (particle.friction !== 1) {
            particle.vx *= Math.pow(particle.friction, deltaTime * 60);
            particle.vy *= Math.pow(particle.friction, deltaTime * 60);
        }
        
        // Actualizar posición
        particle.x += particle.vx * deltaTime * 60;
        particle.y += particle.vy * deltaTime * 60;
        
        // Actualizar rotación
        if (particle.rotationSpeed !== 0) {
            particle.rotation += particle.rotationSpeed * deltaTime * 60;
        }
    }
    
    /**
     * Actualiza las propiedades visuales de una partícula
     * @param {Object} particle - Partícula a actualizar
     * @param {number} deltaTime - Delta time
     */
    updateParticleVisuals(particle, deltaTime) {
        // Calcular factor de vida (0 = muerta, 1 = nueva)
        const lifeFactor = particle.life / particle.maxLife;
        
        // Actualizar alpha basado en vida
        particle.alpha = lifeFactor;
        
        // Efectos específicos por tipo
        switch (particle.type) {
            case 'spark':
                particle.size = lifeFactor * particle.data.initialSize;
                break;
                
            case 'smoke':
                particle.size = particle.data.initialSize * (1 + (1 - lifeFactor) * 2);
                particle.alpha = lifeFactor * 0.7;
                break;
                
            case 'explosion':
                particle.size = particle.data.initialSize * (1 + (1 - lifeFactor) * 3);
                break;
                
            case 'trail':
                particle.alpha = lifeFactor * 0.8;
                break;
        }
    }
    
    /**
     * Actualiza los efectos
     * @param {number} deltaTime - Delta time
     */
    updateEffects(deltaTime) {
        for (const [id, effect] of this.effects.entries()) {
            if (effect.update && typeof effect.update === 'function') {
                effect.update(deltaTime);
                
                // Remover efectos que han terminado
                if (effect.finished) {
                    this.effects.delete(id);
                }
            }
        }
    }
    
    /**
     * Actualiza los screen effects
     * @param {number} deltaTime - Delta time
     */
    updateScreenEffects(deltaTime) {
        for (let i = this.screenEffects.length - 1; i >= 0; i--) {
            const effect = this.screenEffects[i];
            
            if (effect.update && typeof effect.update === 'function') {
                effect.update(deltaTime);
                
                // Remover efectos terminados
                if (effect.finished) {
                    this.screenEffects.splice(i, 1);
                }
            }
        }
    }
    
    /**
     * Actualiza las estadísticas
     */
    updateStats() {
        this.stats.particlesActive = this.activeParticles.length;
        this.stats.particlesPooled = this.particlePool.length;
        this.stats.effectsActive = this.effects.size + this.screenEffects.length;
    }
    
    /**
     * Renderiza todos los efectos
     * @param {CanvasRenderingContext2D} ctx - Contexto de canvas
     * @param {number} deltaTime - Delta time
     */
    render(ctx, deltaTime) {
        if (!this.isInitialized) return;
        
        const renderStart = performance.now();
        
        // Renderizar partículas
        if (this.effectConfig.enableParticles) {
            this.renderParticles(ctx);
        }
        
        // Renderizar efectos personalizados
        this.renderCustomEffects(ctx, deltaTime);
        
        // Renderizar screen effects
        if (this.effectConfig.enableScreenEffects) {
            this.renderScreenEffects(ctx, deltaTime);
        }
        
        this.stats.renderTime = performance.now() - renderStart;
    }
    
    /**
     * Renderiza las partículas
     * @param {CanvasRenderingContext2D} ctx - Contexto de canvas
     */
    renderParticles(ctx) {
        ctx.save();
        
        for (const particle of this.activeParticles) {
            this.renderParticle(ctx, particle);
        }
        
        ctx.restore();
    }
    
    /**
     * Renderiza una partícula individual
     * @param {CanvasRenderingContext2D} ctx - Contexto de canvas
     * @param {Object} particle - Partícula a renderizar
     */
    renderParticle(ctx, particle) {
        ctx.save();
        
        // Aplicar transformaciones
        ctx.translate(particle.x, particle.y);
        if (particle.rotation !== 0) {
            ctx.rotate(particle.rotation);
        }
        
        // Aplicar alpha
        ctx.globalAlpha = particle.alpha;
        
        // Renderizar según tipo
        switch (particle.type) {
            case 'spark':
                this.renderSparkParticle(ctx, particle);
                break;
                
            case 'smoke':
                this.renderSmokeParticle(ctx, particle);
                break;
                
            case 'explosion':
                this.renderExplosionParticle(ctx, particle);
                break;
                
            case 'trail':
                this.renderTrailParticle(ctx, particle);
                break;
                
            default:
                this.renderDefaultParticle(ctx, particle);
                break;
        }
        
        ctx.restore();
    }
    
    /**
     * Renderiza una partícula de chispa
     * @param {CanvasRenderingContext2D} ctx - Contexto de canvas
     * @param {Object} particle - Partícula
     */
    renderSparkParticle(ctx, particle) {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Efecto de brillo
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = particle.size * 2;
        ctx.fill();
    }
    
    /**
     * Renderiza una partícula de humo
     * @param {CanvasRenderingContext2D} ctx - Contexto de canvas
     * @param {Object} particle - Partícula
     */
    renderSmokeParticle(ctx, particle) {
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Renderiza una partícula de explosión
     * @param {CanvasRenderingContext2D} ctx - Contexto de canvas
     * @param {Object} particle - Partícula
     */
    renderExplosionParticle(ctx, particle) {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Efecto de explosión con múltiples círculos
        ctx.globalAlpha *= 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Renderiza una partícula de rastro
     * @param {CanvasRenderingContext2D} ctx - Contexto de canvas
     * @param {Object} particle - Partícula
     */
    renderTrailParticle(ctx, particle) {
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = particle.size;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(-particle.vx * 0.1, -particle.vy * 0.1);
        ctx.lineTo(0, 0);
        ctx.stroke();
    }
    
    /**
     * Renderiza una partícula por defecto
     * @param {CanvasRenderingContext2D} ctx - Contexto de canvas
     * @param {Object} particle - Partícula
     */
    renderDefaultParticle(ctx, particle) {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Renderiza efectos personalizados
     * @param {CanvasRenderingContext2D} ctx - Contexto de canvas
     * @param {number} deltaTime - Delta time
     */
    renderCustomEffects(ctx, deltaTime) {
        for (const [id, effect] of this.effects.entries()) {
            if (effect.render && typeof effect.render === 'function') {
                ctx.save();
                effect.render(ctx, deltaTime);
                ctx.restore();
            }
        }
    }
    
    /**
     * Renderiza screen effects
     * @param {CanvasRenderingContext2D} ctx - Contexto de canvas
     * @param {number} deltaTime - Delta time
     */
    renderScreenEffects(ctx, deltaTime) {
        for (const effect of this.screenEffects) {
            if (effect.render && typeof effect.render === 'function') {
                ctx.save();
                effect.render(ctx, deltaTime);
                ctx.restore();
            }
        }
    }
    
    // ===== MANEJO DE EVENTOS =====
    
    /**
     * Añade un efecto
     * @param {Object} data - Datos del efecto
     */
    addEffect(data) {
        const effect = data.effect;
        const id = data.id || `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.effects.set(id, effect);
        
        console.log(`✨ Efecto añadido: ${id}`);
        
        return id;
    }
    
    /**
     * Remueve un efecto
     * @param {Object} data - Datos del efecto
     */
    removeEffect(data) {
        const id = data.id;
        
        if (this.effects.has(id)) {
            this.effects.delete(id);
            console.log(`🗑️ Efecto removido: ${id}`);
        }
    }
    
    /**
     * Limpia todos los efectos
     */
    clearEffects() {
        this.effects.clear();
        console.log('🧹 Todos los efectos limpiados');
    }
    
    /**
     * Genera una partícula
     * @param {Object} data - Datos de la partícula
     */
    spawnParticle(data) {
        if (!this.effectConfig.enableParticles) return;
        if (this.activeParticles.length >= this.effectConfig.maxParticles) return;
        
        const particle = this.acquireParticle();
        if (!particle) return;
        
        // Configurar partícula
        particle.x = data.x || 0;
        particle.y = data.y || 0;
        particle.vx = data.vx || 0;
        particle.vy = data.vy || 0;
        particle.life = data.life || 1;
        particle.maxLife = particle.life;
        particle.size = data.size || 2;
        particle.color = data.color || '#FFFFFF';
        particle.alpha = data.alpha || 1;
        particle.rotation = data.rotation || 0;
        particle.rotationSpeed = data.rotationSpeed || 0;
        particle.gravity = data.gravity || 0;
        particle.friction = data.friction || 1;
        particle.type = data.type || 'default';
        particle.data = data.data || {};
        particle.active = true;
        
        // Datos específicos por tipo
        if (particle.type === 'spark' || particle.type === 'smoke' || particle.type === 'explosion') {
            particle.data.initialSize = particle.size;
        }
        
        this.activeParticles.push(particle);
    }
    
    /**
     * Genera una ráfaga de partículas
     * @param {Object} data - Datos de la ráfaga
     */
    spawnParticleBurst(data) {
        const count = data.count || 10;
        const baseData = { ...data };
        delete baseData.count;
        
        for (let i = 0; i < count; i++) {
            const particleData = { ...baseData };
            
            // Añadir variación aleatoria
            if (data.spread) {
                const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * data.spread;
                const speed = data.speed || 50;
                particleData.vx = Math.cos(angle) * speed * (0.5 + Math.random() * 0.5);
                particleData.vy = Math.sin(angle) * speed * (0.5 + Math.random() * 0.5);
            }
            
            if (data.sizeVariation) {
                particleData.size = (data.size || 2) * (1 + (Math.random() - 0.5) * data.sizeVariation);
            }
            
            if (data.lifeVariation) {
                particleData.life = (data.life || 1) * (1 + (Math.random() - 0.5) * data.lifeVariation);
            }
            
            this.spawnParticle(particleData);
        }
    }
    
    /**
     * Limpia todas las partículas
     */
    clearParticles() {
        // Devolver todas las partículas al pool
        for (const particle of this.activeParticles) {
            this.releaseParticle(particle);
        }
        
        this.activeParticles.length = 0;
        console.log('🧹 Todas las partículas limpiadas');
    }
    
    /**
     * Añade un screen effect
     * @param {Object} data - Datos del efecto
     */
    addScreenEffect(data) {
        this.screenEffects.push(data.effect);
        console.log('📺 Screen effect añadido');
    }
    
    /**
     * Remueve un screen effect
     * @param {Object} data - Datos del efecto
     */
    removeScreenEffect(data) {
        const index = this.screenEffects.indexOf(data.effect);
        if (index !== -1) {
            this.screenEffects.splice(index, 1);
            console.log('🗑️ Screen effect removido');
        }
    }
    
    // ===== GESTIÓN DE POOL =====
    
    /**
     * Obtiene una partícula del pool
     * @returns {Object|null} Partícula o null si no hay disponibles
     */
    acquireParticle() {
        if (this.particlePool.length === 0) {
            // Crear nueva partícula si el pool está vacío
            return this.createParticle();
        }
        
        return this.particlePool.pop();
    }
    
    /**
     * Devuelve una partícula al pool
     * @param {Object} particle - Partícula a devolver
     */
    releaseParticle(particle) {
        // Resetear partícula
        particle.active = false;
        particle.life = 0;
        particle.x = 0;
        particle.y = 0;
        particle.vx = 0;
        particle.vy = 0;
        particle.data = {};
        
        // Devolver al pool si hay espacio
        if (this.particlePool.length < this.effectConfig.particlePoolSize) {
            this.particlePool.push(particle);
        }
    }
    
    // ===== MÉTODOS PÚBLICOS =====
    
    /**
     * Obtiene el número de efectos activos
     * @returns {number} Número de efectos
     */
    getEffectCount() {
        return this.effects.size + this.screenEffects.length;
    }
    
    /**
     * Obtiene estadísticas de efectos
     * @returns {Object} Estadísticas
     */
    getStats() {
        return { ...this.stats };
    }
    
    /**
     * Obtiene información de debug
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            config: { ...this.effectConfig },
            stats: this.getStats(),
            effects: {
                custom: this.effects.size,
                screen: this.screenEffects.length
            },
            particles: {
                active: this.activeParticles.length,
                pooled: this.particlePool.length,
                maxParticles: this.effectConfig.maxParticles
            }
        };
    }
    
    /**
     * Resetea el renderizador de efectos
     */
    reset() {
        console.log('🔄 Reseteando EffectRenderer...');
        
        // Limpiar efectos
        this.clearEffects();
        this.screenEffects.length = 0;
        
        // Limpiar partículas
        this.clearParticles();
        
        // Resetear estadísticas
        this.stats.particlesActive = 0;
        this.stats.effectsActive = 0;
        this.stats.renderTime = 0;
        
        console.log('✅ EffectRenderer reseteado');
    }
    
    /**
     * Limpia recursos del renderizador de efectos
     */
    destroy() {
        console.log('🧹 Destruyendo EffectRenderer...');
        
        // Remover event listeners
        this.eventBus.off('*', this);
        
        // Limpiar todo
        this.reset();
        
        // Limpiar pool
        this.particlePool.length = 0;
        
        this.isInitialized = false;
        
        console.log('✅ EffectRenderer destruido');
    }
}