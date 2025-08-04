/**
 * Sistema de eventos para Spikepulse
 * @module EventBus
 */

export class EventBus {
    /**
     * Crea una nueva instancia del bus de eventos
     */
    constructor() {
        this.events = new Map();
        this.maxListeners = 100;
        
        console.log('📡 EventBus creado');
    }
    
    /**
     * Registra un listener para un evento
     * @param {string} eventName - Nombre del evento
     * @param {Function} callback - Función callback
     * @param {Object} context - Contexto opcional
     */
    on(eventName, callback, context = null) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        
        const listeners = this.events.get(eventName);
        
        // Verificar límite de listeners
        if (listeners.length >= this.maxListeners) {
            console.warn(`⚠️ Máximo número de listeners alcanzado para evento: ${eventName}`);
            return;
        }
        
        listeners.push({ callback, context });
    }
    
    /**
     * Remueve un listener de un evento
     * @param {string} eventName - Nombre del evento
     * @param {Function|Object} callbackOrContext - Callback o contexto a remover
     */
    off(eventName, callbackOrContext) {
        if (eventName === '*' && callbackOrContext) {
            // Remover todos los listeners de un contexto específico
            for (const [name, listeners] of this.events.entries()) {
                this.events.set(name, listeners.filter(listener => 
                    listener.context !== callbackOrContext
                ));
            }
            return;
        }
        
        if (!this.events.has(eventName)) return;
        
        const listeners = this.events.get(eventName);
        
        if (typeof callbackOrContext === 'function') {
            // Remover por callback
            this.events.set(eventName, listeners.filter(listener => 
                listener.callback !== callbackOrContext
            ));
        } else {
            // Remover por contexto
            this.events.set(eventName, listeners.filter(listener => 
                listener.context !== callbackOrContext
            ));
        }
    }
    
    /**
     * Emite un evento
     * @param {string} eventName - Nombre del evento
     * @param {*} data - Datos del evento
     */
    emit(eventName, data = null) {
        if (!this.events.has(eventName)) return;
        
        const listeners = this.events.get(eventName);
        
        // Ejecutar todos los listeners
        listeners.forEach(listener => {
            try {
                if (listener.context) {
                    listener.callback.call(listener.context, data);
                } else {
                    listener.callback(data);
                }
            } catch (error) {
                console.error(`❌ Error en listener para evento '${eventName}':`, error);
            }
        });
    }
    
    /**
     * Registra un listener que se ejecuta solo una vez
     * @param {string} eventName - Nombre del evento
     * @param {Function} callback - Función callback
     * @param {Object} context - Contexto opcional
     */
    once(eventName, callback, context = null) {
        const onceCallback = (data) => {
            callback.call(context, data);
            this.off(eventName, onceCallback);
        };
        
        this.on(eventName, onceCallback, context);
    }
    
    /**
     * Obtiene el número de listeners para un evento
     * @param {string} eventName - Nombre del evento
     * @returns {number} Número de listeners
     */
    listenerCount(eventName) {
        if (!this.events.has(eventName)) return 0;
        return this.events.get(eventName).length;
    }
    
    /**
     * Obtiene todos los nombres de eventos registrados
     * @returns {Array} Array de nombres de eventos
     */
    eventNames() {
        return Array.from(this.events.keys());
    }
    
    /**
     * Limpia todos los listeners
     */
    removeAllListeners() {
        this.events.clear();
        console.log('🧹 Todos los listeners removidos');
    }
    
    /**
     * Obtiene información de debug
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        const info = {};
        for (const [eventName, listeners] of this.events.entries()) {
            info[eventName] = listeners.length;
        }
        return {
            totalEvents: this.events.size,
            totalListeners: Array.from(this.events.values()).reduce((sum, listeners) => sum + listeners.length, 0),
            eventCounts: info
        };
    }
}