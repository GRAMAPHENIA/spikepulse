/**
 * RenderLayer - Capa de renderizado para separación y organización de elementos visuales
 * @module RenderLayer
 */

export class RenderLayer {
    /**
     * Crea una nueva instancia de RenderLayer
     * @param {string} name - Nombre de la capa
     * @param {Object} config - Configuración de la capa
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(name, config, eventBus) {
        this.name = name;
        this.config = config;
        this.eventBus = eventBus;
        
        // Estado de la capa
        this.visible = config.visible !== false; // Visible por defecto
        this.alpha = config.alpha || 1.0;
        this.zIndex = config.zIndex || 0;
        
        // Configuración de parallax
        this.parallax = config.parallax || { x: 1, y: 1 };
        
        // Objetos de renderizado en esta capa
        this.objects = new Map();
        this.objectsArray = []; // Array para iteración rápida
        this.nextObjectId = 1;
        
        // Configuración de optimización
        this.enableSorting = config.enableSorting !== false;
        this.sortBy = config.sortBy || 'zIndex'; // 'zIndex', 'y', 'x', 'none'
        this.enableCulling = config.enableCulling !== false;
        this.cullingMargin = config.cullingMargin || 50;
        
        // Cache de renderizado
        this.enableCaching = config.enableCaching || false;
        this.cacheCanvas = null;
        this.cacheCtx = null;
        this.cacheDirty = true;
        this.cacheSize = { width: 0, height: 0 };
        
        // Métricas de la capa
        this.metrics = {
            objectsRendered: 0,
            objectsCulled: 0,
            lastRenderTime: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        
        // Inicializar cache si está habilitado
        if (this.enableCaching) {
            this.initializeCache();
        }
        
        console.log(`[RenderLayer] Capa '${this.name}' creada con configuración:`, config);
    }

    /**
     * Inicializar cache de la capa
     * @private
     */
    initializeCache() {
        this.cacheCanvas = document.createElement('canvas');
        this.cacheCtx = this.cacheCanvas.getContext('2d');
        
        // Configurar tamaño inicial del cache
        this.cacheSize.width = this.config.cacheWidth || 800;
        this.cacheSize.height = this.config.cacheHeight || 600;
        this.cacheCanvas.width = this.cacheSize.width;
        this.cacheCanvas.height = this.cacheSize.height;
        
        console.log(`[RenderLayer] Cache inicializado para capa '${this.name}'`);
    }

    /**
     * Actualizar la capa
     * @param {number} deltaTime - Tiempo transcurrido
     */
    update(deltaTime) {
        // Actualizar objetos que tengan método update
        this.objectsArray.forEach(obj => {
            if (typeof obj.update === 'function') {
                obj.update(deltaTime);
                
                // Marcar cache como dirty si el objeto cambió
                if (this.enableCaching && obj.isDirty) {
                    this.cacheDirty = true;
                    obj.isDirty = false;
                }
            }
        });
        
        // Ordenar objetos si es necesario
        if (this.enableSorting && this.objectsArray.length > 1) {
            this.sortObjects();
        }
    }

    /**
     * Renderizar la capa
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} renderState - Estado de renderizado
     */
    render(ctx, renderState) {
        if (!this.visible || this.alpha <= 0) {
            return;
        }

        const startTime = performance.now();
        this.metrics.objectsRendered = 0;
        this.metrics.objectsCulled = 0;
        
        // Aplicar alpha de la capa
        if (this.alpha < 1.0) {
            ctx.globalAlpha *= this.alpha;
        }
        
        // Usar cache si está habilitado y no está dirty
        if (this.enableCaching && !this.cacheDirty) {
            this.renderFromCache(ctx);
            this.metrics.cacheHits++;
        } else {
            this.renderObjects(ctx, renderState);
            
            // Actualizar cache si está habilitado
            if (this.enableCaching) {
                this.updateCache(ctx, renderState);
                this.metrics.cacheMisses++;
            }
        }
        
        this.metrics.lastRenderTime = performance.now() - startTime;
    }

