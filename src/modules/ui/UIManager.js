/**
 * UIManager - Gestor principal de la interfaz de usuario
 * Maneja todas las pantallas, transiciones y elementos de UI
 * @module UIManager
 */

import { SPANISH_TEXT } from '../../config/SpanishText.js';
import { MenuScreen } from './screens/MenuScreen.js';
import { GameOverScreen } from './screens/GameOverScreen.js';
import { PauseScreen } from './screens/PauseScreen.js';

export class UIManager {
    /**
     * Crea una nueva instancia del UIManager
     * @param {Object} config - Configuración del UI
     * @param {EventBus} eventBus - Bus de eventos para comunicación
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.screens = new Map();
        this.currentScreen = null;
        this.previousScreen = null;
        this.isInitialized = false;
        
        // Referencias a elementos DOM
        this.elements = {
            canvas: null,
            hud: null,
            pauseContainer: null,
            mobileControls: null
        };
        
        console.log('[UIManager] Inicializando gestor de UI...');
        this.init();
    }
    
    /**
     * Inicializar el UIManager
     * @private
     */
    init() {
        try {
            // Obtener referencias a elementos DOM
            this.setupDOMReferences();
            
            // Inicializar pantallas
            this.initializeScreens();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Configurar accesibilidad
            this.setupAccessibility();
            
            // Configurar responsive design
            this.setupResponsiveDesign();
            
            this.isInitialized = true;
            console.log('[UIManager] Gestor de UI inicializado correctamente');
            
            // Mostrar pantalla inicial
            this.showScreen('menu');
            
        } catch (error) {
            console.error('[UIManager] Error durante la inicialización:', error);
            this.eventBus.emit('ui:error', { error, context: 'initialization' });
        }
    }
    
    /**
     * Configurar referencias a elementos DOM
     * @private
     */
    setupDOMReferences() {
        this.elements.canvas = document.getElementById('gameCanvas');
        this.elements.hud = document.getElementById('gameHUD');
        this.elements.pauseContainer = document.getElementById('pauseContainer');
        this.elements.mobileControls = document.getElementById('mobileControls');
        
        // Verificar que los elementos existan
        if (!this.elements.canvas) {
            throw new Error('Canvas del juego no encontrado');
        }
        
        console.log('[UIManager] Referencias DOM configuradas');
    }
    
    /**
     * Inicializar todas las pantallas
     * @private
     */
    initializeScreens() {
        // Crear instancias de pantallas
        this.screens.set('menu', new MenuScreen(this.config, this.eventBus));
        this.screens.set('gameOver', new GameOverScreen(this.config, this.eventBus));
        this.screens.set('pause', new PauseScreen(this.config, this.eventBus));
        
        console.log('[UIManager] Pantallas inicializadas:', Array.from(this.screens.keys()));
    }
    
    /**
     * Configurar event listeners
     * @private
     */
    setupEventListeners() {
        // Escuchar eventos de cambio de pantalla
        this.eventBus.on('ui:show-screen', (data) => {
            this.showScreen(data.screen, data.data);
        });
        
        this.eventBus.on('ui:hide-screen', (data) => {
            this.hideScreen(data.screen);
        });
        
        // Escuchar eventos específicos de pantallas
        this.eventBus.on('ui:show-menu', () => this.showScreen('menu'));
        this.eventBus.on('ui:hide-menu', () => this.hideScreen('menu'));
        this.eventBus.on('ui:show-game-over', (data) => this.showScreen('gameOver', data));
        this.eventBus.on('ui:hide-game-over', () => this.hideScreen('gameOver'));
        this.eventBus.on('ui:show-pause', () => this.showScreen('pause'));
        this.eventBus.on('ui:hide-pause', () => this.hideScreen('pause'));
        
        // Escuchar eventos de estado del juego
        this.eventBus.on('state:change', (data) => {
            this.handleStateChange(data);
        });
        
        // Escuchar eventos de juego para mostrar/ocultar elementos
        this.eventBus.on('game:start', () => this.showGameElements());
        this.eventBus.on('game:end', () => this.hideGameElements());
        
        // Escuchar cambios de tamaño de ventana
        window.addEventListener('resize', () => this.handleResize());
        
        console.log('[UIManager] Event listeners configurados');
    }
    
