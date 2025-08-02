/**
 * HUD - Heads-Up Display para estadísticas del juego
 * Maneja la visualización en tiempo real de estadísticas durante el juego
 * @module HUD
 */

import { SPANISH_TEXT, formatDistance, formatTime, formatNumber } from '../../config/SpanishText.js';

export class HUD {
    /**
     * Crea una nueva instancia del HUD
     * @param {Object} config - Configuración del HUD
     * @param {EventBus} eventBus - Bus de eventos para comunicación
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.element = null;
        this.isVisible = false;
        this.isInitialized = false;
        
        // Referencias a elementos del HUD
        this.elements = {
            container: null,
            distance: null,
            jumps: null,
            dash: null,
            gravity: null,
            velocity: null,
            time: null
        };
        
        // Datos actuales del juego
        this.gameStats = {
            distance: 0,
            jumps: 2,
            dashAvailable: true,
            dashCooldown: 0,
            gravityDirection: 1, // 1 = normal, -1 = invertida
            velocity: 0,
            time: 0,
            maxVelocity: 0
        };
        
        // Configuración de actualización
        this.updateInterval = null;
        this.updateFrequency = 60; // FPS para actualizaciones
        this.lastUpdate = 0;
        
        console.log('[HUD] Inicializando HUD...');
        this.init();
    }
    
    /**
     * Inicializar el HUD
     * @private
     */
    init() {
        try {
            // Obtener elemento del DOM
            this.setupDOMReferences();
            
            // Configurar elementos del HUD
            this.setupElements();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Configurar accesibilidad
            this.setupAccessibility();
            
            // Configurar actualizaciones automáticas
            this.setupAutoUpdate();
            
            this.isInitialized = true;
            console.log('[HUD] HUD inicializado correctamente');
            
        } catch (error) {
            console.error('[HUD] Error durante la inicialización:', error);
            this.eventBus.emit('hud:error', { error, context: 'initialization' });
        }
    }
    
    /**
     * Configurar referencias DOM
     * @private
     */
    setupDOMReferences() {
        this.element = document.getElementById('gameHUD');
        if (!this.element) {
            throw new Error('Elemento HUD no encontrado');
        }
        
        // Obtener referencias a elementos específicos
        this.elements.container = this.element.querySelector('.spikepulse-hud__container');
        this.elements.distance = document.getElementById('distanceCounter');
        this.elements.jumps = document.getElementById('jumpsCounter');
        this.elements.dash = document.getElementById('dashStatus');
        this.elements.gravity = document.getElementById('gravityStatus');
        this.elements.velocity = document.getElementById('velocityStatus');
        
        // Crear elemento de tiempo si no existe
        this.createTimeElement();
        
        console.log('[HUD] Referencias DOM configuradas');
    }
    
    /**
     * Crear elemento de tiempo si no existe
     * @private
     */
    createTimeElement() {
        if (document.getElementById('timeCounter')) {
            this.elements.time = document.getElementById('timeCounter');
            return;
        }
        
        // Crear elemento de tiempo
        const timeContainer = document.createElement('div');
        timeContainer.className = 'spikepulse-hud__stat';
        timeContainer.innerHTML = `
            <div class="spikepulse-hud__label spikepulse-hud__label--time">${SPANISH_TEXT.TIME}</div>
            <div id="timeCounter" class="spikepulse-hud__value spikepulse-hud__value--time" aria-live="polite">0s</div>
        `;
        
        // Agregar separador
        const separator = document.createElement('div');
        separator.className = 'spikepulse-hud__separator';
        
        // Insertar en el contenedor
        if (this.elements.container) {
            this.elements.container.appendChild(separator);
            this.elements.container.appendChild(timeContainer);
        }
        
        this.elements.time = document.getElementById('timeCounter');
        console.log('[HUD] Elemento de tiempo creado');
    }
    
