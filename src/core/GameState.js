/**
 * Gestión de estado centralizada para Spikepulse
 * @module GameState
 */

export class GameState {
    /**
     * Crea una nueva instancia del estado del juego
     * @param {EventBus} eventBus - Bus de eventos
     * @param {Object} config - Configuración del juego
     */
    constructor(eventBus, config = {}) {
        this.eventBus = eventBus;
        this.config = config;
        this.isInitialized = false;
        
        // Clave para localStorage
        this.storageKey = 'spikepulse-game-state';
        
        // Estado del juego
        this.state = this.createInitialState();
        
        // Validadores de transición
        this.validators = new Map();
        
        // Historial de cambios para debugging
        this.changeHistory = [];
        
        // Configuración de persistencia
        this.persistenceConfig = {
            enabled: config.persistence?.enabled ?? true,
            autoSave: config.persistence?.autoSave ?? true,
            saveInterval: config.persistence?.saveInterval ?? 5000, // 5 segundos
            maxHistorySize: config.persistence?.maxHistorySize ?? 100
        };
        
        // Timer para auto-guardado
        this.autoSaveTimer = null;
        
        console.log('🗃️ GameState creado');
    }
    
    /**
     * Inicializa el sistema de estado
     */
    async init() {
        try {
            console.log('🔧 Inicializando GameState...');
            
            // Cargar estado persistido si existe
            await this.loadPersistedState();
            
            // Configurar validadores por defecto
            this.setupDefaultValidators();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Iniciar auto-guardado si está habilitado
            if (this.persistenceConfig.autoSave) {
                this.startAutoSave();
            }
            
            this.isInitialized = true;
            console.log('✅ GameState inicializado');
            
            // Emitir evento de inicialización
            this.eventBus.emit('gamestate:initialized', {
                state: this.getState(),
                hasPersistentData: this.hasPersistentData()
            });
            
        } catch (error) {
            console.error('❌ Error inicializando GameState:', error);
            throw error;
        }
    }
    
    /**
     * Crea el estado inicial del juego
     * @returns {Object} Estado inicial
     */
    createInitialState() {
        return {
            // Estado del jugador
            player: {
                position: { x: 100, y: 300 },
                velocity: { x: 0, y: 0 },
                onGround: false,
                jumpsLeft: 2,
                maxJumps: 2,
                dashAvailable: true,
                dashCooldown: 0,
                gravityInverted: false,
                isAlive: true,
                invulnerable: false,
                invulnerabilityTime: 0
            },
            
            // Estado del mundo
            world: {
                camera: { x: 0, y: 0 },
                obstacles: [],
                coins: [],
                powerups: [],
                scrollOffset: 0,
                worldSpeed: 2,
                difficulty: 1,
                backgroundOffset: 0
            },
            
            // Estadísticas del juego
            stats: {
                distance: 0,
                distanceMeters: 0,
                score: 0,
                jumps: 0,
                dashes: 0,
                coins: 0,
                coinsCollected: 0,
                deaths: 0,
                startTime: 0,
                playTime: 0,
                bestDistance: 0,
                bestScore: 0,
                totalPlayTime: 0,
                gamesPlayed: 0
            },
            
            // Estado de la UI
            ui: {
                currentScreen: 'menu',
                hudVisible: false,
                showDebug: false,
                showFPS: false,
                showMinimap: true,
                theme: 'noir',
                language: 'es'
            },
            
            // Configuración del juego
            settings: {
                volume: {
                    master: 1.0,
                    sfx: 1.0,
                    music: 0.7
                },
                graphics: {
                    quality: 'high',
                    particles: true,
                    shadows: true,
                    bloom: true
                },
                controls: {
                    keyboard: {
                        jump: 'Space',
                        dash: 'ShiftLeft',
                        gravity: 'ControlLeft',
                        left: 'ArrowLeft',
                        right: 'ArrowRight',
                        pause: 'Escape'
                    },
                    touch: {
                        enabled: true,
                        sensitivity: 1.0
                    }
                },
                accessibility: {
                    highContrast: false,
                    reducedMotion: false,
                    screenReader: false
                }
            },
            
            // Metadatos
            meta: {
                version: '1.0.0',
                lastSaved: Date.now(),
                created: Date.now(),
                sessionId: this.generateSessionId()
            }
        };
    }
    
