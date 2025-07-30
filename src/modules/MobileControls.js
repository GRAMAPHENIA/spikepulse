/**
 * MobileControls - Sistema de controles móviles táctiles
 * @module MobileControls
 */

export class MobileControls {
    /**
     * Crea una nueva instancia de MobileControls
     * @param {EventBus} eventBus - Instancia del EventBus
     * @param {Object} config - Configuración de controles móviles
     */
    constructor(eventBus, config = {}) {
        this.eventBus = eventBus;
        this.config = config;
        
        // Elementos del DOM
        this.controlsContainer = null;
        this.movementGroup = null;
        this.actionGroup = null;
        this.buttons = new Map();
        
        // Estado de controles
        this.isVisible = false;
        this.isEnabled = true;
        this.activeButtons = new Set();
        
        // Configuración
        this.buttonSize = config.buttonSize || 60;
        this.buttonGap = config.buttonGap || 12;
        this.margin = config.margin || 24;
        this.hapticFeedback = config.hapticFeedback !== false;
        this.visualFeedback = config.visualFeedback !== false;
        
        // Detección de dispositivo móvil
        this.isMobile = this.detectMobile();
        
        this.init();
    }

    /**
     * Inicializar controles móviles
     * @private
     */
    init() {
        if (!this.isMobile) {
            console.log('[MobileControls] Dispositivo no móvil detectado, controles deshabilitados');
            return;
        }

        this.setupEventListeners();
        this.createControls();
        this.setupButtonEvents();
        
        console.log('[MobileControls] Controles móviles inicializados');
    }

    /**
     * Detectar si es dispositivo móvil
     * @returns {boolean} True si es móvil
     * @private
     */
    detectMobile() {
        // Verificar touch support
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Verificar user agent
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        const isMobileUA = mobileRegex.test(navigator.userAgent);
        
        // Verificar tamaño de pantalla
        const isSmallScreen = window.innerWidth <= 768;
        
        return hasTouch && (isMobileUA || isSmallScreen);
    }

