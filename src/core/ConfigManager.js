/**
 * ConfigManager - Sistema de gestión de configuración
 * @module ConfigManager
 */

export class ConfigManager {
    /**
     * Crea una nueva instancia del ConfigManager
     * @param {Object} defaultConfig - Configuración por defecto
     * @param {EventBus} eventBus - Instancia del EventBus
     */
    constructor(defaultConfig = {}, eventBus = null) {
        this.eventBus = eventBus;
        this.config = {};
        this.defaultConfig = {};
        this.validators = new Map();
        this.watchers = new Map();
        this.configHistory = [];
        this.maxHistorySize = 10;
        this.isLocked = false;
        
        this.setDefaultConfig(defaultConfig);
        this.setupEventListeners();
    }

    /**
     * Configurar listeners de eventos
     * @private
     */
    setupEventListeners() {
        if (this.eventBus) {
            this.eventBus.on('config:get', this.handleGetConfig, this);
            this.eventBus.on('config:set', this.handleSetConfig, this);
            this.eventBus.on('config:reset', this.handleResetConfig, this);
            this.eventBus.on('config:validate', this.handleValidateConfig, this);
        }
    }

    /**
     * Establecer configuración por defecto
     * @param {Object} defaultConfig - Configuración por defecto
     */
    setDefaultConfig(defaultConfig) {
        this.defaultConfig = this.deepClone(defaultConfig);
        this.config = this.deepClone(defaultConfig);
        
        console.log('[ConfigManager] Configuración por defecto establecida');
        this.emitEvent('config:default-set', { config: this.defaultConfig });
    }

    /**
     * Obtener valor de configuración
     * @param {string} path - Ruta del valor (ej: 'player.physics.gravity')
     * @param {*} defaultValue - Valor por defecto si no existe
     * @returns {*} Valor de configuración
     */
    get(path, defaultValue = undefined) {
        if (!path) {
            return this.deepClone(this.config);
        }

        const value = this.getNestedValue(this.config, path);
        
        if (value === undefined && defaultValue !== undefined) {
            return defaultValue;
        }
        
        return value;
    }

    /**
     * Establecer valor de configuración
     * @param {string} path - Ruta del valor
     * @param {*} value - Nuevo valor
     * @param {boolean} validate - Si validar el valor
     * @returns {boolean} True si se estableció correctamente
     */
    set(path, value, validate = true) {
        if (this.isLocked) {
            console.warn('[ConfigManager] Configuración bloqueada, no se puede modificar');
            return false;
        }

        if (!path) {
            console.error('[ConfigManager] Ruta requerida para establecer valor');
            return false;
        }

        // Validar valor si hay validador
        if (validate && !this.validateValue(path, value)) {
            console.error(`[ConfigManager] Valor inválido para ${path}:`, value);
            return false;
        }

        const oldValue = this.getNestedValue(this.config, path);
        
        // Guardar en historial
        this.addToHistory('set', path, oldValue, value);
        
        // Establecer nuevo valor
        this.setNestedValue(this.config, path, value);
        
        // Notificar watchers
        this.notifyWatchers(path, value, oldValue);
        
        console.log(`[ConfigManager] Configuración actualizada: ${path} = ${JSON.stringify(value)}`);
        this.emitEvent('config:changed', { path, value, oldValue });
        
        return true;
    }

    /**
     * Resetear configuración a valores por defecto
     * @param {string} path - Ruta específica a resetear (opcional)
     */
    reset(path = null) {
        if (this.isLocked) {
            console.warn('[ConfigManager] Configuración bloqueada, no se puede resetear');
            return false;
        }

        if (path) {
            const defaultValue = this.getNestedValue(this.defaultConfig, path);
            return this.set(path, defaultValue, false);
        } else {
            const oldConfig = this.deepClone(this.config);
            this.config = this.deepClone(this.defaultConfig);
            
            this.addToHistory('reset', null, oldConfig, this.config);
            
            console.log('[ConfigManager] Configuración reseteada a valores por defecto');
            this.emitEvent('config:reset', { config: this.config });
            
            return true;
        }
    }

    /**
     * Registrar validador para una ruta
     * @param {string} path - Ruta de configuración
     * @param {Function} validator - Función validadora
     */
    addValidator(path, validator) {
        if (typeof validator !== 'function') {
            console.error('[ConfigManager] Validador debe ser una función');
            return false;
        }

        this.validators.set(path, validator);
        console.log(`[ConfigManager] Validador registrado para: ${path}`);
        return true;
    }

