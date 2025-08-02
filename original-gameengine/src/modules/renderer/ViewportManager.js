/**
 * ViewportManager - Gestión de dimensiones y cálculos de viewport
 * @module ViewportManager
 */

/**
 * Gestor de viewport para cálculos de dimensiones y transformaciones
 */
export class ViewportManager {
    /**
     * Crea una nueva instancia del ViewportManager
     * @param {Object} config - Configuración del viewport
     * @param {EventBus} eventBus - Bus de eventos para comunicación
     */
    constructor(config = {}, eventBus = null) {
        this.config = {
            minWidth: config.minWidth || 320,
            minHeight: config.minHeight || 240,
            maxWidth: config.maxWidth || 3840,
            maxHeight: config.maxHeight || 2160,
            aspectRatio: config.aspectRatio || 16/9,
            maintainAspectRatio: config.maintainAspectRatio !== false,
            scalingMode: config.scalingMode || 'fit', // 'fit', 'fill', 'stretch'
            pixelRatio: config.pixelRatio || window.devicePixelRatio || 1,
            ...config
        };
        
        this.eventBus = eventBus;
        this.isInitialized = false;
        
        // Dimensiones actuales
        this.currentViewport = {
            width: window.innerWidth,
            height: window.innerHeight,
            aspectRatio: window.innerWidth / window.innerHeight,
            pixelRatio: window.devicePixelRatio || 1
        };
        
        // Dimensiones calculadas
        this.calculatedDimensions = {
            width: 0,
            height: 0,
            scaledWidth: 0,
            scaledHeight: 0,
            scale: 1,
            offsetX: 0,
            offsetY: 0
        };
        
        // Cache de cálculos
        this.calculationCache = new Map();
        this.cacheTimeout = 100; // ms
        
        this.init();
    }

    /**
     * Inicializar el ViewportManager
     * @private
     */
    init() {
        this.updateViewportInfo();
        this.calculateDimensions();
        this.isInitialized = true;
        
        console.log('[ViewportManager] Inicializado correctamente');
        
        if (this.eventBus) {
            this.eventBus.emit('viewport:initialized', {
                viewport: this.currentViewport,
                dimensions: this.calculatedDimensions
            });
        }
    }

    /**
     * Actualizar información del viewport
     */
    updateViewportInfo() {
        const oldViewport = { ...this.currentViewport };
        
        this.currentViewport = {
            width: window.innerWidth,
            height: window.innerHeight,
            aspectRatio: window.innerWidth / window.innerHeight,
            pixelRatio: window.devicePixelRatio || 1,
            orientation: this.getOrientation(),
            isLandscape: window.innerWidth > window.innerHeight,
            isPortrait: window.innerHeight > window.innerWidth
        };
        
        // Verificar si cambió
        const hasChanged = (
            oldViewport.width !== this.currentViewport.width ||
            oldViewport.height !== this.currentViewport.height ||
            oldViewport.pixelRatio !== this.currentViewport.pixelRatio
        );
        
        if (hasChanged) {
            // Limpiar cache cuando cambia el viewport
            this.calculationCache.clear();
            
            console.log(`[ViewportManager] Viewport actualizado: ${this.currentViewport.width}x${this.currentViewport.height}`);
            
            if (this.eventBus) {
                this.eventBus.emit('viewport:changed', {
                    oldViewport,
                    newViewport: this.currentViewport
                });
            }
        }
        
        return hasChanged;
    }

    /**
     * Obtener orientación del dispositivo
     * @returns {string} Orientación ('portrait', 'landscape')
     * @private
     */
    getOrientation() {
        if (screen.orientation) {
            return screen.orientation.type.includes('portrait') ? 'portrait' : 'landscape';
        }
        
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }

    /**
     * Calcular dimensiones óptimas
     * @param {Object} targetDimensions - Dimensiones objetivo (opcional)
     * @returns {Object} Dimensiones calculadas
     */
    calculateDimensions(targetDimensions = null) {
        const target = targetDimensions || {
            width: this.currentViewport.width,
            height: this.currentViewport.height
        };
        
        // Verificar cache
        const cacheKey = `${target.width}x${target.height}_${this.config.scalingMode}_${this.config.maintainAspectRatio}`;
        const cached = this.calculationCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            this.calculatedDimensions = cached.dimensions;
            return this.calculatedDimensions;
        }
        
        let dimensions;
        
        switch (this.config.scalingMode) {
            case 'fit':
                dimensions = this.calculateFitDimensions(target);
                break;
            case 'fill':
                dimensions = this.calculateFillDimensions(target);
                break;
            case 'stretch':
                dimensions = this.calculateStretchDimensions(target);
                break;
            default:
                dimensions = this.calculateFitDimensions(target);
        }
        
        // Aplicar límites
        dimensions = this.applyLimits(dimensions);
        
        // Calcular offsets para centrado
        dimensions.offsetX = Math.max(0, (target.width - dimensions.scaledWidth) / 2);
        dimensions.offsetY = Math.max(0, (target.height - dimensions.scaledHeight) / 2);
        
