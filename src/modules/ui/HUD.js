/**
 * HUD (Heads-Up Display) para Spikepulse
 * @module HUD
 */

import { SPANISH_TEXT } from '../../config/SpanishText.js';
import { SpanishFormatter } from '../../utils/SpanishFormatter.js';

export class HUD {
    /**
     * Crea una nueva instancia del HUD
     * @param {Object} config - Configuración del HUD
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isInitialized = false;
        
        // Configuración del HUD
        this.hudConfig = {
            position: config.position || 'top',
            showDistance: config.showDistance !== false,
            showScore: config.showScore !== false,
            showLives: config.showLives !== false,
            showTime: config.showTime !== false,
            showFPS: config.showFPS || false,
            showVelocity: config.showVelocity || false,
            enableAnimations: config.enableAnimations !== false,
            updateInterval: config.updateInterval || 16 // ~60fps
        };
        
        // Referencias a elementos DOM
        this.elements = new Map();
        this.container = null;
        
        // Datos del juego
        this.gameData = {
            distance: 0,
            score: 0,
            lives: 3,
            coins: 0,
            time: 0,
            fps: 60,
            velocity: { x: 0, y: 0 },
            level: 1,
            jumps: 0,
            dashAvailable: true
        };
        
        // Estado del HUD
        this.isVisible = true;
        this.lastUpdateTime = 0;
        this.animationFrameId = null;
        
        // Estadísticas
        this.stats = {
            updatesCount: 0,
            elementsCreated: 0,
            animationsTriggered: 0
        };
        
        console.log('📊 HUD creado');
    }
    
    /**
     * Inicializa el HUD
     */
    async init() {
        try {
            console.log('🔧 Inicializando HUD...');
            
            // Crear estructura DOM
            this.createDOMStructure();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Iniciar loop de actualización
            this.startUpdateLoop();
            
            this.isInitialized = true;
            console.log('✅ HUD inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando HUD:', error);
            throw error;
        }
    }
    
    /**
     * Crea la estructura DOM del HUD
     */
    createDOMStructure() {
        // Contenedor principal del HUD
        this.container = this.createElement('div', {
            id: 'game-hud',
            className: `game-hud hud-${this.hudConfig.position}`,
            'aria-label': SPANISH_TEXT.STATS_AREA_LABEL
        });
        
        // Sección de estadísticas principales
        const mainStats = this.createElement('div', {
            className: 'hud-section hud-main-stats'
        });
        
        if (this.hudConfig.showDistance) {
            const distanceElement = this.createStatElement('distance', SPANISH_TEXT.DISTANCE, '0m');
            mainStats.appendChild(distanceElement);
        }
        
        if (this.hudConfig.showScore) {
            const scoreElement = this.createStatElement('score', SPANISH_TEXT.SCORE, '0');
            mainStats.appendChild(scoreElement);
        }
        
        if (this.hudConfig.showLives) {
            const livesElement = this.createLivesElement();
            mainStats.appendChild(livesElement);
        }
        
        // Sección de estadísticas secundarias
        const secondaryStats = this.createElement('div', {
            className: 'hud-section hud-secondary-stats'
        });
        
        if (this.hudConfig.showTime) {
            const timeElement = this.createStatElement('time', 'Tiempo', '0:00');
            secondaryStats.appendChild(timeElement);
        }
        
        if (this.hudConfig.showVelocity) {
            const velocityElement = this.createStatElement('velocity', SPANISH_TEXT.VELOCITY, '0 m/s');
            secondaryStats.appendChild(velocityElement);
        }
        
        // Sección de información de debug
        const debugStats = this.createElement('div', {
            className: 'hud-section hud-debug-stats',
            style: this.hudConfig.showFPS ? '' : 'display: none;'
        });
        
        if (this.hudConfig.showFPS) {
            const fpsElement = this.createStatElement('fps', 'FPS', '60');
            debugStats.appendChild(fpsElement);
        }
        
        // Sección de habilidades
        const abilitiesSection = this.createElement('div', {
            className: 'hud-section hud-abilities'
        });
        
        const dashIndicator = this.createAbilityIndicator('dash', SPANISH_TEXT.DASH, true);
        abilitiesSection.appendChild(dashIndicator);
        
        // Ensamblar HUD
        this.container.appendChild(mainStats);
        this.container.appendChild(secondaryStats);
        this.container.appendChild(debugStats);
        this.container.appendChild(abilitiesSection);
        
        console.log('🏗️ Estructura DOM del HUD creada');
    }
    
