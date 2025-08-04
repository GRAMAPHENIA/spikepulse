/**
 * Configuración específica de desarrollo para el juego
 */

export default {
    // Configuración de debug habilitada en desarrollo
    debug: {
        enabled: true,
        showHitboxes: true,
        showFPS: true,
        showPerformance: true,
        logLevel: 'debug',
        enableConsoleCommands: true
    },
    
    // Renderizado con herramientas de debug
    renderer: {
        showDebug: true,
        enableEffects: true,
        enableParticles: true,
        optimization: {
            enableDirtyRegions: false, // Deshabilitado para debugging
            enableObjectPooling: false, // Deshabilitado para debugging
            maxParticles: 200 // Más partículas para testing
        }
    },
    
    // Canvas con configuración de desarrollo
    canvas: {
        backgroundColor: '#0F0F0F', // Fondo más claro para debug
        targetFPS: 60
    },
    
    // Configuración de jugador más permisiva para testing
    player: {
        physics: {
            gravity: 0.3, // Gravedad más suave para testing
            jumpForce: -12, // Salto más fuerte para testing
            dashDuration: 300, // Dash más largo para testing
            dashCooldown: 500 // Cooldown más corto para testing
        },
        abilities: {
            maxJumps: 3, // Salto triple en desarrollo
            dashCooldown: 500,
            gravityToggleCooldown: 200
        }
    },
    
    // Mundo con configuración de desarrollo
    world: {
        camera: {
            smoothing: 0.05 // Cámara más responsiva para debugging
        }
    },
    
    // Obstáculos con generación más predecible
    obstacles: {
        difficulty: {
            baseSpeed: 1, // Velocidad más lenta para testing
            speedIncrease: 0.05,
            maxSpeed: 4,
            densityIncrease: 0.02
        }
    },
    
    // Configuración de almacenamiento para desarrollo
    storage: {
        prefix: 'spikepulse_dev_',
        autoSave: true,
        saveInterval: 2000 // Guardado más frecuente
    }
};