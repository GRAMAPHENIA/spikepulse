/**
 * Configuración específica de producción para el juego
 */

export default {
    // Debug deshabilitado en producción
    debug: {
        enabled: false,
        showHitboxes: false,
        showFPS: false,
        showPerformance: false,
        logLevel: 'error',
        enableConsoleCommands: false
    },
    
    // Renderizado optimizado para producción
    renderer: {
        showDebug: false,
        enableEffects: true,
        enableParticles: true,
        optimization: {
            enableDirtyRegions: true,
            enableObjectPooling: true,
            maxParticles: 50 // Menos partículas para mejor rendimiento
        }
    },
    
    // Configuración de almacenamiento para producción
    storage: {
        prefix: 'spikepulse_',
        autoSave: true,
        saveInterval: 10000 // Guardado menos frecuente
    },
    
    // Configuración de audio optimizada
    audio: {
        enabled: true,
        masterVolume: 0.7,
        sfxVolume: 0.8,
        musicVolume: 0.5
    }
};