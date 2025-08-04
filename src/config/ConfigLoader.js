/**
 * Cargador dinámico de configuraciones para Spikepulse
 * @module ConfigLoader
 */

import { ConfigValidator } from './ConfigValidator.js';

export class ConfigLoader {
    constructor() {
        this.environment = this.detectEnvironment();
        this.loadedConfigs = new Map();
        this.configCache = new Map();
        
        console.log(`🔧 ConfigLoader inicializado para entorno: ${this.environment}`);
    }

    /**
     * Detecta el entorno de ejecución
     * @returns {string} Entorno detectado ('development', 'production', 'test')
     */
    detectEnvironment() {
        // Detectar por hostname
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            
            if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.')) {
                return 'development';
            }
            
            if (hostname.includes('test') || hostname.includes('staging')) {
                return 'test';
            }
        }

        // Detectar por parámetros URL
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const envParam = urlParams.get('env');
            if (envParam) {
                return envParam;
            }
        }

        // Detectar por variable global (si está definida)
        if (typeof window !== 'undefined' && window.SPIKEPULSE_ENV) {
            return window.SPIKEPULSE_ENV;
        }

        // Por defecto, asumir producción
        return 'production';
    }

    /**
     * Carga configuración base del juego
     * @returns {Promise<Object>} Configuración del juego
     */
    async loadGameConfig() {
        const cacheKey = `game-${this.environment}`;
        
        if (this.configCache.has(cacheKey)) {
            return this.configCache.get(cacheKey);
        }

        try {
            // Importar configuración base
            const { GAME_CONFIG } = await import('./GameConfig.js');
            
            // Aplicar overrides específicos del entorno
            const envConfig = await this.loadEnvironmentOverrides('game');
            const mergedConfig = this.mergeConfigs(GAME_CONFIG, envConfig);
            
            // Validar configuración
            const validatedConfig = ConfigValidator.validateGameConfig(mergedConfig);
            
            // Cachear resultado
            this.configCache.set(cacheKey, validatedConfig);
            this.loadedConfigs.set('game', validatedConfig);
            
            console.log(`✅ Configuración del juego cargada para ${this.environment}`);
            return validatedConfig;
            
        } catch (error) {
            console.error('❌ Error cargando configuración del juego:', error);
            throw error;
        }
    }

    /**
     * Carga configuración de física
     * @returns {Promise<Object>} Configuración de física
     */
    async loadPhysicsConfig() {
        const cacheKey = `physics-${this.environment}`;
        
        if (this.configCache.has(cacheKey)) {
            return this.configCache.get(cacheKey);
        }

        try {
            const { PHYSICS_CONFIG } = await import('./PhysicsConfig.js');
            const envConfig = await this.loadEnvironmentOverrides('physics');
            const mergedConfig = this.mergeConfigs(PHYSICS_CONFIG, envConfig);
            const validatedConfig = ConfigValidator.validatePhysicsConfig(mergedConfig);
            
            this.configCache.set(cacheKey, validatedConfig);
            this.loadedConfigs.set('physics', validatedConfig);
            
            console.log(`✅ Configuración de física cargada para ${this.environment}`);
            return validatedConfig;
            
        } catch (error) {
            console.error('❌ Error cargando configuración de física:', error);
            throw error;
        }
    }

    /**
     * Carga configuración de UI
     * @returns {Promise<Object>} Configuración de UI
     */
    async loadUIConfig() {
        const cacheKey = `ui-${this.environment}`;
        
        if (this.configCache.has(cacheKey)) {
            return this.configCache.get(cacheKey);
        }

        try {
            const { UI_CONFIG } = await import('./UIConfig.js');
            const envConfig = await this.loadEnvironmentOverrides('ui');
            const mergedConfig = this.mergeConfigs(UI_CONFIG, envConfig);
            const validatedConfig = ConfigValidator.validateUIConfig(mergedConfig);
            
            this.configCache.set(cacheKey, validatedConfig);
            this.loadedConfigs.set('ui', validatedConfig);
            
            console.log(`✅ Configuración de UI cargada para ${this.environment}`);
            return validatedConfig;
            
        } catch (error) {
            console.error('❌ Error cargando configuración de UI:', error);
            throw error;
        }
    }

    /**
     * Carga todas las configuraciones
     * @returns {Promise<Object>} Todas las configuraciones cargadas
     */
    async loadAllConfigs() {
        try {
            const [gameConfig, physicsConfig, uiConfig] = await Promise.all([
                this.loadGameConfig(),
                this.loadPhysicsConfig(),
                this.loadUIConfig()
            ]);

            const allConfigs = {
                game: gameConfig,
                physics: physicsConfig,
                ui: uiConfig,
                environment: this.environment,
                loadedAt: new Date().toISOString()
            };

            console.log('🎯 Todas las configuraciones cargadas exitosamente');
            return allConfigs;
            
        } catch (error) {
            console.error('❌ Error cargando configuraciones:', error);
            throw error;
        }
    }

    /**
     * Carga overrides específicos del entorno
     * @param {string} configType - Tipo de configuración
     * @returns {Promise<Object>} Overrides del entorno
     */
    async loadEnvironmentOverrides(configType) {
        try {
            // Intentar cargar archivo de override específico del entorno
            const overridePath = `./environments/${this.environment}/${configType}.js`;
            const override = await import(overridePath);
            return override.default || override;
        } catch (error) {
            // No hay overrides para este entorno/tipo, devolver objeto vacío
            return {};
        }
    }

    /**
     * Combina configuraciones base con overrides
     * @param {Object} baseConfig - Configuración base
     * @param {Object} overrideConfig - Configuración de override
     * @returns {Object} Configuración combinada
     */
    mergeConfigs(baseConfig, overrideConfig) {
        if (!overrideConfig || Object.keys(overrideConfig).length === 0) {
            return { ...baseConfig };
        }

        return this.deepMerge(baseConfig, overrideConfig);
    }

    /**
     * Realiza merge profundo de objetos
     * @param {Object} target - Objeto objetivo
     * @param {Object} source - Objeto fuente
     * @returns {Object} Objeto combinado
     */
    deepMerge(target, source) {
        const result = { ...target };

        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (this.isObject(source[key]) && this.isObject(result[key])) {
                    result[key] = this.deepMerge(result[key], source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }

        return result;
    }

    /**
     * Verifica si un valor es un objeto
     * @param {*} value - Valor a verificar
     * @returns {boolean} True si es un objeto
     */
    isObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    /**
     * Recarga una configuración específica
     * @param {string} configType - Tipo de configuración a recargar
     * @returns {Promise<Object>} Configuración recargada
     */
    async reloadConfig(configType) {
        // Limpiar cache
        const cacheKeys = Array.from(this.configCache.keys()).filter(key => key.startsWith(configType));
        cacheKeys.forEach(key => this.configCache.delete(key));

        // Recargar configuración
        switch (configType) {
            case 'game':
                return await this.loadGameConfig();
            case 'physics':
                return await this.loadPhysicsConfig();
            case 'ui':
                return await this.loadUIConfig();
            default:
                throw new Error(`Tipo de configuración desconocido: ${configType}`);
        }
    }

    /**
     * Obtiene configuración cargada
     * @param {string} configType - Tipo de configuración
     * @returns {Object|null} Configuración o null si no está cargada
     */
    getLoadedConfig(configType) {
        return this.loadedConfigs.get(configType) || null;
    }

    /**
     * Verifica si una configuración está cargada
     * @param {string} configType - Tipo de configuración
     * @returns {boolean} True si está cargada
     */
    isConfigLoaded(configType) {
        return this.loadedConfigs.has(configType);
    }

    /**
     * Obtiene información del estado del cargador
     * @returns {Object} Estado del cargador
     */
    getStatus() {
        return {
            environment: this.environment,
            loadedConfigs: Array.from(this.loadedConfigs.keys()),
            cacheSize: this.configCache.size,
            lastLoadTime: this.lastLoadTime || null
        };
    }

    /**
     * Limpia toda la cache de configuraciones
     */
    clearCache() {
        this.configCache.clear();
        console.log('🧹 Cache de configuraciones limpiada');
    }
}

// Instancia singleton del cargador
export const configLoader = new ConfigLoader();