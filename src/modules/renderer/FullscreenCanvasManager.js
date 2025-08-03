/**
 * FullscreenCanvasManager - Gestión avanzada de canvas de pantalla completa
 * Migrado y adaptado para el sistema actual de Spikepulse
 * @module FullscreenCanvasManager
 */

import { ViewportManager } from './ViewportManager.js';

/**
 * Gestor avanzado para canvas de pantalla completa con redimensionamiento dinámico
 * Adaptado para funcionar con el sistema actual de Spikepulse
 */
export class FullscreenCanvasManager {
    /**
     * Crea una nueva instancia del FullscreenCanvasManager
     * @param {HTMLCanvasElement} canvas - Elemento canvas
     * @param {Object} config - Configuración del canvas
     * @param {EventBus} eventBus - Bus de eventos para comunicación (opcional)
     */
    constructor(canvas, config = {}, eventBus = null) {
        this.canvas = canvas;
        this.config = config;
        this.eventBus = eventBus;
        this.ctx = canvas?.getContext('2d');
        
        // Estado del manager
        this.isInitialized = false;
        this.isFullscreen = false;
        this.isResizing = false;
        
        // Configuración de canvas con valores por defecto
        this.canvasConfig = {
            minWidth: config.canvas?.minWidth || 320,
            minHeight: config.canvas?.minHeight || 240,
            maxWidth: config.canvas?.maxWidth || 3840,
            maxHeight: config.canvas?.maxHeight || 2160,
            aspectRatio: config.canvas?.aspectRatio || 16/9,
            maintainAspectRatio: config.canvas?.maintainAspectRatio !== false,
            scalingMode: config.canvas?.scalingMode || 'fit',
            backgroundColor: config.canvas?.backgroundColor || '#000000',
            pixelRatio: config.canvas?.pixelRatio || window.devicePixelRatio || 1
        };
        
        // Integrar ViewportManager
        this.viewportManager = new ViewportManager(this.canvasConfig, this.eventBus);
        
        // Dimensiones actuales
        this.currentDimensions = {
            width: canvas?.width || 800,
            height: canvas?.height || 400,
            scaledWidth: canvas?.width || 800,
            scaledHeight: canvas?.height || 400,
            scale: 1
        };
        
        // Handlers de eventos (bound para poder removerlos)
        this.boundHandlers = {
            handleResize: this.handleResize.bind(this),
            handleFullscreenChange: this.handleFullscreenChange.bind(this),
            handleOrientationChange: this.handleOrientationChange.bind(this),
            handleVisibilityChange: this.handleVisibilityChange.bind(this),
            handleViewportChange: this.handleViewportChange.bind(this)
        };
        
        // Debounce para resize
        this.resizeTimeout = null;
        this.resizeDelay = 100;
        
        // Performance tracking
        this.performanceMetrics = {
            resizeCount: 0,
            lastResizeTime: 0,
            averageResizeTime: 0
        };
        
        this.init();
    }

    /**
     * Inicializar el manager
     * @private
     */
    init() {
        try {
            console.log('[FullscreenCanvasManager] Inicializando sistema avanzado...');
            
            // Verificar que tenemos un canvas válido
            if (!this.canvas) {
                throw new Error('Canvas no proporcionado o inválido');
            }
            
            if (!this.ctx) {
                throw new Error('No se pudo obtener contexto 2D del canvas');
            }
            
            // Configurar listeners de eventos
            this.setupEventListeners();
            
            // Configurar canvas inicial
            this.setupCanvas();
            
            // Actualizar dimensiones iniciales
            this.updateDimensions();
            
            this.isInitialized = true;
            
            console.log('[FullscreenCanvasManager] Inicializado correctamente');
            
            // Emitir evento de inicialización si hay EventBus
            if (this.eventBus) {
                this.eventBus.emit('fullscreen:initialized', {
                    dimensions: this.currentDimensions,
                    viewport: this.viewportManager.getViewportInfo(),
                    config: this.canvasConfig
                });
            }
            
        } catch (error) {
            console.error('[FullscreenCanvasManager] Error durante inicialización:', error);
            this.handleError(error, 'init');
            throw error;
        }
    }

