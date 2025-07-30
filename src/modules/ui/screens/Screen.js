/**
 * Screen - Clase base para todas las pantallas de la UI
 * Proporciona funcionalidad común para manejo de pantallas
 * @module Screen
 */

export class Screen {
    /**
     * Crea una nueva instancia de Screen
     * @param {string} screenId - ID del elemento DOM de la pantalla
     * @param {Object} config - Configuración de la pantalla
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(screenId, config, eventBus) {
        this.screenId = screenId;
        this.config = config;
        this.eventBus = eventBus;
        this.element = null;
        this.isVisible = false;
        this.isInitialized = false;
        
        this.init();
    }
    
    /**
     * Inicializar la pantalla
     * @protected
     */
    init() {
        try {
            // Obtener elemento DOM
            this.element = document.getElementById(this.screenId);
            if (!this.element) {
                throw new Error(`Elemento de pantalla no encontrado: ${this.screenId}`);
            }
            
            // Configurar elementos de la pantalla
            this.setupElements();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Configurar accesibilidad
            this.setupAccessibility();
            
            this.isInitialized = true;
            console.log(`[Screen:${this.screenId}] Pantalla inicializada`);
            
        } catch (error) {
            console.error(`[Screen:${this.screenId}] Error durante inicialización:`, error);
            throw error;
        }
    }
    
    /**
     * Configurar elementos de la pantalla
     * Debe ser implementado por las clases hijas
     * @protected
     */
    setupElements() {
        // Implementar en clases hijas
    }
    
    /**
     * Configurar event listeners específicos de la pantalla
     * Debe ser implementado por las clases hijas
     * @protected
     */
    setupEventListeners() {
        // Implementar en clases hijas
    }
    
    /**
     * Configurar accesibilidad específica de la pantalla
     * @protected
     */
    setupAccessibility() {
        if (!this.element) return;
        
        // Configurar atributos ARIA básicos
        this.element.setAttribute('role', 'dialog');
        this.element.setAttribute('aria-modal', 'true');
        
        // Configurar navegación por teclado
        this.setupKeyboardNavigation();
    }
    
    /**
     * Configurar navegación por teclado
     * @protected
     */
    setupKeyboardNavigation() {
        if (!this.element) return;
        
        // Encontrar elementos focusables
        this.focusableElements = this.element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        // Configurar trap de foco
        this.element.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
    }
    
    /**
     * Manejar eventos de teclado
     * @param {KeyboardEvent} e - Evento de teclado
     * @protected
     */
    handleKeyDown(e) {
        // Manejar Tab para trap de foco
        if (e.key === 'Tab' && this.isVisible) {
            this.handleTabNavigation(e);
        }
        
        // Permitir que las clases hijas manejen otros eventos
        this.onKeyDown(e);
    }
    
