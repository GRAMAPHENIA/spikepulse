/**
 * Módulo de herramientas de desarrollo y debugging de Spikepulse
 * @module Debug
 */

// Importaciones comentadas temporalmente
// export { DebugUtils } from './DebugUtils.js';
// export { ConsoleCommands } from './ConsoleCommands.js';
// export { PerformanceMonitor } from './PerformanceMonitor.js';

/**
 * Crea una instancia simplificada del sistema de debugging
 * @param {Object} config - Configuración de debugging
 * @param {EventBus} eventBus - Bus de eventos
 * @returns {Object} Sistema de debugging simplificado
 */
export function createDebugSystem(config, eventBus) {
    console.log('🐛 Creando sistema de debugging simplificado...');
    
    // Sistema simplificado
    const debugSystem = {
        
        /**
         * Inicializa el sistema de debugging simplificado
         */
        async init() {
            console.log('🔧 Inicializando sistema de debugging simplificado...');
            
            try {
                // Configurar debug básico
                this.setupBasicDebug();
                
                console.log('✅ Sistema de debugging inicializado');
                
                // Emitir evento de inicialización
                eventBus.emit('debug-system:initialized', {
                    components: {
                        simplified: true
                    }
                });
                
            } catch (error) {
                console.error('❌ Error inicializando sistema de debugging:', error);
                throw error;
            }
        },
        
        /**
         * Configura debug básico
         */
        setupBasicDebug() {
            // Configurar comandos básicos de consola
            if (config.console?.enabled !== false) {
                window.sp = (command) => {
                    console.log(`🐛 Comando: ${command}`);
                    if (command === 'help') {
                        console.log('🐛 Comandos disponibles: help, info, debug');
                    } else if (command === 'info') {
                        console.log('🐛 Spikepulse Debug System - Simplified');
                    }
                    return `Comando ejecutado: ${command}`;
                };
                
                console.log('💻 Comandos básicos de consola configurados');
                console.log('💡 Usa sp("help") para ver comandos disponibles');
            }
            
            console.log('🔗 Debug básico configurado');
        },
        
        /**
         * Establece referencias al juego
         * @param {Object} gameEngine - Motor del juego
         * @param {HTMLCanvasElement} canvas - Canvas del juego
         * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
         */
        setGameReferences(gameEngine, canvas, ctx) {
            console.log('🔗 Referencias del juego establecidas en debug system');
        },
        
        /**
         * Actualiza el sistema de debugging
         * @param {number} deltaTime - Delta time
         */
        update(deltaTime) {
            // Sistema simplificado
        },
        
        /**
         * Renderiza overlays de debug
         * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
         * @param {Object} gameObjects - Objetos del juego
         */
        renderDebugOverlays(ctx, gameObjects) {
            // Sistema simplificado - sin overlays por ahora
        },
        
        /**
         * Registra un frame para performance
         * @param {Object} frameData - Datos del frame
         */
        recordFrame(frameData) {
            // Sistema simplificado
        },
        
        /**
         * Obtiene información de debug del sistema
         * @returns {Object} Información de debug
         */
        getDebugInfo() {
            return {
                type: 'simplified',
                isInitialized: true
            };
        },
        
        /**
         * Resetea el sistema de debugging
         */
        reset() {
            console.log('🔄 Reseteando sistema de debugging...');
            console.log('✅ Sistema de debugging reseteado');
        },
        
        /**
         * Destruye el sistema de debugging
         */
        destroy() {
            console.log('🧹 Destruyendo sistema de debugging...');
            console.log('✅ Sistema de debugging destruido');
        }
    };
    
    console.log('✅ Sistema de debugging creado');
    return debugSystem;
}

/**
 * Configuración por defecto del sistema de debugging
 */
export const DEFAULT_DEBUG_CONFIG = {
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
    console: {
        enabled: true,
        prefix: 'sp',
        caseSensitive: false,
        showHelp: true,
        logCommands: false,
        maxHistorySize: 100
    },
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
    }
};

/**
 * Niveles de log disponibles
 */
export const LOG_LEVELS = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
};

/**
 * Tipos de alertas de performance
 */
export const PERFORMANCE_ALERT_TYPES = {
    LOW_FPS: 'lowFPS',
    HIGH_FRAME_TIME: 'highFrameTime',
    HIGH_MEMORY: 'highMemory'
};

/**
 * Colores para debug rendering
 */
export const DEBUG_COLORS = {
    HITBOX: '#FF0000',
    VELOCITY: '#00FF00',
    GRID: '#333333',
    COLLISION: '#FFFF00',
    CAMERA: '#00FFFF',
    TEXT: '#FFFFFF',
    BACKGROUND: 'rgba(0, 0, 0, 0.8)'
};

console.log('📦 Módulo de debugging cargado');