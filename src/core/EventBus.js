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

        listeners.forEach((listener) => {
            try {
                if (listener.context) {
                    listener.callback.call(listener.context, data);
                } else {
                    listener.callback(data);
                }
            } catch (error) {
                console.error(`[EventBus] Error ejecutando callback para evento ${event}:`, error);
            }
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
    }

    /**
     * Limpiar todos los eventos
     */
    clear() {
        this.events.clear();
    }

    /**
     * Activar/desactivar modo debug
     * @param {boolean} enabled - Estado del modo debug
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`[EventBus] Modo debug ${enabled ? 'activado' : 'desactivado'}`);
    }
}