    /**
     * Configura validadores por defecto
     */
    setupDefaultValidators() {
        // Validador para posición del jugador
        this.addValidator('player.position', (newValue, oldValue) => {
            if (typeof newValue !== 'object' || !newValue.hasOwnProperty('x') || !newValue.hasOwnProperty('y')) {
                return { valid: false, error: 'La posición debe tener propiedades x e y' };
            }
            
            if (typeof newValue.x !== 'number' || typeof newValue.y !== 'number') {
                return { valid: false, error: 'Las coordenadas deben ser números' };
            }
            
            return { valid: true };
        });
        
        // Validador para estadísticas
        this.addValidator('stats', (newValue, oldValue) => {
            const requiredFields = ['distance', 'score', 'jumps', 'dashes', 'coins'];
            
            for (const field of requiredFields) {
                if (!newValue.hasOwnProperty(field) || typeof newValue[field] !== 'number') {
                    return { valid: false, error: `El campo ${field} es requerido y debe ser un número` };
                }
                
                if (newValue[field] < 0) {
                    return { valid: false, error: `El campo ${field} no puede ser negativo` };
                }
            }
            
            return { valid: true };
        });
        
        // Validador para configuración de volumen
        this.addValidator('settings.volume', (newValue, oldValue) => {
            const volumeFields = ['master', 'sfx', 'music'];
            
            for (const field of volumeFields) {
                if (newValue.hasOwnProperty(field)) {
                    const value = newValue[field];
                    if (typeof value !== 'number' || value < 0 || value > 1) {
                        return { valid: false, error: `${field} debe ser un número entre 0 y 1` };
                    }
                }
            }
            
            return { valid: true };
        });
        
        console.log('✅ Validadores por defecto configurados');
    }
    
    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Eventos de actualización de estado
        this.eventBus.on('gamestate:update', this.updateState.bind(this));
        this.eventBus.on('gamestate:reset', this.resetState.bind(this));
        this.eventBus.on('gamestate:save', this.saveState.bind(this));
        this.eventBus.on('gamestate:load', this.loadState.bind(this));
        
        // Eventos específicos del juego
        this.eventBus.on('player:position-changed', (data) => {
            this.updateState('player.position', data.position);
        });
        
        this.eventBus.on('player:jumped', (data) => {
            this.updateState('stats.jumps', this.state.stats.jumps + 1);
        });
        
        this.eventBus.on('player:dashed', (data) => {
            this.updateState('stats.dashes', this.state.stats.dashes + 1);
        });
        
        this.eventBus.on('game:distance-changed', (data) => {
            this.updateState('stats.distance', data.distance);
            this.updateState('stats.distanceMeters', Math.floor(data.distance / 50)); // 50 pixels = 1 metro
        });
        
        this.eventBus.on('game:score-changed', (data) => {
            this.updateState('stats.score', data.score);
        });
        
        this.eventBus.on('game:coin-collected', (data) => {
            this.updateState('stats.coins', this.state.stats.coins + 1);
            this.updateState('stats.coinsCollected', this.state.stats.coinsCollected + 1);
        });
        
        this.eventBus.on('game:player-died', () => {
            this.updateState('stats.deaths', this.state.stats.deaths + 1);
            this.updateState('player.isAlive', false);
        });
        
        this.eventBus.on('game:started', () => {
            this.updateState('stats.startTime', Date.now());
            this.updateState('stats.gamesPlayed', this.state.stats.gamesPlayed + 1);
        });
        
        this.eventBus.on('game:ended', () => {
            const playTime = Date.now() - this.state.stats.startTime;
            this.updateState('stats.playTime', playTime);
            this.updateState('stats.totalPlayTime', this.state.stats.totalPlayTime + playTime);
            
            // Actualizar mejores puntuaciones
            if (this.state.stats.distance > this.state.stats.bestDistance) {
                this.updateState('stats.bestDistance', this.state.stats.distance);
            }
            
            if (this.state.stats.score > this.state.stats.bestScore) {
                this.updateState('stats.bestScore', this.state.stats.score);
            }
        });
        
