/**
 * Sistema de cámara para Spikepulse
 * @module CameraSystem
 */

export class CameraSystem {
    /**
     * Crea una nueva instancia del sistema de cámara
     * @param {Object} config - Configuración de la cámara
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isInitialized = false;
        
        // Posición y transformación de la cámara
        this.position = {
            x: 0,
            y: 0
        };
        
        this.targetPosition = {
            x: 0,
            y: 0
        };
        
        this.transform = {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0
        };
        
        // Configuración de seguimiento
        this.follow = {
            target: null,
            offset: {
                x: config.offsetX || 0,
                y: config.offsetY || 0
            },
            smoothing: config.smoothing || 0.1,
            enabled: true
        };
        
        // Límites de la cámara
        this.bounds = {
            enabled: config.bounds !== undefined,
            minX: config.bounds?.minX || -Infinity,
            maxX: config.bounds?.maxX || Infinity,
            minY: config.bounds?.minY || -Infinity,
            maxY: config.bounds?.maxY || Infinity
        };
        
        // Configuración de zoom
        this.zoom = {
            current: 1,
            target: 1,
            min: config.zoom?.min || 0.1,
            max: config.zoom?.max || 5,
            smoothing: config.zoom?.smoothing || 0.1
        };
        
        // Sistema de shake
        this.shake = {
            intensity: 0,
            duration: 0,
            time: 0,
            frequency: 30,
            offset: { x: 0, y: 0 }
        };
        
        // Viewport
        this.viewport = {
            width: 1200,
            height: 600,
            centerX: 600,
            centerY: 300
        };
        
        // Configuración de movimiento
        this.movement = {
            speed: config.speed || 1,
            acceleration: config.acceleration || 0.1,
            deceleration: config.deceleration || 0.05
        };
        
        // Estado de interpolación
        this.interpolation = {
            enabled: config.interpolation !== false,
            factor: config.interpolationFactor || 0.1
        };
        
        console.log('📷 CameraSystem creado');
    }
    
    /**
     * Inicializa el sistema de cámara
     */
    async init() {
        try {
            console.log('🔧 Inicializando CameraSystem...');
            
            // Configurar event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ CameraSystem inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando CameraSystem:', error);
            throw error;
        }
    }
    
    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Eventos de cámara
        this.eventBus.on('camera:set-target', this.setTarget.bind(this));
        this.eventBus.on('camera:set-position', this.handleSetPosition.bind(this));
        this.eventBus.on('camera:set-zoom', this.handleSetZoom.bind(this));
        this.eventBus.on('camera:shake', this.handleShake.bind(this));
        this.eventBus.on('camera:follow', this.handleFollow.bind(this));
        this.eventBus.on('camera:stop-follow', this.stopFollow.bind(this));
        
