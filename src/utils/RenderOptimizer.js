/**
 * RenderOptimizer - Sistema de optimización de renderizado para Spikepulse
 * @module RenderOptimizer
 */

export class RenderOptimizer {
    /**
     * Crea una nueva instancia del optimizador de renderizado
     * @param {Object} config - Configuración del optimizador
     * @param {EventBus} eventBus - Bus de eventos para comunicación
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isEnabled = config.renderer?.enableOptimizations !== false;
        this.isInitialized = false;

        // Configuración de optimización
        this.optimization = {
            enableCulling: config.renderer?.cullingEnabled !== false,
            cullingMargin: config.renderer?.cullingMargin || 50,
            enableDirtyRectangles: config.renderer?.enableDirtyRectangles !== false,
            enableLayerCaching: config.renderer?.enableLayerCaching !== false,
            maxRenderObjects: config.renderer?.maxRenderObjects || 1000,
            targetFPS: config.performance?.targetFPS || 60,
            adaptiveQuality: true
        };

        // Estado del renderizado
        this.renderState = {
            frameCount: 0,
            lastFrameTime: 0,
            averageFrameTime: 0,
            frameTimeHistory: [],
            maxFrameTimeHistory: 60,
            isPerformanceLow: false,
            qualityLevel: 1.0, // 0.0 - 1.0
            adaptiveEnabled: true
        };

        // Métricas de optimización
        this.metrics = {
            objectsCulled: 0,
            objectsRendered: 0,
            dirtyRectangles: 0,
            layersCached: 0,
            qualityAdjustments: 0,
            renderCalls: 0,
            batchedCalls: 0
        };

        // Cache de layers
        this.layerCache = new Map();
        this.layerCacheDirty = new Set();

        // Regiones sucias para optimización
        this.dirtyRegions = [];
        this.lastDirtyRegions = [];

        // Lista de objetos a renderizar
        this.renderQueue = [];
        this.culledObjects = [];

        // Configuración de calidad adaptativa
        this.qualitySettings = {
            high: {
                particleCount: 1.0,
                effectQuality: 1.0,
                shadowQuality: 1.0,
                antialiasing: true,
                imageSmoothingQuality: 'high'
            },
            medium: {
                particleCount: 0.7,
                effectQuality: 0.8,
                shadowQuality: 0.6,
                antialiasing: true,
                imageSmoothingQuality: 'medium'
            },
            low: {
                particleCount: 0.4,
                effectQuality: 0.5,
                shadowQuality: 0.3,
                antialiasing: false,
                imageSmoothingQuality: 'low'
            }
        };

        this.init();
    }

    /**
     * Inicializar el optimizador
     * @private
     */
    init() {
        if (this.isInitialized || !this.isEnabled) return;

        this.setupEventListeners();
        this.initializeLayerCache();
        
        this.isInitialized = true;
        console.log('[RenderOptimizer] Optimizador de renderizado inicializado');
    }

    /**
     * Configurar listeners de eventos
     * @private
     */
    setupEventListeners() {
        // Eventos de renderizado
        this.eventBus.on('render:frame-start', this.onFrameStart, this);
        this.eventBus.on('render:frame-end', this.onFrameEnd, this);
        this.eventBus.on('render:object-queue', this.onObjectQueue, this);
        
        // Eventos de performance
        this.eventBus.on('performance:update', this.onPerformanceUpdate, this);
        this.eventBus.on('performance:alert', this.onPerformanceAlert, this);
        
        // Eventos de configuración
        this.eventBus.on('optimizer:configure', this.configure, this);
        this.eventBus.on('optimizer:reset-cache', this.resetCache, this);
        this.eventBus.on('optimizer:get-stats', this.getStats, this);
    }

