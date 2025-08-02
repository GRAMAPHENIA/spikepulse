/**
 * FullscreenIntegrator - Integración del sistema fullscreen con el GameEngine existente
 * @module FullscreenIntegrator
 */

import { FullscreenCanvasManager } from './FullscreenCanvasManager.js';
import { ViewportManager } from './ViewportManager.js';
import { ResponsiveHandler } from './ResponsiveHandler.js';
import { PerformanceOptimizer } from './PerformanceOptimizer.js';
import { ScalableMemoryManager } from './ScalableMemoryManager.js';

/**
 * Integrador que conecta el sistema fullscreen con el GameEngine existente
 */
export class FullscreenIntegrator {
    /**
     * Crea una nueva instancia del FullscreenIntegrator
     * @param {HTMLCanvasElement} canvas - Canvas del juego
     * @param {Object} config - Configuración del sistema
     * @param {EventBus} eventBus - Bus de eventos del juego
     */
    constructor(canvas, config, eventBus) {
        this.canvas = canvas;
        this.config = config;
        this.eventBus = eventBus;
        this.isInitialized = false;
        
        // Componentes del sistema fullscreen
        this.fullscreenManager = null;
        this.viewportManager = null;
        this.responsiveHandler = null;
        this.performanceOptimizer = null;
        this.memoryManager = null;
        
        // Estado de integración
        this.integrationState = {
            fullscreenEnabled: false,
            currentQuality: 'high',
            deviceType: 'desktop',
            orientation: 'landscape',
            isOptimizing: false
        };
        
        // Referencias al sistema existente
        this.gameEngine = null;
        this.renderer = null;
        
        this.init();
    }

    /**
     * Inicializar el integrador
     * @private
     */
    init() {
        try {
            this.initializeComponents();
            this.setupIntegrationEvents();
            this.connectToExistingSystem();
            this.isInitialized = true;
            
            console.log('[FullscreenIntegrator] Sistema fullscreen integrado correctamente');
            
            this.eventBus.emit('fullscreen-system:initialized', {
                state: this.integrationState,
                components: this.getComponentStatus()
            });
            
        } catch (error) {
            console.error('[FullscreenIntegrator] Error durante inicialización:', error);
            throw error;
        }
    }

    /**
     * Inicializar componentes del sistema fullscreen
     * @private
     */
    initializeComponents() {
        // Configuración para FullscreenCanvasManager
        const canvasConfig = {
            ...this.config.canvas,
            minWidth: this.config.canvas?.minWidth || 320,
            minHeight: this.config.canvas?.minHeight || 240,
            maxWidth: this.config.canvas?.maxWidth || 3840,
            maxHeight: this.config.canvas?.maxHeight || 2160,
            aspectRatio: this.config.canvas?.aspectRatio || 16/9,
            maintainAspectRatio: this.config.canvas?.maintainAspectRatio !== false
        };
        
        // Inicializar FullscreenCanvasManager
        this.fullscreenManager = new FullscreenCanvasManager(
            this.canvas, 
            { canvas: canvasConfig }, 
            this.eventBus
        );
        
        // Inicializar ViewportManager
        this.viewportManager = new ViewportManager(canvasConfig, this.eventBus);
        
        // Configuración para ResponsiveHandler
        const responsiveConfig = {
            breakpoints: this.config.responsive?.breakpoints || {
                mobile: 768,
                tablet: 1024,
                desktop: 1440
            },
            touchOptimization: this.config.responsive?.touchOptimization !== false,
            adaptiveUI: this.config.responsive?.adaptiveUI !== false,
            orientationHandling: this.config.responsive?.orientationHandling !== false
        };
        
        // Inicializar ResponsiveHandler
        this.responsiveHandler = new ResponsiveHandler(responsiveConfig, this.eventBus);
        
        // Configuración para PerformanceOptimizer
        const performanceConfig = {
            targetFPS: this.config.performance?.targetFPS || 60,
            minFPS: this.config.performance?.minFPS || 30,
            adaptiveQuality: this.config.performance?.adaptiveQuality !== false,
            memoryThreshold: this.config.performance?.memoryThreshold || 0.8,
            enableDynamicQuality: this.config.performance?.enableDynamicQuality !== false
        };
        
        // Inicializar PerformanceOptimizer
        this.performanceOptimizer = new PerformanceOptimizer(performanceConfig, this.eventBus);
        
        // Configuración para ScalableMemoryManager
        const memoryConfig = {
            maxMemoryUsage: this.config.performance?.memoryThreshold || 0.8,
            enableObjectPooling: this.config.performance?.enableObjectPooling !== false,
            enableCacheManagement: this.config.performance?.enableCacheManagement !== false
        };
        
        // Inicializar ScalableMemoryManager
        this.memoryManager = new ScalableMemoryManager(memoryConfig, this.eventBus);
        
        console.log('[FullscreenIntegrator] Componentes inicializados');
    }

