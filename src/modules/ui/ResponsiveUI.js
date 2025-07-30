/**
 * ResponsiveUI - Gestor de interfaz responsive y móvil
 * Maneja la adaptación de la UI a diferentes tamaños de pantalla y dispositivos
 * @module ResponsiveUI
 */

import { SPANISH_TEXT } from '../../config/SpanishText.js';

export class ResponsiveUI {
    /**
     * Crea una nueva instancia del ResponsiveUI
     * @param {Object} config - Configuración de la UI responsive
     * @param {EventBus} eventBus - Bus de eventos para comunicación
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isInitialized = false;
        
        // Breakpoints para responsive design
        this.breakpoints = {
            mobile: 768,
            tablet: 1024,
            desktop: 1200
        };
        
        // Estado actual del dispositivo
        this.deviceState = {
            isMobile: false,
            isTablet: false,
            isDesktop: false,
            orientation: 'portrait',
            width: 0,
            height: 0,
            pixelRatio: 1
        };
        
        // Referencias a elementos UI
        this.elements = {
            mobileControls: null,
            canvas: null,
            hud: null,
            screens: [],
            body: null
        };
        
        // Configuración de controles móviles
        this.mobileControls = {
            isVisible: false,
            touchStartPositions: new Map(),
            activeButtons: new Set(),
            gestureThreshold: 50
        };
        
        console.log('[ResponsiveUI] Inicializando UI responsive...');
        this.init();
    }
    
    /**
     * Inicializar la UI responsive
     * @private
     */
    init() {
        try {
            // Detectar estado inicial del dispositivo
            this.detectDeviceState();
            
            // Configurar referencias DOM
            this.setupDOMReferences();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Configurar controles móviles
            this.setupMobileControls();
            
            // Configurar viewport y meta tags
            this.setupViewport();
            
            // Aplicar estilos iniciales
            this.applyResponsiveStyles();
            
            this.isInitialized = true;
            console.log('[ResponsiveUI] UI responsive inicializada');
            
            // Emitir evento de inicialización
            this.eventBus.emit('responsive:initialized', this.deviceState);
            
        } catch (error) {
            console.error('[ResponsiveUI] Error durante la inicialización:', error);
            this.eventBus.emit('responsive:error', { error, context: 'initialization' });
        }
    }
    
    /**
     * Detectar estado del dispositivo
     * @private
     */
    detectDeviceState() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Actualizar dimensiones
        this.deviceState.width = width;
        this.deviceState.height = height;
        this.deviceState.pixelRatio = window.devicePixelRatio || 1;
        
        // Detectar tipo de dispositivo
        this.deviceState.isMobile = width <= this.breakpoints.mobile;
        this.deviceState.isTablet = width > this.breakpoints.mobile && width <= this.breakpoints.tablet;
        this.deviceState.isDesktop = width > this.breakpoints.tablet;
        
        // Detectar orientación
        this.deviceState.orientation = width > height ? 'landscape' : 'portrait';
        
