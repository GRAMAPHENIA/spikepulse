/**
 * Gestor de interfaz de usuario
 * @module UIManager
 */

export class UIManager {
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.currentScreen = 'menu';
        this.isInitialized = false;
        
        console.log('🖥️ UIManager creado');
        this.init();
    }
    
    /**
     * Inicializa el gestor de UI
     */
    init() {
        try {
            this.setupEventListeners();
            this.setupScreenNavigation();
            this.isInitialized = true;
            console.log('✅ UIManager inicializado');
        } catch (error) {
            console.error('❌ Error inicializando UIManager:', error);
        }
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Escuchar cambios de estado del juego
        this.eventBus.on('state:changed', this.handleStateChange.bind(this));
        
        // Escuchar eventos de UI
        this.eventBus.on('ui:show-screen', this.showScreen.bind(this));
        this.eventBus.on('ui:hide-screen', this.hideScreen.bind(this));
    }
    
    /**
     * Configura la navegación entre pantallas
     */
    setupScreenNavigation() {
        // Botón de iniciar juego
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.eventBus.emit('ui:change-state', { state: 'playing' });
            });
        }
        
        // Botón de récords
        const recordsBtn = document.getElementById('records-btn');
        if (recordsBtn) {
            recordsBtn.addEventListener('click', () => {
                this.showScreen('records-screen');
            });
        }
        
        // Botón de configuración
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showScreen('settings-screen');
            });
        }
        
        // Botones de volver
        const backButtons = document.querySelectorAll('[id$="-back-btn"]');
        backButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.showScreen('menu-screen');
            });
        });
        
        // Botón de pausa
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.eventBus.emit('game:pause');
            });
        }
        
        // Botones de game over
        const playAgainBtn = document.getElementById('play-again-btn');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                this.eventBus.emit('ui:change-state', { state: 'playing' });
            });
        }
        
        const gameoverMenuBtn = document.getElementById('gameover-menu-btn');
        if (gameoverMenuBtn) {
            gameoverMenuBtn.addEventListener('click', () => {
                this.eventBus.emit('ui:change-state', { state: 'menu' });
            });
        }
        
        console.log('🔗 Navegación de pantallas configurada');
    }
    
    /**
     * Muestra una pantalla específica
     * @param {string} screenId - ID de la pantalla a mostrar
     */
    showScreen(screenId) {
        // Ocultar todas las pantallas
        const screens = document.querySelectorAll('.sp-screen');
        screens.forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Mostrar la pantalla solicitada
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
            this.currentScreen = screenId;
            
            console.log(`📺 Pantalla mostrada: ${screenId}`);
        } else {
            console.warn(`⚠️ Pantalla no encontrada: ${screenId}`);
        }
    }
    
    /**
     * Oculta una pantalla específica
     * @param {string} screenId - ID de la pantalla a ocultar
     */
    hideScreen(screenId) {
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('hidden');
        }
    }
    
    /**
     * Maneja cambios de estado del juego
     * @param {Object} data - Datos del cambio de estado
     */
    handleStateChange(data) {
        const { to } = data;
        
        switch (to) {
            case 'menu':
                this.showScreen('menu-screen');
                break;
            case 'playing':
                this.showScreen('playing-screen');
                break;
            case 'paused':
                this.showScreen('paused-screen');
                break;
            case 'gameOver':
                this.showScreen('gameover-screen');
                break;
            case 'settings':
                this.showScreen('settings-screen');
                break;
            case 'records':
                this.showScreen('records-screen');
                break;
        }
    }
    
    /**
     * Actualiza la UI
     * @param {number} deltaTime - Tiempo transcurrido
     */
    update(deltaTime) {
        if (!this.isInitialized) return;
        
        // Actualizar elementos de UI que necesiten animación
        // Por ahora no hay nada que actualizar
    }
    
    /**
     * Actualiza el HUD con estadísticas del juego
     * @param {Object} stats - Estadísticas del juego
     */
    updateHUD(stats) {
        // Actualizar distancia
        const distanceDisplay = document.getElementById('distance-display');
        if (distanceDisplay && stats.distance !== undefined) {
            distanceDisplay.textContent = `${Math.round(stats.distance)}m`;
        }
        
        // Actualizar saltos
        const jumpsDisplay = document.getElementById('jumps-display');
        if (jumpsDisplay && stats.jumpsLeft !== undefined) {
            jumpsDisplay.textContent = stats.jumpsLeft.toString();
        }
        
        // Actualizar dash
        const dashDisplay = document.getElementById('dash-display');
        if (dashDisplay && stats.dashAvailable !== undefined) {
            dashDisplay.textContent = stats.dashAvailable ? 'Disponible' : 'Recargando';
        }
        
        // Actualizar gravedad
        const gravityDisplay = document.getElementById('gravity-display');
        if (gravityDisplay && stats.gravityInverted !== undefined) {
            gravityDisplay.textContent = stats.gravityInverted ? 'Invertida' : 'Normal';
        }
    }
    
    /**
     * Muestra una notificación temporal
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de notificación (success, warning, danger)
     * @param {number} duration - Duración en ms
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `hud-notification hud-notification--${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remover después de la duración especificada
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, duration);
    }
    
    /**
     * Limpia recursos
     */
    destroy() {
        this.eventBus.off('*', this);
        this.isInitialized = false;
        console.log('🧹 UIManager destruido');
    }
}