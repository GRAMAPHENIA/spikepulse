/**
 * Renderer - Módulo de renderizado optimizado con pooling de objetos y separación de capas
 * @module Renderer
 */

import { ObjectPool } from '../../utils/ObjectPool.js';
import { RenderLayer } from './RenderLayer.js';
import { EffectsManager } from './EffectsManager.js';
import { SpikepulseEffects } from './SpikepulseEffects.js';
import { PerformanceMonitor } from './PerformanceMonitor.js';
import { SPANISH_TEXT } from '../../config/SpanishText.js';

export class Renderer {
    /**
     * Crea una nueva instancia del Renderer
     * @param {Object} config - Configuración del renderizador
     * @param {EventBus} eventBus - Bus de eventos para comunicación
     */
    constructor(config, eventBus) {
        this.config = config.renderer || {};
        this.eventBus = eventBus;
        this.isInitialized = false;
        this.isActive = false;
        
        // Canvas y contexto
        this.canvas = null;
        this.ctx = null;
        this.canvasWidth = 0;
        this.canvasHeight = 0;
        
        // Sistema de capas de renderizado
        this.layers = new Map();
        this.layerOrder = ['background', 'world', 'entities', 'player', 'effects', 'ui', 'debug'];
        
        // Gestores especializados
        this.effectsManager = null;
        this.spikepulseEffects = null;
        this.performanceMonitor = null;
        
        // Object pooling para optimización
        this.renderObjectPool = null;
        this.transformPool = null;
        
        // Estado de renderizado
        this.renderState = {
            frame: 0,
            deltaTime: 0,
            totalTime: 0,
            viewportX: 0,
            viewportY: 0,
            scale: 1,
            rotation: 0
        };
        
        // Configuración de optimización
        this.optimizations = {
            enableDirtyRectangles: this.config.enableDirtyRectangles ?? true,
            enableObjectPooling: this.config.enableObjectPooling ?? true,
            enableLayerCaching: this.config.enableLayerCaching ?? true,
            maxRenderObjects: this.config.maxRenderObjects || 1000,
            cullingEnabled: this.config.cullingEnabled ?? true,
            cullingMargin: this.config.cullingMargin || 50
        };
        
        // Dirty rectangles para renderizado optimizado
        this.dirtyRegions = [];
        this.lastFrameObjects = [];
        this.currentFrameObjects = [];
        
        // Métricas de renderizado
        this.metrics = {
            objectsRendered: 0,
            objectsCulled: 0,
            layersRendered: 0,
            effectsRendered: 0,
            renderTime: 0,
            poolHits: 0,
            poolMisses: 0
        };
        
        console.log('[Renderer] Instancia creada con optimizaciones:', this.optimizations);
    }

    /**
     * Inicializar el módulo de renderizado
     * @param {HTMLCanvasElement} canvas - Canvas del juego
     * @param {EventBus} eventBus - Bus de eventos
     * @param {Object} config - Configuración del juego
     */
    init(canvas, eventBus, config) {
        if (this.isInitialized) {
            console.warn('[Renderer] Ya está inicializado');
            return;
        }

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
        
        // Configurar contexto para mejor rendimiento
        this.setupCanvasContext();
        
        // Inicializar capas de renderizado
        this.initializeLayers();
        
        // Inicializar gestores especializados
        this.effectsManager = new EffectsManager(this.config.effects || {}, this.eventBus);
        this.spikepulseEffects = new SpikepulseEffects(this.effectsManager, this.config.spikepulseEffects || {}, this.eventBus);
        this.performanceMonitor = new PerformanceMonitor(this.config.performance || {});
        
        // Inicializar object pools
        this.initializeObjectPools();
        
        // Configurar listeners de eventos
        this.setupEventListeners();
        
        this.isInitialized = true;
        this.isActive = true;
        
        console.log('[Renderer] Inicializado correctamente');
        this.eventBus.emit('renderer:initialized', {
            canvasSize: { width: this.canvasWidth, height: this.canvasHeight },
            layers: this.layerOrder,
            optimizations: this.optimizations
        });
    }

    /**
     * Configurar contexto del canvas para mejor rendimiento
     * @private
     */
    setupCanvasContext() {
        // Configuraciones de calidad y rendimiento
        this.ctx.imageSmoothingEnabled = this.config.imageSmoothingEnabled ?? true;
        this.ctx.imageSmoothingQuality = this.config.imageSmoothingQuality || 'high';
        
        // Configuraciones de texto
        this.ctx.textBaseline = 'top';
        this.ctx.textAlign = 'left';
        
        // Configuraciones de línea
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Optimizaciones específicas de canvas
        this.ctx.globalCompositeOperation = 'source-over';
        
        // Configurar canvas para mejor rendimiento en dispositivos de alta densidad
        this.setupHighDPICanvas();
        
        console.log('[Renderer] Contexto del canvas configurado con optimizaciones');
    }

