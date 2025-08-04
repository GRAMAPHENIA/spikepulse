/**
 * Configuración específica de desarrollo para física
 */

export default {
    // Gravedad más suave para testing
    gravity: {
        normal: 0.3,
        inverted: -0.3,
        transitionSpeed: 0.05 // Transición más lenta para observar
    },
    
    // Salto más controlable en desarrollo
    jump: {
        force: -12,
        doubleJumpForce: -10,
        coyoteTime: 200, // Más tiempo de coyote para testing
        jumpBuffering: 300, // Más buffering para testing
        variableHeight: true,
        minJumpTime: 150,
        maxJumpTime: 400
    },
    
    // Dash más visible en desarrollo
    dash: {
        force: 6, // Menos fuerza para control
        duration: 300, // Más duración para observar
        cooldown: 500, // Menos cooldown para testing
        invulnerabilityTime: 200,
        friction: 0.9,
        airResistance: 0.95,
        trailEffect: true
    },
    
    // Movimiento más controlable
    movement: {
        acceleration: 0.6,
        deceleration: 0.8,
        maxSpeed: 6, // Velocidad más lenta para control
        airControl: 0.8, // Más control en el aire
        groundFriction: 0.8,
        airFriction: 0.95
    },
    
    // Colisiones más permisivas para testing
    collision: {
        playerHitbox: {
            width: 26, // Hitbox ligeramente más pequeña
            height: 26,
            offsetX: 2,
            offsetY: 2
        },
        obstacleMargin: 3, // Más margen para testing
        precisionSteps: 6 // Más pasos para mejor detección
    },
    
    // Efectos más visibles en desarrollo
    effects: {
        screenShake: {
            enabled: true,
            intensity: 5, // Más intenso para testing
            duration: 300,
            frequency: 20
        },
        particles: {
            jumpParticles: 8,
            dashParticles: 15,
            hitParticles: 20,
            gravityParticles: 12
        },
        trails: {
            dashTrailLength: 15, // Trail más largo para visualización
            jumpTrailLength: 8,
            fadeSpeed: 0.85,
            colorIntensity: 1.0
        }
    },
    
    // Optimización relajada para debugging
    optimization: {
        maxVelocityChecks: 15,
        collisionGridSize: 40,
        spatialHashingEnabled: false, // Deshabilitado para debugging
        broadPhaseEnabled: false, // Deshabilitado para debugging
        sleepThreshold: 0.05,
        wakeThreshold: 0.3
    }
};