    /**
     * Renderizar objetos de la capa
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} renderState - Estado de renderizado
     * @private
     */
    renderObjects(ctx, renderState) {
        this.objectsArray.forEach(obj => {
            // Verificar visibilidad del objeto
            if (!obj.visible || obj.alpha <= 0) {
                return;
            }
            
            // Culling: verificar si el objeto está en el viewport
            if (this.enableCulling && !this.isObjectInViewport(obj, renderState)) {
                this.metrics.objectsCulled++;
                return;
            }
            
            // Renderizar el objeto
            ctx.save();
            
            // Aplicar transformaciones del objeto
            this.applyObjectTransform(ctx, obj);
            
            // Renderizar según el tipo de objeto
            this.renderObject(ctx, obj, renderState);
            
            ctx.restore();
            
            this.metrics.objectsRendered++;
        });
    }

    /**
     * Aplicar transformaciones a un objeto
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} obj - Objeto a transformar
     * @private
     */
    applyObjectTransform(ctx, obj) {
        // Trasladar al centro del objeto
        const centerX = obj.x + (obj.width || 0) / 2;
        const centerY = obj.y + (obj.height || 0) / 2;
        ctx.translate(centerX, centerY);
        
        // Aplicar rotación
        if (obj.rotation) {
            ctx.rotate(obj.rotation);
        }
        
        // Aplicar escala
        if (obj.scale && obj.scale !== 1) {
            ctx.scale(obj.scale, obj.scale);
        } else if (obj.scaleX || obj.scaleY) {
            ctx.scale(obj.scaleX || 1, obj.scaleY || 1);
        }
        
        // Aplicar alpha
        if (obj.alpha && obj.alpha < 1) {
            ctx.globalAlpha *= obj.alpha;
        }
        
        // Volver al origen del objeto
        ctx.translate(-(obj.width || 0) / 2, -(obj.height || 0) / 2);
    }

    /**
     * Renderizar un objeto específico
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} obj - Objeto a renderizar
     * @param {Object} renderState - Estado de renderizado
     * @private
     */
    renderObject(ctx, obj, renderState) {
        // Si el objeto tiene su propio método render, usarlo
        if (typeof obj.render === 'function') {
            obj.render(ctx, renderState);
            return;
        }
        
        // Renderizado básico según el tipo
        switch (obj.type) {
            case 'rectangle':
                this.renderRectangle(ctx, obj);
                break;
            case 'circle':
                this.renderCircle(ctx, obj);
                break;
            case 'sprite':
                this.renderSprite(ctx, obj);
                break;
            case 'text':
                this.renderText(ctx, obj);
                break;
            case 'line':
                this.renderLine(ctx, obj);
                break;
            default:
                this.renderDefault(ctx, obj);
                break;
        }
    }

    /**
     * Renderizar rectángulo
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} obj - Objeto rectángulo
     * @private
     */
    renderRectangle(ctx, obj) {
        if (obj.fillStyle) {
            ctx.fillStyle = obj.fillStyle;
            ctx.fillRect(0, 0, obj.width, obj.height);
        }
        
        if (obj.strokeStyle) {
            ctx.strokeStyle = obj.strokeStyle;
            ctx.lineWidth = obj.lineWidth || 1;
            ctx.strokeRect(0, 0, obj.width, obj.height);
        }
    }

    /**
     * Renderizar círculo
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} obj - Objeto círculo
     * @private
     */
    renderCircle(ctx, obj) {
        const radius = obj.radius || Math.min(obj.width, obj.height) / 2;
        const centerX = obj.width / 2;
        const centerY = obj.height / 2;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        
        if (obj.fillStyle) {
            ctx.fillStyle = obj.fillStyle;
            ctx.fill();
        }
        
        if (obj.strokeStyle) {
            ctx.strokeStyle = obj.strokeStyle;
            ctx.lineWidth = obj.lineWidth || 1;
            ctx.stroke();
        }
    }

    /**
     * Renderizar sprite/imagen
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} obj - Objeto sprite
     * @private
     */
    renderSprite(ctx, obj) {
        if (!obj.image) {
            // Fallback a rectángulo si no hay imagen
            this.renderRectangle(ctx, obj);
            return;
        }
        
        // Renderizar imagen completa o recorte
        if (obj.sourceX !== undefined && obj.sourceY !== undefined) {
            ctx.drawImage(
                obj.image,
                obj.sourceX, obj.sourceY, obj.sourceWidth || obj.width, obj.sourceHeight || obj.height,
                0, 0, obj.width, obj.height
            );
        } else {
            ctx.drawImage(obj.image, 0, 0, obj.width, obj.height);
        }
    }