    /**
     * Crea un elemento de estadística
     * @param {string} id - ID del elemento
     * @param {string} label - Etiqueta de la estadística
     * @param {string} initialValue - Valor inicial
     * @returns {HTMLElement} Elemento creado
     */
    createStatElement(id, label, initialValue) {
        const statElement = this.createElement('div', {
            className: `hud-stat hud-stat-${id}`,
            'aria-label': `${label}: ${initialValue}`
        });
        
        const labelElement = this.createElement('span', {
            className: 'hud-stat-label',
            textContent: label
        });
        
        const valueElement = this.createElement('span', {
            className: 'hud-stat-value',
            id: `hud-${id}`,
            textContent: initialValue,
            'aria-live': 'polite'
        });
        
        statElement.appendChild(labelElement);
        statElement.appendChild(valueElement);
        
        // Guardar referencia
        this.elements.set(id, valueElement);
        
        return statElement;
    }
    
    /**
     * Crea el elemento de vidas
     * @returns {HTMLElement} Elemento de vidas
     */
    createLivesElement() {
        const livesElement = this.createElement('div', {
            className: 'hud-stat hud-stat-lives',
            'aria-label': `Vidas: ${this.gameData.lives}`
        });
        
        const labelElement = this.createElement('span', {
            className: 'hud-stat-label',
            textContent: 'Vidas'
        });
        
        const heartsContainer = this.createElement('div', {
            className: 'hud-hearts-container',
            id: 'hud-lives'
        });
        
        // Crear corazones
        this.updateLivesDisplay(heartsContainer, this.gameData.lives);
        
        livesElement.appendChild(labelElement);
        livesElement.appendChild(heartsContainer);
        
        // Guardar referencia
        this.elements.set('lives', heartsContainer);
        
        return livesElement;
    }
    
    /**
     * Crea un indicador de habilidad
     * @param {string} id - ID de la habilidad
     * @param {string} label - Etiqueta de la habilidad
     * @param {boolean} available - Si está disponible
     * @returns {HTMLElement} Elemento creado
     */
    createAbilityIndicator(id, label, available) {
        const abilityElement = this.createElement('div', {
            className: `hud-ability hud-ability-${id} ${available ? 'ability-available' : 'ability-unavailable'}`,
            'aria-label': `${label}: ${available ? 'Disponible' : 'No disponible'}`
        });
        
        const iconElement = this.createElement('div', {
            className: `hud-ability-icon icon-${id}`,
            'aria-hidden': 'true'
        });
        
        const labelElement = this.createElement('span', {
            className: 'hud-ability-label',
            textContent: label
        });
        
        abilityElement.appendChild(iconElement);
        abilityElement.appendChild(labelElement);
        
        // Guardar referencia
        this.elements.set(id, abilityElement);
        
        return abilityElement;
    }
    
    /**
     * Actualiza la visualización de vidas
     * @param {HTMLElement} container - Contenedor de corazones
     * @param {number} lives - Número de vidas
     */
    updateLivesDisplay(container, lives) {
        container.innerHTML = '';
        
        for (let i = 0; i < Math.max(lives, 3); i++) {
            const heart = this.createElement('span', {
                className: `hud-heart ${i < lives ? 'heart-full' : 'heart-empty'}`,
                'aria-hidden': 'true'
            });
            container.appendChild(heart);
        }
    }
    
    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Eventos de datos del juego
        this.eventBus.on('game:data-updated', this.updateData.bind(this));
        this.eventBus.on('player:position-changed', this.updatePlayerData.bind(this));
        this.eventBus.on('player:ability-changed', this.updateAbilities.bind(this));
        
        // Eventos de configuración
        this.eventBus.on('hud:toggle', this.toggle.bind(this));
        this.eventBus.on('hud:config-changed', this.updateConfig.bind(this));
        this.eventBus.on('hud:show-stat', this.showStat.bind(this));
        this.eventBus.on('hud:hide-stat', this.hideStat.bind(this));
        
