/**
 * EventBus - Sistema de comunicación entre módulos
 * @module EventBus
 */

export class EventBus {
    /**
     * Crea una nueva instancia del EventBus
     */
    constructor() {
        this.events = new Map();
        this.debugMode = false;
    }

    /**
     * Suscribirse a un evento
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función callback
     * @param {Object} context - Contexto para el callback (opcional)
     */
    on(event, callback, context = null) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        
        this.events.get(event).push({
            callback,
            context,
            once: false
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
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        
        this.events.get(event).push({
            callback,
            context,
            once: true
        });

        if (this.debugMode) {
            console.log(`[EventBus] Suscrito a evento (una vez): ${event}`);
        }
    }

    /**
     * Emitir un evento
     * @param {string} event - Nombre del evento
     * @param {*} data - Datos a enviar con el evento
     */
    emit(event, data = null) {
        if (!this.events.has(event)) {
            if (this.debugMode) {
                console.warn(`[EventBus] No hay listeners para el evento: ${event}`);
            }
            return;
        }

        const listeners = this.events.get(event);
        const toRemove = [];

        listeners.forEach((listener, index) => {
            try {
                if (listener.context) {
                    listener.callback.call(listener.context, data);
                } else {
                    listener.callback(data);
                }

                // Marcar para remover si es un listener 'once'
                if (listener.once) {
                    toRemove.push(index);
                }
            } catch (error) {
                console.error(`[EventBus] Error ejecutando callback para evento ${event}:`, error);
            }
        });

        // Remover listeners 'once' en orden inverso para mantener índices
        toRemove.reverse().forEach(index => {
            listeners.splice(index, 1);
        });

        if (this.debugMode) {
            console.log(`[EventBus] Evento emitido: ${event}`, data);
        }
    }

    /**
     * Desuscribirse de un evento
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función callback a remover (opcional)
     * @param {Object} context - Contexto del callback (opcional)
     */
    off(event, callback = null, context = null) {
        if (!this.events.has(event)) {
            return;
        }

        const listeners = this.events.get(event);

        if (!callback) {
            // Si no se especifica callback, remover todos los listeners del evento
            this.events.delete(event);
            if (this.debugMode) {
                console.log(`[EventBus] Removidos todos los listeners del evento: ${event}`);
            }
            return;
        }

        // Filtrar listeners que coincidan con callback y contexto
        const filteredListeners = listeners.filter(listener => {
            const callbackMatch = listener.callback !== callback;
            const contextMatch = context === null || listener.context === context;
            return callbackMatch || !contextMatch;
        });

        if (filteredListeners.length === 0) {
            this.events.delete(event);
        } else {
            this.events.set(event, filteredListeners);
        }

        if (this.debugMode) {
            console.log(`[EventBus] Desuscrito del evento: ${event}`);
        }
    }

    /**
     * Remover todos los listeners de un contexto específico
     * @param {Object} context - Contexto a limpiar
     */
    offContext(context) {
        this.events.forEach((listeners, event) => {
            const filteredListeners = listeners.filter(listener => listener.context !== context);
            
            if (filteredListeners.length === 0) {
                this.events.delete(event);
            } else {
                this.events.set(event, filteredListeners);
            }
        });

        if (this.debugMode) {
            console.log(`[EventBus] Removidos todos los listeners del contexto:`, context);
        }
    }

    /**
     * Obtener todos los eventos registrados
     * @returns {Array} Lista de nombres de eventos
     */
    getEvents() {
        return Array.from(this.events.keys());
    }

    /**
     * Obtener el número de listeners para un evento
     * @param {string} event - Nombre del evento
     * @returns {number} Número de listeners
     */
    getListenerCount(event) {
        return this.events.has(event) ? this.events.get(event).length : 0;
    }

    /**
     * Limpiar todos los eventos
     */
    clear() {
        this.events.clear();
        if (this.debugMode) {
            console.log(`[EventBus] Todos los eventos limpiados`);
        }
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
     * Obtener estadísticas del EventBus
     * @returns {Object} Estadísticas
     */
    getStats() {
        const stats = {
            totalEvents: this.events.size,
            totalListeners: 0,
            events: {}
        };

        this.events.forEach((listeners, event) => {
            stats.totalListeners += listeners.length;
            stats.events[event] = listeners.length;
        });

        return stats;
    }
}