/**
 * Módulo de interfaz de usuario de Spikepulse
 * @module UI
 */

// Importaciones comentadas temporalmente
// export { UIManager } from './UIManager.js';
// export { HUD } from './HUD.js';
// export { ScreenManager } from './ScreenManager.js';

/**
 * Crea una instancia simplificada del sistema de UI
 * @param {Object} config - Configuración de UI
 * @param {EventBus} eventBus - Bus de eventos
 * @returns {Object} Sistema de UI simplificado
 */
export function createUISystem(config, eventBus) {
    console.log('🎮 Creando sistema de UI simplificado...');
    
    // Sistema simplificado
    const uiSystem = {
        
        /**
         * Inicializa el sistema de UI simplificado
         */
        async init() {
            console.log('🔧 Inicializando sistema de UI simplificado...');
            
            try {
                // Configurar listeners básicos para el botón de inicio
                this.setupBasicUI();
                
                console.log('✅ Sistema de UI inicializado');
                
                // Emitir evento de inicialización
                eventBus.emit('ui-system:initialized', {
                    components: {
                        simplified: true
                    }
                });
                
            } catch (error) {
                console.error('❌ Error inicializando sistema de UI:', error);
                throw error;
            }
        },
        
        /**
         * Configura UI básica
         */
        setupBasicUI() {
            // Escuchar eventos de estado del juego para mostrar/ocultar UI
            eventBus.on('game:state-changed', (data) => {
                console.log(`🎮 Estado del juego: ${data.state}`);
                
                // Aquí podríamos mostrar/ocultar elementos de UI según el estado
                // Por ahora solo loggeamos
            });
            
            console.log('🔗 UI básica configurada');
        },
        
        /**
         * Actualiza el sistema de UI
         * @param {number} deltaTime - Delta time
         */
        update(deltaTime) {
            // Sistema simplificado - principalmente event-driven
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
         * Resetea el sistema de UI
         */
        reset() {
            console.log('🔄 Reseteando sistema de UI...');
            console.log('✅ Sistema de UI reseteado');
        },
        
        /**
         * Destruye el sistema de UI
         */
        destroy() {
            console.log('🧹 Destruyendo sistema de UI...');
            console.log('✅ Sistema de UI destruido');
        }
    };
    
    console.log('✅ Sistema de UI creado');
    return uiSystem;
}

/**
 * Configuración por defecto del sistema de UI
 */
export const DEFAULT_UI_CONFIG = {
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
    }
};

/**
 * Temas disponibles para la UI
 */
export const UI_THEMES = {
    DARK: 'spikepulse-dark',
    LIGHT: 'spikepulse-light'
};

/**
 * Tipos de notificación disponibles
 */
export const NOTIFICATION_TYPES = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
};

/**
 * Posiciones disponibles para el HUD
 */
export const HUD_POSITIONS = {
    TOP: 'top',
    BOTTOM: 'bottom',
    LEFT: 'left',
    RIGHT: 'right'
};

console.log('📦 Módulo de UI cargado');