        console.log('👂 Event listeners de cámara configurados');
    }
    
    /**
     * Actualiza el sistema de cámara
     * @param {number} deltaTime - Delta time
     */
    update(deltaTime) {
        if (!this.isInitialized) return;
        
        // Actualizar seguimiento
        this.updateFollow(deltaTime);
        
        // Actualizar zoom
        this.updateZoom(deltaTime);
        
        // Actualizar shake
        this.updateShake(deltaTime);
        
        // Actualizar posición con interpolación
        this.updatePosition(deltaTime);
        
        // Aplicar límites
        this.applyBounds();
        
        // Actualizar transformación final
        this.updateTransform();
    }
    
    /**
     * Actualiza el seguimiento del objetivo
     * @param {number} deltaTime - Delta time
     */
    updateFollow(deltaTime) {
        if (!this.follow.enabled || !this.follow.target) return;
        
        const target = this.follow.target;
        
        // Obtener posición del objetivo
        let targetX = target.x || 0;
        let targetY = target.y || 0;
        
        // Si el objetivo tiene un método getPosition
        if (target.getPosition && typeof target.getPosition === 'function') {
            const pos = target.getPosition();
            targetX = pos.x;
            targetY = pos.y;
        }
        
        // Aplicar offset
        targetX += this.follow.offset.x;
        targetY += this.follow.offset.y;
        
        // Actualizar posición objetivo
        this.targetPosition.x = targetX;
        this.targetPosition.y = targetY;
    }
    
    /**
     * Actualiza el zoom
     * @param {number} deltaTime - Delta time
     */
    updateZoom(deltaTime) {
        if (Math.abs(this.zoom.current - this.zoom.target) > 0.001) {
            const diff = this.zoom.target - this.zoom.current;
            this.zoom.current += diff * this.zoom.smoothing * deltaTime * 60;
            
            // Aplicar límites
            this.zoom.current = Math.max(this.zoom.min, Math.min(this.zoom.max, this.zoom.current));
        }
    }
    
    /**
     * Actualiza el efecto de shake
     * @param {number} deltaTime - Delta time
     */
    updateShake(deltaTime) {
        if (this.shake.duration <= 0) {
            this.shake.intensity = 0;
            this.shake.offset.x = 0;
            this.shake.offset.y = 0;
            return;
        }
        
        this.shake.time += deltaTime;
        this.shake.duration -= deltaTime;
        
        // Calcular offset de shake
        const frequency = this.shake.frequency;
        const intensity = this.shake.intensity * (this.shake.duration / this.shake.time);
        
        this.shake.offset.x = Math.sin(this.shake.time * frequency) * intensity;
        this.shake.offset.y = Math.cos(this.shake.time * frequency * 0.7) * intensity;
    }
    
    /**
     * Actualiza la posición de la cámara
     * @param {number} deltaTime - Delta time
     */
    updatePosition(deltaTime) {
        if (this.interpolation.enabled) {
            // Interpolación suave
            const factor = this.interpolation.factor * deltaTime * 60;
            
            const diffX = this.targetPosition.x - this.position.x;
            const diffY = this.targetPosition.y - this.position.y;
            
            this.position.x += diffX * factor;
            this.position.y += diffY * factor;
        } else {
            // Movimiento directo
            this.position.x = this.targetPosition.x;
            this.position.y = this.targetPosition.y;
        }
    }
    
    /**
     * Aplica límites a la posición de la cámara
     */
    applyBounds() {
        if (!this.bounds.enabled) return;
        
        this.position.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.position.x));
        this.position.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.position.y));
    }
    
    /**
     * Actualiza la transformación final
     */
    updateTransform() {
        // Calcular posición final con shake
        const finalX = this.position.x + this.shake.offset.x;
        const finalY = this.position.y + this.shake.offset.y;
        
        // Convertir a coordenadas de pantalla (centrar en viewport)
        this.transform.x = this.viewport.centerX - (finalX * this.zoom.current);
        this.transform.y = this.viewport.centerY - (finalY * this.zoom.current);
        this.transform.scale = this.zoom.current;
        this.transform.rotation = 0; // Por ahora sin rotación
    }
    
    /**
     * Actualiza el viewport
     * @param {Object} viewport - Nuevo viewport
     */
    updateViewport(viewport) {
        this.viewport.width = viewport.width;
        this.viewport.height = viewport.height;
        this.viewport.centerX = viewport.width / 2;
        this.viewport.centerY = viewport.height / 2;
    }
    
    // ===== MANEJO DE EVENTOS =====
    
    /**
     * Establece el objetivo a seguir
     * @param {Object} data - Datos del objetivo
     */
    setTarget(data) {
        if (typeof data === 'object' && data.target) {
            this.follow.target = data.target;
            this.follow.enabled = true;
            
            console.log('🎯 Objetivo de cámara establecido');
        } else {
            // Si se pasa directamente el objetivo
            this.follow.target = data;
            this.follow.enabled = true;
        }
    }
    
    /**
     * Maneja establecer posición
     * @param {Object} data - Datos de posición
     */
    handleSetPosition(data) {
        this.setPosition(data.x, data.y);
    }
    
    /**
     * Maneja establecer zoom
     * @param {Object} data - Datos de zoom
     */
    handleSetZoom(data) {
        this.setZoom(data.zoom);
    }
    
    /**
     * Maneja shake de cámara
     * @param {Object} data - Datos del shake
     */
    handleShake(data) {
        this.shake(data.intensity, data.duration);
    }
    
    /**
     * Maneja seguimiento
     * @param {Object} data - Datos de seguimiento
     */
    handleFollow(data) {
        this.follow.enabled = data.enabled !== false;
        if (data.smoothing !== undefined) {
            this.follow.smoothing = data.smoothing;
        }
        if (data.offset) {
            this.follow.offset.x = data.offset.x || 0;
            this.follow.offset.y = data.offset.y || 0;
        }
    }
    
    // ===== MÉTODOS PÚBLICOS =====
    
    /**
     * Establece la posición de la cámara
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     */
    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
        this.targetPosition.x = x;
        this.targetPosition.y = y;
        
        // Emitir evento
        this.eventBus.emit('camera:position-changed', {
            x: this.position.x,
            y: this.position.y
        });
    }
    
    /**
     * Mueve la cámara relativamente
     * @param {number} deltaX - Movimiento en X
     * @param {number} deltaY - Movimiento en Y
     */
    move(deltaX, deltaY) {
        this.setPosition(
            this.position.x + deltaX,
            this.position.y + deltaY
        );
    }
    
    /**
     * Establece el zoom de la cámara
     * @param {number} zoom - Nivel de zoom
     */
    setZoom(zoom) {
        this.zoom.target = Math.max(this.zoom.min, Math.min(this.zoom.max, zoom));
        
        // Emitir evento
        this.eventBus.emit('camera:zoom-changed', {
            zoom: this.zoom.target,
            current: this.zoom.current
        });
    }
    
    /**
     * Añade zoom relativamente
     * @param {number} deltaZoom - Cambio de zoom
     */
    addZoom(deltaZoom) {
        this.setZoom(this.zoom.target + deltaZoom);
    }
    
    /**
     * Inicia efecto de shake
     * @param {number} intensity - Intensidad del shake
     * @param {number} duration - Duración en segundos
     */
    shake(intensity, duration) {
        this.shake.intensity = intensity;
        this.shake.duration = duration;
        this.shake.time = 0;
        
        console.log(`📳 Shake de cámara: intensidad ${intensity}, duración ${duration}s`);
    }
    
    /**
     * Detiene el seguimiento
     */
    stopFollow() {
        this.follow.enabled = false;
        this.follow.target = null;
        
        console.log('🛑 Seguimiento de cámara detenido');
    }
    
    /**
     * Establece los límites de la cámara
     * @param {number} minX - Límite mínimo X
     * @param {number} maxX - Límite máximo X
     * @param {number} minY - Límite mínimo Y
     * @param {number} maxY - Límite máximo Y
     */
    setBounds(minX, maxX, minY, maxY) {
        this.bounds.enabled = true;
        this.bounds.minX = minX;
        this.bounds.maxX = maxX;
        this.bounds.minY = minY;
        this.bounds.maxY = maxY;
        
        console.log(`🔒 Límites de cámara establecidos: (${minX}, ${minY}) - (${maxX}, ${maxY})`);
    }
    
    /**
     * Desactiva los límites de la cámara
     */
    removeBounds() {
        this.bounds.enabled = false;
        console.log('🔓 Límites de cámara removidos');
    }
    
    /**
     * Obtiene la transformación actual
     * @returns {Object} Transformación
     */
    getTransform() {
        return { ...this.transform };
    }
    
    /**
     * Obtiene la posición actual
     * @returns {Object} Posición
     */
    getPosition() {
        return { ...this.position };
    }
    
    /**
     * Obtiene el zoom actual
     * @returns {number} Zoom
     */
    getZoom() {
        return this.zoom.current;
    }
    
    /**
     * Convierte coordenadas de pantalla a coordenadas del mundo
     * @param {number} screenX - X de pantalla
     * @param {number} screenY - Y de pantalla
     * @returns {Object} Coordenadas del mundo
     */
    screenToWorld(screenX, screenY) {
        const worldX = (screenX - this.transform.x) / this.transform.scale;
        const worldY = (screenY - this.transform.y) / this.transform.scale;
        
        return { x: worldX, y: worldY };
    }
    
    /**
     * Convierte coordenadas del mundo a coordenadas de pantalla
     * @param {number} worldX - X del mundo
     * @param {number} worldY - Y del mundo
     * @returns {Object} Coordenadas de pantalla
     */
    worldToScreen(worldX, worldY) {
        const screenX = (worldX * this.transform.scale) + this.transform.x;
        const screenY = (worldY * this.transform.scale) + this.transform.y;
        
        return { x: screenX, y: screenY };
    }
    
    /**
     * Verifica si un punto está visible en la cámara
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} margin - Margen adicional
     * @returns {boolean} True si está visible
     */
    isPointVisible(x, y, margin = 0) {
        const screenPos = this.worldToScreen(x, y);
        
        return screenPos.x >= -margin &&
               screenPos.x <= this.viewport.width + margin &&
               screenPos.y >= -margin &&
               screenPos.y <= this.viewport.height + margin;
    }
    
    /**
     * Verifica si un rectángulo está visible en la cámara
     * @param {Object} bounds - Bounds del rectángulo
     * @param {number} margin - Margen adicional
     * @returns {boolean} True si está visible
     */
    isRectVisible(bounds, margin = 0) {
        const topLeft = this.worldToScreen(bounds.x, bounds.y);
        const bottomRight = this.worldToScreen(
            bounds.x + bounds.width,
            bounds.y + bounds.height
        );
        
        return !(bottomRight.x < -margin ||
                topLeft.x > this.viewport.width + margin ||
                bottomRight.y < -margin ||
                topLeft.y > this.viewport.height + margin);
    }
    
    /**
     * Obtiene los bounds visibles del mundo
     * @returns {Object} Bounds del mundo visible
     */
    getVisibleWorldBounds() {
        const topLeft = this.screenToWorld(0, 0);
        const bottomRight = this.screenToWorld(this.viewport.width, this.viewport.height);
        
        return {
            x: topLeft.x,
            y: topLeft.y,
            width: bottomRight.x - topLeft.x,
            height: bottomRight.y - topLeft.y
        };
    }
    
    /**
     * Obtiene información de debug
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            position: { ...this.position },
            targetPosition: { ...this.targetPosition },
            transform: { ...this.transform },
            zoom: {
                current: this.zoom.current,
                target: this.zoom.target,
                min: this.zoom.min,
                max: this.zoom.max
            },
            follow: {
                enabled: this.follow.enabled,
                hasTarget: this.follow.target !== null,
                offset: { ...this.follow.offset },
                smoothing: this.follow.smoothing
            },
            shake: {
                active: this.shake.duration > 0,
                intensity: this.shake.intensity,
                duration: this.shake.duration,
                offset: { ...this.shake.offset }
            },
            bounds: {
                enabled: this.bounds.enabled,
                ...this.bounds
            },
            viewport: { ...this.viewport }
        };
    }
    
    /**
     * Resetea el sistema de cámara
     */
    reset() {
        console.log('🔄 Reseteando CameraSystem...');
        
        // Resetear posición
        this.position.x = 0;
        this.position.y = 0;
        this.targetPosition.x = 0;
        this.targetPosition.y = 0;
        
        // Resetear zoom
        this.zoom.current = 1;
        this.zoom.target = 1;
        
        // Resetear shake
        this.shake.intensity = 0;
        this.shake.duration = 0;
        this.shake.time = 0;
        this.shake.offset.x = 0;
        this.shake.offset.y = 0;
        
        // Resetear seguimiento
        this.follow.target = null;
        this.follow.enabled = true;
        
        // Actualizar transformación
        this.updateTransform();
        
        console.log('✅ CameraSystem reseteado');
    }
    
    /**
     * Limpia recursos del sistema de cámara
     */
    destroy() {
        console.log('🧹 Destruyendo CameraSystem...');
        
        // Remover event listeners
        this.eventBus.off('*', this);
        
        // Limpiar referencias
        this.follow.target = null;
        
        this.isInitialized = false;
        
        console.log('✅ CameraSystem destruido');
    }
}