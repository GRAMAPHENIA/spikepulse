/**
 * Renderer Module Index - Punto de entrada para el sistema de renderizado
 * Exporta todos los componentes del sistema de renderizado optimizado
 * @module RendererSystem
 */

// Exportar módulos principales
export { Renderer } from './Renderer.js';
export { RenderLayer } from './RenderLayer.js';
export { EffectsManager } from './EffectsManager.js';
export { SpikepulseEffects } from './SpikepulseEffects.js';
export { PerformanceMonitor } from './PerformanceMonitor.js';

/**
 * Crear instancia completa del sistema de renderizado
 * @param {HTMLCanvasElement} canvas - Canvas del juego
 * @param {Object} config - Configuración del sistema de renderizado
 * @param {EventBus} eventBus - Bus de eventos
 * @returns {Object} Sistema de renderizado completo
 */
export function createRenderSystem(canvas, config, eventBus) {
    console.log('[RendererSystem] Creando sistema de renderizado completo...');
    
    try {
        // Validar parámetros
        if (!canvas || !canvas.getContext) {
            throw new Error('Canvas válido requerido');
        }
        
        if (!eventBus || typeof eventBus.emit !== 'function') {
            throw new Error('EventBus válido requerido');
        }
        
        // Crear instancia principal del renderer
        const renderer = new Renderer(config, eventBus);
        
        // Inicializar el renderer con el canvas
        renderer.init(canvas, eventBus, config);
        
        // Configurar comunicación entre módulos
        setupRendererModuleCommunication(renderer, eventBus);
        
        // Crear objeto del sistema de renderizado
        const renderSystem = {
            renderer,
            
            // Métodos de control del sistema
            render(deltaTime) {
                renderer.update(deltaTime);
                renderer.render();
                return this;
            },
            
            update(deltaTime) {
                renderer.update(deltaTime);
                return this;
            },
            
            renderFrame(ctx = null) {
                renderer.render(ctx);
                return this;
            },
            
            // Métodos de gestión de capas
            addToLayer(layerName, object) {
                const layer = renderer.layers.get(layerName);
                if (layer) {
                    return layer.addObject(object);
                }
                console.warn(`[RendererSystem] Capa '${layerName}' no encontrada`);
                return null;
            },
            
            removeFromLayer(layerName, objectId) {
                const layer = renderer.layers.get(layerName);
                if (layer) {
                    return layer.removeObject(objectId);
                }
                console.warn(`[RendererSystem] Capa '${layerName}' no encontrada`);
                return null;
            },
            
            clearLayer(layerName) {
                const layer = renderer.layers.get(layerName);
                if (layer) {
                    layer.clear();
                }
                return this;
            },
            
            getLayer(layerName) {
                return renderer.layers.get(layerName) || null;
            },
            
            // Métodos de efectos
            addEffect(effectType, config) {
                if (renderer.effectsManager) {
                    return renderer.effectsManager.addEffect(effectType, config);
                }
                return null;
            },
            
            removeEffect(effectId) {
                if (renderer.effectsManager) {
                    renderer.effectsManager.removeEffect(effectId);
                }
                return this;
            },
            
            // Métodos de viewport/cámara
            setViewport(x, y, scale = 1, rotation = 0) {
                renderer.renderState.viewportX = x;
                renderer.renderState.viewportY = y;
                renderer.renderState.scale = scale;
                renderer.renderState.rotation = rotation;
                return this;
            },
            
            moveViewport(deltaX, deltaY) {
                renderer.renderState.viewportX += deltaX;
                renderer.renderState.viewportY += deltaY;
                return this;
            },
            
            getViewport() {
                return {
                    x: renderer.renderState.viewportX,
                    y: renderer.renderState.viewportY,
                    scale: renderer.renderState.scale,
                    rotation: renderer.renderState.rotation
                };
            },
            
            // Métodos de optimización
            addDirtyRegion(x, y, width, height) {
                renderer.addDirtyRegion(x, y, width, height);
                return this;
            },
            
            enableOptimization(optimizationName, enabled = true) {
                if (renderer.optimizations.hasOwnProperty(optimizationName)) {
                    renderer.optimizations[optimizationName] = enabled;
                    console.log(`[RendererSystem] Optimización '${optimizationName}' ${enabled ? 'habilitada' : 'deshabilitada'}`);
                }
                return this;
            },
            
            // Métodos de información y debug
            getMetrics() {
                return {
                    renderer: renderer.metrics,
                    performance: renderer.performanceMonitor ? renderer.performanceMonitor.getMetrics() : null,
                    layers: Array.from(renderer.layers.entries()).map(([name, layer]) => ({
                        name,
                        metrics: layer.getMetrics(),
                        objectCount: layer.getObjectCount(),
                        visible: layer.isVisible()
                    }))
                };
            },
            
            getPerformanceInfo() {
                if (!renderer.performanceMonitor) {
                    return null;
                }
                
                return {
                    fps: renderer.performanceMonitor.getCurrentFPS(),
                    frameTime: renderer.performanceMonitor.getAverageFrameTime(),
                    renderTime: renderer.performanceMonitor.getAverageRenderTime(),
                    memoryUsage: renderer.performanceMonitor.getMemoryUsage()
                };
            },
            
            isInitialized() {
                return renderer.isInitialized;
            },
            
            isActive() {
                return renderer.isActive;
            },
            
            // Métodos de configuración
            updateConfig(newConfig) {
                renderer.config = { ...renderer.config, ...newConfig };
                return this;
            },
            
            getConfig() {
                return { ...renderer.config };
            },
            
            // Método de destrucción
            destroy() {
                console.log('[RendererSystem] Destruyendo sistema de renderizado...');
                
                if (renderer && renderer.destroy) {
                    renderer.destroy();
                }
                
                console.log('[RendererSystem] Sistema de renderizado destruido');
            }
        };
        
        console.log('[RendererSystem] Sistema de renderizado creado exitosamente');
        return renderSystem;
        
    } catch (error) {
        console.error('[RendererSystem] Error al crear sistema de renderizado:', error);
        throw error;
    }
}

