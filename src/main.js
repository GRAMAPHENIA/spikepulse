/**
 * Spikepulse - Punto de entrada principal
 * Inicializa el motor del juego y todos los módulos
 */

import { GameEngine } from './core/GameEngine.js';
import { ConfigManager } from './core/ConfigManager.js';
import { getFullConfig, CONFIG_VALIDATORS, DEV_CONFIG_OVERRIDES, PROD_CONFIG_OVERRIDES } from './config/GameConfig.js';
import { SPANISH_TEXT } from './config/SpanishText.js';

/**
 * Clase principal de la aplicación Spikepulse
 */
class SpikepulseApp {
    constructor() {
        this.configManager = null;
        this.gameEngine = null;
        this.isInitialized = false;
        
        console.log('[Spikepulse] Inicializando aplicación...');
    }

    /**
     * Inicializar la aplicación
     */
    async init() {
        try {
            // Verificar soporte del navegador
            this.checkBrowserSupport();
            
            // Inicializar sistema de configuración
            this.setupConfiguration();
            
            // Configurar el canvas
            this.setupCanvas();
            
            // Inicializar el motor del juego
            this.gameEngine = new GameEngine(this.configManager.export());
            
            // Configurar listeners de eventos del juego
            this.setupGameEventListeners();
            
            // Configurar listeners de eventos globales
            this.setupGlobalEventListeners();
            
            // Configurar interfaz de usuario
            this.setupUI();
            
            // Marcar como inicializado
            this.isInitialized = true;
            
            console.log('[Spikepulse] Aplicación inicializada correctamente');
            
            // Inicializar UI
            this.initializeUI();
            
            // Iniciar el motor del juego
            console.log('[Spikepulse] Iniciando GameEngine...');
            this.gameEngine.start();
            
            // Emitir evento de inicialización completa
            this.gameEngine.eventBus.emit('app:initialized');
            
        } catch (error) {
            console.error('[Spikepulse] Error durante la inicialización:', error);
            this.showError(SPANISH_TEXT.LOADING_ERROR);
        }
    }

    /**
     * Configurar sistema de configuración
     * @private
     */
    setupConfiguration() {
        // Obtener configuración base
        let baseConfig = getFullConfig();
        
        // Aplicar overrides según el entorno
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' ||
                             window.location.search.includes('debug=true');
        
        if (isDevelopment) {
            baseConfig = { ...baseConfig, ...DEV_CONFIG_OVERRIDES };
            console.log('[Spikepulse] Modo desarrollo detectado');
        } else {
            baseConfig = { ...baseConfig, ...PROD_CONFIG_OVERRIDES };
        }

        // Crear ConfigManager
        this.configManager = new ConfigManager(baseConfig);
        
        // Registrar validadores
        Object.entries(CONFIG_VALIDATORS).forEach(([path, validator]) => {
            this.configManager.addValidator(path, validator);
        });

        // Configurar watchers importantes
        this.configManager.watch('debug.enabled', (enabled) => {
            console.log(`[Spikepulse] Modo debug ${enabled ? 'activado' : 'desactivado'}`);
        });

        this.configManager.watch('performance.targetFPS', (fps) => {
            console.log(`[Spikepulse] FPS objetivo cambiado a: ${fps}`);
            if (this.gameEngine) {
                this.gameEngine.targetFPS = fps;
                this.gameEngine.frameTime = 1000 / fps;
            }
        });

        console.log('[Spikepulse] Sistema de configuración inicializado');
    }

    /**
     * Inicializar la interfaz de usuario
     * @private
     */
    initializeUI() {
        console.log('[Spikepulse] Inicializando UI...');
        
        // Asegurar que la pantalla de menú esté visible
        this.showMenuScreen();
        
        // Asegurar que otras pantallas estén ocultas
        this.hideGameScreen();
        this.hideGameOverScreen();
        
        console.log('[Spikepulse] UI inicializada');
    }

