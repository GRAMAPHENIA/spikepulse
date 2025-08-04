/**
 * Configuración principal del juego Spikepulse
 * @module GameConfig
 */

import { getPersistenceConfig } from './PersistenceConfig.js';

export const DEFAULT_GAME_CONFIG = {
    // Configuración del canvas
    canvas: {
        width: 1200,
        height: 600,
        backgroundColor: '#0F0F0F'
    },
    
    // Configuración de estados del juego
    states: {
        initial: 'menu',
        transitions: {
            'menu': ['playing', 'settings'],
            'playing': ['paused', 'game-over', 'menu'],
            'paused': ['playing', 'menu'],
            'game-over': ['menu', 'playing'],
            'settings': ['menu'],
            'loading': ['menu']
        }
    },
    
    // Configuración del sistema de input
    input: {
        keyboard: {
            enabled: true,
            bindings: {
                jump: ['Space', 'ArrowUp', 'KeyW'],
                dash: ['ShiftLeft', 'ShiftRight', 'KeyX'],
                gravity: ['ControlLeft', 'ControlRight', 'KeyZ'],
                moveLeft: ['ArrowLeft', 'KeyA'],
                moveRight: ['ArrowRight', 'KeyD'],
                pause: ['Escape', 'KeyP']
            }
        },
        touch: {
            enabled: true,
            gestures: {
                tap: 'jump',
                swipeUp: 'jump',
                swipeDown: 'gravity',
                swipeLeft: 'moveLeft',
                swipeRight: 'moveRight'
            }
        },
        mouse: {
            enabled: true,
            bindings: {
                leftClick: 'jump',
                rightClick: 'dash',
                middleClick: 'gravity'
            }
        }
    },
    
    // Configuración del sistema de renderizado
    renderer: {
        enableEffects: true,
        enableParticles: true,
        showDebug: false,
        optimization: {
            enableDirtyRegions: false,
            maxParticles: 100
        },
        layers: {
            background: { zIndex: 0, alpha: 1, visible: true },
            world: { zIndex: 1, alpha: 1, visible: true },
            obstacles: { zIndex: 2, alpha: 1, visible: true },
            player: { zIndex: 3, alpha: 1, visible: true },
            effects: { zIndex: 4, alpha: 1, visible: true },
            ui: { zIndex: 5, alpha: 1, visible: true }
        },
        effects: {
            enableParticles: true,
            enablePostProcessing: false,
            enableScreenEffects: true,
            maxParticles: 100,
            particlePoolSize: 200
        }
    },
    
    // Configuración del mundo y cámara
    world: {
        camera: {
            smoothing: 0.1,
            zoom: {
                min: 0.5,
                max: 2.0,
                smoothing: 0.1
            },
            bounds: {
                enabled: false
            }
        }
    },
    
    // Configuración de UI
    ui: {
        theme: 'spikepulse-dark',
        language: 'es',
        enableAnimations: true,
        enableSounds: true,
        showFPS: false,
        showDebug: false,
        autoHideControls: true,
        controlsTimeout: 3000,
        
        hud: {
            position: 'top',
            showDistance: true,
            showScore: true,
            showLives: true,
            showTime: false,
            showFPS: false,
            showVelocity: false,
            enableAnimations: true,
            updateInterval: 16
        },
        
        screens: {
            enableTransitions: true,
            transitionDuration: 300,
            defaultScreen: 'menu',
            enableHistory: true,
            maxHistorySize: 10
        },
        
        minimap: {
            enabled: true,
            width: 200,
            height: 100,
            position: 'top-right',
            scale: 0.1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderColor: '#FFD700',
            borderWidth: 2,
            showPlayer: true,
            showObstacles: true,
            showCollectibles: true,
            showViewport: true,
            opacity: 0.8
        }
    },
    
    // Configuración de debugging
    debug: {
        enabled: false,
        showHitboxes: false,
        showVelocity: false,
        showGrid: false,
        showFPS: false,
        showMemory: false,
        showCollisions: false,
        showCameraInfo: false,
        logLevel: 'info',
        maxLogEntries: 1000
    },
    
    // Configuración de comandos de consola
    console: {
        enabled: true,
        prefix: 'sp',
        caseSensitive: false,
        showHelp: true,
        logCommands: false,
        maxHistorySize: 100
    },
    
    // Configuración del monitor de performance
    performance: {
        enabled: true,
        updateInterval: 1000,
        maxSamples: 60,
        showOverlay: false,
        trackMemory: true,
        trackFPS: true,
        trackFrameTime: true,
        trackCustomMetrics: true,
        alertThresholds: {
            lowFPS: 30,
            highFrameTime: 33.33,
            highMemory: 100 * 1024 * 1024
        }
    },
    
    // Configuración del juego
    game: {
        initialLives: 3,
        maxLives: 5,
        scoreMultiplier: 1,
        difficultyProgression: true,
        saveProgress: true,
        autoSave: true,
        autoSaveInterval: 30000 // 30 segundos
    },
    
    // Configuración de audio (placeholder)
    audio: {
        enabled: true,
        masterVolume: 1.0,
        musicVolume: 0.7,
        sfxVolume: 0.8,
        enableSpatialAudio: false
    },
    
    // Configuración de accesibilidad
    accessibility: {
        enableScreenReader: true,
        enableHighContrast: false,
        enableReducedMotion: false,
        enableColorBlindSupport: false,
        fontSize: 'normal', // 'small', 'normal', 'large'
        announceGameEvents: true
    },
    
    // Configuración de desarrollo
    development: {
        enableHotReload: false,
        enableProfiling: false,
        enableTesting: false,
        mockData: false,
        skipIntro: false
    },
    
    // Configuración de persistencia
    persistence: getPersistenceConfig('development')
};