    /**
     * Configurar accesibilidad
     * @private
     */
    setupAccessibility() {
        // Configurar navegación por teclado
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
        
        // Configurar anuncios para lectores de pantalla
        this.setupScreenReaderSupport();
        
        console.log('[UIManager] Accesibilidad configurada');
    }
    
    /**
     * Configurar soporte para lectores de pantalla
     * @private
     */
    setupScreenReaderSupport() {
        // Escuchar eventos importantes para anunciar
        this.eventBus.on('ui:screen-changed', (data) => {
            this.announceScreenChange(data.screen);
        });
        
        this.eventBus.on('game:score-update', (data) => {
            this.announceScoreUpdate(data);
        });
    }
    
    /**
     * Configurar diseño responsive
     * @private
     */
    setupResponsiveDesign() {
        // Detectar dispositivo móvil
        this.isMobile = window.innerWidth <= 768;
        
        // Configurar controles móviles si es necesario
        if (this.isMobile && this.elements.mobileControls) {
            this.setupMobileControls();
        }
        
        console.log('[UIManager] Diseño responsive configurado, móvil:', this.isMobile);
    }
    
    /**
     * Configurar controles móviles
     * @private
     */
    setupMobileControls() {
        const mobileControls = this.elements.mobileControls;
        if (!mobileControls) return;
        
        // Configurar botones táctiles
        const buttons = mobileControls.querySelectorAll('.spikepulse-control-btn');
        buttons.forEach(button => {
            // Prevenir comportamientos por defecto
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
            }, { passive: false });
            
            // Mejorar feedback táctil
            button.addEventListener('touchstart', () => {
                button.classList.add('spikepulse-control-btn--active');
            });
            
            button.addEventListener('touchend', () => {
                button.classList.remove('spikepulse-control-btn--active');
            });
        });
        
        console.log('[UIManager] Controles móviles configurados');
    }
    
    /**
     * Mostrar una pantalla específica
     * @param {string} screenName - Nombre de la pantalla
     * @param {Object} data - Datos adicionales para la pantalla
     */
    showScreen(screenName, data = {}) {
        if (!this.isInitialized) {
            console.warn('[UIManager] Intento de mostrar pantalla antes de inicialización');
            return;
        }
        
        const screen = this.screens.get(screenName);
        if (!screen) {
            console.error(`[UIManager] Pantalla no encontrada: ${screenName}`);
            return;
        }
        
        try {
            // Ocultar pantalla actual si existe
            if (this.currentScreen && this.currentScreen !== screenName) {
                this.hideScreen(this.currentScreen);
            }
            
            // Guardar referencia de pantalla anterior
            this.previousScreen = this.currentScreen;
            this.currentScreen = screenName;
            
            // Mostrar la nueva pantalla
            screen.show(data);
            
            // Manejar elementos específicos según la pantalla
            this.handleScreenSpecificElements(screenName, true);
            
            // Emitir evento de cambio de pantalla
            this.eventBus.emit('ui:screen-changed', { 
                screen: screenName, 
                previous: this.previousScreen,
                data 
            });
            
            console.log(`[UIManager] Pantalla mostrada: ${screenName}`);
            
        } catch (error) {
            console.error(`[UIManager] Error al mostrar pantalla ${screenName}:`, error);
            this.eventBus.emit('ui:error', { error, context: `show-screen-${screenName}` });
        }
    }
    
    /**
     * Ocultar una pantalla específica
     * @param {string} screenName - Nombre de la pantalla
     */
    hideScreen(screenName) {
        const screen = this.screens.get(screenName);
        if (!screen) {
            console.warn(`[UIManager] Intento de ocultar pantalla inexistente: ${screenName}`);
            return;
        }
        
        try {
            // Ocultar la pantalla
            screen.hide();
            
            // Manejar elementos específicos según la pantalla
            this.handleScreenSpecificElements(screenName, false);
            
            // Actualizar pantalla actual si era la que se ocultó
            if (this.currentScreen === screenName) {
                this.currentScreen = null;
            }
            
            console.log(`[UIManager] Pantalla ocultada: ${screenName}`);
            
        } catch (error) {
            console.error(`[UIManager] Error al ocultar pantalla ${screenName}:`, error);
            this.eventBus.emit('ui:error', { error, context: `hide-screen-${screenName}` });
        }
    }
    
    /**
     * Manejar elementos específicos de cada pantalla
     * @param {string} screenName - Nombre de la pantalla
     * @param {boolean} show - Si mostrar u ocultar elementos
     * @private
     */
    handleScreenSpecificElements(screenName, show) {
        switch (screenName) {
            case 'menu':
                // En el menú, ocultar elementos del juego
                if (show) {
                    this.hideGameElements();
                }
                break;
                
            case 'gameOver':
                // En game over, mantener algunos elementos visibles
                if (show) {
                    this.hideGameElements();
                }
                break;
                
            case 'pause':
                // En pausa, mantener elementos del juego visibles pero inactivos
                break;
        }
    }
    
    /**
     * Mostrar elementos del juego (canvas, HUD, controles)
     */
    showGameElements() {
        if (this.elements.canvas) {
            this.elements.canvas.classList.remove('spikepulse-hidden');
        }
        
        if (this.elements.hud) {
            this.elements.hud.classList.remove('spikepulse-hidden');
        }
        
        if (this.elements.pauseContainer) {
            this.elements.pauseContainer.classList.remove('spikepulse-hidden');
        }
        
        if (this.isMobile && this.elements.mobileControls) {
            this.elements.mobileControls.classList.remove('spikepulse-hidden');
        }
        
        console.log('[UIManager] Elementos del juego mostrados');
    }
    
    /**
     * Ocultar elementos del juego
     */
    hideGameElements() {
        if (this.elements.canvas) {
            this.elements.canvas.classList.add('spikepulse-hidden');
        }
        
        if (this.elements.hud) {
            this.elements.hud.classList.add('spikepulse-hidden');
        }
        
        if (this.elements.pauseContainer) {
            this.elements.pauseContainer.classList.add('spikepulse-hidden');
        }
        
        if (this.elements.mobileControls) {
            this.elements.mobileControls.classList.add('spikepulse-hidden');
        }
        
        console.log('[UIManager] Elementos del juego ocultados');
    }
    
    /**
     * Manejar cambios de estado del juego
     * @param {Object} data - Datos del cambio de estado
     * @private
     */
    handleStateChange(data) {
        const { from, to } = data;
        console.log(`[UIManager] Manejando cambio de estado: ${from} -> ${to}`);
        
        switch (to) {
            case 'menu':
                this.showScreen('menu');
                break;
                
            case 'playing':
                // Ocultar todas las pantallas y mostrar elementos del juego
                this.hideAllScreens();
                this.showGameElements();
                break;
                
            case 'paused':
                this.showScreen('pause');
                break;
                
            case 'gameOver':
                this.showScreen('gameOver', data.gameData);
                break;
        }
    }
    
    /**
     * Ocultar todas las pantallas
     * @private
     */
    hideAllScreens() {
        this.screens.forEach((screen, name) => {
            this.hideScreen(name);
        });
    }
    
    /**
     * Manejar navegación por teclado
     * @param {KeyboardEvent} e - Evento de teclado
     * @private
     */
    handleKeyboardNavigation(e) {
        // Escape para pausar/volver
        if (e.code === 'Escape') {
            if (this.currentScreen === 'pause') {
                this.eventBus.emit('game:resume');
            } else if (!this.currentScreen || this.currentScreen === null) {
                this.eventBus.emit('game:pause');
            }
        }
        
        // Enter/Space para confirmar en menús
        if ((e.code === 'Enter' || e.code === 'Space') && this.currentScreen) {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.tagName === 'BUTTON') {
                e.preventDefault();
                activeElement.click();
            }
        }
        
        // Tab para navegación
        if (e.code === 'Tab' && this.currentScreen) {
            // La navegación por Tab se maneja automáticamente por el navegador
            // pero podemos agregar lógica adicional aquí si es necesario
        }
    }
    
    /**
     * Manejar cambio de tamaño de ventana
     * @private
     */
    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        
        // Si cambió el estado móvil/desktop
        if (wasMobile !== this.isMobile) {
            console.log(`[UIManager] Cambio de dispositivo: móvil=${this.isMobile}`);
            
            // Reconfigurar controles móviles
            if (this.isMobile) {
                this.setupMobileControls();
            }
            
            // Actualizar visibilidad de controles móviles
            if (this.elements.mobileControls) {
                if (this.isMobile && !this.currentScreen) {
                    this.elements.mobileControls.classList.remove('spikepulse-hidden');
                } else if (!this.isMobile) {
                    this.elements.mobileControls.classList.add('spikepulse-hidden');
                }
            }
        }
        
        // Notificar a las pantallas del cambio de tamaño
        this.screens.forEach(screen => {
            if (screen.handleResize) {
                screen.handleResize();
            }
        });
    }
    
    /**
     * Anunciar cambio de pantalla a lectores de pantalla
     * @param {string} screenName - Nombre de la pantalla
     * @private
     */
    announceScreenChange(screenName) {
        let message = '';
        
        switch (screenName) {
            case 'menu':
                message = SPANISH_TEXT.MENU_AREA_LABEL;
                break;
            case 'gameOver':
                message = SPANISH_TEXT.GAME_OVER;
                break;
            case 'pause':
                message = SPANISH_TEXT.GAME_PAUSED;
                break;
        }
        
        if (message) {
            this.announceToScreenReader(message);
        }
    }
    
    /**
     * Anunciar actualización de puntuación
     * @param {Object} data - Datos de la puntuación
     * @private
     */
    announceScoreUpdate(data) {
        if (data.distance && data.distance % 100 === 0) {
            const message = `${SPANISH_TEXT.DISTANCE}: ${data.distance} ${SPANISH_TEXT.METERS}`;
            this.announceToScreenReader(message, 'polite');
        }
    }
    
    /**
     * Anunciar mensaje a lectores de pantalla
     * @param {string} message - Mensaje a anunciar
     * @param {string} priority - Prioridad del anuncio
     * @private
     */
    announceToScreenReader(message, priority = 'polite') {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            if (document.body.contains(announcement)) {
                document.body.removeChild(announcement);
            }
        }, 1000);
    }
    
    /**
     * Obtener la pantalla actual
     * @returns {string|null} Nombre de la pantalla actual
     */
    getCurrentScreen() {
        return this.currentScreen;
    }
    
    /**
     * Obtener una pantalla específica
     * @param {string} screenName - Nombre de la pantalla
     * @returns {Object|null} Instancia de la pantalla
     */
    getScreen(screenName) {
        return this.screens.get(screenName) || null;
    }
    
    /**
     * Verificar si una pantalla está visible
     * @param {string} screenName - Nombre de la pantalla
     * @returns {boolean} Si la pantalla está visible
     */
    isScreenVisible(screenName) {
        const screen = this.screens.get(screenName);
        return screen ? screen.isVisible() : false;
    }
    
    /**
     * Obtener estadísticas del UIManager
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            isInitialized: this.isInitialized,
            currentScreen: this.currentScreen,
            previousScreen: this.previousScreen,
            screensCount: this.screens.size,
            isMobile: this.isMobile,
            screens: Array.from(this.screens.keys())
        };
    }
    
    /**
     * Destruir el UIManager y limpiar recursos
     */
    destroy() {
        // Destruir todas las pantallas
        this.screens.forEach(screen => {
            if (screen.destroy) {
                screen.destroy();
            }
        });
        this.screens.clear();
        
        // Limpiar event listeners
        window.removeEventListener('resize', this.handleResize);
        
        // Limpiar referencias
        this.elements = {};
        this.currentScreen = null;
        this.previousScreen = null;
        this.isInitialized = false;
        
        console.log('[UIManager] UIManager destruido');
    }
}