/**
 * PulseObstacle - Obstáculo con efectos de pulso energético
 * @module PulseObstacle
 */

import { BaseObstacle } from './BaseObstacle.js';

export class PulseObstacle extends BaseObstacle {
    /**
     * Crea una nueva instancia de PulseObstacle
     * @param {Object} config - Configuración del obstáculo
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        super(config, eventBus);
        
        this.type = 'pulse';
        this.color = config.color || '#9F7AEA';
        this.coreColor = '#FFD700';
        this.pulseColor = '#FF6B6B';
        
        // Propiedades específicas del pulse
        this.pulseRadius = 0;
        this.maxPulseRadius = this.width * 1.5;
        this.pulseSpeed = 0.003 + Math.random() * 0.002;
        this.pulseIntensity = 0.8;
        
        // Núcleo energético
        this.coreSize = Math.min(this.width, this.height) * 0.3;
        this.coreX = this.x + this.width / 2;
        this.coreY = this.y + this.height / 2;
        
        // Ondas de energía
        this.energyWaves = [];
        this.maxWaves = 3;
        this.waveSpawnTimer = 0;
        this.waveSpawnInterval = 800; // ms
        
        // Partículas de energía
        this.energyParticles = [];
        this.maxParticles = 8;
        
        this.initializeEnergyParticles();
    }

    /**
     * Inicializar partículas de energía
     * @private
     */
    initializeEnergyParticles() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.energyParticles.push(this.createEnergyParticle());
        }
    }

    /**
     * Crear partícula de energía
     * @returns {Object} Partícula de energía
     * @private
     */
    createEnergyParticle() {
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 30;
        
        return {
            angle: angle,
            distance: distance,
            baseDistance: distance,
            speed: 0.002 + Math.random() * 0.003,
            size: 2 + Math.random() * 3,
            life: 1.0,
            decay: 0.001 + Math.random() * 0.002,
            color: Math.random() > 0.5 ? this.coreColor : this.pulseColor
        };
    }

    /**
     * Actualizar el obstáculo pulse
     * @param {number} deltaTime - Tiempo transcurrido
     * @param {number} scrollOffset - Offset de scroll del mundo
     */
    update(deltaTime, scrollOffset) {
        super.update(deltaTime, scrollOffset);
        
        // Actualizar pulso principal
        this.updateMainPulse(deltaTime);
        
        // Actualizar ondas de energía
        this.updateEnergyWaves(deltaTime);
        
        // Actualizar partículas de energía
        this.updateEnergyParticles(deltaTime);
        
        // Generar nuevas ondas
        this.spawnEnergyWaves(deltaTime);
    }

    /**
     * Actualizar pulso principal
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updateMainPulse(deltaTime) {
        const pulsePhase = Math.sin(this.animationTime * this.pulseSpeed);
        this.pulseRadius = (pulsePhase + 1) * 0.5 * this.maxPulseRadius;
        this.pulseIntensity = 0.5 + (pulsePhase + 1) * 0.25;
    }

    /**
     * Actualizar ondas de energía
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updateEnergyWaves(deltaTime) {
        for (let i = this.energyWaves.length - 1; i >= 0; i--) {
            const wave = this.energyWaves[i];
            
            wave.radius += wave.speed * deltaTime;
            wave.alpha -= wave.decay * deltaTime;
            
            if (wave.alpha <= 0 || wave.radius > this.maxPulseRadius * 2) {
                this.energyWaves.splice(i, 1);
            }
        }
    }

    /**
     * Actualizar partículas de energía
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updateEnergyParticles(deltaTime) {
        this.energyParticles.forEach(particle => {
            // Movimiento orbital
            particle.angle += particle.speed * deltaTime;
            
            // Variación de distancia
            const distanceVariation = Math.sin(this.animationTime * 0.001 + particle.angle) * 10;
            particle.distance = particle.baseDistance + distanceVariation;
            
            // Reducir vida
            particle.life -= particle.decay * deltaTime;
            
            // Regenerar partícula si muere
            if (particle.life <= 0) {
                Object.assign(particle, this.createEnergyParticle());
            }
        });
    }

    /**
     * Generar ondas de energía
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    spawnEnergyWaves(deltaTime) {
        this.waveSpawnTimer += deltaTime;
        
        if (this.waveSpawnTimer >= this.waveSpawnInterval && this.energyWaves.length < this.maxWaves) {
            this.energyWaves.push({
                radius: 0,
                alpha: 0.8,
                speed: 0.15,
                decay: 0.001,
                color: this.pulseColor
            });
            
            this.waveSpawnTimer = 0;
        }
    }

    /**
     * Renderizar el obstáculo pulse
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} scrollOffset - Offset de scroll
     */
    render(ctx, scrollOffset) {
        if (!this.isVisible || !this.isActive) return;
        
        const renderX = this.x - scrollOffset;
        const coreRenderX = this.coreX - scrollOffset;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        // Cuerpo base
        this.renderPulseBody(ctx, renderX);
        
        // Ondas de energía
        this.renderEnergyWaves(ctx, coreRenderX);
        
        // Pulso principal
        this.renderMainPulse(ctx, coreRenderX);
        
        // Núcleo energético
        this.renderEnergyCore(ctx, coreRenderX);
        
        // Partículas de energía
        this.renderEnergyParticles(ctx, coreRenderX);
        
        ctx.restore();
    }

    /**
     * Renderizar cuerpo del pulse
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} renderX - Posición X de renderizado
     * @private
     */
    renderPulseBody(ctx, renderX) {
        // Gradiente base
        const gradient = ctx.createRadialGradient(
            renderX + this.width / 2, this.y + this.height / 2, 0,
            renderX + this.width / 2, this.y + this.height / 2, this.width / 2
        );
        gradient.addColorStop(0, this.coreColor);
        gradient.addColorStop(0.6, this.color);
        gradient.addColorStop(1, '#1A202C');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(renderX, this.y, this.width, this.height);
        
        // Contorno brillante
        ctx.strokeStyle = this.pulseColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = this.pulseIntensity;
        ctx.strokeRect(renderX, this.y, this.width, this.height);
        ctx.globalAlpha = this.alpha;
    }

    /**
     * Renderizar ondas de energía
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} coreRenderX - Posición X del núcleo
     * @private
     */
    renderEnergyWaves(ctx, coreRenderX) {
        this.energyWaves.forEach(wave => {
            ctx.strokeStyle = wave.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = wave.alpha;
            
            ctx.beginPath();
            ctx.arc(coreRenderX, this.coreY, wave.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Onda interior más tenue
            ctx.lineWidth = 1;
            ctx.globalAlpha = wave.alpha * 0.5;
            ctx.beginPath();
            ctx.arc(coreRenderX, this.coreY, wave.radius - 5, 0, Math.PI * 2);
            ctx.stroke();
        });
        
        ctx.globalAlpha = this.alpha;
    }

    /**
     * Renderizar pulso principal
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} coreRenderX - Posición X del núcleo
     * @private
     */
    renderMainPulse(ctx, coreRenderX) {
        if (this.pulseRadius > 10) {
            const pulseGradient = ctx.createRadialGradient(
                coreRenderX, this.coreY, 0,
                coreRenderX, this.coreY, this.pulseRadius
            );
            pulseGradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
            pulseGradient.addColorStop(0.8, `rgba(255, 107, 107, ${this.pulseIntensity * 0.3})`);
            pulseGradient.addColorStop(1, 'rgba(255, 107, 107, 0)');
            
            ctx.fillStyle = pulseGradient;
            ctx.beginPath();
            ctx.arc(coreRenderX, this.coreY, this.pulseRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Renderizar núcleo energético
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} coreRenderX - Posición X del núcleo
     * @private
     */
    renderEnergyCore(ctx, coreRenderX) {
        // Núcleo principal
        const coreGradient = ctx.createRadialGradient(
            coreRenderX, this.coreY, 0,
            coreRenderX, this.coreY, this.coreSize
        );
        coreGradient.addColorStop(0, '#FFFFFF');
        coreGradient.addColorStop(0.3, this.coreColor);
        coreGradient.addColorStop(1, this.color);
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(coreRenderX, this.coreY, this.coreSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Brillo del núcleo
        ctx.shadowColor = this.coreColor;
        ctx.shadowBlur = 20;
        ctx.fillStyle = this.coreColor;
        ctx.beginPath();
        ctx.arc(coreRenderX, this.coreY, this.coreSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    /**
     * Renderizar partículas de energía
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} coreRenderX - Posición X del núcleo
     * @private
     */
    renderEnergyParticles(ctx, coreRenderX) {
        this.energyParticles.forEach(particle => {
            const particleX = coreRenderX + Math.cos(particle.angle) * particle.distance;
            const particleY = this.coreY + Math.sin(particle.angle) * particle.distance;
            
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = particle.life * 0.8;
            
            ctx.beginPath();
            ctx.arc(particleX, particleY, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Estela de la partícula
            ctx.strokeStyle = particle.color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = particle.life * 0.3;
            
            const trailX = coreRenderX + Math.cos(particle.angle - 0.5) * (particle.distance - 10);
            const trailY = this.coreY + Math.sin(particle.angle - 0.5) * (particle.distance - 10);
            
            ctx.beginPath();
            ctx.moveTo(trailX, trailY);
            ctx.lineTo(particleX, particleY);
            ctx.stroke();
        });
        
        ctx.globalAlpha = this.alpha;
    }

    /**
     * Obtener información específica del pulse
     * @returns {Object} Información del pulse
     */
    getInfo() {
        return {
            ...super.getInfo(),
            pulseRadius: this.pulseRadius,
            maxPulseRadius: this.maxPulseRadius,
            energyWaveCount: this.energyWaves.length,
            energyParticleCount: this.energyParticles.length,
            pulseIntensity: this.pulseIntensity
        };
    }

    /**
     * Destruir el obstáculo pulse
     */
    destroy() {
        super.destroy();
        this.energyWaves = [];
        this.energyParticles = [];
    }
}