        console.log('👂 Event listeners del GameState configurados');
    }
    
    /**
     * Actualiza una parte del estado
     * @param {string} path - Ruta del estado (ej: 'player.position.x')
     * @param {*} value - Nuevo valor
     * @param {Object} options - Opciones de actualización
     * @returns {boolean} True si la actualización fue exitosa
     */
    updateState(path, value, options = {}) {
        try {
            const oldValue = this.getStateValue(path);
            
            // Validar el cambio
            if (!this.validateStateChange(path, value, oldValue)) {
                return false;
            }
            
            // Aplicar el cambio
            this.setStateValue(path, value);
            
            // Registrar el cambio en el historial
            this.recordChange(path, oldValue, value);
            
            // Emitir evento de cambio
            this.eventBus.emit('gamestate:changed', {
                path,
                oldValue,
                newValue: value,
                timestamp: Date.now()
            });
            
            // Auto-guardar si está habilitado y no es una actualización temporal
            if (this.persistenceConfig.autoSave && !options.temporary) {
                this.scheduleAutoSave();
            }
            
            return true;
            
        } catch (error) {
            console.error(`❌ Error actualizando estado en ${path}:`, error);
            return false;
        }
    }
    
    /**
     * Obtiene un valor del estado usando una ruta
     * @param {string} path - Ruta del estado
     * @returns {*} Valor del estado
     */
    getStateValue(path) {
        const keys = path.split('.');
        let current = this.state;
        
        for (const key of keys) {
            if (current === null || current === undefined) {
                return undefined;
            }
            current = current[key];
        }
        
        return current;
    }
    
    /**
     * Establece un valor en el estado usando una ruta
     * @param {string} path - Ruta del estado
     * @param {*} value - Valor a establecer
     */
    setStateValue(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = this.state;
        
        // Navegar hasta el objeto padre
        for (const key of keys) {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        // Establecer el valor
        current[lastKey] = value;
        
        // Actualizar timestamp de última modificación
        this.state.meta.lastSaved = Date.now();
    }
    
    /**
     * Valida un cambio de estado
     * @param {string} path - Ruta del estado
     * @param {*} newValue - Nuevo valor
     * @param {*} oldValue - Valor anterior
     * @returns {boolean} True si es válido
     */
    validateStateChange(path, newValue, oldValue) {
        // Buscar validador específico para esta ruta
        const validator = this.findValidator(path);
        
        if (validator) {
            const result = validator(newValue, oldValue);
            
            if (!result.valid) {
                console.warn(`⚠️ Validación fallida para ${path}: ${result.error}`);
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Busca un validador para una ruta específica
     * @param {string} path - Ruta del estado
     * @returns {Function|null} Validador encontrado
     */
    findValidator(path) {
        // Buscar validador exacto
        if (this.validators.has(path)) {
            return this.validators.get(path);
        }
        
        // Buscar validador de ruta padre
        const pathParts = path.split('.');
        for (let i = pathParts.length - 1; i > 0; i--) {
            const parentPath = pathParts.slice(0, i).join('.');
            if (this.validators.has(parentPath)) {
                return this.validators.get(parentPath);
            }
        }
        
        return null;
    }
    
    /**
     * Añade un validador para una ruta específica
     * @param {string} path - Ruta del estado
     * @param {Function} validator - Función validadora
     */
    addValidator(path, validator) {
        this.validators.set(path, validator);
        console.log(`✅ Validador añadido para: ${path}`);
    }
    
    /**
     * Registra un cambio en el historial
     * @param {string} path - Ruta del cambio
     * @param {*} oldValue - Valor anterior
     * @param {*} newValue - Nuevo valor
     */
    recordChange(path, oldValue, newValue) {
        const change = {
            path,
            oldValue,
            newValue,
            timestamp: Date.now()
        };
        
        this.changeHistory.push(change);
        
        // Limitar tamaño del historial
        if (this.changeHistory.length > this.persistenceConfig.maxHistorySize) {
            this.changeHistory.shift();
        }
    }
    
    /**
     * Obtiene el estado completo
     * @returns {Object} Estado del juego
     */
    getState() {
        return JSON.parse(JSON.stringify(this.state)); // Deep copy
    }
    
    /**
     * Obtiene una parte específica del estado
     * @param {string} path - Ruta del estado
     * @returns {*} Valor del estado
     */
    get(path) {
        return this.getStateValue(path);
    }
    
    /**
     * Establece una parte específica del estado
     * @param {string} path - Ruta del estado
     * @param {*} value - Nuevo valor
     * @param {Object} options - Opciones
     * @returns {boolean} True si fue exitoso
     */
    set(path, value, options = {}) {
        return this.updateState(path, value, options);
    }
    
    /**
     * Resetea el estado del juego
     * @param {boolean} keepSettings - Mantener configuraciones
     */
    resetState(keepSettings = true) {
        console.log('🔄 Reseteando estado del juego...');
        
        const oldSettings = keepSettings ? this.state.settings : null;
        const oldStats = {
            bestDistance: this.state.stats.bestDistance,
            bestScore: this.state.stats.bestScore,
            totalPlayTime: this.state.stats.totalPlayTime,
            gamesPlayed: this.state.stats.gamesPlayed
        };
        
        // Crear nuevo estado inicial
        this.state = this.createInitialState();
        
        // Restaurar configuraciones si se solicita
        if (keepSettings && oldSettings) {
            this.state.settings = oldSettings;
        }
        
        // Mantener estadísticas persistentes
        Object.assign(this.state.stats, oldStats);
        
        // Limpiar historial de cambios
        this.changeHistory.length = 0;
        
        // Emitir evento
        this.eventBus.emit('gamestate:reset', {
            keepSettings,
            timestamp: Date.now()
        });
        
        console.log('✅ Estado del juego reseteado');
    }
    
    /**
     * Guarda el estado en localStorage
     * @returns {boolean} True si fue exitoso
     */
    async saveState() {
        if (!this.persistenceConfig.enabled) {
            return false;
        }
        
        try {
            const stateToSave = {
                ...this.state,
                meta: {
                    ...this.state.meta,
                    lastSaved: Date.now()
                }
            };
            
            const serializedState = JSON.stringify(stateToSave);
            localStorage.setItem(this.storageKey, serializedState);
            
            console.log('💾 Estado guardado en localStorage');
            
            // Emitir evento
            this.eventBus.emit('gamestate:saved', {
                size: serializedState.length,
                timestamp: Date.now()
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Error guardando estado:', error);
            
            // Emitir evento de error
            this.eventBus.emit('gamestate:save-error', {
                error: error.message,
                timestamp: Date.now()
            });
            
            return false;
        }
    }
    
    /**
     * Carga el estado desde localStorage
     * @returns {boolean} True si fue exitoso
     */
    async loadState() {
        if (!this.persistenceConfig.enabled) {
            return false;
        }
        
        try {
            const serializedState = localStorage.getItem(this.storageKey);
            
            if (!serializedState) {
                console.log('📂 No hay estado guardado');
                return false;
            }
            
            const loadedState = JSON.parse(serializedState);
            
            // Validar estructura del estado cargado
            if (!this.validateLoadedState(loadedState)) {
                console.warn('⚠️ Estado cargado inválido, usando estado por defecto');
                return false;
            }
            
            // Mergear con estado por defecto para asegurar compatibilidad
            this.state = this.mergeWithDefaultState(loadedState);
            
            console.log('📂 Estado cargado desde localStorage');
            
            // Emitir evento
            this.eventBus.emit('gamestate:loaded', {
                timestamp: Date.now(),
                lastSaved: this.state.meta.lastSaved
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Error cargando estado:', error);
            
            // Emitir evento de error
            this.eventBus.emit('gamestate:load-error', {
                error: error.message,
                timestamp: Date.now()
            });
            
            return false;
        }
    }
    
    /**
     * Carga el estado persistido durante la inicialización
     */
    async loadPersistedState() {
        const loaded = await this.loadState();
        
        if (!loaded) {
            console.log('🆕 Usando estado inicial por defecto');
        }
    }
    
    /**
     * Valida un estado cargado
     * @param {Object} state - Estado a validar
     * @returns {boolean} True si es válido
     */
    validateLoadedState(state) {
        if (!state || typeof state !== 'object') {
            return false;
        }
        
        // Verificar estructura básica
        const requiredSections = ['player', 'world', 'stats', 'ui', 'settings', 'meta'];
        
        for (const section of requiredSections) {
            if (!state[section] || typeof state[section] !== 'object') {
                console.warn(`⚠️ Sección faltante o inválida: ${section}`);
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Mergea un estado cargado con el estado por defecto
     * @param {Object} loadedState - Estado cargado
     * @returns {Object} Estado mergeado
     */
    mergeWithDefaultState(loadedState) {
        const defaultState = this.createInitialState();
        
        // Función recursiva para mergear objetos
        const deepMerge = (target, source) => {
            const result = { ...target };
            
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = deepMerge(target[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
            
            return result;
        };
        
        return deepMerge(defaultState, loadedState);
    }
    
    /**
     * Verifica si hay datos persistentes
     * @returns {boolean} True si hay datos guardados
     */
    hasPersistentData() {
        return localStorage.getItem(this.storageKey) !== null;
    }
    
    /**
     * Elimina los datos persistentes
     * @returns {boolean} True si fue exitoso
     */
    clearPersistedData() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('🗑️ Datos persistentes eliminados');
            
            // Emitir evento
            this.eventBus.emit('gamestate:cleared', {
                timestamp: Date.now()
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Error eliminando datos persistentes:', error);
            return false;
        }
    }
    
    /**
     * Inicia el auto-guardado
     */
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(() => {
            this.saveState();
        }, this.persistenceConfig.saveInterval);
        
        console.log(`⏰ Auto-guardado iniciado (cada ${this.persistenceConfig.saveInterval}ms)`);
    }
    
    /**
     * Detiene el auto-guardado
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
            console.log('⏰ Auto-guardado detenido');
        }
    }
    
    /**
     * Programa un auto-guardado (debounced)
     */
    scheduleAutoSave() {
        if (this.scheduledSave) {
            clearTimeout(this.scheduledSave);
        }
        
        this.scheduledSave = setTimeout(() => {
            this.saveState();
            this.scheduledSave = null;
        }, 1000); // Guardar después de 1 segundo de inactividad
    }
    
    /**
     * Genera un ID de sesión único
     * @returns {string} ID de sesión
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Obtiene estadísticas del sistema de estado
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            isInitialized: this.isInitialized,
            stateSize: JSON.stringify(this.state).length,
            changeHistorySize: this.changeHistory.length,
            validatorsCount: this.validators.size,
            hasPersistentData: this.hasPersistentData(),
            autoSaveEnabled: this.persistenceConfig.autoSave,
            lastSaved: this.state.meta.lastSaved,
            sessionId: this.state.meta.sessionId
        };
    }
    
    /**
     * Obtiene información de debug
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            stats: this.getStats(),
            recentChanges: this.changeHistory.slice(-10),
            validators: Array.from(this.validators.keys()),
            persistenceConfig: this.persistenceConfig,
            currentState: {
                player: this.state.player,
                stats: this.state.stats,
                ui: this.state.ui
            }
        };
    }
    
    /**
     * Destruye el sistema de estado
     */
    destroy() {
        console.log('🧹 Destruyendo GameState...');
        
        // Guardar estado final
        if (this.persistenceConfig.enabled) {
            this.saveState();
        }
        
        // Detener auto-guardado
        this.stopAutoSave();
        
        // Limpiar timers programados
        if (this.scheduledSave) {
            clearTimeout(this.scheduledSave);
        }
        
        // Remover event listeners
        this.eventBus.off('*', this);
        
        // Limpiar datos
        this.validators.clear();
        this.changeHistory.length = 0;
        
        this.isInitialized = false;
        
        console.log('✅ GameState destruido');
    }
}