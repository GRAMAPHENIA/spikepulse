/**
 * Manejador de entrada táctil para Spikepulse
 * @module TouchHandler
 */

export class TouchHandler {
    /**
     * Crea una nueva instancia del manejador táctil
     * @param {Object} config - Configuración táctil
     * @param {EventBus} eventBus - Bus de eventos
     * @param {Object} deviceConfig - Configuración del dispositivo
     */
    constructor(config, eventBus, deviceConfig = {}) {
        this.config = config;
        this.eventBus = eventBus;
        this.deviceConfig = deviceConfig;
        this.isEnabled = true;
        this.isInitialized = false;
        
        // Configuración de zonas táctiles
        this.touchZones = {
            jump: config.jumpZone || { x: 0, y: 0, width: 0.6, height: 1 },
            dash: config.dashZone || { x: 0.6, y: 0, width: 0.2, height: 1 },
            gravity: config.gravityZone || { x: 0.8, y: 0, width: 0.2, height: 1 }
        };
        
        // Estado de toques activos
        this.activeTouches = new Map();
        this.touchActions = new Map();
        
        // Configuración de gestos
        this.gestureConfig = {
            swipeThreshold: 50,
            swipeTimeThreshold: 300,
            tapTimeThreshold: 200,
            doubleTapTimeThreshold: 300,
            longPressTimeThreshold: 500
        };
        
        // Estado de gestos
        this.gestureState = {
            lastTap: null,
            swipeStart: null,
            longPressTimer: null
        };
        
        // Handlers de eventos (bound para poder removerlos)
        this.boundHandlers = {
            touchStart: this.handleTouchStart.bind(this),
            touchMove: this.handleTouchMove.bind(this),
            touchEnd: this.handleTouchEnd.bind(this),
            touchCancel: this.handleTouchCancel.bind(this)
        };
        
        // Configuración de prevención de defaults
        this.preventDefaults = deviceConfig.preventDefaults !== false;
        
        console.log('📱 TouchHandler creado');
    }
    
    /**
     * Inicializa el manejador táctil
     */
    async init() {
        try {
            console.log('🔧 Inicializando TouchHandler...');
            
            // Verificar soporte táctil
            if (!this.isTouchSupported()) {
                console.warn('⚠️ Soporte táctil no detectado');
                return;
            }
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Crear overlay de zonas táctiles si está en modo debug
            if (this.config.showTouchZones) {
                this.createTouchZoneOverlay();
            }
            
            this.isInitialized = true;
            console.log('✅ TouchHandler inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando TouchHandler:', error);
            throw error;
        }
    }
    
    /**
     * Verifica si el dispositivo soporta touch
     * @returns {boolean} True si soporta touch
     */
    isTouchSupported() {
        return 'ontouchstart' in window || 
               navigator.maxTouchPoints > 0 || 
               window.TouchEvent !== undefined;
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        const options = { passive: !this.preventDefaults };
        
        document.addEventListener('touchstart', this.boundHandlers.touchStart, options);
        document.addEventListener('touchmove', this.boundHandlers.touchMove, options);
        document.addEventListener('touchend', this.boundHandlers.touchEnd, options);
        document.addEventListener('touchcancel', this.boundHandlers.touchCancel, options);
        
        console.log('👂 Event listeners táctiles configurados');
    }
    
    /**
     * Maneja eventos de touchstart
     * @param {TouchEvent} event - Evento táctil
     */
    handleTouchStart(event) {
        if (!this.isEnabled || !this.isInitialized) return;
        
        if (this.preventDefaults) {
            event.preventDefault();
        }
        
        const currentTime = Date.now();
        
        for (const touch of event.changedTouches) {
            const touchInfo = {
                id: touch.identifier,
                startX: touch.clientX,
                startY: touch.clientY,
                currentX: touch.clientX,
                currentY: touch.clientY,
                startTime: currentTime,
                lastMoveTime: currentTime,
                zone: this.getTouchZone(touch.clientX, touch.clientY),
                action: null,
                isActive: true
            };
            
            this.activeTouches.set(touch.identifier, touchInfo);
            
            // Determinar acción basada en la zona
            const action = this.getActionFromZone(touchInfo.zone);
            if (action) {
                touchInfo.action = action;
                this.touchActions.set(action, touch.identifier);
                this.emitInputEvent(action, true, touch);
            }
            
            // Detectar gestos
            this.detectGestures(touchInfo, 'start');
            
            // Notificar que se usó touch
            this.eventBus.emit('input:touch-used', {
                touchId: touch.identifier,
                zone: touchInfo.zone,
                action
            });
        }
    }
    
