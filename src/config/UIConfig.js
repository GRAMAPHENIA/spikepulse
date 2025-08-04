/**
 * Configuración específica de interfaz de usuario para Spikepulse
 * @module UIConfig
 */

export const UI_CONFIG = {
    // Configuración de pantallas
    screens: {
        menu: {
            id: 'menu-screen',
            className: 'sp-screen sp-screen--menu',
            elements: ['title', 'startButton', 'settingsButton', 'recordsButton'],
            animations: {
                fadeIn: 500,
                fadeOut: 300,
                slideIn: 400
            }
        },
        playing: {
            id: 'playing-screen',
            className: 'sp-screen sp-screen--playing',
            elements: ['canvas', 'hud', 'pauseButton'],
            animations: {
                fadeIn: 200,
                fadeOut: 200
            }
        },
        paused: {
            id: 'paused-screen',
            className: 'sp-screen sp-screen--paused',
            elements: ['pauseTitle', 'resumeButton', 'restartButton', 'menuButton'],
            animations: {
                fadeIn: 300,
                fadeOut: 200
            }
        },
        gameOver: {
            id: 'gameover-screen',
            className: 'sp-screen sp-screen--gameover',
            elements: ['gameOverTitle', 'finalScore', 'restartButton', 'menuButton'],
            animations: {
                fadeIn: 500,
                fadeOut: 300,
                scoreCount: 1000
            }
        },
        settings: {
            id: 'settings-screen',
            className: 'sp-screen sp-screen--settings',
            elements: ['settingsTitle', 'controls', 'audio', 'graphics', 'backButton'],
            animations: {
                fadeIn: 400,
                fadeOut: 300
            }
        }
    },
    
    // Configuración del HUD
    hud: {
        position: 'top-left',
        className: 'sp-hud',
        elements: {
            distance: {
                id: 'distance-display',
                label: 'Distancia',
                format: '{value}m',
                position: { x: 20, y: 20 },
                fontSize: '24px',
                color: '#FFD700'
            },
            jumps: {
                id: 'jumps-display',
                label: 'Saltos',
                format: '{value}',
                position: { x: 20, y: 60 },
                fontSize: '18px',
                color: '#FFFFFF'
            },
            dash: {
                id: 'dash-display',
                label: 'Dash',
                format: '{available}',
                position: { x: 20, y: 90 },
                fontSize: '18px',
                color: '#9F7AEA'
            },
            gravity: {
                id: 'gravity-display',
                label: 'Gravedad',
                format: '{direction}',
                position: { x: 20, y: 120 },
                fontSize: '18px',
                color: '#FF6B6B'
            },
            fps: {
                id: 'fps-display',
                label: 'FPS',
                format: '{value}',
                position: { x: 20, y: 150 },
                fontSize: '14px',
                color: '#888888',
                visible: false
            }
        },
        animations: {
            fadeIn: 300,
            fadeOut: 200,
            pulse: 1000,
            shake: 200
        }
    },
    
    // Configuración de botones
    buttons: {
        primary: {
            className: 'sp-btn sp-btn--primary',
            styles: {
                backgroundColor: '#FFD700',
                color: '#000000',
                border: 'none',
                padding: '12px 24px',
                fontSize: '18px',
                fontFamily: 'Orbitron, monospace',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
            },
            hover: {
                backgroundColor: '#FFC700',
                transform: 'scale(1.05)',
                boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)'
            },
            active: {
                transform: 'scale(0.95)'
            }
        },
        secondary: {
            className: 'sp-btn sp-btn--secondary',
            styles: {
                backgroundColor: 'transparent',
                color: '#FFD700',
                border: '2px solid #FFD700',
                padding: '10px 22px',
                fontSize: '16px',
                fontFamily: 'Orbitron, monospace',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
            },
            hover: {
                backgroundColor: '#FFD700',
                color: '#000000',
                boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)'
            }
        },
        danger: {
            className: 'sp-btn sp-btn--danger',
            styles: {
                backgroundColor: '#FF6B6B',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 24px',
                fontSize: '18px',
                fontFamily: 'Orbitron, monospace',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
            },
            hover: {
                backgroundColor: '#FF5252',
                boxShadow: '0 0 20px rgba(255, 107, 107, 0.5)'
            }
        }
    },
    
    // Configuración de texto
    text: {
        spanish: {
            // Títulos principales
            gameTitle: 'Spikepulse',
            gameSubtitle: 'Domina la Gravedad',
            
            // Botones principales
            startGame: 'Comenzar Aventura',
            continueGame: 'Continuar',
            newGame: 'Nuevo Juego',
            settings: 'Configuración',
            records: 'Récords',
            exit: 'Salir',
            
            // Estados del juego
            paused: 'Pausado',
            gameOver: '¡Juego Terminado!',
            loading: 'Cargando...',
            ready: 'Listo',
            
            // Controles
            pause: 'Pausa',
            resume: 'Reanudar',
            restart: 'Reiniciar',
            backToMenu: 'Volver al Menú',
            
            // Estadísticas
            distance: 'Distancia',
            bestDistance: 'Mejor Distancia',
            totalJumps: 'Saltos Totales',
            totalDashes: 'Dashes Totales',
            playTime: 'Tiempo Jugado',
            gamesPlayed: 'Partidas Jugadas',
            
            // Habilidades
            jump: 'Saltar',
            doubleJump: 'Salto Doble',
            dash: 'Dash',
            dashAvailable: 'Disponible',
            dashCooldown: 'Recargando',
            gravity: 'Gravedad',
            gravityNormal: 'Normal',
            gravityInverted: 'Invertida',
            
            // Mensajes
            newRecord: '¡Nuevo Récord!',
            wellDone: '¡Bien Hecho!',
            tryAgain: '¡Inténtalo de Nuevo!',
            getReady: 'Prepárate...',
            
            // Instrucciones
            jumpInstruction: 'ESPACIO o CLIC para saltar',
            dashInstruction: 'SHIFT para dash',
            gravityInstruction: 'CTRL para cambiar gravedad',
            pauseInstruction: 'ESC para pausar',
            
            // Configuración
            controls: 'Controles',
            audio: 'Audio',
            graphics: 'Gráficos',
            language: 'Idioma',
            difficulty: 'Dificultad',
            
            // Niveles de dificultad
            easy: 'Fácil',
            normal: 'Normal',
            hard: 'Difícil',
            extreme: 'Extremo',
            
            // Errores
            canvasNotSupported: 'Tu navegador no soporta canvas',
            loadingError: 'Error al cargar el juego',
            saveError: 'Error al guardar',
            
            // Accesibilidad
            canvasAlt: 'Canvas del juego Spikepulse',
            gameAreaLabel: 'Área de juego principal',
            statsAreaLabel: 'Estadísticas del juego',
            controlsAreaLabel: 'Controles del juego'
        }
    },
    
    // Configuración de animaciones
    animations: {
        transitions: {
            screenFade: {
                duration: 300,
                easing: 'ease-in-out'
            },
            buttonHover: {
                duration: 200,
                easing: 'ease-out'
            },
            scoreCount: {
                duration: 1000,
                easing: 'ease-out'
            },
            pulse: {
                duration: 2000,
                easing: 'ease-in-out',
                iterations: 'infinite'
            }
        },
        effects: {
            glow: {
                enabled: true,
                intensity: 0.8,
                color: '#FFD700',
                blur: 10
            },
            particles: {
                enabled: true,
                count: 20,
                speed: 2,
                lifetime: 1000
            },
            shake: {
                enabled: true,
                intensity: 3,
                duration: 200
            }
        }
    },
    
    // Configuración de layout responsivo
    responsive: {
        breakpoints: {
            mobile: 768,
            tablet: 1024,
            desktop: 1200
        },
        layouts: {
            mobile: {
                hud: {
                    position: 'bottom',
                    fontSize: '16px'
                },
                buttons: {
                    minHeight: '44px',
                    fontSize: '16px'
                }
            },
            tablet: {
                hud: {
                    position: 'top-left',
                    fontSize: '18px'
                },
                buttons: {
                    minHeight: '40px',
                    fontSize: '17px'
                }
            },
            desktop: {
                hud: {
                    position: 'top-left',
                    fontSize: '20px'
                },
                buttons: {
                    minHeight: '36px',
                    fontSize: '18px'
                }
            }
        }
    },
    
    // Configuración de accesibilidad
    accessibility: {
        focusVisible: true,
        highContrast: false,
        reducedMotion: false,
        screenReader: {
            enabled: true,
            announcements: true,
            liveRegions: true
        },
        keyboard: {
            navigation: true,
            shortcuts: true,
            trapFocus: true
        }
    }
};

/**
 * Obtener texto en español para una clave específica
 * @param {string} key - Clave del texto
 * @returns {string} Texto en español
 */
export function getSpanishText(key) {
    const keys = key.split('.');
    let current = UI_CONFIG.text.spanish;
    
    for (const k of keys) {
        if (current[k] === undefined) {
            console.warn(`Texto no encontrado para la clave: ${key}`);
            return key;
        }
        current = current[k];
    }
    
    return current;
}

/**
 * Obtener configuración de pantalla
 * @param {string} screenName - Nombre de la pantalla
 * @returns {Object} Configuración de la pantalla
 */
export function getScreenConfig(screenName) {
    return UI_CONFIG.screens[screenName] || null;
}

/**
 * Obtener configuración de botón
 * @param {string} buttonType - Tipo de botón
 * @returns {Object} Configuración del botón
 */
export function getButtonConfig(buttonType) {
    return UI_CONFIG.buttons[buttonType] || UI_CONFIG.buttons.primary;
}