/**
 * AccessibilityManager - Sistema de accesibilidad y navegación por teclado
 * @module AccessibilityManager
 */

export class AccessibilityManager {
    /**
     * Crea una nueva instancia del AccessibilityManager
     * @param {EventBus} eventBus - Instancia del EventBus
     * @param {Object} config - Configuración de accesibilidad
     */
    constructor(eventBus, config = {}) {
        this.eventBus = eventBus;
        this.config = config;
        
        // Estado de accesibilidad
        this.isEnabled = config.enabled !== false;
        this.screenReaderEnabled = config.screenReader !== false;
        this.keyboardNavigationEnabled = config.keyboardNavigation !== false;
        this.highContrastMode = config.highContrast || false;
        this.reducedMotionMode = config.reducedMotion || false;
        
        // Elementos focusables
        this.focusableElements = [];
        this.currentFocusIndex = -1;
        this.focusTrap = null;
        
        // Anuncios para lectores de pantalla
        this.announcements = [];
        this.announcementElement = null;
        
        // Configuración de navegación
        this.navigationKeys = {
            next: ['Tab'],
            previous: ['Tab+Shift'],
            activate: ['Enter', 'Space'],
            escape: ['Escape'],
            home: ['Home'],
            end: ['End']
        };
        
        this.init();
    }

    /**
     * Inicializar AccessibilityManager
     * @private
     */
    init() {
        this.detectUserPreferences();
        this.setupEventListeners();
        this.createScreenReaderElements();
        this.setupKeyboardNavigation();
        this.applyAccessibilitySettings();
        
        console.log('[AccessibilityManager] Sistema de accesibilidad inicializado');
    }

    /**
     * Detectar preferencias del usuario
     * @private
     */
    detectUserPreferences() {
        // Detectar preferencia de movimiento reducido
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.reducedMotionMode = true;
            console.log('[AccessibilityManager] Movimiento reducido detectado');
        }
        
