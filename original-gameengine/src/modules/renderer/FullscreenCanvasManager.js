/**
 * FullscreenCanvasManager - Gestión de canvas de pantalla completa
 * @module FullscreenCanvasManager
 */

import { SPANISH_TEXT } from '../../config/SpanishText.js';

/**
 * Gestor principal para canvas de pantalla completa con redimensionamiento dinámico
 */
export class FullscreenCanvasManager {
    /**
     * Crea una nueva instancia del FullscreenCanvasManager
     * @param {HTMLCanvasElement} canvas - Elemento canvas
     * @param {Object} config - Configuración del canvas
     * @param {EventBus} eventBus - Bus de eventos para comunicación
     */
    constructor(canvas, config, eventBus) {
        this.canvas = canvas;
        this.config = config;
        this.eventBus = eventBus;
        this.ctx = canvas.getContext('2d');
        
        // Estado del manager
        this.isInitialized = false;
        this.isFullscreen = false;
        this.isResizing = false;
        
        // Configuración de canvas
        this.canvasConfig = {
            minWidth: config.canvas?.minWidth || 320,
            minHeight: config.canvas?.minHeight || 240,
            maxWidth: config.canvas?.maxWidth || 3840,
            maxHeight: config.canvas?.maxHeight || 2160,
            aspectRatio: config.canvas?.aspectRatio || 16/9,
            maintainAspectRatio: config.canvas?.maintainAspectRatio !== false
        };
        
        // Dimensiones actuales
        this.currentDimensions = {
            width: canvas.width,
            height: canvas.height,
            scaledWidth: canvas.width,
            scaledHeight: canvas.height,
            scale: 1
        };
        
        // Dimensiones del viewport
        this.viewportDimensions = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        // Handlers de eventos (bound para poder removerlos)
        this.boundHandlers = {
            handleResize: this.handleResize.bind(this),
            handleFullscreenChange: this.handleFullscreenChange.bind(this),
            handleOrientationChange: this.handleOrientationChange.bind(this),
            handleVisibilityChange: this.handleVisibilityChange.bind(this)
        };
        
        // Debounce para resize
        this.resizeTimeout = null;
        this.resizeDelay = 100;
        
        this.init();
    }

