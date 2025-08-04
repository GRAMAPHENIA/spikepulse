/**
 * Configuración principal del juego Spikepulse
 * @module GameConfig
 */

export const GAME_CONFIG = {
    // Configuración del canvas
    canvas: {
        width: 1200,
        height: 600,
        backgroundColor: '#0F0F0F',
        targetFPS: 60
    },
    
    // Configuración del jugador
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
        visual: {
            size: { width: 30, height: 30 },
            color: '#FFD700',
            glowColor: '#FFD700',
            glowIntensity: 20,
            trailLength: 10
        },
        abilities: {
            maxJumps: 2,
            dashCooldown: 1000,
            gravityToggleCooldown: 500
        },
        startPosition: { x: 100, y: 300 }
    },
    
    // Configuración del mundo
    world: {
        bounds: {
            left: 0,
            right: 5000,
            top: -500,
            bottom: 900
        },
        camera: {
            offsetX: 600,
            offsetY: 300,
            smoothing: 0.15,
            bounds: {
                minX: 0,
                maxX: 4400,
                minY: -200,
                maxY: 500
            }
        },
        surface: {
            groundY: 370,
            ceilingY: 30,
            thickness: 30,
            color: '#333333'
        },
        scrollSpeed: 2
    },
    
    // Configuración de obstáculos
    obstacles: {
        spacing: { min: 150, max: 300 },
        types: ['spike', 'wall', 'moving', 'rotating'],
        colors: {
            spike: '#FF6B6B',
            wall: '#666666',
            moving: '#9F7AEA',
            rotating: '#FF8C42'
        },
        difficulty: {
            baseSpeed: 2,
            speedIncrease: 0.1,
            maxSpeed: 8,
            densityIncrease: 0.05
        },
        generation: {
            lookAhead: 2000,
            cleanupDistance: 500
        }
    },
    
    // Configuración del renderizado
    renderer: {
        backgroundColor: '#0F0F0F',
        showDebug: false,
        enableEffects: true,
        enableParticles: true,
        layers: {
            background: 0,
            world: 1,
            obstacles: 2,
            player: 3,
            effects: 4,
            ui: 5
        },
        optimization: {
            enableDirtyRegions: true,
            enableObjectPooling: true,
            maxParticles: 100
        }
    },
    
    // Configuración de la interfaz de usuario
    ui: {
        theme: 'noir',
        language: 'es',
        showFPS: false,
        hudElements: ['distance', 'jumps', 'dash', 'gravity'],
        colors: {
            primary: '#FFD700',
            secondary: '#FF6B6B',
            accent: '#9F7AEA',
            text: '#FFFFFF',
            background: '#000000',
            overlay: 'rgba(0, 0, 0, 0.8)'
        },
        fonts: {
            primary: 'Orbitron, monospace',
            secondary: 'Rajdhani, sans-serif'
        },
        animations: {
            transitionDuration: 300,
            pulseSpeed: 2000,
            glowIntensity: 0.8
        }
    },
    
    // Configuración de entrada
    input: {
        keyboard: {
            jump: ['Space', 'ArrowUp', 'KeyW'],
            dash: ['ShiftLeft', 'ShiftRight'],
            gravityToggle: ['ControlLeft', 'ControlRight'],
            moveLeft: ['ArrowLeft', 'KeyA'],
            moveRight: ['ArrowRight', 'KeyD'],
            pause: ['Escape', 'KeyP']
        },
        touch: {
            enabled: true,
            jumpZone: { x: 0, y: 0, width: 0.6, height: 1 },
            dashZone: { x: 0.6, y: 0, width: 0.2, height: 1 },
            gravityZone: { x: 0.8, y: 0, width: 0.2, height: 1 }
        },
        mouse: {
            enabled: true,
            jumpButton: 0, // Left click
            dashButton: 2  // Right click
        }
    },
    
    // Configuración de audio (para futuras implementaciones)
    audio: {
        enabled: true,
        masterVolume: 0.7,
        sfxVolume: 0.8,
        musicVolume: 0.5,
        sounds: {
            jump: 'assets/sounds/jump.wav',
            dash: 'assets/sounds/dash.wav',
            hit: 'assets/sounds/hit.wav',
            gravityToggle: 'assets/sounds/gravity.wav'
        }
    },
    
    // Configuración de desarrollo y debugging
    debug: {
        enabled: false,
        showHitboxes: false,
        showFPS: false,
        showPerformance: false,
        logLevel: 'info', // 'debug', 'info', 'warn', 'error'
        enableConsoleCommands: true
    },
    
    // Configuración de persistencia
    storage: {
        prefix: 'spikepulse_',
        keys: {
            bestDistance: 'best_distance',
            settings: 'settings',
            stats: 'stats'
        },
        autoSave: true,
        saveInterval: 5000 // ms
    }
};

// Configuración específica para desarrollo
export const DEV_CONFIG = {
    ...GAME_CONFIG,
    debug: {
        ...GAME_CONFIG.debug,
        enabled: true,
        showHitboxes: true,
        showFPS: true,
        logLevel: 'debug'
    },
    renderer: {
        ...GAME_CONFIG.renderer,
        showDebug: true
    }
};

// Configuración específica para producción
export const PROD_CONFIG = {
    ...GAME_CONFIG,
    debug: {
        ...GAME_CONFIG.debug,
        enabled: false,
        enableConsoleCommands: false
    }
};