    /**
     * Configurar canvas para dispositivos de alta densidad (Retina, etc.)
     * @private
     */
    setupHighDPICanvas() {
        const devicePixelRatio = window.devicePixelRatio || 1;
        const backingStoreRatio = this.ctx.webkitBackingStorePixelRatio ||
                                 this.ctx.mozBackingStorePixelRatio ||
                                 this.ctx.msBackingStorePixelRatio ||
                                 this.ctx.oBackingStorePixelRatio ||
                                 this.ctx.backingStorePixelRatio || 1;
        
        const ratio = devicePixelRatio / backingStoreRatio;
        
        if (ratio !== 1) {
            const oldWidth = this.canvas.width;
            const oldHeight = this.canvas.height;
            
            this.canvas.width = oldWidth * ratio;
            this.canvas.height = oldHeight * ratio;
            
            this.canvas.style.width = oldWidth + 'px';
            this.canvas.style.height = oldHeight + 'px';
            
            this.ctx.scale(ratio, ratio);
            
            console.log(`[Renderer] Canvas configurado para alta densidad (ratio: ${ratio})`);
        }
    }

    /**
     * Inicializar capas de renderizado
     * @private
     */
    initializeLayers() {
        this.layerOrder.forEach(layerName => {
            const layerConfig = this.config.layers?.[layerName] || {};
            const layer = new RenderLayer(layerName, layerConfig, this.eventBus);
            this.layers.set(layerName, layer);
        });
        
        console.log('[Renderer] Capas de renderizado inicializadas:', this.layerOrder);
    }

    /**
     * Inicializar object pools para optimización
     * @private
     */
    initializeObjectPools() {
        if (!this.optimizations.enableObjectPooling) {
            return;
        }
        
        // Pool para objetos de renderizado
        this.renderObjectPool = new ObjectPool(
            () => ({
                x: 0, y: 0, width: 0, height: 0,
                rotation: 0, scale: 1, alpha: 1,
                layer: 'entities', type: 'default',
                data: null, visible: true,
                isDirty: false, lastX: 0, lastY: 0,
                zIndex: 0, id: null
            }),
            (obj) => {
                obj.x = 0; obj.y = 0; obj.width = 0; obj.height = 0;
                obj.rotation = 0; obj.scale = 1; obj.alpha = 1;
                obj.layer = 'entities'; obj.type = 'default';
                obj.data = null; obj.visible = true;
                obj.isDirty = false; obj.lastX = 0; obj.lastY = 0;
                obj.zIndex = 0; obj.id = null;
            },
            this.optimizations.maxRenderObjects
        );
        
        // Pool para transformaciones
        this.transformPool = new ObjectPool(
            () => ({ x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, alpha: 1 }),
            (transform) => {
                transform.x = 0; transform.y = 0;
                transform.scaleX = 1; transform.scaleY = 1;
                transform.rotation = 0; transform.alpha = 1;
            },
            100
        );
        
        // Pool para comandos de renderizado (batch rendering)
        this.renderCommandPool = new ObjectPool(
            () => ({
                type: 'draw',
                target: null,
                transform: null,
                style: null,
                data: null
            }),
            (cmd) => {
                cmd.type = 'draw';
                cmd.target = null;
                cmd.transform = null;
                cmd.style = null;
                cmd.data = null;
            },
            200
        );
        
        // Pool para regiones dirty
        this.dirtyRegionPool = new ObjectPool(
            () => ({ x: 0, y: 0, width: 0, height: 0 }),
            (region) => {
                region.x = 0; region.y = 0;
                region.width = 0; region.height = 0;
            },
            50
        );
        
        console.log('[Renderer] Object pools avanzados inicializados');
    }

    /**
     * Configurar listeners de eventos
     * @private
     */
    setupEventListeners() {
        // Eventos de renderizado
        this.eventBus.on('renderer:add-object', this.handleAddRenderObject, this);
        this.eventBus.on('renderer:remove-object', this.handleRemoveRenderObject, this);
        this.eventBus.on('renderer:clear-layer', this.handleClearLayer, this);
        
        // Eventos de efectos
        this.eventBus.on('effects:add', this.handleAddEffect, this);
        this.eventBus.on('effects:remove', this.handleRemoveEffect, this);
        
        // Eventos de viewport
        this.eventBus.on('camera:move', this.handleCameraMove, this);
        this.eventBus.on('camera:zoom', this.handleCameraZoom, this);
        
        // Eventos de estado del juego
        this.eventBus.on('game:start', this.handleGameStart, this);
        this.eventBus.on('game:stop', this.handleGameStop, this);
        this.eventBus.on('game:reset', this.handleGameReset, this);
        
        console.log('[Renderer] Event listeners configurados');
    }