    /**
     * Renderizar texto
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} obj - Objeto texto
     * @private
     */
    renderText(ctx, obj) {
        ctx.font = obj.font || '16px Arial';
        ctx.textAlign = obj.textAlign || 'left';
        ctx.textBaseline = obj.textBaseline || 'top';
        
        if (obj.fillStyle) {
            ctx.fillStyle = obj.fillStyle;
            ctx.fillText(obj.text || '', 0, 0);
        }
        
        if (obj.strokeStyle) {
            ctx.strokeStyle = obj.strokeStyle;
            ctx.lineWidth = obj.lineWidth || 1;
            ctx.strokeText(obj.text || '', 0, 0);
        }
    }

    /**
     * Renderizar línea
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} obj - Objeto línea
     * @private
     */
    renderLine(ctx, obj) {
        ctx.strokeStyle = obj.strokeStyle || '#FFFFFF';
        ctx.lineWidth = obj.lineWidth || 1;
        ctx.lineCap = obj.lineCap || 'round';
        
        ctx.beginPath();
        ctx.moveTo(obj.x1 || 0, obj.y1 || 0);
        ctx.lineTo(obj.x2 || obj.width, obj.y2 || obj.height);
        ctx.stroke();
    }

    /**
     * Renderizado por defecto
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} obj - Objeto
     * @private
     */
    renderDefault(ctx, obj) {
        // Renderizar como rectángulo básico
        ctx.fillStyle = obj.color || obj.fillStyle || '#FFFFFF';
        ctx.fillRect(0, 0, obj.width || 10, obj.height || 10);
    }

    /**
     * Verificar si un objeto está en el viewport
     * @param {Object} obj - Objeto a verificar
     * @param {Object} renderState - Estado de renderizado
     * @returns {boolean} True si está visible
     * @private
     */
    isObjectInViewport(obj, renderState) {
        const margin = this.cullingMargin;
        const viewLeft = renderState.viewportX - margin;
        const viewRight = renderState.viewportX + renderState.canvasWidth + margin;
        const viewTop = renderState.viewportY - margin;
        const viewBottom = renderState.viewportY + renderState.canvasHeight + margin;
        
        return !(obj.x + (obj.width || 0) < viewLeft ||
                obj.x > viewRight ||
                obj.y + (obj.height || 0) < viewTop ||
                obj.y > viewBottom);
    }

    /**
     * Ordenar objetos según la configuración
     * @private
     */
    sortObjects() {
        switch (this.sortBy) {
            case 'zIndex':
                this.objectsArray.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
                break;
            case 'y':
                this.objectsArray.sort((a, b) => a.y - b.y);
                break;
            case 'x':
                this.objectsArray.sort((a, b) => a.x - b.x);
                break;
            case 'distance':
                // Ordenar por distancia al centro de la pantalla
                const centerX = (renderState?.viewportX || 0) + (renderState?.canvasWidth || 800) / 2;
                const centerY = (renderState?.viewportY || 0) + (renderState?.canvasHeight || 600) / 2;
                this.objectsArray.sort((a, b) => {
                    const distA = Math.sqrt((a.x - centerX) ** 2 + (a.y - centerY) ** 2);
                    const distB = Math.sqrt((b.x - centerX) ** 2 + (b.y - centerY) ** 2);
                    return distA - distB;
                });
                break;
        }
    }

    /**
     * Renderizar desde cache
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @private
     */
    renderFromCache(ctx) {
        if (this.cacheCanvas) {
            ctx.drawImage(this.cacheCanvas, 0, 0);
        }
    }

    /**
     * Actualizar cache de la capa
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} renderState - Estado de renderizado
     * @private
     */
    updateCache(ctx, renderState) {
        if (!this.cacheCtx) {
            return;
        }
        
        // Limpiar cache
        this.cacheCtx.clearRect(0, 0, this.cacheSize.width, this.cacheSize.height);
        
        // Renderizar objetos en el cache
        this.renderObjects(this.cacheCtx, renderState);
        
        this.cacheDirty = false;
    }