    /**
     * Inicializar cache de layers
     * @private
     */
    initializeLayerCache() {
        if (!this.optimization.enableLayerCaching) return;

        const layers = this.config.renderer?.layers || {};
        
        for (const [layerName, layerConfig] of Object.entries(layers)) {
            if (layerConfig.enableCaching) {
                this.layerCache.set(layerName, {
                    canvas: null,
                    context: null,
                    isDirty: true,
                    lastUpdate: 0,
                    objects: []
                });
            }
        }

        console.log(`[RenderOptimizer] Cache de layers inicializado: ${this.layerCache.size} layers`);
    }

    /**
     * Manejar inicio de frame
     * @param {Object} data - Datos del frame
     */
    onFrameStart(data) {
        this.renderState.frameCount++;
        this.renderState.lastFrameTime = performance.now();
        
        // Limpiar cola de renderizado
        this.renderQueue.length = 0;
        this.culledObjects.length = 0;
        this.dirtyRegions.length = 0;
    }

    /**
     * Manejar fin de frame
     * @param {Object} data - Datos del frame
     */
    onFrameEnd(data) {
        const frameTime = performance.now() - this.renderState.lastFrameTime;
        this.updateFrameTimeMetrics(frameTime);
        
        // Evaluar si necesitamos ajustar calidad
        if (this.renderState.adaptiveEnabled) {
            this.evaluateQualityAdjustment();
        }

        // Emitir estadísticas de optimización
        this.eventBus.emit('optimizer:stats', {
            objectsRendered: this.metrics.objectsRendered,
            objectsCulled: this.metrics.objectsCulled,
            qualityLevel: this.renderState.qualityLevel,
            frameTime: frameTime,
            dirtyRegions: this.metrics.dirtyRectangles
        });
    }

    /**
     * Actualizar métricas de tiempo de frame
     * @param {number} frameTime - Tiempo del frame
     * @private
     */
    updateFrameTimeMetrics(frameTime) {
        this.renderState.frameTimeHistory.push(frameTime);
        
        if (this.renderState.frameTimeHistory.length > this.renderState.maxFrameTimeHistory) {
            this.renderState.frameTimeHistory.shift();
        }

        // Calcular promedio
        const sum = this.renderState.frameTimeHistory.reduce((a, b) => a + b, 0);
        this.renderState.averageFrameTime = sum / this.renderState.frameTimeHistory.length;

        // Determinar si el rendimiento es bajo
        const targetFrameTime = 1000 / this.optimization.targetFPS;
        this.renderState.isPerformanceLow = this.renderState.averageFrameTime > targetFrameTime * 1.2;
    }

    /**
     * Evaluar ajuste de calidad
     * @private
     */
    evaluateQualityAdjustment() {
        const targetFrameTime = 1000 / this.optimization.targetFPS;
        const currentFrameTime = this.renderState.averageFrameTime;
        
        let newQualityLevel = this.renderState.qualityLevel;

        if (currentFrameTime > targetFrameTime * 1.3) {
            // Rendimiento muy bajo, reducir calidad
            newQualityLevel = Math.max(0.3, this.renderState.qualityLevel - 0.1);
        } else if (currentFrameTime > targetFrameTime * 1.1) {
            // Rendimiento bajo, reducir calidad ligeramente
            newQualityLevel = Math.max(0.5, this.renderState.qualityLevel - 0.05);
        } else if (currentFrameTime < targetFrameTime * 0.8) {
            // Buen rendimiento, aumentar calidad
            newQualityLevel = Math.min(1.0, this.renderState.qualityLevel + 0.05);
        }

        if (newQualityLevel !== this.renderState.qualityLevel) {
            this.setQualityLevel(newQualityLevel);
        }
    }

    /**
     * Establecer nivel de calidad
     * @param {number} level - Nivel de calidad (0.0 - 1.0)
     */
    setQualityLevel(level) {
        const oldLevel = this.renderState.qualityLevel;
        this.renderState.qualityLevel = Math.max(0.0, Math.min(1.0, level));
        
        if (oldLevel !== this.renderState.qualityLevel) {
            this.metrics.qualityAdjustments++;
            
            console.log(`[RenderOptimizer] Calidad ajustada: ${oldLevel.toFixed(2)} -> ${this.renderState.qualityLevel.toFixed(2)}`);
            
            this.eventBus.emit('optimizer:quality-changed', {
                oldLevel,
                newLevel: this.renderState.qualityLevel,
                reason: this.renderState.isPerformanceLow ? 'performance' : 'optimization'
            });
        }
    }

