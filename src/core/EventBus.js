/**
 * EventBus - Sistema de comunicación entre módulos para Spikepulse
 * @module EventBus
 */

export class EventBus {
    /**
     * Crea una nueva instancia del EventBus
     */
    constructor() {
        this.events = new Map();
        this.debugMode = false;
        this.eventHistory = [];
        this.maxHistorySize = 100;
        this.wildcardListeners = [];
        this.eventStats = new Map();
        this.isEnabled = true;
    }

    /**
     * Suscribirse a un evento
     * @param {string} event - Nombre del evento (soporta wildcards con *)
     * @param {Function} callback - Función callback
     * @param {Object} context - Contexto para el callback (opcional)
     */
    on(event, callback, context = null) {
        // Manejar wildcards
        if (event.includes('*')) {
            this.wildcardListeners.push({
                pattern: event,
                callback,
                context,
                once: false,
                regex: this.createWildcardRegex(event)
            });
            
            if (this.debugMode) {
                console.log(`[EventBus] Suscrito a patrón wildcard: ${event}`);
            }
            return;
        }
        
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        
        this.events.get(event).push({
            callback,
            context,
            once: false,
            id: this.generateListenerId()
        });

        if (this.debugMode) {
            console.log(`[EventBus] Suscrito a evento: ${event}`);
        }
    }
    
    /**
     * Suscribirse a un evento una sola vez
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función callback
     * @param {Object} context - Contexto para el callback (opcional)
     */
    once(event, callback, context = null) {
        if (event.includes('*')) {
            this.wildcardListeners.push({
                pattern: event,
                callback,
                context,
                once: true,
                regex: this.createWildcardRegex(event)
            });
            return;
        }
        
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        
        this.events.get(event).push({
            callback,
            context,
            once: true,
            id: this.generateListenerId()
        });

        if (this.debugMode) {
            console.log(`[EventBus] Suscrito una vez a evento: ${event}`);
        }
    }
    
    /**
     * Crea regex para wildcards
     * @param {string} pattern - Patrón con wildcards
     * @returns {RegExp} Expresión regular
     */
    createWildcardRegex(pattern) {
        const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regexPattern = escaped.replace(/\\\*/g, '.*');
        return new RegExp(`^${regexPattern}$`);
    }
    
