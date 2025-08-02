/**
 * BaseObstacle - Clase base para todos los obstáculos
 * @module BaseObstacle
 */

export class BaseObstacle {
    /**
     * Crea una nueva instancia de BaseObstacle
     * @param {Object} config - Configuración del obstáculo
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        
        // Propiedades básicas
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.width = config.width || 30;
        this.height = config.height || 50;
        this.type = config.type || 'base';
        this.difficulty = config.difficulty || 1;
        
        // Propiedades visuales
        this.color = config.color || '#E53E3E';
        this.glowColor = config.glowColor || '#FF6B6B';
        this.alpha = 1.0;
        
        // Estado del obstáculo
        this.isActive = true;
        this.isVisible = true;
        this.animationTime = 0;
        
        // Hitbox para colisiones
        this.hitbox = {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    /**
     * Actualizar el obstáculo
     * @param {number} deltaTime - Tiempo transcurrido
     * @param {number} scrollOffset - Offset de scroll del mundo
     */
    update(deltaTime, scrollOffset) {
        this.animationTime += deltaTime;
        this.updateHitbox();
        this.updateVisibility(scrollOffset);
    }

    /**
     * Actualizar hitbox
     * @private
     */
    updateHitbox() {
        this.hitbox.x = this.x;
        this.hitbox.y = this.y;
        this.hitbox.width = this.width;
        this.hitbox.height = this.height;
    }

    /**
     * Actualizar visibilidad basada en scroll
     * @param {number} scrollOffset - Offset de scroll
     * @private
     */
    updateVisibility(scrollOffset) {
        const screenLeft = scrollOffset - 100;
        const screenRight = scrollOffset + 900; // Canvas width + buffer
        
        this.isVisible = this.x + this.width > screenLeft && this.x < screenRight;
    }
}   
 /**
     * Renderizar el obstáculo (método base)
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {number} scrollOffset - Offset de scroll
     */
    render(ctx, scrollOffset) {
        if (!this.isVisible || !this.isActive) return;
        
        const renderX = this.x - scrollOffset;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(renderX, this.y, this.width, this.height);
        ctx.restore();
    }

    /**
     * Verificar colisión con otro objeto
     * @param {Object} other - Objeto con hitbox {x, y, width, height}
     * @returns {boolean} True si hay colisión
     */
    checkCollision(other) {
        if (!this.isActive) return false;
        
        return (
            this.hitbox.x < other.x + other.width &&
            this.hitbox.x + this.hitbox.width > other.x &&
            this.hitbox.y < other.y + other.height &&
            this.hitbox.y + this.hitbox.height > other.y
        );
    }

    /**
     * Obtener información del obstáculo
     * @returns {Object} Información del obstáculo
     */
    getInfo() {
        return {
            type: this.type,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            difficulty: this.difficulty,
            isActive: this.isActive,
            isVisible: this.isVisible
        };
    }

    /**
     * Destruir el obstáculo
     */
    destroy() {
        this.isActive = false;
        this.isVisible = false;
    }
}