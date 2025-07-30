/**
 * PauseScreen - Pantalla de pausa del juego
 * Maneja la interfaz cuando el juego está pausado
 * @module PauseScreen
 */

import { Screen } from './Screen.js';
import { SPANISH_TEXT } from '../../../config/SpanishText.js';

export class PauseScreen extends Screen {
    /**
     * Crea una nueva instancia de PauseScreen
     * @param {Object} config - Configuración de la pantalla
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        // Crear elemento de pausa dinámicamente ya que no existe en el HTML
        super('pauseScreen', config, eventBus);
        
        // Referencias a elementos específicos de pausa
        this.elements = {
            overlay: null,
            content: null,
            title: null,
            resumeButton: null,
            restartButton: null,
            menuButton: null,
            pauseButton: null
        };
        
        // Crear elemento de pausa si no existe
        this.createPauseElement();
    }
    
    /**
     * Crear elemento de pausa dinámicamente
     * @private
     */
    createPauseElement() {
        // Verificar si ya existe
        let pauseElement = document.getElementById('pauseScreen');
        if (pauseElement) {
            this.element = pauseElement;
            return;
        }
        
        // Crear elemento de pausa
        pauseElement = document.createElement('div');
        pauseElement.id = 'pauseScreen';
        pauseElement.className = 'spikepulse-screen-overlay spikepulse-screen-overlay--pause spikepulse-hidden';
        pauseElement.setAttribute('role', 'dialog');
        pauseElement.setAttribute('aria-labelledby', 'pause-title');
        pauseElement.setAttribute('aria-modal', 'true');
        
        pauseElement.innerHTML = `
            <div class="spikepulse-screen-content spikepulse-screen-content--pause">
                <h2 id="pause-title" class="spikepulse-screen-title spikepulse-screen-title--pause">
                    ${SPANISH_TEXT.PAUSED}
                </h2>
                <div class="pause-buttons">
                    <button id="resumeBtn" class="spikepulse-screen-button spikepulse-screen-button--primary">
                        ${SPANISH_TEXT.RESUME_GAME}
                    </button>
                    <button id="pauseRestartBtn" class="spikepulse-screen-button spikepulse-screen-button--secondary">
                        ${SPANISH_TEXT.RESTART_GAME}
                    </button>
                    <button id="pauseMenuBtn" class="spikepulse-screen-button spikepulse-screen-button--tertiary">
                        ${SPANISH_TEXT.MENU}
                    </button>
                </div>
                <div class="pause-instructions">
                    <p class="pause-instructions__text">
                        Presiona <kbd>ESC</kbd> o <kbd>ESPACIO</kbd> para continuar
                    </p>
                </div>
            </div>
        `;
        
        // Agregar al DOM
        document.body.appendChild(pauseElement);
        this.element = pauseElement;
        
        console.log('[PauseScreen] Elemento de pausa creado dinámicamente');
    }
    
    /**
     * Configurar elementos específicos de pausa
     * @protected
     */
    setupElements() {
        if (!this.element) return;
        
        // Obtener referencias a elementos
        this.elements.overlay = this.element;
        this.elements.content = this.element.querySelector('.spikepulse-screen-content');
        this.elements.title = this.element.querySelector('#pause-title');
        this.elements.resumeButton = this.element.querySelector('#resumeBtn');
        this.elements.restartButton = this.element.querySelector('#pauseRestartBtn');
        this.elements.menuButton = this.element.querySelector('#pauseMenuBtn');
        
        // Obtener referencia al botón de pausa del juego
        this.elements.pauseButton = document.getElementById('pauseBtn');
        
        // Verificar elementos críticos
        if (!this.elements.resumeButton) {
            console.error('[PauseScreen] Botón de reanudar no encontrado');
        }
        
        console.log('[PauseScreen] Elementos configurados');
    }
    