    /**
     * Actualizar el renderizador
     * @param {number} deltaTime - Tiempo transcurrido desde la última actualización
     */
    update(deltaTime) {
        if (!this.isInitialized || !this.isActive) {
            return;
        }

        // Actualizar estado de renderizado
        this.renderState.deltaTime = deltaTime;
        this.renderState.totalTime += deltaTime;
        this.renderState.frame++;
        
        // Actualizar gestores especializados
        this.effectsManager.update(deltaTime);
        this.performanceMonitor.update(deltaTime);
        
        // Actualizar capas
        this.layers.forEach(layer => {
            layer.update(deltaTime);
        });
        
        // Limpiar objetos de renderizado del frame anterior si usamos pooling
        if (this.optimizations.enableObjectPooling) {
            this.cleanupLastFrameObjects();
        }
    }

    /**
     * Renderizar frame completo
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas (opcional, usa el interno si no se proporciona)
     */
    render(ctx = null) {
        if (!this.isInitialized || !this.isActive) {
            return;
        }

        const renderCtx = ctx || this.ctx;
        const startTime = performance.now();
        
        // Resetear métricas del frame
        this.resetFrameMetrics();
        
        // Limpiar canvas si no usamos dirty rectangles
        if (!this.optimizations.enableDirtyRectangles) {
            this.clearCanvas(renderCtx);
        } else {
            this.clearDirtyRegions(renderCtx);
        }
        
        // Renderizar capas en orden
        this.renderLayers(renderCtx);
        
        // Renderizar efectos
        this.renderEffects(renderCtx);
        
        // Renderizar información de debug si está habilitada
        if (this.config.debug?.showMetrics) {
            this.renderDebugInfo(renderCtx);
        }
        
        // Actualizar métricas de rendimiento
        this.metrics.renderTime = performance.now() - startTime;
        this.performanceMonitor.recordRenderTime(this.metrics.renderTime);
        
        // Emitir evento de renderizado completado
        this.eventBus.emit('renderer:frame-complete', {
            frame: this.renderState.frame,
            metrics: { ...this.metrics },
            renderTime: this.metrics.renderTime
        });
    }

    /**
     * Limpiar canvas completo
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @private
     */
    clearCanvas(ctx) {
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Aplicar color de fondo si está configurado
        if (this.config.backgroundColor) {
            ctx.fillStyle = this.config.backgroundColor;
            ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        }
    }

    /**
     * Limpiar solo las regiones dirty
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @private
     */
    clearDirtyRegions(ctx) {
        if (this.dirtyRegions.length === 0) {
            return;
        }
        
        this.dirtyRegions.forEach(region => {
            ctx.clearRect(region.x, region.y, region.width, region.height);
            
            // Aplicar color de fondo en la región si está configurado
            if (this.config.backgroundColor) {
                ctx.fillStyle = this.config.backgroundColor;
                ctx.fillRect(region.x, region.y, region.width, region.height);
            }
        });
        
        // Limpiar regiones dirty para el próximo frame
        this.dirtyRegions = [];
    }

    /**
     * Renderizar todas las capas en orden
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @private
     */
    renderLayers(ctx) {
        // Separar capas estáticas y dinámicas para optimización
        const staticLayers = [];
        const dynamicLayers = [];
        
        this.layerOrder.forEach(layerName => {
            const layer = this.layers.get(layerName);
            
            if (!layer || !layer.isVisible()) {
                return;
            }
            
            // Clasificar capas según su naturaleza
            if (this.isStaticLayer(layerName)) {
                staticLayers.push(layer);
            } else {
                dynamicLayers.push(layer);
            }
        });
        
        // Renderizar capas estáticas (con cache si es posible)
        this.renderStaticLayers(ctx, staticLayers);
        
        // Renderizar capas dinámicas (siempre actualizadas)
        this.renderDynamicLayers(ctx, dynamicLayers);
    }

    /**
     * Verificar si una capa es estática
     * @param {string} layerName - Nombre de la capa
     * @returns {boolean} True si es estática
     * @private
     */
    isStaticLayer(layerName) {
        const staticLayers = ['background', 'world'];
        return staticLayers.includes(layerName);
    }

