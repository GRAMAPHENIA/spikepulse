/**
 * UI Module Index - Punto de entrada para todos los módulos de UI
 * Exporta todos los componentes de la interfaz de usuario
 * @module UI
 */

// Exportar módulos principales
export { UIManager } from './UIManager.js';
export { HUD } from './HUD.js';
export { ResponsiveUI } from './ResponsiveUI.js';

// Exportar pantallas
export { Screen } from './screens/Screen.js';
export { MenuScreen } from './screens/MenuScreen.js';
export { GameOverScreen } from './screens/GameOverScreen.js';
export { PauseScreen } from './screens/PauseScreen.js';

/**
 * Crear instancia completa del sistema UI
 * @param {Object} config - Configuración del sistema UI
 * @param {EventBus} eventBus - Bus de eventos
 * @returns {Object} Sistema UI completo
 */
export function createUISystem(config, eventBus) {
    console.log('[UI] Creando sistema UI completo...');
    
    try {
        // Crear instancias de los módulos principales
        const uiManager = new UIManager(config.ui || {}, eventBus);
        const hud = new HUD(config.hud || {}, eventBus);
        const responsiveUI = new ResponsiveUI(config.responsive || {}, eventBus);
        
        // Configurar comunicación entre módulos
        setupUIModuleCommunication(uiManager, hud, responsiveUI, eventBus);
        
        // Crear objeto del sistema UI
        const uiSystem = {
            uiManager,
            hud,
            responsiveUI,
            
            // Métodos de control del sistema
            show() {
                uiManager.showScreen('menu');
                return this;
            },
            
            hide() {
                uiManager.hideAllScreens();
                hud.hide();
                return this;
            },
            
            showGame() {
                uiManager.showGameElements();
                hud.show();
                return this;
            },
            
            hideGame() {
                uiManager.hideGameElements();
                hud.hide();
                return this;
            },
            
            updateStats(stats) {
                hud.updateStats(stats);
                return this;
            },
            
            showScreen(screenName, data) {
                uiManager.showScreen(screenName, data);
                return this;
            },
            
            hideScreen(screenName) {
                uiManager.hideScreen(screenName);
                return this;
            },
            
            getDeviceState() {
                return responsiveUI.getDeviceState();
            },
            
            isMobile() {
                return responsiveUI.isMobile();
            },
            
            isTablet() {
                return responsiveUI.isTablet();
            },
            
            isDesktop() {
                return responsiveUI.isDesktop();
            },
            
            getStats() {
                return {
                    uiManager: uiManager.getStats(),
                    hud: hud.getInfo(),
                    responsiveUI: responsiveUI.getInfo()
                };
            },
            
            destroy() {
                console.log('[UI] Destruyendo sistema UI...');
                
                if (uiManager && uiManager.destroy) {
                    uiManager.destroy();
                }
                
                if (hud && hud.destroy) {
                    hud.destroy();
                }
                
                if (responsiveUI && responsiveUI.destroy) {
                    responsiveUI.destroy();
                }
                
                console.log('[UI] Sistema UI destruido');
            }
        };
        
        console.log('[UI] Sistema UI creado exitosamente');
        return uiSystem;
        
    } catch (error) {
        console.error('[UI] Error al crear sistema UI:', error);
        throw error;
    }
}

/**
 * Configurar comunicación entre módulos de UI
 * @param {UIManager} uiManager - Gestor de UI
 * @param {HUD} hud - HUD del juego
 * @param {ResponsiveUI} responsiveUI - UI responsive
 * @param {EventBus} eventBus - Bus de eventos
 * @private
 */
