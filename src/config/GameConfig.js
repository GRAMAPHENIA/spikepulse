/**
 * Configuración principal del juego Spikepulse
 * @module GameConfig
 */

export const GAME_CONFIG = {
    // Configuración del canvas
    canvas: {
        width: 800,
        height: 400,
        backgroundColor: '#0F0F0F'
    },

    // Configuración del jugador
    player: {
        size: { width: 30, height: 30 },
        startPosition: { x: 100, y: 300 },
        physics: {
            gravity: 0.5,
            jumpForce: -10,
            maxSpeed: 8,
            moveSpeed: 5,
            friction: 0.85,
            ceilingGravity: -0.5
        },
        abilities: {
            maxJumps: 2,
            dashForce: 8,
            dashDuration: 200,
            dashCooldown: 1000
        },
        visual: {
            color: '#FFD700',
            glowColor: '#FFA500',
            dashColor: '#FF6B6B',
            gravityColor: '#9F7AEA'
        }
    },

    // Configuración del mundo
    world: {
        scrollSpeed: 4,
        groundHeight: 100,
        groundColor: '#2D3748',
        skyColor: '#0F0F0F',
        fogColor: 'rgba(100, 100, 120, 0.15)'
    },

    // Configuración de obstáculos
    obstacles: {
        width: 30,
        minHeight: 30,
        maxHeight: 80,
        color: '#E53E3E',
        spawnDistance: 300,
        spawnVariation: 200
    },

    // Configuración de la interfaz
    ui: {
        theme: 'spikepulse-dark',
        animations: {
            transitionDuration: 300,
            pulseInterval: 2000,
            bounceAnimation: 300
        },
        colors: {
            primary: '#FFD700',
            secondary: '#FF6B6B',
            accent: '#9F7AEA',
            danger: '#E53E3E',
            success: '#38A169',
            background: '#0F0F0F'
        }
    },

    // Configuración de rendimiento
    performance: {
        targetFPS: 60,
        maxDeltaTime: 50,
        enableObjectPooling: true,
        maxParticles: 100
    },

    // Configuración de debug
    debug: {
        enabled: false,
        showHitboxes: false,
        showFPS: false,
        eventBus: false,
        logLevel: 'warn' // 'debug', 'info', 'warn', 'error'
    },

    // Estados del juego
    gameStates: {
        LOADING: 'loading',
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'gameOver'
    },

    // Configuración de controles
    controls: {
        keyboard: {
            jump: ['Space', 'ArrowUp'],
            moveLeft: ['ArrowLeft', 'KeyA'],
            moveRight: ['ArrowRight', 'KeyD'],
            dash: ['ShiftLeft', 'ShiftRight'],
            gravity: ['ControlLeft', 'ControlRight'],
            pause: ['Escape']
        },
        mouse: {
            jump: ['click']
        },
        touch: {
            jump: ['tap'],
            swipeThreshold: 50
        }
    },

    // Configuración de audio (para futuro uso)
    audio: {
        enabled: true,
        masterVolume: 0.7,
        sfxVolume: 0.8,
        musicVolume: 0.6
    },

    // Configuración de accesibilidad
    accessibility: {
        enableScreenReader: true,
        enableKeyboardNavigation: true,
        highContrast: false,
        reducedMotion: false
    },

    // Configuración móvil
    mobile: {
        enableTouchControls: true,
        touchButtonSize: 60,
        touchSensitivity: 1.0,
        preventZoom: true
    }
};

/**
 * Configuración específica de Spikepulse (branding y temática)
 */