        // Guardar en cache
        this.calculationCache.set(cacheKey, {
            dimensions: { ...dimensions },
            timestamp: Date.now()
        });
        
        this.calculatedDimensions = dimensions;
        
        if (this.eventBus) {
            this.eventBus.emit('viewport:dimensions-calculated', {
                dimensions: this.calculatedDimensions,
                target
            });
        }
        
        return dimensions;
    }

    /**
     * Calcular dimensiones con modo 'fit' (mantener aspect ratio, ajustar dentro)
     * @param {Object} target - Dimensiones objetivo
     * @returns {Object} Dimensiones calculadas
     * @private
     */
    calculateFitDimensions(target) {
        let width = target.width;
        let height = target.height;
        let scale = 1;
        
        if (this.config.maintainAspectRatio) {
            const targetAspectRatio = this.config.aspectRatio;
            const viewportAspectRatio = target.width / target.height;
            
            if (viewportAspectRatio > targetAspectRatio) {
                // Viewport más ancho, ajustar por altura
                height = target.height;
                width = height * targetAspectRatio;
                scale = target.height / height;
            } else {
                // Viewport más alto, ajustar por anchura
                width = target.width;
                height = width / targetAspectRatio;
                scale = target.width / width;
            }
        }
        
        return {
            width: Math.round(width),
            height: Math.round(height),
            scaledWidth: Math.round(width * scale),
            scaledHeight: Math.round(height * scale),
            scale: scale
        };
    }

    /**
     * Calcular dimensiones con modo 'fill' (mantener aspect ratio, llenar completamente)
     * @param {Object} target - Dimensiones objetivo
     * @returns {Object} Dimensiones calculadas
     * @private
     */
    calculateFillDimensions(target) {
        let width = target.width;
        let height = target.height;
        let scale = 1;
        
        if (this.config.maintainAspectRatio) {
            const targetAspectRatio = this.config.aspectRatio;
            const viewportAspectRatio = target.width / target.height;
            
            if (viewportAspectRatio > targetAspectRatio) {
                // Viewport más ancho, ajustar por anchura
                width = target.width;
                height = width / targetAspectRatio;
                scale = target.width / width;
            } else {
                // Viewport más alto, ajustar por altura
                height = target.height;
                width = height * targetAspectRatio;
                scale = target.height / height;
            }
        }
        
        return {
            width: Math.round(width),
            height: Math.round(height),
            scaledWidth: Math.round(width * scale),
            scaledHeight: Math.round(height * scale),
            scale: scale
        };
    }

    /**
     * Calcular dimensiones con modo 'stretch' (estirar para llenar)
     * @param {Object} target - Dimensiones objetivo
     * @returns {Object} Dimensiones calculadas
     * @private
     */
    calculateStretchDimensions(target) {
        return {
            width: target.width,
            height: target.height,
            scaledWidth: target.width,
            scaledHeight: target.height,
            scale: 1
        };
    }

    /**
     * Aplicar límites mínimos y máximos
     * @param {Object} dimensions - Dimensiones a limitar
     * @returns {Object} Dimensiones limitadas
     * @private
     */
    applyLimits(dimensions) {
        const limited = { ...dimensions };
        
        // Aplicar límites mínimos
        if (limited.width < this.config.minWidth) {
            const ratio = this.config.minWidth / limited.width;
            limited.width = this.config.minWidth;
            limited.height = Math.round(limited.height * ratio);
            limited.scale *= ratio;
        }
        
        if (limited.height < this.config.minHeight) {
            const ratio = this.config.minHeight / limited.height;
            limited.height = this.config.minHeight;
            limited.width = Math.round(limited.width * ratio);
            limited.scale *= ratio;
        }
        
        // Aplicar límites máximos
        if (limited.width > this.config.maxWidth) {
            const ratio = this.config.maxWidth / limited.width;
            limited.width = this.config.maxWidth;
            limited.height = Math.round(limited.height * ratio);
            limited.scale *= ratio;
        }
        
        if (limited.height > this.config.maxHeight) {
            const ratio = this.config.maxHeight / limited.height;
            limited.height = this.config.maxHeight;
            limited.width = Math.round(limited.width * ratio);
            limited.scale *= ratio;
        }
        
        // Recalcular dimensiones escaladas
        limited.scaledWidth = Math.round(limited.width * limited.scale);
        limited.scaledHeight = Math.round(limited.height * limited.scale);
        
        return limited;
    }

    /**
     * Convertir coordenadas de pantalla a coordenadas del juego
     * @param {number} screenX - Coordenada X de pantalla
     * @param {number} screenY - Coordenada Y de pantalla
     * @returns {Object} Coordenadas del juego
     */
    screenToGame(screenX, screenY) {
        const dimensions = this.calculatedDimensions;
        
        // Ajustar por offset
        const adjustedX = screenX - dimensions.offsetX;
        const adjustedY = screenY - dimensions.offsetY;
        
        // Escalar a coordenadas del juego
        const gameX = adjustedX / dimensions.scale;
        const gameY = adjustedY / dimensions.scale;
        
        return {
            x: Math.round(gameX),
            y: Math.round(gameY),
            isInBounds: (
                gameX >= 0 && gameX <= dimensions.width &&
                gameY >= 0 && gameY <= dimensions.height
            )
        };
    }

    /**
     * Convertir coordenadas del juego a coordenadas de pantalla
     * @param {number} gameX - Coordenada X del juego
     * @param {number} gameY - Coordenada Y del juego
     * @returns {Object} Coordenadas de pantalla
     */
    gameToScreen(gameX, gameY) {
        const dimensions = this.calculatedDimensions;
        
        // Escalar a coordenadas de pantalla
        const scaledX = gameX * dimensions.scale;
        const scaledY = gameY * dimensions.scale;
        
        // Ajustar por offset
        const screenX = scaledX + dimensions.offsetX;
        const screenY = scaledY + dimensions.offsetY;
        
        return {
            x: Math.round(screenX),
            y: Math.round(screenY)
        };
    }

    /**
     * Obtener información del viewport actual
     * @returns {Object} Información del viewport
     */
    getViewportInfo() {
        return {
            ...this.currentViewport,
            dimensions: { ...this.calculatedDimensions },
            config: { ...this.config }
        };
    }

    /**
     * Obtener dimensiones calculadas
     * @returns {Object} Dimensiones calculadas
     */
    getDimensions() {
        return { ...this.calculatedDimensions };
    }

    /**
     * Verificar si el viewport es móvil
     * @returns {boolean} True si es móvil
     */
    isMobile() {
        return this.currentViewport.width <= 768;
    }

    /**
     * Verificar si el viewport es tablet
     * @returns {boolean} True si es tablet
     */
    isTablet() {
        return this.currentViewport.width > 768 && this.currentViewport.width <= 1024;
    }

    /**
     * Verificar si el viewport es desktop
     * @returns {boolean} True si es desktop
     */
    isDesktop() {
        return this.currentViewport.width > 1024;
    }

    /**
     * Obtener breakpoint actual
     * @returns {string} Breakpoint ('mobile', 'tablet', 'desktop')
     */
    getCurrentBreakpoint() {
        if (this.isMobile()) return 'mobile';
        if (this.isTablet()) return 'tablet';
        return 'desktop';
    }

    /**
     * Verificar si el dispositivo tiene alta densidad de píxeles
     * @returns {boolean} True si tiene alta densidad
     */
    isHighDensity() {
        return this.currentViewport.pixelRatio > 1.5;
    }

    /**
     * Obtener factor de escala recomendado para el dispositivo
     * @returns {number} Factor de escala
     */
    getRecommendedScale() {
        const pixelRatio = this.currentViewport.pixelRatio;
        const breakpoint = this.getCurrentBreakpoint();
        
        // Ajustar escala según dispositivo
        let baseScale = 1;
        
        switch (breakpoint) {
            case 'mobile':
                baseScale = 0.8;
                break;
            case 'tablet':
                baseScale = 0.9;
                break;
            case 'desktop':
                baseScale = 1.0;
                break;
        }
        
        // Ajustar por densidad de píxeles
        if (pixelRatio > 2) {
            baseScale *= 1.2;
        } else if (pixelRatio > 1.5) {
            baseScale *= 1.1;
        }
        
        return Math.round(baseScale * 100) / 100;
    }

    /**
     * Actualizar configuración
     * @param {Object} newConfig - Nueva configuración
     */
    updateConfig(newConfig) {
        const oldConfig = { ...this.config };
        this.config = { ...this.config, ...newConfig };
        
        // Limpiar cache si cambió configuración relevante
        const relevantKeys = ['aspectRatio', 'maintainAspectRatio', 'scalingMode', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight'];
        const hasRelevantChanges = relevantKeys.some(key => oldConfig[key] !== this.config[key]);
        
        if (hasRelevantChanges) {
            this.calculationCache.clear();
            this.calculateDimensions();
            
            if (this.eventBus) {
                this.eventBus.emit('viewport:config-updated', {
                    oldConfig,
                    newConfig: this.config
                });
            }
        }
    }

    /**
     * Limpiar cache de cálculos
     */
    clearCache() {
        this.calculationCache.clear();
        console.log('[ViewportManager] Cache limpiado');
    }

    /**
     * Obtener estadísticas del manager
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            isInitialized: this.isInitialized,
            viewport: this.currentViewport,
            dimensions: this.calculatedDimensions,
            config: this.config,
            cacheSize: this.calculationCache.size,
            breakpoint: this.getCurrentBreakpoint(),
            isMobile: this.isMobile(),
            isTablet: this.isTablet(),
            isDesktop: this.isDesktop(),
            isHighDensity: this.isHighDensity(),
            recommendedScale: this.getRecommendedScale()
        };
    }

    /**
     * Destruir el ViewportManager
     */
    destroy() {
        this.calculationCache.clear();
        this.isInitialized = false;
        
        console.log('[ViewportManager] Destruido correctamente');
    }
}