    /**
     * Configurar elementos del HUD
     * @private
     */
    setupElements() {
        // Verificar elementos críticos
        const criticalElements = ['distance', 'jumps', 'dash', 'gravity', 'velocity'];
        const missingElements = criticalElements.filter(key => !this.elements[key]);
        
        if (missingElements.length > 0) {
            console.warn('[HUD] Elementos faltantes:', missingElements);
        }
        
        // Configurar valores iniciales
        this.updateAllElements();
        
        // Configurar clases CSS iniciales
        this.setupInitialStyles();
        
        console.log('[HUD] Elementos configurados');
    }
    
    /**
     * Configurar estilos iniciales
     * @private
     */
    setupInitialStyles() {
        // Configurar estado inicial del dash
        if (this.elements.dash) {
            this.elements.dash.classList.add('spikepulse-hud__value--dash-available');
        }
        
        // Configurar estado inicial de la velocidad
        if (this.elements.velocity) {
            this.elements.velocity.classList.add('spikepulse-hud__value--velocity-low');
        }
        
        // Configurar estado inicial de la gravedad
        if (this.elements.gravity) {
            this.elements.gravity.classList.add('spikepulse-hud__value--gravity-normal');
        }
    }
    
    /**
     * Configurar event listeners
     * @private
     */
    setupEventListeners() {
        // Escuchar eventos de estadísticas del juego
        this.eventBus.on('game:stats-update', (data) => {
            this.updateStats(data);
        });
        
        // Escuchar eventos específicos de cada estadística
        this.eventBus.on('player:distance-changed', (data) => {
            this.updateDistance(data.distance);
        });
        
        this.eventBus.on('player:jumped', (data) => {
            this.updateJumps(data.jumpsRemaining);
        });
        
        this.eventBus.on('player:dash-used', () => {
            this.updateDashStatus(false);
        });
        
        this.eventBus.on('player:dash-available', () => {
            this.updateDashStatus(true);
        });
        
        this.eventBus.on('player:dash-cooldown', (data) => {
            this.updateDashCooldown(data.cooldown);
        });
        
        this.eventBus.on('player:gravity-changed', (data) => {
            this.updateGravity(data.direction);
        });
        
        this.eventBus.on('player:velocity-changed', (data) => {
            this.updateVelocity(data.velocity);
        });
        
        this.eventBus.on('game:time-update', (data) => {
            this.updateTime(data.time);
        });
        
        // Escuchar eventos de estado del juego
        this.eventBus.on('game:start', () => {
            this.resetStats();
            this.show();
        });
        
        this.eventBus.on('game:end', () => {
            this.hide();
        });
        
        this.eventBus.on('game:pause', () => {
            this.pauseUpdates();
        });
        
        this.eventBus.on('game:resume', () => {
            this.resumeUpdates();
        });
        
        console.log('[HUD] Event listeners configurados');
    }
    
    /**
     * Configurar accesibilidad
     * @private
     */
    setupAccessibility() {
        if (!this.element) return;
        
        // Configurar ARIA labels
        this.element.setAttribute('aria-label', SPANISH_TEXT.HUD_AREA_LABEL);
        this.element.setAttribute('role', 'complementary');
        
        // Configurar elementos con aria-live para anuncios automáticos
        if (this.elements.distance) {
            this.elements.distance.setAttribute('aria-live', 'polite');
            this.elements.distance.setAttribute('aria-atomic', 'true');
        }
        
        // Configurar descripciones para cada estadística
        this.setupStatDescriptions();
        
        console.log('[HUD] Accesibilidad configurada');
    }
    
    /**
     * Configurar descripciones para estadísticas
     * @private
     */
    setupStatDescriptions() {
        const descriptions = {
            distance: 'Distancia recorrida en el juego',
            jumps: 'Número de saltos disponibles',
            dash: 'Estado del dash - disponible o en cooldown',
            gravity: 'Dirección actual de la gravedad',
            velocity: 'Velocidad actual del jugador',
            time: 'Tiempo transcurrido en el juego'
        };
        
        Object.entries(descriptions).forEach(([key, description]) => {
            const element = this.elements[key];
            if (element) {
                element.setAttribute('aria-label', description);
            }
        });
    }
    