export const SPIKEPULSE_CONFIG = {
    branding: {
        title: 'Spikepulse',
        subtitle: 'Domina la Gravedad',
        description: 'Un emocionante juego de plataformas donde controlas un cubo a través de obstáculos peligrosos usando mecánicas avanzadas como salto doble, dash y gravedad invertida.',
        version: '1.0.0'
    },

    theme: {
        // Paleta de colores Spikepulse
        colors: {
            primary: '#FFD700',      // Dorado energético
            secondary: '#FF6B6B',    // Rojo eléctrico (peligro/spikes)
            accent: '#9F7AEA',       // Púrpura eléctrico (gravedad)
            success: '#38A169',      // Verde éxito
            warning: '#F6AD55',      // Naranja advertencia
            danger: '#E53E3E',       // Rojo peligro
            
            // Fondos oscuros cyberpunk
            bgPrimary: '#0F0F0F',
            bgSecondary: '#1A1A2E',
            bgTertiary: '#16213E',
            
            // Grises
            gray100: '#F7FAFC',
            gray200: '#EDF2F7',
            gray300: '#E2E8F0',
            gray400: '#CBD5E0',
            gray500: '#A0AEC0',
            gray600: '#718096',
            gray700: '#4A5568',
            gray800: '#2D3748',
            gray900: '#1A202C'
        },

        // Tipografía futurista
        fonts: {
            primary: "'Orbitron', monospace",
            secondary: "'Rajdhani', sans-serif",
            mono: "'Fira Code', monospace"
        },

        // Espaciado
        spacing: {
            xs: '0.25rem',
            sm: '0.5rem',
            md: '1rem',
            lg: '1.5rem',
            xl: '2rem',
            xxl: '3rem'
        },

        // Efectos visuales
        effects: {
            glowPrimary: '0 0 20px #FFD700',
            glowSecondary: '0 0 20px #FF6B6B',
            glowAccent: '0 0 20px #9F7AEA',
            glowDanger: '0 0 20px #E53E3E',
            
            // Animaciones de pulso
            pulseGlow: {
                duration: '2s',
                timing: 'ease-in-out',
                iteration: 'infinite'
            },
            
            // Transiciones
            transitionFast: '0.15s ease-out',
            transitionNormal: '0.3s ease-out',
            transitionSlow: '0.5s ease-out'
        }
    },

    // Elementos temáticos específicos de Spikepulse
    gameElements: {
        spikes: {
            baseColor: '#E53E3E',
            glowColor: '#FF6B6B',
            pulseEffect: true
        },
        
        player: {
            baseColor: '#FFD700',
            glowColor: '#FFA500',
            trailColor: '#FFD700',
            dashColor: '#FF6B6B',
            gravityColor: '#9F7AEA'
        },
        
        environment: {
            fogColor: 'rgba(100, 100, 120, 0.15)',
            atmosphereColor: 'rgba(0, 0, 0, 0.3)',
            industrialAccents: '#4A5568'
        }
    }
};

/**
 * Obtener configuración combinada
 * @returns {Object} Configuración completa del juego
 */
export function getFullConfig() {
    return {
        ...GAME_CONFIG,
        spikepulse: SPIKEPULSE_CONFIG
    };
}

/**
 * Validadores de configuración
 */
export const CONFIG_VALIDATORS = {
    'canvas.width': (value) => typeof value === 'number' && value > 0 && value <= 4000,
    'canvas.height': (value) => typeof value === 'number' && value > 0 && value <= 4000,
    'player.physics.gravity': (value) => typeof value === 'number' && Math.abs(value) <= 10,
    'player.physics.jumpForce': (value) => typeof value === 'number' && value < 0 && value >= -50,
    'player.physics.maxSpeed': (value) => typeof value === 'number' && value > 0 && value <= 50,
    'player.abilities.maxJumps': (value) => typeof value === 'number' && value >= 1 && value <= 5,
    'player.abilities.dashDuration': (value) => typeof value === 'number' && value > 0 && value <= 1000,
    'world.scrollSpeed': (value) => typeof value === 'number' && value > 0 && value <= 20,
    'performance.targetFPS': (value) => typeof value === 'number' && value >= 30 && value <= 120,
    'debug.enabled': (value) => typeof value === 'boolean'
};

/**
 * Configuración por defecto para desarrollo
 */
export const DEV_CONFIG_OVERRIDES = {
    debug: {
        enabled: true,
        showHitboxes: true,
        showFPS: true,
        eventBus: true,
        logLevel: 'debug'
    },
    performance: {
        targetFPS: 60,
        maxDeltaTime: 50
    }
};

/**
 * Configuración por defecto para producción
 */
export const PROD_CONFIG_OVERRIDES = {
    debug: {
        enabled: false,
        showHitboxes: false,
        showFPS: false,
        eventBus: false,
        logLevel: 'warn'
    },
    performance: {
        targetFPS: 60,
        maxDeltaTime: 33
    }
};