    /**
     * Configurar listeners de eventos
     * @private
     */
    setupEventListeners() {
        // Eventos de ventana
        window.addEventListener('resize', this.boundHandlers.handleResize);
        window.addEventListener('orientationchange', this.boundHandlers.handleOrientationChange);
        document.addEventListener('visibilitychange', this.boundHandlers.handleVisibilityChange);
        
        // Eventos de fullscreen
        document.addEventListener('fullscreenchange', this.boundHandlers.handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', this.boundHandlers.handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', this.boundHandlers.handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', this.boundHandlers.handleFullscreenChange);
        
        // Eventos del ViewportManager
        if (this.eventBus) {
            this.eventBus.on('viewport:changed', this.boundHandlers.handleViewportChange);
            this.eventBus.on('viewport:dimensions-calculated', this.boundHandlers.handleViewportChange);
        }
        
        // Eventos del bus de eventos si está disponible
        if (this.eventBus) {
            this.eventBus.on('fullscreen:enable', this.enableFullscreen.bind(this));
            this.eventBus.on('fullscreen:disable', this.disableFullscreen.bind(this));
            this.eventBus.on('fullscreen:toggle', this.toggleFullscreen.bind(this));
            this.eventBus.on('canvas:resize', this.forceResize.bind(this));
            this.eventBus.on('canvas:update-config', this.updateConfig.bind(this));
        }
        
        console.log('[FullscreenCanvasManager] Event listeners configurados');
    }

    /**
     * Configurar propiedades iniciales del canvas
     * @private
     */
    setupCanvas() {
        // Configurar propiedades del contexto
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Configurar atributos del canvas para accesibilidad
        this.canvas.setAttribute('aria-label', 'Canvas del juego Spikepulse');
        this.canvas.setAttribute('role', 'img');
        this.canvas.setAttribute('tabindex', '0');
        
        // Aplicar estilos CSS iniciales
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0 auto';
        this.canvas.style.backgroundColor = this.canvasConfig.backgroundColor;
        this.canvas.style.imageRendering = 'pixelated'; // Para juegos pixel art
        this.canvas.style.imageRendering = 'crisp-edges';
        
        // Configurar para alta densidad de píxeles si es necesario
        if (this.canvasConfig.pixelRatio > 1) {
            this.setupHighDensityCanvas();
        }
        
        console.log('[FullscreenCanvasManager] Canvas configurado');
    }

    /**
     * Configurar canvas para alta densidad de píxeles
     * @private
     */
    setupHighDensityCanvas() {
        const pixelRatio = this.canvasConfig.pixelRatio;
        
        // Escalar el canvas internamente
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * pixelRatio;
        this.canvas.height = rect.height * pixelRatio;
        
        // Escalar el contexto
        this.ctx.scale(pixelRatio, pixelRatio);
        
        // Mantener el tamaño CSS
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        console.log(`[FullscreenCanvasManager] Canvas configurado para alta densidad (${pixelRatio}x)`);
    }

    /**
     * Manejar cambio de tamaño de ventana
     * @param {Event} event - Evento de resize
     * @private
     */
    handleResize(event) {
        // Debounce para evitar múltiples llamadas
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        this.resizeTimeout = setTimeout(() => {
            const startTime = performance.now();
            
            this.updateDimensions();
            this.resizeCanvas();
            
            // Actualizar métricas de rendimiento
            const resizeTime = performance.now() - startTime;
            this.updatePerformanceMetrics(resizeTime);
            
        }, this.resizeDelay);
    }

    /**
     * Manejar cambio de orientación
     * @param {Event} event - Evento de orientationchange
     * @private
     */
    handleOrientationChange(event) {
        // Esperar un poco para que el viewport se actualice
        setTimeout(() => {
            this.updateDimensions();
            this.resizeCanvas();
            
            if (this.eventBus) {
                this.eventBus.emit('fullscreen:orientation-changed', {
                    orientation: screen.orientation?.angle || 0,
                    dimensions: this.currentDimensions,
                    viewport: this.viewportManager.getViewportInfo()
                });
            }
        }, 200);
    }

    /**
     * Manejar cambio de fullscreen
     * @param {Event} event - Evento de fullscreenchange
     * @private
     */
    handleFullscreenChange(event) {
        const isFullscreen = !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
        
        this.isFullscreen = isFullscreen;
        
        // Actualizar dimensiones después del cambio
        setTimeout(() => {
            this.updateDimensions();
            this.resizeCanvas();
            
            if (this.eventBus) {
                this.eventBus.emit('fullscreen:changed', {
                    isFullscreen: this.isFullscreen,
                    dimensions: this.currentDimensions,
                    viewport: this.viewportManager.getViewportInfo()
                });
            }
        }, 100);
        
        console.log(`[FullscreenCanvasManager] Fullscreen ${isFullscreen ? 'activado' : 'desactivado'}`);
    }

    /**
     * Manejar cambio de visibilidad de página
     * @param {Event} event - Evento de visibilitychange
     * @private
     */
    handleVisibilityChange(event) {
        if (!document.hidden) {
            // Página visible de nuevo, verificar dimensiones
            setTimeout(() => {
                this.updateDimensions();
                this.resizeCanvas();
            }, 100);
        }
    }

    /**
     * Manejar cambios del ViewportManager
     * @param {Object} data - Datos del evento
     * @private
     */
    handleViewportChange(data) {
        // El ViewportManager ya calculó las dimensiones, solo aplicarlas
        this.resizeCanvas();
    }

    /**
     * Actualizar dimensiones usando ViewportManager
     * @private
     */
    updateDimensions() {
        // Actualizar información del viewport
        this.viewportManager.updateViewportInfo();
        
        // Calcular nuevas dimensiones
        this.viewportManager.calculateDimensions();
        
        console.log(`[FullscreenCanvasManager] Dimensiones actualizadas via ViewportManager`);
    }

    /**
     * Redimensionar el canvas usando cálculos del ViewportManager
     * @private
     */
    resizeCanvas() {
        if (this.isResizing) return;
        
        this.isResizing = true;
        
        try {
            // Obtener dimensiones calculadas del ViewportManager
            const newDimensions = this.viewportManager.getDimensions();
            
            // Aplicar alta densidad de píxeles si es necesario
            const pixelRatio = this.canvasConfig.pixelRatio;
            const actualWidth = newDimensions.width * pixelRatio;
            const actualHeight = newDimensions.height * pixelRatio;
            
            // Actualizar dimensiones del canvas
            this.canvas.width = actualWidth;
            this.canvas.height = actualHeight;
            
            // Actualizar estilos CSS
            this.canvas.style.width = newDimensions.scaledWidth + 'px';
            this.canvas.style.height = newDimensions.scaledHeight + 'px';
            
            // Aplicar offsets para centrado
            if (newDimensions.offsetX > 0 || newDimensions.offsetY > 0) {
                this.canvas.style.marginLeft = newDimensions.offsetX + 'px';
                this.canvas.style.marginTop = newDimensions.offsetY + 'px';
            }
            
            // Reconfigurar contexto (se pierde al cambiar dimensiones)
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.imageSmoothingQuality = 'high';
            
            // Aplicar escala de alta densidad si es necesario
            if (pixelRatio > 1) {
                this.ctx.scale(pixelRatio, pixelRatio);
            }
            
            // Actualizar dimensiones actuales
            this.currentDimensions = {
                ...newDimensions,
                actualWidth,
                actualHeight,
                pixelRatio
            };
            
            console.log(`[FullscreenCanvasManager] Canvas redimensionado: ${newDimensions.width}x${newDimensions.height} (escala: ${newDimensions.scale}, pixelRatio: ${pixelRatio})`);
            
            // Emitir evento de redimensionamiento
            if (this.eventBus) {
                this.eventBus.emit('fullscreen:resized', {
                    dimensions: this.currentDimensions,
                    viewport: this.viewportManager.getViewportInfo()
                });
            }
            
        } catch (error) {
            console.error('[FullscreenCanvasManager] Error redimensionando canvas:', error);
            this.handleError(error, 'resizeCanvas');
        } finally {
            this.isResizing = false;
        }
    }

    /**
     * Actualizar métricas de rendimiento
     * @param {number} resizeTime - Tiempo de redimensionamiento
     * @private
     */
    updatePerformanceMetrics(resizeTime) {
        this.performanceMetrics.resizeCount++;
        this.performanceMetrics.lastResizeTime = resizeTime;
        
        // Calcular promedio móvil
        const alpha = 0.1; // Factor de suavizado
        this.performanceMetrics.averageResizeTime = 
            this.performanceMetrics.averageResizeTime * (1 - alpha) + resizeTime * alpha;
    }

    /**
     * Habilitar modo pantalla completa
     * @returns {Promise<boolean>} True si se habilitó correctamente
     */
    async enableFullscreen() {
        try {
            if (this.isFullscreen) {
                console.log('[FullscreenCanvasManager] Ya está en pantalla completa');
                return true;
            }
            
            const element = this.canvas.parentElement || this.canvas;
            
            if (element.requestFullscreen) {
                await element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                await element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                await element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
                await element.msRequestFullscreen();
            } else {
                throw new Error('Fullscreen no soportado por el navegador');
            }
            
            console.log('[FullscreenCanvasManager] Pantalla completa habilitada');
            return true;
            
        } catch (error) {
            console.error('[FullscreenCanvasManager] Error habilitando pantalla completa:', error);
            this.handleError(error, 'enableFullscreen');
            
            if (this.eventBus) {
                this.eventBus.emit('fullscreen:error', {
                    action: 'enable',
                    error: error.message
                });
            }
            
            return false;
        }
    }

    /**
     * Deshabilitar modo pantalla completa
     * @returns {Promise<boolean>} True si se deshabilitó correctamente
     */
    async disableFullscreen() {
        try {
            if (!this.isFullscreen) {
                console.log('[FullscreenCanvasManager] No está en pantalla completa');
                return true;
            }
            
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                await document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                await document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                await document.msExitFullscreen();
            } else {
                throw new Error('Exit fullscreen no soportado por el navegador');
            }
            
            console.log('[FullscreenCanvasManager] Pantalla completa deshabilitada');
            return true;
            
        } catch (error) {
            console.error('[FullscreenCanvasManager] Error deshabilitando pantalla completa:', error);
            this.handleError(error, 'disableFullscreen');
            
            if (this.eventBus) {
                this.eventBus.emit('fullscreen:error', {
                    action: 'disable',
                    error: error.message
                });
            }
            
            return false;
        }
    }