    /**
     * Configurar eventos de integración
     * @private
     */
    setupIntegrationEvents() {
        // Eventos de fullscreen
        this.eventBus.on('fullscreen:changed', this.handleFullscreenChange.bind(this));
        this.eventBus.on('fullscreen:resized', this.handleCanvasResize.bind(this));
        
        // Eventos de responsive
        this.eventBus.on('responsive:device-changed', this.handleDeviceChange.bind(this));
        this.eventBus.on('responsive:orientation-changed', this.handleOrientationChange.bind(this));
        
        // Eventos de rendimiento
        this.eventBus.on('performance:quality-changed', this.handleQualityChange.bind(this));
        this.eventBus.on('performance:optimization-completed', this.handleOptimizationCompleted.bind(this));
        
        // Eventos del GameEngine
        this.eventBus.on('engine:module-loaded', this.handleModuleLoaded.bind(this));
        this.eventBus.on('engine:render-frame', this.handleRenderFrame.bind(this));
        this.eventBus.on('engine:update-frame', this.handleUpdateFrame.bind(this));
        
        // Eventos de memoria
        this.eventBus.on('memory:cleanup-completed', this.handleMemoryCleanup.bind(this));
        
        console.log('[FullscreenIntegrator] Eventos de integración configurados');
    }

    /**
     * Conectar con el sistema existente
     * @private
     */
    connectToExistingSystem() {
        // Buscar referencias al GameEngine y Renderer
        this.findSystemReferences();
        
        // Integrar con el renderer existente
        this.integrateWithRenderer();
        
        // Configurar coordenadas adaptativas
        this.setupAdaptiveCoordinates();
        
        // Aplicar configuración inicial
        this.applyInitialConfiguration();
        
        console.log('[FullscreenIntegrator] Conectado con sistema existente');
    }

    /**
     * Buscar referencias al sistema existente
     * @private
     */
    findSystemReferences() {
        // Intentar obtener referencia al GameEngine desde window
        if (window.spikepulseApp && window.spikepulseApp.gameEngine) {
            this.gameEngine = window.spikepulseApp.gameEngine;
            console.log('[FullscreenIntegrator] GameEngine encontrado');
        }
        
        // Buscar renderer en los módulos del GameEngine
        if (this.gameEngine && this.gameEngine.modules) {
            const rendererModule = this.gameEngine.modules.get('renderer');
            if (rendererModule && rendererModule.instance) {
                this.renderer = rendererModule.instance;
                console.log('[FullscreenIntegrator] Renderer encontrado');
            }
        }
    }

    /**
     * Integrar con el renderer existente
     * @private
     */
    integrateWithRenderer() {
        if (!this.renderer) return;
        
        // Extender renderer con capacidades fullscreen
        this.extendRenderer();
        
        // Configurar optimizaciones de renderizado
        this.setupRenderOptimizations();
        
        console.log('[FullscreenIntegrator] Integrado con renderer');
    }

