/**
 * ResponsiveHandler - Manejo de adaptación responsive para diferentes dispositivos
 * @module ResponsiveHandler
 */

/**
 * Manejador de comportamiento responsive para diferentes dispositivos
 */
export class ResponsiveHandler {
    /**
     * Crea una nueva instancia del ResponsiveHandler
     * @param {Object} config - Configuración responsive
     * @param {EventBus} eventBus - Bus de eventos para comunicación
     */
    constructor(config = {}, eventBus = null) {
        this.config = {
            breakpoints: {
                mobile: config.breakpoints?.mobile || 768,
                tablet: config.breakpoints?.tablet || 1024,
                desktop: config.breakpoints?.desktop || 1440,
                ...config.breakpoints
            },
            touchOptimization: config.touchOptimization !== false,
            adaptiveUI: config.adaptiveUI !== false,
            orientationHandling: config.orientationHandling !== false,
            densityOptimization: config.densityOptimization !== false,
            performanceScaling: config.performanceScaling !== false,
            ...config
        };
        
        this.eventBus = eventBus;
        this.isInitialized = false;
        
        // Estado actual del dispositivo
        this.deviceState = {
            type: 'desktop', // 'mobile', 'tablet', 'desktop'
            orientation: 'landscape', // 'portrait', 'landscape'
            pixelRatio: window.devicePixelRatio || 1,
            touchSupport: this.detectTouchSupport(),
            width: window.innerWidth,
            height: window.innerHeight,
            aspectRatio: window.innerWidth / window.innerHeight
        };
        
        // Configuraciones específicas por dispositivo
        this.deviceConfigs = {
            mobile: {
                touchButtonSize: 60,
                touchSensitivity: 1.2,
                uiScale: 1.1,
                textScale: 1.0,
                performanceLevel: 'low',
                maxParticles: 20,
                enableShadows: false,
                enableBlur: false
            },
            tablet: {
                touchButtonSize: 50,
                touchSensitivity: 1.0,
                uiScale: 1.0,
                textScale: 0.95,
                performanceLevel: 'medium',
                maxParticles: 50,
                enableShadows: true,
                enableBlur: false
            },
            desktop: {
                touchButtonSize: 40,
                touchSensitivity: 0.8,
                uiScale: 0.9,
                textScale: 0.9,
                performanceLevel: 'high',
                maxParticles: 100,
                enableShadows: true,
                enableBlur: true
            }
        };
        
        // Handlers de eventos (bound para poder removerlos)
        this.boundHandlers = {
            handleResize: this.handleResize.bind(this),
            handleOrientationChange: this.handleOrientationChange.bind(this),
            handleDeviceMotion: this.handleDeviceMotion.bind(this),
            handleVisibilityChange: this.handleVisibilityChange.bind(this)
        };
        
        // Debounce para eventos
        this.resizeTimeout = null;
        this.orientationTimeout = null;
        this.debounceDelay = 150;
        
        this.init();
    }

