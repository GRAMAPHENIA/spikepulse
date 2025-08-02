/**
 * MenuScreen - Pantalla del menú principal
 * Maneja la interfaz del menú de inicio del juego
 * @module MenuScreen
 */

import { Screen } from './Screen.js';
import { SPANISH_TEXT } from '../../../config/SpanishText.js';

export class MenuScreen extends Screen {
    /**
     * Crea una nueva instancia de MenuScreen
     * @param {Object} config - Configuración de la pantalla
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        super('startScreen', config, eventBus);
        
        // Referencias a elementos específicos del menú
        this.elements = {
            title: null,
            description: null,
            startButton: null,
            controlsInfo: null
        };
    }
    
    /**
     * Configurar elementos específicos del menú
     * @protected
     */
    setupElements() {
        if (!this.element) return;
        
        // Obtener referencias a elementos
        this.elements.title = this.element.querySelector('#main-title');
        this.elements.description = this.element.querySelector('.spikepulse-screen-description');
        this.elements.startButton = this.element.querySelector('#startBtn');
        this.elements.controlsInfo = this.element.querySelector('.spikepulse-controls-info');
        
        // Verificar elementos críticos
        if (!this.elements.startButton) {
            console.error('[MenuScreen] Botón de inicio no encontrado');
        }
        
        // Actualizar textos
        this.updateTexts();
        
        console.log('[MenuScreen] Elementos configurados');
    }
    
    /**
     * Actualizar textos de la pantalla
     * @private
     */
    updateTexts() {
        if (this.elements.title) {
            this.elements.title.textContent = SPANISH_TEXT.GAME_TITLE;
        }
        
        if (this.elements.description) {
            this.elements.description.textContent = SPANISH_TEXT.WELCOME_MESSAGE;
        }
        
        if (this.elements.startButton) {
            this.elements.startButton.textContent = SPANISH_TEXT.START_GAME;
        }
    }
    
