/**
 * Utilidades para manejo de configuraciones
 * @module ConfigUtils
 */

export class ConfigUtils {
    /**
     * Obtiene un valor anidado de configuración usando notación de puntos
     * @param {Object} config - Objeto de configuración
     * @param {string} path - Ruta usando notación de puntos (ej: 'player.physics.gravity')
     * @param {*} defaultValue - Valor por defecto si no se encuentra
     * @returns {*} Valor encontrado o valor por defecto
     */
    static getValue(config, path, defaultValue = null) {
        if (!config || typeof config !== 'object') {
            return defaultValue;
        }

        const keys = path.split('.');
        let current = config;

        for (const key of keys) {
            if (current === null || current === undefined || typeof current !== 'object') {
                return defaultValue;
            }
            current = current[key];
        }

        return current !== undefined ? current : defaultValue;
    }

    /**
     * Establece un valor anidado de configuración usando notación de puntos
     * @param {Object} config - Objeto de configuración
     * @param {string} path - Ruta usando notación de puntos
     * @param {*} value - Valor a establecer
     * @returns {Object} Configuración modificada
     */
    static setValue(config, path, value) {
        if (!config || typeof config !== 'object') {
            config = {};
        }

        const keys = path.split('.');
        let current = config;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }

        current[keys[keys.length - 1]] = value;
        return config;
    }

    /**
     * Combina múltiples configuraciones con prioridad
     * @param {...Object} configs - Configuraciones a combinar (orden de prioridad)
     * @returns {Object} Configuración combinada
     */
    static merge(...configs) {
        const result = {};

        for (const config of configs) {
            if (config && typeof config === 'object') {
                this.deepMerge(result, config);
            }
        }

        return result;
    }

    /**
     * Realiza merge profundo de configuraciones
     * @param {Object} target - Objeto objetivo
     * @param {Object} source - Objeto fuente
     * @returns {Object} Objeto objetivo modificado
     */
    static deepMerge(target, source) {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (this.isObject(source[key])) {
                    if (!target[key] || !this.isObject(target[key])) {
                        target[key] = {};
                    }
                    this.deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }

    /**
     * Verifica si un valor es un objeto plano
     * @param {*} value - Valor a verificar
     * @returns {boolean} True si es un objeto plano
     */
    static isObject(value) {
        return value !== null && 
               typeof value === 'object' && 
               !Array.isArray(value) && 
               !(value instanceof Date) && 
               !(value instanceof RegExp);
    }

    /**
     * Clona profundamente una configuración
     * @param {Object} config - Configuración a clonar
     * @returns {Object} Configuración clonada
     */
    static deepClone(config) {
        if (config === null || typeof config !== 'object') {
            return config;
        }

        if (config instanceof Date) {
            return new Date(config.getTime());
        }

        if (config instanceof Array) {
            return config.map(item => this.deepClone(item));
        }

        if (typeof config === 'object') {
            const cloned = {};
            for (const key in config) {
                if (config.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(config[key]);
                }
            }
            return cloned;
        }

        return config;
    }

    /**
     * Aplana una configuración anidada a notación de puntos
     * @param {Object} config - Configuración a aplanar
     * @param {string} prefix - Prefijo para las claves
     * @returns {Object} Configuración aplanada
     */
    static flatten(config, prefix = '') {
        const flattened = {};

        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                const newKey = prefix ? `${prefix}.${key}` : key;
                
                if (this.isObject(config[key])) {
                    Object.assign(flattened, this.flatten(config[key], newKey));
                } else {
                    flattened[newKey] = config[key];
                }
            }
        }

        return flattened;
    }

    /**
     * Convierte una configuración aplanada de vuelta a estructura anidada
     * @param {Object} flatConfig - Configuración aplanada
     * @returns {Object} Configuración anidada
     */
    static unflatten(flatConfig) {
        const result = {};

        for (const key in flatConfig) {
            if (flatConfig.hasOwnProperty(key)) {
                this.setValue(result, key, flatConfig[key]);
            }
        }

        return result;
    }

    /**
     * Compara dos configuraciones y devuelve las diferencias
     * @param {Object} config1 - Primera configuración
     * @param {Object} config2 - Segunda configuración
     * @returns {Object} Diferencias encontradas
     */
    static diff(config1, config2) {
        const differences = {
            added: {},
            removed: {},
            changed: {}
        };

        const flat1 = this.flatten(config1);
        const flat2 = this.flatten(config2);

        // Encontrar claves añadidas y cambiadas
        for (const key in flat2) {
            if (!(key in flat1)) {
                this.setValue(differences.added, key, flat2[key]);
            } else if (flat1[key] !== flat2[key]) {
                this.setValue(differences.changed, key, {
                    from: flat1[key],
                    to: flat2[key]
                });
            }
        }

        // Encontrar claves removidas
        for (const key in flat1) {
            if (!(key in flat2)) {
                this.setValue(differences.removed, key, flat1[key]);
            }
        }

        return differences;
    }

    /**
     * Valida que una configuración tenga todas las claves requeridas
     * @param {Object} config - Configuración a validar
     * @param {Array<string>} requiredKeys - Claves requeridas en notación de puntos
     * @returns {Object} Resultado de validación
     */
    static validateRequired(config, requiredKeys) {
        const missing = [];
        const present = [];

        for (const key of requiredKeys) {
            const value = this.getValue(config, key);
            if (value === null || value === undefined) {
                missing.push(key);
            } else {
                present.push(key);
            }
        }

        return {
            isValid: missing.length === 0,
            missing,
            present,
            missingCount: missing.length,
            presentCount: present.length
        };
    }

    /**
     * Genera un resumen de una configuración
     * @param {Object} config - Configuración a resumir
     * @returns {Object} Resumen de la configuración
     */
    static summarize(config) {
        const flattened = this.flatten(config);
        const summary = {
            totalKeys: Object.keys(flattened).length,
            structure: {},
            types: {},
            depth: 0
        };

        // Analizar estructura
        for (const key in flattened) {
            const parts = key.split('.');
            summary.depth = Math.max(summary.depth, parts.length);
            
            const topLevel = parts[0];
            if (!summary.structure[topLevel]) {
                summary.structure[topLevel] = 0;
            }
            summary.structure[topLevel]++;

            // Analizar tipos
            const type = typeof flattened[key];
            if (!summary.types[type]) {
                summary.types[type] = 0;
            }
            summary.types[type]++;
        }

        return summary;
    }

    /**
     * Convierte una configuración a formato JSON con formato legible
     * @param {Object} config - Configuración a convertir
     * @param {number} indent - Espacios de indentación
     * @returns {string} JSON formateado
     */
    static toJSON(config, indent = 2) {
        return JSON.stringify(config, null, indent);
    }

    /**
     * Parsea una configuración desde JSON con manejo de errores
     * @param {string} jsonString - String JSON a parsear
     * @returns {Object} Configuración parseada o null si hay error
     */
    static fromJSON(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Error parseando configuración JSON:', error);
            return null;
        }
    }
}