    /**
     * Inicializar el ResponsiveHandler
     * @private
     */
    init() {
        this.updateDeviceState();
        this.setupEventListeners();
        this.applyDeviceOptimizations();
        this.isInitialized = true;
        
        console.log(`[ResponsiveHandler] Inicializado para dispositivo: ${this.deviceState.type}`);
        
        if (this.eventBus) {
            this.eventBus.emit('responsive:initialized', {
                deviceState: this.deviceState,
                config: this.getCurrentDeviceConfig()
            });
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
        
        // Eventos de dispositivo móvil
        if (this.deviceState.touchSupport) {
            window.addEventListener('devicemotion', this.boundHandlers.handleDeviceMotion);
        }
        
        console.log('[ResponsiveHandler] Event listeners configurados');
    }

    /**
     * Detectar soporte táctil
     * @returns {boolean} True si soporta touch
     * @private
     */
    detectTouchSupport() {
        return (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0
        );
    }

    /**
     * Actualizar estado del dispositivo
     * @private
     */
    updateDeviceState() {
        const oldState = { ...this.deviceState };
        
        this.deviceState = {
            type: this.determineDeviceType(),
            orientation: this.getOrientation(),
            pixelRatio: window.devicePixelRatio || 1,
            touchSupport: this.detectTouchSupport(),
            width: window.innerWidth,
            height: window.innerHeight,
            aspectRatio: window.innerWidth / window.innerHeight,
            isLandscape: window.innerWidth > window.innerHeight,
            isPortrait: window.innerHeight > window.innerWidth,
            isHighDensity: (window.devicePixelRatio || 1) > 1.5
        };
        
        // Verificar si cambió el tipo de dispositivo
        const deviceTypeChanged = oldState.type !== this.deviceState.type;
        const orientationChanged = oldState.orientation !== this.deviceState.orientation;
        
        if (deviceTypeChanged || orientationChanged) {
            console.log(`[ResponsiveHandler] Dispositivo actualizado: ${this.deviceState.type} (${this.deviceState.orientation})`);
            
            if (this.eventBus) {
                this.eventBus.emit('responsive:device-changed', {
                    oldState,
                    newState: this.deviceState,
                    deviceTypeChanged,
                    orientationChanged
                });
            }
            
            // Aplicar optimizaciones para el nuevo dispositivo
            if (deviceTypeChanged) {
                this.applyDeviceOptimizations();
            }
        }
    }

    /**
     * Determinar tipo de dispositivo basado en dimensiones
     * @returns {string} Tipo de dispositivo
     * @private
     */
    determineDeviceType() {
        const width = window.innerWidth;
        
        if (width <= this.config.breakpoints.mobile) {
            return 'mobile';
        } else if (width <= this.config.breakpoints.tablet) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }

    /**
     * Obtener orientación del dispositivo
     * @returns {string} Orientación
     * @private
     */
    getOrientation() {
        if (screen.orientation) {
            return screen.orientation.type.includes('portrait') ? 'portrait' : 'landscape';
        }
        
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
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
            this.updateDeviceState();
            
            if (this.eventBus) {
                this.eventBus.emit('responsive:resize', {
                    deviceState: this.deviceState,
                    viewport: {
                        width: window.innerWidth,
                        height: window.innerHeight
                    }
                });
            }
        }, this.debounceDelay);
    }

    /**
     * Manejar cambio de orientación
     * @param {Event} event - Evento de orientationchange
     * @private
     */
    handleOrientationChange(event) {
        // Esperar un poco para que el viewport se actualice
        if (this.orientationTimeout) {
            clearTimeout(this.orientationTimeout);
        }
        
        this.orientationTimeout = setTimeout(() => {
            const oldOrientation = this.deviceState.orientation;
            this.updateDeviceState();
            
            console.log(`[ResponsiveHandler] Orientación cambiada: ${oldOrientation} → ${this.deviceState.orientation}`);
            
            if (this.eventBus) {
                this.eventBus.emit('responsive:orientation-changed', {
                    oldOrientation,
                    newOrientation: this.deviceState.orientation,
                    deviceState: this.deviceState
                });
            }
            
            // Aplicar optimizaciones específicas de orientación
            this.applyOrientationOptimizations();
            
        }, 300); // Delay más largo para orientación
    }

    /**
     * Manejar movimiento del dispositivo (para móviles)
     * @param {Event} event - Evento de devicemotion
     * @private
     */
    handleDeviceMotion(event) {
        // Solo procesar si es móvil y está habilitado
        if (this.deviceState.type !== 'mobile' || !this.config.orientationHandling) {
            return;
        }
        
        const acceleration = event.accelerationIncludingGravity;
        if (!acceleration) return;
        
        // Detectar sacudidas del dispositivo
        const threshold = 15;
        const totalAcceleration = Math.abs(acceleration.x) + Math.abs(acceleration.y) + Math.abs(acceleration.z);
        
        if (totalAcceleration > threshold) {
            if (this.eventBus) {
                this.eventBus.emit('responsive:device-shake', {
                    acceleration: totalAcceleration,
                    deviceState: this.deviceState
                });
            }
        }
    }

    /**
     * Manejar cambio de visibilidad de página
     * @param {Event} event - Evento de visibilitychange
     * @private
     */
    handleVisibilityChange(event) {
        const isVisible = !document.hidden;
        
        if (this.eventBus) {
            this.eventBus.emit('responsive:visibility-changed', {
                isVisible,
                deviceState: this.deviceState
            });
        }
        
        // Aplicar optimizaciones de rendimiento según visibilidad
        if (this.config.performanceScaling) {
            this.applyVisibilityOptimizations(isVisible);
        }
    }

    /**
     * Aplicar optimizaciones específicas del dispositivo
     * @private
     */
    applyDeviceOptimizations() {
        const deviceConfig = this.getCurrentDeviceConfig();
        
        // Aplicar optimizaciones de UI
        if (this.config.adaptiveUI) {
            this.applyUIOptimizations(deviceConfig);
        }
        
        // Aplicar optimizaciones táctiles
        if (this.config.touchOptimization && this.deviceState.touchSupport) {
            this.applyTouchOptimizations(deviceConfig);
        }
        
        // Aplicar optimizaciones de densidad
        if (this.config.densityOptimization) {
            this.applyDensityOptimizations(deviceConfig);
        }
        
        // Aplicar optimizaciones de rendimiento
        if (this.config.performanceScaling) {
            this.applyPerformanceOptimizations(deviceConfig);
        }
        
        console.log(`[ResponsiveHandler] Optimizaciones aplicadas para ${this.deviceState.type}`);
    }

    /**
     * Aplicar optimizaciones de UI
     * @param {Object} deviceConfig - Configuración del dispositivo
     * @private
     */
    applyUIOptimizations(deviceConfig) {
        const root = document.documentElement;
        
        // Aplicar escalas de UI
        root.style.setProperty('--sp-ui-scale', deviceConfig.uiScale);
        root.style.setProperty('--sp-text-scale', deviceConfig.textScale);
        
        // Aplicar clases CSS específicas del dispositivo
        document.body.classList.remove('sp-mobile', 'sp-tablet', 'sp-desktop');
        document.body.classList.add(`sp-${this.deviceState.type}`);
        
        // Aplicar clase de orientación
        document.body.classList.remove('sp-portrait', 'sp-landscape');
        document.body.classList.add(`sp-${this.deviceState.orientation}`);
        
        if (this.eventBus) {
            this.eventBus.emit('responsive:ui-optimized', {
                deviceType: this.deviceState.type,
                config: deviceConfig
            });
        }
    }

    /**
     * Aplicar optimizaciones táctiles
     * @param {Object} deviceConfig - Configuración del dispositivo
     * @private
     */
    applyTouchOptimizations(deviceConfig) {
        const root = document.documentElement;
        
        // Configurar tamaño de botones táctiles
        root.style.setProperty('--sp-touch-button-size', `${deviceConfig.touchButtonSize}px`);
        root.style.setProperty('--sp-touch-sensitivity', deviceConfig.touchSensitivity);
        
        // Habilitar/deshabilitar controles táctiles
        const touchControls = document.getElementById('mobileControls');
        if (touchControls) {
            if (this.deviceState.type === 'mobile') {
                touchControls.classList.remove('spikepulse-hidden');
            } else {
                touchControls.classList.add('spikepulse-hidden');
            }
        }
        
        // Configurar eventos táctiles
        if (this.deviceState.touchSupport) {
            document.body.classList.add('sp-touch-enabled');
            
            // Prevenir zoom en dispositivos móviles
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport && this.deviceState.type === 'mobile') {
                viewport.setAttribute('content', 
                    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
                );
            }
        }
        
        if (this.eventBus) {
            this.eventBus.emit('responsive:touch-optimized', {
                touchSupport: this.deviceState.touchSupport,
                config: deviceConfig
            });
        }
    }

    /**
     * Aplicar optimizaciones de densidad de píxeles
     * @param {Object} deviceConfig - Configuración del dispositivo
     * @private
     */
    applyDensityOptimizations(deviceConfig) {
        const root = document.documentElement;
        
        // Configurar factor de densidad
        root.style.setProperty('--sp-pixel-ratio', this.deviceState.pixelRatio);
        
        // Aplicar clase de alta densidad
        if (this.deviceState.isHighDensity) {
            document.body.classList.add('sp-high-density');
        } else {
            document.body.classList.remove('sp-high-density');
        }
        
        if (this.eventBus) {
            this.eventBus.emit('responsive:density-optimized', {
                pixelRatio: this.deviceState.pixelRatio,
                isHighDensity: this.deviceState.isHighDensity
            });
        }
    }

    /**
     * Aplicar optimizaciones de rendimiento
     * @param {Object} deviceConfig - Configuración del dispositivo
     * @private
     */
    applyPerformanceOptimizations(deviceConfig) {
        if (this.eventBus) {
            this.eventBus.emit('responsive:performance-config', {
                performanceLevel: deviceConfig.performanceLevel,
                maxParticles: deviceConfig.maxParticles,
                enableShadows: deviceConfig.enableShadows,
                enableBlur: deviceConfig.enableBlur,
                deviceType: this.deviceState.type
            });
        }
    }

    /**
     * Aplicar optimizaciones de orientación
     * @private
     */
    applyOrientationOptimizations() {
        const root = document.documentElement;
        
        // Configurar variables CSS para orientación
        root.style.setProperty('--sp-orientation', this.deviceState.orientation);
        root.style.setProperty('--sp-is-landscape', this.deviceState.isLandscape ? '1' : '0');
        root.style.setProperty('--sp-is-portrait', this.deviceState.isPortrait ? '1' : '0');
        
        if (this.eventBus) {
            this.eventBus.emit('responsive:orientation-optimized', {
                orientation: this.deviceState.orientation,
                isLandscape: this.deviceState.isLandscape,
                isPortrait: this.deviceState.isPortrait
            });
        }
    }

    /**
     * Aplicar optimizaciones de visibilidad
     * @param {boolean} isVisible - Si la página está visible
     * @private
     */
    applyVisibilityOptimizations(isVisible) {
        if (this.eventBus) {
            this.eventBus.emit('responsive:visibility-optimized', {
                isVisible,
                shouldReducePerformance: !isVisible,
                deviceType: this.deviceState.type
            });
        }
    }

    /**
     * Obtener configuración del dispositivo actual
     * @returns {Object} Configuración del dispositivo
     */
    getCurrentDeviceConfig() {
        return { ...this.deviceConfigs[this.deviceState.type] };
    }

    /**
     * Obtener estado del dispositivo
     * @returns {Object} Estado del dispositivo
     */
    getDeviceState() {
        return { ...this.deviceState };
    }

    /**
     * Verificar si es dispositivo móvil
     * @returns {boolean} True si es móvil
     */
    isMobile() {
        return this.deviceState.type === 'mobile';
    }

    /**
     * Verificar si es tablet
     * @returns {boolean} True si es tablet
     */
    isTablet() {
        return this.deviceState.type === 'tablet';
    }

    /**
     * Verificar si es desktop
     * @returns {boolean} True si es desktop
     */
    isDesktop() {
        return this.deviceState.type === 'desktop';
    }

    /**
     * Verificar si soporta touch
     * @returns {boolean} True si soporta touch
     */
    isTouchDevice() {
        return this.deviceState.touchSupport;
    }

    /**
     * Verificar si está en orientación portrait
     * @returns {boolean} True si está en portrait
     */
    isPortrait() {
        return this.deviceState.orientation === 'portrait';
    }

    /**
     * Verificar si está en orientación landscape
     * @returns {boolean} True si está en landscape
     */
    isLandscape() {
        return this.deviceState.orientation === 'landscape';
    }

    /**
     * Obtener breakpoint actual
     * @returns {string} Breakpoint actual
     */
    getCurrentBreakpoint() {
        return this.deviceState.type;
    }

    /**
     * Actualizar configuración de dispositivo
     * @param {string} deviceType - Tipo de dispositivo
     * @param {Object} config - Nueva configuración
     */
    updateDeviceConfig(deviceType, config) {
        if (this.deviceConfigs[deviceType]) {
            this.deviceConfigs[deviceType] = {
                ...this.deviceConfigs[deviceType],
                ...config
            };
            
            // Aplicar optimizaciones si es el dispositivo actual
            if (deviceType === this.deviceState.type) {
                this.applyDeviceOptimizations();
            }
            
            console.log(`[ResponsiveHandler] Configuración actualizada para ${deviceType}`);
        }
    }

    /**
     * Forzar actualización del estado del dispositivo
     */
    forceUpdate() {
        this.updateDeviceState();
        this.applyDeviceOptimizations();
        
        console.log('[ResponsiveHandler] Actualización forzada completada');
    }

    /**
     * Obtener estadísticas del handler
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            isInitialized: this.isInitialized,
            deviceState: this.deviceState,
            config: this.config,
            deviceConfigs: this.deviceConfigs,
            currentDeviceConfig: this.getCurrentDeviceConfig()
        };
    }

    /**
     * Destruir el ResponsiveHandler
     */
    destroy() {
        // Remover event listeners
        window.removeEventListener('resize', this.boundHandlers.handleResize);
        window.removeEventListener('orientationchange', this.boundHandlers.handleOrientationChange);
        document.removeEventListener('visibilitychange', this.boundHandlers.handleVisibilityChange);
        
        if (this.deviceState.touchSupport) {
            window.removeEventListener('devicemotion', this.boundHandlers.handleDeviceMotion);
        }
        
        // Limpiar timeouts
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        
        if (this.orientationTimeout) {
            clearTimeout(this.orientationTimeout);
            this.orientationTimeout = null;
        }
        
        this.isInitialized = false;
        console.log('[ResponsiveHandler] Destruido correctamente');
    }
}