        // Detectar capacidades táctiles
        this.deviceState.hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        console.log('[ResponsiveUI] Estado del dispositivo detectado:', this.deviceState);
    }
    
    /**
     * Configurar referencias DOM
     * @private
     */
    setupDOMReferences() {
        this.elements.body = document.body;
        this.elements.mobileControls = document.getElementById('mobileControls');
        this.elements.canvas = document.getElementById('gameCanvas');
        this.elements.hud = document.getElementById('gameHUD');
        
        // Obtener todas las pantallas
        this.elements.screens = [
            document.getElementById('startScreen'),
            document.getElementById('gameOverScreen'),
            document.getElementById('pauseScreen')
        ].filter(screen => screen !== null);
        
        console.log('[ResponsiveUI] Referencias DOM configuradas');
    }
    
    /**
     * Configurar event listeners
     * @private
     */
    setupEventListeners() {
        // Listener para cambios de tamaño de ventana
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Listener para cambios de orientación
        window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
        
        // Listeners para eventos de visibilidad
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Listeners para eventos del juego
        this.eventBus.on('game:start', () => this.handleGameStart());
        this.eventBus.on('game:end', () => this.handleGameEnd());
        this.eventBus.on('state:change', (data) => this.handleStateChange(data));
        
        // Prevenir comportamientos por defecto en móvil
        if (this.deviceState.isMobile) {
            this.setupMobileEventPrevention();
        }
        
        console.log('[ResponsiveUI] Event listeners configurados');
    }
    
    /**
     * Configurar prevención de eventos móviles
     * @private
     */
    setupMobileEventPrevention() {
        // Prevenir zoom con doble tap
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Prevenir scroll en el juego
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('#gameCanvas') || e.target.closest('#mobileControls')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Prevenir menú contextual
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('#gameCanvas') || e.target.closest('#mobileControls')) {
                e.preventDefault();
            }
        });
        
        console.log('[ResponsiveUI] Prevención de eventos móviles configurada');
    }
    
    /**
     * Configurar controles móviles
     * @private
     */
    setupMobileControls() {
        if (!this.elements.mobileControls) {
            console.warn('[ResponsiveUI] Controles móviles no encontrados');
            return;
        }
        
        // Configurar botones de control
        this.setupControlButtons();
        
        // Configurar gestos táctiles
        this.setupTouchGestures();
        
        // Configurar feedback háptico si está disponible
        this.setupHapticFeedback();
        
        console.log('[ResponsiveUI] Controles móviles configurados');
    }
    
    /**
     * Configurar botones de control
     * @private
     */
    setupControlButtons() {
        const buttons = this.elements.mobileControls.querySelectorAll('.spikepulse-control-btn');
        
        buttons.forEach(button => {
            // Configurar eventos táctiles
            button.addEventListener('touchstart', (e) => {
                this.handleButtonTouchStart(e, button);
            }, { passive: false });
            
            button.addEventListener('touchend', (e) => {
                this.handleButtonTouchEnd(e, button);
            }, { passive: false });
            
            button.addEventListener('touchcancel', (e) => {
                this.handleButtonTouchCancel(e, button);
            }, { passive: false });
            
            // Configurar eventos de mouse para testing en desktop
            button.addEventListener('mousedown', (e) => {
                this.handleButtonMouseDown(e, button);
            });
            
            button.addEventListener('mouseup', (e) => {
                this.handleButtonMouseUp(e, button);
            });
        });
    }
    
    /**
     * Configurar gestos táctiles
     * @private
     */
    setupTouchGestures() {
        if (!this.elements.canvas) return;
        
        // Gestos en el canvas para controles alternativos
        this.elements.canvas.addEventListener('touchstart', (e) => {
            this.handleCanvasTouchStart(e);
        }, { passive: false });
        
        this.elements.canvas.addEventListener('touchmove', (e) => {
            this.handleCanvasTouchMove(e);
        }, { passive: false });
        
        this.elements.canvas.addEventListener('touchend', (e) => {
            this.handleCanvasTouchEnd(e);
        }, { passive: false });
    }
    
    /**
     * Configurar feedback háptico
     * @private
     */
    setupHapticFeedback() {
        // Verificar soporte para vibración
        this.hasVibration = 'vibrate' in navigator;
        
        if (this.hasVibration) {
            console.log('[ResponsiveUI] Feedback háptico disponible');
        }
    }
    
    /**
     * Configurar viewport y meta tags
     * @private
     */
    setupViewport() {
        // Verificar si ya existe meta viewport
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        
        if (!viewportMeta) {
            viewportMeta = document.createElement('meta');
            viewportMeta.name = 'viewport';
            document.head.appendChild(viewportMeta);
        }
        
        // Configurar viewport para juego
        viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
        
        // Agregar meta tags adicionales para PWA
        this.setupPWAMetaTags();
        
        console.log('[ResponsiveUI] Viewport configurado');
    }
    
    /**
     * Configurar meta tags para PWA
     * @private
     */
    setupPWAMetaTags() {
        const metaTags = [
            { name: 'mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
            { name: 'theme-color', content: '#0F0F0F' }
        ];
        
        metaTags.forEach(tag => {
            if (!document.querySelector(`meta[name="${tag.name}"]`)) {
                const meta = document.createElement('meta');
                meta.name = tag.name;
                meta.content = tag.content;
                document.head.appendChild(meta);
            }
        });
    }
    
    /**
     * Aplicar estilos responsive
     * @private
     */
    applyResponsiveStyles() {
        // Agregar clases CSS según el dispositivo
        this.elements.body.classList.remove('sp-mobile', 'sp-tablet', 'sp-desktop');
        
        if (this.deviceState.isMobile) {
            this.elements.body.classList.add('sp-mobile');
        } else if (this.deviceState.isTablet) {
            this.elements.body.classList.add('sp-tablet');
        } else {
            this.elements.body.classList.add('sp-desktop');
        }
        
        // Agregar clase de orientación
        this.elements.body.classList.remove('sp-portrait', 'sp-landscape');
        this.elements.body.classList.add(`sp-${this.deviceState.orientation}`);
        
        // Agregar clase de capacidad táctil
        if (this.deviceState.hasTouch) {
            this.elements.body.classList.add('sp-touch');
        } else {
            this.elements.body.classList.add('sp-no-touch');
        }
        
        // Aplicar estilos específicos
        this.applyCanvasStyles();
        this.applyHUDStyles();
        this.applyScreenStyles();
        this.applyMobileControlsStyles();
        
        console.log('[ResponsiveUI] Estilos responsive aplicados');
    }
    
    /**
     * Aplicar estilos al canvas
     * @private
     */
    applyCanvasStyles() {
        if (!this.elements.canvas) return;
        
        const canvas = this.elements.canvas;
        const canvasWidth = parseInt(canvas.getAttribute('width'));
        const canvasHeight = parseInt(canvas.getAttribute('height'));
        
        if (this.deviceState.isMobile) {
            // En móvil, hacer el canvas responsive
            const maxWidth = this.deviceState.width - 20; // Margen de 10px a cada lado
            const maxHeight = this.deviceState.height * 0.6; // 60% de la altura de la pantalla
            
            const aspectRatio = canvasWidth / canvasHeight;
            let newWidth = maxWidth;
            let newHeight = newWidth / aspectRatio;
            
            if (newHeight > maxHeight) {
                newHeight = maxHeight;
                newWidth = newHeight * aspectRatio;
            }
            
            canvas.style.width = `${newWidth}px`;
            canvas.style.height = `${newHeight}px`;
            canvas.style.maxWidth = '100%';
            canvas.style.height = 'auto';
        } else {
            // En desktop, mantener tamaño original o escalado proporcional
            canvas.style.width = '';
            canvas.style.height = '';
            canvas.style.maxWidth = '100%';
        }
    }
    
    /**
     * Aplicar estilos al HUD
     * @private
     */
    applyHUDStyles() {
        if (!this.elements.hud) return;
        
        if (this.deviceState.isMobile) {
            // En móvil, hacer el HUD más compacto
            this.elements.hud.classList.add('spikepulse-hud--mobile');
            
            // Ajustar posición según orientación
            if (this.deviceState.orientation === 'landscape') {
                this.elements.hud.classList.add('spikepulse-hud--landscape');
            } else {
                this.elements.hud.classList.remove('spikepulse-hud--landscape');
            }
        } else {
            this.elements.hud.classList.remove('spikepulse-hud--mobile', 'spikepulse-hud--landscape');
        }
    }
    
    /**
     * Aplicar estilos a las pantallas
     * @private
     */
    applyScreenStyles() {
        this.elements.screens.forEach(screen => {
            if (!screen) return;
            
            if (this.deviceState.isMobile) {
                screen.classList.add('spikepulse-screen-overlay--mobile');
                
                // Ajustar según orientación
                if (this.deviceState.orientation === 'landscape') {
                    screen.classList.add('spikepulse-screen-overlay--landscape');
                } else {
                    screen.classList.remove('spikepulse-screen-overlay--landscape');
                }
            } else {
                screen.classList.remove('spikepulse-screen-overlay--mobile', 'spikepulse-screen-overlay--landscape');
            }
        });
    }
    
    /**
     * Aplicar estilos a los controles móviles
     * @private
     */
    applyMobileControlsStyles() {
        if (!this.elements.mobileControls) return;
        
        if (this.deviceState.isMobile) {
            // Mostrar controles móviles
            this.showMobileControls();
            
            // Ajustar layout según orientación
            if (this.deviceState.orientation === 'landscape') {
                this.elements.mobileControls.classList.add('spikepulse-mobile-controls--landscape');
            } else {
                this.elements.mobileControls.classList.remove('spikepulse-mobile-controls--landscape');
            }
        } else {
            // Ocultar controles móviles en desktop
            this.hideMobileControls();
        }
    }
    
    /**
     * Manejar cambio de tamaño de ventana
     * @param {Event} e - Evento de resize
     * @private
     */
    handleResize(e) {
        const previousState = { ...this.deviceState };
        
        // Detectar nuevo estado
        this.detectDeviceState();
        
        // Verificar si cambió el tipo de dispositivo
        const deviceTypeChanged = 
            previousState.isMobile !== this.deviceState.isMobile ||
            previousState.isTablet !== this.deviceState.isTablet ||
            previousState.isDesktop !== this.deviceState.isDesktop;
        
        // Aplicar nuevos estilos
        this.applyResponsiveStyles();
        
        // Emitir eventos
        this.eventBus.emit('responsive:resize', {
            previousState,
            currentState: this.deviceState,
            deviceTypeChanged
        });
        
        if (deviceTypeChanged) {
            this.eventBus.emit('responsive:device-type-changed', this.deviceState);
        }
        
        console.log('[ResponsiveUI] Resize manejado:', this.deviceState);
    }
    
    /**
     * Manejar cambio de orientación
     * @param {Event} e - Evento de orientationchange
     * @private
     */
    handleOrientationChange(e) {
        // Usar setTimeout para esperar a que se complete el cambio
        setTimeout(() => {
            const previousOrientation = this.deviceState.orientation;
            this.detectDeviceState();
            
            if (previousOrientation !== this.deviceState.orientation) {
                this.applyResponsiveStyles();
                
                this.eventBus.emit('responsive:orientation-changed', {
                    from: previousOrientation,
                    to: this.deviceState.orientation,
                    deviceState: this.deviceState
                });
                
                console.log('[ResponsiveUI] Orientación cambiada:', this.deviceState.orientation);
            }
        }, 100);
    }
    
    /**
     * Manejar cambio de visibilidad
     * @param {Event} e - Evento de visibilitychange
     * @private
     */
    handleVisibilityChange(e) {
        if (document.hidden) {
            this.eventBus.emit('responsive:visibility-hidden');
        } else {
            this.eventBus.emit('responsive:visibility-visible');
        }
    }
    
    /**
     * Manejar inicio del juego
     * @private
     */
    handleGameStart() {
        if (this.deviceState.isMobile) {
            this.showMobileControls();
        }
    }
    
    /**
     * Manejar fin del juego
     * @private
     */
    handleGameEnd() {
        if (this.deviceState.isMobile) {
            this.hideMobileControls();
        }
    }
    
    /**
     * Manejar cambio de estado del juego
     * @param {Object} data - Datos del cambio de estado
     * @private
     */
    handleStateChange(data) {
        const { to } = data;
        
        if (this.deviceState.isMobile) {
            switch (to) {
                case 'playing':
                    this.showMobileControls();
                    break;
                case 'menu':
                case 'gameOver':
                    this.hideMobileControls();
                    break;
                case 'paused':
                    // Mantener controles visibles pero inactivos
                    break;
            }
        }
    }
    
    /**
     * Mostrar controles móviles
     */
    showMobileControls() {
        if (!this.elements.mobileControls || !this.deviceState.isMobile) return;
        
        this.elements.mobileControls.classList.remove('spikepulse-hidden');
        this.mobileControls.isVisible = true;
        
        console.log('[ResponsiveUI] Controles móviles mostrados');
    }
    
    /**
     * Ocultar controles móviles
     */
    hideMobileControls() {
        if (!this.elements.mobileControls) return;
        
        this.elements.mobileControls.classList.add('spikepulse-hidden');
        this.mobileControls.isVisible = false;
        
        console.log('[ResponsiveUI] Controles móviles ocultados');
    }
    
    /**
     * Manejar inicio de toque en botón
     * @param {TouchEvent} e - Evento de touch
     * @param {HTMLElement} button - Elemento del botón
     * @private
     */
    handleButtonTouchStart(e, button) {
        e.preventDefault();
        
        const touch = e.touches[0];
        const buttonId = button.id;
        
        // Agregar clase visual
        button.classList.add('spikepulse-control-btn--active');
        this.mobileControls.activeButtons.add(buttonId);
        
        // Feedback háptico
        this.triggerHapticFeedback('light');
        
        // Emitir evento de input
        this.emitButtonEvent(buttonId, 'start');
        
        console.log('[ResponsiveUI] Botón touch start:', buttonId);
    }
    
    /**
     * Manejar fin de toque en botón
     * @param {TouchEvent} e - Evento de touch
     * @param {HTMLElement} button - Elemento del botón
     * @private
     */
    handleButtonTouchEnd(e, button) {
        e.preventDefault();
        
        const buttonId = button.id;
        
        // Remover clase visual
        button.classList.remove('spikepulse-control-btn--active');
        this.mobileControls.activeButtons.delete(buttonId);
        
        // Emitir evento de input
        this.emitButtonEvent(buttonId, 'end');
        
        console.log('[ResponsiveUI] Botón touch end:', buttonId);
    }
    
    /**
     * Manejar cancelación de toque en botón
     * @param {TouchEvent} e - Evento de touch
     * @param {HTMLElement} button - Elemento del botón
     * @private
     */
    handleButtonTouchCancel(e, button) {
        const buttonId = button.id;
        
        // Remover clase visual
        button.classList.remove('spikepulse-control-btn--active');
        this.mobileControls.activeButtons.delete(buttonId);
        
        // Emitir evento de cancelación
        this.emitButtonEvent(buttonId, 'cancel');
    }
    
    /**
     * Manejar mouse down en botón (para testing)
     * @param {MouseEvent} e - Evento de mouse
     * @param {HTMLElement} button - Elemento del botón
     * @private
     */
    handleButtonMouseDown(e, button) {
        if (this.deviceState.hasTouch) return; // Solo en dispositivos sin touch
        
        const buttonId = button.id;
        button.classList.add('spikepulse-control-btn--active');
        this.emitButtonEvent(buttonId, 'start');
    }
    
    /**
     * Manejar mouse up en botón (para testing)
     * @param {MouseEvent} e - Evento de mouse
     * @param {HTMLElement} button - Elemento del botón
     * @private
     */
    handleButtonMouseUp(e, button) {
        if (this.deviceState.hasTouch) return; // Solo en dispositivos sin touch
        
        const buttonId = button.id;
        button.classList.remove('spikepulse-control-btn--active');
        this.emitButtonEvent(buttonId, 'end');
    }
    
    /**
     * Manejar inicio de toque en canvas
     * @param {TouchEvent} e - Evento de touch
     * @private
     */
    handleCanvasTouchStart(e) {
        e.preventDefault();
        
        const touch = e.touches[0];
        const rect = this.elements.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // Guardar posición inicial
        this.mobileControls.touchStartPositions.set(touch.identifier, { x, y, time: Date.now() });
        
        // Emitir evento de toque en canvas (para salto)
        this.eventBus.emit('input:canvas-touch', { x, y, type: 'start' });
    }
    
    /**
     * Manejar movimiento de toque en canvas
     * @param {TouchEvent} e - Evento de touch
     * @private
     */
    handleCanvasTouchMove(e) {
        e.preventDefault();
        
        const touch = e.touches[0];
        const startPos = this.mobileControls.touchStartPositions.get(touch.identifier);
        
        if (!startPos) return;
        
        const rect = this.elements.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        const deltaX = x - startPos.x;
        const deltaY = y - startPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Detectar gestos
        if (distance > this.mobileControls.gestureThreshold) {
            this.detectGesture(deltaX, deltaY, distance);
        }
    }
    
    /**
     * Manejar fin de toque en canvas
     * @param {TouchEvent} e - Evento de touch
     * @private
     */
    handleCanvasTouchEnd(e) {
        e.preventDefault();
        
        const touch = e.changedTouches[0];
        const startPos = this.mobileControls.touchStartPositions.get(touch.identifier);
        
        if (startPos) {
            const duration = Date.now() - startPos.time;
            
            // Si fue un tap rápido, emitir evento de salto
            if (duration < 200) {
                this.eventBus.emit('input:jump');
                this.triggerHapticFeedback('medium');
            }
            
            this.mobileControls.touchStartPositions.delete(touch.identifier);
        }
    }
    
    /**
     * Detectar gesto
     * @param {number} deltaX - Diferencia en X
     * @param {number} deltaY - Diferencia en Y
     * @param {number} distance - Distancia total
     * @private
     */
    detectGesture(deltaX, deltaY, distance) {
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        
        // Swipe horizontal para dash
        if (Math.abs(angle) < 30 || Math.abs(angle) > 150) {
            if (Math.abs(deltaX) > this.mobileControls.gestureThreshold) {
                this.eventBus.emit('input:dash');
                this.triggerHapticFeedback('heavy');
            }
        }
        
        // Swipe vertical para cambio de gravedad
        if (Math.abs(angle - 90) < 30 || Math.abs(angle + 90) < 30) {
            if (Math.abs(deltaY) > this.mobileControls.gestureThreshold) {
                this.eventBus.emit('input:gravity-toggle');
                this.triggerHapticFeedback('heavy');
            }
        }
    }
    
    /**
     * Emitir evento de botón
     * @param {string} buttonId - ID del botón
     * @param {string} action - Acción (start, end, cancel)
     * @private
     */
    emitButtonEvent(buttonId, action) {
        const eventMap = {
            'jumpBtn': 'input:jump',
            'leftBtn': 'input:move-left',
            'rightBtn': 'input:move-right',
            'dashBtn': 'input:dash',
            'gravityBtn': 'input:gravity-toggle'
        };
        
        const eventName = eventMap[buttonId];
        if (eventName) {
            if (action === 'start') {
                this.eventBus.emit(eventName, { mobile: true });
            } else if (action === 'end') {
                this.eventBus.emit(eventName + '-end', { mobile: true });
            }
        }
    }
    
    /**
     * Activar feedback háptico
     * @param {string} intensity - Intensidad ('light', 'medium', 'heavy')
     * @private
     */
    triggerHapticFeedback(intensity = 'light') {
        if (!this.hasVibration) return;
        
        const patterns = {
            light: 10,
            medium: 20,
            heavy: 50
        };
        
        const pattern = patterns[intensity] || patterns.light;
        navigator.vibrate(pattern);
    }
    
    /**
     * Obtener estado del dispositivo
     * @returns {Object} Estado actual del dispositivo
     */
    getDeviceState() {
        return { ...this.deviceState };
    }
    
    /**
     * Verificar si es dispositivo móvil
     * @returns {boolean} Si es móvil
     */
    isMobile() {
        return this.deviceState.isMobile;
    }
    
    /**
     * Verificar si es tablet
     * @returns {boolean} Si es tablet
     */
    isTablet() {
        return this.deviceState.isTablet;
    }
    
    /**
     * Verificar si es desktop
     * @returns {boolean} Si es desktop
     */
    isDesktop() {
        return this.deviceState.isDesktop;
    }
    
    /**
     * Obtener orientación actual
     * @returns {string} Orientación ('portrait' o 'landscape')
     */
    getOrientation() {
        return this.deviceState.orientation;
    }
    
    /**
     * Obtener información del ResponsiveUI
     * @returns {Object} Información del sistema
     */
    getInfo() {
        return {
            isInitialized: this.isInitialized,
            deviceState: this.deviceState,
            breakpoints: this.breakpoints,
            mobileControlsVisible: this.mobileControls.isVisible,
            hasVibration: this.hasVibration,
            activeButtons: Array.from(this.mobileControls.activeButtons)
        };
    }
    
    /**
     * Destruir ResponsiveUI y limpiar recursos
     */
    destroy() {
        // Limpiar event listeners
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('orientationchange', this.handleOrientationChange);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Limpiar event listeners del EventBus
        this.eventBus.off('game:start');
        this.eventBus.off('game:end');
        this.eventBus.off('state:change');
        
        // Limpiar referencias
        this.elements = {};
        this.mobileControls.touchStartPositions.clear();
        this.mobileControls.activeButtons.clear();
        
        this.isInitialized = false;
        
        console.log('[ResponsiveUI] ResponsiveUI destruido');
    }
}