    /**
     * Extender renderer con capacidades fullscreen
     * @private
     */
    extendRenderer() {
        if (!this.renderer) return;
        
        // Guardar método render original
        const originalRender = this.renderer.render.bind(this.renderer);
        
        // Extender método render
        this.renderer.render = (gameObjects) => {
            // Aplicar transformaciones de viewport
            this.applyViewportTransforms();
            
            // Renderizado original
            const result = originalRender(gameObjects);
            
            // Actualizar métricas de rendimiento
            this.updateRenderMetrics(gameObjects);
            
            return result;
        };
        
        // Agregar método para obtener dimensiones del viewport
        this.renderer.getViewportDimensions = () => {
            return this.viewportManager.getDimensions();
        };
        
        // Agregar método para convertir coordenadas
        this.renderer.screenToGame = (screenX, screenY) => {
            return this.viewportManager.screenToGame(screenX, screenY);
        };
        
        this.renderer.gameToScreen = (gameX, gameY) => {
            return this.viewportManager.gameToScreen(gameX, gameY);
        };
    }

    /**
     * Configurar optimizaciones de renderizado
     * @private
     */
    setupRenderOptimizations() {
        if (!this.renderer) return;
        
        // Configurar culling basado en viewport
        this.eventBus.on('performance:update-culling', (data) => {
            if (this.renderer.setCullingDistance) {
                this.renderer.setCullingDistance(data.distance);
            }
        });
        
        // Configurar límites de objetos
        this.eventBus.on('performance:update-limits', (data) => {
            if (this.renderer.setRenderLimits) {
                this.renderer.setRenderLimits(data);
            }
        });
    }

    /**
     * Configurar sistema de coordenadas adaptativo
     * @private
     */
    setupAdaptiveCoordinates() {
        // Crear sistema de coordenadas que se adapta al viewport
        this.coordinateSystem = {
            toScreen: (gameX, gameY) => {
                return this.viewportManager.gameToScreen(gameX, gameY);
            },
            
            toGame: (screenX, screenY) => {
                return this.viewportManager.screenToGame(screenX, screenY);
            },
            
            getScale: () => {
                const dimensions = this.viewportManager.getDimensions();
                return dimensions.scale;
            },
            
            getOffset: () => {
                const dimensions = this.viewportManager.getDimensions();
                return { x: dimensions.offsetX, y: dimensions.offsetY };
            }
        };
        
        // Hacer disponible globalmente para otros módulos
        if (this.gameEngine) {
            this.gameEngine.coordinateSystem = this.coordinateSystem;
        }
    }

    /**
     * Aplicar configuración inicial
     * @private
     */
    applyInitialConfiguration() {
        // Actualizar estado de integración
        this.integrationState.deviceType = this.responsiveHandler.getCurrentBreakpoint();
        this.integrationState.orientation = this.responsiveHandler.getDeviceState().orientation;
        this.integrationState.currentQuality = this.performanceOptimizer.currentQuality;
        
        // Aplicar configuración responsive inicial
        this.applyResponsiveConfiguration();
        
        // Configurar canvas inicial
        this.configureInitialCanvas();
    }

    /**
     * Aplicar configuración responsive
     * @private
     */
    applyResponsiveConfiguration() {
        const deviceConfig = this.responsiveHandler.getCurrentDeviceConfig();
        
        // Configurar límites de rendimiento según dispositivo
        this.eventBus.emit('performance:update-limits', {
            maxParticles: deviceConfig.maxParticles,
            enableShadows: deviceConfig.enableShadows,
            enableBlur: deviceConfig.enableBlur
        });
        
        // Configurar UI según dispositivo
        this.eventBus.emit('ui:device-config-updated', {
            deviceType: this.integrationState.deviceType,
            config: deviceConfig
        });
    }