        console.log('👂 Event listeners del HUD configurados');
    }
    
    /**
     * Inicia el loop de actualización
     */
    startUpdateLoop() {
        const update = (currentTime) => {
            if (currentTime - this.lastUpdateTime >= this.hudConfig.updateInterval) {
                this.updateDisplay();
                this.lastUpdateTime = currentTime;
            }
            
            if (this.isInitialized) {
                this.animationFrameId = requestAnimationFrame(update);
            }
        };
        
        this.animationFrameId = requestAnimationFrame(update);
    }
    
    /**
     * Actualiza la visualización del HUD
     */
    updateDisplay() {
        if (!this.isVisible) return;
        
        // Actualizar distancia
        if (this.elements.has('distance')) {
            const distanceElement = this.elements.get('distance');
            const formattedDistance = SpanishFormatter.formatDistance(this.gameData.distance);
            if (distanceElement.textContent !== formattedDistance) {
                distanceElement.textContent = formattedDistance;
                this.animateValueChange(distanceElement);
            }
        }
        
        // Actualizar puntuación
        if (this.elements.has('score')) {
            const scoreElement = this.elements.get('score');
            const formattedScore = SpanishFormatter.formatScore(this.gameData.score);
            if (scoreElement.textContent !== formattedScore) {
                scoreElement.textContent = formattedScore;
                this.animateValueChange(scoreElement);
            }
        }
        
        // Actualizar tiempo
        if (this.elements.has('time')) {
            const timeElement = this.elements.get('time');
            const formattedTime = SpanishFormatter.formatTime(this.gameData.time);
            if (timeElement.textContent !== formattedTime) {
                timeElement.textContent = formattedTime;
            }
        }
        
        // Actualizar FPS
        if (this.elements.has('fps')) {
            const fpsElement = this.elements.get('fps');
            const fpsText = Math.round(this.gameData.fps).toString();
            if (fpsElement.textContent !== fpsText) {
                fpsElement.textContent = fpsText;
            }
        }
        
        // Actualizar velocidad
        if (this.elements.has('velocity')) {
            const velocityElement = this.elements.get('velocity');
            const speed = Math.sqrt(
                this.gameData.velocity.x ** 2 + this.gameData.velocity.y ** 2
            );
            const formattedVelocity = SpanishFormatter.formatVelocity(speed);
            if (velocityElement.textContent !== formattedVelocity) {
                velocityElement.textContent = formattedVelocity;
            }
        }
        
        this.stats.updatesCount++;
    }
    
    /**
     * Anima un cambio de valor
     * @param {HTMLElement} element - Elemento a animar
     */
    animateValueChange(element) {
        if (!this.hudConfig.enableAnimations) return;
        
        element.classList.add('hud-value-changed');
        setTimeout(() => {
            element.classList.remove('hud-value-changed');
        }, 300);
        
        this.stats.animationsTriggered++;
    }
    
    // ===== MANEJO DE EVENTOS =====
    
    /**
     * Actualiza los datos del juego
     * @param {Object} data - Nuevos datos
     */
    updateData(data) {
        const oldData = { ...this.gameData };
        this.gameData = { ...this.gameData, ...data };
        
        // Actualizar vidas si cambió
        if (oldData.lives !== this.gameData.lives && this.elements.has('lives')) {
            const livesContainer = this.elements.get('lives');
            this.updateLivesDisplay(livesContainer, this.gameData.lives);
            
            // Animar cambio de vidas
            if (this.hudConfig.enableAnimations) {
                livesContainer.parentElement.classList.add('hud-lives-changed');
                setTimeout(() => {
                    livesContainer.parentElement.classList.remove('hud-lives-changed');
                }, 500);
            }
        }
    }
    
    /**
     * Actualiza datos del jugador
     * @param {Object} data - Datos del jugador
     */
    updatePlayerData(data) {
        if (data.velocity) {
            this.gameData.velocity = data.velocity;
        }
        
        if (data.distance !== undefined) {
            this.gameData.distance = data.distance;
        }
    }
    
    /**
     * Actualiza habilidades
     * @param {Object} data - Datos de habilidades
     */
    updateAbilities(data) {
        if (data.dash !== undefined && this.elements.has('dash')) {
            const dashElement = this.elements.get('dash');
            const available = data.dash;
            
            dashElement.classList.toggle('ability-available', available);
            dashElement.classList.toggle('ability-unavailable', !available);
            
            // Actualizar aria-label
            const label = dashElement.querySelector('.hud-ability-label').textContent;
            dashElement.setAttribute('aria-label', 
                `${label}: ${available ? 'Disponible' : 'No disponible'}`);
        }
    }
    
    /**
     * Alterna la visibilidad del HUD
     * @param {Object} data - Datos del toggle
     */
    toggle(data) {
        const visible = data?.visible !== undefined ? data.visible : !this.isVisible;
        
        if (visible) {
            this.show();
        } else {
            this.hide();
        }
    }
    
    /**
     * Actualiza la configuración del HUD
     * @param {Object} data - Nueva configuración
     */
    updateConfig(data) {
        this.hudConfig = { ...this.hudConfig, ...data };
        
        // Aplicar cambios de configuración
        if (data.showFPS !== undefined) {
            const debugStats = this.container.querySelector('.hud-debug-stats');
            if (debugStats) {
                debugStats.style.display = data.showFPS ? '' : 'none';
            }
        }
        
        console.log('⚙️ Configuración del HUD actualizada');
    }
    
    /**
     * Muestra una estadística específica
     * @param {Object} data - Datos de la estadística
     */
    showStat(data) {
        const statElement = this.container.querySelector(`.hud-stat-${data.stat}`);
        if (statElement) {
            statElement.style.display = '';
        }
    }
    
    /**
     * Oculta una estadística específica
     * @param {Object} data - Datos de la estadística
     */
    hideStat(data) {
        const statElement = this.container.querySelector(`.hud-stat-${data.stat}`);
        if (statElement) {
            statElement.style.display = 'none';
        }
    }
    
    // ===== MÉTODOS PÚBLICOS =====
    
    /**
     * Muestra el HUD
     */
    show() {
        if (this.container) {
            this.container.classList.remove('hud-hidden');
            this.isVisible = true;
            
            if (this.hudConfig.enableAnimations) {
                this.container.classList.add('hud-show');
                setTimeout(() => {
                    this.container.classList.remove('hud-show');
                }, 300);
            }
        }
    }
    
    /**
     * Oculta el HUD
     */
    hide() {
        if (this.container) {
            if (this.hudConfig.enableAnimations) {
                this.container.classList.add('hud-hide');
                setTimeout(() => {
                    this.container.classList.add('hud-hidden');
                    this.container.classList.remove('hud-hide');
                }, 300);
            } else {
                this.container.classList.add('hud-hidden');
            }
            
            this.isVisible = false;
        }
    }
    
    /**
     * Obtiene el contenedor del HUD
     * @returns {HTMLElement} Contenedor del HUD
     */
    getContainer() {
        return this.container;
    }
    
    /**
     * Crea un elemento HTML con atributos
     * @param {string} tag - Tag del elemento
     * @param {Object} attributes - Atributos del elemento
     * @returns {HTMLElement} Elemento creado
     */
    createElement(tag, attributes = {}) {
        const element = document.createElement(tag);
        
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'textContent' || key === 'innerHTML') {
                element[key] = value;
            } else if (key === 'className') {
                element.className = value;
            } else {
                element.setAttribute(key, value);
            }
        }
        
        this.stats.elementsCreated++;
        return element;
    }
    
    /**
     * Obtiene estadísticas del HUD
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            ...this.stats,
            isVisible: this.isVisible,
            elementsCount: this.elements.size,
            lastUpdateTime: this.lastUpdateTime
        };
    }
    
    /**
     * Obtiene información de debug
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            config: { ...this.hudConfig },
            isVisible: this.isVisible,
            gameData: { ...this.gameData },
            stats: this.getStats(),
            elements: Array.from(this.elements.keys())
        };
    }
    
    /**
     * Resetea el HUD
     */
    reset() {
        console.log('🔄 Reseteando HUD...');
        
        // Resetear datos del juego
        this.gameData = {
            distance: 0,
            score: 0,
            lives: 3,
            coins: 0,
            time: 0,
            fps: 60,
            velocity: { x: 0, y: 0 },
            level: 1,
            jumps: 0,
            dashAvailable: true
        };
        
        // Forzar actualización
        this.updateDisplay();
        
        console.log('✅ HUD reseteado');
    }
    
    /**
     * Limpia recursos del HUD
     */
    destroy() {
        console.log('🧹 Destruyendo HUD...');
        
        // Detener loop de actualización
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Remover event listeners
        this.eventBus.off('*', this);
        
        // Limpiar DOM
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        // Limpiar referencias
        this.elements.clear();
        this.container = null;
        
        this.isInitialized = false;
        
        console.log('✅ HUD destruido');
    }
}