    /**
     * Configurar listeners de eventos del juego
     * @private
     */
    setupGameEventListeners() {
        if (!this.gameEngine) return;

        const eventBus = this.gameEngine.eventBus;

        // Escuchar cambios de estado para actualizar UI
        eventBus.on('state:change', (data) => {
            const { from, to } = data;
            console.log(`[Spikepulse] Cambio de estado UI: ${from} -> ${to}`);
            this.handleStateChange(from, to);
        });

        // Escuchar eventos de UI específicos
        eventBus.on('ui:show-menu', () => this.showMenuScreen());
        eventBus.on('ui:hide-menu', () => this.hideMenuScreen());
        eventBus.on('ui:show-game', () => this.showGameScreen());
        eventBus.on('ui:show-pause', () => this.showPauseOverlay());
        eventBus.on('ui:hide-pause', () => this.hidePauseOverlay());
        eventBus.on('ui:show-game-over', () => this.showGameOverScreen());
        eventBus.on('ui:hide-game-over', () => this.hideGameOverScreen());

        console.log('[Spikepulse] Event listeners del juego configurados');
    }

    /**
     * Manejar cambios de estado del juego
     * @param {string} from - Estado anterior
     * @param {string} to - Nuevo estado
     * @private
     */
    handleStateChange(from, to) {
        switch (to) {
            case 'menu':
                this.showMenuScreen();
                this.hideGameScreen();
                this.hideGameOverScreen();
                break;
            case 'playing':
                this.hideMenuScreen();
                this.showGameScreen();
                this.hideGameOverScreen();
                this.hidePauseOverlay();
                break;
            case 'paused':
                this.showPauseOverlay();
                break;
            case 'gameOver':
                this.showGameOverScreen();
                this.hideGameScreen();
                break;
        }
    }

    /**
     * Mostrar pantalla de menú
     * @private
     */
    showMenuScreen() {
        console.log('[Spikepulse] Mostrando pantalla de menú');
        const menuScreen = document.getElementById('startScreen');
        if (menuScreen) {
            menuScreen.classList.remove('spikepulse-hidden');
            console.log('[Spikepulse] Pantalla de menú mostrada');
        } else {
            console.error('[Spikepulse] Pantalla de menú no encontrada');
        }
    }

    /**
     * Ocultar pantalla de menú
     * @private
     */
    hideMenuScreen() {
        console.log('[Spikepulse] Ocultando pantalla de menú');
        const menuScreen = document.getElementById('startScreen');
        if (menuScreen) {
            menuScreen.classList.add('spikepulse-hidden');
            console.log('[Spikepulse] Pantalla de menú ocultada');
        } else {
            console.error('[Spikepulse] Pantalla de menú no encontrada');
        }
    }

    /**
     * Mostrar pantalla de juego
     * @private
     */
    showGameScreen() {
        console.log('[Spikepulse] Mostrando pantalla de juego');
        const canvas = document.getElementById('gameCanvas');
        const hud = document.getElementById('gameHUD');
        const pauseContainer = document.getElementById('pauseContainer');
        const mobileControls = document.getElementById('mobileControls');

        if (canvas) {
            canvas.classList.remove('spikepulse-hidden');
            console.log('[Spikepulse] Canvas mostrado');
        }
        if (hud) {
            hud.classList.remove('spikepulse-hidden');
            console.log('[Spikepulse] HUD mostrado');
        }
        if (pauseContainer) {
            pauseContainer.classList.remove('spikepulse-hidden');
            console.log('[Spikepulse] Botón de pausa mostrado');
        }
        if (mobileControls && window.innerWidth <= 768) {
            mobileControls.classList.remove('spikepulse-hidden');
            console.log('[Spikepulse] Controles móviles mostrados');
        }
    }

    /**
     * Ocultar pantalla de juego
     * @private
     */
    hideGameScreen() {
        const canvas = document.getElementById('gameCanvas');
        const hud = document.getElementById('gameHUD');
        const pauseContainer = document.getElementById('pauseContainer');
        const mobileControls = document.getElementById('mobileControls');

        if (canvas) {
            canvas.classList.add('spikepulse-hidden');
        }
        if (hud) {
            hud.classList.add('spikepulse-hidden');
        }
        if (pauseContainer) {
            pauseContainer.classList.add('spikepulse-hidden');
        }
        if (mobileControls) {
            mobileControls.classList.add('spikepulse-hidden');
        }
    }

    /**
     * Mostrar overlay de pausa
     * @private
     */
    showPauseOverlay() {
        // Por ahora solo cambiar el texto del botón
        const pauseButton = document.getElementById('pauseBtn');
        if (pauseButton) {
            pauseButton.textContent = SPANISH_TEXT.RESUME_GAME;
        }
    }