    /**
     * Configurar actualizaciones automáticas
     * @private
     */
    setupAutoUpdate() {
        // Configurar intervalo de actualización para elementos que cambian frecuentemente
        this.updateInterval = setInterval(() => {
            this.performPeriodicUpdates();
        }, 1000 / this.updateFrequency);
        
        console.log('[HUD] Actualizaciones automáticas configuradas');
    }
    
    /**
     * Realizar actualizaciones periódicas
     * @private
     */
    performPeriodicUpdates() {
        if (!this.isVisible) return;
        
        const now = performance.now();
        if (now - this.lastUpdate < (1000 / this.updateFrequency)) return;
        
        // Actualizar cooldown del dash si está activo
        if (!this.gameStats.dashAvailable && this.gameStats.dashCooldown > 0) {
            this.gameStats.dashCooldown -= (now - this.lastUpdate) / 1000;
            if (this.gameStats.dashCooldown <= 0) {
                this.gameStats.dashCooldown = 0;
                this.gameStats.dashAvailable = true;
                this.updateDashStatus(true);
            } else {
                this.updateDashCooldown(this.gameStats.dashCooldown);
            }
        }
        
        this.lastUpdate = now;
    }
    
    /**
     * Actualizar todas las estadísticas
     * @param {Object} stats - Nuevas estadísticas
     */
    updateStats(stats) {
        if (!this.isInitialized) return;
        
        // Actualizar datos internos
        this.gameStats = { ...this.gameStats, ...stats };
        
        // Actualizar elementos visuales
        if (stats.distance !== undefined) this.updateDistance(stats.distance);
        if (stats.jumps !== undefined) this.updateJumps(stats.jumps);
        if (stats.dashAvailable !== undefined) this.updateDashStatus(stats.dashAvailable);
        if (stats.gravityDirection !== undefined) this.updateGravity(stats.gravityDirection);
        if (stats.velocity !== undefined) this.updateVelocity(stats.velocity);
        if (stats.time !== undefined) this.updateTime(stats.time);
        
        // Emitir evento de actualización
        this.eventBus.emit('hud:updated', this.gameStats);
    }
    
    /**
     * Actualizar distancia
     * @param {number} distance - Nueva distancia
     */
    updateDistance(distance) {
        if (!this.elements.distance) return;
        
        this.gameStats.distance = distance;
        const formattedDistance = formatDistance(distance);
        this.elements.distance.textContent = formattedDistance;
        
        // Agregar efecto visual para hitos importantes
        if (distance > 0 && distance % 100 === 0) {
            this.addMilestoneEffect(this.elements.distance);
            this.announceDistance(distance);
        }
    }
    
    /**
     * Actualizar saltos disponibles
     * @param {number} jumps - Saltos disponibles
     */
    updateJumps(jumps) {
        if (!this.elements.jumps) return;
        
        this.gameStats.jumps = jumps;
        this.elements.jumps.textContent = jumps.toString();
        
        // Cambiar estilo según saltos disponibles
        this.elements.jumps.className = 'spikepulse-hud__value spikepulse-hud__value--jumps';
        if (jumps === 0) {
            this.elements.jumps.classList.add('spikepulse-hud__value--jumps-empty');
        } else if (jumps === 1) {
            this.elements.jumps.classList.add('spikepulse-hud__value--jumps-low');
        } else {
            this.elements.jumps.classList.add('spikepulse-hud__value--jumps-full');
        }
    }
    
