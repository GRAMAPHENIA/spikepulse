/**
 * SpikepulseEffects - Efectos visuales específicos para Spikepulse
 * @module SpikepulseEffects
 */

import { SPIKEPULSE_CONFIG } from '../../config/GameConfig.js';

export class SpikepulseEffects {
    /**
     * Crea una nueva instancia de SpikepulseEffects
     * @param {EffectsManager} effectsManager - Gestor de efectos principal
     * @param {Object} config - Configuración de efectos
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(effectsManager, config, eventBus) {
        this.effectsManager = effectsManager;
        this.config = config;
        this.eventBus = eventBus;
        
        // Configuración de efectos específicos de Spikepulse
        this.spikepulseConfig = SPIKEPULSE_CONFIG;
        this.colors = this.spikepulseConfig.theme.colors;
        this.gameElements = this.spikepulseConfig.gameElements;
        
        // Presets de efectos comunes
        this.effectPresets = this.initializeEffectPresets();
        
        // Configurar listeners de eventos específicos del juego
        this.setupGameEventListeners();
        
        console.log('[SpikepulseEffects] Inicializado con presets temáticos');
    }

    /**
     * Inicializar presets de efectos específicos de Spikepulse
     * @returns {Object} Presets de efectos
     * @private
     */
    initializeEffectPresets() {
        return {
            // Efectos del jugador
            playerJump: {
                particles: {
                    count: 8,
                    type: 'energy',
                    color: this.gameElements.player.baseColor,
                    size: { min: 2, max: 4 },
                    velocity: { min: 50, max: 100 },
                    life: { min: 0.3, max: 0.6 },
                    gravity: 0.2
                },
                glow: {
                    radius: 25,
                    intensity: 1.5,
                    color: this.gameElements.player.glowColor,
                    life: 0.4,
                    pulseSpeed: 0
                }
            },

            playerDash: {
                particles: {
                    count: 15,
                    type: 'spark',
                    color: this.gameElements.player.dashColor,
                    size: { min: 1, max: 3 },
                    velocity: { min: 80, max: 150 },
                    life: { min: 0.2, max: 0.5 },
                    gravity: 0
                },
                trail: {
                    color: this.gameElements.player.dashColor,
                    width: 4,
                    maxSegments: 12,
                    life: 0.8
                },
                glow: {
                    radius: 30,
                    intensity: 2.0,
                    color: this.gameElements.player.dashColor,
                    life: 0.3,
                    pulseSpeed: 0
                }
            },

            gravityFlip: {
                particles: {
                    count: 20,
                    type: 'energy',
                    color: this.gameElements.player.gravityColor,
                    size: { min: 2, max: 5 },
                    velocity: { min: 60, max: 120 },
                    life: { min: 0.4, max: 0.8 },
                    gravity: 0.1
                },
                screen: {
                    type: 'flash',
                    color: this.gameElements.player.gravityColor + '40',
                    life: 0.2,
                    alpha: 0.3
                },
                glow: {
                    radius: 40,
                    intensity: 1.8,
                    color: this.gameElements.player.gravityColor,
                    life: 0.6,
                    pulseSpeed: 2
                }
            },

            // Efectos de obstáculos
            spikeGlow: {
                glow: {
                    radius: 15,
                    intensity: 1.2,
                    color: this.gameElements.spikes.glowColor,
                    life: 2.0,
                    pulseSpeed: 1.5
                }
            },

            spikeHit: {
                particles: {
                    count: 25,
                    type: 'debris',
                    color: this.gameElements.spikes.baseColor,
                    size: { min: 2, max: 6 },
                    velocity: { min: 100, max: 200 },
                    life: { min: 0.5, max: 1.0 },
                    gravity: 0.8
                },
                screen: {
                    type: 'flash',
                    color: this.colors.danger + '80',
                    life: 0.15,
                    alpha: 0.6
                },
                glow: {
                    radius: 50,
                    intensity: 2.5,
                    color: this.colors.danger,
                    life: 0.4,
                    pulseSpeed: 0
                }
            },

            // Efectos ambientales
            atmosphericFog: {
                particles: {
                    count: 3,
                    type: 'smoke',
                    color: this.gameElements.environment.fogColor,
                    size: { min: 20, max: 40 },
                    velocity: { min: 10, max: 30 },
                    life: { min: 3.0, max: 6.0 },
                    gravity: -0.05
                }
            },

            industrialSparks: {
                particles: {
                    count: 5,
                    type: 'spark',
                    color: this.colors.warning,
                    size: { min: 1, max: 2 },
                    velocity: { min: 40, max: 80 },
                    life: { min: 0.8, max: 1.5 },
                    gravity: 0.3
                }
            },

            // Efectos de UI
            menuPulse: {
                glow: {
                    radius: 20,
                    intensity: 1.0,
                    color: this.colors.primary,
                    life: 2.0,
                    pulseSpeed: 0.8
                }
            },

            buttonHover: {
                glow: {
                    radius: 15,
                    intensity: 0.8,
                    color: this.colors.accent,
                    life: 0.3,
                    pulseSpeed: 0
                }
            },

            scorePopup: {
                particles: {
                    count: 12,
                    type: 'energy',
                    color: this.colors.success,
                    size: { min: 1, max: 3 },
                    velocity: { min: 30, max: 60 },
                    life: { min: 0.6, max: 1.0 },
                    gravity: -0.2
                }
            }
        };
    }