    /**
     * Manejar navegación con Tab
     * @param {KeyboardEvent} e - Evento de teclado
     * @private
     */
    handleTabNavigation(e) {
        if (this.focusableElements.length === 0) return;
        
        const firstElement = this.focusableElements[0];
        const lastElement = this.focusableElements[this.focusableElements.length - 1];
        
        if (e.shiftKey) {
            // Shift + Tab (hacia atrás)
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab (hacia adelante)
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }
    
    /**
     * Método para que las clases hijas manejen eventos de teclado
     * @param {KeyboardEvent} e - Evento de teclado
     * @protected
     */
    onKeyDown(e) {
        // Implementar en clases hijas si es necesario
    }
    
    /**
     * Mostrar la pantalla
     * @param {Object} data - Datos adicionales para la pantalla
     */
    show(data = {}) {
        if (!this.isInitialized) {
            console.warn(`[Screen:${this.screenId}] Intento de mostrar pantalla no inicializada`);
            return;
        }
        
        try {
            // Actualizar datos si se proporcionan
            if (Object.keys(data).length > 0) {
                this.updateData(data);
            }
            
            // Mostrar elemento
            this.element.classList.remove('spikepulse-hidden');
            this.isVisible = true;
            
            // Configurar foco inicial
            this.setInitialFocus();
            
            // Llamar método de mostrar específico de la clase hija
            this.onShow(data);
            
            console.log(`[Screen:${this.screenId}] Pantalla mostrada`);
            
        } catch (error) {
            console.error(`[Screen:${this.screenId}] Error al mostrar pantalla:`, error);
            throw error;
        }
    }
    
    /**
     * Ocultar la pantalla
     */
    hide() {
        if (!this.isInitialized) {
            console.warn(`[Screen:${this.screenId}] Intento de ocultar pantalla no inicializada`);
            return;
        }
        
        try {
            // Ocultar elemento
            this.element.classList.add('spikepulse-hidden');
            this.isVisible = false;
            
            // Llamar método de ocultar específico de la clase hija
            this.onHide();
            
            console.log(`[Screen:${this.screenId}] Pantalla ocultada`);
            
        } catch (error) {
            console.error(`[Screen:${this.screenId}] Error al ocultar pantalla:`, error);
            throw error;
        }
    }
    
    /**
     * Configurar foco inicial cuando se muestra la pantalla
     * @protected
     */
    setInitialFocus() {
        if (this.focusableElements.length > 0) {
            // Buscar el primer botón primario o el primer elemento focusable
            const primaryButton = this.element.querySelector('.spikepulse-screen-button--primary');
            const focusTarget = primaryButton || this.focusableElements[0];
            
            // Usar setTimeout para asegurar que el elemento esté visible
            setTimeout(() => {
                focusTarget.focus();
            }, 100);
        }
    }
    
    /**
     * Actualizar datos de la pantalla
     * Debe ser implementado por las clases hijas
     * @param {Object} data - Nuevos datos
     * @protected
     */
    updateData(data) {
        // Implementar en clases hijas
    }
    
    /**
     * Método llamado cuando se muestra la pantalla
     * Puede ser sobrescrito por las clases hijas
     * @param {Object} data - Datos de la pantalla
     * @protected
     */
    onShow(data) {
        // Implementar en clases hijas si es necesario
    }
    
    /**
     * Método llamado cuando se oculta la pantalla
     * Puede ser sobrescrito por las clases hijas
     * @protected
     */
    onHide() {
        // Implementar en clases hijas si es necesario
    }
    
    /**
     * Manejar cambio de tamaño de ventana
     * Puede ser sobrescrito por las clases hijas
     */
    handleResize() {
        // Implementar en clases hijas si es necesario
    }
    
    /**
     * Verificar si la pantalla está visible
     * @returns {boolean} Si la pantalla está visible
     */
    isVisible() {
        return this.isVisible;
    }
    
    /**
     * Obtener elemento DOM de la pantalla
     * @returns {HTMLElement|null} Elemento DOM
     */
    getElement() {
        return this.element;
    }
    
    /**
     * Obtener estadísticas de la pantalla
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            screenId: this.screenId,
            isInitialized: this.isInitialized,
            isVisible: this.isVisible,
            focusableElementsCount: this.focusableElements ? this.focusableElements.length : 0
        };
    }
    
    /**
     * Destruir la pantalla y limpiar recursos
     */
    destroy() {
        // Limpiar event listeners si existen
        if (this.element) {
            this.element.removeEventListener('keydown', this.handleKeyDown);
        }
        
        // Llamar método de destrucción específico de la clase hija
        this.onDestroy();
        
        // Limpiar referencias
        this.element = null;
        this.focusableElements = null;
        this.isInitialized = false;
        this.isVisible = false;
        
        console.log(`[Screen:${this.screenId}] Pantalla destruida`);
    }
    
    /**
     * Método llamado durante la destrucción
     * Puede ser sobrescrito por las clases hijas
     * @protected
     */
    onDestroy() {
        // Implementar en clases hijas si es necesario
    }
}