    /**
     * Actualizar estado del dash
     * @param {boolean} available - Si el dash está disponible
     */
    updateDashStatus(available) {
        if (!this.elements.dash) return;
        
        this.gameStats.dashAvailable = available;
        
        // Limpiar clases existentes
        this.elements.dash.className = 'spikepulse-hud__value spikepulse-hud__value--dash';
        
        if (available) {
            this.elements.dash.textContent = SPANISH_TEXT.DASH_AVAILABLE;
            this.elements.dash.classList.add('spikepulse-hud__value--dash-available');
        } else {
            this.elements.dash.textContent = '⏳';
            this.elements.dash.classList.add('spikepulse-hud__value--dash-cooldown');
        }
    }
    
    /**
     * Actualizar cooldown del dash
     * @param {number} cooldown - Tiempo de cooldown restante
     */
    updateDashCooldown(cooldown) {
        if (!this.elements.dash || this.gameStats.dashAvailable) return;
        
        this.gameStats.dashCooldown = cooldown;
        const seconds = Math.ceil(cooldown);
        this.elements.dash.textContent = `${seconds}${SPANISH_TEXT.SECONDS}`;
    }
    
    /**
     * Actualizar dirección de la gravedad
     * @param {number} direction - Dirección de la gravedad (1 o -1)
     */
    updateGravity(direction) {
        if (!this.elements.gravity) return;
        
        this.gameStats.gravityDirection = direction;
        
        // Limpiar clases existentes
        this.elements.gravity.className = 'spikepulse-hud__value spikepulse-hud__value--gravity';
        
        if (direction === 1) {
            this.elements.gravity.textContent = SPANISH_TEXT.GRAVITY_NORMAL;
            this.elements.gravity.classList.add('spikepulse-hud__value--gravity-normal');
        } else {
            this.elements.gravity.textContent = SPANISH_TEXT.GRAVITY_INVERTED;
            this.elements.gravity.classList.add('spikepulse-hud__value--gravity-inverted');
        }
        
        // Agregar efecto visual al cambiar
        this.addChangeEffect(this.elements.gravity);
    }
    
    /**
     * Actualizar velocidad
     * @param {number} velocity - Velocidad actual
     */
    updateVelocity(velocity) {
        if (!this.elements.velocity) return;
        
        this.gameStats.velocity = velocity;
        this.gameStats.maxVelocity = Math.max(this.gameStats.maxVelocity, Math.abs(velocity));
        
        const formattedVelocity = formatNumber(Math.abs(velocity), 1);
        this.elements.velocity.textContent = formattedVelocity;
        
        // Limpiar clases existentes
        this.elements.velocity.className = 'spikepulse-hud__value spikepulse-hud__value--velocity';
        
        // Agregar clase según velocidad
        const absVelocity = Math.abs(velocity);
        if (absVelocity < 2) {
            this.elements.velocity.classList.add('spikepulse-hud__value--velocity-low');
        } else if (absVelocity < 5) {
            this.elements.velocity.classList.add('spikepulse-hud__value--velocity-medium');
        } else {
            this.elements.velocity.classList.add('spikepulse-hud__value--velocity-high');
        }
    }
    
    /**
     * Actualizar tiempo
     * @param {number} time - Tiempo transcurrido en segundos
     */
    updateTime(time) {
        if (!this.elements.time) return;
        
        this.gameStats.time = time;
        const formattedTime = formatTime(time);
        this.elements.time.textContent = formattedTime;
    }
    
    /**
     * Actualizar todos los elementos visuales
     * @private
     */
    updateAllElements() {
        this.updateDistance(this.gameStats.distance);
        this.updateJumps(this.gameStats.jumps);
        this.updateDashStatus(this.gameStats.dashAvailable);
        this.updateGravity(this.gameStats.gravityDirection);
        this.updateVelocity(this.gameStats.velocity);
        this.updateTime(this.gameStats.time);
    }
    
    /**
     * Agregar efecto visual de hito
     * @param {HTMLElement} element - Elemento al que agregar el efecto
     * @private
     */
    addMilestoneEffect(element) {
        element.classList.add('spikepulse-hud__value--milestone');
        setTimeout(() => {
            element.classList.remove('spikepulse-hud__value--milestone');
        }, 1000);
    }
    
