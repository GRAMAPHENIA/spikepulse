/**
 * Herramientas de debugging para el estado del juego
 * @module StateDebugger
 */

export class StateDebugger {
    /**
     * Crea una nueva instancia del debugger de estado
     * @param {GameState} gameState - Instancia del estado del juego
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(gameState, eventBus) {
        this.gameState = gameState;
        this.eventBus = eventBus;
        this.isEnabled = false;
        
        // Historial de cambios para análisis
        this.changeLog = [];
        this.maxLogSize = 1000;
        
        // Métricas de rendimiento
        this.metrics = {
            stateUpdates: 0,
            validationFailures: 0,
            saveOperations: 0,
            loadOperations: 0,
            averageUpdateTime: 0,
            totalUpdateTime: 0
        };
        
        // Watchers para campos específicos
        this.watchers = new Map();
        
        console.log('🔍 StateDebugger creado');
    }
    
    /**
     * Habilita el debugging
     */
    enable() {
        if (this.isEnabled) return;
        
        this.isEnabled = true;
        this.setupEventListeners();
        this.injectDebugMethods();
        
        console.log('🔍 StateDebugger habilitado');
    }
    
    /**
     * Deshabilita el debugging
     */
    disable() {
        if (!this.isEnabled) return;
        
        this.isEnabled = false;
        this.removeEventListeners();
        this.removeDebugMethods();
        
        console.log('🔍 StateDebugger deshabilitado');
    }
    
    /**
     * Configura event listeners para debugging
     */
    setupEventListeners() {
        this.eventBus.on('gamestate:changed', this.logStateChange.bind(this));
        this.eventBus.on('gamestate:saved', this.logSaveOperation.bind(this));
        this.eventBus.on('gamestate:loaded', this.logLoadOperation.bind(this));
        this.eventBus.on('gamestate:save-error', this.logError.bind(this));
        this.eventBus.on('gamestate:load-error', this.logError.bind(this));
    }
    
    /**
     * Remueve event listeners
     */
    removeEventListeners() {
        this.eventBus.off('gamestate:changed', this.logStateChange);
        this.eventBus.off('gamestate:saved', this.logSaveOperation);
        this.eventBus.off('gamestate:loaded', this.logLoadOperation);
        this.eventBus.off('gamestate:save-error', this.logError);
        this.eventBus.off('gamestate:load-error', this.logError);
    }
    
    /**
     * Inyecta métodos de debug en el GameState
     */
    injectDebugMethods() {
        // Guardar métodos originales
        this.originalMethods = {
            updateState: this.gameState.updateState.bind(this.gameState),
            saveState: this.gameState.saveState.bind(this.gameState),
            loadState: this.gameState.loadState.bind(this.gameState)
        };
        
        // Inyectar versiones con debugging
        this.gameState.updateState = this.debugUpdateState.bind(this);
        this.gameState.saveState = this.debugSaveState.bind(this);
        this.gameState.loadState = this.debugLoadState.bind(this);
    }
    
    /**
     * Remueve métodos de debug
     */
    removeDebugMethods() {
        if (this.originalMethods) {
            this.gameState.updateState = this.originalMethods.updateState;
            this.gameState.saveState = this.originalMethods.saveState;
            this.gameState.loadState = this.originalMethods.loadState;
        }
    }
    
    /**
     * Versión con debugging del updateState
     */
    debugUpdateState(path, value, options = {}) {
        const startTime = performance.now();
        
        // Llamar al método original
        const result = this.originalMethods.updateState(path, value, options);
        
        // Registrar métricas
        const updateTime = performance.now() - startTime;
        this.metrics.stateUpdates++;
        this.metrics.totalUpdateTime += updateTime;
        this.metrics.averageUpdateTime = this.metrics.totalUpdateTime / this.metrics.stateUpdates;
        
        // Log si es lento
        if (updateTime > 5) { // Más de 5ms
            console.warn(`🐌 Actualización lenta del estado: ${path} (${updateTime.toFixed(2)}ms)`);
        }
        
        return result;
    }
    
    /**
     * Versión con debugging del saveState
     */
    async debugSaveState() {
        const startTime = performance.now();
        
        console.log('💾 Iniciando guardado del estado...');
        
        const result = await this.originalMethods.saveState();
        
        const saveTime = performance.now() - startTime;
        this.metrics.saveOperations++;
        
        if (result) {
            console.log(`💾 Estado guardado exitosamente (${saveTime.toFixed(2)}ms)`);
        } else {
            console.error(`💾 Error guardando estado (${saveTime.toFixed(2)}ms)`);
        }
        
        return result;
    }
    