    /**
     * Agregar objeto a la capa
     * @param {Object} obj - Objeto a agregar
     * @returns {number} ID del objeto
     */
    addObject(obj) {
        const id = obj.id || this.nextObjectId++;
        obj.id = id;
        
        this.objects.set(id, obj);
        this.objectsArray.push(obj);
        
        // Marcar cache como dirty
        if (this.enableCaching) {
            this.cacheDirty = true;
        }
        
        return id;
    }

    /**
     * Remover objeto de la capa
     * @param {number} id - ID del objeto
     * @returns {Object|null} Objeto removido o null
     */
    removeObject(id) {
        const obj = this.objects.get(id);
        if (!obj) {
            return null;
        }
        
        this.objects.delete(id);
        const index = this.objectsArray.indexOf(obj);
        if (index > -1) {
            this.objectsArray.splice(index, 1);
        }
        
        // Marcar cache como dirty
        if (this.enableCaching) {
            this.cacheDirty = true;
        }
        
        return obj;
    }

    /**
     * Obtener objeto por ID
     * @param {number} id - ID del objeto
     * @returns {Object|null} Objeto o null
     */
    getObject(id) {
        return this.objects.get(id) || null;
    }

    /**
     * Limpiar todos los objetos de la capa
     */
    clear() {
        this.objects.clear();
        this.objectsArray = [];
        
        // Marcar cache como dirty
        if (this.enableCaching) {
            this.cacheDirty = true;
        }
        
        console.log(`[RenderLayer] Capa '${this.name}' limpiada`);
    }

    /**
     * Obtener objetos visibles en el viewport
     * @param {Object} renderState - Estado de renderizado
     * @returns {Array} Objetos visibles
     */
    getVisibleObjects(renderState) {
        if (!this.enableCulling) {
            return this.objectsArray.filter(obj => obj.visible);
        }
        
        return this.objectsArray.filter(obj => {
            return obj.visible && this.isObjectInViewport(obj, renderState);
        });
    }

    /**
     * Obtener número de objetos en la capa
     * @returns {number} Número de objetos
     */
    getObjectCount() {
        return this.objectsArray.length;
    }

    /**
     * Verificar si la capa está visible
     * @returns {boolean} True si está visible
     */
    isVisible() {
        return this.visible;
    }

    /**
     * Cambiar visibilidad de la capa
     * @param {boolean} visible - Nueva visibilidad
     */
    setVisible(visible) {
        this.visible = visible;
    }

    /**
     * Obtener configuración de la capa
     * @returns {Object} Configuración
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Obtener métricas de la capa
     * @returns {Object} Métricas
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * Obtener tiempo del último renderizado
     * @returns {number} Tiempo en milisegundos
     */
    getLastRenderTime() {
        return this.metrics.lastRenderTime;
    }

    /**
     * Establecer tiempo del último renderizado
     * @param {number} time - Tiempo en milisegundos
     */
    setLastRenderTime(time) {
        this.metrics.lastRenderTime = time;
    }

    /**
     * Invalidar cache de la capa
     */
    invalidateCache() {
        this.cacheDirty = true;
    }

    /**
     * Redimensionar cache
     * @param {number} width - Nuevo ancho
     * @param {number} height - Nueva altura
     */
    resizeCache(width, height) {
        if (!this.enableCaching) {
            return;
        }
        
        this.cacheSize.width = width;
        this.cacheSize.height = height;
        this.cacheCanvas.width = width;
        this.cacheCanvas.height = height;
        this.cacheDirty = true;
        
        console.log(`[RenderLayer] Cache de capa '${this.name}' redimensionado a ${width}x${height}`);
    }

    /**
     * Limpiar recursos de la capa
     */
    destroy() {
        this.clear();
        
        // Limpiar cache
        if (this.cacheCanvas) {
            this.cacheCanvas = null;
            this.cacheCtx = null;
        }
        
        console.log(`[RenderLayer] Capa '${this.name}' destruida`);
    }
}