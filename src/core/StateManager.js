/**
 * Gestor de estados del juego Spikepulse
 * @module StateManager
 */

export class StateManager {
    /**
     * Crea una nueva instancia del gestor de estados
     * @param {EventBus} eventBus - Bus de eventos para comunicación
     */
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.currentState = 'menu';
        this.previousState = null;
        this.gameState = this.createInitialGameState();
        this.stateHistory = [];
        this.maxHistorySize = 10;
        
        this.setupEventListeners();
        console.log('🎯 StateManager creado');
    }
    
    /**
     * Crea el estado inicial del juego
     * @returns {Object} Estado inicial del juego
     */
    createInitialGameState() {
        return {
            // Estado del jugador
            player: {
                position: { x: 100, y: 300 },
                velocity: { x: 0, y: 0 },
                onGround: false,
                jumpsLeft: 2,
                dashAvailable: true,
                gravityInverted: false,
                isAlive: true
            },
            
            // Estado del mundo
            world: {
                camera: { x: 0, y: 0 },
                obstacles: [],
                coins: [],
                scrollOffset: 0,
                difficulty: 1.0
            },
            
            // Estadísticas del juego
            stats: {
                distance: 0,
                jumps: 0,
                dashes: 0,
                coins: 0,
                startTime: 0,
                playTime: 0,
                bestDistance: this.loadBestDistance()
            },
            
            // Estado de la interfaz
            ui: {
                currentScreen: 'menu',
                hudVisible: false,
                showDebug: false,
                isPaused: false
            },
            
            // Configuración del juego
            settings: {
                difficulty: 'normal',
                soundEnabled: true,
                musicEnabled: true,
                showFPS: false,
                language: 'es'
            }
        };
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Escuchar eventos de cambio de estado
        this.eventBus.on('ui:change-state', this.handleStateChangeRequest.bind(this));
        this.eventBus.on('game:player-died', this.handlePlayerDeath.bind(this));
        this.eventBus.on('game:restart', this.handleRestart.bind(this));
        this.eventBus.on('game:pause', this.handlePause.bind(this));
        this.eventBus.on('game:resume', this.handleResume.bind(this));
        
        console.log('👂 StateManager event listeners configurados');
    }
    
    /**
     * Cambia el estado del juego
     * @param {string} newState - Nuevo estado
     * @param {Object} data - Datos adicionales para el cambio de estado
     * @returns {boolean} True si el cambio fue exitoso
     */
    changeState(newState, data = {}) {
        const validTransitions = this.getValidTransitions();
        
        if (!validTransitions[this.currentState]?.includes(newState)) {
            console.warn(`❌ Transición de estado inválida: ${this.currentState} -> ${newState}`);
            return false;
        }
        
        // Guardar estado anterior
        this.addToHistory(this.currentState, { ...this.gameState });
        
        const oldState = this.currentState;
        this.previousState = this.currentState;
        this.currentState = newState;
        
        // Ejecutar lógica específica del estado
        this.executeStateTransition(oldState, newState, data);
        
        // Emitir evento de cambio de estado
        this.eventBus.emit('state:changed', {
            from: oldState,
            to: newState,
            data,
            gameState: this.gameState
        });
        
        console.log(`🔄 Estado cambiado: ${oldState} -> ${newState}`);
        return true;
    }
    
    /**
     * Obtiene las transiciones válidas para cada estado
     * @returns {Object} Mapa de transiciones válidas
     */
    getValidTransitions() {
        return {
            'menu': ['playing', 'settings', 'records'],
            'playing': ['paused', 'gameOver', 'menu'],
            'paused': ['playing', 'menu'],
            'gameOver': ['playing', 'menu', 'records'],
            'settings': ['menu'],
            'records': ['menu']
        };
    }
    
    /**
     * Ejecuta la lógica específica de transición de estado
     * @param {string} fromState - Estado anterior
     * @param {string} toState - Nuevo estado
     * @param {Object} data - Datos de la transición
     */
    executeStateTransition(fromState, toState, data) {
        switch (toState) {
            case 'playing':
                this.enterPlayingState(fromState, data);
                break;
                
            case 'paused':
                this.enterPausedState(fromState, data);
                break;
                
            case 'gameOver':
                this.enterGameOverState(fromState, data);
                break;
                
            case 'menu':
                this.enterMenuState(fromState, data);
                break;
                
            case 'settings':
                this.enterSettingsState(fromState, data);
                break;
                
            case 'records':
                this.enterRecordsState(fromState, data);
                break;
        }
    }
    
    /**
     * Lógica para entrar al estado de juego
     * @param {string} fromState - Estado anterior
     * @param {Object} data - Datos de la transición
     */
    enterPlayingState(fromState, data) {
        if (fromState === 'menu' || fromState === 'gameOver') {
            // Nuevo juego
            this.resetGameState();
            this.gameState.stats.startTime = Date.now();
        } else if (fromState === 'paused') {
            // Reanudar juego
            this.gameState.ui.isPaused = false;
        }
        
        this.gameState.ui.currentScreen = 'playing';
        this.gameState.ui.hudVisible = true;
    }
    
    /**
     * Lógica para entrar al estado de pausa
     * @param {string} fromState - Estado anterior
     * @param {Object} data - Datos de la transición
     */
    enterPausedState(fromState, data) {
        this.gameState.ui.isPaused = true;
        this.gameState.ui.currentScreen = 'paused';
    }
    
    /**
     * Lógica para entrar al estado de game over
     * @param {string} fromState - Estado anterior
     * @param {Object} data - Datos de la transición
     */
    enterGameOverState(fromState, data) {
        this.gameState.player.isAlive = false;
        this.gameState.ui.currentScreen = 'gameOver';
        this.gameState.ui.hudVisible = false;
        
        // Calcular tiempo de juego
        if (this.gameState.stats.startTime > 0) {
            this.gameState.stats.playTime = Date.now() - this.gameState.stats.startTime;
        }
        
        // Verificar si es un nuevo récord
        if (this.gameState.stats.distance > this.gameState.stats.bestDistance) {
            this.gameState.stats.bestDistance = this.gameState.stats.distance;
            this.saveBestDistance(this.gameState.stats.bestDistance);
            
            this.eventBus.emit('game:new-record', {
                distance: this.gameState.stats.distance,
                previousBest: this.gameState.stats.bestDistance
            });
        }
    }
    
    /**
     * Lógica para entrar al estado de menú
     * @param {string} fromState - Estado anterior
     * @param {Object} data - Datos de la transición
     */
    enterMenuState(fromState, data) {
        this.gameState.ui.currentScreen = 'menu';
        this.gameState.ui.hudVisible = false;
        this.gameState.ui.isPaused = false;
    }
    
    /**
     * Lógica para entrar al estado de configuración
     * @param {string} fromState - Estado anterior
     * @param {Object} data - Datos de la transición
     */
    enterSettingsState(fromState, data) {
        this.gameState.ui.currentScreen = 'settings';
    }
    
    /**
     * Lógica para entrar al estado de récords
     * @param {string} fromState - Estado anterior
     * @param {Object} data - Datos de la transición
     */
    enterRecordsState(fromState, data) {
        this.gameState.ui.currentScreen = 'records';
    }
    
    /**
     * Resetea el estado del juego a valores iniciales
     */
    resetGameState() {
        const newState = this.createInitialGameState();
        
        // Mantener configuraciones y mejor distancia
        newState.stats.bestDistance = this.gameState.stats.bestDistance;
        newState.settings = { ...this.gameState.settings };
        
        this.gameState = newState;
        
        console.log('🔄 Estado del juego reseteado');
    }
    
    /**
     * Actualiza las estadísticas del juego
     * @param {Object} updates - Actualizaciones a aplicar
     */
    updateStats(updates) {
        Object.assign(this.gameState.stats, updates);
        
        this.eventBus.emit('stats:updated', {
            stats: this.gameState.stats,
            updates
        });
    }
    
    /**
     * Actualiza el estado del jugador
     * @param {Object} updates - Actualizaciones a aplicar
     */
    updatePlayerState(updates) {
        Object.assign(this.gameState.player, updates);
        
        this.eventBus.emit('player:state-updated', {
            player: this.gameState.player,
            updates
        });
    }
    
    /**
     * Actualiza el estado del mundo
     * @param {Object} updates - Actualizaciones a aplicar
     */
    updateWorldState(updates) {
        Object.assign(this.gameState.world, updates);
        
        this.eventBus.emit('world:state-updated', {
            world: this.gameState.world,
            updates
        });
    }
    
    /**
     * Maneja solicitudes de cambio de estado
     * @param {Object} data - Datos de la solicitud
     */
    handleStateChangeRequest(data) {
        const { state, ...additionalData } = data;
        this.changeState(state, additionalData);
    }
    
    /**
     * Maneja la muerte del jugador
     * @param {Object} data - Datos del evento
     */
    handlePlayerDeath(data) {
        this.changeState('gameOver', data);
    }
    
    /**
     * Maneja el reinicio del juego
     * @param {Object} data - Datos del evento
     */
    handleRestart(data) {
        this.changeState('playing', data);
    }
    
    /**
     * Maneja la pausa del juego
     * @param {Object} data - Datos del evento
     */
    handlePause(data) {
        if (this.currentState === 'playing') {
            this.changeState('paused', data);
        }
    }
    
    /**
     * Maneja la reanudación del juego
     * @param {Object} data - Datos del evento
     */
    handleResume(data) {
        if (this.currentState === 'paused') {
            this.changeState('playing', data);
        }
    }
    
    /**
     * Añade un estado al historial
     * @param {string} state - Estado a añadir
     * @param {Object} gameState - Estado del juego
     */
    addToHistory(state, gameState) {
        this.stateHistory.push({
            state,
            gameState: JSON.parse(JSON.stringify(gameState)),
            timestamp: Date.now()
        });
        
        // Mantener tamaño máximo del historial
        if (this.stateHistory.length > this.maxHistorySize) {
            this.stateHistory.shift();
        }
    }
    
    /**
     * Carga la mejor distancia desde localStorage
     * @returns {number} Mejor distancia guardada
     */
    loadBestDistance() {
        try {
            const saved = localStorage.getItem('spikepulse_best_distance');
            return saved ? parseFloat(saved) : 0;
        } catch (error) {
            console.warn('⚠️ No se pudo cargar la mejor distancia:', error);
            return 0;
        }
    }
    
    /**
     * Guarda la mejor distancia en localStorage
     * @param {number} distance - Distancia a guardar
     */
    saveBestDistance(distance) {
        try {
            localStorage.setItem('spikepulse_best_distance', distance.toString());
        } catch (error) {
            console.warn('⚠️ No se pudo guardar la mejor distancia:', error);
        }
    }
    
    /**
     * Obtiene el estado actual del juego
     * @returns {Object} Estado actual del juego
     */
    getGameState() {
        return { ...this.gameState };
    }
    
    /**
     * Obtiene información del estado actual
     * @returns {Object} Información del estado
     */
    getStateInfo() {
        return {
            current: this.currentState,
            previous: this.previousState,
            validTransitions: this.getValidTransitions()[this.currentState] || [],
            gameState: this.getGameState()
        };
    }
}