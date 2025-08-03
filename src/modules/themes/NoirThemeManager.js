/**
 * NoirThemeManager - Gestor de temas noir para Spikepulse
 * Maneja la paleta monocromática y prepara la transición futura a colores
 * @module NoirThemeManager
 */

import { NoirPalette } from './NoirPalette.js';

/**
 * Gestor principal del sistema de temas noir adaptado para el sistema actual
 */
export class NoirThemeManager {
    /**
     * Crea una nueva instancia del NoirThemeManager
     * @param {Object} config - Configuración del tema
     * @param {EventBus} eventBus - Bus de eventos para comunicación
     */
    constructor(config = {}, eventBus = null) {
        this.config = config;
        this.eventBus = eventBus;
        this.isInitialized = false;

        // Estado del tema actual
        this.currentTheme = 'noir';
        this.isTransitioning = false;

        // Instancias de componentes
        this.noirPalette = new NoirPalette();
        this.colorTransitionSystem = null; // Para futuro uso

        // Cache de variables CSS aplicadas
        this.appliedVariables = new Map();

        // Elementos DOM observados
        this.observedElements = new Set();

        this.init();
    }

    /**
     * Inicializar el gestor de temas
     * @private
     */
    init() {
        try {
            console.log('[NoirThemeManager] Inicializando sistema de temas noir...');

            // Configurar listeners de eventos si hay EventBus
            if (this.eventBus) {
                this.setupEventListeners();
            }

            // Aplicar tema noir inicial
            this.applyNoirTheme();

            // Preparar sistema de transición para colores futuros
            this.prepareColorTransition();

            this.isInitialized = true;

            // Emitir evento de inicialización si hay EventBus
            if (this.eventBus) {
                this.eventBus.emit('theme:noir-initialized', {
                    theme: this.currentTheme,
                    palette: this.noirPalette.getPalette()
                });
            }

            console.log('[NoirThemeManager] Sistema de temas noir inicializado correctamente');

        } catch (error) {
            console.error('[NoirThemeManager] Error durante la inicialización:', error);
            this.handleError(error, 'init');
        }
    }

    /**
     * Configurar listeners de eventos
     * @private
     */
    setupEventListeners() {
        if (!this.eventBus) return;

        // Escuchar cambios de configuración
        this.eventBus.on('config:theme-changed', this.handleThemeConfigChange.bind(this));

        // Escuchar solicitudes de cambio de tema
        this.eventBus.on('theme:change-requested', this.handleThemeChangeRequest.bind(this));

        // Escuchar eventos de preparación para colores
        this.eventBus.on('theme:prepare-color-transition', this.prepareColorTransition.bind(this));

        // Escuchar cambios de estado del juego para ajustar tema
        this.eventBus.on('state:change', this.handleGameStateChange.bind(this));

        console.log('[NoirThemeManager] Event listeners configurados');
    }

    /**
     * Aplicar el tema noir completo
     * @public
     */
    applyNoirTheme() {
        try {
            console.log('[NoirThemeManager] Aplicando tema noir...');

            // Obtener paleta noir
            const palette = this.noirPalette.getPalette();

            // Aplicar variables CSS noir
            this.updateThemeVariables(palette);

            // Mantener compatibilidad con variables existentes
            this.maintainBackwardCompatibility(palette);

            // Aplicar efectos noir a elementos específicos
            this.applyNoirEffectsToDOM();

            // Actualizar estado
            this.currentTheme = 'noir';

            // Emitir evento de tema aplicado si hay EventBus
            if (this.eventBus) {
                this.eventBus.emit('theme:noir-applied', {
                    theme: this.currentTheme,
                    palette: palette
                });
            }

            console.log('[NoirThemeManager] Tema noir aplicado correctamente');

        } catch (error) {
            console.error('[NoirThemeManager] Error aplicando tema noir:', error);
            this.handleError(error, 'applyNoirTheme');
        }
    }

    /**
     * Mantener compatibilidad con variables CSS existentes del sistema actual
     * @param {Object} palette - Paleta noir
     * @private
     */
    maintainBackwardCompatibility(palette) {
        const root = document.documentElement;

        // Mapear variables existentes del sistema actual a la paleta noir avanzada
        const compatibilityMappings = {
            // Variables existentes del sistema actual
            '--noir-white': palette.base.white,
            '--noir-light': palette.base.lightGray,
            '--noir-medium': palette.base.mediumGray,
            '--noir-dark': palette.base.darkGray,
            '--noir-black': palette.base.black,
            '--font-main': "'Courier New', monospace"
        };

        // Aplicar mapeos de compatibilidad
        Object.entries(compatibilityMappings).forEach(([cssVar, value]) => {
            root.style.setProperty(cssVar, value);
            this.appliedVariables.set(cssVar, value);
        });

        console.log('[NoirThemeManager] Variables de compatibilidad aplicadas');
    }

