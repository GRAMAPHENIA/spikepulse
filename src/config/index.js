/**
 * Punto de entrada principal para configuraciones de Spikepulse
 * @module Config
 */

import { configLoader } from './ConfigLoader.js';
import { ConfigValidator } from './ConfigValidator.js';

/**
 * Configuración principal del juego
 * Se carga dinámicamente según el entorno
 */
let gameConfig = null;
let physicsConfig = null;
let uiConfig = null;
let allConfigs = null;

/**
 * Inicializa todas las configuraciones
 * @returns {Promise<Object>} Configuraciones inicializadas
 */
export async function initializeConfigs() {
    try {
        console.log('🔧 Inicializando configuraciones...');
        
        // Cargar todas las configuraciones
        allConfigs = await configLoader.loadAllConfigs();
        
        // Asignar configuraciones individuales
        gameConfig = allConfigs.game;
        physicsConfig = allConfigs.physics;
        uiConfig = allConfigs.ui;
        
        // Validar configuraciones combinadas
        const validationResult = ConfigValidator.validateAllConfigs({
            game: gameConfig,
            physics: physicsConfig,
            ui: uiConfig
        });
        
        if (validationResult.errors.length > 0) {
            console.warn('⚠️ Errores de validación encontrados:', validationResult.errors);
        }
        
        console.log(`✅ Configuraciones inicializadas para entorno: ${allConfigs.environment}`);
        
        // Hacer configuraciones accesibles globalmente en desarrollo
        if (allConfigs.environment === 'development') {
            window.spikepulseConfigs = allConfigs;
            console.log('🐛 Configuraciones disponibles en window.spikepulseConfigs');
        }
        
        return allConfigs;
        
    } catch (error) {
        console.error('❌ Error inicializando configuraciones:', error);
        throw error;
    }
}

/**
 * Obtiene la configuración del juego
 * @returns {Object} Configuración del juego
 */
export function getGameConfig() {
    if (!gameConfig) {
        throw new Error('Configuraciones no inicializadas. Llama a initializeConfigs() primero.');
    }
    return gameConfig;
}

/**
 * Obtiene la configuración de física
 * @returns {Object} Configuración de física
 */
export function getPhysicsConfig() {
    if (!physicsConfig) {
        throw new Error('Configuraciones no inicializadas. Llama a initializeConfigs() primero.');
    }
    return physicsConfig;
}

/**
 * Obtiene la configuración de UI
 * @returns {Object} Configuración de UI
 */
export function getUIConfig() {
    if (!uiConfig) {
        throw new Error('Configuraciones no inicializadas. Llama a initializeConfigs() primero.');
    }
    return uiConfig;
}

/**
 * Obtiene todas las configuraciones
 * @returns {Object} Todas las configuraciones
 */
export function getAllConfigs() {
    if (!allConfigs) {
        throw new Error('Configuraciones no inicializadas. Llama a initializeConfigs() primero.');
    }
    return allConfigs;
}

/**
 * Recarga una configuración específica
 * @param {string} configType - Tipo de configuración a recargar
 * @returns {Promise<Object>} Configuración recargada
 */
export async function reloadConfig(configType) {
    try {
        const reloadedConfig = await configLoader.reloadConfig(configType);
        
        // Actualizar configuración local
        switch (configType) {
            case 'game':
                gameConfig = reloadedConfig;
                if (allConfigs) allConfigs.game = reloadedConfig;
                break;
            case 'physics':
                physicsConfig = reloadedConfig;
                if (allConfigs) allConfigs.physics = reloadedConfig;
                break;
            case 'ui':
                uiConfig = reloadedConfig;
                if (allConfigs) allConfigs.ui = reloadedConfig;
                break;
        }
        
        console.log(`🔄 Configuración ${configType} recargada`);
        return reloadedConfig;
        
    } catch (error) {
        console.error(`❌ Error recargando configuración ${configType}:`, error);
        throw error;
    }
}

/**
 * Obtiene información del estado de las configuraciones
 * @returns {Object} Estado de las configuraciones
 */
export function getConfigStatus() {
    return {
        initialized: allConfigs !== null,
        environment: allConfigs?.environment || 'unknown',
        loadedConfigs: {
            game: gameConfig !== null,
            physics: physicsConfig !== null,
            ui: uiConfig !== null
        },
        loaderStatus: configLoader.getStatus()
    };
}

/**
 * Valida una configuración personalizada
 * @param {Object} config - Configuración a validar
 * @param {string} type - Tipo de configuración
 * @returns {Object} Resultado de validación
 */
export function validateConfig(config, type) {
    return ConfigValidator.generateValidationReport(config, type);
}

/**
 * Obtiene configuración con valores por defecto seguros
 * @param {string} configType - Tipo de configuración
 * @returns {Object} Configuración con fallbacks
 */
export function getSafeConfig(configType) {
    try {
        switch (configType) {
            case 'game':
                return getGameConfig();
            case 'physics':
                return getPhysicsConfig();
            case 'ui':
                return getUIConfig();
            default:
                throw new Error(`Tipo de configuración desconocido: ${configType}`);
        }
    } catch (error) {
        console.warn(`⚠️ Usando configuración por defecto para ${configType}:`, error.message);
        
        // Devolver configuraciones por defecto básicas
        switch (configType) {
            case 'game':
                return {
                    canvas: { width: 1200, height: 600, backgroundColor: '#0F0F0F', targetFPS: 60 },
                    debug: { enabled: false }
                };
            case 'physics':
                return {
                    gravity: { normal: 0.5, inverted: -0.5 },
                    jump: { force: -10 }
                };
            case 'ui':
                return {
                    theme: 'noir',
                    language: 'es'
                };
            default:
                return {};
        }
    }
}

// Exportar también el cargador y validador para uso avanzado
export { configLoader, ConfigValidator };

// Exportar configuraciones estáticas para compatibilidad (deprecated)
export { GAME_CONFIG } from './GameConfig.js';
export { PHYSICS_CONFIG } from './PhysicsConfig.js';
export { UI_CONFIG } from './UIConfig.js';