        // Detectar preferencia de alto contraste
        if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
            this.highContrastMode = true;
            console.log('[AccessibilityManager] Alto contraste detectado');
        }
        
        // Detectar si hay lector de pantalla activo
        this.detectScreenReader();
    }

    /**
     * Detectar lector de pantalla
     * @private
     */
    detectScreenReader() {
        // Crear elemento de prueba
        const testElement = document.createElement('div');
        testElement.setAttribute('aria-hidden', 'true');
        testElement.style.position = 'absolute';
        testElement.style.left = '-10000px';
        testElement.textContent = 'test';
        
        document.body.appendChild(testElement);
        
        // Si el elemento es accesible, probablemente hay un lector de pantalla
        setTimeout(() => {
            const isAccessible = testElement.offsetHeight > 0 || testElement.offsetWidth > 0;
            if (isAccessible) {
                this.screenReaderEnabled = true;
                console.log('[AccessibilityManager] Lector de pantalla detectado');
            }
            document.body.removeChild(testElement);
        }, 100);
    }

    /**
     * Configurar listeners de eventos
     * @private
     */
    setupEventListeners() {
        // Escuchar cambios en preferencias del sistema
        if (window.matchMedia) {
            window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
                this.setReducedMotion(e.matches);
            });
            
            window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
                this.setHighContrast(e.matches);
            });
        }
        
        // Escuchar eventos del juego
        this.eventBus.on('game:state-changed', this.handleGameStateChange.bind(this));
        this.eventBus.on('ui:screen-changed', this.handleScreenChange.bind(this));
        this.eventBus.on('accessibility:announce', this.announce.bind(this));
        this.eventBus.on('accessibility:focus', this.handleFocusRequest.bind(this));
        
        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('focusin', this.handleFocusIn.bind(this));
        document.addEventListener('focusout', this.handleFocusOut.bind(this));
    }   
 /**
     * Crear elementos para lectores de pantalla
     * @private
     */
    createScreenReaderElements() {
        // Crear elemento para anuncios
        this.announcementElement = document.createElement('div');
        this.announcementElement.id = 'spikepulse-announcements';
        this.announcementElement.setAttribute('aria-live', 'polite');
        this.announcementElement.setAttribute('aria-atomic', 'true');
        this.announcementElement.className = 'sr-only';
        this.announcementElement.style.cssText = `
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            padding: 0 !important;
            margin: -1px !important;
            overflow: hidden !important;
            clip: rect(0, 0, 0, 0) !important;
            white-space: nowrap !important;
            border: 0 !important;
        `;
        
        document.body.appendChild(this.announcementElement);
        
        // Crear elemento para anuncios urgentes
        this.urgentAnnouncementElement = document.createElement('div');
        this.urgentAnnouncementElement.id = 'spikepulse-urgent-announcements';
        this.urgentAnnouncementElement.setAttribute('aria-live', 'assertive');
        this.urgentAnnouncementElement.setAttribute('aria-atomic', 'true');
        this.urgentAnnouncementElement.className = 'sr-only';
        this.urgentAnnouncementElement.style.cssText = this.announcementElement.style.cssText;
        
        document.body.appendChild(this.urgentAnnouncementElement);
        
        console.log('[AccessibilityManager] Elementos de lector de pantalla creados');
    }

    /**
     * Configurar navegación por teclado
     * @private
     */
    setupKeyboardNavigation() {
        // Actualizar elementos focusables
        this.updateFocusableElements();
        
        // Configurar focus inicial
        this.setInitialFocus();
    }

    /**
     * Actualizar lista de elementos focusables
     * @private
     */
    updateFocusableElements() {
        const focusableSelectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])',
            '[role="button"]:not([disabled])',
            '[role="link"]:not([disabled])'
        ].join(', ');
        
        // Buscar solo elementos visibles
        const allFocusable = document.querySelectorAll(focusableSelectors);
        this.focusableElements = Array.from(allFocusable).filter(element => {
            return this.isElementVisible(element) && !element.hasAttribute('aria-hidden');
        });
        
        console.log(`[AccessibilityManager] ${this.focusableElements.length} elementos focusables encontrados`);
    }

    /**
     * Verificar si un elemento es visible
     * @param {HTMLElement} element - Elemento a verificar
     * @returns {boolean} True si es visible
     * @private
     */
    isElementVisible(element) {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               element.offsetWidth > 0 && 
               element.offsetHeight > 0;
    }

    /**
     * Establecer focus inicial
     * @private
     */
    setInitialFocus() {
        if (this.focusableElements.length > 0) {
            const firstElement = this.focusableElements[0];
            this.currentFocusIndex = 0;
            
            // No hacer focus automático, esperar interacción del usuario
            console.log('[AccessibilityManager] Focus inicial preparado');
        }
    }

    /**
     * Manejar tecla presionada
     * @param {KeyboardEvent} event - Evento de teclado
     * @private
     */
    handleKeyDown(event) {
        if (!this.keyboardNavigationEnabled) return;
        
        const key = event.key;
        const isShift = event.shiftKey;
        const isCtrl = event.ctrlKey;
        const isAlt = event.altKey;
        
        // Navegación por Tab
        if (key === 'Tab') {
            this.handleTabNavigation(event, isShift);
        }
        
        // Teclas de acceso rápido
        if (isAlt) {
            this.handleAccessKeys(event);
        }
        
        // Escape para salir de focus traps
        if (key === 'Escape') {
            this.handleEscape(event);
        }
        
        // Enter/Space para activar elementos
        if (key === 'Enter' || key === ' ') {
            this.handleActivation(event);
        }
        
        // Navegación con flechas en menús
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            this.handleArrowNavigation(event);
        }
    }

    /**
     * Manejar navegación con Tab
     * @param {KeyboardEvent} event - Evento de teclado
     * @param {boolean} isShift - Si Shift está presionado
     * @private
     */
    handleTabNavigation(event, isShift) {
        // Si hay un focus trap activo, manejarlo
        if (this.focusTrap) {
            this.handleFocusTrap(event, isShift);
            return;
        }
        
        // Navegación normal
        this.updateFocusableElements();
        
        if (this.focusableElements.length === 0) return;
        
        const currentElement = document.activeElement;
        const currentIndex = this.focusableElements.indexOf(currentElement);
        
        let nextIndex;
        if (isShift) {
            // Ir hacia atrás
            nextIndex = currentIndex <= 0 ? this.focusableElements.length - 1 : currentIndex - 1;
        } else {
            // Ir hacia adelante
            nextIndex = currentIndex >= this.focusableElements.length - 1 ? 0 : currentIndex + 1;
        }
        
        const nextElement = this.focusableElements[nextIndex];
        if (nextElement) {
            event.preventDefault();
            nextElement.focus();
            this.currentFocusIndex = nextIndex;
            
            // Anunciar elemento enfocado
            this.announceElement(nextElement);
        }
    }

    /**
     * Manejar focus trap
     * @param {KeyboardEvent} event - Evento de teclado
     * @param {boolean} isShift - Si Shift está presionado
     * @private
     */
    handleFocusTrap(event, isShift) {
        const trapElements = this.focusTrap.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        );
        
        const focusableInTrap = Array.from(trapElements).filter(el => this.isElementVisible(el));
        
        if (focusableInTrap.length === 0) return;
        
        const currentElement = document.activeElement;
        const currentIndex = focusableInTrap.indexOf(currentElement);
        
        let nextIndex;
        if (isShift) {
            nextIndex = currentIndex <= 0 ? focusableInTrap.length - 1 : currentIndex - 1;
        } else {
            nextIndex = currentIndex >= focusableInTrap.length - 1 ? 0 : currentIndex + 1;
        }
        
        event.preventDefault();
        focusableInTrap[nextIndex].focus();
    }

    /**
     * Manejar teclas de acceso
     * @param {KeyboardEvent} event - Evento de teclado
     * @private
     */
    handleAccessKeys(event) {
        const key = event.key.toLowerCase();
        
        // Alt + M para menú principal
        if (key === 'm') {
            event.preventDefault();
            this.focusMainMenu();
        }
        
        // Alt + G para área de juego
        if (key === 'g') {
            event.preventDefault();
            this.focusGameArea();
        }
        
        // Alt + H para HUD
        if (key === 'h') {
            event.preventDefault();
            this.focusHUD();
        }
        
        // Alt + C para controles
        if (key === 'c') {
            event.preventDefault();
            this.focusControls();
        }
    }

    /**
     * Manejar tecla Escape
     * @param {KeyboardEvent} event - Evento de teclado
     * @private
     */
    handleEscape(event) {
        // Salir de focus trap
        if (this.focusTrap) {
            this.releaseFocusTrap();
            event.preventDefault();
        }
        
        // Cerrar modales o menús
        this.eventBus.emit('accessibility:escape-pressed');
    }

    /**
     * Manejar activación de elementos
     * @param {KeyboardEvent} event - Evento de teclado
     * @private
     */
    handleActivation(event) {
        const activeElement = document.activeElement;
        
        if (activeElement && (activeElement.tagName === 'BUTTON' || activeElement.getAttribute('role') === 'button')) {
            // Prevenir doble activación
            if (event.key === ' ') {
                event.preventDefault();
            }
            
            // Simular click
            activeElement.click();
            
            // Anunciar activación
            this.announce(`${activeElement.textContent || activeElement.getAttribute('aria-label')} activado`);
        }
    }

    /**
     * Manejar navegación con flechas
     * @param {KeyboardEvent} event - Evento de teclado
     * @private
     */
    handleArrowNavigation(event) {
        const activeElement = document.activeElement;
        
        // Solo en elementos con role específicos
        if (activeElement && (
            activeElement.getAttribute('role') === 'menuitem' ||
            activeElement.getAttribute('role') === 'tab' ||
            activeElement.getAttribute('role') === 'option'
        )) {
            event.preventDefault();
            this.navigateWithArrows(activeElement, event.key);
        }
    }

    /**
     * Navegar con flechas en grupos de elementos
     * @param {HTMLElement} currentElement - Elemento actual
     * @param {string} direction - Dirección de navegación
     * @private
     */
    navigateWithArrows(currentElement, direction) {
        const parent = currentElement.closest('[role="menu"], [role="tablist"], [role="listbox"]');
        if (!parent) return;
        
        const siblings = parent.querySelectorAll(`[role="${currentElement.getAttribute('role')}"]`);
        const currentIndex = Array.from(siblings).indexOf(currentElement);
        
        let nextIndex;
        switch (direction) {
            case 'ArrowDown':
            case 'ArrowRight':
                nextIndex = currentIndex >= siblings.length - 1 ? 0 : currentIndex + 1;
                break;
            case 'ArrowUp':
            case 'ArrowLeft':
                nextIndex = currentIndex <= 0 ? siblings.length - 1 : currentIndex - 1;
                break;
        }
        
        if (nextIndex !== undefined && siblings[nextIndex]) {
            siblings[nextIndex].focus();
            this.announceElement(siblings[nextIndex]);
        }
    }

    /**
     * Manejar focus in
     * @param {FocusEvent} event - Evento de focus
     * @private
     */
    handleFocusIn(event) {
        const element = event.target;
        
        // Actualizar índice de focus actual
        const index = this.focusableElements.indexOf(element);
        if (index !== -1) {
            this.currentFocusIndex = index;
        }
        
        // Emitir evento
        this.eventBus.emit('accessibility:focus-changed', {
            element,
            index: this.currentFocusIndex
        });
    }

    /**
     * Manejar focus out
     * @param {FocusEvent} event - Evento de focus
     * @private
     */
    handleFocusOut(event) {
        // Emitir evento
        this.eventBus.emit('accessibility:focus-lost', {
            element: event.target
        });
    }

    // ===== FOCUS MANAGEMENT =====

    /**
     * Enfocar elemento específico
     * @param {HTMLElement|string} element - Elemento o selector
     */
    focusElement(element) {
        let targetElement;
        
        if (typeof element === 'string') {
            targetElement = document.querySelector(element);
        } else {
            targetElement = element;
        }
        
        if (targetElement && this.isElementVisible(targetElement)) {
            targetElement.focus();
            this.announceElement(targetElement);
            return true;
        }
        
        return false;
    }

    /**
     * Enfocar menú principal
     */
    focusMainMenu() {
        const menuButton = document.querySelector('#startBtn, .spikepulse-screen-button');
        if (menuButton) {
            this.focusElement(menuButton);
            this.announce('Menú principal');
        }
    }

    /**
     * Enfocar área de juego
     */
    focusGameArea() {
        const gameCanvas = document.querySelector('#gameCanvas');
        if (gameCanvas) {
            // Hacer el canvas focusable temporalmente
            gameCanvas.setAttribute('tabindex', '0');
            this.focusElement(gameCanvas);
            this.announce('Área de juego');
        }
    }

    /**
     * Enfocar HUD
     */
    focusHUD() {
        const hud = document.querySelector('#gameHUD');
        if (hud) {
            // Enfocar primer elemento del HUD
            const firstStat = hud.querySelector('.spikepulse-hud__stat');
            if (firstStat) {
                firstStat.setAttribute('tabindex', '0');
                this.focusElement(firstStat);
                this.announce('Estadísticas del juego');
            }
        }
    }

    /**
     * Enfocar controles
     */
    focusControls() {
        const controls = document.querySelector('#mobileControls');
        if (controls && this.isElementVisible(controls)) {
            const firstButton = controls.querySelector('.spikepulse-control-btn');
            if (firstButton) {
                this.focusElement(firstButton);
                this.announce('Controles del juego');
            }
        }
    }

    /**
     * Crear focus trap
     * @param {HTMLElement} container - Contenedor para el trap
     */
    createFocusTrap(container) {
        this.focusTrap = container;
        
        // Enfocar primer elemento focusable en el trap
        const firstFocusable = container.querySelector(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        );
        
        if (firstFocusable) {
            firstFocusable.focus();
        }
        
        console.log('[AccessibilityManager] Focus trap creado');
    }

    /**
     * Liberar focus trap
     */
    releaseFocusTrap() {
        this.focusTrap = null;
        console.log('[AccessibilityManager] Focus trap liberado');
    }

    // ===== SCREEN READER SUPPORT =====

    /**
     * Anunciar mensaje a lectores de pantalla
     * @param {string} message - Mensaje a anunciar
     * @param {string} priority - Prioridad ('polite' o 'assertive')
     */
    announce(message, priority = 'polite') {
        if (!this.screenReaderEnabled || !message) return;
        
        const element = priority === 'assertive' ? 
            this.urgentAnnouncementElement : 
            this.announcementElement;
        
        // Limpiar contenido anterior
        element.textContent = '';
        
        // Agregar nuevo mensaje después de un pequeño delay
        setTimeout(() => {
            element.textContent = message;
        }, 10);
        
        // Limpiar después de un tiempo
        setTimeout(() => {
            element.textContent = '';
        }, 5000);
        
        console.log(`[AccessibilityManager] Anuncio (${priority}): ${message}`);
    }

    /**
     * Anunciar elemento enfocado
     * @param {HTMLElement} element - Elemento enfocado
     * @private
     */
    announceElement(element) {
        if (!this.screenReaderEnabled) return;
        
        let announcement = '';
        
        // Obtener texto del elemento
        const text = element.textContent || element.getAttribute('aria-label') || element.getAttribute('title');
        if (text) {
            announcement += text;
        }
        
        // Agregar tipo de elemento
        const role = element.getAttribute('role') || element.tagName.toLowerCase();
        switch (role) {
            case 'button':
                announcement += ', botón';
                break;
            case 'link':
                announcement += ', enlace';
                break;
            case 'input':
                announcement += ', campo de entrada';
                break;
        }
        
        // Agregar estado
        if (element.disabled) {
            announcement += ', deshabilitado';
        }
        
        if (element.getAttribute('aria-pressed') === 'true') {
            announcement += ', presionado';
        }
        
        if (announcement) {
            this.announce(announcement);
        }
    }

    // ===== EVENT HANDLERS =====

    /**
     * Manejar cambio de estado del juego
     * @param {Object} data - Datos del cambio de estado
     * @private
     */
    handleGameStateChange(data) {
        const { state } = data;
        
        let message = '';
        switch (state) {
            case 'menu':
                message = 'Menú principal';
                break;
            case 'playing':
                message = 'Juego iniciado';
                break;
            case 'paused':
                message = 'Juego pausado';
                break;
            case 'gameOver':
                message = 'Juego terminado';
                break;
        }
        
        if (message) {
            this.announce(message, 'assertive');
        }
        
        // Actualizar elementos focusables
        setTimeout(() => {
            this.updateFocusableElements();
        }, 100);
    }

    /**
     * Manejar cambio de pantalla
     * @param {Object} data - Datos del cambio de pantalla
     * @private
     */
    handleScreenChange(data) {
        const { screen } = data;
        
        // Crear focus trap para modales
        if (screen === 'gameOver' || screen === 'pause') {
            const modal = document.querySelector('.spikepulse-screen-overlay:not(.spikepulse-hidden)');
            if (modal) {
                this.createFocusTrap(modal);
            }
        } else {
            this.releaseFocusTrap();
        }
        
        // Actualizar elementos focusables
        this.updateFocusableElements();
    }

    /**
     * Manejar solicitud de focus
     * @param {Object} data - Datos de la solicitud
     * @private
     */
    handleFocusRequest(data) {
        const { element, selector } = data;
        
        if (element) {
            this.focusElement(element);
        } else if (selector) {
            this.focusElement(selector);
        }
    }

    // ===== SETTINGS =====

    /**
     * Aplicar configuraciones de accesibilidad
     * @private
     */
    applyAccessibilitySettings() {
        const body = document.body;
        
        // Alto contraste
        if (this.highContrastMode) {
            body.classList.add('sp-high-contrast');
        } else {
            body.classList.remove('sp-high-contrast');
        }
        
        // Movimiento reducido
        if (this.reducedMotionMode) {
            body.classList.add('sp-reduced-motion');
        } else {
            body.classList.remove('sp-reduced-motion');
        }
        
        // Navegación por teclado
        if (this.keyboardNavigationEnabled) {
            body.classList.add('sp-keyboard-navigation');
        } else {
            body.classList.remove('sp-keyboard-navigation');
        }
    }

    /**
     * Establecer modo de alto contraste
     * @param {boolean} enabled - Estado habilitado
     */
    setHighContrast(enabled) {
        this.highContrastMode = enabled;
        this.applyAccessibilitySettings();
        
        this.announce(enabled ? 'Alto contraste activado' : 'Alto contraste desactivado');
        this.eventBus.emit('accessibility:high-contrast-changed', { enabled });
    }

    /**
     * Establecer modo de movimiento reducido
     * @param {boolean} enabled - Estado habilitado
     */
    setReducedMotion(enabled) {
        this.reducedMotionMode = enabled;
        this.applyAccessibilitySettings();
        
        this.announce(enabled ? 'Movimiento reducido activado' : 'Movimiento reducido desactivado');
        this.eventBus.emit('accessibility:reduced-motion-changed', { enabled });
    }

    /**
     * Habilitar/deshabilitar navegación por teclado
     * @param {boolean} enabled - Estado habilitado
     */
    setKeyboardNavigation(enabled) {
        this.keyboardNavigationEnabled = enabled;
        this.applyAccessibilitySettings();
        
        if (enabled) {
            this.updateFocusableElements();
        }
        
        this.eventBus.emit('accessibility:keyboard-navigation-changed', { enabled });
    }

    /**
     * Habilitar/deshabilitar lector de pantalla
     * @param {boolean} enabled - Estado habilitado
     */
    setScreenReader(enabled) {
        this.screenReaderEnabled = enabled;
        
        this.eventBus.emit('accessibility:screen-reader-changed', { enabled });
    }

    // ===== PUBLIC API =====

    /**
     * Obtener estadísticas de accesibilidad
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            isEnabled: this.isEnabled,
            screenReaderEnabled: this.screenReaderEnabled,
            keyboardNavigationEnabled: this.keyboardNavigationEnabled,
            highContrastMode: this.highContrastMode,
            reducedMotionMode: this.reducedMotionMode,
            focusableElements: this.focusableElements.length,
            currentFocusIndex: this.currentFocusIndex,
            hasFocusTrap: !!this.focusTrap
        };
    }

    /**
     * Destruir AccessibilityManager
     */
    destroy() {
        // Remover event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('focusin', this.handleFocusIn);
        document.removeEventListener('focusout', this.handleFocusOut);
        
        // Limpiar elementos
        if (this.announcementElement) {
            document.body.removeChild(this.announcementElement);
        }
        if (this.urgentAnnouncementElement) {
            document.body.removeChild(this.urgentAnnouncementElement);
        }
        
        // Limpiar estado
        this.focusableElements = [];
        this.focusTrap = null;
        
        console.log('[AccessibilityManager] AccessibilityManager destruido');
    }
}