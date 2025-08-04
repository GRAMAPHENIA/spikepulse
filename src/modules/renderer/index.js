/**
 * Módulo de renderizado simplificado de Spikepulse
 * @module Renderer
 */

import { SimpleRenderer } from './SimpleRenderer.js';

/**
 * Crea una instancia simplificada del sistema de renderizado
 * @param {Object} config - Configuración del renderizado
 * @param {EventBus} eventBus - Bus de eventos
 * @returns {Object} Sistema de renderizado simplificado
 */
export function createRenderingSystem(config, eventBus) {
    console.log('🎨 Creando sistema de renderizado simplificado...');
    
    // Crear renderizador simplificado
    const simpleRenderer = new SimpleRenderer(config, eventBus);
    
    // Sistema simplificado
    const renderingSystem = {
        canvasRenderer: simpleRenderer, // Alias para compatibilidad
        
        /**
         * Inicializa el sistema de renderizado
         */
        async init() {
            console.log('🔧 Inicializando sistema de renderizado...');
            
            try {
                await simpleRenderer.init();
                
                console.log('✅ Sistema de renderizado inicializado');
                
                // Emitir evento de inicialización
                eventBus.emit('rendering-system:initialized', {
                    components: {
                        simpleRenderer: true
                    }
                });
                
            } catch (error) {
                console.error('❌ Error inicializando sistema de renderizado:', error);
                throw error;
            }
        },
        
        /**
         * Actualiza el sistema de renderizado
         * @param {number} deltaTime - Delta time
         */
        update(deltaTime) {
            simpleRenderer.update(deltaTime);
        },
        
        /**
         * Renderiza el sistema
         * @param {number} deltaTime - Delta time
         */
        render(deltaTime) {
            simpleRenderer.render(deltaTime);
        },
        
        /**
         * Obtiene información de debug del sistema
         * @returns {Object} Información de debug
         */
        getDebugInfo() {
            return {
                simpleRenderer: simpleRenderer.getDebugInfo()
            };
        },
        
        /**
         * Resetea el sistema de renderizado
         */
        reset() {
            console.log('🔄 Reseteando sistema de renderizado...');
            simpleRenderer.reset();
            console.log('✅ Sistema de renderizado reseteado');
        },
        
        /**
         * Destruye el sistema de renderizado
         */
        destroy() {
            console.log('🧹 Destruyendo sistema de renderizado...');
            simpleRenderer.destroy();
            console.log('✅ Sistema de renderizado destruido');
        }
    };
    
    console.log('✅ Sistema de renderizado creado');
    return renderingSystem;
}

/**
 * Configuración por defecto del sistema de renderizado
 */
export const DEFAULT_RENDERING_CONFIG = {
    canvas: {
        width: 1200,
        height: 600,
        backgroundColor: '#0F0F0F'
    },
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
    ui: {
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
    }
};

console.log('📦 Módulo de renderizado cargado');