    /**
     * Versión con debugging del loadState
     */
    async debugLoadState() {
        const startTime = performance.now();
        
        console.log('📂 Iniciando carga del estado...');
        
        const result = await this.originalMethods.loadState();
        
        const loadTime = performance.now() - startTime;
        this.metrics.loadOperations++;
        
        if (result) {
            console.log(`📂 Estado cargado exitosamente (${loadTime.toFixed(2)}ms)`);
        } else {
            console.log(`📂 No se encontró estado guardado (${loadTime.toFixed(2)}ms)`);
        }
        
        return result;
    }
    
    /**
     * Registra un cambio de estado
     * @param {Object} data - Datos del cambio
     */
    logStateChange(data) {
        const logEntry = {
            ...data,
            stack: new Error().stack,
            metrics: { ...this.metrics }
        };
        
        this.changeLog.push(logEntry);
        
        // Limitar tamaño del log
        if (this.changeLog.length > this.maxLogSize) {
            this.changeLog.shift();
        }
        
        // Verificar watchers
        this.checkWatchers(data.path, data.newValue, data.oldValue);
        
        // Log detallado si está habilitado
        if (this.verboseLogging) {
            console.log(`🔄 [${data.path}] ${JSON.stringify(data.oldValue)} → ${JSON.stringify(data.newValue)}`);
        }
    }
    
    /**
     * Registra una operación de guardado
     * @param {Object} data - Datos de la operación
     */
    logSaveOperation(data) {
        console.log(`💾 Estado guardado: ${data.size} bytes`);
    }
    
    /**
     * Registra una operación de carga
     * @param {Object} data - Datos de la operación
     */
    logLoadOperation(data) {
        const timeSinceLastSave = Date.now() - data.lastSaved;
        console.log(`📂 Estado cargado (guardado hace ${this.formatTime(timeSinceLastSave)})`);
    }
    
    /**
     * Registra un error
     * @param {Object} data - Datos del error
     */
    logError(data) {
        console.error(`❌ Error en estado: ${data.error}`);
    }
    
    /**
     * Añade un watcher para un campo específico
     * @param {string} path - Ruta del campo
     * @param {Function} callback - Función a llamar cuando cambie
     */
    addWatcher(path, callback) {
        if (!this.watchers.has(path)) {
            this.watchers.set(path, []);
        }
        
        this.watchers.get(path).push(callback);
        console.log(`👁️ Watcher añadido para: ${path}`);
    }
    
    /**
     * Remueve un watcher
     * @param {string} path - Ruta del campo
     * @param {Function} callback - Función a remover
     */
    removeWatcher(path, callback) {
        if (this.watchers.has(path)) {
            const callbacks = this.watchers.get(path);
            const index = callbacks.indexOf(callback);
            
            if (index > -1) {
                callbacks.splice(index, 1);
                
                if (callbacks.length === 0) {
                    this.watchers.delete(path);
                }
                
                console.log(`👁️ Watcher removido para: ${path}`);
            }
        }
    }
    
    /**
     * Verifica watchers para un cambio
     * @param {string} path - Ruta que cambió
     * @param {*} newValue - Nuevo valor
     * @param {*} oldValue - Valor anterior
     */
    checkWatchers(path, newValue, oldValue) {
        // Verificar watcher exacto
        if (this.watchers.has(path)) {
            this.watchers.get(path).forEach(callback => {
                try {
                    callback(newValue, oldValue, path);
                } catch (error) {
                    console.error(`❌ Error en watcher para ${path}:`, error);
                }
            });
        }
        
        // Verificar watchers de rutas padre
        const pathParts = path.split('.');
        for (let i = pathParts.length - 1; i > 0; i--) {
            const parentPath = pathParts.slice(0, i).join('.');
            
            if (this.watchers.has(parentPath)) {
                this.watchers.get(parentPath).forEach(callback => {
                    try {
                        callback(newValue, oldValue, path);
                    } catch (error) {
                        console.error(`❌ Error en watcher padre para ${parentPath}:`, error);
                    }
                });
            }
        }
    }
    