    /**
     * Configurar listeners de eventos
     * @private
     */
    setupEventListeners() {
        // Escuchar cambios de orientación
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleOrientationChange(), 100);
        });
        
        // Escuchar cambios de tamaño de ventana
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Escuchar eventos del juego
        this.eventBus.on('game:state-changed', this.handleGameStateChange.bind(this));
        this.eventBus.on('mobile-controls:show', () => this.show());
        this.eventBus.on('mobile-controls:hide', () => this.hide());
        this.eventBus.on('mobile-controls:toggle', () => this.toggle());
    }

    /**
     * Crear controles en el DOM
     * @private
     */
    createControls() {
        // Buscar contenedor existente
        this.controlsContainer = document.getElementById('mobileControls');
        
        if (!this.controlsContainer) {
            console.warn('[MobileControls] Contenedor de controles móviles no encontrado');
            return;
        }

        // Limpiar contenido existente
        this.controlsContainer.innerHTML = '';
        
        // Crear grupos de controles
        this.createMovementControls();
        this.createActionControls();
        
        // Aplicar estilos dinámicos
        this.applyDynamicStyles();
        
        console.log('[MobileControls] Controles creados en el DOM');
    }

    /**
     * Crear controles de movimiento
     * @private
     */
    createMovementControls() {
        this.movementGroup = document.createElement('div');
        this.movementGroup.className = 'spikepulse-control-group spikepulse-control-group--movement';
        
        // Botón izquierda
        const leftButton = this.createButton('moveLeft', '←', 'Mover izquierda');
        leftButton.classList.add('spikepulse-control-btn--movement');
        this.buttons.set('moveLeft', leftButton);
        this.movementGroup.appendChild(leftButton);
        
        // Botón derecha
        const rightButton = this.createButton('moveRight', '→', 'Mover derecha');
        rightButton.classList.add('spikepulse-control-btn--movement');
        this.buttons.set('moveRight', rightButton);
        this.movementGroup.appendChild(rightButton);
        
        this.controlsContainer.appendChild(this.movementGroup);
    }

    /**
     * Crear controles de acción
     * @private
     */
    createActionControls() {
        this.actionGroup = document.createElement('div');
        this.actionGroup.className = 'spikepulse-control-group spikepulse-control-group--actions';
        
        // Botón salto
        const jumpButton = this.createButton('jump', 'SALTO', 'Saltar');
        jumpButton.classList.add('spikepulse-control-btn--jump');
        this.buttons.set('jump', jumpButton);
        this.actionGroup.appendChild(jumpButton);
        
        // Botón dash
        const dashButton = this.createButton('dash', 'DASH', 'Hacer dash');
        dashButton.classList.add('spikepulse-control-btn--dash');
        this.buttons.set('dash', dashButton);
        this.actionGroup.appendChild(dashButton);
        
        // Botón gravedad
        const gravityButton = this.createButton('gravity', 'GRAV', 'Cambiar gravedad');
        gravityButton.classList.add('spikepulse-control-btn--gravity');
        this.buttons.set('gravity', gravityButton);
        this.actionGroup.appendChild(gravityButton);
        
        this.controlsContainer.appendChild(this.actionGroup);
    }

    /**
     * Crear un botón de control
     * @param {string} action - Acción del botón
     * @param {string} text - Texto del botón
     * @param {string} ariaLabel - Label de accesibilidad
     * @returns {HTMLElement} Elemento del botón
     * @private
     */
    createButton(action, text, ariaLabel) {
        const button = document.createElement('button');
        button.className = 'spikepulse-control-btn';
        button.setAttribute('data-action', action);
        button.setAttribute('aria-label', ariaLabel);
        button.setAttribute('type', 'button');
        
        // Crear contenido del botón
        if (text.length === 1) {
            // Es un icono/símbolo
            const icon = document.createElement('span');
            icon.className = 'spikepulse-control-btn__icon';
            icon.textContent = text;
            button.appendChild(icon);
        } else {
            // Es texto
            const textSpan = document.createElement('span');
            textSpan.className = 'spikepulse-control-btn__text';
            textSpan.textContent = text;
            button.appendChild(textSpan);
        }
        
        return button;
    }

    /**
     * Configurar eventos de botones
     * @private
     */
    setupButtonEvents() {
        this.buttons.forEach((button, action) => {
            // Touch events
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleButtonStart(action, button, e);
            }, { passive: false });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleButtonEnd(action, button, e);
            }, { passive: false });
            
            button.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this.handleButtonEnd(action, button, e);
            }, { passive: false });
            
            // Mouse events para testing en desktop
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.handleButtonStart(action, button, e);
            });
            
            button.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.handleButtonEnd(action, button, e);
            });
            
            button.addEventListener('mouseleave', (e) => {
                this.handleButtonEnd(action, button, e);
            });
            
            // Prevenir context menu
            button.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        });
    }

    /**
     * Manejar inicio de presión de botón
     * @param {string} action - Acción del botón
     * @param {HTMLElement} button - Elemento del botón
     * @param {Event} event - Evento
     * @private
     */
    handleButtonStart(action, button, event) {
        if (!this.isEnabled) return;
        
        // Marcar botón como activo
        this.activeButtons.add(action);
        button.classList.add('spikepulse-control-btn--pressed');
        
        // Feedback visual
        if (this.visualFeedback) {
            button.classList.add('spikepulse-control-btn--feedback');
            setTimeout(() => {
                button.classList.remove('spikepulse-control-btn--feedback');
            }, 200);
        }
        
        // Feedback háptico
        if (this.hapticFeedback && navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Emitir evento de entrada
        this.eventBus.emit(`input:${action}:start`, {
            source: 'mobile-controls',
            button: action,
            element: button,
            event
        });
        
        // Emitir evento genérico
        this.eventBus.emit('mobile-controls:button-start', {
            action,
            button,
            event
        });
        
        console.log(`[MobileControls] Botón ${action} presionado`);
    }

    /**
     * Manejar fin de presión de botón
     * @param {string} action - Acción del botón
     * @param {HTMLElement} button - Elemento del botón
     * @param {Event} event - Evento
     * @private
     */
    handleButtonEnd(action, button, event) {
        if (!this.activeButtons.has(action)) return;
        
        // Desmarcar botón como activo
        this.activeButtons.delete(action);
        button.classList.remove('spikepulse-control-btn--pressed');
        
        // Emitir evento de entrada
        this.eventBus.emit(`input:${action}:end`, {
            source: 'mobile-controls',
            button: action,
            element: button,
            event
        });
        
        // Emitir evento genérico
        this.eventBus.emit('mobile-controls:button-end', {
            action,
            button,
            event
        });
        
        console.log(`[MobileControls] Botón ${action} liberado`);
    }

    /**
     * Aplicar estilos dinámicos
     * @private
     */
    applyDynamicStyles() {
        if (!this.controlsContainer) return;
        
        // Aplicar tamaño de botones
        const buttons = this.controlsContainer.querySelectorAll('.spikepulse-control-btn');
        buttons.forEach(button => {
            button.style.width = `${this.buttonSize}px`;
            button.style.height = `${this.buttonSize}px`;
        });
        
        // Aplicar espaciado
        const groups = this.controlsContainer.querySelectorAll('.spikepulse-control-group');
        groups.forEach(group => {
            group.style.gap = `${this.buttonGap}px`;
            group.style.padding = `${this.buttonGap}px`;
        });
        
        // Aplicar márgenes del contenedor
        this.controlsContainer.style.bottom = `${this.margin}px`;
        this.controlsContainer.style.left = `${this.margin}px`;
        this.controlsContainer.style.right = `${this.margin}px`;
    }

    /**
     * Manejar cambio de orientación
     * @private
     */
    handleOrientationChange() {
        console.log('[MobileControls] Cambio de orientación detectado');
        
        // Reajustar controles según orientación
        const isLandscape = window.innerWidth > window.innerHeight;
        
        if (isLandscape) {
            // En landscape, hacer botones más pequeños
            this.buttonSize = this.config.buttonSize * 0.8 || 48;
            this.margin = this.config.margin * 0.7 || 16;
        } else {
            // En portrait, usar tamaño normal
            this.buttonSize = this.config.buttonSize || 60;
            this.margin = this.config.margin || 24;
        }
        
        this.applyDynamicStyles();
        
        // Emitir evento
        this.eventBus.emit('mobile-controls:orientation-changed', {
            isLandscape,
            buttonSize: this.buttonSize,
            margin: this.margin
        });
    }

    /**
     * Manejar cambio de tamaño de ventana
     * @private
     */
    handleResize() {
        // Verificar si sigue siendo móvil
        const wasMobile = this.isMobile;
        this.isMobile = this.detectMobile();
        
        if (wasMobile !== this.isMobile) {
            if (this.isMobile) {
                this.show();
            } else {
                this.hide();
            }
        }
        
        // Reajustar estilos
        this.applyDynamicStyles();
    }

    /**
     * Manejar cambio de estado del juego
     * @param {Object} data - Datos del cambio de estado
     * @private
     */
    handleGameStateChange(data) {
        const { state } = data;
        
        switch (state) {
            case 'playing':
                this.show();
                this.setEnabled(true);
                break;
            case 'paused':
                this.setEnabled(false);
                break;
            case 'menu':
            case 'gameOver':
                this.hide();
                break;
        }
    }

    /**
     * Actualizar estado de botón dash según cooldown
     * @param {boolean} available - Si el dash está disponible
     * @param {number} cooldown - Tiempo de cooldown restante
     */
    updateDashButton(available, cooldown = 0) {
        const dashButton = this.buttons.get('dash');
        if (!dashButton) return;
        
        if (available) {
            dashButton.classList.remove('spikepulse-control-btn--cooldown');
            dashButton.disabled = false;
        } else {
            dashButton.classList.add('spikepulse-control-btn--cooldown');
            dashButton.disabled = true;
            
            // Mostrar progreso de cooldown
            if (cooldown > 0) {
                const progress = (cooldown / 1000) * 100; // Asumiendo 1s de cooldown
                dashButton.style.setProperty('--cooldown-progress', `${100 - progress}%`);
            }
        }
    }

    /**
     * Actualizar estado de botón según número de saltos
     * @param {number} jumpsRemaining - Saltos restantes
     */
    updateJumpButton(jumpsRemaining) {
        const jumpButton = this.buttons.get('jump');
        if (!jumpButton) return;
        
        if (jumpsRemaining > 0) {
            jumpButton.classList.remove('spikepulse-control-btn--disabled');
            jumpButton.disabled = false;
        } else {
            jumpButton.classList.add('spikepulse-control-btn--disabled');
            jumpButton.disabled = true;
        }
    }

    // ===== PUBLIC API =====

    /**
     * Mostrar controles móviles
     */
    show() {
        if (!this.isMobile || !this.controlsContainer) return;
        
        this.controlsContainer.classList.remove('spikepulse-hidden');
        this.controlsContainer.classList.add('sp-animate-fade-in-up');
        this.isVisible = true;
        
        console.log('[MobileControls] Controles mostrados');
        this.eventBus.emit('mobile-controls:shown');
    }

    /**
     * Ocultar controles móviles
     */
    hide() {
        if (!this.controlsContainer) return;
        
        this.controlsContainer.classList.add('spikepulse-hidden');
        this.controlsContainer.classList.remove('sp-animate-fade-in-up');
        this.isVisible = false;
        
        // Limpiar botones activos
        this.activeButtons.clear();
        this.buttons.forEach(button => {
            button.classList.remove('spikepulse-control-btn--pressed');
        });
        
        console.log('[MobileControls] Controles ocultados');
        this.eventBus.emit('mobile-controls:hidden');
    }

    /**
     * Alternar visibilidad de controles
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Habilitar/deshabilitar controles
     * @param {boolean} enabled - Estado habilitado
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        if (!enabled) {
            // Limpiar botones activos
            this.activeButtons.clear();
            this.buttons.forEach(button => {
                button.classList.remove('spikepulse-control-btn--pressed');
                button.disabled = true;
            });
        } else {
            this.buttons.forEach(button => {
                button.disabled = false;
            });
        }
        
        console.log(`[MobileControls] Controles ${enabled ? 'habilitados' : 'deshabilitados'}`);
        this.eventBus.emit('mobile-controls:enabled-changed', { enabled });
    }

    /**
     * Verificar si un botón está activo
     * @param {string} action - Acción del botón
     * @returns {boolean} True si está activo
     */
    isButtonActive(action) {
        return this.activeButtons.has(action);
    }

    /**
     * Obtener lista de botones activos
     * @returns {Array} Lista de acciones activas
     */
    getActiveButtons() {
        return Array.from(this.activeButtons);
    }

    /**
     * Configurar tamaño de botones
     * @param {number} size - Nuevo tamaño en píxeles
     */
    setButtonSize(size) {
        this.buttonSize = size;
        this.applyDynamicStyles();
        
        this.eventBus.emit('mobile-controls:button-size-changed', { size });
    }

    /**
     * Configurar márgenes
     * @param {number} margin - Nuevo margen en píxeles
     */
    setMargin(margin) {
        this.margin = margin;
        this.applyDynamicStyles();
        
        this.eventBus.emit('mobile-controls:margin-changed', { margin });
    }

    /**
     * Obtener estadísticas de controles móviles
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            isMobile: this.isMobile,
            isVisible: this.isVisible,
            isEnabled: this.isEnabled,
            activeButtons: Array.from(this.activeButtons),
            buttonCount: this.buttons.size,
            buttonSize: this.buttonSize,
            margin: this.margin,
            hapticFeedback: this.hapticFeedback,
            visualFeedback: this.visualFeedback
        };
    }

    /**
     * Destruir controles móviles
     */
    destroy() {
        // Remover event listeners
        window.removeEventListener('orientationchange', this.handleOrientationChange);
        window.removeEventListener('resize', this.handleResize);
        
        // Limpiar botones
        this.buttons.forEach(button => {
            button.remove();
        });
        this.buttons.clear();
        
        // Limpiar contenedor
        if (this.controlsContainer) {
            this.controlsContainer.innerHTML = '';
        }
        
        // Limpiar estado
        this.activeButtons.clear();
        
        console.log('[MobileControls] Controles móviles destruidos');
    }
}