    /**
     * Renderizar capas estáticas con optimizaciones
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Array} layers - Capas estáticas
     * @private
     */
    renderStaticLayers(ctx, layers) {
        layers.forEach(layer => {
            ctx.save();
            this.applyViewportTransform(ctx, layer);
            
            const layerStartTime = performance.now();
            
            // Usar cache de capa si está disponible y no está dirty
            if (layer.enableCaching && !layer.cacheDirty) {
                layer.renderFromCache(ctx);
            } else {
                layer.render(ctx, this.renderState);
            }
            
            const layerRenderTime = performance.now() - layerStartTime;
            
            this.metrics.layersRendered++;
            layer.setLastRenderTime(layerRenderTime);
            
            ctx.restore();
        });
    }

    /**
     * Renderizar capas dinámicas con batch rendering
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Array} layers - Capas dinámicas
     * @private
     */
    renderDynamicLayers(ctx, layers) {
        // Recopilar todos los objetos de capas dinámicas
        const allObjects = [];
        
        layers.forEach(layer => {
            const layerObjects = layer.getVisibleObjects(this.renderState);
            layerObjects.forEach(obj => {
                obj._layerName = layer.name;
                allObjects.push(obj);
            });
        });
        
        // Ordenar objetos por tipo de renderizado para batch processing
        const batches = this.groupObjectsForBatchRendering(allObjects);
        
        // Renderizar cada batch
        batches.forEach(batch => {
            this.renderBatch(ctx, batch);
        });
        
        this.metrics.layersRendered += layers.length;
    }

    /**
     * Agrupar objetos para batch rendering
     * @param {Array} objects - Objetos a agrupar
     * @returns {Array} Batches de objetos
     * @private
     */
    groupObjectsForBatchRendering(objects) {
        const batches = new Map();
        
        objects.forEach(obj => {
            // Crear clave de batch basada en tipo y propiedades de renderizado
            const batchKey = this.getBatchKey(obj);
            
            if (!batches.has(batchKey)) {
                batches.set(batchKey, {
                    type: obj.type,
                    style: this.extractRenderStyle(obj),
                    objects: []
                });
            }
            
            batches.get(batchKey).objects.push(obj);
        });
        
        return Array.from(batches.values());
    }

    /**
     * Obtener clave de batch para un objeto
     * @param {Object} obj - Objeto
     * @returns {string} Clave de batch
     * @private
     */
    getBatchKey(obj) {
        return `${obj.type}_${obj.fillStyle || 'none'}_${obj.strokeStyle || 'none'}_${obj.lineWidth || 1}`;
    }

    /**
     * Extraer estilo de renderizado de un objeto
     * @param {Object} obj - Objeto
     * @returns {Object} Estilo de renderizado
     * @private
     */
    extractRenderStyle(obj) {
        return {
            fillStyle: obj.fillStyle,
            strokeStyle: obj.strokeStyle,
            lineWidth: obj.lineWidth,
            globalAlpha: obj.alpha || 1,
            font: obj.font,
            textAlign: obj.textAlign,
            textBaseline: obj.textBaseline
        };
    }

    /**
     * Renderizar un batch de objetos
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} batch - Batch de objetos
     * @private
     */
    renderBatch(ctx, batch) {
        ctx.save();
        
        // Aplicar estilo común del batch
        this.applyBatchStyle(ctx, batch.style);
        
        // Renderizar todos los objetos del batch
        batch.objects.forEach(obj => {
            // Aplicar transformaciones de viewport para la capa del objeto
            const layer = this.layers.get(obj._layerName);
            if (layer) {
                ctx.save();
                this.applyViewportTransform(ctx, layer);
                this.applyObjectTransform(ctx, obj);
                
                // Renderizar objeto específico
                this.renderObjectByType(ctx, obj, batch.type);
                
                ctx.restore();
                this.metrics.objectsRendered++;
            }
        });
        
        ctx.restore();
    }

    /**
     * Aplicar estilo de batch
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} style - Estilo a aplicar
     * @private
     */
    applyBatchStyle(ctx, style) {
        if (style.fillStyle) ctx.fillStyle = style.fillStyle;
        if (style.strokeStyle) ctx.strokeStyle = style.strokeStyle;
        if (style.lineWidth) ctx.lineWidth = style.lineWidth;
        if (style.globalAlpha !== undefined) ctx.globalAlpha = style.globalAlpha;
        if (style.font) ctx.font = style.font;
        if (style.textAlign) ctx.textAlign = style.textAlign;
        if (style.textBaseline) ctx.textBaseline = style.textBaseline;
    }