    /**
     * Configurar event listeners específicos de pausa
     * @protected
     */
    setupEventListeners() {
        // Botón de reanudar
        if (this.elements.resumeButton) {
            this.elements.resumeButton.addEventListener('click', () => {
                this.handleResume();
            });
            this.setupButtonEffects(this.elements.resumeButton);
        }
        
        // Botón de reiniciar
        if (this.elements.restartButton) {
            this.elements.restartButton.addEventListener('click', () => {
                this.handleRestart();
            });
            this.setupButtonEffects(this.elements.restartButton);
        }
        
        // Botón de menú
        if (this.elements.menuButton) {
            this.elements.menuButton.addEventListener('click', () => {
                this.handleBackToMenu();
            });
            this.setupButtonEffects(this.elements.menuButton);
        }
        
        // Botón de pausa del juego (para alternar)
        if (this.elements.pauseButton) {
            this.elements.pauseButton.addEventListener('click', () => {
                this.handleTogglePause();
            });
        }
        
        // Click en overlay para reanudar (opcional)
        if (this.elements.overlay) {
            this.elements.overlay.addEventListener('click', (e) => {
                // Solo si se hace click en el overlay, no en el contenido
                if (e.target === this.elements.overlay) {
                    this.handleResume();
                }
            });
        }
        
        console.log('[PauseScreen] Event listeners configurados');
    }
    
