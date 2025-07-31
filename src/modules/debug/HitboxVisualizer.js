/**
 * HitboxVisualizer - Sistema de visualización de hitboxes para debugging
 * @module HitboxVisualizer
 */

export class HitboxVisualizer {
    /**
     * Crea una nueva instancia del HitboxVisualizer
     * @param {EventBus} eventBus - Bus de eventos
     * @param {Object} config - Configuración del visualizador
     */
    constructor(eventBus, config = {}) {
        this.eventBus = eventBus;
        this.config = {
            playerColor: config.playerColor || '#00FF00',
            obstacleColor: config.obstacleColor || '#FF0000',
            worldColor: config.worldColor || '#0000FF',
            lineWidth: config.lineWidth || 2,
            fillAlpha: config.fillAlpha || 0.2,
            showLabels: config.showLabels !== false,
            labelFont: config.labelFont || '12px monospace',
            labelColor: config.labelColor || '#FFFFFF',
            ...config
        };

        this.hitboxes = new Map();
        this.isEnabled = false;
        this.isInitialized = false;

        this.init();
    }

    /**
     * Inicializar el visualizador de hitboxes
     * @private
     */
    init() {
        this.setupEventListeners();
        this.isInitialized = true;

        console.log('[HitboxVisualizer] Visualizador de hitboxes inicializado');
    }

    /**
     * Configurar listeners de eventos
     * @private
     */
    setupEventListeners() {
        // Escuchar solicitudes de renderizado de hitboxes
        this.eventBus.on('debug:request-hitboxes', (data) => {
            if (this.isEnabled) {
                this.renderAllHitboxes(data.context);
            }
        });

        // Escuchar registro de hitboxes
        this.eventBus.on('debug:register-hitbox', (data) => {
            this.registerHitbox(data.id, data.hitbox, data.type, data.label);
        });

        // Escuchar actualización de hitboxes
        this.eventBus.on('debug:update-hitbox', (data) => {
            this.updateHitbox(data.id, data.hitbox);
        });

        // Escuchar eliminación de hitboxes
        this.eventBus.on('debug:remove-hitbox', (data) => {
            this.removeHitbox(data.id);
        });

        // Escuchar toggle de visualización
        this.eventBus.on('debug:toggle-hitboxes', (data) => {
            this.isEnabled = data.enabled !== undefined ? data.enabled : !this.isEnabled;
        });

        // Escuchar limpieza de hitboxes
        this.eventBus.on('debug:clear-hitboxes', () => {
            this.clearAllHitboxes();
        });
    }

    /**
     * Registrar hitbox para visualización
     * @param {string} id - ID único del hitbox
     * @param {Object} hitbox - Datos del hitbox
     * @param {string} type - Tipo de hitbox (player, obstacle, world, etc.)
     * @param {string} label - Etiqueta opcional
     */
    registerHitbox(id, hitbox, type = 'unknown', label = '') {
        this.hitboxes.set(id, {
            id,
            hitbox: this.normalizeHitbox(hitbox),
            type,
            label: label || id,
            lastUpdate: Date.now(),
            isActive: true
        });
    }

    /**
     * Actualizar hitbox existente
     * @param {string} id - ID del hitbox
     * @param {Object} hitbox - Nuevos datos del hitbox
     */
    updateHitbox(id, hitbox) {
        const existing = this.hitboxes.get(id);
        if (existing) {
            existing.hitbox = this.normalizeHitbox(hitbox);
            existing.lastUpdate = Date.now();
            existing.isActive = true;
        }
    }

    /**
     * Remover hitbox
     * @param {string} id - ID del hitbox
     */
    removeHitbox(id) {
        this.hitboxes.delete(id);
    }

    /**
     * Limpiar todos los hitboxes
     */
    clearAllHitboxes() {
        this.hitboxes.clear();
    }

    /**
     * Normalizar datos de hitbox a formato estándar
     * @param {Object} hitbox - Datos del hitbox
     * @returns {Object} Hitbox normalizado
     * @private
     */
    normalizeHitbox(hitbox) {
        // Formato estándar: { x, y, width, height }
        if (hitbox.x !== undefined && hitbox.y !== undefined && 
            hitbox.width !== undefined && hitbox.height !== undefined) {
            return {
                x: hitbox.x,
                y: hitbox.y,
                width: hitbox.width,
                height: hitbox.height,
                type: 'rectangle'
            };
        }

        // Formato círculo: { x, y, radius }
        if (hitbox.x !== undefined && hitbox.y !== undefined && hitbox.radius !== undefined) {
            return {
                x: hitbox.x,
                y: hitbox.y,
                radius: hitbox.radius,
                type: 'circle'
            };
        }

        // Formato polígono: { points: [{x, y}, ...] }
        if (hitbox.points && Array.isArray(hitbox.points)) {
            return {
                points: hitbox.points,
                type: 'polygon'
            };
        }

        // Formato línea: { x1, y1, x2, y2 }
        if (hitbox.x1 !== undefined && hitbox.y1 !== undefined && 
            hitbox.x2 !== undefined && hitbox.y2 !== undefined) {
            return {
                x1: hitbox.x1,
                y1: hitbox.y1,
                x2: hitbox.x2,
                y2: hitbox.y2,
                type: 'line'
            };
        }

        console.warn('[HitboxVisualizer] Formato de hitbox no reconocido:', hitbox);
        return hitbox;
    }