    /**
     * Obtiene el historial de cambios
     * @param {number} limit - Número máximo de entradas
     * @returns {Array} Historial de cambios
     */
    getChangeHistory(limit = 50) {
        return this.changeLog.slice(-limit);
    }
    
    /**
     * Obtiene métricas de rendimiento
     * @returns {Object} Métricas
     */
    getMetrics() {
        return {
            ...this.metrics,
            changeLogSize: this.changeLog.length,
            watchersCount: this.watchers.size,
            isEnabled: this.isEnabled
        };
    }
    
    /**
     * Analiza el rendimiento del estado
     * @returns {Object} Análisis de rendimiento
     */
    analyzePerformance() {
        const recentChanges = this.getChangeHistory(100);
        
        // Análisis de frecuencia de cambios por ruta
        const pathFrequency = {};
        recentChanges.forEach(change => {
            pathFrequency[change.path] = (pathFrequency[change.path] || 0) + 1;
        });
        
        // Rutas más cambiadas
        const mostChangedPaths = Object.entries(pathFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
        
        // Análisis temporal
        const now = Date.now();
        const recentChangesCount = recentChanges.filter(
            change => now - change.timestamp < 60000 // Último minuto
        ).length;
        
        return {
            totalChanges: this.changeLog.length,
            recentChanges: recentChangesCount,
            changesPerMinute: recentChangesCount,
            mostChangedPaths,
            averageUpdateTime: this.metrics.averageUpdateTime,
            totalUpdateTime: this.metrics.totalUpdateTime,
            validationFailures: this.metrics.validationFailures,
            saveOperations: this.metrics.saveOperations,
            loadOperations: this.metrics.loadOperations
        };
    }
    
    /**
     * Exporta el estado actual para debugging
     * @returns {Object} Estado exportado
     */
    exportState() {
        return {
            state: this.gameState.getState(),
            changeHistory: this.getChangeHistory(),
            metrics: this.getMetrics(),
            performance: this.analyzePerformance(),
            timestamp: Date.now()
        };
    }
    
    /**
     * Valida la integridad del estado
     * @returns {Object} Resultado de la validación
     */
    validateStateIntegrity() {
        const state = this.gameState.getState();
        const issues = [];
        
        // Verificar estructura básica
        const requiredSections = ['player', 'world', 'stats', 'ui', 'settings', 'meta'];
        
        for (const section of requiredSections) {
            if (!state[section]) {
                issues.push(`Sección faltante: ${section}`);
            }
        }
        
        // Verificar tipos de datos
        if (state.player) {
            if (typeof state.player.position?.x !== 'number') {
                issues.push('player.position.x debe ser un número');
            }
            if (typeof state.player.position?.y !== 'number') {
                issues.push('player.position.y debe ser un número');
            }
        }
        
        if (state.stats) {
            const numericStats = ['distance', 'score', 'jumps', 'dashes', 'coins'];
            for (const stat of numericStats) {
                if (typeof state.stats[stat] !== 'number' || state.stats[stat] < 0) {
                    issues.push(`stats.${stat} debe ser un número no negativo`);
                }
            }
        }
        
        return {
            isValid: issues.length === 0,
            issues,
            timestamp: Date.now()
        };
    }
    
    /**
     * Formatea tiempo en formato legible
     * @param {number} ms - Milisegundos
     * @returns {string} Tiempo formateado
     */
    formatTime(ms) {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
        return `${(ms / 3600000).toFixed(1)}h`;
    }
    
    /**
     * Habilita logging verboso
     */
    enableVerboseLogging() {
        this.verboseLogging = true;
        console.log('🔍 Logging verboso habilitado');
    }
    
    /**
     * Deshabilita logging verboso
     */
    disableVerboseLogging() {
        this.verboseLogging = false;
        console.log('🔍 Logging verboso deshabilitado');
    }
    
    /**
     * Limpia el historial de cambios
     */
    clearHistory() {
        this.changeLog.length = 0;
        console.log('🧹 Historial de cambios limpiado');
    }
    
    /**
     * Resetea las métricas
     */
    resetMetrics() {
        this.metrics = {
            stateUpdates: 0,
            validationFailures: 0,
            saveOperations: 0,
            loadOperations: 0,
            averageUpdateTime: 0,
            totalUpdateTime: 0
        };
        
        console.log('🔄 Métricas reseteadas');
    }
}