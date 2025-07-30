/**
 * Background - Sistema de fondo con efectos atmosféricos
 * @module Background
 */

import { ParticleSystem } from './ParticleSystem.js';

export class Background {
    /**
     * Crea una nueva instancia del Background
     * @param {Object} config - Configuración del fondo
     * @param {EventBus} eventBus - Bus de eventos para comunicación
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isInitialized = false;
        
        // Configuración visual
        this.skyColor = this.config.skyColor || '#0F0F0F';
        this.fogColor = this.config.fogColor || 'rgba(100, 100, 120, 0.15)';
        
        // Capas de parallax
        this.layers = [];
        this.parallaxSpeeds = [0.1, 0.3, 0.5, 0.7]; // Velocidades relativas
        
        // Sistema de partículas
        this.particleSystem = new ParticleSystem(config, eventBus);
        
        // Efectos atmosféricos
        this.fogIntensity = 0.1;
        this.lightningTimer = 0;
        this.lightningInterval = 8000 + Math.random() * 12000; // 8-20 segundos
        this.isLightning = false;
        this.lightningDuration = 0;
        
        // Estado de animación
        this.time = 0;
        this.pulsePhase = 0;
        
        console.log('[Background] Instancia creada');
    }

    /**
     * Inicializar el sistema de fondo
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {EventBus} eventBus - Bus de eventos
     * @param {Object} config - Configuración del juego
     */
    init(ctx, eventBus, config) {
        if (this.isInitialized) {
            console.warn('[Background] Ya está inicializado');
            return;
        }

        this.ctx = ctx;
        this.canvasWidth = ctx.canvas.width;
        this.canvasHeight = ctx.canvas.height;
        
        // Inicializar capas de parallax
        this.initializeParallaxLayers();
        
        // Inicializar sistema de partículas
        this.particleSystem.init(ctx, eventBus, config);
        
        this.isInitialized = true;
        console.log('[Background] Inicializado correctamente');
    }

    /**
     * Inicializar capas de parallax
     * @private
     */
    initializeParallaxLayers() {
        // Capa 1: Montañas distantes (más lenta)
        this.layers.push({
            name: 'distant_mountains',
            speed: this.parallaxSpeeds[0],
            elements: this.generateMountains(0.2),
            color: '#1A1A2E',
            alpha: 0.6
        });
        
        // Capa 2: Estructuras industriales medias
        this.layers.push({
            name: 'industrial_mid',
            speed: this.parallaxSpeeds[1],
            elements: this.generateIndustrialStructures(0.4),
            color: '#16213E',
            alpha: 0.7
        });
        
        // Capa 3: Edificios cercanos
        this.layers.push({
            name: 'buildings_near',
            speed: this.parallaxSpeeds[2],
            elements: this.generateBuildings(0.6),
            color: '#2D3748',
            alpha: 0.8
        });
        
        // Capa 4: Elementos de primer plano
        this.layers.push({
            name: 'foreground',
            speed: this.parallaxSpeeds[3],
            elements: this.generateForegroundElements(0.8),
            color: '#4A5568',
            alpha: 0.9
        });
        
        console.log(`[Background] ${this.layers.length} capas de parallax inicializadas`);
    }

    /**
     * Generar montañas distantes
     * @param {number} heightFactor - Factor de altura
     * @returns {Array} Elementos de montañas
     * @private
     */
    generateMountains(heightFactor) {
        const mountains = [];
        const baseHeight = this.canvasHeight * heightFactor;
        
        for (let x = 0; x < this.canvasWidth * 3; x += 100) {
            mountains.push({
                x,
                y: this.canvasHeight - baseHeight - Math.random() * 50,
                width: 80 + Math.random() * 40,
                height: baseHeight + Math.random() * 30,
                type: 'mountain'
            });
        }
        
        return mountains;
    }

    /**
     * Generar estructuras industriales
     * @param {number} heightFactor - Factor de altura
     * @returns {Array} Elementos industriales
     * @private
     */
    generateIndustrialStructures(heightFactor) {
        const structures = [];
        const baseHeight = this.canvasHeight * heightFactor;
        
        for (let x = 0; x < this.canvasWidth * 3; x += 150) {
            // Torres industriales
            structures.push({
                x,
                y: this.canvasHeight - baseHeight,
                width: 20 + Math.random() * 30,
                height: baseHeight + Math.random() * 40,
                type: 'tower'
            });
            
            // Chimeneas con humo
            if (Math.random() > 0.7) {
                structures.push({
                    x: x + 60,
                    y: this.canvasHeight - baseHeight - 20,
                    width: 15,
                    height: baseHeight + 20,
                    type: 'chimney'
                });
            }
        }
        
        return structures;
    }

