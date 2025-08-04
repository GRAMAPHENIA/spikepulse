/**
 * Gestor de estados para Spikepulse
 * @module StateManager
 */

export class StateManager {
    /**
     * Crea una nueva instancia del gestor de estados
     * @param {Object} config - Configuración de estados
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isInitialized = false;
        
        // Estados del juego
        this.currentState = null;
        this.previousState = null;
        this.stateHistory = [];
        
        // Configuración de estados
        this.states = new Map();
        this.transitions = config.transitions || {};
        this.initialState = config.initial || 'menu';
        
        // Estadísticas
        this.stats = {
            stateChanges: 0,
            timeInState: 0,
            stateStartTime: 0
        };
        
        console.log('🎯 StateManager creado');
    }
    
    /**
     * Inicializa el gestor de estados
     */
    async init() {
        try {
            console.log('🔧 Inicializando StateManager...');
            
            // Registrar estados por defecto
            this.registerDefaultStates();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ StateManager inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando StateManager:', error);
            throw error;
        }
    }
    
    /**
     * Registra estados por defecto
     */
    registerDefaultStates() {
        const defaultStates = [
            {
                name: 'menu',
                onEnter: () => console.log('📋 Entrando al menú'),
                onExit: () => console.log('📋 Saliendo del menú')
            },
            {
                name: 'playing',
                onEnter: () => console.log('🎮 Iniciando juego'),
                onExit: () => console.log('🎮 Pausando/terminando juego')
            },
            {
                name: 'paused',
                onEnter: () => console.log('⏸️ Juego pausado'),
                onExit: () => console.log('▶️ Reanudando juego')
            },
            {
                name: 'game-over',
                onEnter: () => console.log('💀 Game Over'),
                onExit: () => console.log('🔄 Saliendo de Game Over')
            },
            {
                name: 'loading',
                onEnter: () => console.log('⏳ Cargando...'),
                onExit: () => console.log('✅ Carga completada')
            }
        ];
        
        defaultStates.forEach(state => {
            this.registerState(state.name, state);
        });
    }
    
    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Eventos de cambio de estado
        this.eventBus.on('state:set', this.setState.bind(this));
        this.eventBus.on('state:back', this.goBack.bind(this));
        
