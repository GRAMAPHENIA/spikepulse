/**
 * GameOverScreen - Pantalla de fin de juego
 * Maneja la interfaz cuando el jugador pierde
 * @module GameOverScreen
 */

import { Screen } from './Screen.js';
import { SPANISH_TEXT, formatDistance, formatTime } from '../../../config/SpanishText.js';

export class GameOverScreen extends Screen {
    /**
     * Crea una nueva instancia de GameOverScreen
     * @param {Object} config - Configuración de la pantalla
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        super('gameOverScreen', config, eventBus);
        
        // Referencias a elementos específicos de game over
        this.elements = {
            title: null,
            finalScore: null,
            restartButton: null,
            menuButton: null,
            statsContainer: null
        };
        
        // Datos del juego
        this.gameData = {
            distance: 0,
            time: 0,
            jumps: 0,
            dashes: 0,
            bestDistance: 0
        };
    }
    
    /**
     * Configurar elementos específicos de game over
     * @protected
     */
    setupElements() {
        if (!this.element) return;
        
        // Obtener referencias a elementos
        this.elements.title = this.element.querySelector('#game-over-title');
        this.elements.finalScore = this.element.querySelector('#finalScore');
        this.elements.restartButton = this.element.querySelector('#restartBtn');
        
        // Crear botón de menú si no existe
        this.createMenuButton();
        
        // Crear contenedor de estadísticas detalladas
        this.createStatsContainer();
        
        // Verificar elementos críticos
        if (!this.elements.restartButton) {
            console.error('[GameOverScreen] Botón de reinicio no encontrado');
        }
        
        // Actualizar textos
        this.updateTexts();
        
        console.log('[GameOverScreen] Elementos configurados');
    }
    
    /**
     * Crear botón de menú
     * @private
     */
    createMenuButton() {
        if (this.element.querySelector('#menuBtn')) return;
        
        const menuButton = document.createElement('button');
        menuButton.id = 'menuBtn';
        menuButton.className = 'spikepulse-screen-button spikepulse-screen-button--tertiary';
        menuButton.textContent = SPANISH_TEXT.MENU;
        menuButton.setAttribute('aria-label', 'Volver al menú principal');
        
        // Insertar después del botón de reinicio
        if (this.elements.restartButton) {
            this.elements.restartButton.parentNode.insertBefore(
                menuButton, 
                this.elements.restartButton.nextSibling
            );
        } else {
            this.element.querySelector('.spikepulse-screen-content').appendChild(menuButton);
        }
        
        this.elements.menuButton = menuButton;
    }
    
    /**
     * Crear contenedor de estadísticas detalladas
     * @private
     */
    createStatsContainer() {
        if (this.element.querySelector('.game-over-stats')) return;
        
        const statsContainer = document.createElement('div');
        statsContainer.className = 'game-over-stats';
        statsContainer.innerHTML = `
            <h3 class="game-over-stats__title">${SPANISH_TEXT.STATISTICS}</h3>
            <div class="game-over-stats__grid">
                <div class="game-over-stats__item">
                    <span class="game-over-stats__label">${SPANISH_TEXT.DISTANCE}</span>
                    <span class="game-over-stats__value" id="stats-distance">0m</span>
                </div>
                <div class="game-over-stats__item">
                    <span class="game-over-stats__label">${SPANISH_TEXT.TIME}</span>
                    <span class="game-over-stats__value" id="stats-time">0s</span>
                </div>
                <div class="game-over-stats__item">
                    <span class="game-over-stats__label">${SPANISH_TEXT.JUMPS}</span>
                    <span class="game-over-stats__value" id="stats-jumps">0</span>
                </div>
                <div class="game-over-stats__item">
                    <span class="game-over-stats__label">${SPANISH_TEXT.DASH}</span>
                    <span class="game-over-stats__value" id="stats-dashes">0</span>
                </div>
                <div class="game-over-stats__item game-over-stats__item--highlight">
                    <span class="game-over-stats__label">${SPANISH_TEXT.BEST_DISTANCE}</span>
                    <span class="game-over-stats__value" id="stats-best">0m</span>
                </div>
            </div>
        `;
        
        // Insertar antes de los botones
        const buttonsContainer = this.element.querySelector('.spikepulse-screen-content');
        if (buttonsContainer && this.elements.restartButton) {
            buttonsContainer.insertBefore(statsContainer, this.elements.restartButton);
        }
        
        this.elements.statsContainer = statsContainer;
    }
    
    /**
     * Actualizar textos de la pantalla
     * @private
     */
    updateTexts() {
        if (this.elements.title) {
            this.elements.title.textContent = SPANISH_TEXT.GAME_OVER;
        }
        
        if (this.elements.restartButton) {
            this.elements.restartButton.textContent = SPANISH_TEXT.RESTART_GAME;
        }
        
        if (this.elements.menuButton) {
            this.elements.menuButton.textContent = SPANISH_TEXT.MENU;
        }
    }
    