/**
 * Configurar comunicación entre módulos del renderer
 * @param {Renderer} renderer - Instancia del renderer
 * @param {EventBus} eventBus - Bus de eventos
 * @private
 */
function setupRendererModuleCommunication(renderer, eventBus) {
    console.log('[RendererSystem] Configurando comunicación entre módulos...');
    
    // Eventos de renderizado
    eventBus.on('render:add-object', (data) => {
        const { layerName, object } = data;
        const layer = renderer.layers.get(layerName);
        if (layer) {
            const objectId = layer.addObject(object);
            eventBus.emit('render:object-added', { layerName, objectId, object });
        }
    });
    
    eventBus.on('render:remove-object', (data) => {
        const { layerName, objectId } = data;
        const layer = renderer.layers.get(layerName);
        if (layer) {
            const removedObject = layer.removeObject(objectId);
            if (removedObject) {
                eventBus.emit('render:object-removed', { layerName, objectId, object: removedObject });
            }
        }
    });
    
    eventBus.on('render:clear-layer', (data) => {
        const { layerName } = data;
        const layer = renderer.layers.get(layerName);
        if (layer) {
            layer.clear();
            eventBus.emit('render:layer-cleared', { layerName });
        }
    });
    
    // Eventos de cámara/viewport
    eventBus.on('camera:move', (data) => {
        const { x, y } = data;
        renderer.renderState.viewportX = x;
        renderer.renderState.viewportY = y;
    });
    
    eventBus.on('camera:zoom', (data) => {
        const { scale } = data;
        renderer.renderState.scale = scale;
    });
    
    eventBus.on('camera:rotate', (data) => {
        const { rotation } = data;
        renderer.renderState.rotation = rotation;
    });
    
    // Eventos de efectos
    eventBus.on('effects:add', (data) => {
        if (renderer.effectsManager) {
            const effectId = renderer.effectsManager.addEffect(data.type, data.config);
            eventBus.emit('effects:added', { effectId, type: data.type, config: data.config });
        }
    });
    
    eventBus.on('effects:remove', (data) => {
        if (renderer.effectsManager) {
            renderer.effectsManager.removeEffect(data.effectId);
            eventBus.emit('effects:removed', { effectId: data.effectId });
        }
    });
    
    // Eventos de optimización
    eventBus.on('render:dirty-region', (data) => {
        const { x, y, width, height } = data;
        renderer.addDirtyRegion(x, y, width, height);
    });
    
    eventBus.on('render:toggle-optimization', (data) => {
        const { optimization, enabled } = data;
        if (renderer.optimizations.hasOwnProperty(optimization)) {
            renderer.optimizations[optimization] = enabled;
            console.log(`[RendererSystem] Optimización '${optimization}' ${enabled ? 'habilitada' : 'deshabilitada'}`);
        }
    });
    
    // Eventos de estado del juego
    eventBus.on('game:start', () => {
        renderer.isActive = true;
        console.log('[RendererSystem] Renderizado activado');
    });
    
    eventBus.on('game:pause', () => {
        renderer.isActive = false;
        console.log('[RendererSystem] Renderizado pausado');
    });
    
    eventBus.on('game:resume', () => {
        renderer.isActive = true;
        console.log('[RendererSystem] Renderizado reanudado');
    });
    
    eventBus.on('game:stop', () => {
        renderer.isActive = false;
        console.log('[RendererSystem] Renderizado detenido');
    });
    
    // Eventos de redimensionamiento
    eventBus.on('canvas:resize', (data) => {
        const { width, height } = data;
        renderer.canvasWidth = width;
        renderer.canvasHeight = height;
        
        // Redimensionar caches de capas si es necesario
        renderer.layers.forEach(layer => {
            if (layer.enableCaching) {
                layer.resizeCache(width, height);
            }
        });
        
        console.log(`[RendererSystem] Canvas redimensionado a ${width}x${height}`);
    });
    
    // Eventos de debug
    eventBus.on('debug:toggle-metrics', (data) => {
        if (renderer.config.debug) {
            renderer.config.debug.showMetrics = data.enabled;
        }
    });
    
    eventBus.on('debug:toggle-layer', (data) => {
        const { layerName, visible } = data;
        const layer = renderer.layers.get(layerName);
        if (layer) {
            layer.setVisible(visible);
            console.log(`[RendererSystem] Capa '${layerName}' ${visible ? 'mostrada' : 'ocultada'}`);
        }
    });
    
    console.log('[RendererSystem] Comunicación entre módulos configurada');
}

