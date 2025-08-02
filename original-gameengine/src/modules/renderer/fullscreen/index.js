/**
 * Sistema de Canvas Fullscreen - Exportaciones principales
 * @module FullscreenSystem
 */

export { FullscreenCanvasManager } from '../FullscreenCanvasManager.js';
export { ViewportManager } from '../ViewportManager.js';
export { ResponsiveHandler } from '../ResponsiveHandler.js';
export { PerformanceOptimizer } from '../PerformanceOptimizer.js';
export { ScalableMemoryManager } from '../ScalableMemoryManager.js';
export { FullscreenIntegrator } from '../FullscreenIntegrator.js';

/**
 * Crear sistema fullscreen completo
 * @param {HTMLCanvasElement} canvas - Canvas del juego
 * @param {Object} config - Configuración del sistema
 * @param {EventBus} eventBus - Bus de eventos del juego
 * @returns {FullscreenIntegrator} Integrador del sistema fullscreen
 */
export function createFullscreenSystem(canvas, config, eventBus) {
    const { FullscreenIntegrator } = await import('../FullscreenIntegrator.js');
    return new FullscreenIntegrator(canvas, config, eventBus);
}

/**
 * Configuración por defecto para el sistema fullscreen
 */
export const DEFAULT_FULLSCREEN_CONFIG = {
    canvas: {
        minWidth: 320,
        minHeight: 240,
        maxWidth: 3840,
        maxHeight: 2160,
        aspectRatio: 16/9,
        maintainAspectRatio: true,
        backgroundColor: '#000000'
    },
    
    responsive: {
        breakpoints: {
            mobile: 768,
            tablet: 1024,
            desktop: 1440
        },
        touchOptimization: true,
        adaptiveUI: true,
        orientationHandling: true,
        densityOptimization: true
    },
    
    performance: {
        targetFPS: 60,
        minFPS: 30,
        adaptiveQuality: true,
        memoryThreshold: 0.8,
        gcThreshold: 0.9,
        enableDynamicQuality: true,
        enableMemoryManagement: true,
        enableCulling: true
    }
};