    /**
     * Obtener configuración de calidad actual
     * @returns {Object} Configuración de calidad
     */
    getCurrentQualitySettings() {
        const level = this.renderState.qualityLevel;
        
        if (level >= 0.8) {
            return this.qualitySettings.high;
        } else if (level >= 0.5) {
            return this.qualitySettings.medium;
        } else {
            return this.qualitySettings.low;
        }
    }

    /**
     * Manejar cola de objetos para renderizar
     * @param {Object} data - Datos de la cola
     */
    onObjectQueue(data) {
        const { objects, viewport } = data;
        
        // Aplicar culling si está habilitado
        if (this.optimization.enableCulling) {
            this.performCulling(objects, viewport);
        } else {
            this.renderQueue = [...objects];
        }

        // Limitar número de objetos si es necesario
        if (this.renderQueue.length > this.optimization.maxRenderObjects) {
            this.renderQueue = this.prioritizeRenderObjects(this.renderQueue);
        }

        this.metrics.objectsRendered = this.renderQueue.length;
        this.metrics.objectsCulled = objects.length - this.renderQueue.length;
    }

    /**
     * Realizar culling de objetos fuera de vista
     * @param {Array} objects - Objetos a evaluar
     * @param {Object} viewport - Viewport actual
     * @private
     */
    performCulling(objects, viewport) {
        const margin = this.optimization.cullingMargin;
        const cullingBounds = {
            left: viewport.x - margin,
            right: viewport.x + viewport.width + margin,
            top: viewport.y - margin,
            bottom: viewport.y + viewport.height + margin
        };

        this.renderQueue = [];
        this.culledObjects = [];

        for (const obj of objects) {
            if (this.isObjectInBounds(obj, cullingBounds)) {
                this.renderQueue.push(obj);
            } else {
                this.culledObjects.push(obj);
            }
        }
    }

    /**
     * Verificar si un objeto está dentro de los límites
     * @param {Object} obj - Objeto a verificar
     * @param {Object} bounds - Límites de culling
     * @returns {boolean} True si está dentro de los límites
     * @private
     */
    isObjectInBounds(obj, bounds) {
        const objBounds = this.getObjectBounds(obj);
        
        return !(objBounds.right < bounds.left ||
                objBounds.left > bounds.right ||
                objBounds.bottom < bounds.top ||
                objBounds.top > bounds.bottom);
    }

    /**
     * Obtener límites de un objeto
     * @param {Object} obj - Objeto
     * @returns {Object} Límites del objeto
     * @private
     */
    getObjectBounds(obj) {
        return {
            left: obj.x || 0,
            right: (obj.x || 0) + (obj.width || 0),
            top: obj.y || 0,
            bottom: (obj.y || 0) + (obj.height || 0)
        };
    }

    /**
     * Priorizar objetos para renderizado
     * @param {Array} objects - Objetos a priorizar
     * @returns {Array} Objetos priorizados
     * @private
     */
    prioritizeRenderObjects(objects) {
        // Ordenar por prioridad (z-index, distancia al jugador, etc.)
        return objects
            .sort((a, b) => {
                // Prioridad por z-index
                const zDiff = (b.zIndex || 0) - (a.zIndex || 0);
                if (zDiff !== 0) return zDiff;
                
                // Prioridad por distancia al centro de la pantalla
                const centerX = this.config.canvas?.width / 2 || 400;
                const centerY = this.config.canvas?.height / 2 || 200;
                
                const distA = Math.sqrt(Math.pow((a.x || 0) - centerX, 2) + Math.pow((a.y || 0) - centerY, 2));
                const distB = Math.sqrt(Math.pow((b.x || 0) - centerX, 2) + Math.pow((b.y || 0) - centerY, 2));
                
                return distA - distB;
            })
            .slice(0, this.optimization.maxRenderObjects);
    }