    /**
     * Ocultar overlay de pausa
     * @private
     */
    hidePauseOverlay() {
        const pauseButton = document.getElementById('pauseBtn');
        if (pauseButton) {
            pauseButton.textContent = SPANISH_TEXT.PAUSE_GAME;
        }
    }

    /**
     * Mostrar pantalla de game over
     * @private
     */
    showGameOverScreen() {
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
            gameOverScreen.classList.remove('spikepulse-hidden');
        }
    }

    /**
     * Ocultar pantalla de game over
     * @private
     */
    hideGameOverScreen() {
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
            gameOverScreen.classList.add('spikepulse-hidden');
        }
    }

    /**
     * Verificar soporte del navegador
     * @private
     */
    checkBrowserSupport() {
        // Verificar soporte de canvas
        const canvas = document.createElement('canvas');
        if (!canvas.getContext) {
            throw new Error('Canvas no soportado');
        }

        // Verificar soporte de ES6 modules
        if (typeof Symbol === 'undefined') {
            throw new Error('ES6 no soportado');
        }

        // Verificar APIs necesarias
        if (!window.requestAnimationFrame) {
            throw new Error('requestAnimationFrame no soportado');
        }

        console.log('[Spikepulse] Verificación de soporte del navegador completada');
    }

    /**
     * Configurar el canvas del juego
     * @private
     */
    setupCanvas() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            throw new Error('Canvas del juego no encontrado');
        }

        // Configurar dimensiones desde configuración
        const canvasWidth = this.configManager.get('canvas.width');
        const canvasHeight = this.configManager.get('canvas.height');
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Configurar contexto
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Contexto 2D no disponible');
        }

        // Configurar propiedades del contexto
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Hacer el canvas responsive
        this.makeCanvasResponsive(canvas);

        console.log('[Spikepulse] Canvas configurado correctamente');
    }

    /**
     * Hacer el canvas responsive
     * @param {HTMLCanvasElement} canvas - Elemento canvas
     * @private
     */
    makeCanvasResponsive(canvas) {
        const resizeCanvas = () => {
            const canvasWidth = this.configManager.get('canvas.width');
            const canvasHeight = this.configManager.get('canvas.height');
            
            const containerWidth = Math.min(window.innerWidth - 40, canvasWidth);
            const containerHeight = Math.min(window.innerHeight - 100, canvasHeight);
            
            // Mantener aspect ratio
            const aspectRatio = canvasWidth / canvasHeight;
            let newWidth = containerWidth;
            let newHeight = containerWidth / aspectRatio;
            
            if (newHeight > containerHeight) {
                newHeight = containerHeight;
                newWidth = containerHeight * aspectRatio;
            }
            
            canvas.style.width = newWidth + 'px';
            canvas.style.height = newHeight + 'px';
            canvas.style.display = 'block';
            canvas.style.margin = '0 auto';
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
    }



    /**
     * Anunciar cambio de estado a lectores de pantalla
     * @param {string} state - Nuevo estado
     * @private
     */
    announceStateChange(state) {
        let message = '';
        
        switch (state) {
            case 'menu':
                message = 'Menú principal';
                break;
            case 'playing':
                message = SPANISH_TEXT.GAME_STARTED;
                break;
            case 'paused':
                message = SPANISH_TEXT.GAME_PAUSED;
                break;
            case 'gameOver':
                message = SPANISH_TEXT.GAME_OVER;
                break;
        }
        
        if (message) {
            this.announceToScreenReader(message);
        }
    }

    /**
     * Configurar listeners de eventos globales
     * @private
     */
    setupGlobalEventListeners() {
        // Prevenir comportamientos por defecto en móvil
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        // Manejar visibilidad de la página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.gameEngine) {
                this.gameEngine.eventBus.emit('app:visibility-hidden');
            } else if (!document.hidden && this.gameEngine) {
                this.gameEngine.eventBus.emit('app:visibility-visible');
            }
        });

        // Manejar errores globales
        window.addEventListener('error', (event) => {
            console.error('[Spikepulse] Error global:', event.error);
            if (this.gameEngine) {
                this.gameEngine.eventBus.emit('app:error', {
                    error: event.error,
                    context: 'global'
                });
            }
        });

        // Manejar promesas rechazadas
        window.addEventListener('unhandledrejection', (event) => {
            console.error('[Spikepulse] Promesa rechazada:', event.reason);
            if (this.gameEngine) {
                this.gameEngine.eventBus.emit('app:error', {
                    error: event.reason,
                    context: 'promise'
                });
            }
        });

        console.log('[Spikepulse] Listeners de eventos globales configurados');
    }

    /**
     * Configurar la interfaz de usuario
     * @private
     */
    setupUI() {
        // Actualizar textos con la configuración de idioma
        this.updateUITexts();
        
        // Configurar botones principales
        this.setupMainButtons();
        
        // Configurar accesibilidad
        this.setupAccessibility();

        console.log('[Spikepulse] Interfaz de usuario configurada');
    }

    /**
     * Actualizar textos de la interfaz
     * @private
     */
    updateUITexts() {
        // Actualizar título si es necesario
        const titleElement = document.querySelector('h1');
        if (titleElement && titleElement.textContent !== SPANISH_TEXT.GAME_TITLE) {
            titleElement.textContent = SPANISH_TEXT.GAME_TITLE;
        }

        // Actualizar descripción
        const descriptionElement = document.querySelector('.spikepulse-screen-description');
        if (descriptionElement) {
            descriptionElement.textContent = SPANISH_TEXT.GAME_DESCRIPTION;
        }

        // Actualizar botones
        const startButton = document.getElementById('startBtn');
        if (startButton) {
            startButton.textContent = SPANISH_TEXT.START_GAME;
        }

        const restartButton = document.getElementById('restartBtn');
        if (restartButton) {
            restartButton.textContent = SPANISH_TEXT.RESTART_GAME;
        }

        const pauseButton = document.getElementById('pauseBtn');
        if (pauseButton) {
            pauseButton.textContent = SPANISH_TEXT.PAUSE_GAME;
        }
    }

    /**
     * Configurar botones principales
     * @private
     */
    setupMainButtons() {
        // Botón de inicio
        const startButton = document.getElementById('startBtn');
        if (startButton) {
            startButton.addEventListener('click', () => {
                console.log('[Spikepulse] Botón inicio presionado');
                // Cambiar directamente las pantallas por ahora
                this.hideMenuScreen();
                this.showGameScreen();
                
                // También intentar cambiar el estado del motor si está disponible
                if (this.gameEngine) {
                    console.log('[Spikepulse] GameEngine disponible, cambiando a estado playing');
                    this.gameEngine.stateManager.changeState('playing');
                } else {
                    console.error('[Spikepulse] GameEngine no disponible');
                }
            });
        } else {
            console.error('[Spikepulse] Botón de inicio no encontrado');
        }

        // Botón de reinicio
        const restartButton = document.getElementById('restartBtn');
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                console.log('[Spikepulse] Botón reinicio presionado');
                // Cambiar directamente las pantallas
                this.hideGameOverScreen();
                this.showGameScreen();
                
                // También intentar cambiar el estado del motor si está disponible
                if (this.gameEngine) {
                    this.gameEngine.stateManager.changeState('playing');
                }
            });
        }

        // Botón de pausa
        const pauseButton = document.getElementById('pauseBtn');
        if (pauseButton) {
            pauseButton.addEventListener('click', () => {
                console.log('[Spikepulse] Botón pausa presionado');
                
                // Lógica simple de pausa por ahora
                const pauseText = pauseButton.textContent;
                if (pauseText === 'PAUSA') {
                    pauseButton.textContent = 'REANUDAR';
                    this.showPauseOverlay();
                } else {
                    pauseButton.textContent = 'PAUSA';
                    this.hidePauseOverlay();
                }
                
                // También intentar cambiar el estado del motor si está disponible
                if (this.gameEngine) {
                    const currentState = this.gameEngine.stateManager.getCurrentState();
                    if (currentState === 'playing') {
                        this.gameEngine.stateManager.changeState('paused');
                    } else if (currentState === 'paused') {
                        this.gameEngine.stateManager.changeState('playing');
                    }
                }
            });
        }
    }

    /**
     * Configurar accesibilidad
     * @private
     */
    setupAccessibility() {
        // Configurar navegación por teclado
        document.addEventListener('keydown', (e) => {
            // Escape para pausar
            if (e.code === 'Escape' && this.gameEngine) {
                this.gameEngine.eventBus.emit('ui:toggle-pause');
            }
            
            // Enter para confirmar en menús
            if (e.code === 'Enter' || e.code === 'Space') {
                const activeElement = document.activeElement;
                if (activeElement && activeElement.tagName === 'BUTTON') {
                    e.preventDefault();
                    activeElement.click();
                }
            }
        });

        // Configurar ARIA labels
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.setAttribute('aria-label', SPANISH_TEXT.CANVAS_ALT);
            canvas.setAttribute('role', 'img');
        }

        // Configurar anuncios para lectores de pantalla
        this.setupScreenReaderAnnouncements();
    }

    /**
     * Configurar anuncios para lectores de pantalla
     * @private
     */
    setupScreenReaderAnnouncements() {
        if (!this.gameEngine) return;

        // Anunciar cambios de estado del juego
        this.gameEngine.eventBus.on('state:change', (data) => {
            const { to } = data;
            let message = '';
            
            switch (to) {
                case 'playing':
                    message = SPANISH_TEXT.GAME_STARTED;
                    break;
                case 'paused':
                    message = SPANISH_TEXT.GAME_PAUSED;
                    break;
                case 'gameOver':
                    message = SPANISH_TEXT.GAME_OVER;
                    break;
            }
            
            if (message) {
                this.announceToScreenReader(message);
            }
        });
    }

    /**
     * Anunciar mensaje a lectores de pantalla
     * @param {string} message - Mensaje a anunciar
     * @param {string} priority - Prioridad del anuncio ('polite' o 'assertive')
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
     * Mostrar error al usuario
     * @param {string} message - Mensaje de error
     * @private
     */
    showError(message) {
        // Crear elemento de error
        const errorElement = document.createElement('div');
        errorElement.className = 'spikepulse-error-message';
        errorElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--sp-danger);
            color: white;
            padding: var(--sp-space-lg);
            border-radius: var(--sp-radius-lg);
            font-family: var(--sp-font-secondary);
            font-size: var(--sp-text-lg);
            text-align: center;
            z-index: 9999;
            max-width: 400px;
            box-shadow: var(--sp-shadow-xl);
        `;
        errorElement.textContent = message;
        
        document.body.appendChild(errorElement);
        
        // Remover después de 5 segundos
        setTimeout(() => {
            if (document.body.contains(errorElement)) {
                document.body.removeChild(errorElement);
            }
        }, 5000);
        
        // Anunciar error a lectores de pantalla
        this.announceToScreenReader(message, 'assertive');
    }

    /**
     * Obtener estadísticas de la aplicación
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            isInitialized: this.isInitialized,
            configManager: this.configManager ? this.configManager.getStats() : null,
            gameEngine: this.gameEngine ? this.gameEngine.getStats() : null
        };
    }

    /**
     * Destruir la aplicación y limpiar recursos
     */
    destroy() {
        if (this.gameEngine) {
            this.gameEngine.destroy();
            this.gameEngine = null;
        }
        
        if (this.configManager) {
            this.configManager.destroy();
            this.configManager = null;
        }
        
        this.isInitialized = false;
        console.log('[Spikepulse] Aplicación destruida');
    }
}

/**
 * Inicializar la aplicación cuando el DOM esté listo
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Spikepulse] DOM cargado, inicializando aplicación...');
    
    try {
        // Crear instancia de la aplicación
        window.spikepulseApp = new SpikepulseApp();
        
        // Inicializar
        await window.spikepulseApp.init();
        
        console.log('[Spikepulse] Aplicación lista para usar');
        
    } catch (error) {
        console.error('[Spikepulse] Error fatal durante la inicialización:', error);
        
        // Mostrar mensaje de error al usuario
        const errorMessage = document.createElement('div');
        errorMessage.textContent = SPANISH_TEXT.LOADING_ERROR;
        errorMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #E53E3E;
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            text-align: center;
            z-index: 9999;
        `;
        document.body.appendChild(errorMessage);
    }
});

// Exportar para uso en desarrollo/debugging
export { SpikepulseApp };