    /**
     * Renderizar objeto por tipo específico
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} obj - Objeto a renderizar
     * @param {string} type - Tipo de objeto
     * @private
     */
    renderObjectByType(ctx, obj, type) {
        switch (type) {
            case 'rectangle':
                if (obj.fillStyle) {
                    ctx.fillRect(0, 0, obj.width, obj.height);
                }
                if (obj.strokeStyle) {
                    ctx.strokeRect(0, 0, obj.width, obj.height);
                }
                break;
            case 'circle':
                const radius = obj.radius || Math.min(obj.width, obj.height) / 2;
                const centerX = obj.width / 2;
                const centerY = obj.height / 2;
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                
                if (obj.fillStyle) ctx.fill();
                if (obj.strokeStyle) ctx.stroke();
                break;
            case 'text':
                if (obj.fillStyle) {
                    ctx.fillText(obj.text || '', 0, 0);
                }
                if (obj.strokeStyle) {
                    ctx.strokeText(obj.text || '', 0, 0);
                }
                break;
            default:
                // Renderizado por defecto
                if (typeof obj.render === 'function') {
                    obj.render(ctx, this.renderState);
                } else {
                    ctx.fillRect(0, 0, obj.width || 10, obj.height || 10);
                }
                break;
        }
    }

    /**
     * Aplicar transformaciones de viewport a una capa
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {RenderLayer} layer - Capa a transformar
     * @private
     */
    applyViewportTransform(ctx, layer) {
        const layerConfig = layer.getConfig();
        
        // Aplicar parallax si está configurado
        if (layerConfig.parallax) {
            const parallaxX = this.renderState.viewportX * layerConfig.parallax.x;
            const parallaxY = this.renderState.viewportY * layerConfig.parallax.y;
            ctx.translate(-parallaxX, -parallaxY);
        } else {
            // Aplicar transformación de viewport normal
            ctx.translate(-this.renderState.viewportX, -this.renderState.viewportY);
        }
        
        // Aplicar escala global
        if (this.renderState.scale !== 1) {
            ctx.scale(this.renderState.scale, this.renderState.scale);
        }
        
        // Aplicar rotación global si está configurada
        if (this.renderState.rotation !== 0) {
            ctx.rotate(this.renderState.rotation);
        }
    }

    /**
     * Renderizar efectos visuales
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @private
     */
    renderEffects(ctx) {
        const effectsStartTime = performance.now();
        
        ctx.save();
        this.effectsManager.render(ctx, this.renderState);
        ctx.restore();
        
        const effectsRenderTime = performance.now() - effectsStartTime;
        this.metrics.effectsRendered = this.effectsManager.getActiveEffectsCount();
        this.effectsManager.setLastRenderTime(effectsRenderTime);
    }

    /**
     * Renderizar información de debug
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @private
     */
    renderDebugInfo(ctx) {
        ctx.save();
        
        // Configurar estilo de texto para debug
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        const debugInfo = [
            `Frame: ${this.renderState.frame}`,
            `Render Time: ${this.metrics.renderTime.toFixed(2)}ms`,
            `Objects: ${this.metrics.objectsRendered}`,
            `Culled: ${this.metrics.objectsCulled}`,
            `Layers: ${this.metrics.layersRendered}`,
            `Effects: ${this.metrics.effectsRendered}`,
            `Pool Hits: ${this.metrics.poolHits}`,
            `Pool Misses: ${this.metrics.poolMisses}`,
            `FPS: ${this.performanceMonitor.getCurrentFPS().toFixed(1)}`
        ];
        
        let y = 10;
        debugInfo.forEach(info => {
            // Dibujar texto con contorno para mejor legibilidad
            ctx.strokeText(info, 10, y);
            ctx.fillText(info, 10, y);
            y += 15;
        });
        
        ctx.restore();
    }

    /**
     * Resetear métricas del frame
     * @private
     */
    resetFrameMetrics() {
        this.metrics.objectsRendered = 0;
        this.metrics.objectsCulled = 0;
        this.metrics.layersRendered = 0;
        this.metrics.effectsRendered = 0;
        this.metrics.poolHits = 0;
        this.metrics.poolMisses = 0;
    }

    /**
     * Limpiar objetos del frame anterior
     * @private
     */
    cleanupLastFrameObjects() {
        this.lastFrameObjects.forEach(obj => {
            if (this.renderObjectPool) {
                this.renderObjectPool.release(obj);
            }
        });
        
        this.lastFrameObjects = this.currentFrameObjects;
        this.currentFrameObjects = [];
    }

    /**
     * Verificar si un objeto está dentro del viewport (culling)
     * @param {Object} obj - Objeto a verificar
     * @returns {boolean} True si el objeto está visible
     * @private
     */
    isObjectVisible(obj) {
        if (!this.optimizations.cullingEnabled) {
            return true;
        }
        
        const margin = this.optimizations.cullingMargin;
        const viewLeft = this.renderState.viewportX - margin;
        const viewRight = this.renderState.viewportX + this.canvasWidth + margin;
        const viewTop = this.renderState.viewportY - margin;
        const viewBottom = this.renderState.viewportY + this.canvasHeight + margin;
        
        return !(obj.x + obj.width < viewLeft ||
                obj.x > viewRight ||
                obj.y + obj.height < viewTop ||
                obj.y > viewBottom);
    }

