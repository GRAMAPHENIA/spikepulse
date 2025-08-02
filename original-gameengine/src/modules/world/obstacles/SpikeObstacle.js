/**
 * SpikeObstacle - Obstáculo tipo spike con temática Spikepulse
 * @module SpikeObstacle
 */

import { BaseObstacle } from './BaseObstacle.js';

export class SpikeObstacle extends BaseObstacle {
    /**
     * Crea una nueva instancia de SpikeObstacle
     * @param {Object} config - Configuración del obstáculo
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        super(config, eventBus);
        
        this.type = 'spike';
        this.color = config.color || '#E53E3E';
        this.glowColor = config.glowColor || '#FF6B6B';
        
        // Propiedades específicas del spike
        this.pulseIntensity = 0.5 + Math.random() * 0.5;
        this.pulseSpeed = 0.002 + Math.random() * 0.001;
        this.spikeCount = Math.floor(this.width / 10) + 1;
        
        // Efectos visuales
        this.glowRadius = 15;
        this.shadowBlur = 10;
    }

    /**
     * Actualizar el spike
     * @param {number} deltaTime - Tiempo transcurrido
     * @param {number} scrollOffset - Offset de scroll del mundo
     */
    update(deltaTime, scrollOffset) {
        super.update(deltaTime, scrollOffset);
        
        // Actualizar efectos de pulso
        this.updatePulseEffects();
    }

    /**
     * Actualizar efectos de pulso
     * @private
     */
    updatePulseEffects() {
        const pulsePhase = Math.sin(this.animationTime * this.pulseSpeed);
        this.alpha = 0.8 + (pulsePhase * this.pulseIntensity * 0.2);
        this.glowRadius = 15 + (pulsePhase * 5);
    }

    /**
     * Renderizar el spike
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} scrollOffset - Offset de scroll
     */
    render(ctx, scrollOffset) {
        if (!this.isVisible || !this.isActive) return;
        
        const renderX = this.x - scrollOffset;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        // Efecto de brillo
        this.renderGlow(ctx, renderX);
        
        // Cuerpo principal del spike
        this.renderSpikeBody(ctx, renderX);
        
        // Puntas del spike
        this.renderSpikePoints(ctx, renderX);
        
        // Efectos adicionales
        this.renderPulseEffect(ctx, renderX);
        
        ctx.restore();
    }

    /**
     * Renderizar efecto de brillo
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} renderX - Posición X de renderizado
     * @private
     */
    renderGlow(ctx, renderX) {
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = this.shadowBlur;
        ctx.fillStyle = this.color;
        ctx.fillRect(renderX, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }

    /**
     * Renderizar cuerpo del spike
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} renderX - Posición X de renderizado
     * @private
     */
    renderSpikeBody(ctx, renderX) {
        // Gradiente para dar profundidad
        const gradient = ctx.createLinearGradient(renderX, this.y, renderX + this.width, this.y);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, '#FF8A80');
        gradient.addColorStop(1, this.color);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(renderX, this.y, this.width, this.height);
        
        // Líneas de detalle tecnológico
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        
        // Líneas verticales
        for (let i = 1; i < 3; i++) {
            const lineX = renderX + (this.width / 3) * i;
            ctx.beginPath();
            ctx.moveTo(lineX, this.y + 5);
            ctx.lineTo(lineX, this.y + this.height - 5);
            ctx.stroke();
        }
        
        ctx.globalAlpha = this.alpha;
    }

    /**
     * Renderizar puntas del spike
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} renderX - Posición X de renderizado
     * @private
     */
    renderSpikePoints(ctx, renderX) {
        ctx.fillStyle = '#FF4444';
        
        const spikeWidth = this.width / this.spikeCount;
        
        for (let i = 0; i < this.spikeCount; i++) {
            const spikeX = renderX + (i * spikeWidth);
            const spikeHeight = 8 + Math.sin(this.animationTime * 0.003 + i) * 3;
            
            // Punta superior
            ctx.beginPath();
            ctx.moveTo(spikeX, this.y);
            ctx.lineTo(spikeX + spikeWidth / 2, this.y - spikeHeight);
            ctx.lineTo(spikeX + spikeWidth, this.y);
            ctx.closePath();
            ctx.fill();
            
            // Punta inferior (si el spike es alto)
            if (this.height > 40) {
                ctx.beginPath();
                ctx.moveTo(spikeX, this.y + this.height);
                ctx.lineTo(spikeX + spikeWidth / 2, this.y + this.height + spikeHeight);
                ctx.lineTo(spikeX + spikeWidth, this.y + this.height);
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    /**
     * Renderizar efecto de pulso
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} renderX - Posición X de renderizado
     * @private
     */
    renderPulseEffect(ctx, renderX) {
        const pulsePhase = Math.sin(this.animationTime * this.pulseSpeed);
        
        if (pulsePhase > 0.7) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.globalAlpha = (pulsePhase - 0.7) * 3;
            
            // Contorno pulsante
            ctx.strokeRect(renderX - 2, this.y - 2, this.width + 4, this.height + 4);
            
            // Líneas de energía
            ctx.beginPath();
            ctx.moveTo(renderX - 5, this.y + this.height / 2);
            ctx.lineTo(renderX + this.width + 5, this.y + this.height / 2);
            ctx.stroke();
        }
    }

    /**
     * Obtener información específica del spike
     * @returns {Object} Información del spike
     */
    getInfo() {
        return {
            ...super.getInfo(),
            spikeCount: this.spikeCount,
            pulseIntensity: this.pulseIntensity,
            pulseSpeed: this.pulseSpeed
        };
    }
}