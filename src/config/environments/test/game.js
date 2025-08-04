/**
 * Configuración específica de testing para el juego
 */

export default {
    // Debug habilitado pero menos verboso que desarrollo
    debug: {
        enabled: true,
        showHitboxes: false,
        showFPS: false,
        showPerformance: false,
        logLevel: 'warn',
        enableConsoleCommands: true
    },
    
    // Renderizado simplificado para tests
    renderer: {
        showDebug: false,
        enableEffects: false, // Deshabilitado para tests más rápidos
        enableParticles: false, // Deshabilitado para tests más rápidos
        optimization: {
            enableDirtyRegions: false,
            enableObjectPooling: false,
            maxParticles: 0
        }
    },
    
    // Canvas con configuración mínima
    canvas: {
        width: 800, // Más pequeño para tests
        height: 400,
        backgroundColor: '#000000',
        targetFPS: 30 // FPS más bajo para tests
    },
    
    // Configuración de jugador predecible para tests
    player: {
        physics: {
            gravity: 0.5,
            jumpForce: -10,
            maxSpeed: 8,
            friction: 0.85,
            dashForce: 8,
            dashDuration: 200,
            gravityInversionForce: 0.5
        },
        abilities: {
            maxJumps: 2,
            dashCooldown: 1000,
            gravityToggleCooldown: 500
        },
        startPosition: { x: 100, y: 200 }
    },
    
    // Mundo simplificado para tests
    world: {
        bounds: {
            left: 0,
            right: 2000, // Mundo más pequeño
            top: -200,
            bottom: 600
        },
        camera: {
            smoothing: 0.1
        }
    },
    
    // Obstáculos con configuración determinística
    obstacles: {
        spacing: { min: 200, max: 200 }, // Espaciado fijo para tests
        difficulty: {
            baseSpeed: 2,
            speedIncrease: 0,
            maxSpeed: 2,
            densityIncrease: 0
        }
    },
    
    // Audio deshabilitado para tests
    audio: {
        enabled: false,
        masterVolume: 0,
        sfxVolume: 0,
        musicVolume: 0
    },
    
    // Almacenamiento con prefijo de test
    storage: {
        prefix: 'spikepulse_test_',
        autoSave: false, // Deshabilitado para tests
        saveInterval: 999999
    }
};