    /**
     * Configurar listeners de eventos específicos del juego
     * @private
     */
    setupGameEventListeners() {
        // Eventos del jugador
        this.eventBus.on('player:jump', this.handlePlayerJump, this);
        this.eventBus.on('player:dash', this.handlePlayerDash, this);
        this.eventBus.on('player:gravity-flip', this.handleGravityFlip, this);
        this.eventBus.on('player:hit-obstacle', this.handlePlayerHit, this);
        
        // Eventos de obstáculos
        this.eventBus.on('obstacle:spawn', this.handleObstacleSpawn, this);
        this.eventBus.on('obstacle:destroy', this.handleObstacleDestroy, this);
        
        // Eventos de UI
        this.eventBus.on('ui:button-hover', this.handleButtonHover, this);
        this.eventBus.on('ui:score-update', this.handleScoreUpdate, this);
        this.eventBus.on('ui:menu-pulse', this.handleMenuPulse, this);
        
        // Eventos ambientales
        this.eventBus.on('world:atmospheric-effect', this.handleAtmosphericEffect, this);
        this.eventBus.on('world:industrial-sparks', this.handleIndustrialSparks, this);
    }

    // ===== MANEJADORES DE EVENTOS =====

    /**
     * Manejar salto del jugador
     * @param {Object} data - Datos del evento
     */
    handlePlayerJump(data) {
        const preset = this.effectPresets.playerJump;
        this.createPlayerEffect(data.position, preset, 'jump');
    }

    /**
     * Manejar dash del jugador
     * @param {Object} data - Datos del evento
     */
    handlePlayerDash(data) {
        const preset = this.effectPresets.playerDash;
        this.createPlayerEffect(data.position, preset, 'dash', data.direction);
    }

    /**
     * Manejar cambio de gravedad
     * @param {Object} data - Datos del evento
     */
    handleGravityFlip(data) {
        const preset = this.effectPresets.gravityFlip;
        this.createPlayerEffect(data.position, preset, 'gravity');
        
        // Efecto de pantalla adicional
        this.effectsManager.createScreenEffect({
            type: 'flash',
            color: this.gameElements.player.gravityColor + '20',
            life: 0.3,
            alpha: 0.4
        });
    }

    /**
     * Manejar colisión del jugador con obstáculo
     * @param {Object} data - Datos del evento
     */
    handlePlayerHit(data) {
        const preset = this.effectPresets.spikeHit;
        this.createCollisionEffect(data.position, preset);
        
        // Efecto de shake de pantalla
        this.createScreenShake(0.3, 5);
    }

