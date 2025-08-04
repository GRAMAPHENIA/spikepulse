/**
 * Configuración específica de desarrollo para UI
 */

export default {
    // Configuración de pantallas con debugging
    screens: {
        menu: {
            animations: {
                fadeIn: 200, // Animaciones más rápidas para desarrollo
                fadeOut: 100,
                slideIn: 200
            }
        },
        playing: {
            animations: {
                fadeIn: 100,
                fadeOut: 100
            }
        }
    },
    
    // HUD con información de desarrollo
    hud: {
        elements: {
            distance: {
                fontSize: '28px', // Texto más grande para desarrollo
                color: '#FFD700'
            },
            jumps: {
                fontSize: '20px',
                color: '#FFFFFF'
            },
            dash: {
                fontSize: '20px',
                color: '#9F7AEA'
            },
            gravity: {
                fontSize: '20px',
                color: '#FF6B6B'
            },
            fps: {
                fontSize: '16px',
                color: '#00FF00',
                visible: true // FPS visible en desarrollo
            },
            debug: {
                fontSize: '14px',
                color: '#FFFF00',
                visible: true,
                position: { x: 20, y: 200 }
            }
        }
    },
    
    // Animaciones más rápidas para desarrollo
    animations: {
        transitions: {
            screenFade: {
                duration: 200,
                easing: 'ease-out'
            },
            buttonHover: {
                duration: 100,
                easing: 'ease-out'
            }
        }
    },
    
    // Accesibilidad con más información
    accessibility: {
        focusVisible: true,
        highContrast: false,
        reducedMotion: false,
        screenReader: {
            enabled: true,
            announcements: true,
            liveRegions: true,
            verboseMode: true // Modo verboso para desarrollo
        },
        keyboard: {
            navigation: true,
            shortcuts: true,
            trapFocus: true,
            debugKeys: true // Teclas de debug habilitadas
        }
    }
};