    /**
     * Actualizar variables CSS del tema
     * @param {Object} palette - Paleta de colores a aplicar
     * @private
     */
    updateThemeVariables(palette) {
        const root = document.documentElement;

        // Aplicar colores base noir
        Object.entries(palette.base).forEach(([key, value]) => {
            const cssVar = `--sp-noir-${key}`;
            root.style.setProperty(cssVar, value);
            this.appliedVariables.set(cssVar, value);
        });

        // Aplicar transparencias noir
        Object.entries(palette.transparencies).forEach(([key, value]) => {
            const cssVar = `--sp-noir-${key}`;
            root.style.setProperty(cssVar, value);
            this.appliedVariables.set(cssVar, value);
        });

        // Aplicar highlights dramáticos
        Object.entries(palette.highlights).forEach(([key, value]) => {
            const cssVar = `--sp-noir-${key}`;
            root.style.setProperty(cssVar, value);
            this.appliedVariables.set(cssVar, value);
        });

        // Aplicar gradientes noir
        Object.entries(palette.gradients).forEach(([key, value]) => {
            const cssVar = `--sp-noir-gradient-${key}`;
            root.style.setProperty(cssVar, value);
            this.appliedVariables.set(cssVar, value);
        });

        // Aplicar efectos especiales
        Object.entries(palette.effects).forEach(([key, value]) => {
            const cssVar = `--sp-noir-effect-${key}`;
            root.style.setProperty(cssVar, value);
            this.appliedVariables.set(cssVar, value);
        });

        // Aplicar colores contextuales
        Object.entries(palette.contextual).forEach(([key, value]) => {
            const cssVar = `--sp-noir-${key}`;
            root.style.setProperty(cssVar, value);
            this.appliedVariables.set(cssVar, value);
        });

        console.log(`[NoirThemeManager] ${this.appliedVariables.size} variables CSS aplicadas`);
    }