    /**
     * Aplicar transformaciones a un objeto
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} obj - Objeto a transformar
     * @private
     */
    applyObjectTransform(ctx, obj) {
        // Trasladar al centro del objeto para rotación
        const centerX = obj.x + (obj.width || 0) / 2;
        const centerY = obj.y + (obj.height || 0) / 2;
        ctx.translate(centerX, centerY);
        
        // Aplicar rotación
        if (obj.rotation) {
            ctx.rotate(obj.rotation);
        }
        
        // Aplicar escala
        if (obj.scale && obj.scale !== 1) {
            ctx.scale(obj.scale, obj.scale);
        } else if (obj.scaleX || obj.scaleY) {
            ctx.scale(obj.scaleX || 1, obj.scaleY || 1);
        }
        
        // Aplicar alpha
        if (obj.alpha && obj.alpha < 1) {
            ctx.globalAlpha *= obj.alpha;
        }
        
        // Volver al origen del objeto
        ctx.translate(-(obj.width || 0) / 2, -(obj.height || 0) / 2);
    }

    /**
     * Agregar región dirty para optimización de renderizado
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @param {number} width - Ancho
     * @param {number} height - Alto
     */
    addDirtyRegion(x, y, width, height) {
        if (!this.optimizations.enableDirtyRectangles) {
            return;
        }
        
        // Usar object pool para regiones dirty
        let region;
        if (this.dirtyRegionPool) {
            region = this.dirtyRegionPool.acquire();
            region.x = Math.max(0, Math.floor(x));
            region.y = Math.max(0, Math.floor(y));
            region.width = Math.min(this.canvasWidth - x, Math.ceil(width));
            region.height = Math.min(this.canvasHeight - y, Math.ceil(height));
        } else {
            region = {
                x: Math.max(0, Math.floor(x)),
                y: Math.max(0, Math.floor(y)),
                width: Math.min(this.canvasWidth - x, Math.ceil(width)),
                height: Math.min(this.canvasHeight - y, Math.ceil(height))
            };
        }
        
        // Fusionar con regiones existentes si se superponen
        this.mergeDirtyRegion(region);
    }

    /**
     * Fusionar región dirty con regiones existentes
     * @param {Object} newRegion - Nueva región dirty
     * @private
     */
    mergeDirtyRegion(newRegion) {
        let merged = false;
        
        for (let i = 0; i < this.dirtyRegions.length; i++) {
            const existingRegion = this.dirtyRegions[i];
            
            // Verificar si las regiones se superponen o están adyacentes
            if (this.regionsOverlapOrAdjacent(existingRegion, newRegion)) {
                // Fusionar regiones
                const mergedRegion = this.mergeRegions(existingRegion, newRegion);
                
                // Liberar región existente al pool si es posible
                if (this.dirtyRegionPool) {
                    this.dirtyRegionPool.release(existingRegion);
                }
                
                this.dirtyRegions[i] = mergedRegion;
                merged = true;
                break;
            }
        }
        
        if (!merged) {
            this.dirtyRegions.push(newRegion);
        }
    }

    /**
     * Verificar si dos regiones se superponen o están adyacentes
     * @param {Object} region1 - Primera región
     * @param {Object} region2 - Segunda región
     * @returns {boolean} True si se superponen o están adyacentes
     * @private
     */
    regionsOverlapOrAdjacent(region1, region2) {
        const margin = 5; // Margen para considerar regiones adyacentes
        
        return !(region1.x > region2.x + region2.width + margin ||
                region2.x > region1.x + region1.width + margin ||
                region1.y > region2.y + region2.height + margin ||
                region2.y > region1.y + region1.height + margin);
    }

    /**
     * Fusionar dos regiones en una
     * @param {Object} region1 - Primera región
     * @param {Object} region2 - Segunda región
     * @returns {Object} Región fusionada
     * @private
     */
    mergeRegions(region1, region2) {
        const left = Math.min(region1.x, region2.x);
        const top = Math.min(region1.y, region2.y);
        const right = Math.max(region1.x + region1.width, region2.x + region2.width);
        const bottom = Math.max(region1.y + region1.height, region2.y + region2.height);
        
        return {
            x: left,
            y: top,
            width: right - left,
            height: bottom - top
        };
    }