/**
 * Configuración específica para desarrollo
 */
export const DEVELOPMENT_CONFIG = {
    ...DEFAULT_GAME_CONFIG,
    debug: {
        ...DEFAULT_GAME_CONFIG.debug,
        enabled: true,
        showFPS: true,
        logLevel: 'debug'
    },
    development: {
        ...DEFAULT_GAME_CONFIG.development,
        enableHotReload: true,
        enableProfiling: true,
        skipIntro: true
    },
    performance: {
        ...DEFAULT_GAME_CONFIG.performance,
        showOverlay: true
    },
    persistence: getPersistenceConfig('development')
};

/**
 * Configuración específica para producción
 */
export const PRODUCTION_CONFIG = {
    ...DEFAULT_GAME_CONFIG,
    debug: {
        ...DEFAULT_GAME_CONFIG.debug,
        enabled: false,
        logLevel: 'warn'
    },
    console: {
        ...DEFAULT_GAME_CONFIG.console,
        enabled: false
    },
    performance: {
        ...DEFAULT_GAME_CONFIG.performance,
        enabled: false
    },
    persistence: getPersistenceConfig('production')
};

/**
 * Configuración específica para móviles
 */
export const MOBILE_CONFIG = {
    ...DEFAULT_GAME_CONFIG,
    canvas: {
        ...DEFAULT_GAME_CONFIG.canvas,
        width: window.innerWidth,
        height: window.innerHeight
    },
    renderer: {
        ...DEFAULT_GAME_CONFIG.renderer,
        optimization: {
            enableDirtyRegions: true,
            maxParticles: 50
        },
        effects: {
            ...DEFAULT_GAME_CONFIG.renderer.effects,
            maxParticles: 50,
            particlePoolSize: 100
        }
    },
    ui: {
        ...DEFAULT_GAME_CONFIG.ui,
        autoHideControls: false,
        hud: {
            ...DEFAULT_GAME_CONFIG.ui.hud,
            position: 'top',
            showVelocity: false
        },
        minimap: {
            ...DEFAULT_GAME_CONFIG.ui.minimap,
            enabled: false // Desactivar en móviles para ahorrar espacio
        }
    },
    performance: {
        ...DEFAULT_GAME_CONFIG.performance,
        updateInterval: 2000, // Menos frecuente en móviles
        maxSamples: 30
    },
    persistence: getPersistenceConfig('production') // Usar config de producción para móviles
};

/**
 * Obtiene la configuración apropiada según el entorno
 * @param {string} environment - Entorno ('development', 'production', 'mobile')
 * @returns {Object} Configuración del juego
 */
export function getGameConfig(environment = 'development') {
    switch (environment) {
        case 'production':
            return PRODUCTION_CONFIG;
        case 'mobile':
            return MOBILE_CONFIG;
        case 'development':
        default:
            return DEVELOPMENT_CONFIG;
    }
}

/**
 * Detecta si es un dispositivo móvil
 * @returns {boolean} True si es móvil
 */
export function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768 && window.innerHeight <= 1024);
}

/**
 * Obtiene la configuración automática según el dispositivo
 * @returns {Object} Configuración del juego
 */
export function getAutoConfig() {
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.search.includes('debug=true');
    
    const isMobile = isMobileDevice();
    
    if (isMobile) {
        return MOBILE_CONFIG;
    } else if (isDevelopment) {
        return DEVELOPMENT_CONFIG;
    } else {
        return PRODUCTION_CONFIG;
    }
}

console.log('⚙️ Configuración del juego cargada');