    /**
     * Renderizar todos los hitboxes
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    renderAllHitboxes(ctx) {
        if (!this.isEnabled || !ctx) {
            return;
        }

        ctx.save();

        // Limpiar hitboxes inactivos (más de 1 segundo sin actualizar)
        const now = Date.now();
        const inactiveThreshold = 1000;

        for (const [id, hitboxData] of this.hitboxes) {
            if (now - hitboxData.lastUpdate > inactiveThreshold) {
                hitboxData.isActive = false;
            }
        }

        // Renderizar hitboxes activos
        for (const [id, hitboxData] of this.hitboxes) {
            if (hitboxData.isActive) {
                this.renderHitbox(ctx, hitboxData);
            }
        }

        ctx.restore();
    }

    /**
     * Renderizar un hitbox individual
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} hitboxData - Datos del hitbox
     * @private
     */
    renderHitbox(ctx, hitboxData) {
        const { hitbox, type, label } = hitboxData;
        const color = this.getColorForType(type);

        ctx.strokeStyle = color;
        ctx.lineWidth = this.config.lineWidth;
        ctx.fillStyle = this.hexToRgba(color, this.config.fillAlpha);

        switch (hitbox.type) {
            case 'rectangle':
                this.renderRectangle(ctx, hitbox);
                break;
            case 'circle':
                this.renderCircle(ctx, hitbox);
                break;
            case 'polygon':
                this.renderPolygon(ctx, hitbox);
                break;
            case 'line':
                this.renderLine(ctx, hitbox);
                break;
            default:
                // Intentar renderizar como rectángulo por defecto
                if (hitbox.x !== undefined && hitbox.y !== undefined && 
                    hitbox.width !== undefined && hitbox.height !== undefined) {
                    this.renderRectangle(ctx, hitbox);
                }
                break;
        }

        // Renderizar etiqueta si está habilitada
        if (this.config.showLabels && label) {
            this.renderLabel(ctx, hitbox, label, color);
        }
    }

    /**
     * Renderizar rectángulo
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} hitbox - Datos del hitbox
     * @private
     */
    renderRectangle(ctx, hitbox) {
        // Rellenar
        ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
        
        // Contorno
        ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);