    /**
     * Alternar modo pantalla completa
     * @returns {Promise<boolean>} True si se cambió correctamente
     */
    async toggleFullscreen() {
        if (this.isFullscreen) {
            return await this.disableFullscreen();
        } else {
            return await this.enableFullscreen();
        }
    }

    /**
     * Forzar redimensionamiento del canvas
     * @param {Object} data - Datos del evento (opcional)
     */
    forceResize(data = {}) {
        console.log('[FullscreenCanvasManager] Forzando redimensionamiento...');
        
        if (data.dimensions) {
            // Actualizar ViewportManager con dimensiones específicas
            this.viewportManager.calculateDimensions(data.dimensions);
        } else {
            this.updateDimensions();
        }
        
        this.resizeCanvas();
    }

    /**
     * Actualizar configuración del canvas
     * @param {Object} newConfig - Nueva configuración
     */
    updateConfig(newConfig) {
        const oldConfig = { ...this.canvasConfig };
        this.canvasConfig = { ...this.canvasConfig, ...newConfig };
        
        // Actualizar configuración del ViewportManager
        this.viewportManager.updateConfig(this.canvasConfig);
        
        // Recalcular dimensiones si cambió algo relevante
        const relevantKeys = ['aspectRatio', 'maintainAspectRatio', 'scalingMode', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight'];
        const hasRelevantChanges = relevantKeys.some(key => oldConfig[key] !== this.canvasConfig[key]);
        
        if (hasRelevantChanges) {
            this.updateDimensions();
            this.resizeCanvas();
        }
        
        if (this.eventBus) {
            this.eventBus.emit('fullscreen:config-updated', {
                oldConfig,
                newConfig: this.canvasConfig
            });
        }
        
        console.log('[FullscreenCanvasManager] Configuración actualizada');
    }

    /**
     * Convertir coordenadas de pantalla a coordenadas del juego
     * @param {number} screenX - Coordenada X de pantalla
     * @param {number} screenY - Coordenada Y de pantalla
     * @returns {Object} Coordenadas del juego
     */
    screenToGame(screenX, screenY) {
        return this.viewportManager.screenToGame(screenX, screenY);
    }

    /**
     * Convertir coordenadas del juego a coordenadas de pantalla
     * @param {number} gameX - Coordenada X del juego
     * @param {number} gameY - Coordenada Y del juego
     * @returns {Object} Coordenadas de pantalla
     */
    gameToScreen(gameX, gameY) {
        return this.viewportManager.gameToScreen(gameX, gameY);
    }

    /**
     * Obtener dimensiones actuales del canvas
     * @returns {Object} Dimensiones actuales
     */
    getDimensions() {
        return {
            ...this.currentDimensions,
            viewport: this.viewportManager.getViewportInfo(),
            isFullscreen: this.isFullscreen
        };
    }

    /**
     * Verificar si el navegador soporta pantalla completa
     * @returns {boolean} True si soporta fullscreen
     */
    supportsFullscreen() {
        const element = this.canvas.parentElement || this.canvas;
        return !!(
            element.requestFullscreen ||
            element.webkitRequestFullscreen ||
            element.mozRequestFullScreen ||
            element.msRequestFullscreen
        );
    }

    /**
     * Obtener información de estado completa
     * @returns {Object} Estado actual del manager
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isFullscreen: this.isFullscreen,
            isResizing: this.isResizing,
            supportsFullscreen: this.supportsFullscreen(),
            dimensions: this.getDimensions(),
            config: { ...this.canvasConfig },
            viewport: this.viewportManager.getStats(),
            performance: { ...this.performanceMetrics }
        };
    }

    /**
     * Obtener métricas de rendimiento
     * @returns {Object} Métricas de rendimiento
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            viewport: this.viewportManager.getStats()
        };
    }

    /**
     * Manejar errores del sistema
     * @param {Error} error - Error ocurrido
     * @param {string} context - Contexto del error
     * @private
     */
    handleError(error, context) {
        console.error(`[FullscreenCanvasManager] Error en ${context}:`, error);
        
        if (this.eventBus) {
            this.eventBus.emit('fullscreen:error', {
                error: error,
                context: context,
                manager: 'FullscreenCanvasManager'
            });
        }
        
        // Intentar recuperación básica
        this.attemptBasicRecovery(context);
    }

    /**
     * Intentar recuperación básica del sistema
     * @param {string} context - Contexto del error
     * @private
     */
    attemptBasicRecovery(context) {
        try {
            console.log(`[FullscreenCanvasManager] Intentando recuperación básica para: ${context}`);
            
            switch (context) {
                case 'resizeCanvas':
                    // Restaurar dimensiones básicas
                    this.canvas.width = 800;
                    this.canvas.height = 400;
                    this.canvas.style.width = '800px';
                    this.canvas.style.height = '400px';
                    break;
                    
                case 'init':
                    // Configuración mínima
                    if (this.canvas && this.ctx) {
                        this.ctx.imageSmoothingEnabled = true;
                        this.canvas.style.display = 'block';
                    }
                    break;
            }
            
            console.log('[FullscreenCanvasManager] Recuperación básica aplicada');
            
        } catch (recoveryError) {
            console.error('[FullscreenCanvasManager] Error en recuperación básica:', recoveryError);
        }
    }

    /**
     * Limpiar recursos y remover event listeners
     */
    destroy() {
        console.log('[FullscreenCanvasManager] Destruyendo manager...');
        
        // Remover event listeners
        window.removeEventListener('resize', this.boundHandlers.handleResize);
        window.removeEventListener('orientationchange', this.boundHandlers.handleOrientationChange);
        document.removeEventListener('visibilitychange', this.boundHandlers.handleVisibilityChange);
        
        document.removeEventListener('fullscreenchange', this.boundHandlers.handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', this.boundHandlers.handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', this.boundHandlers.handleFullscreenChange);
        document.removeEventListener('MSFullscreenChange', this.boundHandlers.handleFullscreenChange);
        
        // Remover listeners del event bus si existe
        if (this.eventBus) {
            this.eventBus.off('viewport:changed', this.boundHandlers.handleViewportChange);
            this.eventBus.off('viewport:dimensions-calculated', this.boundHandlers.handleViewportChange);
            this.eventBus.off('fullscreen:enable', this.enableFullscreen);
            this.eventBus.off('fullscreen:disable', this.disableFullscreen);
            this.eventBus.off('fullscreen:toggle', this.toggleFullscreen);
            this.eventBus.off('canvas:resize', this.forceResize);
            this.eventBus.off('canvas:update-config', this.updateConfig);
        }
        
        // Limpiar timeouts
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        
        // Destruir ViewportManager
        if (this.viewportManager) {
            this.viewportManager.destroy();
            this.viewportManager = null;
        }
        
        // Salir de fullscreen si está activo
        if (this.isFullscreen) {
            this.disableFullscreen();
        }
        
        this.isInitialized = false;
        console.log('[FullscreenCanvasManager] Destruido correctamente');
    }
}