    /**
     * Configurar event listeners específicos del menú
     * @protected
     */
    setupEventListeners() {
        if (!this.elements.startButton) return;
        
        // Botón de inicio
        this.elements.startButton.addEventListener('click', () => {
            this.handleStartGame();
        });
        
        // Efectos de hover para mejorar la experiencia
        this.elements.startButton.addEventListener('mouseenter', () => {
            this.elements.startButton.classList.add('spikepulse-screen-button--hover');
        });
        
        this.elements.startButton.addEventListener('mouseleave', () => {
            this.elements.startButton.classList.remove('spikepulse-screen-button--hover');
        });
        
        // Soporte para touch en móviles
        this.elements.startButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.elements.startButton.classList.add('spikepulse-screen-button--active');
        });
        
        this.elements.startButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.elements.startButton.classList.remove('spikepulse-screen-button--active');
            this.handleStartGame();
        });
        
        console.log('[MenuScreen] Event listeners configurados');
    }
    
    /**
     * Configurar accesibilidad específica del menú
     * @protected
     */
    setupAccessibility() {
        super.setupAccessibility();
        
        if (!this.element) return;
        
        // Configurar ARIA labels específicos
        this.element.setAttribute('aria-labelledby', 'main-title');
        this.element.setAttribute('aria-describedby', 'game-description');
        
        if (this.elements.startButton) {
            this.elements.startButton.setAttribute('aria-describedby', 'game-description');
        }
        
        // Agregar descripción oculta para lectores de pantalla
        const description = document.createElement('div');
        description.id = 'game-description';
        description.className = 'sr-only';
        description.textContent = SPANISH_TEXT.WELCOME_MESSAGE + ' ' + SPANISH_TEXT.JUMP_INSTRUCTION;
        this.element.appendChild(description);
        
        console.log('[MenuScreen] Accesibilidad configurada');
    }
    
    /**
     * Manejar eventos de teclado específicos del menú
     * @param {KeyboardEvent} e - Evento de teclado
     * @protected
     */
    onKeyDown(e) {
        switch (e.code) {
            case 'Enter':
            case 'Space':
                if (e.target === this.elements.startButton) {
                    e.preventDefault();
                    this.handleStartGame();
                }
                break;
                
            case 'Escape':
                // En el menú, Escape no hace nada específico
                break;
        }
    }
    
    /**
     * Manejar inicio del juego
     * @private
     */
    handleStartGame() {
        console.log('[MenuScreen] Iniciando juego...');
        
        // Agregar efecto visual al botón
        this.elements.startButton.classList.add('spikepulse-screen-button--loading');
        this.elements.startButton.disabled = true;
        
        // Emitir evento para iniciar el juego
        this.eventBus.emit('game:start');
        
        // También emitir evento de cambio de estado
        this.eventBus.emit('state:request-change', { to: 'playing' });
        
        // Anunciar a lectores de pantalla
        this.announceToScreenReader(SPANISH_TEXT.GAME_STARTED);
        
        // Restaurar botón después de un breve delay
        setTimeout(() => {
            if (this.elements.startButton) {
                this.elements.startButton.classList.remove('spikepulse-screen-button--loading');
                this.elements.startButton.disabled = false;
            }
        }, 1000);
    }
    
    /**
     * Método llamado cuando se muestra la pantalla
     * @param {Object} data - Datos de la pantalla
     * @protected
     */
    onShow(data) {
        console.log('[MenuScreen] Pantalla de menú mostrada');
        
        // Asegurar que el botón esté habilitado
        if (this.elements.startButton) {
            this.elements.startButton.disabled = false;
            this.elements.startButton.classList.remove('spikepulse-screen-button--loading');
        }
        
        // Reproducir animación de entrada si está configurada
        this.playEntranceAnimation();
        
        // Anunciar a lectores de pantalla
        this.announceToScreenReader(SPANISH_TEXT.MENU_AREA_LABEL);
    }
    
    /**
     * Método llamado cuando se oculta la pantalla
     * @protected
     */
    onHide() {
        console.log('[MenuScreen] Pantalla de menú ocultada');
        
        // Detener cualquier animación en curso
        this.stopAnimations();
    }
    
    /**
     * Reproducir animación de entrada
     * @private
     */
    playEntranceAnimation() {
        if (!this.element) return;
        
        // Agregar clase de animación
        this.element.classList.add('spikepulse-screen-overlay--entering');
        
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
    }
    
    /**
     * Manejar cambio de tamaño de ventana
     */
    handleResize() {
        // Ajustar layout si es necesario para diferentes tamaños de pantalla
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            this.element.classList.add('spikepulse-screen-overlay--mobile');
        } else {
            this.element.classList.remove('spikepulse-screen-overlay--mobile');
        }
        
        console.log('[MenuScreen] Resize manejado, móvil:', isMobile);
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
     * Actualizar información de controles
     * @param {Object} controlsConfig - Configuración de controles
     */
    updateControlsInfo(controlsConfig) {
        if (!this.elements.controlsInfo) return;
        
        // Actualizar información de controles basada en la configuración
        const controlsList = this.elements.controlsInfo.querySelector('.spikepulse-controls-info__list');
        if (controlsList) {
            // Limpiar lista actual
            controlsList.innerHTML = '';
            
            // Agregar controles actualizados
            const controls = [
                { icon: '🖱️', text: `Click / Espacio: ${SPANISH_TEXT.JUMP}` },
                { icon: '← →', text: `A D: ${SPANISH_TEXT.MOVE_LEFT}/${SPANISH_TEXT.MOVE_RIGHT}` },
                { icon: '⚡', text: `Shift: ${SPANISH_TEXT.DASH_ACTION}` },
                { icon: '🔄', text: `Ctrl: ${SPANISH_TEXT.TOGGLE_GRAVITY}` }
            ];
            
            controls.forEach(control => {
                const listItem = document.createElement('li');
                listItem.className = 'spikepulse-controls-info__item';
                listItem.innerHTML = `
                    <span class="spikepulse-controls-info__icon">${control.icon}</span>
                    ${control.text}
                `;
                controlsList.appendChild(listItem);
            });
        }
        
        console.log('[MenuScreen] Información de controles actualizada');
    }
    
    /**
     * Obtener estadísticas específicas del menú
     * @returns {Object} Estadísticas
     */
    getStats() {
        const baseStats = super.getStats();
        return {
            ...baseStats,
            hasStartButton: !!this.elements.startButton,
            startButtonEnabled: this.elements.startButton ? !this.elements.startButton.disabled : false
        };
    }
    
    /**
     * Destruir la pantalla del menú
     * @protected
     */
    onDestroy() {
        // Limpiar referencias específicas del menú
        this.elements = {
            title: null,
            description: null,
            startButton: null,
            controlsInfo: null
        };
        
        console.log('[MenuScreen] Pantalla de menú destruida');
    }
}