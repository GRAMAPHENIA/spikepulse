/**
 * PlayerTest - Prueba básica del módulo Player
 * @module PlayerTest
 */

import { Player } from './Player.js';
import { EventBus } from '../../core/EventBus.js';

/**
 * Ejecutar pruebas básicas del Player
 */
export function runPlayerTests() {
    console.log('[PlayerTest] Iniciando pruebas del módulo Player...');
    
    try {
        // Crear EventBus de prueba
        const eventBus = new EventBus();
        
        // Configuración de prueba
        const testConfig = {
            player: {
                startPosition: { x: 100, y: 300 },
                size: { width: 30, height: 30 },
                physics: {
                    gravity: 0.5,
                    jumpForce: -10,
                    maxSpeed: 8,
                    moveSpeed: 5,
                    friction: 0.85
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
            }
        };
        
        // Crear instancia del Player
        const player = new Player(testConfig, eventBus);
        
        // Crear canvas mock para las pruebas
        const mockCanvas = {
            getContext: () => ({
                save: () => {},
                restore: () => {},
                clearRect: () => {},
                fillRect: () => {},
                strokeRect: () => {},
                beginPath: () => {},
                moveTo: () => {},
                lineTo: () => {},
                arc: () => {},
                fill: () => {},
                stroke: () => {},
                translate: () => {},
                rotate: () => {},
                scale: () => {},
                createRadialGradient: () => ({
                    addColorStop: () => {}
                }),
                createLinearGradient: () => ({
                    addColorStop: () => {}
                }),
                roundRect: function(x, y, w, h, r) {
                    // Mock implementation
                }
            })
        };
        
        const ctx = mockCanvas.getContext();
        
        // Test 1: Inicialización
        console.log('[PlayerTest] Test 1: Inicialización');
        player.init(ctx, eventBus, testConfig);
        
        if (player.isInitialized && player.isActive) {
            console.log('✓ Player inicializado correctamente');
        } else {
            throw new Error('Player no se inicializó correctamente');
        }
        
        // Test 2: Posición inicial
        console.log('[PlayerTest] Test 2: Posición inicial');
        const position = player.getPosition();
        if (position.x === 100 && position.y === 300) {
            console.log('✓ Posición inicial correcta');
        } else {
            throw new Error(`Posición inicial incorrecta: ${position.x}, ${position.y}`);
        }
        
        // Test 3: Estado inicial
        console.log('[PlayerTest] Test 3: Estado inicial');
        const state = player.getState();
        if (state.isAlive && !state.isGrounded && !state.isDashing && !state.isInverted) {
            console.log('✓ Estado inicial correcto');
        } else {
            throw new Error('Estado inicial incorrecto');
        }
        
        // Test 4: Habilidades iniciales
        console.log('[PlayerTest] Test 4: Habilidades iniciales');
        const stats = player.getStats();
        if (stats.jumps === 0 && stats.dashes === 0 && stats.distance === 0) {
            console.log('✓ Estadísticas iniciales correctas');
        } else {
            throw new Error('Estadísticas iniciales incorrectas');
        }
        
        // Test 5: Salto
        console.log('[PlayerTest] Test 5: Funcionalidad de salto');
        const initialY = player.getPosition().y;
        player.jump();
        
        // Simular un frame de actualización
        player.update(16, ctx);
        
        const newPosition = player.getPosition();
        const velocity = player.getVelocity();
        
        if (velocity.y < 0) { // Velocidad hacia arriba
            console.log('✓ Salto funciona correctamente');
        } else {
            throw new Error('Salto no funciona correctamente');
        }
        
        // Test 6: Dash
        console.log('[PlayerTest] Test 6: Funcionalidad de dash');
        const initialVelX = player.getVelocity().x;
        player.dash();
        
        const newVelX = player.getVelocity().x;
        if (newVelX > initialVelX) {
            console.log('✓ Dash funciona correctamente');
        } else {
            throw new Error('Dash no funciona correctamente');
        }
        
        // Test 7: Cambio de gravedad
        console.log('[PlayerTest] Test 7: Cambio de gravedad');
        const initialGravity = player.getState().isInverted;
        player.toggleGravity();
        const newGravity = player.getState().isInverted;
        
        if (initialGravity !== newGravity) {
            console.log('✓ Cambio de gravedad funciona correctamente');
        } else {
            throw new Error('Cambio de gravedad no funciona');
        }
        
        // Test 8: Reset
        console.log('[PlayerTest] Test 8: Reset del jugador');
        player.resetPosition();
        const resetPosition = player.getPosition();
        const resetState = player.getState();
        
        if (resetPosition.x === 100 && resetPosition.y === 300 && 
            resetState.isAlive && !resetState.isInverted) {
            console.log('✓ Reset funciona correctamente');
        } else {
            throw new Error('Reset no funciona correctamente');
        }
        
        // Test 9: Renderizado (sin errores)
        console.log('[PlayerTest] Test 9: Renderizado');
        try {
            player.render(ctx);
            console.log('✓ Renderizado sin errores');
        } catch (error) {
            throw new Error(`Error en renderizado: ${error.message}`);
        }
        
        // Test 10: Limpieza
        console.log('[PlayerTest] Test 10: Limpieza de recursos');
        player.destroy();
        console.log('✓ Limpieza completada');
        
        console.log('[PlayerTest] ✅ Todas las pruebas pasaron correctamente');
        return true;
        
    } catch (error) {
        console.error('[PlayerTest] ❌ Error en las pruebas:', error.message);
        return false;
    }
}

/**
 * Ejecutar pruebas de rendimiento básicas
 */
export function runPlayerPerformanceTests() {
    console.log('[PlayerTest] Iniciando pruebas de rendimiento...');
    
    const eventBus = new EventBus();
    const testConfig = {
        player: {
            startPosition: { x: 100, y: 300 },
            size: { width: 30, height: 30 },
            physics: { gravity: 0.5, jumpForce: -10, maxSpeed: 8 },
            abilities: { maxJumps: 2, dashForce: 8, dashCooldown: 1000 },
            visual: { color: '#FFD700' }
        }
    };
    
    const player = new Player(testConfig, eventBus);
    const mockCtx = {
        save: () => {}, restore: () => {}, clearRect: () => {},
        fillRect: () => {}, strokeRect: () => {}, beginPath: () => {},
        arc: () => {}, fill: () => {}, stroke: () => {},
        translate: () => {}, rotate: () => {}, scale: () => {},
        createRadialGradient: () => ({ addColorStop: () => {} }),
        createLinearGradient: () => ({ addColorStop: () => {} }),
        roundRect: () => {}
    };
    
    player.init(mockCtx, eventBus, testConfig);
    
    // Test de rendimiento: 1000 actualizaciones
    const startTime = performance.now();
    
    for (let i = 0; i < 1000; i++) {
        player.update(16, mockCtx);
        if (i % 100 === 0) {
            player.jump();
        }
        if (i % 150 === 0) {
            player.dash();
        }
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTimePerUpdate = totalTime / 1000;
    
    console.log(`[PlayerTest] Rendimiento: ${totalTime.toFixed(2)}ms total, ${avgTimePerUpdate.toFixed(3)}ms por actualización`);
    
    if (avgTimePerUpdate < 1) { // Menos de 1ms por actualización es bueno
        console.log('✅ Rendimiento aceptable');
        return true;
    } else {
        console.log('⚠️ Rendimiento podría mejorarse');
        return false;
    }
}

// Ejecutar pruebas si este archivo se ejecuta directamente
if (typeof window !== 'undefined' && window.location) {
    // En el navegador, exponer las funciones globalmente para testing manual
    window.runPlayerTests = runPlayerTests;
    window.runPlayerPerformanceTests = runPlayerPerformanceTests;
}