    /**
     * Remover validador
     * @param {string} path - Ruta de configuración
     */
    removeValidator(path) {
        const removed = this.validators.delete(path);
        if (removed) {
            console.log(`[ConfigManager] Validador removido para: ${path}`);
        }
        return removed;
    }

    /**
     * Validar valor
     * @param {string} path - Ruta de configuración
     * @param {*} value - Valor a validar
     * @returns {boolean} True si es válido
     * @private
     */
    validateValue(path, value) {
        const validator = this.validators.get(path);
        if (!validator) {
            return true; // Sin validador, asumir válido
        }

        try {
            return validator(value, path, this.config);
        } catch (error) {
            console.error(`[ConfigManager] Error en validador para ${path}:`, error);
            return false;
        }
    }

    /**
     * Observar cambios en una ruta
     * @param {string} path - Ruta a observar
     * @param {Function} callback - Función callback
     * @param {Object} context - Contexto para el callback
     */
    watch(path, callback, context = null) {
        if (typeof callback !== 'function') {
            console.error('[ConfigManager] Callback debe ser una función');
            return false;
        }

        if (!this.watchers.has(path)) {
            this.watchers.set(path, []);
        }

        this.watchers.get(path).push({ callback, context });
        console.log(`[ConfigManager] Watcher registrado para: ${path}`);
        return true;
    }

    /**
     * Dejar de observar cambios
     * @param {string} path - Ruta
     * @param {Function} callback - Callback a remover
     */
    unwatch(path, callback) {
        const watchers = this.watchers.get(path);
        if (!watchers) return false;

        const index = watchers.findIndex(w => w.callback === callback);
        if (index !== -1) {
            watchers.splice(index, 1);
            
            if (watchers.length === 0) {
                this.watchers.delete(path);
            }
            
            console.log(`[ConfigManager] Watcher removido para: ${path}`);
            return true;
        }
        
        return false;
    }

    /**
     * Notificar watchers
     * @param {string} path - Ruta que cambió
     * @param {*} newValue - Nuevo valor
     * @param {*} oldValue - Valor anterior
     * @private
     */
    notifyWatchers(path, newValue, oldValue) {
        // Notificar watchers exactos
        const exactWatchers = this.watchers.get(path);
        if (exactWatchers) {
            exactWatchers.forEach(({ callback, context }) => {
                try {
                    if (context) {
                        callback.call(context, newValue, oldValue, path);
                    } else {
                        callback(newValue, oldValue, path);
                    }
                } catch (error) {
                    console.error(`[ConfigManager] Error en watcher para ${path}:`, error);
                }
            });
        }

        // Notificar watchers de rutas padre
        const pathParts = path.split('.');
        for (let i = pathParts.length - 1; i > 0; i--) {
            const parentPath = pathParts.slice(0, i).join('.');
            const parentWatchers = this.watchers.get(parentPath);
            
            if (parentWatchers) {
                const parentValue = this.get(parentPath);
                parentWatchers.forEach(({ callback, context }) => {
                    try {
                        if (context) {
                            callback.call(context, parentValue, parentValue, parentPath);
                        } else {
                            callback(parentValue, parentValue, parentPath);
                        }
                    } catch (error) {
                        console.error(`[ConfigManager] Error en watcher padre para ${parentPath}:`, error);
                    }
                });
            }
        }
    }

    /**
     * Obtener valor anidado
     * @param {Object} obj - Objeto
     * @param {string} path - Ruta
     * @returns {*} Valor
     * @private
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Establecer valor anidado
     * @param {Object} obj - Objeto
     * @param {string} path - Ruta
     * @param {*} value - Valor
     * @private
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        
        target[lastKey] = value;
    }

    /**
     * Clonar objeto profundamente
     * @param {*} obj - Objeto a clonar
     * @returns {*} Objeto clonado
     * @private
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        }
        
        return obj;
    }

    /**
     * Agregar al historial
     * @param {string} action - Acción realizada
     * @param {string} path - Ruta afectada
     * @param {*} oldValue - Valor anterior
     * @param {*} newValue - Nuevo valor
     * @private
     */
    addToHistory(action, path, oldValue, newValue) {
        this.configHistory.push({
            action,
            path,
            oldValue: this.deepClone(oldValue),
            newValue: this.deepClone(newValue),
            timestamp: Date.now()
        });

        if (this.configHistory.length > this.maxHistorySize) {
            this.configHistory.shift();
        }
    }