    /**
     * Configurar canvas inicial
     * @private
     */
    configureInitialCanvas() {
        // Asegurar que el canvas tenga las dimensiones correctas
        const dimensions = this.viewportManager.getDimensions();
        
        if (this.canvas.width !== dimensions.width || this.canvas.height !== dimensions.height) {
            this.canvas.width = dimensions.width;
            this.canvas.height = dimensions.height;
            
            // Reconfigurar contexto
            const ctx = this.canvas.getContext('2d');
            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
            }
        }
    }

    /**
     * Manejar cambio de fullscreen
     * @param {Object} data - Datos del evento
     * @private
     */
    handleFullscreenChange(data) {
        this.integrationState.fullscreenEnabled = data.isFullscreen;
        
        console.log(`[FullscreenIntegrator] Fullscreen ${data.isFullscreen ? 'activado' : 'desactivado'}`);
        
        // Notificar al GameEngine
        if (this.gameEngine) {
            this.eventBus.emit('engine:fullscreen-changed', {
                isFullscreen: data.isFullscreen,
                dimensions: data.dimensions
            });
        }
    }

    /**
     * Manejar redimensionamiento de canvas
     * @param {Object} data - Datos del evento
     * @private
     */
    handleCanvasResize(data) {
        // Actualizar renderer si existe
        if (this.renderer && this.renderer.handleResize) {
            this.renderer.handleResize(data.dimensions);
        }
        
        // Notificar a otros módulos
        this.eventBus.emit('engine:canvas-resized', {
            dimensions: data.dimensions,
            viewport: data.viewport
        });
    }

    /**
     * Manejar cambio de dispositivo
     * @param {Object} data - Datos del evento
     * @private
     */
    handleDeviceChange(data) {
        this.integrationState.deviceType = data.newState.type;
        
        console.log(`[FullscreenIntegrator] Dispositivo cambiado a: ${data.newState.type}`);
        
        // Aplicar nueva configuración
        this.applyResponsiveConfiguration();
        
        // Notificar cambio
        this.eventBus.emit('engine:device-changed', {
            oldType: data.oldState.type,
            newType: data.newState.type,
            deviceState: data.newState
        });
    }

    /**
     * Manejar cambio de orientación
     * @param {Object} data - Datos del evento
     * @private
     */
    handleOrientationChange(data) {
        this.integrationState.orientation = data.newOrientation;
        
        console.log(`[FullscreenIntegrator] Orientación cambiada a: ${data.newOrientation}`);
        
        // Reconfigurar canvas
        this.configureInitialCanvas();
        
        // Notificar cambio
        this.eventBus.emit('engine:orientation-changed', {
            oldOrientation: data.oldOrientation,
            newOrientation: data.newOrientation
        });
    }

    /**
     * Manejar cambio de calidad
     * @param {Object} data - Datos del evento
     * @private
     */
    handleQualityChange(data) {
        this.integrationState.currentQuality = data.newQuality;
        
        console.log(`[FullscreenIntegrator] Calidad cambiada a: ${data.newQuality}`);
        
        // Aplicar configuración de calidad al renderer
        if (this.renderer && this.renderer.setQuality) {
            this.renderer.setQuality(data.config);
        }
        
        // Notificar cambio
        this.eventBus.emit('engine:quality-changed', {
            oldQuality: data.oldQuality,
            newQuality: data.newQuality,
            config: data.config
        });
    }

    /**
     * Manejar optimización completada
     * @param {Object} data - Datos del evento
     * @private
     */
    handleOptimizationCompleted(data) {
        this.integrationState.isOptimizing = false;
        
        console.log('[FullscreenIntegrator] Optimización completada');
        
        // Notificar al GameEngine
        this.eventBus.emit('engine:optimization-completed', {
            quality: data.quality,
            metrics: data.metrics
        });
    }

    /**
     * Manejar carga de módulo
     * @param {Object} data - Datos del evento
     * @private
     */
    handleModuleLoaded(data) {
        // Si se carga el renderer, integrarlo
        if (data.name === 'renderer' && data.instance) {
            this.renderer = data.instance;
            this.integrateWithRenderer();
        }
    }

    /**
     * Manejar frame de renderizado
     * @param {Object} data - Datos del evento
     * @private
     */
    handleRenderFrame(data) {
        // Aplicar transformaciones de viewport antes del renderizado
        this.applyViewportTransforms();
    }

    /**
     * Manejar frame de actualización
     * @param {Object} data - Datos del evento
     * @private
     */
    handleUpdateFrame(data) {
        // Actualizar métricas de rendimiento
        if (this.performanceOptimizer) {
            this.performanceOptimizer.updateRenderMetrics({
                renderTime: data.renderTime || 0,
                updateTime: data.updateTime || 0,
                totalObjects: data.totalObjects || 0
            });
        }
    }

    /**
     * Manejar limpieza de memoria
     * @param {Object} data - Datos del evento
     * @private
     */
    handleMemoryCleanup(data) {
        console.log('[FullscreenIntegrator] Limpieza de memoria completada');
        
        // Notificar al GameEngine
        this.eventBus.emit('engine:memory-cleaned', {
            metrics: data.metrics
        });
    }

    /**
     * Aplicar transformaciones de viewport
     * @private
     */
    applyViewportTransforms() {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) return;
        
        const dimensions = this.viewportManager.getDimensions();
        
        // Aplicar transformación de escala y offset
        ctx.save();
        ctx.translate(dimensions.offsetX, dimensions.offsetY);
        ctx.scale(dimensions.scale, dimensions.scale);
    }

    /**
     * Actualizar métricas de renderizado
     * @param {Array} gameObjects - Objetos del juego
     * @private
     */
    updateRenderMetrics(gameObjects) {
        if (!this.performanceOptimizer) return;
        
        const metrics = {
            totalObjects: gameObjects ? gameObjects.length : 0,
            visibleObjects: gameObjects ? gameObjects.filter(obj => obj.visible !== false).length : 0
        };
        
        this.performanceOptimizer.updateRenderMetrics(metrics);
    }

    /**
     * Habilitar/deshabilitar fullscreen
     * @param {boolean} enabled - Si habilitar fullscreen
     * @returns {Promise<boolean>} True si se cambió correctamente
     */
    async setFullscreen(enabled) {
        if (!this.fullscreenManager) return false;
        
        if (enabled) {
            return await this.fullscreenManager.enableFullscreen();
        } else {
            return await this.fullscreenManager.disableFullscreen();
        }
    }

    /**
     * Alternar fullscreen
     * @returns {Promise<boolean>} True si se cambió correctamente
     */
    async toggleFullscreen() {
        if (!this.fullscreenManager) return false;
        
        return await this.fullscreenManager.toggleFullscreen();
    }

    /**
     * Obtener estado del sistema fullscreen
     * @returns {Object} Estado del sistema
     */
    getSystemState() {
        return {
            ...this.integrationState,
            components: this.getComponentStatus(),
            viewport: this.viewportManager ? this.viewportManager.getViewportInfo() : null,
            performance: this.performanceOptimizer ? this.performanceOptimizer.getMetrics() : null,
            memory: this.memoryManager ? this.memoryManager.getMemoryMetrics() : null
        };
    }

    /**
     * Obtener estado de componentes
     * @returns {Object} Estado de componentes
     * @private
     */
    getComponentStatus() {
        return {
            fullscreenManager: this.fullscreenManager ? this.fullscreenManager.isInitialized : false,
            viewportManager: this.viewportManager ? this.viewportManager.isInitialized : false,
            responsiveHandler: this.responsiveHandler ? this.responsiveHandler.isInitialized : false,
            performanceOptimizer: this.performanceOptimizer ? this.performanceOptimizer.isInitialized : false,
            memoryManager: this.memoryManager ? this.memoryManager.isInitialized : false
        };
    }

    /**
     * Forzar optimización del sistema
     */
    forceOptimization() {
        if (this.performanceOptimizer) {
            this.performanceOptimizer.forceOptimization();
        }
        
        if (this.memoryManager) {
            this.memoryManager.performCleanup();
        }
    }

    /**
     * Destruir el integrador
     */
    destroy() {
        // Destruir componentes
        if (this.fullscreenManager) {
            this.fullscreenManager.destroy();
            this.fullscreenManager = null;
        }
        
        if (this.viewportManager) {
            this.viewportManager.destroy();
            this.viewportManager = null;
        }
        
        if (this.responsiveHandler) {
            this.responsiveHandler.destroy();
            this.responsiveHandler = null;
        }
        
        if (this.performanceOptimizer) {
            this.performanceOptimizer.destroy();
            this.performanceOptimizer = null;
        }
        
        if (this.memoryManager) {
            this.memoryManager.destroy();
            this.memoryManager = null;
        }
        
        // Limpiar referencias
        this.gameEngine = null;
        this.renderer = null;
        
        this.isInitialized = false;
        
        console.log('[FullscreenIntegrator] Sistema fullscreen destruido');
    }
}