    /**
     * Generar edificios cercanos
     * @param {number} heightFactor - Factor de altura
     * @returns {Array} Elementos de edificios
     * @private
     */
    generateBuildings(heightFactor) {
        const buildings = [];
        const baseHeight = this.canvasHeight * heightFactor;
        
        for (let x = 0; x < this.canvasWidth * 3; x += 120) {
            buildings.push({
                x,
                y: this.canvasHeight - baseHeight,
                width: 60 + Math.random() * 40,
                height: baseHeight + Math.random() * 60,
                type: 'building',
                windows: Math.floor(Math.random() * 8) + 2
            });
        }
        
        return buildings;
    }

    /**
     * Generar elementos de primer plano
     * @param {number} heightFactor - Factor de altura
     * @returns {Array} Elementos de primer plano
     * @private
     */
    generateForegroundElements(heightFactor) {
        const elements = [];
        const baseHeight = this.canvasHeight * heightFactor;
        
        for (let x = 0; x < this.canvasWidth * 3; x += 200) {
            // Postes eléctricos
            elements.push({
                x,
                y: this.canvasHeight - baseHeight,
                width: 8,
                height: baseHeight,
                type: 'pole'
            });
            
            // Cables eléctricos
            elements.push({
                x,
                y: this.canvasHeight - baseHeight + 20,
                width: 200,
                height: 2,
                type: 'cable'
            });
        }
        
        return elements;
    }



    /**
     * Actualizar el sistema de fondo
     * @param {number} deltaTime - Tiempo transcurrido
     * @param {number} scrollOffset - Offset de scroll del mundo
     */
    update(deltaTime, scrollOffset) {
        if (!this.isInitialized) return;
        
        this.time += deltaTime;
        this.pulsePhase = (this.time * 0.001) % (Math.PI * 2);
        
        // Actualizar sistema de partículas
        this.particleSystem.update(deltaTime, scrollOffset);
        
        // Actualizar efectos atmosféricos
        this.updateAtmosphericEffects(deltaTime);
        
        // Actualizar efectos de rayos
        this.updateLightningEffects(deltaTime);
    }

    /**
     * Actualizar efectos de rayos
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updateLightningEffects(deltaTime) {
        this.lightningTimer += deltaTime;
        
        if (this.isLightning) {
            this.lightningDuration += deltaTime;
            if (this.lightningDuration >= 150) { // 150ms de duración
                this.isLightning = false;
                this.lightningDuration = 0;
            }
        } else if (this.lightningTimer >= this.lightningInterval) {
            this.isLightning = true;
            this.lightningTimer = 0;
            this.lightningInterval = 8000 + Math.random() * 12000; // Nuevo intervalo aleatorio
            
            // Crear explosión de partículas de chispa
            this.particleSystem.createExplosion(
                Math.random() * this.canvasWidth,
                Math.random() * this.canvasHeight * 0.3,
                'spark',
                5
            );
        }
    }

    /**
     * Actualizar efectos atmosféricos
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updateAtmosphericEffects(deltaTime) {
        // Variar intensidad de la niebla con el tiempo
        this.fogIntensity = 0.1 + Math.sin(this.pulsePhase * 0.5) * 0.05;
    }

    /**
     * Renderizar el sistema de fondo
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} scrollOffset - Offset de scroll del mundo
     */
    render(ctx, scrollOffset) {
        if (!this.isInitialized) return;
        
        // Renderizar fondo base
        this.renderSky(ctx);
        
        // Renderizar capas de parallax
        this.renderParallaxLayers(ctx, scrollOffset);
        
        // Renderizar sistema de partículas
        this.particleSystem.render(ctx);
        
        // Renderizar efectos de niebla
        this.renderFogEffects(ctx);
        
        // Renderizar efectos de rayos
        if (this.isLightning) {
            this.renderLightningEffect(ctx);
        }
    }