        console.log('👂 Event listeners del StateManager configurados');
    }
    
    /**
     * Registra un nuevo estado
     * @param {string} name - Nombre del estado
     * @param {Object} stateConfig - Configuración del estado
     */
    registerState(name, stateConfig = {}) {
        const state = {
            name,
            onEnter: stateConfig.onEnter || (() => {}),
            onExit: stateConfig.onExit || (() => {}),
            onUpdate: stateConfig.onUpdate || (() => {}),
            data: stateConfig.data || {},
            ...stateConfig
        };
        
        this.states.set(name, state);
        console.log(`🎯 Estado registrado: ${name}`);
    }
    
    /**
     * Establece un nuevo estado
     * @param {string} newState - Nuevo estado
     * @param {Object} data - Datos adicionales
     * @returns {boolean} True si el cambio fue exitoso
     */
    setState(newState, data = {}) {
        // Verificar si el estado existe
        if (!this.states.has(newState)) {
            console.warn(`⚠️ Estado no encontrado: ${newState}`);
            return false;
        }
        
        // Verificar si la transición es válida
        if (this.currentState && !this.isValidTransition(this.currentState, newState)) {
            console.warn(`⚠️ Transición inválida: ${this.currentState} -> ${newState}`);
            return false;
        }
        
        // Salir del estado actual
        if (this.currentState) {
            const currentStateObj = this.states.get(this.currentState);
            if (currentStateObj && currentStateObj.onExit) {
                currentStateObj.onExit(data);
            }
            
            // Actualizar tiempo en estado
            this.stats.timeInState += Date.now() - this.stats.stateStartTime;
        }
        
        // Guardar estado anterior
        this.previousState = this.currentState;
        
        // Añadir al historial
        if (this.currentState) {
            this.stateHistory.push({
                state: this.currentState,
                timestamp: Date.now(),
                duration: Date.now() - this.stats.stateStartTime
            });
            
            // Limitar historial
            if (this.stateHistory.length > 50) {
                this.stateHistory.shift();
            }
        }
        
        // Cambiar al nuevo estado
        this.currentState = newState;
        this.stats.stateChanges++;
        this.stats.stateStartTime = Date.now();
        
        // Entrar al nuevo estado
        const newStateObj = this.states.get(newState);
        if (newStateObj && newStateObj.onEnter) {
            newStateObj.onEnter(data);
        }
        
        console.log(`🎯 Estado cambiado: ${this.previousState || 'null'} -> ${newState}`);
        
        // Emitir evento de cambio de estado
        this.eventBus.emit('game:state-changed', {
            state: newState,
            previousState: this.previousState,
            data
        });
        
        return true;
    }
    
    /**
     * Verifica si una transición es válida
     * @param {string} fromState - Estado origen
     * @param {string} toState - Estado destino
     * @returns {boolean} True si es válida
     */
    isValidTransition(fromState, toState) {
        if (!this.transitions[fromState]) {
            return true; // Si no hay restricciones, permitir
        }
        
        return this.transitions[fromState].includes(toState);
    }
    
    /**
     * Vuelve al estado anterior
     * @returns {boolean} True si fue exitoso
     */
    goBack() {
        if (!this.previousState) {
            console.warn('⚠️ No hay estado anterior');
            return false;
        }
        
        return this.setState(this.previousState);
    }
    
    /**
     * Obtiene el estado actual
     * @returns {string} Estado actual
     */
    getState() {
        return this.currentState;
    }
    
    /**
     * Obtiene el estado anterior
     * @returns {string} Estado anterior
     */
    getPreviousState() {
        return this.previousState;
    }
    
    /**
     * Verifica si está en un estado específico
     * @param {string} state - Estado a verificar
     * @returns {boolean} True si está en ese estado
     */
    isInState(state) {
        return this.currentState === state;
    }
    
    /**
     * Obtiene información de un estado
     * @param {string} stateName - Nombre del estado
     * @returns {Object|null} Información del estado
     */
    getStateInfo(stateName) {
        return this.states.get(stateName) || null;
    }
    
    /**
     * Obtiene todos los estados registrados
     * @returns {Array} Lista de estados
     */
    getRegisteredStates() {
        return Array.from(this.states.keys());
    }
    
    /**
     * Obtiene el historial de estados
     * @param {number} limit - Límite de entradas
     * @returns {Array} Historial de estados
     */
    getStateHistory(limit = 10) {
        return this.stateHistory.slice(-limit);
    }
    
    /**
     * Actualiza el estado actual
     * @param {number} deltaTime - Delta time
     */
    update(deltaTime) {
        if (!this.currentState) return;
        
        const currentStateObj = this.states.get(this.currentState);
        if (currentStateObj && currentStateObj.onUpdate) {
            currentStateObj.onUpdate(deltaTime);
        }
    }
    
    /**
     * Obtiene estadísticas del gestor
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            ...this.stats,
            currentState: this.currentState,
            previousState: this.previousState,
            statesRegistered: this.states.size,
            historySize: this.stateHistory.length,
            currentStateTime: this.currentState ? Date.now() - this.stats.stateStartTime : 0
        };
    }
    
    /**
     * Obtiene información de debug
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            currentState: this.currentState,
            previousState: this.previousState,
            registeredStates: this.getRegisteredStates(),
            transitions: this.transitions,
            stats: this.getStats(),
            recentHistory: this.getStateHistory(5)
        };
    }
    
    /**
     * Resetea el gestor de estados
     */
    reset() {
        console.log('🔄 Reseteando StateManager...');
        
        // Resetear al estado inicial
        this.setState(this.initialState);
        
        // Limpiar historial
        this.stateHistory.length = 0;
        
        // Resetear estadísticas
        this.stats.stateChanges = 0;
        this.stats.timeInState = 0;
        this.stats.stateStartTime = Date.now();
        
        console.log('✅ StateManager reseteado');
    }
    
    /**
     * Destruye el gestor de estados
     */
    destroy() {
        console.log('🧹 Destruyendo StateManager...');
        
        // Salir del estado actual
        if (this.currentState) {
            const currentStateObj = this.states.get(this.currentState);
            if (currentStateObj && currentStateObj.onExit) {
                currentStateObj.onExit();
            }
        }
        
        // Remover event listeners
        this.eventBus.off('*', this);
        
        // Limpiar mapas
        this.states.clear();
        this.stateHistory.length = 0;
        
        // Limpiar referencias
        this.currentState = null;
        this.previousState = null;
        
        this.isInitialized = false;
        
        console.log('✅ StateManager destruido');
    }
}