/**
 * Configuración por defecto para el sistema de renderizado
 */
export const DEFAULT_RENDERER_CONFIG = {
    renderer: {
        enableDirtyRectangles: true,
        enableObjectPooling: true,
        enableLayerCaching: false, // Deshabilitado por defecto para mejor compatibilidad
        maxRenderObjects: 1000,
        cullingEnabled: true,
        cullingMargin: 50,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
        backgroundColor: null
    },
    layers: {
        background: {
            zIndex: 0,
            parallax: { x: 0.1, y: 0.1 },
            enableCaching: true,
            enableSorting: false
        },
        world: {
            zIndex: 1,
            parallax: { x: 0.5, y: 0.5 },
            enableCaching: false,
            enableSorting: true,
            sortBy: 'y'
        },
        entities: {
            zIndex: 2,
            parallax: { x: 1, y: 1 },
            enableCaching: false,
            enableSorting: true,
            sortBy: 'zIndex'
        },
        player: {
            zIndex: 3,
            parallax: { x: 1, y: 1 },
            enableCaching: false,
            enableSorting: false
        },
        effects: {
            zIndex: 4,
            parallax: { x: 1, y: 1 },
            enableCaching: false,
            enableSorting: true,
            sortBy: 'zIndex'
        },
        ui: {
            zIndex: 5,
            parallax: { x: 0, y: 0 },
            enableCaching: false,
            enableSorting: true,
            sortBy: 'zIndex'
        },
        debug: {
            zIndex: 6,
            parallax: { x: 0, y: 0 },
            enableCaching: false,
            enableSorting: false,
            visible: false
        }
    },
    effects: {
        maxParticles: 500,
        enablePooling: true,
        enableBatching: true
    },
    spikepulseEffects: {
        enablePulseEffects: true,
        enableGlowEffects: true,
        enableTrailEffects: true
    },
    performance: {
        enableMonitoring: true,
        sampleSize: 60,
        alertThreshold: 30 // FPS mínimo antes de alertas
    },
    debug: {
        showMetrics: false,
        showBounds: false,
        showLayers: false
    }
};

/**
 * Validar configuración del sistema de renderizado
 * @param {Object} config - Configuración a validar
 * @returns {boolean} Si la configuración es válida
 */
