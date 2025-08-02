/**
 * TechObstacle - Obstáculo tecnológico con estética industrial
 * @module TechObstacle
 */

import { BaseObstacle } from './BaseObstacle.js';

export class TechObstacle extends BaseObstacle {
    /**
     * Crea una nueva instancia de TechObstacle
     * @param {Object} config - Configuración del obstáculo
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        super(config, eventBus);
        
        this.type = 'tech';
        this.color = config.color || '#4A5568';
        this.accentColor = '#9F7AEA';
        this.glowColor = '#B794F6';
        
        // Propiedades específicas del tech
        this.circuitLines = this.generateCircuitLines();
        this.panels = this.generatePanels();
        this.scanlineSpeed = 0.001 + Math.random() * 0.001;
        this.scanlinePosition = 0;
        
        // Efectos visuales
        this.hologramAlpha = 0.7;
        this.dataFlowSpeed = 0.002;
    }

    /**
     * Generar líneas de circuito
     * @returns {Array} Líneas de circuito
     * @private
     */
    generateCircuitLines() {
        const lines = [];
        const lineCount = Math.floor(this.height / 15);
        
        for (let i = 0; i < lineCount; i++) {
            lines.push({
                y: this.y + 10 + (i * 15),
                segments: this.generateLineSegments()
            });
        }
        
        return lines;
    }

    /**
     * Generar segmentos de línea
     * @returns {Array} Segmentos de línea
     * @private
     */
    generateLineSegments() {
        const segments = [];
        let currentX = 5;
        
        while (currentX < this.width - 5) {
            const segmentLength = 8 + Math.random() * 12;
            const hasGap = Math.random() > 0.7;
            
            segments.push({
                x: currentX,
                length: segmentLength,
                hasGap: hasGap,
                intensity: 0.5 + Math.random() * 0.5
            });
            
            currentX += segmentLength + (hasGap ? 3 : 0);
        }
        
        return segments;
    }

    /**
     * Generar paneles tecnológicos
     * @returns {Array} Paneles
     * @private
     */
    generatePanels() {
        const panels = [];
        const panelCount = Math.floor(this.width / 20);
        
        for (let i = 0; i < panelCount; i++) {
            panels.push({
                x: 5 + (i * 20),
                y: this.y + 5,
                width: 15,
                height: 10,
                isActive: Math.random() > 0.3,
                blinkSpeed: 0.001 + Math.random() * 0.002
            });
        }
        
        return panels;
    }

    /**
     * Actualizar el obstáculo tech
     * @param {number} deltaTime - Tiempo transcurrido
     * @param {number} scrollOffset - Offset de scroll del mundo
     */
    update(deltaTime, scrollOffset) {
        super.update(deltaTime, scrollOffset);
        
        // Actualizar scanline
        this.scanlinePosition = (this.scanlinePosition + this.scanlineSpeed * deltaTime) % 1;
        
        // Actualizar paneles parpadeantes
        this.updatePanels(deltaTime);
    }

    /**
     * Actualizar paneles
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updatePanels(deltaTime) {
        this.panels.forEach(panel => {
            if (panel.isActive && Math.sin(this.animationTime * panel.blinkSpeed) > 0.8) {
                panel.currentAlpha = 0.3 + Math.random() * 0.7;
            } else {
                panel.currentAlpha = 0.1;
            }
        });
    }

    /**
     * Renderizar el obstáculo tech
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} scrollOffset - Offset de scroll
     */
    render(ctx, scrollOffset) {
        if (!this.isVisible || !this.isActive) return;
        
        const renderX = this.x - scrollOffset;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        // Cuerpo principal
        this.renderTechBody(ctx, renderX);
        
        // Líneas de circuito
        this.renderCircuitLines(ctx, renderX);
        
        // Paneles tecnológicos
        this.renderTechPanels(ctx, renderX);
        
        // Scanline
        this.renderScanline(ctx, renderX);
        
        // Efectos de datos
        this.renderDataFlow(ctx, renderX);
        
        ctx.restore();
    }