    /**
     * Aplicar efectos noir específicos a elementos DOM
     * @private
     */
    applyNoirEffectsToDOM() {
        // Aplicar clase noir al body
        document.body.classList.add('spikepulse-noir-theme');

        // Aplicar efectos a elementos específicos del sistema actual
        const canvas = document.querySelector('canvas');
        if (canvas) {
            canvas.classList.add('spikepulse-noir-canvas');
        }

        // Aplicar efectos a botones
        const buttons = document.querySelectorAll('.btn, .control-btn');
        buttons.forEach(button => {
            button.classList.add('spikepulse-noir-button');
        });

        // Aplicar efectos a pantallas
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.add('spikepulse-noir-screen');
        });

        // Aplicar efectos al HUD
        const hud = document.querySelector('.hud');
        if (hud) {
            hud.classList.add('spikepulse-noir-hud');
        }

        console.log('[NoirThemeManager] Efectos noir aplicados al DOM');
    }

    /**
     * Preparar sistema para transición futura a colores
     * @public
     */
    prepareColorTransition() {
        console.log('[NoirThemeManager] Preparando sistema para transición a colores...');

        // Crear slots de color preparados para evolución futura
        const root = document.documentElement;
        const palette = this.noirPalette.getPalette();

        // Definir slots de color que se convertirán en colores reales
        const colorSlots = {
            '--sp-future-primary': palette.colorSlots.slot1,    // Se convertirá en dorado
            '--sp-future-secondary': palette.colorSlots.slot2,  // Se convertirá en rojo
            '--sp-future-accent': palette.colorSlots.slot3,     // Se convertirá en púrpura
        };

        // Aplicar slots
        Object.entries(colorSlots).forEach(([cssVar, value]) => {
            root.style.setProperty(cssVar, value);
            this.appliedVariables.set(cssVar, value);
        });

        // Marcar como preparado para transición
        document.body.setAttribute('data-color-transition-ready', 'true');

        console.log('[NoirThemeManager] Sistema preparado para transición a colores');
    }

    /**
     * Obtener color del tema actual
     * @param {string} colorKey - Clave del color
     * @returns {string} Valor del color
     * @public
     */
    getColor(colorKey) {
        return this.noirPalette.getColor(colorKey);
    }

    /**
     * Obtener toda la paleta actual
     * @returns {Object} Paleta completa
     * @public
     */
    getThemeColors() {
        return this.noirPalette.getPalette();
    }

    /**
     * Obtener gradiente específico
     * @param {string} gradientKey - Clave del gradiente
     * @returns {string} Gradiente
     * @public
     */
    getGradient(gradientKey) {
        return this.noirPalette.getGradient(gradientKey);
    }

    /**
     * Obtener efecto específico
     * @param {string} effectKey - Clave del efecto
     * @returns {string} Efecto
     * @public
     */
    getEffect(effectKey) {
        return this.noirPalette.getEffect(effectKey);
    }

    /**
     * Manejar cambio de configuración de tema
     * @param {Object} data - Datos del evento
     * @private
     */
    handleThemeConfigChange(data) {
        console.log('[NoirThemeManager] Cambio de configuración de tema:', data);

        if (data.theme === 'noir') {
            this.applyNoirTheme();
        }
    }

    /**
     * Manejar solicitud de cambio de tema
     * @param {Object} data - Datos del evento
     * @private
     */
    handleThemeChangeRequest(data) {
        const { theme, options = {} } = data;

        console.log(`[NoirThemeManager] Solicitud de cambio de tema: ${theme}`);

        if (theme === 'noir') {
            this.applyNoirTheme();
        } else {
            console.warn(`[NoirThemeManager] Tema no soportado: ${theme}`);
        }
    }

    /**
     * Manejar cambios de estado del juego
     * @param {Object} data - Datos del evento
     * @private
     */
    handleGameStateChange(data) {
        const { to } = data;

        // Ajustar intensidad del tema según el estado
        switch (to) {
            case 'playing':
                this.enhanceNoirForGameplay();
                break;
            case 'menu':
                this.applyNoirTheme();
                break;
            case 'gameOver':
                this.applyDramaticNoirEffect();
                break;
        }
    }

    /**
     * Mejorar efectos noir durante el gameplay
     * @private
     */
    enhanceNoirForGameplay() {
        const root = document.documentElement;
        const palette = this.noirPalette.getPalette();

        // Aumentar contraste durante el juego
        root.style.setProperty('--sp-noir-contrast-multiplier', '1.2');
        root.style.setProperty('--sp-noir-shadow-intensity', palette.effects.dramaticShadow);

        document.body.classList.add('spikepulse-noir-enhanced');
    }

    /**
     * Aplicar efecto noir dramático para game over
     * @private
     */
    applyDramaticNoirEffect() {
        const root = document.documentElement;
        const palette = this.noirPalette.getPalette();

        // Efecto dramático con sombras intensas
        root.style.setProperty('--sp-noir-dramatic-overlay', palette.transparencies.shadowHeavy);

        document.body.classList.add('spikepulse-noir-dramatic');

        // Remover efecto después de un tiempo
        setTimeout(() => {
            document.body.classList.remove('spikepulse-noir-dramatic');
        }, 3000);
    }

    /**
     * Manejar errores del sistema de temas
     * @param {Error} error - Error ocurrido
     * @param {string} context - Contexto del error
     * @private
     */
    handleError(error, context) {
        console.error(`[NoirThemeManager] Error en ${context}:`, error);

        // Emitir evento de error si hay EventBus
        if (this.eventBus) {
            this.eventBus.emit('theme:error', {
                error: error,
                context: context,
                theme: this.currentTheme
            });
        }

        // Intentar recuperación básica
        this.attemptBasicRecovery();
    }

    /**
     * Intentar recuperación básica del sistema de temas
     * @private
     */
    attemptBasicRecovery() {
        try {
            console.log('[NoirThemeManager] Intentando recuperación básica...');

            // Aplicar paleta monocromática básica compatible con el sistema actual
            const root = document.documentElement;
            root.style.setProperty('--noir-black', '#000000');
            root.style.setProperty('--noir-white', '#ffffff');
            root.style.setProperty('--noir-medium', '#808080');
            root.style.setProperty('--noir-dark', '#404040');
            root.style.setProperty('--noir-light', '#E0E0E0');

            // Aplicar clase de recuperación
            document.body.classList.add('spikepulse-noir-recovery');

            console.log('[NoirThemeManager] Recuperación básica aplicada');

        } catch (recoveryError) {
            console.error('[NoirThemeManager] Error en recuperación básica:', recoveryError);
        }
    }

    /**
     * Obtener estadísticas del gestor de temas
     * @returns {Object} Estadísticas
     * @public
     */
    getStats() {
        return {
            isInitialized: this.isInitialized,
            currentTheme: this.currentTheme,
            isTransitioning: this.isTransitioning,
            appliedVariablesCount: this.appliedVariables.size,
            observedElementsCount: this.observedElements.size,
            paletteStats: this.noirPalette.getStats()
        };
    }

    /**
     * Limpiar recursos y destruir el gestor
     * @public
     */
    destroy() {
        console.log('[NoirThemeManager] Destruyendo gestor de temas...');

        // Remover event listeners si hay EventBus
        if (this.eventBus) {
            this.eventBus.off('config:theme-changed', this.handleThemeConfigChange);
            this.eventBus.off('theme:change-requested', this.handleThemeChangeRequest);
            this.eventBus.off('theme:prepare-color-transition', this.prepareColorTransition);
            this.eventBus.off('state:change', this.handleGameStateChange);
        }

        // Limpiar variables CSS aplicadas
        const root = document.documentElement;
        this.appliedVariables.forEach((value, cssVar) => {
            root.style.removeProperty(cssVar);
        });
        this.appliedVariables.clear();

        // Remover clases CSS
        document.body.classList.remove(
            'spikepulse-noir-theme',
            'spikepulse-noir-enhanced',
            'spikepulse-noir-dramatic',
            'spikepulse-noir-recovery'
        );

        // Limpiar elementos observados
        this.observedElements.clear();

        // Destruir componentes
        if (this.noirPalette) {
            this.noirPalette.destroy();
            this.noirPalette = null;
        }

        this.isInitialized = false;

        console.log('[NoirThemeManager] Gestor de temas destruido');
    }
}