function setupUIModuleCommunication(uiManager, hud, responsiveUI, eventBus) {
    console.log('[UI] Configurando comunicación entre módulos UI...');
    
    // Sincronizar visibilidad del HUD con el estado del juego
    eventBus.on('ui:show-game', () => {
        hud.show();
    });
    
    eventBus.on('ui:hide-game', () => {
        hud.hide();
    });
    
    // Sincronizar controles móviles con el estado del juego
    eventBus.on('ui:show-game', () => {
        if (responsiveUI.isMobile()) {
            responsiveUI.showMobileControls();
        }
    });
    
    eventBus.on('ui:hide-game', () => {
        responsiveUI.hideMobileControls();
    });
    
    // Manejar cambios de dispositivo
    eventBus.on('responsive:device-type-changed', (deviceState) => {
        console.log('[UI] Tipo de dispositivo cambiado:', deviceState);
        
        // Reconfigurar UI según el nuevo tipo de dispositivo
        if (deviceState.isMobile) {
            // Configurar para móvil
            eventBus.emit('ui:configure-mobile');
        } else if (deviceState.isTablet) {
            // Configurar para tablet
            eventBus.emit('ui:configure-tablet');
        } else {
            // Configurar para desktop
            eventBus.emit('ui:configure-desktop');
        }
    });
    
    // Manejar cambios de orientación
    eventBus.on('responsive:orientation-changed', (data) => {
        console.log('[UI] Orientación cambiada:', data);
        
        // Notificar a las pantallas del cambio
        const currentScreen = uiManager.getCurrentScreen();
        if (currentScreen) {
            const screen = uiManager.getScreen(currentScreen);
            if (screen && screen.handleResize) {
                screen.handleResize();
            }
        }
    });
    
    // Sincronizar estadísticas entre módulos
    eventBus.on('game:stats-update', (stats) => {
        hud.updateStats(stats);
    });
    
    // Manejar errores de UI
    eventBus.on('ui:error', (data) => {
        console.error('[UI] Error en módulo UI:', data);
        eventBus.emit('system:ui-error', data);
    });
    
    eventBus.on('hud:error', (data) => {
        console.error('[UI] Error en HUD:', data);
        eventBus.emit('system:hud-error', data);
    });
    
    eventBus.on('responsive:error', (data) => {
        console.error('[UI] Error en ResponsiveUI:', data);
        eventBus.emit('system:responsive-error', data);
    });
    
    console.log('[UI] Comunicación entre módulos UI configurada');
}

/**
 * Configuración por defecto para el sistema UI
 */
export const DEFAULT_UI_CONFIG = {
    ui: {
        animations: {
            enabled: true,
            duration: 300,
            easing: 'ease-out'
        },
        accessibility: {
            announcements: true,
            keyboardNavigation: true,
            highContrast: false
        }
    },
    hud: {
        updateFrequency: 60,
        showTime: true,
        showVelocity: true,
        milestoneAnnouncements: true
    },
    responsive: {
        breakpoints: {
            mobile: 768,
            tablet: 1024,
            desktop: 1200
        },
        mobileControls: {
            hapticFeedback: true,
            gestureThreshold: 50,
            touchTargetSize: 48
        }
    }
};

/**
 * Validar configuración del sistema UI
 * @param {Object} config - Configuración a validar
 * @returns {boolean} Si la configuración es válida
 */
export function validateUIConfig(config) {
    try {
        // Validaciones básicas
        if (!config || typeof config !== 'object') {
            console.warn('[UI] Configuración UI inválida, usando valores por defecto');
            return false;
        }
        
        // Validar breakpoints si existen
        if (config.responsive && config.responsive.breakpoints) {
            const bp = config.responsive.breakpoints;
            if (bp.mobile >= bp.tablet || bp.tablet >= bp.desktop) {
                console.warn('[UI] Breakpoints inválidos, usando valores por defecto');
                return false;
            }
        }
        
        // Validar frecuencia de actualización del HUD
        if (config.hud && config.hud.updateFrequency) {
            if (config.hud.updateFrequency < 1 || config.hud.updateFrequency > 120) {
                console.warn('[UI] Frecuencia de actualización HUD inválida, usando valor por defecto');
                config.hud.updateFrequency = 60;
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('[UI] Error al validar configuración UI:', error);
        return false;
    }
}

/**
 * Obtener configuración UI combinada con valores por defecto
 * @param {Object} userConfig - Configuración del usuario
 * @returns {Object} Configuración combinada
 */
export function getUIConfig(userConfig = {}) {
    // Validar configuración del usuario
    if (!validateUIConfig(userConfig)) {
        userConfig = {};
    }
    
    // Combinar con configuración por defecto
    return {
        ui: { ...DEFAULT_UI_CONFIG.ui, ...(userConfig.ui || {}) },
        hud: { ...DEFAULT_UI_CONFIG.hud, ...(userConfig.hud || {}) },
        responsive: { ...DEFAULT_UI_CONFIG.responsive, ...(userConfig.responsive || {}) }
    };
}