    /**
     * Configurar event listeners específicos de game over
     * @protected
     */
    setupEventListeners() {
        // Botón de reinicio
        if (this.elements.restartButton) {
            this.elements.restartButton.addEventListener('click', () => {
                this.handleRestart();
            });
            
            // Efectos visuales
            this.setupButtonEffects(this.elements.restartButton);
        }
        
        // Botón de menú
        if (this.elements.menuButton) {
            this.elements.menuButton.addEventListener('click', () => {
                this.handleBackToMenu();
            });
            
            // Efectos visuales
            this.setupButtonEffects(this.elements.menuButton);
        }
        
        console.log('[GameOverScreen] Event listeners configurados');
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
     * Configurar accesibilidad específica de game over
     * @protected
     */
    setupAccessibility() {
        super.setupAccessibility();
        
        if (!this.element) return;
        
        // Configurar ARIA labels específicos
        this.element.setAttribute('aria-labelledby', 'game-over-title');
        this.element.setAttribute('aria-describedby', 'finalScore');
        
        // Configurar anuncio automático para lectores de pantalla
        this.element.setAttribute('aria-live', 'assertive');
        
        console.log('[GameOverScreen] Accesibilidad configurada');
    }
    
    /**
     * Manejar eventos de teclado específicos de game over
     * @param {KeyboardEvent} e - Evento de teclado
     * @protected
     */
    onKeyDown(e) {
        switch (e.code) {
            case 'Enter':
            case 'Space':
                if (e.target === this.elements.restartButton) {
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
                
            case 'Escape':
                // Escape vuelve al menú
                this.handleBackToMenu();
                break;
        }
    }
    
    /**
     * Manejar reinicio del juego
     * @private
     */
    handleRestart() {
        console.log('[GameOverScreen] Reiniciando juego...');
        
        // Agregar efecto visual al botón
        if (this.elements.restartButton) {
            this.elements.restartButton.classList.add('spikepulse-screen-button--loading');
            this.elements.restartButton.disabled = true;
        }
        
        // Emitir evento para reiniciar el juego
        this.eventBus.emit('game:restart');
        
        // También emitir evento de cambio de estado
        this.eventBus.emit('state:request-change', { to: 'playing' });
        
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
        console.log('[GameOverScreen] Volviendo al menú...');
        
        // Emitir evento para volver al menú
        this.eventBus.emit('game:menu');
        
        // También emitir evento de cambio de estado
        this.eventBus.emit('state:request-change', { to: 'menu' });
        
        // Anunciar a lectores de pantalla
        this.announceToScreenReader(SPANISH_TEXT.MENU_AREA_LABEL);
    }
    
    /**
     * Actualizar datos de la pantalla
     * @param {Object} data - Nuevos datos del juego
     * @protected
     */
    updateData(data) {
        // Actualizar datos del juego
        this.gameData = { ...this.gameData, ...data };
        
        // Actualizar elementos visuales
        this.updateScoreDisplay();
        this.updateStatsDisplay();
        
        // Verificar si es un nuevo récord
        this.checkNewRecord();
        
        console.log('[GameOverScreen] Datos actualizados:', this.gameData);
    }
    
    /**
     * Actualizar visualización de puntuación principal
     * @private
     */
    updateScoreDisplay() {
        if (this.elements.finalScore) {
            const distanceText = formatDistance(this.gameData.distance);
            this.elements.finalScore.textContent = `${SPANISH_TEXT.DISTANCE}: ${distanceText}`;
        }
    }
    
    /**
     * Actualizar visualización de estadísticas detalladas
     * @private
     */
    updateStatsDisplay() {
        if (!this.elements.statsContainer) return;
        
        // Actualizar cada estadística
        const statsElements = {
            distance: this.elements.statsContainer.querySelector('#stats-distance'),
            time: this.elements.statsContainer.querySelector('#stats-time'),
            jumps: this.elements.statsContainer.querySelector('#stats-jumps'),
            dashes: this.elements.statsContainer.querySelector('#stats-dashes'),
            best: this.elements.statsContainer.querySelector('#stats-best')
        };
        
        if (statsElements.distance) {
            statsElements.distance.textContent = formatDistance(this.gameData.distance);
        }
        
        if (statsElements.time) {
            statsElements.time.textContent = formatTime(this.gameData.time);
        }
        
        if (statsElements.jumps) {
            statsElements.jumps.textContent = this.gameData.jumps.toString();
        }
        
        if (statsElements.dashes) {
            statsElements.dashes.textContent = this.gameData.dashes.toString();
        }
        
        if (statsElements.best) {
            statsElements.best.textContent = formatDistance(this.gameData.bestDistance);
        }
    }
    
    /**
     * Verificar si se estableció un nuevo récord
     * @private
     */
    checkNewRecord() {
        if (this.gameData.distance > this.gameData.bestDistance) {
            this.showNewRecordMessage();
            
            // Actualizar mejor distancia
            this.gameData.bestDistance = this.gameData.distance;
            
            // Guardar en localStorage
            this.saveBestDistance();
        }
    }
    
    /**
     * Mostrar mensaje de nuevo récord
     * @private
     */
    showNewRecordMessage() {
        // Crear elemento de nuevo récord
        const newRecordElement = document.createElement('div');
        newRecordElement.className = 'game-over-new-record';
        newRecordElement.innerHTML = `
            <span class="game-over-new-record__icon">🏆</span>
            <span class="game-over-new-record__text">${SPANISH_TEXT.NEW_RECORD}</span>
        `;
        
        // Insertar en la pantalla
        const content = this.element.querySelector('.spikepulse-screen-content');
        if (content && this.elements.finalScore) {
            content.insertBefore(newRecordElement, this.elements.finalScore.nextSibling);
        }
        
        // Anunciar a lectores de pantalla
        this.announceToScreenReader(SPANISH_TEXT.NEW_RECORD, 'assertive');
        
        // Agregar animación
        setTimeout(() => {
            newRecordElement.classList.add('game-over-new-record--visible');
        }, 100);
        
        console.log('[GameOverScreen] Nuevo récord mostrado');
    }
    
    /**
     * Guardar mejor distancia en localStorage
     * @private
     */
    saveBestDistance() {
        try {
            localStorage.setItem('spikepulse-best-distance', this.gameData.bestDistance.toString());
        } catch (error) {
            console.warn('[GameOverScreen] No se pudo guardar la mejor distancia:', error);
        }
    }
    
    /**
     * Cargar mejor distancia desde localStorage
     * @private
     */
    loadBestDistance() {
        try {
            const saved = localStorage.getItem('spikepulse-best-distance');
            if (saved) {
                this.gameData.bestDistance = parseFloat(saved) || 0;
            }
        } catch (error) {
            console.warn('[GameOverScreen] No se pudo cargar la mejor distancia:', error);
        }
    }
    
    /**
     * Método llamado cuando se muestra la pantalla
     * @param {Object} data - Datos de la pantalla
     * @protected
     */
    onShow(data) {
        console.log('[GameOverScreen] Pantalla de game over mostrada');
        
        // Cargar mejor distancia guardada
        this.loadBestDistance();
        
        // Actualizar datos si se proporcionan
        if (data && Object.keys(data).length > 0) {
            this.updateData(data);
        }
        
        // Asegurar que los botones estén habilitados
        if (this.elements.restartButton) {
            this.elements.restartButton.disabled = false;
            this.elements.restartButton.classList.remove('spikepulse-screen-button--loading');
        }
        
        // Reproducir animación de entrada
        this.playEntranceAnimation();
        
        // Anunciar a lectores de pantalla
        this.announceToScreenReader(`${SPANISH_TEXT.GAME_OVER}. ${SPANISH_TEXT.DISTANCE}: ${formatDistance(this.gameData.distance)}`);
    }
    
    /**
     * Método llamado cuando se oculta la pantalla
     * @protected
     */
    onHide() {
        console.log('[GameOverScreen] Pantalla de game over ocultada');
        
        // Limpiar mensaje de nuevo récord si existe
        const newRecordElement = this.element.querySelector('.game-over-new-record');
        if (newRecordElement) {
            newRecordElement.remove();
        }
        
        // Detener animaciones
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
        
        // Animar estadísticas una por una
        const statItems = this.element.querySelectorAll('.game-over-stats__item');
        statItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('game-over-stats__item--visible');
            }, 200 + (index * 100));
        });
        
        // Remover clase después de la animación
        setTimeout(() => {
            if (this.element) {
                this.element.classList.remove('spikepulse-screen-overlay--entering');
            }
        }, 800);
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
        
        // Remover animaciones de estadísticas
        const statItems = this.element.querySelectorAll('.game-over-stats__item');
        statItems.forEach(item => {
            item.classList.remove('game-over-stats__item--visible');
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
     * Obtener estadísticas específicas de game over
     * @returns {Object} Estadísticas
     */
    getStats() {
        const baseStats = super.getStats();
        return {
            ...baseStats,
            gameData: this.gameData,
            hasRestartButton: !!this.elements.restartButton,
            hasMenuButton: !!this.elements.menuButton,
            hasStatsContainer: !!this.elements.statsContainer
        };
    }
    
    /**
     * Destruir la pantalla de game over
     * @protected
     */
    onDestroy() {
        // Limpiar referencias específicas de game over
        this.elements = {
            title: null,
            finalScore: null,
            restartButton: null,
            menuButton: null,
            statsContainer: null
        };
        
        this.gameData = {
            distance: 0,
            time: 0,
            jumps: 0,
            dashes: 0,
            bestDistance: 0
        };
        
        console.log('[GameOverScreen] Pantalla de game over destruida');
    }
}