    /**
     * Agregar región sucia
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @param {number} width - Ancho
     * @param {number} height - Alto
     */
    addDirtyRegion(x, y, width, height) {
        if (!this.optimization.enableDirtyRectangles) return;

        const region = { x, y, width, height };
        
        // Verificar si se superpone con regiones existentes
        let merged = false;
        for (let i = 0; i < this.dirtyRegions.length; i++) {
            if (this.regionsOverlap(region, this.dirtyRegions[i])) {
                this.dirtyRegions[i] = this.mergeRegions(region, this.dirtyRegions[i]);
                merged = true;
                break;
            }
        }

        if (!merged) {
            this.dirtyRegions.push(region);
        }

        this.metrics.dirtyRectangles = this.dirtyRegions.length;
    }

    /**
     * Verificar si dos regiones se superponen
     * @param {Object} region1 - Primera región
     * @param {Object} region2 - Segunda región
     * @returns {boolean} True si se superponen
     * @private
     */
    regionsOverlap(region1, region2) {
        return !(region1.x + region1.width < region2.x ||
                region2.x + region2.width < region1.x ||
                region1.y + region1.height < region2.y ||
                region2.y + region2.height < region1.y);
    }

    /**
     * Fusionar dos regiones
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
     * Obtener regiones sucias para renderizado
     * @returns {Array} Array de regiones sucias
     */
    getDirtyRegions() {
        return [...this.dirtyRegions];
    }

    /**
     * Limpiar regiones sucias
     */
    clearDirtyRegions() {
        this.lastDirtyRegions = [...this.dirtyRegions];
        this.dirtyRegions.length = 0;
    }

    /**
     * Marcar layer como sucio
     * @param {string} layerName - Nombre del layer
     */
    markLayerDirty(layerName) {
        if (this.layerCache.has(layerName)) {
            this.layerCache.get(layerName).isDirty = true;
            this.layerCacheDirty.add(layerName);
        }
    }

    /**
     * Obtener canvas de layer cacheado
     * @param {string} layerName - Nombre del layer
     * @returns {HTMLCanvasElement|null} Canvas del layer o null
     */
    getLayerCanvas(layerName) {
        const layerData = this.layerCache.get(layerName);
        if (!layerData) return null;

        if (!layerData.canvas) {
            // Crear canvas para el layer
            layerData.canvas = document.createElement('canvas');
            layerData.canvas.width = this.config.canvas?.width || 800;
            layerData.canvas.height = this.config.canvas?.height || 400;
            layerData.context = layerData.canvas.getContext('2d');
        }

        return layerData.canvas;
    }

    /**
     * Verificar si layer necesita actualización
     * @param {string} layerName - Nombre del layer
     * @returns {boolean} True si necesita actualización
     */
    isLayerDirty(layerName) {
        const layerData = this.layerCache.get(layerName);
        return layerData ? layerData.isDirty : false;
    }

    /**
     * Marcar layer como limpio
     * @param {string} layerName - Nombre del layer
     */
    markLayerClean(layerName) {
        const layerData = this.layerCache.get(layerName);
        if (layerData) {
            layerData.isDirty = false;
            layerData.lastUpdate = performance.now();
            this.layerCacheDirty.delete(layerName);
            this.metrics.layersCached++;
        }
    }

    /**
     * Manejar actualización de rendimiento
     * @param {Object} data - Datos de rendimiento
     */
    onPerformanceUpdate(data) {
        // Ajustar optimizaciones basado en rendimiento
        if (data.fps < this.optimization.targetFPS * 0.8) {
            this.enableAggressiveOptimizations();
        } else if (data.fps > this.optimization.targetFPS * 0.95) {
            this.relaxOptimizations();
        }
    }