    /**
     * Renderizar el cielo base
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @private
     */
    renderSky(ctx) {
        // Gradiente de cielo
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
        gradient.addColorStop(0, '#0F0F0F');
        gradient.addColorStop(0.3, '#1A1A2E');
        gradient.addColorStop(1, '#16213E');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Efecto de pulso sutil en el cielo
        const pulseIntensity = Math.sin(this.pulsePhase) * 0.1;
        ctx.fillStyle = `rgba(255, 215, 0, ${0.02 + pulseIntensity * 0.01})`;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    /**
     * Renderizar capas de parallax
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} scrollOffset - Offset de scroll
     * @private
     */
    renderParallaxLayers(ctx, scrollOffset) {
        this.layers.forEach(layer => {
            ctx.save();
            ctx.globalAlpha = layer.alpha;
            
            const layerOffset = scrollOffset * layer.speed;
            
            layer.elements.forEach(element => {
                const x = element.x - layerOffset;
                
                // Solo renderizar elementos visibles
                if (x + element.width > -50 && x < this.canvasWidth + 50) {
                    this.renderLayerElement(ctx, element, x, layer);
                }
            });
            
            ctx.restore();
        });
    }

    /**
     * Renderizar elemento de capa
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} element - Elemento a renderizar
     * @param {number} x - Posición X ajustada
     * @param {Object} layer - Capa del elemento
     * @private
     */
    renderLayerElement(ctx, element, x, layer) {
        ctx.fillStyle = layer.color;
        
        switch (element.type) {
            case 'mountain':
                this.renderMountain(ctx, element, x);
                break;
            case 'tower':
                this.renderTower(ctx, element, x);
                break;
            case 'chimney':
                this.renderChimney(ctx, element, x);
                break;
            case 'building':
                this.renderBuilding(ctx, element, x);
                break;
            case 'pole':
                this.renderPole(ctx, element, x);
                break;
            case 'cable':
                this.renderCable(ctx, element, x);
                break;
        }
    }

    /**
     * Renderizar montaña
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} element - Elemento montaña
     * @param {number} x - Posición X
     * @private
     */
    renderMountain(ctx, element, x) {
        ctx.beginPath();
        ctx.moveTo(x, this.canvasHeight);
        ctx.lineTo(x + element.width * 0.3, element.y);
        ctx.lineTo(x + element.width * 0.7, element.y - 20);
        ctx.lineTo(x + element.width, element.y + 10);
        ctx.lineTo(x + element.width, this.canvasHeight);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Renderizar torre industrial
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} element - Elemento torre
     * @param {number} x - Posición X
     * @private
     */
    renderTower(ctx, element, x) {
        // Torre principal
        ctx.fillRect(x, element.y, element.width, element.height);
        
        // Detalles industriales
        ctx.fillStyle = '#FFD700';
        ctx.globalAlpha = 0.3 + Math.sin(this.pulsePhase + x * 0.01) * 0.2;
        ctx.fillRect(x + 2, element.y + 10, element.width - 4, 3);
        ctx.fillRect(x + 2, element.y + element.height - 15, element.width - 4, 3);
        ctx.globalAlpha = 1;
    }

    /**
     * Renderizar chimenea
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} element - Elemento chimenea
     * @param {number} x - Posición X
     * @private
     */
    renderChimney(ctx, element, x) {
        // Chimenea
        ctx.fillRect(x, element.y, element.width, element.height);
        
        // Humo
        ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
        for (let i = 0; i < 3; i++) {
            const smokeY = element.y - (i * 20) - 10;
            const smokeX = x + element.width / 2 + Math.sin(this.time * 0.002 + i) * 10;
            ctx.beginPath();
            ctx.arc(smokeX, smokeY, 8 - i * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Renderizar edificio
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} element - Elemento edificio
     * @param {number} x - Posición X
     * @private
     */
    renderBuilding(ctx, element, x) {
        // Edificio principal
        ctx.fillRect(x, element.y, element.width, element.height);
        
        // Ventanas
        ctx.fillStyle = '#FFD700';
        const windowSize = 4;
        const windowSpacing = 8;
        
        for (let i = 0; i < element.windows; i++) {
            const windowX = x + 5 + (i % 3) * windowSpacing;
            const windowY = element.y + 10 + Math.floor(i / 3) * windowSpacing;
            
            // Efecto de parpadeo en algunas ventanas
            const flicker = Math.sin(this.time * 0.003 + i) > 0.7;
            ctx.globalAlpha = flicker ? 0.8 : 0.3;
            ctx.fillRect(windowX, windowY, windowSize, windowSize);
        }
        
        ctx.globalAlpha = 1;
    }

    /**
     * Renderizar poste eléctrico
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} element - Elemento poste
     * @param {number} x - Posición X
     * @private
     */
    renderPole(ctx, element, x) {
        ctx.fillRect(x, element.y, element.width, element.height);
        
        // Aisladores
        ctx.fillStyle = '#4A5568';
        ctx.fillRect(x - 2, element.y + 20, element.width + 4, 4);
        ctx.fillRect(x - 2, element.y + 40, element.width + 4, 4);
    }

    /**
     * Renderizar cable eléctrico
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} element - Elemento cable
     * @param {number} x - Posición X
     * @private
     */
    renderCable(ctx, element, x) {
        ctx.strokeStyle = '#2D3748';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(x, element.y);
        
        // Curva del cable
        const segments = 10;
        for (let i = 1; i <= segments; i++) {
            const segmentX = x + (element.width / segments) * i;
            const sag = Math.sin((i / segments) * Math.PI) * 15;
            ctx.lineTo(segmentX, element.y + sag);
        }
        
        ctx.stroke();
    }

    /**
     * Renderizar efecto de rayo
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @private
     */
    renderLightningEffect(ctx) {
        // Flash de luz general
        const flashIntensity = 1 - (this.lightningDuration / 150);
        ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity * 0.3})`;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Rayos en el cielo
        if (flashIntensity > 0.5) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${flashIntensity})`;
            ctx.lineWidth = 2 + Math.random() * 3;
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 10;
            
            // Dibujar rayos ramificados
            this.drawLightningBolt(ctx, 
                Math.random() * this.canvasWidth, 0,
                Math.random() * this.canvasWidth, this.canvasHeight * 0.4
            );
        }
        
        ctx.shadowBlur = 0;
    }

