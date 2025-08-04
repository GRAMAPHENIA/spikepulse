/**
 * Configuración de persistencia para Spikepulse
 * @module PersistenceConfig
 */

export const PERSISTENCE_CONFIG = {
    // Configuración general
    enabled: true,
    autoSave: true,
    saveInterval: 5000, // 5 segundos
    maxHistorySize: 100,
    
    // Claves de localStorage
    keys: {
        gameState: 'spikepulse-game-state',
        settings: 'spikepulse-settings',
        statistics: 'spikepulse-statistics',
        achievements: 'spikepulse-achievements'
    },
    
    // Configuración de compresión
    compression: {
        enabled: false, // Deshabilitado por simplicidad
        threshold: 10000 // Comprimir si el estado es mayor a 10KB
    },
    
    // Configuración de backup
    backup: {
        enabled: true,
        maxBackups: 3,
        backupInterval: 300000 // 5 minutos
    },
    
    // Configuración de migración
    migration: {
        enabled: true,
        currentVersion: '1.0.0',
        migrations: {
            '0.9.0': (state) => {
                // Migración de ejemplo de versión anterior
                if (!state.meta) {
                    state.meta = {
                        version: '1.0.0',
                        created: Date.now(),
                        lastSaved: Date.now()
                    };
                }
                return state;
            }
        }
    },
    
    // Configuración de validación
    validation: {
        enabled: true,
        strictMode: false, // Si es true, rechaza estados inválidos
        requiredFields: [
            'player',
            'world',
            'stats',
            'ui',
            'settings',
            'meta'
        ]
    },
    
    // Configuración de debug
    debug: {
        logSaves: true,
        logLoads: true,
        logErrors: true,
        logValidation: false
    }
};

/**
 * Configuración específica para diferentes entornos
 */
export const ENVIRONMENT_CONFIGS = {
    development: {
        ...PERSISTENCE_CONFIG,
        debug: {
            logSaves: true,
            logLoads: true,
            logErrors: true,
            logValidation: true
        },
        saveInterval: 2000, // Guardar más frecuentemente en desarrollo
        autoSave: true
    },
    
    production: {
        ...PERSISTENCE_CONFIG,
        debug: {
            logSaves: false,
            logLoads: false,
            logErrors: true,
            logValidation: false
        },
        saveInterval: 10000, // Guardar menos frecuentemente en producción
        compression: {
            enabled: true,
            threshold: 5000
        }
    },
    
    testing: {
        ...PERSISTENCE_CONFIG,
        enabled: false, // Deshabilitar persistencia en tests
        autoSave: false,
        debug: {
            logSaves: false,
            logLoads: false,
            logErrors: false,
            logValidation: false
        }
    }
};

/**
 * Obtiene la configuración para el entorno actual
 * @param {string} environment - Entorno (development, production, testing)
 * @returns {Object} Configuración de persistencia
 */
export function getPersistenceConfig(environment = 'development') {
    return ENVIRONMENT_CONFIGS[environment] || PERSISTENCE_CONFIG;
}

/**
 * Configuración de campos que deben persistirse
 */
export const PERSISTENT_FIELDS = {
    // Campos que siempre se guardan
    always: [
        'stats.bestDistance',
        'stats.bestScore',
        'stats.totalPlayTime',
        'stats.gamesPlayed',
        'stats.deaths',
        'stats.coinsCollected',
        'settings',
        'meta'
    ],
    
    // Campos que se guardan solo durante el juego
    session: [
        'player.position',
        'player.velocity',
        'world.camera',
        'world.obstacles',
        'world.coins',
        'stats.distance',
        'stats.score',
        'stats.jumps',
        'stats.dashes',
        'stats.coins'
    ],
    
    // Campos que nunca se guardan
    never: [
        'meta.sessionId',
        'world.powerups', // Los powerups son temporales
        'player.invulnerable',
        'player.invulnerabilityTime'
    ]
};

/**
 * Configuración de validadores por defecto
 */
export const DEFAULT_VALIDATORS = {
    'player.position': (value) => {
        if (!value || typeof value !== 'object') {
            return { valid: false, error: 'Position must be an object' };
        }
        
        if (typeof value.x !== 'number' || typeof value.y !== 'number') {
            return { valid: false, error: 'Position coordinates must be numbers' };
        }
        
        return { valid: true };
    },
    
    'stats': (value) => {
        if (!value || typeof value !== 'object') {
            return { valid: false, error: 'Stats must be an object' };
        }
        
        const numericFields = ['distance', 'score', 'jumps', 'dashes', 'coins'];
        
        for (const field of numericFields) {
            if (value.hasOwnProperty(field) && (typeof value[field] !== 'number' || value[field] < 0)) {
                return { valid: false, error: `${field} must be a non-negative number` };
            }
        }
        
        return { valid: true };
    },
    
    'settings.volume': (value) => {
        if (!value || typeof value !== 'object') {
            return { valid: false, error: 'Volume settings must be an object' };
        }
        
        const volumeFields = ['master', 'sfx', 'music'];
        
        for (const field of volumeFields) {
            if (value.hasOwnProperty(field)) {
                const vol = value[field];
                if (typeof vol !== 'number' || vol < 0 || vol > 1) {
                    return { valid: false, error: `${field} volume must be between 0 and 1` };
                }
            }
        }
        
        return { valid: true };
    }
};