    /**
     * Maneja eventos de touchmove
     * @param {TouchEvent} event - Evento táctil
     */
    handleTouchMove(event) {
        if (!this.isEnabled || !this.isInitialized) return;
        
        if (this.preventDefaults) {
            event.preventDefault();
        }
        
        const currentTime = Date.now();
        
        for (const touch of event.changedTouches) {
            const touchInfo = this.activeTouches.get(touch.identifier);
            if (!touchInfo) continue;
            
            // Actualizar posición
            touchInfo.currentX = touch.clientX;
            touchInfo.currentY = touch.clientY;
            touchInfo.lastMoveTime = currentTime;
            
            // Verificar si cambió de zona
            const newZone = this.getTouchZone(touch.clientX, touch.clientY);
            if (newZone !== touchInfo.zone) {
                // Liberar acción anterior
                if (touchInfo.action) {
                    this.touchActions.delete(touchInfo.action);
                    this.emitInputEvent(touchInfo.action, false, touch);
                }
                
                // Asignar nueva acción
                touchInfo.zone = newZone;
                const newAction = this.getActionFromZone(newZone);
                if (newAction) {
                    touchInfo.action = newAction;
                    this.touchActions.set(newAction, touch.identifier);
                    this.emitInputEvent(newAction, true, touch);
                }
            }
            
            // Detectar gestos
            this.detectGestures(touchInfo, 'move');
        }
    }
    
    /**
     * Maneja eventos de touchend
     * @param {TouchEvent} event - Evento táctil
     */
    handleTouchEnd(event) {
        if (!this.isEnabled || !this.isInitialized) return;
        
        if (this.preventDefaults) {
            event.preventDefault();
        }
        
        for (const touch of event.changedTouches) {
            const touchInfo = this.activeTouches.get(touch.identifier);
            if (!touchInfo) continue;
            
            // Liberar acción si existe
            if (touchInfo.action) {
                this.touchActions.delete(touchInfo.action);
                this.emitInputEvent(touchInfo.action, false, touch);
            }
            
            // Detectar gestos finales
            this.detectGestures(touchInfo, 'end');
            
            // Remover touch
            this.activeTouches.delete(touch.identifier);
        }
    }
    
    /**
     * Maneja eventos de touchcancel
     * @param {TouchEvent} event - Evento táctil
     */
    handleTouchCancel(event) {
        if (!this.isEnabled || !this.isInitialized) return;
        
        // Tratar como touchend
        this.handleTouchEnd(event);
    }
    
    /**
     * Determina la zona táctil basada en coordenadas
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @returns {string|null} Nombre de la zona o null
     */
    getTouchZone(x, y) {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Convertir a coordenadas relativas
        const relativeX = x / screenWidth;
        const relativeY = y / screenHeight;
        
        // Verificar cada zona
        for (const [zoneName, zone] of Object.entries(this.touchZones)) {
            if (relativeX >= zone.x && 
                relativeX <= zone.x + zone.width &&
                relativeY >= zone.y && 
                relativeY <= zone.y + zone.height) {
                return zoneName;
            }
        }
        
        return null;
    }
    
    /**
     * Obtiene la acción asociada a una zona
     * @param {string} zone - Nombre de la zona
     * @returns {string|null} Acción o null
     */
    getActionFromZone(zone) {
        const zoneActionMap = {
            jump: 'jump',
            dash: 'dash',
            gravity: 'gravityToggle'
        };
        
        return zoneActionMap[zone] || null;
    }
    