    /**
     * Manejar spawn de obstáculo
     * @param {Object} data - Datos del evento
     */
    handleObstacleSpawn(data) {
        if (data.type === 'spike') {
            const preset = this.effectPresets.spikeGlow;
            this.createObstacleEffect(data.position, preset);
        }
    }

    /**
     * Manejar destrucción de obstáculo
     * @param {Object} data - Datos del evento
     */
    handleObstacleDestroy(data) {
        // Crear pequeño efecto de desaparición
        this.createParticleExplosion(data.position, {
            count: 8,
            type: 'debris',
            color: this.colors.gray600,
            size: { min: 1, max: 3 },
            velocity: { min: 30, max: 60 },
            life: { min: 0.3, max: 0.6 }
        });
    }

    /**
     * Manejar hover de botón
     * @param {Object} data - Datos del evento
     */
    handleButtonHover(data) {
        const preset = this.effectPresets.buttonHover;
        this.createUIEffect(data.position, preset);
    }

    /**
     * Manejar actualización de puntuación
     * @param {Object} data - Datos del evento
     */
    handleScoreUpdate(data) {
        if (data.isNewRecord) {
            const preset = this.effectPresets.scorePopup;
            this.createUIEffect(data.position, preset);
        }
    }

    /**
     * Manejar pulso del menú
     * @param {Object} data - Datos del evento
     */
    handleMenuPulse(data) {
        const preset = this.effectPresets.menuPulse;
        this.createUIEffect(data.position, preset);
    }

    /**
     * Manejar efectos atmosféricos
     * @param {Object} data - Datos del evento
     */
    handleAtmosphericEffect(data) {
        const preset = this.effectPresets.atmosphericFog;
        this.createAmbientEffect(data.position, preset);
    }

    /**
     * Manejar chispas industriales
     * @param {Object} data - Datos del evento
     */
    handleIndustrialSparks(data) {
        const preset = this.effectPresets.industrialSparks;
        this.createAmbientEffect(data.position, preset);
    }

    // ===== MÉTODOS DE CREACIÓN DE EFECTOS =====

    /**
     * Crear efecto del jugador
     * @param {Object} position - Posición del efecto
     * @param {Object} preset - Preset del efecto
     * @param {string} type - Tipo de efecto
     * @param {Object} direction - Dirección (opcional)
     */
    createPlayerEffect(position, preset, type, direction = null) {
        // Crear partículas
        if (preset.particles) {
            this.createParticleExplosion(position, preset.particles, direction);
        }
        
        // Crear glow
        if (preset.glow) {
            this.effectsManager.createGlowEffect({
                x: position.x,
                y: position.y,
                ...preset.glow
            });
        }
        
        // Crear trail para dash
        if (preset.trail && type === 'dash') {
            this.createDashTrail(position, preset.trail, direction);
        }
        
        // Crear efecto de pantalla
        if (preset.screen) {
            this.effectsManager.createScreenEffect(preset.screen);
        }
    }

    /**
     * Crear efecto de colisión
     * @param {Object} position - Posición del efecto
     * @param {Object} preset - Preset del efecto
     */
    createCollisionEffect(position, preset) {
        // Crear explosión de partículas
        if (preset.particles) {
            this.createParticleExplosion(position, preset.particles);
        }
        
        // Crear glow intenso
        if (preset.glow) {
            this.effectsManager.createGlowEffect({
                x: position.x,
                y: position.y,
                ...preset.glow
            });
        }
        
        // Crear flash de pantalla
        if (preset.screen) {
            this.effectsManager.createScreenEffect(preset.screen);
        }
    }

    /**
     * Crear efecto de obstáculo
     * @param {Object} position - Posición del efecto
     * @param {Object} preset - Preset del efecto
     */
    createObstacleEffect(position, preset) {
        if (preset.glow) {
            this.effectsManager.createGlowEffect({
                x: position.x,
                y: position.y,
                ...preset.glow
            });
        }
    }