    /**
     * Inicializar el manager
     * @private
     */
    init() {
        try {
            this.setupEventListeners();
            this.setupCanvas();
            this.updateDimensions();
            this.isInitialized = true;
            
            console.log('[FullscreenCanvasManager] Inicializado correctamente');
            this.eventBus.emit('fullscreen:initialized', {
                dimensions: this.currentDimensions,
                viewport: this.viewportDimensions
            });
            
        } catch (error) {
            console.error('[FullscreenCanvasManager] Error durante inicialización:', error);
            console.error('[FullscreenCanvasManager] Error durante inicialización:', error);
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
        
        // Eventos del bus de eventos
        this.eventBus.on('fullscreen:enable', this.enableFullscreen.bind(this));
        this.eventBus.on('fullscreen:disable', this.disableFullscreen.bind(this));
        this.eventBus.on('fullscreen:toggle', this.toggleFullscreen.bind(this));
        this.eventBus.on('canvas:resize', this.forceResize.bind(this));
        
        console.log('[FullscreenCanvasManager] Event listeners configurados');
    }

    /**
     * Configurar propiedades iniciales del canvas
     * @private
     */
    setupCanvas() {
        if (!this.ctx) {
            throw new Error('No se pudo obtener contexto 2D del canvas');
        }
        
        // Configurar propiedades del contexto
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Configurar atributos del canvas
        this.canvas.setAttribute('aria-label', SPANISH_TEXT.CANVAS_ALT || 'Canvas del juego');
        this.canvas.setAttribute('role', 'img');
        
        // Aplicar estilos CSS iniciales
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0 auto';
        this.canvas.style.backgroundColor = this.config.canvas?.backgroundColor || '#000000';
        
        console.log('[FullscreenCanvasManager] Canvas configurado');
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
            this.updateDimensions();
            this.resizeCanvas();
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
            
            this.eventBus.emit('fullscreen:orientation-changed', {
                orientation: screen.orientation?.angle || 0,
                dimensions: this.currentDimensions
            });
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
            
            this.eventBus.emit('fullscreen:changed', {
                isFullscreen: this.isFullscreen,
                dimensions: this.currentDimensions
            });
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
     * Actualizar dimensiones del viewport
     * @private
     */
    updateDimensions() {
        this.viewportDimensions = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        console.log(`[FullscreenCanvasManager] Viewport actualizado: ${this.viewportDimensions.width}x${this.viewportDimensions.height}`);
    }

    /**
     * Redimensionar el canvas
     * @private
     */
    resizeCanvas() {
        if (this.isResizing) return;
        
        this.isResizing = true;
        
        try {
            const newDimensions = this.calculateOptimalDimensions();
            
            // Actualizar dimensiones del canvas
            this.canvas.width = newDimensions.width;
            this.canvas.height = newDimensions.height;
            
            // Actualizar estilos CSS
            this.canvas.style.width = newDimensions.scaledWidth + 'px';
            this.canvas.style.height = newDimensions.scaledHeight + 'px';
            
            // Reconfigurar contexto (se pierde al cambiar dimensiones)
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.imageSmoothingQuality = 'high';
            
            // Actualizar dimensiones actuales
            this.currentDimensions = newDimensions;
            
            console.log(`[FullscreenCanvasManager] Canvas redimensionado: ${newDimensions.width}x${newDimensions.height} (escala: ${newDimensions.scale})`);
            
            // Emitir evento de redimensionamiento
            this.eventBus.emit('fullscreen:resized', {
                dimensions: this.currentDimensions,
                viewport: this.viewportDimensions
            });
            
        } catch (error) {
            console.error('[FullscreenCanvasManager] Error redimensionando canvas:', error);
            console.error('[FullscreenCanvasManager] Error redimensionando canvas:', error);
        } finally {
            this.isResizing = false;
        }
    }

    /**
     * Calcular dimensiones óptimas para el canvas
     * @returns {Object} Dimensiones calculadas
     * @private
     */
    calculateOptimalDimensions() {
        const viewport = this.viewportDimensions;
        const config = this.canvasConfig;
        
        let targetWidth = viewport.width;
        let targetHeight = viewport.height;
        
        // Aplicar límites mínimos y máximos
        targetWidth = Math.max(config.minWidth, Math.min(config.maxWidth, targetWidth));
        targetHeight = Math.max(config.minHeight, Math.min(config.maxHeight, targetHeight));
        
        let canvasWidth = targetWidth;
        let canvasHeight = targetHeight;
        let scale = 1;
        
        // Mantener aspect ratio si está habilitado
        if (config.maintainAspectRatio) {
            const targetAspectRatio = config.aspectRatio;
            const viewportAspectRatio = targetWidth / targetHeight;
            
            if (viewportAspectRatio > targetAspectRatio) {
                // Viewport más ancho, ajustar por altura
                canvasHeight = targetHeight;
                canvasWidth = targetHeight * targetAspectRatio;
            } else {
                // Viewport más alto, ajustar por anchura
                canvasWidth = targetWidth;
                canvasHeight = targetWidth / targetAspectRatio;
            }
            
            // Calcular escala para el CSS
            scale = Math.min(
                targetWidth / canvasWidth,
                targetHeight / canvasHeight
            );
        }
        
        return {
            width: Math.round(canvasWidth),
            height: Math.round(canvasHeight),
            scaledWidth: Math.round(canvasWidth * scale),
            scaledHeight: Math.round(canvasHeight * scale),
            scale: scale
        };
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
            console.error('[FullscreenCanvasManager] Error habilitando pantalla completa:', error);
            
            this.eventBus.emit('fullscreen:error', {
                action: 'enable',
                error: error.message
            });
            
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
            console.error('[FullscreenCanvasManager] Error deshabilitando pantalla completa:', error);
            
            this.eventBus.emit('fullscreen:error', {
                action: 'disable',
                error: error.message
            });
            
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
            // Usar dimensiones específicas si se proporcionan
            this.viewportDimensions = {
                width: data.dimensions.width || window.innerWidth,
                height: data.dimensions.height || window.innerHeight
            };
        } else {
            this.updateDimensions();
        }
        
        this.resizeCanvas();
    }

    /**
     * Obtener dimensiones actuales del canvas
     * @returns {Object} Dimensiones actuales
     */
    getDimensions() {
        return {
            ...this.currentDimensions,
            viewport: { ...this.viewportDimensions },
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
     * Obtener información de estado
     * @returns {Object} Estado actual del manager
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isFullscreen: this.isFullscreen,
            isResizing: this.isResizing,
            supportsFullscreen: this.supportsFullscreen(),
            dimensions: this.getDimensions(),
            config: { ...this.canvasConfig }
        };
    }

    /**
     * Limpiar recursos y remover event listeners
     */
    destroy() {
        // Remover event listeners
        window.removeEventListener('resize', this.boundHandlers.handleResize);
        window.removeEventListener('orientationchange', this.boundHandlers.handleOrientationChange);
        document.removeEventListener('visibilitychange', this.boundHandlers.handleVisibilityChange);
        
        document.removeEventListener('fullscreenchange', this.boundHandlers.handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', this.boundHandlers.handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', this.boundHandlers.handleFullscreenChange);
        document.removeEventListener('MSFullscreenChange', this.boundHandlers.handleFullscreenChange);
        
        // Remover listeners del event bus
        this.eventBus.off('fullscreen:enable', this.enableFullscreen);
        this.eventBus.off('fullscreen:disable', this.disableFullscreen);
        this.eventBus.off('fullscreen:toggle', this.toggleFullscreen);
        this.eventBus.off('canvas:resize', this.forceResize);
        
        // Limpiar timeouts
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        
        // Salir de fullscreen si está activo
        if (this.isFullscreen) {
            this.disableFullscreen();
        }
        
        this.isInitialized = false;
        console.log('[FullscreenCanvasManager] Destruido correctamente');
    }
}