    /**
     * Manejar alerta de rendimiento
     * @param {Object} data - Datos de la alerta
     */
    onPerformanceAlert(data) {
        if (data.type === 'low-fps' || data.type === 'high-frame-time') {
            this.enableAggressiveOptimizations();
        }
    }

    /**
     * Habilitar optimizaciones agresivas
     * @private
     */
    enableAggressiveOptimizations() {
        this.optimization.maxRenderObjects = Math.max(100, this.optimization.maxRenderObjects * 0.8);
        this.optimization.cullingMargin = Math.max(25, this.optimization.cullingMargin * 0.8);
        this.setQualityLevel(Math.max(0.3, this.renderState.qualityLevel - 0.2));
        
        console.log('[RenderOptimizer] Optimizaciones agresivas habilitadas');
    }

    /**
     * Relajar optimizaciones
     * @private
     */
    relaxOptimizations() {
        this.optimization.maxRenderObjects = Math.min(1000, this.optimization.maxRenderObjects * 1.1);
        this.optimization.cullingMargin = Math.min(100, this.optimization.cullingMargin * 1.1);
        this.setQualityLevel(Math.min(1.0, this.renderState.qualityLevel + 0.1));
        
        console.log('[RenderOptimizer] Optimizaciones relajadas');
    }

    /**
     * Configurar optimizador
     * @param {Object} newConfig - Nueva configuración
     */
    configure(newConfig) {
        this.optimization = { ...this.optimization, ...newConfig };
        console.log('[RenderOptimizer] Configuración actualizada:', newConfig);
    }

    /**
     * Resetear cache
     */
    resetCache() {
        // Limpiar cache de layers
        for (const [layerName, layerData] of this.layerCache.entries()) {
            if (layerData.context) {
                layerData.context.clearRect(0, 0, layerData.canvas.width, layerData.canvas.height);
            }
            layerData.isDirty = true;
        }

        this.layerCacheDirty.clear();
        this.dirtyRegions.length = 0;
        this.lastDirtyRegions.length = 0;

        console.log('[RenderOptimizer] Cache reseteado');
    }

    /**
     * Obtener estadísticas del optimizador
     * @returns {Object} Estadísticas de optimización
     */
    getStats() {
        return {
            isEnabled: this.isEnabled,
            optimization: { ...this.optimization },
            renderState: { ...this.renderState },
            metrics: { ...this.metrics },
            layerCache: {
                size: this.layerCache.size,
                dirty: this.layerCacheDirty.size
            },
            dirtyRegions: this.dirtyRegions.length,
            qualitySettings: this.getCurrentQualitySettings()
        };
    }

    /**
     * Limpiar recursos del optimizador
     */
    destroy() {
        // Limpiar cache de layers
        for (const [layerName, layerData] of this.layerCache.entries()) {
            if (layerData.canvas) {
                layerData.canvas = null;
                layerData.context = null;
            }
        }
        this.layerCache.clear();
        this.layerCacheDirty.clear();

        // Limpiar arrays
        this.renderQueue.length = 0;
        this.culledObjects.length = 0;
        this.dirtyRegions.length = 0;
        this.lastDirtyRegions.length = 0;

        // Limpiar event listeners
        this.eventBus.off('render:frame-start', this.onFrameStart, this);
        this.eventBus.off('render:frame-end', this.onFrameEnd, this);
        this.eventBus.off('render:object-queue', this.onObjectQueue, this);
        this.eventBus.off('performance:update', this.onPerformanceUpdate, this);
        this.eventBus.off('performance:alert', this.onPerformanceAlert, this);
        this.eventBus.off('optimizer:configure', this.configure, this);
        this.eventBus.off('optimizer:reset-cache', this.resetCache, this);
        this.eventBus.off('optimizer:get-stats', this.getStats, this);

        this.isInitialized = false;
        console.log('[RenderOptimizer] Optimizador destruido');
    }
}