        // Diagonales para mejor visualización
        ctx.beginPath();
        ctx.moveTo(hitbox.x, hitbox.y);
        ctx.lineTo(hitbox.x + hitbox.width, hitbox.y + hitbox.height);
        ctx.moveTo(hitbox.x + hitbox.width, hitbox.y);
        ctx.lineTo(hitbox.x, hitbox.y + hitbox.height);
        ctx.stroke();
    }

    /**
     * Renderizar círculo
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} hitbox - Datos del hitbox
     * @private
     */
    renderCircle(ctx, hitbox) {
        ctx.beginPath();
        ctx.arc(hitbox.x, hitbox.y, hitbox.radius, 0, Math.PI * 2);
        
        // Rellenar
        ctx.fill();
        
        // Contorno
        ctx.stroke();

        // Cruz central
        ctx.beginPath();
        ctx.moveTo(hitbox.x - 5, hitbox.y);
        ctx.lineTo(hitbox.x + 5, hitbox.y);
        ctx.moveTo(hitbox.x, hitbox.y - 5);
        ctx.lineTo(hitbox.x, hitbox.y + 5);
        ctx.stroke();
    }

    /**
     * Renderizar polígono
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} hitbox - Datos del hitbox
     * @private
     */
    renderPolygon(ctx, hitbox) {
        if (!hitbox.points || hitbox.points.length < 3) {
            return;
        }

        ctx.beginPath();
        ctx.moveTo(hitbox.points[0].x, hitbox.points[0].y);
        
        for (let i = 1; i < hitbox.points.length; i++) {
            ctx.lineTo(hitbox.points[i].x, hitbox.points[i].y);
        }
        
        ctx.closePath();
        
        // Rellenar
        ctx.fill();
        
        // Contorno
        ctx.stroke();

        // Puntos de vértices
        ctx.fillStyle = ctx.strokeStyle;
        for (const point of hitbox.points) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Renderizar línea
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} hitbox - Datos del hitbox
     * @private
     */
    renderLine(ctx, hitbox) {
        ctx.beginPath();
        ctx.moveTo(hitbox.x1, hitbox.y1);
        ctx.lineTo(hitbox.x2, hitbox.y2);
        ctx.stroke();

        // Puntos de inicio y fin
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.arc(hitbox.x1, hitbox.y1, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(hitbox.x2, hitbox.y2, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Renderizar etiqueta
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} hitbox - Datos del hitbox
     * @param {string} label - Texto de la etiqueta
     * @param {string} color - Color del hitbox
     * @private
     */
    renderLabel(ctx, hitbox, label, color) {
        // Calcular posición de la etiqueta
        let labelX, labelY;

        switch (hitbox.type) {
            case 'rectangle':
                labelX = hitbox.x + hitbox.width / 2;
                labelY = hitbox.y - 5;
                break;
            case 'circle':
                labelX = hitbox.x;
                labelY = hitbox.y - hitbox.radius - 5;
                break;
            case 'polygon':
                // Usar el primer punto como referencia
                labelX = hitbox.points[0].x;
                labelY = hitbox.points[0].y - 5;
                break;
            case 'line':
                labelX = (hitbox.x1 + hitbox.x2) / 2;
                labelY = Math.min(hitbox.y1, hitbox.y2) - 5;
                break;
            default:
                labelX = hitbox.x || 0;
                labelY = (hitbox.y || 0) - 5;
                break;
        }

        // Configurar texto
        ctx.font = this.config.labelFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        // Fondo de la etiqueta
        const textMetrics = ctx.measureText(label);
        const textWidth = textMetrics.width;
        const textHeight = 14; // Aproximado para la fuente de 12px

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(
            labelX - textWidth / 2 - 2,
            labelY - textHeight,
            textWidth + 4,
            textHeight
        );

        // Texto de la etiqueta
        ctx.fillStyle = this.config.labelColor;
        ctx.fillText(label, labelX, labelY);
    }

    /**
     * Obtener color para tipo de hitbox
     * @param {string} type - Tipo de hitbox
     * @returns {string} Color hexadecimal
     * @private
     */
    getColorForType(type) {
        switch (type.toLowerCase()) {
            case 'player':
                return this.config.playerColor;
            case 'obstacle':
            case 'enemy':
                return this.config.obstacleColor;
            case 'world':
            case 'ground':
            case 'platform':
                return this.config.worldColor;
            case 'pickup':
            case 'collectible':
                return '#FFFF00';
            case 'trigger':
            case 'sensor':
                return '#FF00FF';
            default:
                return '#FFFFFF';
        }
    }

    /**
     * Convertir color hex a rgba
     * @param {string} hex - Color hexadecimal
     * @param {number} alpha - Valor alpha (0-1)
     * @returns {string} Color rgba
     * @private
     */
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Habilitar visualización de hitboxes
     */
    enable() {
        this.isEnabled = true;
        console.log('[HitboxVisualizer] Visualización de hitboxes habilitada');
    }

    /**
     * Deshabilitar visualización de hitboxes
     */
    disable() {
        this.isEnabled = false;
        console.log('[HitboxVisualizer] Visualización de hitboxes deshabilitada');
    }

    /**
     * Alternar visualización de hitboxes
     */
    toggle() {
        this.isEnabled = !this.isEnabled;
        console.log(`[HitboxVisualizer] Visualización de hitboxes ${this.isEnabled ? 'habilitada' : 'deshabilitada'}`);
    }

    /**
     * Obtener estadísticas del visualizador
     * @returns {Object} Estadísticas
     */
    getStats() {
        const activeHitboxes = Array.from(this.hitboxes.values()).filter(h => h.isActive).length;
        const inactiveHitboxes = this.hitboxes.size - activeHitboxes;

        const typeCount = {};
        for (const hitboxData of this.hitboxes.values()) {
            typeCount[hitboxData.type] = (typeCount[hitboxData.type] || 0) + 1;
        }

        return {
            isEnabled: this.isEnabled,
            isInitialized: this.isInitialized,
            totalHitboxes: this.hitboxes.size,
            activeHitboxes,
            inactiveHitboxes,
            typeCount
        };
    }

    /**
     * Destruir el visualizador
     */
    destroy() {
        this.clearAllHitboxes();
        this.isEnabled = false;
        this.isInitialized = false;
        
        console.log('[HitboxVisualizer] Visualizador de hitboxes destruido');
    }
}