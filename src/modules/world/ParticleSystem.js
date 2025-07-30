/**
 * ParticleSystem - Sistema de partículas para efectos atmosféricos
 * @module ParticleSystem
 */

export class ParticleSystem {
    /**
     * Crea una nueva instancia del ParticleSystem
     * @param {Object} config - Configuración del sistema de partículas
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isInitialized = false;
        
        // Pools de partículas por tipo
        this.particlePools = new Map();
        this.activeParticles = new Map();
        
        // Tipos de partículas disponibles
        this.particleTypes = {
            dust: { maxCount: 30, spawnRate: 0.1 },
            spark: { maxCount: 15, spawnRate: 0.05 },
            smoke: { maxCount: 20, spawnRate: 0.08 },
            energy: { maxCount: 10, spawnRate: 0.03 },
            debris: { maxCount: 25, spawnRate: 0.12 }
        };
        
        // Configuración de emisores
        this.emitters = [];
        this.time = 0;
        
        console.log('[ParticleSystem] Instancia creada');
    }

    /**
     * Inicializar el sistema de partículas
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {EventBus} eventBus - Bus de eventos
     * @param {Object} config - Configuración del juego
     */
    init(ctx, eventBus, config) {
        if (this.isInitialized) {
            console.warn('[ParticleSystem] Ya está inicializado');
            return;
        }

        this.ctx = ctx;
        this.canvasWidth = ctx.canvas.width;
        this.canvasHeight = ctx.canvas.height;
        
        // Inicializar pools de partículas
        this.initializeParticlePools();
        
        // Crear emisores atmosféricos
        this.createAtmosphericEmitters();
        
        this.isInitialized = true;
        console.log('[ParticleSystem] Inicializado correctamente');
    }

    /**
     * Inicializar pools de partículas
     * @private
     */
    initializeParticlePools() {
        Object.entries(this.particleTypes).forEach(([type, config]) => {
            const pool = [];
            const active = [];
            
            // Pre-crear partículas en el pool
            for (let i = 0; i < config.maxCount; i++) {
                pool.push(this.createParticle(type));
            }
            
            this.particlePools.set(type, pool);
            this.activeParticles.set(type, active);
        });
        
        console.log(`[ParticleSystem] Pools inicializados para ${this.particlePools.size} tipos`);
    }

    /**
     * Crear emisores atmosféricos
     * @private
     */
    createAtmosphericEmitters() {
        // Emisor de polvo industrial
        this.emitters.push({
            type: 'dust',
            x: this.canvasWidth + 50,
            y: this.canvasHeight * 0.7,
            width: 100,
            height: this.canvasHeight * 0.3,
            spawnRate: 0.1,
            lastSpawn: 0,
            isActive: true
        });
        
        // Emisor de chispas eléctricas
        this.emitters.push({
            type: 'spark',
            x: this.canvasWidth * 0.8,
            y: 50,
            width: 200,
            height: 100,
            spawnRate: 0.05,
            lastSpawn: 0,
            isActive: true
        });
        
        // Emisor de humo de chimeneas
        this.emitters.push({
            type: 'smoke',
            x: this.canvasWidth * 0.6,
            y: this.canvasHeight * 0.4,
            width: 50,
            height: 20,
            spawnRate: 0.08,
            lastSpawn: 0,
            isActive: true
        });
        
        console.log(`[ParticleSystem] ${this.emitters.length} emisores creados`);
    }

    /**
     * Crear una partícula del tipo especificado
     * @param {string} type - Tipo de partícula
     * @returns {Object} Partícula creada
     * @private
     */
    createParticle(type) {
        const baseParticle = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            size: 1,
            life: 1.0,
            maxLife: 1.0,
            decay: 0.001,
            color: '#FFFFFF',
            alpha: 1.0,
            rotation: 0,
            rotationSpeed: 0,
            type: type,
            isActive: false
        };
        
