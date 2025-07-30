/**
 * Player Module - Punto de entrada principal
 * @module PlayerModule
 */

// Exportar clases principales
export { Player } from './Player.js';
export { PlayerPhysics } from './PlayerPhysics.js';
export { PlayerAbilities } from './PlayerAbilities.js';
export { PlayerRenderer } from './PlayerRenderer.js';

// Exportar utilidades de integración
export { 
    integratePlayerWithEngine,
    setupPlayerControls,
    setupPlayerDebugMode,
    getPlayerDebugInfo
} from './PlayerIntegration.js';

// Exportar funciones de testing
export { 
    runPlayerTests,
    runPlayerPerformanceTests
} from './PlayerTest.js';

/**
 * Crear una instancia completa del Player con configuración por defecto
 * @param {EventBus} eventBus - Bus de eventos
 * @param {Object} customConfig - Configuración personalizada (opcional)
 * @returns {Player} Instancia del Player configurada
 */
export function createPlayer(eventBus, customConfig = {}) {
    const defaultConfig = {
        player: {
            startPosition: { x: 100, y: 300 },
            size: { width: 30, height: 30 },
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
                dashCooldown: 1000,
                doubleJumpForce: -8
            },
            visual: {
                color: '#FFD700',
                glowColor: '#FFA500',
                dashColor: '#FF6B6B',
                gravityColor: '#9F7AEA'
            }
        }
    };
    
    // Combinar configuración por defecto con personalizada
    const config = mergeConfig(defaultConfig, customConfig);
    
    return new Player(config, eventBus);
}

/**
 * Combinar configuraciones de forma profunda
 * @param {Object} defaultConfig - Configuración por defecto
 * @param {Object} customConfig - Configuración personalizada
 * @returns {Object} Configuración combinada
 * @private
 */
function mergeConfig(defaultConfig, customConfig) {
    const result = { ...defaultConfig };
    
    for (const key in customConfig) {
        if (customConfig.hasOwnProperty(key)) {
            if (typeof customConfig[key] === 'object' && customConfig[key] !== null && !Array.isArray(customConfig[key])) {
                result[key] = mergeConfig(result[key] || {}, customConfig[key]);
            } else {
                result[key] = customConfig[key];
            }
        }
    }
    
    return result;
}

/**
 * Información del módulo Player
 */
export const PLAYER_MODULE_INFO = {
    name: 'Player',
    version: '1.0.0',
    description: 'Módulo completo del jugador con física, habilidades y renderizado',
    author: 'Spikepulse Team',
    dependencies: ['EventBus', 'CollisionDetection'],
    features: [
        'Física modular con gravedad normal e invertida',
        'Sistema de habilidades avanzado (salto doble, dash, combos)',
        'Renderizado con efectos visuales y partículas',
        'Sistema de entrada con buffering',
        'Detección de colisiones',
        'Estadísticas y métricas',
        'Modo debug integrado',
        'Arquitectura modular y extensible'
    ]
};

// Exportar información del módulo
export default {
    Player,
    PlayerPhysics,
    PlayerAbilities,
    PlayerRenderer,
    createPlayer,
    PLAYER_MODULE_INFO
};