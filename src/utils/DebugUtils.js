/**
 * Utilidades de debugging para Spikepulse
 * @module DebugUtils
 */

export class DebugUtils {
    constructor() {
        this.enabled = false;
        this.showFPS = false;
        this.showHitboxes = false;
        this.fpsHistory = [];
        this.maxFPSHistory = 60;
        this.lastFPSUpdate = 0;
    }
    
    /**
     * Habilita o deshabilita el modo debug
     * @param {boolean} enabled - Estado del debug
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log(`🐛 Debug mode: ${enabled ? 'ON' : 'OFF'}`);
    }
    
    /**
     * Muestra u oculta el contador de FPS
     * @param {boolean} show - Mostrar FPS
     */
    setShowFPS(show) {
        this.showFPS = show;
    }
    
    /**
     * Muestra u oculta las hitboxes
     * @param {boolean} show - Mostrar hitboxes
     */
    setShowHitboxes(show) {
        this.showHitboxes = show;
    }
    
    /**
     * Actualiza el contador de FPS
     * @param {number} deltaTime - Tiempo desde el último frame
     */
    updateFPS(deltaTime) {
        if (!this.enabled || !this.showFPS) return;
        
        const fps = 1000 / deltaTime;
        this.fpsHistory.push(fps);
        
        if (this.fpsHistory.length > this.maxFPSHistory) {
            this.fpsHistory.shift();
        }
    }
    
    /**
     * Obtiene el FPS promedio
     * @returns {number} FPS promedio
     */
    getAverageFPS() {
        if (this.fpsHistory.length === 0) return 0;
        
        const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.fpsHistory.length);
    }
    
    /**
     * Renderiza información de debug
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} gameState - Estado del juego
     */
    render(ctx, gameState) {
        if (!this.enabled) return;
        
        ctx.save();
        
        // Configurar estilo de texto
        ctx.fillStyle = '#00FF00';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        
        let y = 20;
        const lineHeight = 16;
        
        // Mostrar FPS
        if (this.showFPS) {
            ctx.fillText(`FPS: ${this.getAverageFPS()}`, 10, y);
            y += lineHeight;
        }
        
        // Mostrar información del jugador
        if (gameState && gameState.player) {
            const player = gameState.player;
            ctx.fillText(`Player X: ${Math.round(player.position.x)}`, 10, y);
            y += lineHeight;
            ctx.fillText(`Player Y: ${Math.round(player.position.y)}`, 10, y);
            y += lineHeight;
            ctx.fillText(`Velocity X: ${Math.round(player.velocity.x * 100) / 100}`, 10, y);
            y += lineHeight;
            ctx.fillText(`Velocity Y: ${Math.round(player.velocity.y * 100) / 100}`, 10, y);
            y += lineHeight;
            ctx.fillText(`On Ground: ${player.onGround}`, 10, y);
            y += lineHeight;
            ctx.fillText(`Jumps Left: ${player.jumpsLeft}`, 10, y);
            y += lineHeight;
            ctx.fillText(`Dash Available: ${player.dashAvailable}`, 10, y);
            y += lineHeight;
            ctx.fillText(`Gravity Inverted: ${player.gravityInverted}`, 10, y);
            y += lineHeight;
        }
        
        // Mostrar información del mundo
        if (gameState && gameState.world) {
            const world = gameState.world;
            ctx.fillText(`Camera X: ${Math.round(world.camera.x)}`, 10, y);
            y += lineHeight;
            ctx.fillText(`Camera Y: ${Math.round(world.camera.y)}`, 10, y);
            y += lineHeight;
            ctx.fillText(`Obstacles: ${world.obstacles.length}`, 10, y);
            y += lineHeight;
        }
        
        // Mostrar estadísticas
        if (gameState && gameState.stats) {
            const stats = gameState.stats;
            ctx.fillText(`Distance: ${Math.round(stats.distance)}m`, 10, y);
            y += lineHeight;
            ctx.fillText(`Jumps: ${stats.jumps}`, 10, y);
            y += lineHeight;
            ctx.fillText(`Dashes: ${stats.dashes}`, 10, y);
            y += lineHeight;
        }
        
        ctx.restore();
    }
    
    /**
     * Dibuja una hitbox de debug
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} bounds - Límites de la hitbox {x, y, width, height}
     * @param {string} color - Color de la hitbox
     */
    drawHitbox(ctx, bounds, color = '#FF0000') {
        if (!this.enabled || !this.showHitboxes) return;
        
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        ctx.restore();
    }
    
    /**
     * Dibuja un punto de debug
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} point - Punto {x, y}
     * @param {string} color - Color del punto
     * @param {number} size - Tamaño del punto
     */
    drawPoint(ctx, point, color = '#00FF00', size = 4) {
        if (!this.enabled) return;
        
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    /**
     * Dibuja una línea de debug
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} from - Punto inicial {x, y}
     * @param {Object} to - Punto final {x, y}
     * @param {string} color - Color de la línea
     */
    drawLine(ctx, from, to, color = '#FFFF00') {
        if (!this.enabled) return;
        
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.restore();
    }
    
    /**
     * Registra un mensaje de debug
     * @param {string} message - Mensaje a registrar
     * @param {string} level - Nivel del mensaje (info, warn, error)
     */
    log(message, level = 'info') {
        if (!this.enabled) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}] [DEBUG]`;
        
        switch (level) {
            case 'warn':
                console.warn(`${prefix} ${message}`);
                break;
            case 'error':
                console.error(`${prefix} ${message}`);
                break;
            default:
                console.log(`${prefix} ${message}`);
        }
    }
}

// Instancia global de debug utils
export const debugUtils = new DebugUtils();