    /**
     * Detecta gestos táctiles
     * @param {Object} touchInfo - Información del touch
     * @param {string} phase - Fase del gesto (start, move, end)
     */
    detectGestures(touchInfo, phase) {
        const currentTime = Date.now();
        
        switch (phase) {
            case 'start':
                // Detectar doble tap
                if (this.gestureState.lastTap && 
                    currentTime - this.gestureState.lastTap.time < this.gestureConfig.doubleTapTimeThreshold) {
                    const distance = this.getDistance(
                        touchInfo.startX, touchInfo.startY,
                        this.gestureState.lastTap.x, this.gestureState.lastTap.y
                    );
                    
                    if (distance < 50) {
                        this.emitGestureEvent('doubleTap', touchInfo);
                        this.gestureState.lastTap = null;
                        return;
                    }
                }
                
                // Iniciar detección de long press
                this.gestureState.longPressTimer = setTimeout(() => {
                    if (this.activeTouches.has(touchInfo.id)) {
                        this.emitGestureEvent('longPress', touchInfo);
                    }
                }, this.gestureConfig.longPressTimeThreshold);
                
                break;
                
            case 'move':
                // Cancelar long press si se mueve mucho
                const moveDistance = this.getDistance(
                    touchInfo.startX, touchInfo.startY,
                    touchInfo.currentX, touchInfo.currentY
                );
                
                if (moveDistance > 20 && this.gestureState.longPressTimer) {
                    clearTimeout(this.gestureState.longPressTimer);
                    this.gestureState.longPressTimer = null;
                }
                
                break;
                
            case 'end':
                // Cancelar long press
                if (this.gestureState.longPressTimer) {
                    clearTimeout(this.gestureState.longPressTimer);
                    this.gestureState.longPressTimer = null;
                }
                
                const touchDuration = currentTime - touchInfo.startTime;
                const swipeDistance = this.getDistance(
                    touchInfo.startX, touchInfo.startY,
                    touchInfo.currentX, touchInfo.currentY
                );
                
                // Detectar tap
                if (touchDuration < this.gestureConfig.tapTimeThreshold && swipeDistance < 20) {
                    this.gestureState.lastTap = {
                        x: touchInfo.startX,
                        y: touchInfo.startY,
                        time: currentTime
                    };
                    this.emitGestureEvent('tap', touchInfo);
                }
                // Detectar swipe
                else if (swipeDistance > this.gestureConfig.swipeThreshold && 
                         touchDuration < this.gestureConfig.swipeTimeThreshold) {
                    const swipeDirection = this.getSwipeDirection(touchInfo);
                    this.emitGestureEvent('swipe', touchInfo, { direction: swipeDirection });
                }
                
                break;
        }
    }
    
