/**
 * Spikepulse - Punto de entrada principal
 * @module Main
 */

import { GameEngine } from './core/GameEngine.js';
import { initializeConfigs, getAllConfigs } from './config/index.js';

/**
 * Ocultar pantalla de carga y mostrar menú
 */
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const menuScreen = document.getElementById('menu-screen');
    
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
    }
    
    if (menuScreen) {
        menuScreen.classList.remove('hidden');
    }
}

/**
 * Mostrar mensaje de error
 */
function showError(error) {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.innerHTML = `
            <div class="loading-content">
                <h1 class="loading-title" style="color: #FF6B6B;">Error</h1>
                <p class="loading-text">No se pudo cargar el juego</p>
                <details style="margin-top: 20px; color: #ccc; font-size: 0.9rem;">
                    <summary style="cursor: pointer;">Detalles técnicos</summary>
                    <pre style="margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.5); border-radius: 4px; font-size: 0.8rem;">${error.message}</pre>
                </details>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #FF6B6B; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Recargar Página
                </button>
            </div>
        `;
    }
}

/**
 * Inicializar y ejecutar el juego Spikepulse
 */
async function initGame() {
    try {
        console.log('🎮 Iniciando Spikepulse...');
        
        // Simular tiempo de carga mínimo para mostrar la pantalla
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Inicializar configuraciones dinámicamente
        const configs = await initializeConfigs();
        
        // Crear motor de juego con configuraciones cargadas
        const gameEngine = new GameEngine(configs.game);
        await gameEngine.init();
        
        // Ocultar pantalla de carga y mostrar menú
        hideLoadingScreen();
        
        console.log('✅ Spikepulse iniciado correctamente');
        
        // Hacer el gameEngine accesible globalmente para debugging
        window.gameEngine = gameEngine;
        
    } catch (error) {
        console.error('❌ Error al iniciar Spikepulse:', error);
        showError(error);
    }
}

// Iniciar el juego cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}