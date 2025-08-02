/**
 * StateManager - Gestor de estados del juego
 * @module StateManager
 */

export class StateManager {
    /**
     * Crea una nueva instancia del StateManager
     * @param {EventBus} eventBus - Instancia del EventBus
     */
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.states = new Map();
        this.currentState = null;
        this.previousState = null;
        this.stateHistory = [];
        this.maxHistorySize = 10;
        this.transitionData = null;
        this.stateMetrics = new Map();
        this.transitionCount = 0;
        this.currentStateStartTime = 0;
        this.isTransitioning = false;
        
        this.setupEventListeners();
    }

    /**
     * Configurar listeners de eventos
     * @private
     */
    setupEventListeners() {
        this.eventBus.on('state:request-change', this.requestStateChange, this);
        this.eventBus.on('state:force-change', this.forceStateChange, this);
    }

    /**
     * Registrar un estado
     * @param {string} name - Nombre del estado
     * @param {Object} stateConfig - Configuración del estado
     */
    registerState(name, stateConfig) {
        // Validar configuración del estado
        if (!this.validateStateConfig(stateConfig)) {
            console.error(`[StateManager] Configuración inválida para estado: ${name}`);
            return false;
        }

        const state = {
            name,
            onEnter: stateConfig.onEnter || (() => {}),
            onExit: stateConfig.onExit || (() => {}),
            onUpdate: stateConfig.onUpdate || (() => {}),
            allowedTransitions: stateConfig.allowedTransitions || [],
            data: stateConfig.data || {},
            timeout: stateConfig.timeout || null,
            canPause: stateConfig.canPause !== false,
            persistent: stateConfig.persistent || false
        };

        this.states.set(name, state);
        
        // Inicializar métricas del estado
        this.stateMetrics.set(name, {
            enterCount: 0,
            totalTime: 0,
            averageTime: 0,
            lastEnterTime: 0,
            lastExitTime: 0
        });

        console.log(`[StateManager] Estado registrado: ${name}`);
        this.eventBus.emit('state:registered', { name, state });
        return true;
    }

    /**
     * Validar configuración del estado
     * @param {Object} config - Configuración a validar
     * @returns {boolean} True si es válida
     * @private
     */
    validateStateConfig(config) {
        if (!config || typeof config !== 'object') {
            return false;
        }

        // Validar que las funciones sean funciones
        const functionProps = ['onEnter', 'onExit', 'onUpdate'];
        for (const prop of functionProps) {
            if (config[prop] && typeof config[prop] !== 'function') {
                console.error(`[StateManager] ${prop} debe ser una función`);
                return false;
            }
        }

        // Validar allowedTransitions
        if (config.allowedTransitions && !Array.isArray(config.allowedTransitions)) {
            console.error(`[StateManager] allowedTransitions debe ser un array`);
            return false;
        }

        return true;
    }

    /**
     * Desregistrar un estado
     * @param {string} name - Nombre del estado
     */
    unregisterState(name) {
        if (!this.states.has(name)) {
            console.warn(`[StateManager] Estado ${name} no está registrado`);
            return;
        }

        // No permitir desregistrar el estado actual
        if (this.currentState === name) {
            console.warn(`[StateManager] No se puede desregistrar el estado actual: ${name}`);
            return;
        }

        this.states.delete(name);
        console.log(`[StateManager] Estado desregistrado: ${name}`);
        
        this.eventBus.emit('state:unregistered', { name });
    }

    /**
     * Cambiar al estado especificado
     * @param {string} stateName - Nombre del estado destino
     * @param {Object} data - Datos para la transición
     * @returns {boolean} True si el cambio fue exitoso
     */
    changeState(stateName, data = {}) {
        if (this.isTransitioning) {
            console.warn(`[StateManager] Transición en progreso, ignorando cambio a: ${stateName}`);
            return false;
        }

        if (!this.states.has(stateName)) {
            console.error(`[StateManager] Estado no encontrado: ${stateName}`);
            return false;
        }

        // Verificar si la transición está permitida
        if (this.currentState && !this.isTransitionAllowed(this.currentState, stateName)) {
            console.warn(`[StateManager] Transición no permitida: ${this.currentState} -> ${stateName}`);
            this.eventBus.emit('state:transition-denied', {
                from: this.currentState,
                to: stateName,
                reason: 'transition_not_allowed'
            });
            return false;
        }

        const previousState = this.currentState;
        const targetState = this.states.get(stateName);
        const transitionStartTime = performance.now();

        this.isTransitioning = true;

        try {
            // Salir del estado actual
            if (this.currentState) {
                const currentStateObj = this.states.get(this.currentState);
                const currentMetrics = this.stateMetrics.get(this.currentState);
                
                // Actualizar métricas del estado saliente
                if (currentMetrics && this.currentStateStartTime > 0) {
                    const stateTime = transitionStartTime - this.currentStateStartTime;
                    currentMetrics.totalTime += stateTime;
                    currentMetrics.averageTime = currentMetrics.totalTime / currentMetrics.enterCount;
                    currentMetrics.lastExitTime = transitionStartTime;
                }

                currentStateObj.onExit(data);
                this.eventBus.emit('state:exit', {
                    state: this.currentState,
                    data,
                    duration: transitionStartTime - this.currentStateStartTime
                });
            }

            // Actualizar estado
            this.previousState = this.currentState;
            this.currentState = stateName;
            this.transitionData = data;
            this.currentStateStartTime = performance.now();
            this.transitionCount++;

            // Actualizar métricas del nuevo estado
            const newStateMetrics = this.stateMetrics.get(stateName);
            if (newStateMetrics) {
                newStateMetrics.enterCount++;
                newStateMetrics.lastEnterTime = this.currentStateStartTime;
            }

            // Agregar a historial
            this.addToHistory(previousState, stateName, data);

            // Entrar al nuevo estado
            targetState.onEnter(data);
            this.eventBus.emit('state:enter', {
                state: stateName,
                previousState,
                data
            });

            // Emitir evento de cambio
            this.eventBus.emit('state:change', {
                from: previousState,
                to: stateName,
                data,
                transitionTime: performance.now() - transitionStartTime
            });

            console.log(`[StateManager] Cambio de estado: ${previousState || 'null'} -> ${stateName}`);
            
            this.isTransitioning = false;
            return true;

        } catch (error) {
            console.error(`[StateManager] Error en cambio de estado:`, error);
            this.eventBus.emit('state:error', {
                from: previousState,
                to: stateName,
                error,
                data
            });
            
            this.isTransitioning = false;
            return false;
        }
    }

    /**
     * Solicitar cambio de estado (con validación)
     * @param {Object} requestData - {state, data}
     */
    requestStateChange(requestData) {
        const { state, data } = requestData;
        this.changeState(state, data);
    }

    /**
     * Forzar cambio de estado (sin validación de transiciones)
     * @param {Object} requestData - {state, data}
     */
    forceStateChange(requestData) {
        const { state, data } = requestData;
        
        if (!this.states.has(state)) {
            console.error(`[StateManager] Estado no encontrado para forzar: ${state}`);
            return;
        }

        // Temporalmente permitir todas las transiciones
        const targetState = this.states.get(state);
        const originalTransitions = targetState.allowedTransitions;
        targetState.allowedTransitions = ['*']; // Permitir desde cualquier estado

        const success = this.changeState(state, data);
        
        // Restaurar transiciones originales
        targetState.allowedTransitions = originalTransitions;

        if (success) {
            this.eventBus.emit('state:forced', {
                state,
                data
            });
        }
    }

    /**
     * Verificar si una transición está permitida
     * @param {string} fromState - Estado origen
     * @param {string} toState - Estado destino
     * @returns {boolean} True si la transición está permitida
     * @private
     */
    isTransitionAllowed(fromState, toState) {
        if (!this.states.has(toState)) {
            return false;
        }

        const targetState = this.states.get(toState);
        const allowedTransitions = targetState.allowedTransitions;

        // Si no hay restricciones o permite desde cualquier estado
        if (allowedTransitions.length === 0 || allowedTransitions.includes('*')) {
            return true;
        }

        // Verificar si la transición específica está permitida
        return allowedTransitions.includes(fromState);
    }

    /**
     * Agregar transición al historial
     * @param {string} from - Estado origen
     * @param {string} to - Estado destino
     * @param {Object} data - Datos de la transición
     * @private
     */
    addToHistory(from, to, data) {
        this.stateHistory.push({
            from,
            to,
            data,
            timestamp: Date.now()
        });

        // Mantener tamaño máximo del historial
        if (this.stateHistory.length > this.maxHistorySize) {
            this.stateHistory.shift();
        }
    }

    /**
     * Actualizar el estado actual
     * @param {number} deltaTime - Tiempo transcurrido
     */
    update(deltaTime) {
        if (this.currentState && this.states.has(this.currentState)) {
            const state = this.states.get(this.currentState);
            try {
                state.onUpdate(deltaTime, this.transitionData);
            } catch (error) {
                console.error(`[StateManager] Error actualizando estado ${this.currentState}:`, error);
                this.eventBus.emit('state:update-error', {
                    state: this.currentState,
                    error
                });
            }
        }
    }

    /**
     * Obtener el estado actual
     * @returns {string|null} Nombre del estado actual
     */
    getCurrentState() {
        return this.currentState;
    }

    /**
     * Obtener el estado anterior
     * @returns {string|null} Nombre del estado anterior
     */
    getPreviousState() {
        return this.previousState;
    }

    /**
     * Obtener datos de la transición actual
     * @returns {Object|null} Datos de la transición
     */
    getTransitionData() {
        return this.transitionData;
    }

    /**
     * Obtener el historial de estados
     * @returns {Array} Historial de transiciones
     */
    getHistory() {
        return [...this.stateHistory];
    }

    /**
     * Verificar si está en un estado específico
     * @param {string} stateName - Nombre del estado
     * @returns {boolean} True si está en el estado especificado
     */
    isInState(stateName) {
        return this.currentState === stateName;
    }

    /**
     * Obtener todos los estados registrados
     * @returns {Array} Lista de nombres de estados
     */
    getRegisteredStates() {
        return Array.from(this.states.keys());
    }

    /**
     * Obtener información de un estado
     * @param {string} stateName - Nombre del estado
     * @returns {Object|null} Información del estado
     */
    getStateInfo(stateName) {
        if (!this.states.has(stateName)) {
            return null;
        }

        const state = this.states.get(stateName);
        return {
            name: stateName,
            allowedTransitions: [...state.allowedTransitions],
            data: { ...state.data },
            isCurrent: this.currentState === stateName
        };
    }

    /**
     * Limpiar el historial de estados
     */
    clearHistory() {
        this.stateHistory = [];
        console.log('[StateManager] Historial limpiado');
    }

    /**
     * Obtener métricas de un estado
     * @param {string} stateName - Nombre del estado
     * @returns {Object|null} Métricas del estado
     */
    getStateMetrics(stateName) {
        return this.stateMetrics.get(stateName) || null;
    }

    /**
     * Obtener todas las métricas de estados
     * @returns {Object} Métricas de todos los estados
     */
    getAllMetrics() {
        const metrics = {};
        this.stateMetrics.forEach((data, name) => {
            metrics[name] = { ...data };
        });
        
        return {
            states: metrics,
            totalTransitions: this.transitionCount,
            currentState: this.currentState,
            currentStateDuration: this.currentStateStartTime > 0 ? 
                performance.now() - this.currentStateStartTime : 0,
            historySize: this.stateHistory.length,
            isTransitioning: this.isTransitioning
        };
    }

    /**
     * Resetear métricas de estados
     */
    resetMetrics() {
        this.stateMetrics.forEach((metrics) => {
            metrics.enterCount = 0;
            metrics.totalTime = 0;
            metrics.averageTime = 0;
            metrics.lastEnterTime = 0;
            metrics.lastExitTime = 0;
        });
        
        this.transitionCount = 0;
        console.log('[StateManager] Métricas reseteadas');
    }

    /**
     * Validar integridad del estado actual
     * @returns {boolean} True si el estado es válido
     */
    validateCurrentState() {
        if (!this.currentState) {
            return true; // Sin estado es válido
        }

        if (!this.states.has(this.currentState)) {
            console.error(`[StateManager] Estado actual inválido: ${this.currentState}`);
            return false;
        }

        return true;
    }

    /**
     * Obtener tiempo en el estado actual
     * @returns {number} Tiempo en milisegundos
     */
    getCurrentStateDuration() {
        if (!this.currentState || this.currentStateStartTime === 0) {
            return 0;
        }
        
        return performance.now() - this.currentStateStartTime;
    }

    /**
     * Verificar si se puede hacer una transición específica
     * @param {string} fromState - Estado origen
     * @param {string} toState - Estado destino
     * @returns {Object} Resultado de la validación
     */
    canTransition(fromState, toState) {
        if (!fromState || !toState) {
            return { 
                canTransition: false, 
                reason: 'Estados inválidos' 
            };
        }

        if (!this.states.has(fromState) || !this.states.has(toState)) {
            return { 
                canTransition: false, 
                reason: 'Estado no existe' 
            };
        }

        if (this.isTransitioning) {
            return { 
                canTransition: false, 
                reason: 'Transición en progreso' 
            };
        }

        if (!this.isTransitionAllowed(fromState, toState)) {
            return { 
                canTransition: false, 
                reason: 'Transición no permitida' 
            };
        }

        return { 
            canTransition: true, 
            reason: 'Transición válida' 
        };
    }

    /**
     * Limpiar todos los estados y datos
     */
    destroy() {
        // Salir del estado actual
        if (this.currentState) {
            const currentStateObj = this.states.get(this.currentState);
            try {
                currentStateObj.onExit({});
            } catch (error) {
                console.error('[StateManager] Error al salir del estado durante destrucción:', error);
            }
        }

        this.states.clear();
        this.stateMetrics.clear();
        this.stateHistory = [];
        this.currentState = null;
        this.previousState = null;
        this.transitionData = null;
        this.transitionCount = 0;
        this.currentStateStartTime = 0;
        this.isTransitioning = false;
        
        console.log('[StateManager] StateManager destruido');
    }
}