    /**
     * Crear efecto de UI
     * @param {Object} position - Posición del efecto
     * @param {Object} preset - Preset del efecto
     */
    createUIEffect(position, preset) {
        if (preset.glow) {
            this.effectsManager.createGlowEffect({
                x: position.x,
                y: position.y,
                ...preset.glow
            });
        }
        
        if (preset.particles) {
            this.createParticleExplosion(position, preset.particles);
        }
    }

    /**
     * Crear efecto ambiental
     * @param {Object} position - Posición del efecto
     * @param {Object} preset - Preset del efecto
     */
    createAmbientEffect(position, preset) {
        if (preset.particles) {
            this.createParticleExplosion(position, preset.particles);
        }
    }

    /**
     * Crear explosión de partículas
     * @param {Object} position - Posición central
     * @param {Object} config - Configuración de partículas
     * @param {Object} direction - Dirección preferencial (opcional)
     */
    createParticleExplosion(position, config, direction = null) {
        const count = config.count || 10;
        
        for (let i = 0; i < count; i++) {
            // Calcular ángulo de dispersión
            let angle;
            if (direction) {
                // Dispersión direccional
                const baseAngle = Math.atan2(direction.y, direction.x);
                angle = baseAngle + (Math.random() - 0.5) * Math.PI * 0.8;
            } else {
                // Dispersión circular
                angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            }
            
            // Calcular velocidad
            const speed = this.randomBetween(
                config.velocity?.min || 50,
                config.velocity?.max || 100
            );
            
            // Crear partícula
            this.effectsManager.createParticleEffect({
                x: position.x + Math.random() * 10 - 5,
                y: position.y + Math.random() * 10 - 5,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: this.randomBetween(
                    config.size?.min || 2,
                    config.size?.max || 4
                ),
                color: config.color || '#FFFFFF',
                life: this.randomBetween(
                    config.life?.min || 0.5,
                    config.life?.max || 1.0
                ),
                gravity: config.gravity || 0.5,
                friction: config.friction || 0.98,
                type: config.type || 'default'
            });
        }
    }

    /**
     * Crear trail de dash
     * @param {Object} position - Posición inicial
     * @param {Object} config - Configuración del trail
     * @param {Object} direction - Dirección del dash
     */
    createDashTrail(position, config, direction) {
        const trail = this.effectsManager.createTrailEffect({
            color: config.color,
            width: config.width,
            maxSegments: config.maxSegments,
            life: config.life
        });
        
        // Agregar segmentos iniciales del trail
        const segmentCount = 8;
        for (let i = 0; i < segmentCount; i++) {
            const t = i / segmentCount;
            const x = position.x - direction.x * t * 20;
            const y = position.y - direction.y * t * 20;
            
            trail.segments.push({
                x: x,
                y: y,
                alpha: 1 - t,
                age: t * 0.2,
                maxAge: config.life
            });
        }
    }

    /**
     * Crear efecto de shake de pantalla
     * @param {number} duration - Duración en segundos
     * @param {number} intensity - Intensidad del shake
     */
    createScreenShake(duration, intensity) {
        this.effectsManager.createScreenEffect({
            type: 'shake',
            life: duration,
            intensity: intensity,
            active: true
        });
        
        // Emitir evento para que otros módulos puedan reaccionar
        this.eventBus.emit('effects:screen-shake', {
            duration: duration,
            intensity: intensity
        });
    }

    /**
     * Crear efecto de viñeta
     * @param {number} intensity - Intensidad de la viñeta
     * @param {number} duration - Duración del efecto
     * @param {string} color - Color de la viñeta
     */
    createVignetteEffect(intensity, duration, color = '#000000') {
        this.effectsManager.createScreenEffect({
            type: 'vignette',
            color: color,
            radius: intensity,
            life: duration,
            alpha: 0.6
        });
    }