    /**
     * Obtener objeto de renderizado del pool
     * @returns {Object} Objeto de renderizado
     */
    getRenderObject() {
        if (!this.optimizations.enableObjectPooling || !this.renderObjectPool) {
            this.metrics.poolMisses++;
            return {
                x: 0, y: 0, width: 0, height: 0,
                rotation: 0, scale: 1, alpha: 1,
                layer: 'entities', type: 'default',
                data: null, visible: true
            };
        }
        
        this.metrics.poolHits++;
        const obj = this.renderObjectPool.acquire();
        this.currentFrameObjects.push(obj);
        return obj;
    }

    /**
     * Obtener transformación del pool
     * @returns {Object} Objeto de transformación
     */
    getTransform() {
        if (!this.optimizations.enableObjectPooling || !this.transformPool) {
            return { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, alpha: 1 };
        }
        
        return this.transformPool.acquire();
    }

    /**
     * Liberar transformación al pool
     * @param {Object} transform - Transformación a liberar
     */
    releaseTransform(transform) {
        if (this.optimizations.enableObjectPooling && this.transformPool) {
            this.transformPool.release(transform);
        }
    }

    // ===== EVENT HANDLERS =====

    /**
     * Manejar adición de objeto de renderizado
     * @param {Object} data - Datos del objeto
     * @private
     */
    handleAddRenderObject(data) {
        const { layerName, object } = data;
        const layer = this.layers.get(layerName);
        
        if (layer) {
            layer.addObject(object);
            
            // Agregar región dirty si está habilitada
            if (this.optimizations.enableDirtyRectangles) {
                this.addDirtyRegion(object.x, object.y, object.width, object.height);
            }
        }
    }

    /**
     * Manejar eliminación de objeto de renderizado
     * @param {Object} data - Datos del objeto
     * @private
     */
    handleRemoveRenderObject(data) {
        const { layerName, objectId } = data;
        const layer = this.layers.get(layerName);
        
        if (layer) {
            const removedObject = layer.removeObject(objectId);
            
            // Agregar región dirty si está habilitada
            if (removedObject && this.optimizations.enableDirtyRectangles) {
                this.addDirtyRegion(
                    removedObject.x, removedObject.y,
                    removedObject.width, removedObject.height
                );
            }
        }
    }

    /**
     * Manejar limpieza de capa
     * @param {Object} data - Datos de la capa
     * @private
     */
    handleClearLayer(data) {
        const { layerName } = data;
        const layer = this.layers.get(layerName);
        
        if (layer) {
            layer.clear();
            
            // Marcar toda la pantalla como dirty
            if (this.optimizations.enableDirtyRectangles) {
                this.addDirtyRegion(0, 0, this.canvasWidth, this.canvasHeight);
            }
        }
    }

    /**
     * Manejar adición de efecto
     * @param {Object} data - Datos del efecto
     * @private
     */
    handleAddEffect(data) {
        this.effectsManager.addEffect(data.effect);
    }

    /**
     * Manejar eliminación de efecto
     * @param {Object} data - Datos del efecto
     * @private
     */
    handleRemoveEffect(data) {
        this.effectsManager.removeEffect(data.effectId);
    }

    /**
     * Manejar movimiento de cámara
     * @param {Object} data - Datos de la cámara
     * @private
     */
    handleCameraMove(data) {
        this.renderState.viewportX = data.x || 0;
        this.renderState.viewportY = data.y || 0;
        
        // Marcar toda la pantalla como dirty para el movimiento de cámara
        if (this.optimizations.enableDirtyRectangles) {
            this.addDirtyRegion(0, 0, this.canvasWidth, this.canvasHeight);
        }
    }

    /**
     * Manejar zoom de cámara
     * @param {Object} data - Datos del zoom
     * @private
     */
    handleCameraZoom(data) {
        this.renderState.scale = data.scale || 1;
        
        // Marcar toda la pantalla como dirty para el zoom
        if (this.optimizations.enableDirtyRectangles) {
            this.addDirtyRegion(0, 0, this.canvasWidth, this.canvasHeight);
        }
    }

    /**
     * Manejar inicio del juego
     * @private
     */
    handleGameStart() {
        this.isActive = true;
        this.resetFrameMetrics();
        console.log('[Renderer] Juego iniciado');
    }

    /**
     * Manejar parada del juego
     * @private
     */
    handleGameStop() {
        this.isActive = false;
        console.log('[Renderer] Juego detenido');
    }

    /**
     * Manejar reset del juego
     * @private
     */
    handleGameReset() {
        // Limpiar todas las capas
        this.layers.forEach(layer => layer.clear());
        
        // Resetear efectos
        this.effectsManager.clear();
        
        // Resetear estado de renderizado
        this.renderState.frame = 0;
        this.renderState.totalTime = 0;
        this.renderState.viewportX = 0;
        this.renderState.viewportY = 0;
        this.renderState.scale = 1;
        this.renderState.rotation = 0;
        
        this.resetFrameMetrics();
        console.log('[Renderer] Juego reseteado');
    }