        switch (type) {
            case 'dust':
                return {
                    ...baseParticle,
                    size: 1 + Math.random() * 2,
                    life: 3000 + Math.random() * 2000,
                    maxLife: 3000 + Math.random() * 2000,
                    decay: 0.0002 + Math.random() * 0.0003,
                    color: '#A0AEC0',
                    alpha: 0.3 + Math.random() * 0.4
                };
                
            case 'spark':
                return {
                    ...baseParticle,
                    size: 2 + Math.random() * 3,
                    life: 1000 + Math.random() * 1500,
                    maxLife: 1000 + Math.random() * 1500,
                    decay: 0.001 + Math.random() * 0.002,
                    color: '#FFD700',
                    alpha: 0.8 + Math.random() * 0.2,
                    rotationSpeed: (Math.random() - 0.5) * 0.1
                };
                
            case 'smoke':
                return {
                    ...baseParticle,
                    size: 3 + Math.random() * 5,
                    life: 4000 + Math.random() * 3000,
                    maxLife: 4000 + Math.random() * 3000,
                    decay: 0.0001 + Math.random() * 0.0002,
                    color: '#CBD5E0',
                    alpha: 0.2 + Math.random() * 0.3
                };
                
            case 'energy':
                return {
                    ...baseParticle,
                    size: 1 + Math.random() * 2,
                    life: 2000 + Math.random() * 1000,
                    maxLife: 2000 + Math.random() * 1000,
                    decay: 0.0005 + Math.random() * 0.0005,
                    color: '#9F7AEA',
                    alpha: 0.6 + Math.random() * 0.4,
                    rotationSpeed: (Math.random() - 0.5) * 0.2
                };
                
            case 'debris':
                return {
                    ...baseParticle,
                    size: 2 + Math.random() * 4,
                    life: 2500 + Math.random() * 2000,
                    maxLife: 2500 + Math.random() * 2000,
                    decay: 0.0003 + Math.random() * 0.0004,
                    color: '#4A5568',
                    alpha: 0.5 + Math.random() * 0.3,
                    rotationSpeed: (Math.random() - 0.5) * 0.15
                };
                
            default:
                return baseParticle;
        }
    }

    /**
     * Obtener partícula del pool
     * @param {string} type - Tipo de partícula
     * @returns {Object|null} Partícula del pool o null
     * @private
     */
    getParticleFromPool(type) {
        const pool = this.particlePools.get(type);
        if (pool && pool.length > 0) {
            return pool.pop();
        }
        return null;
    }

    /**
     * Devolver partícula al pool
     * @param {Object} particle - Partícula a devolver
     * @private
     */
    returnParticleToPool(particle) {
        particle.isActive = false;
        particle.life = particle.maxLife;
        particle.alpha = 1.0;
        particle.rotation = 0;
        
        const pool = this.particlePools.get(particle.type);
        if (pool) {
            pool.push(particle);
        }
    }

    /**
     * Emitir partícula desde un emisor
     * @param {Object} emitter - Emisor de partículas
     * @private
     */
    emitParticle(emitter) {
        const particle = this.getParticleFromPool(emitter.type);
        if (!particle) return;
        
        // Posición inicial aleatoria dentro del emisor
        particle.x = emitter.x + Math.random() * emitter.width;
        particle.y = emitter.y + Math.random() * emitter.height;
        
        // Velocidad basada en el tipo de partícula
        switch (emitter.type) {
            case 'dust':
                particle.vx = -1 - Math.random() * 2;
                particle.vy = -0.5 + Math.random() * 1;
                break;
                
            case 'spark':
                particle.vx = -2 - Math.random() * 3;
                particle.vy = -1 + Math.random() * 2;
                break;
                
            case 'smoke':
                particle.vx = -0.5 - Math.random() * 1;
                particle.vy = -2 - Math.random() * 2;
                break;
                
            case 'energy':
                particle.vx = -1.5 - Math.random() * 2.5;
                particle.vy = -0.8 + Math.random() * 1.6;
                break;
                
            case 'debris':
                particle.vx = -2 - Math.random() * 4;
                particle.vy = -1 + Math.random() * 2;
                break;
        }
        
        particle.isActive = true;
        
        const activeParticles = this.activeParticles.get(emitter.type);
        if (activeParticles) {
            activeParticles.push(particle);
        }
    }

    /**
     * Actualizar el sistema de partículas
     * @param {number} deltaTime - Tiempo transcurrido
     * @param {number} scrollOffset - Offset de scroll del mundo
     */
    update(deltaTime, scrollOffset) {
        if (!this.isInitialized) return;
        
        this.time += deltaTime;
        
        // Actualizar emisores
        this.updateEmitters(deltaTime, scrollOffset);
        
        // Actualizar partículas activas
        this.updateActiveParticles(deltaTime);
    }

    /**
     * Actualizar emisores
     * @param {number} deltaTime - Tiempo transcurrido
     * @param {number} scrollOffset - Offset de scroll
     * @private
     */
    updateEmitters(deltaTime, scrollOffset) {
        this.emitters.forEach(emitter => {
            if (!emitter.isActive) return;
            
            // Mover emisor con el scroll (parallax)
            emitter.x -= scrollOffset * 0.1;
            
            // Reposicionar emisor si sale de pantalla
            if (emitter.x + emitter.width < -100) {
                emitter.x = this.canvasWidth + 50;
            }
            
            // Verificar si es tiempo de emitir
            emitter.lastSpawn += deltaTime;
            const spawnInterval = 1000 / (emitter.spawnRate * 60); // 60fps base
            
            if (emitter.lastSpawn >= spawnInterval) {
                this.emitParticle(emitter);
                emitter.lastSpawn = 0;
            }
        });
    }

    /**
     * Actualizar partículas activas
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updateActiveParticles(deltaTime) {
        this.activeParticles.forEach((particles, type) => {
            for (let i = particles.length - 1; i >= 0; i--) {
                const particle = particles[i];
                
                // Actualizar posición
                particle.x += particle.vx * (deltaTime / 16.67);
                particle.y += particle.vy * (deltaTime / 16.67);
                
                // Actualizar rotación
                particle.rotation += particle.rotationSpeed * deltaTime;
                
                // Aplicar efectos ambientales
                this.applyEnvironmentalEffects(particle, deltaTime);
                
                // Reducir vida
                particle.life -= particle.decay * deltaTime;
                particle.alpha = Math.max(0, particle.life / particle.maxLife);
                
                // Remover partícula si está muerta o fuera de pantalla
                if (particle.life <= 0 || particle.x < -50 || particle.y > this.canvasHeight + 50) {
                    particles.splice(i, 1);
                    this.returnParticleToPool(particle);
                }
            }
        });
    }

    /**
     * Aplicar efectos ambientales a las partículas
     * @param {Object} particle - Partícula
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    applyEnvironmentalEffects(particle, deltaTime) {
        // Gravedad sutil
        particle.vy += 0.01 * (deltaTime / 16.67);
        
        // Turbulencia atmosférica
        const turbulence = Math.sin(this.time * 0.001 + particle.x * 0.01) * 0.1;
        particle.vy += turbulence * (deltaTime / 16.67);
        
        // Resistencia del aire
        particle.vx *= 0.999;
        particle.vy *= 0.999;
        
        // Efectos específicos por tipo
        switch (particle.type) {
            case 'smoke':
                // El humo se expande y sube
                particle.size += 0.01 * (deltaTime / 16.67);
                particle.vy -= 0.02 * (deltaTime / 16.67);
                break;
                
            case 'spark':
                // Las chispas parpadean
                particle.alpha *= 0.8 + Math.sin(this.time * 0.01) * 0.2;
                break;
                
            case 'energy':
                // Las partículas de energía pulsan
                const pulse = Math.sin(this.time * 0.005 + particle.x * 0.1);
                particle.size = particle.size * (0.8 + pulse * 0.2);
                break;
        }
    }

    /**
     * Renderizar el sistema de partículas
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    render(ctx) {
        if (!this.isInitialized) return;
        
        ctx.save();
        
        // Renderizar partículas por tipo (orden de profundidad)
        const renderOrder = ['smoke', 'dust', 'debris', 'energy', 'spark'];
        
        renderOrder.forEach(type => {
            const particles = this.activeParticles.get(type);
            if (particles) {
                this.renderParticleType(ctx, particles, type);
            }
        });
        
        ctx.restore();
    }

    /**
     * Renderizar partículas de un tipo específico
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Array} particles - Partículas a renderizar
     * @param {string} type - Tipo de partícula
     * @private
     */
    renderParticleType(ctx, particles, type) {
        particles.forEach(particle => {
            if (!particle.isActive || particle.alpha <= 0) return;
            
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation);
            
            switch (type) {
                case 'dust':
                case 'debris':
                    this.renderSolidParticle(ctx, particle);
                    break;
                    
                case 'spark':
                case 'energy':
                    this.renderGlowParticle(ctx, particle);
                    break;
                    
                case 'smoke':
                    this.renderSmokeParticle(ctx, particle);
                    break;
            }
            
            ctx.restore();
        });
    }

    /**
     * Renderizar partícula sólida
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} particle - Partícula
     * @private
     */
    renderSolidParticle(ctx, particle) {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Renderizar partícula con brillo
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} particle - Partícula
     * @private
     */
    renderGlowParticle(ctx, particle) {
        // Brillo exterior
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = particle.size * 3;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Núcleo brillante
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, particle.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Renderizar partícula de humo
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} particle - Partícula
     * @private
     */
    renderSmokeParticle(ctx, particle) {
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'rgba(203, 213, 224, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Crear explosión de partículas
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {string} type - Tipo de partícula
     * @param {number} count - Cantidad de partículas
     */
    createExplosion(x, y, type = 'spark', count = 10) {
        for (let i = 0; i < count; i++) {
            const particle = this.getParticleFromPool(type);
            if (!particle) continue;
            
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = 2 + Math.random() * 4;
            
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.isActive = true;
            
            const activeParticles = this.activeParticles.get(type);
            if (activeParticles) {
                activeParticles.push(particle);
            }
        }
    }

    /**
     * Obtener estadísticas del sistema de partículas
     * @returns {Object} Estadísticas
     */
    getStats() {
        const stats = {
            isInitialized: this.isInitialized,
            emitterCount: this.emitters.length,
            totalActiveParticles: 0,
            particlesByType: {}
        };
        
        this.activeParticles.forEach((particles, type) => {
            const count = particles.length;
            stats.particlesByType[type] = count;
            stats.totalActiveParticles += count;
        });
        
        return stats;
    }

    /**
     * Limpiar recursos del sistema de partículas
     */
    destroy() {
        if (!this.isInitialized) return;
        
        // Limpiar todas las partículas
        this.activeParticles.forEach(particles => particles.length = 0);
        this.particlePools.forEach(pool => pool.length = 0);
        
        this.emitters = [];
        this.activeParticles.clear();
        this.particlePools.clear();
        
        this.isInitialized = false;
        console.log('[ParticleSystem] Sistema destruido');
    }
}