    /**
     * Agregar efecto visual de cambio
     * @param {HTMLElement} element - Elemento al que agregar el efecto
     * @private
     */
    addChangeEffect(element) {
        element.classList.add('spikepulse-hud__value--changed');
        setTimeout(() => {
            element.classList.remove('spikepulse-hud__value--changed');
        }, 500);
    }
    
    /**
     * Anunciar distancia a lectores de pantalla
     * @param {number} distance - Distancia a anunciar
     * @private
     */
    announceDistance(distance) {
        const message = `${SPANISH_TEXT.DISTANCE}: ${formatDistance(distance)}`;
        this.announceToScreenReader(message, 'polite');
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
     * Resetear todas las estadísticas
     */
    resetStats() {
        this.gameStats = {
            distance: 0,
            jumps: 2,
            dashAvailable: true,
            dashCooldown: 0,
            gravityDirection: 1,
            velocity: 0,
            time: 0,
            maxVelocity: 0
        };
        
        this.updateAllElements();
        console.log('[HUD] Estadísticas reseteadas');
    }
    
    /**
     * Mostrar el HUD
     */
    show() {
        if (!this.element) return;
        
        this.element.classList.remove('spikepulse-hidden');
        this.isVisible = true;
        
        // Reanudar actualizaciones
        this.resumeUpdates();
        
        console.log('[HUD] HUD mostrado');
    }
    
    /**
     * Ocultar el HUD
     */
    hide() {
        if (!this.element) return;
        
        this.element.classList.add('spikepulse-hidden');
        this.isVisible = false;
        
        // Pausar actualizaciones
        this.pauseUpdates();
        
        console.log('[HUD] HUD ocultado');
    }
    
    /**
     * Pausar actualizaciones automáticas
     */
    pauseUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        console.log('[HUD] Actualizaciones pausadas');
    }
    
    /**
     * Reanudar actualizaciones automáticas
     */
    resumeUpdates() {
        if (!this.updateInterval) {
            this.updateInterval = setInterval(() => {
                this.performPeriodicUpdates();
            }, 1000 / this.updateFrequency);
        }
        console.log('[HUD] Actualizaciones reanudadas');
    }
    
    /**
     * Verificar si el HUD está visible
     * @returns {boolean} Si el HUD está visible
     */
    isVisible() {
        return this.isVisible;
    }
    
    /**
     * Obtener estadísticas actuales
     * @returns {Object} Estadísticas actuales
     */
    getStats() {
        return { ...this.gameStats };
    }
    
    /**
     * Obtener información del HUD
     * @returns {Object} Información del HUD
     */
    getInfo() {
        return {
            isInitialized: this.isInitialized,
            isVisible: this.isVisible,
            updateFrequency: this.updateFrequency,
            hasUpdateInterval: !!this.updateInterval,
            gameStats: this.gameStats,
            elementsCount: Object.keys(this.elements).filter(key => this.elements[key]).length
        };
    }
    
    /**
     * Destruir el HUD y limpiar recursos
     */
    destroy() {
        // Pausar actualizaciones
        this.pauseUpdates();
        
        // Limpiar event listeners
        this.eventBus.off('game:stats-update');
        this.eventBus.off('player:distance-changed');
        this.eventBus.off('player:jumped');
        this.eventBus.off('player:dash-used');
        this.eventBus.off('player:dash-available');
        this.eventBus.off('player:dash-cooldown');
        this.eventBus.off('player:gravity-changed');
        this.eventBus.off('player:velocity-changed');
        this.eventBus.off('game:time-update');
        this.eventBus.off('game:start');
        this.eventBus.off('game:end');
        this.eventBus.off('game:pause');
        this.eventBus.off('game:resume');
        
        // Limpiar referencias
        this.elements = {};
        this.element = null;
        this.gameStats = {};
        this.isInitialized = false;
        this.isVisible = false;
        
        console.log('[HUD] HUD destruido');
    }
}