    /**
     * Genera ID único para listeners
     * @returns {string} ID único
     */
    generateListenerId() {
        return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Emitir un evento
     * @param {string} event - Nombre del evento
     * @param {*} data - Datos a enviar con el evento
     * @param {Object} options - Opciones adicionales
     */
    emit(event, data = null, options = {}) {
        if (!this.isEnabled) return;
        
        const eventData = {
            event,
            data,
            timestamp: Date.now(),
            options
        };
        
        // Añadir al historial
        this.addToHistory(eventData);
        
        // Actualizar estadísticas
        this.updateEventStats(event);
        
        let listenersExecuted = 0;
        
        // Ejecutar listeners específicos
        if (this.events.has(event)) {
            const listeners = this.events.get(event);
            const listenersToRemove = [];
            
            listeners.forEach((listener, index) => {
                try {
                    if (listener.context) {
                        listener.callback.call(listener.context, data, eventData);
                    } else {
                        listener.callback(data, eventData);
                    }
                    
                    listenersExecuted++;
                    
                    // Marcar para remoción si es 'once'
                    if (listener.once) {
                        listenersToRemove.push(index);
                    }
                } catch (error) {
                    console.error(`[EventBus] Error ejecutando callback para evento ${event}:`, error);
                }
            });
            
            // Remover listeners 'once' en orden inverso
            listenersToRemove.reverse().forEach(index => {
                listeners.splice(index, 1);
            });
            
            // Limpiar evento si no quedan listeners
            if (listeners.length === 0) {
                this.events.delete(event);
            }
        }
        
        // Ejecutar wildcard listeners
        const wildcardToRemove = [];
        this.wildcardListeners.forEach((listener, index) => {
            if (listener.regex.test(event)) {
                try {
                    if (listener.context) {
                        listener.callback.call(listener.context, data, eventData);
                    } else {
                        listener.callback(data, eventData);
                    }
                    
                    listenersExecuted++;
                    
                    if (listener.once) {
                        wildcardToRemove.push(index);
                    }
                } catch (error) {
                    console.error(`[EventBus] Error ejecutando wildcard callback para evento ${event}:`, error);
                }
            }
        });
        
        // Remover wildcard listeners 'once'
        wildcardToRemove.reverse().forEach(index => {
            this.wildcardListeners.splice(index, 1);
        });

        if (this.debugMode) {
            console.log(`[EventBus] Evento emitido: ${event} (${listenersExecuted} listeners)`, data);
        }
        
        return listenersExecuted;
    }
    
    /**
     * Emitir evento de forma asíncrona
     * @param {string} event - Nombre del evento
     * @param {*} data - Datos a enviar
     * @param {number} delay - Retraso en ms (opcional)
     */
    emitAsync(event, data = null, delay = 0) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const listenersExecuted = this.emit(event, data);
                resolve(listenersExecuted);
            }, delay);
        });
    }
    
    /**
     * Añade evento al historial
     * @param {Object} eventData - Datos del evento
     */
    addToHistory(eventData) {
        this.eventHistory.push(eventData);
        
        // Mantener tamaño máximo del historial
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }
    
    /**
     * Actualiza estadísticas de eventos
     * @param {string} event - Nombre del evento
     */
    updateEventStats(event) {
        if (!this.eventStats.has(event)) {
            this.eventStats.set(event, {
                count: 0,
                lastEmitted: null,
                firstEmitted: Date.now()
            });
        }
        
        const stats = this.eventStats.get(event);
        stats.count++;
        stats.lastEmitted = Date.now();
    }

    /**
     * Desuscribirse de un evento
     * @param {string} event - Nombre del evento o '*' para todos
     * @param {Function|Object} callbackOrContext - Función callback o contexto
     * @param {Object} context - Contexto del callback (opcional)
     */
    off(event, callbackOrContext = null, context = null) {
        // Si event es '*', remover todos los listeners de un contexto
        if (event === '*' && callbackOrContext) {
            this.removeAllListenersForContext(callbackOrContext);
            return;
        }
        
        // Manejar wildcards
        if (event.includes('*')) {
            this.removeWildcardListeners(event, callbackOrContext, context);
            return;
        }
        
        if (!this.events.has(event)) {
            return;
        }

        const listeners = this.events.get(event);

        if (!callbackOrContext) {
            // Si no se especifica callback, remover todos los listeners del evento
            this.events.delete(event);
            return;
        }

        // Determinar si callbackOrContext es callback o context
        const isCallback = typeof callbackOrContext === 'function';
        const targetCallback = isCallback ? callbackOrContext : null;
        const targetContext = isCallback ? context : callbackOrContext;

        // Filtrar listeners que coincidan
        const filteredListeners = listeners.filter(listener => {
            if (targetCallback && listener.callback !== targetCallback) {
                return true;
            }
            if (targetContext && listener.context !== targetContext) {
                return true;
            }
            return false;
        });

        if (filteredListeners.length === 0) {
            this.events.delete(event);
        } else {
            this.events.set(event, filteredListeners);
        }
    }
    
    /**
     * Remueve listeners wildcard
     * @param {string} pattern - Patrón wildcard
     * @param {Function|Object} callbackOrContext - Callback o contexto
     * @param {Object} context - Contexto
     */
    removeWildcardListeners(pattern, callbackOrContext, context) {
        const isCallback = typeof callbackOrContext === 'function';
        const targetCallback = isCallback ? callbackOrContext : null;
        const targetContext = isCallback ? context : callbackOrContext;
        
        this.wildcardListeners = this.wildcardListeners.filter(listener => {
            if (listener.pattern !== pattern) return true;
            if (targetCallback && listener.callback !== targetCallback) return true;
            if (targetContext && listener.context !== targetContext) return true;
            return false;
        });
    }
    
    /**
     * Remueve todos los listeners de un contexto
     * @param {Object} context - Contexto a remover
     */
    removeAllListenersForContext(context) {
        // Remover de eventos específicos
        for (const [event, listeners] of this.events.entries()) {
            const filteredListeners = listeners.filter(listener => listener.context !== context);
            
            if (filteredListeners.length === 0) {
                this.events.delete(event);
            } else {
                this.events.set(event, filteredListeners);
            }
        }
        
        // Remover de wildcards
        this.wildcardListeners = this.wildcardListeners.filter(listener => listener.context !== context);
        
        if (this.debugMode) {
            console.log(`[EventBus] Removidos todos los listeners para contexto:`, context);
        }
    }

    /**
     * Limpiar todos los eventos
     */
    clear() {
        this.events.clear();
        this.wildcardListeners = [];
        this.eventHistory = [];
        this.eventStats.clear();
        
        if (this.debugMode) {
            console.log('[EventBus] Todos los eventos limpiados');
        }
    }
    
    /**
     * Habilita o deshabilita el EventBus
     * @param {boolean} enabled - Estado del EventBus
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (this.debugMode) {
            console.log(`[EventBus] ${enabled ? 'Habilitado' : 'Deshabilitado'}`);
        }
    }
    
    /**
     * Verifica si hay listeners para un evento
     * @param {string} event - Nombre del evento
     * @returns {boolean} True si hay listeners
     */
    hasListeners(event) {
        if (this.events.has(event) && this.events.get(event).length > 0) {
            return true;
        }
        
        // Verificar wildcards
        return this.wildcardListeners.some(listener => listener.regex.test(event));
    }
    
    /**
     * Obtiene el número de listeners para un evento
     * @param {string} event - Nombre del evento (opcional)
     * @returns {number} Número de listeners
     */
    getListenerCount(event = null) {
        if (event) {
            let count = 0;
            
            if (this.events.has(event)) {
                count += this.events.get(event).length;
            }
            
            // Contar wildcards que coincidan
            count += this.wildcardListeners.filter(listener => listener.regex.test(event)).length;
            
            return count;
        }
        
        // Contar todos los listeners
        let totalCount = 0;
        for (const listeners of this.events.values()) {
            totalCount += listeners.length;
        }
        totalCount += this.wildcardListeners.length;
        
        return totalCount;
    }
    
    /**
     * Obtiene lista de eventos registrados
     * @returns {Array<string>} Lista de eventos
     */
    getRegisteredEvents() {
        const events = Array.from(this.events.keys());
        const wildcardPatterns = this.wildcardListeners.map(listener => listener.pattern);
        return [...events, ...wildcardPatterns];
    }
    
    /**
     * Obtiene historial de eventos
     * @param {number} limit - Límite de eventos (opcional)
     * @returns {Array} Historial de eventos
     */
    getEventHistory(limit = null) {
        if (limit) {
            return this.eventHistory.slice(-limit);
        }
        return [...this.eventHistory];
    }
    
    /**
     * Obtiene estadísticas de eventos
     * @param {string} event - Evento específico (opcional)
     * @returns {Object|Map} Estadísticas
     */
    getEventStats(event = null) {
        if (event) {
            return this.eventStats.get(event) || null;
        }
        return new Map(this.eventStats);
    }
    
    /**
     * Limpia el historial de eventos
     */
    clearHistory() {
        this.eventHistory = [];
        if (this.debugMode) {
            console.log('[EventBus] Historial de eventos limpiado');
        }
    }
    
    /**
     * Limpia las estadísticas de eventos
     */
    clearStats() {
        this.eventStats.clear();
        if (this.debugMode) {
            console.log('[EventBus] Estadísticas de eventos limpiadas');
        }
    }
    
    /**
     * Obtiene información de debug del EventBus
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            isEnabled: this.isEnabled,
            debugMode: this.debugMode,
            totalListeners: this.getListenerCount(),
            registeredEvents: this.getRegisteredEvents(),
            wildcardListeners: this.wildcardListeners.length,
            historySize: this.eventHistory.length,
            statsSize: this.eventStats.size,
            recentEvents: this.getEventHistory(10).map(e => ({
                event: e.event,
                timestamp: e.timestamp
            }))
        };
    }
    
    /**
     * Activar/desactivar modo debug
     * @param {boolean} enabled - Estado del modo debug
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`[EventBus] Modo debug ${enabled ? 'activado' : 'desactivado'}`);
    }
    
    /**
     * Establece el tamaño máximo del historial
     * @param {number} size - Tamaño máximo
     */
    setMaxHistorySize(size) {
        this.maxHistorySize = Math.max(1, size);
        
        // Recortar historial si es necesario
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
        }
    }
}