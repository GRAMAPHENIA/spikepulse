/**
 * PlayerIntegration - Ejemplo de integración del Player con GameEngine
 * @module PlayerIntegration
 */

import { Player } from './Player.js';

/**
 * Integrar el módulo Player con el GameEngine
 * @param {GameEngine} gameEngine - Instancia del GameEngine
 * @param {Object} config - Configuración del juego
 */
export function integratePlayerWithEngine(gameEngine, config) {
    console.log('[PlayerIntegration] Integrando Player con GameEngine...');
    
    // Crear instancia del Player
    const player = new Player(config, gameEngine.eventBus);
    
    // Registrar el Player como módulo en el GameEngine
    gameEngine.registerModule({
        name: 'player',
        instance: player,
        priority: 100 // Alta prioridad para el jugador
    });
    
    // Configurar listeners específicos para la integración
    setupPlayerIntegrationListeners(gameEngine, player);
    
    console.log('[PlayerIntegration] Player integrado correctamente');
    
    return player;
}

/**
 * Configurar listeners específicos para la integración
 * @param {GameEngine} gameEngine - Instancia del GameEngine
 * @param {Player} player - Instancia del Player
 * @private
 */
function setupPlayerIntegrationListeners(gameEngine, player) {
    const eventBus = gameEngine.eventBus;
    
    // Listener para estadísticas del jugador
    eventBus.on('player:update', (data) => {
        // Actualizar HUD con estadísticas del jugador
        eventBus.emit('hud:update-stats', {
            distance: data.stats.distance,
            jumps: data.stats.jumps,
            dashes: data.stats.dashes,
            velocity: Math.round(data.velocity.x * 10) / 10,
            gravity: data.state.isInverted ? 'Invertida' : 'Normal'
        });
    });
    
    // Listener para muerte del jugador
    eventBus.on('player:died', (data) => {
        console.log('[PlayerIntegration] Jugador murió, cambiando a estado gameOver');
        gameEngine.changeState('gameOver', {
            cause: data.cause,
            stats: data.stats,
            position: data.position
        });
    });
    
    // Listener para eventos de habilidades
    eventBus.on('player:ability-used', (data) => {
        // Emitir sonidos o efectos adicionales
        eventBus.emit('audio:play-sfx', {
            sound: data.ability,
            volume: data.ability === 'dash' ? 0.8 : 0.6
        });
    });
    
    // Listener para combos
    eventBus.on('player:combo-performed', (data) => {
        console.log(`[PlayerIntegration] Combo realizado: ${data.type}`);
        
        // Mostrar notificación de combo
        eventBus.emit('ui:show-notification', {
            type: 'combo',
            message: `¡Combo ${data.type.toUpperCase()}!`,
            duration: 1000
        });
        
        // Reproducir efecto de sonido especial
        eventBus.emit('audio:play-sfx', {
            sound: 'combo',
            volume: 1.0
        });
    });
    
    // Listener para cambios de gravedad
    eventBus.on('player:gravity-changed', (data) => {
        // Actualizar indicadores visuales
        eventBus.emit('ui:update-gravity-indicator', {
            isInverted: data.isInverted
        });
    });
    
    // Listener para aterrizajes
    eventBus.on('player:landed', (data) => {
        // Crear efectos de partículas en el mundo
        eventBus.emit('world:create-landing-effect', {
            position: data.position,
            wasInverted: data.wasInverted
        });
    });
}

/**
 * Configurar controles del jugador
 * @param {GameEngine} gameEngine - Instancia del GameEngine
 * @param {Player} player - Instancia del Player
 */
export function setupPlayerControls(gameEngine, player) {
    console.log('[PlayerIntegration] Configurando controles del jugador...');
    
    const eventBus = gameEngine.eventBus;
    
    // Mapear eventos de entrada a acciones del jugador
    const controlMappings = {
        'input:jump': () => eventBus.emit('input:jump'),
        'input:dash': () => eventBus.emit('input:dash'),
        'input:gravity': () => eventBus.emit('input:gravity'),
        'input:move-left': () => eventBus.emit('input:move-left'),
        'input:move-right': () => eventBus.emit('input:move-right')
    };
    
    // Los controles ya están configurados en el Player, 
    // solo necesitamos asegurar que los eventos se propaguen correctamente
    
    console.log('[PlayerIntegration] Controles configurados');
}

/**
 * Obtener información de debug del Player
 * @param {Player} player - Instancia del Player
 * @returns {Object} Información de debug
 */
export function getPlayerDebugInfo(player) {
    if (!player) return null;
    
    return {
        position: player.getPosition(),
        velocity: player.getVelocity(),
        state: player.getState(),
        stats: player.getStats(),
        hitbox: player.getHitbox(),
        physics: player.physics ? player.physics.getDebugInfo() : null,
        abilities: player.abilities ? player.abilities.getDebugInfo() : null,
        renderer: player.renderer ? player.renderer.getDebugInfo() : null
    };
}

/**
 * Configurar modo debug para el Player
 * @param {GameEngine} gameEngine - Instancia del GameEngine
 * @param {Player} player - Instancia del Player
 */
export function setupPlayerDebugMode(gameEngine, player) {
    if (!gameEngine.config.debug?.enabled) return;
    
    console.log('[PlayerIntegration] Configurando modo debug del Player...');
    
    const eventBus = gameEngine.eventBus;
    
    // Emitir información de debug cada segundo
    setInterval(() => {
        const debugInfo = getPlayerDebugInfo(player);
        eventBus.emit('debug:player-info', debugInfo);
    }, 1000);
    
    // Listener para mostrar hitboxes
    eventBus.on('debug:toggle-hitboxes', (enabled) => {
        if (enabled && player.renderer) {
            // Activar visualización de hitboxes
            eventBus.emit('debug:render-hitbox', {
                hitbox: player.getHitbox(),
                color: '#FF0000',
                label: 'Player'
            });
        }
    });
    
    console.log('[PlayerIntegration] Modo debug configurado');
}

/**
 * Ejemplo de uso completo
 */
export function examplePlayerIntegration() {
    console.log('[PlayerIntegration] Ejemplo de integración completa...');
    
    // Este es un ejemplo de cómo integrar el Player en el GameEngine
    // En el código real, esto se haría en el GameEngine o en main.js
    
    /*
    // En GameEngine.js o main.js:
    
    import { integratePlayerWithEngine, setupPlayerControls, setupPlayerDebugMode } from './modules/player/PlayerIntegration.js';
    
    // Después de crear el GameEngine
    const gameEngine = new GameEngine(config);
    
    // Integrar el Player
    const player = integratePlayerWithEngine(gameEngine, config);
    
    // Configurar controles
    setupPlayerControls(gameEngine, player);
    
    // Configurar debug si está habilitado
    if (config.debug.enabled) {
        setupPlayerDebugMode(gameEngine, player);
    }
    
    // Iniciar el juego
    gameEngine.start();
    */
    
    console.log('[PlayerIntegration] Ejemplo completado');
}

// Exportar funciones principales
export {
    integratePlayerWithEngine as default,
    setupPlayerControls,
    setupPlayerDebugMode,
    getPlayerDebugInfo
};