    /**
     * Crear efecto de pulso Spikepulse
     * @param {Object} position - Posición del efecto
     * @param {string} color - Color del pulso
     * @param {number} intensity - Intensidad del pulso
     */
    createSpikepulsePulse(position, color = null, intensity = 1.0) {
        const pulseColor = color || this.colors.primary;
        
        // Crear múltiples ondas de pulso
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.effectsManager.createGlowEffect({
                    x: position.x,
                    y: position.y,
                    radius: 20 + i * 15,
                    intensity: intensity * (1 - i * 0.3),
                    color: pulseColor,
                    life: 0.8,
                    pulseSpeed: 2 + i
                });
            }, i * 100);
        }
    }

    // ===== MÉTODOS DE UTILIDAD =====

    /**
     * Generar número aleatorio entre min y max
     * @param {number} min - Valor mínimo
     * @param {number} max - Valor máximo
     * @returns {number} Número aleatorio
     * @private
     */
    randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    /**
     * Obtener color con alpha
     * @param {string} color - Color base
     * @param {number} alpha - Valor alpha (0-1)
     * @returns {string} Color con alpha
     * @private
     */
    getColorWithAlpha(color, alpha) {
        // Convertir hex a rgba si es necesario
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return color;
    }

    /**
     * Crear efecto personalizado de Spikepulse
     * @param {string} effectName - Nombre del efecto
     * @param {Object} position - Posición del efecto
     * @param {Object} customConfig - Configuración personalizada
     */
    createCustomSpikepulseEffect(effectName, position, customConfig = {}) {
        const preset = this.effectPresets[effectName];
        
        if (!preset) {
            console.warn(`[SpikepulseEffects] Preset '${effectName}' no encontrado`);
            return;
        }
        
        // Combinar preset con configuración personalizada
        const config = this.mergeConfigs(preset, customConfig);
        
        // Crear efecto basado en el tipo
        if (effectName.includes('player')) {
            this.createPlayerEffect(position, config, effectName);
        } else if (effectName.includes('spike') || effectName.includes('obstacle')) {
            this.createObstacleEffect(position, config);
        } else if (effectName.includes('ui') || effectName.includes('menu')) {
            this.createUIEffect(position, config);
        } else {
            this.createAmbientEffect(position, config);
        }
    }

    /**
     * Combinar configuraciones
     * @param {Object} preset - Configuración base
     * @param {Object} custom - Configuración personalizada
     * @returns {Object} Configuración combinada
     * @private
     */
    mergeConfigs(preset, custom) {
        const merged = JSON.parse(JSON.stringify(preset)); // Deep copy
        
        Object.keys(custom).forEach(key => {
            if (typeof custom[key] === 'object' && !Array.isArray(custom[key])) {
                merged[key] = { ...merged[key], ...custom[key] };
            } else {
                merged[key] = custom[key];
            }
        });
        
        return merged;
    }

    /**
     * Limpiar todos los efectos de Spikepulse
     */
    clearAllEffects() {
        this.effectsManager.clear();
    }

    /**
     * Obtener estadísticas de efectos
     * @returns {Object} Estadísticas
     */
    getEffectsStats() {
        return {
            activeEffects: this.effectsManager.getActiveEffectsCount(),
            metrics: this.effectsManager.getMetrics(),
            presets: Object.keys(this.effectPresets).length
        };
    }

    /**
     * Destruir el módulo de efectos de Spikepulse
     */
    destroy() {
        // Remover listeners de eventos
        this.eventBus.off('player:jump', this.handlePlayerJump, this);
        this.eventBus.off('player:dash', this.handlePlayerDash, this);
        this.eventBus.off('player:gravity-flip', this.handleGravityFlip, this);
        this.eventBus.off('player:hit-obstacle', this.handlePlayerHit, this);
        this.eventBus.off('obstacle:spawn', this.handleObstacleSpawn, this);
        this.eventBus.off('obstacle:destroy', this.handleObstacleDestroy, this);
        this.eventBus.off('ui:button-hover', this.handleButtonHover, this);
        this.eventBus.off('ui:score-update', this.handleScoreUpdate, this);
        this.eventBus.off('ui:menu-pulse', this.handleMenuPulse, this);
        this.eventBus.off('world:atmospheric-effect', this.handleAtmosphericEffect, this);
        this.eventBus.off('world:industrial-sparks', this.handleIndustrialSparks, this);
        
        console.log('[SpikepulseEffects] Destruido');
    }
}