    /**
     * Obtener historial de cambios
     * @returns {Array} Historial
     */
    getHistory() {
        return [...this.configHistory];
    }

    /**
     * Limpiar historial
     */
    clearHistory() {
        this.configHistory = [];
        console.log('[ConfigManager] Historial limpiado');
    }

    /**
     * Bloquear/desbloquear configuración
     * @param {boolean} locked - Estado de bloqueo
     */
    setLocked(locked) {
        this.isLocked = locked;
        console.log(`[ConfigManager] Configuración ${locked ? 'bloqueada' : 'desbloqueada'}`);
        this.emitEvent('config:lock-changed', { locked });
    }

    /**
     * Exportar configuración
     * @returns {Object} Configuración actual
     */
    export() {
        return this.deepClone(this.config);
    }

    /**
     * Importar configuración
     * @param {Object} config - Configuración a importar
     * @param {boolean} merge - Si hacer merge con la actual
     * @returns {boolean} True si se importó correctamente
     */
    import(config, merge = false) {
        if (this.isLocked) {
            console.warn('[ConfigManager] Configuración bloqueada, no se puede importar');
            return false;
        }

        try {
            const oldConfig = this.deepClone(this.config);
            
            if (merge) {
                this.config = this.deepMerge(this.config, config);
            } else {
                this.config = this.deepClone(config);
            }
            
            this.addToHistory('import', null, oldConfig, this.config);
            
            console.log('[ConfigManager] Configuración importada');
            this.emitEvent('config:imported', { config: this.config, merged: merge });
            
            return true;
        } catch (error) {
            console.error('[ConfigManager] Error importando configuración:', error);
            return false;
        }
    }

    /**
     * Merge profundo de objetos
     * @param {Object} target - Objeto destino
     * @param {Object} source - Objeto fuente
     * @returns {Object} Objeto merged
     * @private
     */
    deepMerge(target, source) {
        const result = this.deepClone(target);
        
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
                    result[key] = this.deepMerge(result[key], source[key]);
                } else {
                    result[key] = this.deepClone(source[key]);
                }
            } else {
                result[key] = this.deepClone(source[key]);
            }
        });
        
        return result;
    }

    // ===== HANDLERS DE EVENTOS =====

    /**
     * Manejar solicitud de obtener configuración
     * @param {Object} data - Datos del evento
     * @private
     */
    handleGetConfig(data) {
        const { path, callback } = data;
        const value = this.get(path);
        
        if (callback && typeof callback === 'function') {
            callback(value);
        }
        
        this.emitEvent('config:get-response', { path, value });
    }

    /**
     * Manejar solicitud de establecer configuración
     * @param {Object} data - Datos del evento
     * @private
     */
    handleSetConfig(data) {
        const { path, value, validate = true } = data;
        const success = this.set(path, value, validate);
        
        this.emitEvent('config:set-response', { path, value, success });
    }

    /**
     * Manejar solicitud de reset
     * @param {Object} data - Datos del evento
     * @private
     */
    handleResetConfig(data) {
        const { path } = data;
        const success = this.reset(path);
        
        this.emitEvent('config:reset-response', { path, success });
    }

    /**
     * Manejar solicitud de validación
     * @param {Object} data - Datos del evento
     * @private
     */
    handleValidateConfig(data) {
        const { path, value } = data;
        const isValid = this.validateValue(path, value);
        
        this.emitEvent('config:validate-response', { path, value, isValid });
    }

    /**
     * Emitir evento
     * @param {string} event - Nombre del evento
     * @param {Object} data - Datos del evento
     * @private
     */
    emitEvent(event, data) {
        if (this.eventBus) {
            this.eventBus.emit(event, data);
        }
    }

    /**
     * Obtener estadísticas del ConfigManager
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            configSize: JSON.stringify(this.config).length,
            validatorCount: this.validators.size,
            watcherCount: this.watchers.size,
            historySize: this.configHistory.length,
            isLocked: this.isLocked,
            lastChange: this.configHistory.length > 0 ? 
                this.configHistory[this.configHistory.length - 1].timestamp : null
        };
    }

    /**
     * Destruir ConfigManager
     */
    destroy() {
        this.validators.clear();
        this.watchers.clear();
        this.configHistory = [];
        this.config = {};
        this.defaultConfig = {};
        this.isLocked = false;
        
        console.log('[ConfigManager] ConfigManager destruido');
    }
}