    /**
     * Configurar efectos visuales para botones
     * @param {HTMLElement} button - Elemento del botón
     * @private
     */
    setupButtonEffects(button) {
        // Efectos de hover
        button.addEventListener('mouseenter', () => {
            button.classList.add('spikepulse-screen-button--hover');
        });
        
        button.addEventListener('mouseleave', () => {
            button.classList.remove('spikepulse-screen-button--hover');
        });
        
        // Soporte para touch en móviles
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            button.classList.add('spikepulse-screen-button--active');
        });
        
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            button.classList.remove('spikepulse-screen-button--active');
        });
    }
    
    /**
     * Configurar accesibilidad específica de pausa
     * @protected
     */
    setupAccessibility() {
        super.setupAccessibility();
        
        if (!this.element) return;
        
        // Configurar ARIA labels específicos
        this.element.setAttribute('aria-labelledby', 'pause-title');
        
        // Configurar descripción para lectores de pantalla
        const description = document.createElement('div');
        description.id = 'pause-description';
        description.className = 'sr-only';
        description.textContent = 'Juego pausado. Usa los botones o presiona Escape para continuar.';
        this.element.appendChild(description);
        
        this.element.setAttribute('aria-describedby', 'pause-description');
        
        console.log('[PauseScreen] Accesibilidad configurada');
    }
    
    /**
     * Manejar eventos de teclado específicos de pausa
     * @param {KeyboardEvent} e - Evento de teclado
     * @protected
     */
    onKeyDown(e) {
        switch (e.code) {
            case 'Escape':
            case 'Space':
                // Escape o Espacio para reanudar
                e.preventDefault();
                this.handleResume();
                break;
                
            case 'Enter':
                // Enter en botones
                if (e.target === this.elements.resumeButton) {
                    e.preventDefault();
                    this.handleResume();
                } else if (e.target === this.elements.restartButton) {
                    e.preventDefault();
                    this.handleRestart();
                } else if (e.target === this.elements.menuButton) {
                    e.preventDefault();
                    this.handleBackToMenu();
                }
                break;
                
            case 'KeyR':
                // Atajo de teclado para reiniciar
                e.preventDefault();
                this.handleRestart();
                break;
                
            case 'KeyM':
                // Atajo de teclado para menú
                e.preventDefault();
                this.handleBackToMenu();
                break;
        }
    }
    
    /**
     * Manejar reanudación del juego
     * @private
     */
    handleResume() {
        console.log('[PauseScreen] Reanudando juego...');
        
        // Emitir evento para reanudar el juego
        this.eventBus.emit('game:resume');
        
        // También emitir evento de cambio de estado
        this.eventBus.emit('state:request-change', { to: 'playing' });
        
        // Actualizar botón de pausa del juego
        if (this.elements.pauseButton) {
            this.elements.pauseButton.textContent = SPANISH_TEXT.PAUSE_GAME;
        }
        
        // Anunciar a lectores de pantalla
        this.announceToScreenReader(SPANISH_TEXT.GAME_RESUMED);
    }
    
    /**
     * Manejar alternancia de pausa
     * @private
     */
    handleTogglePause() {
        console.log('[PauseScreen] Alternando pausa...');
        
        if (this.isVisible) {
            this.handleResume();
        } else {
            // Emitir evento para pausar
            this.eventBus.emit('game:pause');
            this.eventBus.emit('state:request-change', { to: 'paused' });
            
            // Actualizar botón de pausa
            if (this.elements.pauseButton) {
                this.elements.pauseButton.textContent = SPANISH_TEXT.RESUME_GAME;
            }
            
            // Anunciar a lectores de pantalla
            this.announceToScreenReader(SPANISH_TEXT.GAME_PAUSED);
        }
    }
    
    /**
     * Manejar reinicio del juego
     * @private
     */
    handleRestart() {
        console.log('[PauseScreen] Reiniciando juego desde pausa...');
        
        // Agregar efecto visual al botón
        if (this.elements.restartButton) {
            this.elements.restartButton.classList.add('spikepulse-screen-button--loading');
            this.elements.restartButton.disabled = true;
        }
        
        // Emitir evento para reiniciar el juego
        this.eventBus.emit('game:restart');
        
        // También emitir evento de cambio de estado
        this.eventBus.emit('state:request-change', { to: 'playing' });
        
        // Actualizar botón de pausa del juego
        if (this.elements.pauseButton) {
            this.elements.pauseButton.textContent = SPANISH_TEXT.PAUSE_GAME;
        }
        
        // Anunciar a lectores de pantalla
        this.announceToScreenReader(SPANISH_TEXT.GAME_STARTED);
        
        // Restaurar botón después de un breve delay
        setTimeout(() => {
            if (this.elements.restartButton) {
                this.elements.restartButton.classList.remove('spikepulse-screen-button--loading');
                this.elements.restartButton.disabled = false;
            }
        }, 1000);
    }
    
    /**
     * Manejar vuelta al menú
     * @private
     */
    handleBackToMenu() {
        console.log('[PauseScreen] Volviendo al menú desde pausa...');
        
        // Emitir evento para volver al menú
        this.eventBus.emit('game:menu');
        
        // También emitir evento de cambio de estado
        this.eventBus.emit('state:request-change', { to: 'menu' });
        
        // Resetear botón de pausa del juego
        if (this.elements.pauseButton) {
            this.elements.pauseButton.textContent = SPANISH_TEXT.PAUSE_GAME;
        }
        
        // Anunciar a lectores de pantalla
        this.announceToScreenReader(SPANISH_TEXT.MENU_AREA_LABEL);
    }
    
    /**
     * Método llamado cuando se muestra la pantalla
     * @param {Object} data - Datos de la pantalla
     * @protected
     */
    onShow(data) {
        console.log('[PauseScreen] Pantalla de pausa mostrada');
        
        // Asegurar que los botones estén habilitados
        if (this.elements.resumeButton) {
            this.elements.resumeButton.disabled = false;
        }
        if (this.elements.restartButton) {
            this.elements.restartButton.disabled = false;
            this.elements.restartButton.classList.remove('spikepulse-screen-button--loading');
        }
        if (this.elements.menuButton) {
            this.elements.menuButton.disabled = false;
        }
        
        // Actualizar botón de pausa del juego
        if (this.elements.pauseButton) {
            this.elements.pauseButton.textContent = SPANISH_TEXT.RESUME_GAME;
        }
        
        // Reproducir animación de entrada
        this.playEntranceAnimation();
        
        // Anunciar a lectores de pantalla
        this.announceToScreenReader(SPANISH_TEXT.GAME_PAUSED);
        
        // Pausar cualquier animación del juego en el fondo
        this.pauseBackgroundAnimations();
    }
    
    /**
     * Método llamado cuando se oculta la pantalla
     * @protected
     */
    onHide() {
        console.log('[PauseScreen] Pantalla de pausa ocultada');
        
        // Reanudar animaciones del juego en el fondo
        this.resumeBackgroundAnimations();
        
        // Detener animaciones de la pantalla
        this.stopAnimations();
    }
    
    /**
     * Pausar animaciones del fondo
     * @private
     */
    pauseBackgroundAnimations() {
        // Pausar animaciones CSS del fondo
        const fogElements = document.querySelectorAll('.spikepulse-fog__particle');
        fogElements.forEach(element => {
            element.style.animationPlayState = 'paused';
        });
    }
    
    /**
     * Reanudar animaciones del fondo
     * @private
     */
    resumeBackgroundAnimations() {
        // Reanudar animaciones CSS del fondo
        const fogElements = document.querySelectorAll('.spikepulse-fog__particle');
        fogElements.forEach(element => {
            element.style.animationPlayState = 'running';
        });
    }
    
    /**
     * Reproducir animación de entrada
     * @private
     */
    playEntranceAnimation() {
        if (!this.element) return;
        
        // Agregar clase de animación
        this.element.classList.add('spikepulse-screen-overlay--entering');
        
        // Animar botones uno por uno
        const buttons = this.element.querySelectorAll('.spikepulse-screen-button');
        buttons.forEach((button, index) => {
            setTimeout(() => {
                button.classList.add('spikepulse-screen-button--visible');
            }, 100 + (index * 100));
        });
        
        // Remover clase después de la animación
        setTimeout(() => {
            if (this.element) {
                this.element.classList.remove('spikepulse-screen-overlay--entering');
            }
        }, 500);
    }
    
    /**
     * Detener animaciones
     * @private
     */
    stopAnimations() {
        if (!this.element) return;
        
        // Remover clases de animación
        this.element.classList.remove('spikepulse-screen-overlay--entering');
        this.element.classList.remove('spikepulse-screen-overlay--exiting');
        
        // Remover animaciones de botones
        const buttons = this.element.querySelectorAll('.spikepulse-screen-button');
        buttons.forEach(button => {
            button.classList.remove('spikepulse-screen-button--visible');
        });
    }
    
    /**
     * Anunciar mensaje a lectores de pantalla
     * @param {string} message - Mensaje a anunciar
     * @param {string} priority - Prioridad del anuncio
     * @private
     */
    announceToScreenReader(message, priority = 'polite') {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            if (document.body.contains(announcement)) {
                document.body.removeChild(announcement);
            }
        }, 1000);
    }
    
    /**
     * Manejar cambio de tamaño de ventana
     */
    handleResize() {
        // Ajustar layout para diferentes tamaños de pantalla
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            this.element.classList.add('spikepulse-screen-overlay--mobile');
        } else {
            this.element.classList.remove('spikepulse-screen-overlay--mobile');
        }
        
        console.log('[PauseScreen] Resize manejado, móvil:', isMobile);
    }
    
    /**
     * Obtener estadísticas específicas de pausa
     * @returns {Object} Estadísticas
     */
    getStats() {
        const baseStats = super.getStats();
        return {
            ...baseStats,
            hasResumeButton: !!this.elements.resumeButton,
            hasRestartButton: !!this.elements.restartButton,
            hasMenuButton: !!this.elements.menuButton,
            hasPauseButton: !!this.elements.pauseButton
        };
    }
    
    /**
     * Destruir la pantalla de pausa
     * @protected
     */
    onDestroy() {
        // Remover elemento del DOM si fue creado dinámicamente
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        // Limpiar referencias específicas de pausa
        this.elements = {
            overlay: null,
            content: null,
            title: null,
            resumeButton: null,
            restartButton: null,
            menuButton: null,
            pauseButton: null
        };
        
        console.log('[PauseScreen] Pantalla de pausa destruida');
    }
}