/**
 * Configuración específica de física para Spikepulse
 * @module PhysicsConfig
 */

export const PHYSICS_CONFIG = {
    // Configuración de gravedad
    gravity: {
        normal: 0.5,
        inverted: -0.5,
        transitionSpeed: 0.1,
        maxFallSpeed: 15,
        maxRiseSpeed: -15
    },

    // Configuración de salto
    jump: {
        force: -10,
        doubleJumpForce: -8,
        coyoteTime: 100, // ms para saltar después de dejar el suelo
        jumpBuffering: 150, // ms para buffering de input de salto
        variableHeight: true,
        minJumpTime: 100,
        maxJumpTime: 300
    },

    // Configuración de dash
    dash: {
        force: 8,
        duration: 200,
        cooldown: 1000,
        invulnerabilityTime: 150,
        friction: 0.95,
        airResistance: 0.98,
        trailEffect: true
    },

    // Configuración de movimiento
    movement: {
        acceleration: 0.8,
        deceleration: 0.85,
        maxSpeed: 8,
        airControl: 0.6,
        groundFriction: 0.85,
        airFriction: 0.98,
        wallSlideSpeed: 2
    },

    // Configuración de colisiones
    collision: {
        playerHitbox: {
            width: 28,
            height: 28,
            offsetX: 1,
            offsetY: 1
        },
        obstacleMargin: 2,
        groundMargin: 1,
        ceilingMargin: 1,
        wallMargin: 1,
        precisionSteps: 4 // Para detección de colisiones de alta velocidad
    },

    // Configuración de superficie
    surface: {
        groundFriction: 0.85,
        wallFriction: 0.7,
        bounciness: 0.1,
        stickyness: 0.95,
        slideThreshold: 0.3
    },

    // Configuración de efectos físicos
    effects: {
        screenShake: {
            enabled: true,
            intensity: 3,
            duration: 200,
            frequency: 30
        },
        particles: {
            jumpParticles: 5,
            dashParticles: 10,
            hitParticles: 15,
            gravityParticles: 8
        },
        trails: {
            dashTrailLength: 10,
            jumpTrailLength: 5,
            fadeSpeed: 0.9,
            colorIntensity: 0.8
        }
    },

    // Configuración de optimización
    optimization: {
        maxVelocityChecks: 10,
        collisionGridSize: 50,
        spatialHashingEnabled: true,
        broadPhaseEnabled: true,
        sleepThreshold: 0.1,
        wakeThreshold: 0.5
    },

    // Configuración específica por dificultad
    difficulty: {
        easy: {
            gravity: 0.4,
            jumpForce: -12,
            dashCooldown: 800
        },
        normal: {
            gravity: 0.5,
            jumpForce: -10,
            dashCooldown: 1000
        },
        hard: {
            gravity: 0.6,
            jumpForce: -8,
            dashCooldown: 1200
        },
        extreme: {
            gravity: 0.7,
            jumpForce: -7,
            dashCooldown: 1500
        }
    },

    // Constantes físicas
    constants: {
        PIXELS_PER_METER: 50,
        TIME_STEP: 1 / 60,
        MAX_DELTA_TIME: 1 / 30,
        EPSILON: 0.001,
        PI: Math.PI,
        TWO_PI: Math.PI * 2,
        HALF_PI: Math.PI / 2
    }
};

/**
 * Obtener configuración de física por dificultad
 * @param {string} difficulty - Nivel de dificultad
 * @returns {Object} Configuración de física ajustada
 */
export function getPhysicsConfigForDifficulty(difficulty = 'normal') {
    const baseConfig = { ...PHYSICS_CONFIG };
    const difficultyConfig = PHYSICS_CONFIG.difficulty[difficulty];

    if (difficultyConfig) {
        baseConfig.gravity.normal = difficultyConfig.gravity;
        baseConfig.gravity.inverted = -difficultyConfig.gravity;
        baseConfig.jump.force = difficultyConfig.jumpForce;
        baseConfig.dash.cooldown = difficultyConfig.dashCooldown;
    }

    return baseConfig;
}

/**
 * Validar configuración de física
 * @param {Object} config - Configuración a validar
 * @returns {boolean} True si la configuración es válida
 */
export function validatePhysicsConfig(config) {
    const required = [
        'gravity.normal',
        'jump.force',
        'dash.force',
        'movement.maxSpeed',
        'collision.playerHitbox'
    ];

    return required.every(path => {
        const keys = path.split('.');
        let current = config;

        for (const key of keys) {
            if (current[key] === undefined) {
                console.warn(`Configuración de física faltante: ${path}`);
                return false;
            }
            current = current[key];
        }

        return true;
    });
}