    /**
     * Renderizar cuerpo tecnológico
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} renderX - Posición X de renderizado
     * @private
     */
    renderTechBody(ctx, renderX) {
        // Fondo metálico
        const gradient = ctx.createLinearGradient(renderX, this.y, renderX, this.y + this.height);
        gradient.addColorStop(0, '#2D3748');
        gradient.addColorStop(0.3, this.color);
        gradient.addColorStop(0.7, this.color);
        gradient.addColorStop(1, '#1A202C');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(renderX, this.y, this.width, this.height);
        
        // Bordes metálicos
        ctx.strokeStyle = '#718096';
        ctx.lineWidth = 1;
        ctx.strokeRect(renderX, this.y, this.width, this.height);
        
        // Detalles de ventilación
        ctx.strokeStyle = '#A0AEC0';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 3; i++) {
            const ventY = this.y + 10 + (i * (this.height - 20) / 2);
            ctx.beginPath();
            ctx.moveTo(renderX + 2, ventY);
            ctx.lineTo(renderX + this.width - 2, ventY);
            ctx.stroke();
        }
    }

    /**
     * Renderizar líneas de circuito
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} renderX - Posición X de renderizado
     * @private
     */
    renderCircuitLines(ctx, renderX) {
        ctx.lineWidth = 1;
        
        this.circuitLines.forEach(line => {
            line.segments.forEach(segment => {
                const alpha = segment.intensity * (0.5 + Math.sin(this.animationTime * 0.003) * 0.3);
                ctx.strokeStyle = `rgba(159, 122, 234, ${alpha})`;
                
                ctx.beginPath();
                ctx.moveTo(renderX + segment.x, line.y);
                ctx.lineTo(renderX + segment.x + segment.length, line.y);
                ctx.stroke();
                
                // Nodos en las conexiones
                if (!segment.hasGap) {
                    ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(renderX + segment.x + segment.length, line.y, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        });
    }

    /**
     * Renderizar paneles tecnológicos
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} renderX - Posición X de renderizado
     * @private
     */
    renderTechPanels(ctx, renderX) {
        this.panels.forEach(panel => {
            if (panel.isActive) {
                ctx.globalAlpha = panel.currentAlpha || 0.1;
                ctx.fillStyle = this.accentColor;
                ctx.fillRect(renderX + panel.x, panel.y, panel.width, panel.height);
                
                // Borde del panel
                ctx.strokeStyle = this.glowColor;
                ctx.lineWidth = 0.5;
                ctx.strokeRect(renderX + panel.x, panel.y, panel.width, panel.height);
            }
        });
        
        ctx.globalAlpha = this.alpha;
    }

    /**
     * Renderizar scanline
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} renderX - Posición X de renderizado
     * @private
     */
    renderScanline(ctx, renderX) {
        const scanY = this.y + (this.scanlinePosition * this.height);
        
        // Línea principal del scan
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.8;
        
        ctx.beginPath();
        ctx.moveTo(renderX, scanY);
        ctx.lineTo(renderX + this.width, scanY);
        ctx.stroke();
        
        // Efecto de brillo del scan
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        
        ctx.globalAlpha = this.alpha;
    }

    /**
     * Renderizar flujo de datos
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} renderX - Posición X de renderizado
     * @private
     */
    renderDataFlow(ctx, renderX) {
        const dataPoints = 5;
        
        for (let i = 0; i < dataPoints; i++) {
            const progress = (this.animationTime * this.dataFlowSpeed + i * 0.2) % 1;
            const dataX = renderX + (progress * this.width);
            const dataY = this.y + 5 + (i * (this.height - 10) / dataPoints);
            
            const alpha = Math.sin(progress * Math.PI) * 0.6;
            ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
            
            ctx.beginPath();
            ctx.arc(dataX, dataY, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Estela del punto de datos
            ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(dataX - 10, dataY);
            ctx.lineTo(dataX, dataY);
            ctx.stroke();
        }
    }

    /**
     * Obtener información específica del tech
     * @returns {Object} Información del tech
     */
    getInfo() {
        return {
            ...super.getInfo(),
            circuitLineCount: this.circuitLines.length,
            panelCount: this.panels.length,
            scanlinePosition: this.scanlinePosition
        };
    }
}