export function validateRendererConfig(config) {
    try {
        // Validaciones básicas
        if (!config || typeof config !== 'object') {
            console.warn('[RendererSystem] Configuración inválida, usando valores por defecto');
            return false;
        }
        
        // Validar configuración del renderer
        if (config.renderer) {
            const r = config.renderer;
            
            if (r.maxRenderObjects && (r.maxRenderObjects < 1 || r.maxRenderObjects > 10000)) {
                console.warn('[RendererSystem] maxRenderObjects fuera de rango, usando valor por defecto');
                r.maxRenderObjects = 1000;
            }
            
            if (r.cullingMargin && (r.cullingMargin < 0 || r.cullingMargin > 200)) {
                console.warn('[RendererSystem] cullingMargin fuera de rango, usando valor por defecto');
                r.cullingMargin = 50;
            }
        }
        
        // Validar configuración de capas
        if (config.layers) {
            Object.entries(config.layers).forEach(([layerName, layerConfig]) => {
                if (layerConfig.parallax) {
                    const p = layerConfig.parallax;
                    if (p.x < 0 || p.x > 2 || p.y < 0 || p.y > 2) {
                        console.warn(`[RendererSystem] Parallax inválido para capa '${layerName}', usando valores por defecto`);
                        layerConfig.parallax = { x: 1, y: 1 };
                    }
                }
            });
        }
        
        return true;
        
    } catch (error) {
        console.error('[RendererSystem] Error al validar configuración:', error);
        return false;
    }
}

/**
 * Obtener configuración del renderer combinada con valores por defecto
 * @param {Object} userConfig - Configuración del usuario
 * @returns {Object} Configuración combinada
 */
export function getRendererConfig(userConfig = {}) {
    // Validar configuración del usuario
    if (!validateRendererConfig(userConfig)) {
        userConfig = {};
    }
    
    // Combinar con configuración por defecto
    return {
        renderer: { ...DEFAULT_RENDERER_CONFIG.renderer, ...(userConfig.renderer || {}) },
        layers: { ...DEFAULT_RENDERER_CONFIG.layers, ...(userConfig.layers || {}) },
        effects: { ...DEFAULT_RENDERER_CONFIG.effects, ...(userConfig.effects || {}) },
        spikepulseEffects: { ...DEFAULT_RENDERER_CONFIG.spikepulseEffects, ...(userConfig.spikepulseEffects || {}) },
        performance: { ...DEFAULT_RENDERER_CONFIG.performance, ...(userConfig.performance || {}) },
        debug: { ...DEFAULT_RENDERER_CONFIG.debug, ...(userConfig.debug || {}) }
    };
}

/**
 * Utilidades para el sistema de renderizado
 */
export const RendererUtils = {
    /**
     * Crear objeto de renderizado básico
     * @param {string} type - Tipo de objeto
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} width - Ancho
     * @param {number} height - Alto
     * @param {Object} style - Estilo del objeto
     * @returns {Object} Objeto de renderizado
     */
    createRenderObject(type, x, y, width, height, style = {}) {
        return {
            type,
            x, y, width, height,
            visible: true,
            alpha: 1,
            rotation: 0,
            scale: 1,
            zIndex: 0,
            ...style
        };
    },
    
    /**
     * Crear rectángulo de renderizado
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} width - Ancho
     * @param {number} height - Alto
     * @param {string} fillStyle - Color de relleno
     * @param {string} strokeStyle - Color de borde
     * @returns {Object} Objeto rectángulo
     */
    createRectangle(x, y, width, height, fillStyle = '#FFFFFF', strokeStyle = null) {
        return this.createRenderObject('rectangle', x, y, width, height, {
            fillStyle,
            strokeStyle,
            lineWidth: strokeStyle ? 1 : 0
        });
    },
    
    /**
     * Crear círculo de renderizado
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} radius - Radio
     * @param {string} fillStyle - Color de relleno
     * @param {string} strokeStyle - Color de borde
     * @returns {Object} Objeto círculo
     */
    createCircle(x, y, radius, fillStyle = '#FFFFFF', strokeStyle = null) {
        return this.createRenderObject('circle', x, y, radius * 2, radius * 2, {
            radius,
            fillStyle,
            strokeStyle,
            lineWidth: strokeStyle ? 1 : 0
        });
    },
    
    /**
     * Crear texto de renderizado
     * @param {string} text - Texto a mostrar
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {string} font - Fuente
     * @param {string} fillStyle - Color del texto
     * @returns {Object} Objeto texto
     */
    createText(text, x, y, font = '16px Arial', fillStyle = '#FFFFFF') {
        return this.createRenderObject('text', x, y, 0, 0, {
            text,
            font,
            fillStyle,
            textAlign: 'left',
            textBaseline: 'top'
        });
    }
};