    // ===== GETTERS PÚBLICOS =====

    /**
     * Obtener métricas de renderizado
     * @returns {Object} Métricas actuales
     */
    getMetrics() {
        return {
            ...this.metrics,
            fps: this.performanceMonitor.getCurrentFPS(),
            frameTime: this.performanceMonitor.getAverageFrameTime(),
            memoryUsage: this.performanceMonitor.getMemoryUsage()
        };
    }

    /**
     * Obtener información de las capas
     * @returns {Array} Información de las capas
     */
    getLayersInfo() {
        return this.layerOrder.map(layerName => {
            const layer = this.layers.get(layerName);
            return {
                name: layerName,
                visible: layer.isVisible(),
                objectCount: layer.getObjectCount(),
                lastRenderTime: layer.getLastRenderTime()
            };
        });
    }

    /**
     * Obtener estado actual del renderizador
     * @returns {Object} Estado del renderizador
     */
    getState() {
        return {
            ...this.renderState,
            isActive: this.isActive,
            canvasSize: { width: this.canvasWidth, height: this.canvasHeight },
            optimizations: this.optimizations
        };
    }

    /**
     * Verificar si el renderizador está activo
     * @returns {boolean} True si está activo
     */
    isRendererActive() {
        return this.isActive && this.isInitialized;
    }

    /**
     * Cambiar visibilidad de una capa
     * @param {string} layerName - Nombre de la capa
     * @param {boolean} visible - Visibilidad
     */
    setLayerVisibility(layerName, visible) {
        const layer = this.layers.get(layerName);
        if (layer) {
            layer.setVisible(visible);
        }
    }

    /**
     * Obtener capa por nombre
     * @param {string} layerName - Nombre de la capa
     * @returns {RenderLayer|null} Capa o null si no existe
     */
    getLayer(layerName) {
        return this.layers.get(layerName) || null;
    }

    /**
     * Obtener gestor de efectos de Spikepulse
     * @returns {SpikepulseEffects} Gestor de efectos específicos
     */
    getSpikepulseEffects() {
        return this.spikepulseEffects;
    }

    /**
     * Crear efecto específico de Spikepulse
     * @param {string} effectName - Nombre del efecto
     * @param {Object} position - Posición del efecto
     * @param {Object} customConfig - Configuración personalizada
     */
    createSpikepulseEffect(effectName, position, customConfig = {}) {
        if (this.spikepulseEffects) {
            this.spikepulseEffects.createCustomSpikepulseEffect(effectName, position, customConfig);
        }
    }

    /**
     * Crear efecto de pulso Spikepulse
     * @param {Object} position - Posición del efecto
     * @param {string} color - Color del pulso
     * @param {number} intensity - Intensidad del pulso
     */
    createSpikepulsePulse(position, color = null, intensity = 1.0) {
        if (this.spikepulseEffects) {
            this.spikepulseEffects.createSpikepulsePulse(position, color, intensity);
        }
    }

    /**
     * Crear efecto de shake de pantalla
     * @param {number} duration - Duración en segundos
     * @param {number} intensity - Intensidad del shake
     */
    createScreenShake(duration, intensity) {
        if (this.spikepulseEffects) {
            this.spikepulseEffects.createScreenShake(duration, intensity);
        }
    }

    /**
     * Obtener estadísticas de efectos visuales
     * @returns {Object} Estadísticas completas
     */
    getVisualEffectsStats() {
        const baseStats = {
            renderMetrics: { ...this.metrics },
            performanceMetrics: this.performanceMonitor ? this.performanceMonitor.getMetrics() : {}
        };

        if (this.spikepulseEffects) {
            baseStats.spikepulseEffects = this.spikepulseEffects.getEffectsStats();
        }

        if (this.effectsManager) {
            baseStats.effectsManager = this.effectsManager.getMetrics();
        }

        return baseStats;
    }

    /**
     * Limpiar recursos del módulo
     */
    destroy() {
        if (!this.isInitialized) return;
        
        // Limpiar event listeners
        this.eventBus.offContext(this);
        
        // Limpiar capas
        this.layers.forEach(layer => layer.destroy());
        this.layers.clear();
        
        // Limpiar gestores especializados
        if (this.effectsManager) this.effectsManager.destroy();
        if (this.spikepulseEffects) this.spikepulseEffects.destroy();
        if (this.performanceMonitor) this.performanceMonitor.destroy();
        
        // Limpiar object pools
        if (this.renderObjectPool) this.renderObjectPool.clear();
        if (this.transformPool) this.transformPool.clear();
        
        this.isInitialized = false;
        this.isActive = false;
        
        console.log('[Renderer] Módulo destruido');
    }
}