    /**
     * Dibujar rayo ramificado
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} startX - X inicial
     * @param {number} startY - Y inicial
     * @param {number} endX - X final
     * @param {number} endY - Y final
     * @private
     */
    drawLightningBolt(ctx, startX, startY, endX, endY) {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        const segments = 8;
        const deltaX = (endX - startX) / segments;
        const deltaY = (endY - startY) / segments;
        
        let currentX = startX;
        let currentY = startY;
        
        for (let i = 1; i <= segments; i++) {
            const targetX = startX + deltaX * i;
            const targetY = startY + deltaY * i;
            
            // Agregar variación aleatoria
            const variation = 30;
            currentX = targetX + (Math.random() - 0.5) * variation;
            currentY = targetY + (Math.random() - 0.5) * variation * 0.5;
            
            ctx.lineTo(currentX, currentY);
            
            // Ramificaciones ocasionales
            if (Math.random() > 0.7 && i < segments - 2) {
                const branchLength = 20 + Math.random() * 40;
                const branchAngle = (Math.random() - 0.5) * Math.PI * 0.5;
                const branchEndX = currentX + Math.cos(branchAngle) * branchLength;
                const branchEndY = currentY + Math.sin(branchAngle) * branchLength;
                
                ctx.moveTo(currentX, currentY);
                ctx.lineTo(branchEndX, branchEndY);
                ctx.moveTo(currentX, currentY);
            }
        }
        
        ctx.stroke();
    }

    /**
     * Renderizar efectos de niebla
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @private
     */
    renderFogEffects(ctx) {
        // Niebla base
        ctx.fillStyle = `rgba(100, 100, 120, ${this.fogIntensity})`;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Niebla en movimiento
        const fogLayers = 3;
        for (let i = 0; i < fogLayers; i++) {
            const alpha = (this.fogIntensity * 0.5) / (i + 1);
            const offset = Math.sin(this.pulsePhase + i) * 20;
            
            ctx.fillStyle = `rgba(120, 120, 140, ${alpha})`;
            ctx.fillRect(offset, this.canvasHeight * 0.6, this.canvasWidth, this.canvasHeight * 0.4);
        }
    }

    /**
     * Resetear el sistema de fondo
     */
    reset() {
        this.time = 0;
        this.pulsePhase = 0;
        this.fogIntensity = 0.1;
        this.lightningTimer = 0;
        this.isLightning = false;
        this.lightningDuration = 0;
        
        // Resetear sistema de partículas
        if (this.particleSystem) {
            // El sistema de partículas se resetea automáticamente
        
        console.log('[Background] Sistema de fondo reseteado');
    }

    /**
     * Obtener estadísticas del sistema de fondo
     * @returns {Object} Estadísticas del fondo
     */
    getStats() {
        return {
            isInitialized: this.isInitialized,
            layerCount: this.layers.length,
            particleSystem: this.particleSystem ? this.particleSystem.getStats() : null,
            fogIntensity: this.fogIntensity,
            time: this.time,
            isLightning: this.isLightning,
            lightningTimer: this.lightningTimer
        };
    }

    /**
     * Limpiar recursos del sistema de fondo
     */
    destroy() {
        if (!this.isInitialized) return;
        
        this.layers = [];
        
        if (this.particleSystem) {
            this.particleSystem.destroy();
        }
        
        this.isInitialized = false;
        console.log('[Background] Sistema de fondo destruido');
    }
}