    /**
     * Calcula la distancia entre dos puntos
     * @param {number} x1 - X del primer punto
     * @param {number} y1 - Y del primer punto
     * @param {number} x2 - X del segundo punto
     * @param {number} y2 - Y del segundo punto
     * @returns {number} Distancia
     */
    getDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Determina la dirección del swipe
     * @param {Object} touchInfo - Información del touch
     * @returns {string} Dirección del swipe
     */
    getSwipeDirection(touchInfo) {
        const dx = touchInfo.currentX - touchInfo.startX;
        const dy = touchInfo.currentY - touchInfo.startY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'down' : 'up';
        }
    }
    
    /**
     * Emite un evento de input
     * @param {string} action - Acción del input
     * @param {boolean} pressed - Si está presionado
     * @param {Touch} touch - Objeto touch
     */
    emitInputEvent(action, pressed, touch) {
        this.eventBus.emit('input:raw-touch', {
            action,
            pressed,
            device: 'touch',
            touchId: touch.identifier,
            position: {
                x: touch.clientX,
                y: touch.clientY
            },
            timestamp: Date.now()
        });
    }
    
    /**
     * Emite un evento de gesto
     * @param {string} gestureType - Tipo de gesto
     * @param {Object} touchInfo - Información del touch
     * @param {Object} data - Datos adicionales
     */
    emitGestureEvent(gestureType, touchInfo, data = {}) {
        this.eventBus.emit('input:gesture', {
            type: gestureType,
            touchId: touchInfo.id,
            position: {
                x: touchInfo.currentX,
                y: touchInfo.currentY
            },
            startPosition: {
                x: touchInfo.startX,
                y: touchInfo.startY
            },
            zone: touchInfo.zone,
            duration: Date.now() - touchInfo.startTime,
            ...data
        });
    }
    
    /**
     * Crea overlay visual de zonas táctiles para debug
     */
    createTouchZoneOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'touch-zone-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            opacity: 0.3;
        `;
        
        // Crear zonas visuales
        for (const [zoneName, zone] of Object.entries(this.touchZones)) {
            const zoneElement = document.createElement('div');
            zoneElement.style.cssText = `
                position: absolute;
                left: ${zone.x * 100}%;
                top: ${zone.y * 100}%;
                width: ${zone.width * 100}%;
                height: ${zone.height * 100}%;
                background: ${this.getZoneColor(zoneName)};
                border: 2px solid white;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 14px;
                text-shadow: 1px 1px 2px black;
            `;
            zoneElement.textContent = zoneName.toUpperCase();
            overlay.appendChild(zoneElement);
        }
        
        document.body.appendChild(overlay);
        
        // Remover después de 5 segundos
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        }, 5000);
    }
    
    /**
     * Obtiene el color para una zona
     * @param {string} zoneName - Nombre de la zona
     * @returns {string} Color CSS
     */
    getZoneColor(zoneName) {
        const colors = {
            jump: 'rgba(255, 215, 0, 0.5)',
            dash: 'rgba(159, 122, 234, 0.5)',
            gravity: 'rgba(255, 107, 107, 0.5)'
        };
        return colors[zoneName] || 'rgba(128, 128, 128, 0.5)';
    }
    
    /**
     * Actualiza el manejador táctil
     * @param {number} deltaTime - Delta time
     */
    update(deltaTime) {
        if (!this.isInitialized || !this.isEnabled) return;
        
        // Limpiar touches inactivos
        this.cleanupInactiveTouches();
    }
    
    /**
     * Limpia touches inactivos
     */
    cleanupInactiveTouches() {
        const currentTime = Date.now();
        const timeout = 5000; // 5 segundos
        
        for (const [touchId, touchInfo] of this.activeTouches.entries()) {
            if (currentTime - touchInfo.lastMoveTime > timeout) {
                console.warn(`🧹 Limpiando touch inactivo: ${touchId}`);
                
                if (touchInfo.action) {
                    this.touchActions.delete(touchInfo.action);
                    this.emitInputEvent(touchInfo.action, false, { identifier: touchId });
                }
                
                this.activeTouches.delete(touchId);
            }
        }
    }
    
    /**
     * Verifica si una acción está presionada
     * @param {string} action - Acción a verificar
     * @returns {boolean} True si está presionada
     */
    isActionPressed(action) {
        return this.touchActions.has(action);
    }
    
    /**
     * Obtiene información de un touch activo
     * @param {number} touchId - ID del touch
     * @returns {Object|null} Información del touch o null
     */
    getTouchInfo(touchId) {
        return this.activeTouches.get(touchId) || null;
    }
    
    /**
     * Obtiene todos los touches activos
     * @returns {Array} Array de información de touches
     */
    getActiveTouches() {
        return Array.from(this.activeTouches.values());
    }
    
    /**
     * Actualiza las zonas táctiles
     * @param {Object} newZones - Nuevas zonas táctiles
     */
    updateTouchZones(newZones) {
        this.touchZones = { ...this.touchZones, ...newZones };
        console.log('📱 Zonas táctiles actualizadas');
        
        // Emitir evento de cambio
        this.eventBus.emit('input:touch-zones-changed', {
            zones: this.touchZones
        });
    }
    
    /**
     * Habilita el manejador táctil
     */
    enable() {
        this.isEnabled = true;
        console.log('✅ TouchHandler habilitado');
    }
    
    /**
     * Deshabilita el manejador táctil
     */
    disable() {
        this.isEnabled = false;
        
        // Liberar todos los touches
        for (const [touchId, touchInfo] of this.activeTouches.entries()) {
            if (touchInfo.action) {
                this.touchActions.delete(touchInfo.action);
                this.emitInputEvent(touchInfo.action, false, { identifier: touchId });
            }
        }
        
        this.activeTouches.clear();
        this.touchActions.clear();
        
        console.log('🚫 TouchHandler deshabilitado');
    }
    
    /**
     * Obtiene información de debug
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            isEnabled: this.isEnabled,
            isInitialized: this.isInitialized,
            isTouchSupported: this.isTouchSupported(),
            activeTouches: this.getActiveTouches().length,
            touchActions: Object.fromEntries(this.touchActions),
            touchZones: { ...this.touchZones },
            gestureConfig: { ...this.gestureConfig }
        };
    }
    
    /**
     * Obtiene el estado actual del touch
     * @returns {Object} Estado del touch
     */
    getState() {
        return {
            isEnabled: this.isEnabled,
            activeTouches: this.getActiveTouches().length,
            activeActions: Array.from(this.touchActions.keys())
        };
    }
    
    /**
     * Limpia recursos del manejador táctil
     */
    destroy() {
        console.log('🧹 Destruyendo TouchHandler...');
        
        // Remover event listeners
        document.removeEventListener('touchstart', this.boundHandlers.touchStart);
        document.removeEventListener('touchmove', this.boundHandlers.touchMove);
        document.removeEventListener('touchend', this.boundHandlers.touchEnd);
        document.removeEventListener('touchcancel', this.boundHandlers.touchCancel);
        
        // Limpiar timers
        if (this.gestureState.longPressTimer) {
            clearTimeout(this.gestureState.longPressTimer);
        }
        
        // Liberar todos los touches
        this.disable();
        
        // Remover overlay si existe
        const overlay = document.getElementById('touch-zone-overlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
        
        this.isInitialized = false;
        
        console.log('✅ TouchHandler destruido');
    }
}