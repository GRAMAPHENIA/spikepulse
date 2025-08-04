/**
 * Manejador de entrada de mouse para Spikepulse
 * @module MouseHandler
 */

export class MouseHandler {
    /**
     * Crea una nueva instancia del manejador de mouse
     * @param {Object} config - Configuración de mouse
     * @param {EventBus} eventBus - Bus de eventos
     * @param {Object} deviceConfig - Configuración del dispositivo
     */
    constructor(config, eventBus, deviceConfig = {}) {
        this.config = config;
        this.eventBus = eventBus;
        this.deviceConfig = deviceConfig;
        this.isEnabled = true;
        this.isInitialized = false;
        
        // Mapeo de botones de mouse a acciones
        this.buttonMap = {
            0: config.jumpButton !== undefined ? 
               (config.jumpButton === 0 ? 'jump' : null) : 'jump', // Left click
            2: config.dashButton !== undefined ? 
               (config.dashButton === 2 ? 'dash' : null) : 'dash'   // Right click
        };
        
        // Estado de botones del mouse
        this.buttonState = {};
        this.previousButtonState = {};
        
        // Estado del mouse
        this.mouseState = {
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: 0,
            wheel: 0,
            isOverCanvas: false
        };
        
        // Configuración de sensibilidad
        this.sensitivity = {
            movement: config.sensitivity?.movement || 1.0,
            wheel: config.sensitivity?.wheel || 1.0
        };
        
        // Handlers de eventos (bound para poder removerlos)
        this.boundHandlers = {
            mouseDown: this.handleMouseDown.bind(this),
            mouseUp: this.handleMouseUp.bind(this),
            mouseMove: this.handleMouseMove.bind(this),
            mouseWheel: this.handleMouseWheel.bind(this),
            contextMenu: this.handleContextMenu.bind(this),
            mouseEnter: this.handleMouseEnter.bind(this),
            mouseLeave: this.handleMouseLeave.bind(this)
        };
        
        // Configuración de prevención de menú contextual
        this.preventContextMenu = deviceConfig.preventContextMenu !== false;
        
        // Canvas de referencia
        this.canvas = null;
        
        console.log('🖱️ MouseHandler creado');
    }
    
    /**
     * Inicializa el manejador de mouse
     */
    async init() {
        try {
            console.log('🔧 Inicializando MouseHandler...');
            
            // Encontrar el canvas del juego
            this.canvas = document.getElementById('game-canvas');
            
            // Configurar event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ MouseHandler inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando MouseHandler:', error);
            throw error;
        }
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Event listeners globales
        document.addEventListener('mousedown', this.boundHandlers.mouseDown);
        document.addEventListener('mouseup', this.boundHandlers.mouseUp);
        document.addEventListener('mousemove', this.boundHandlers.mouseMove);
        document.addEventListener('wheel', this.boundHandlers.mouseWheel, { passive: false });
        
        // Prevenir menú contextual si está configurado
        if (this.preventContextMenu) {
            document.addEventListener('contextmenu', this.boundHandlers.contextMenu);
        }
        
        // Event listeners específicos del canvas si existe
        if (this.canvas) {
            this.canvas.addEventListener('mouseenter', this.boundHandlers.mouseEnter);
            this.canvas.addEventListener('mouseleave', this.boundHandlers.mouseLeave);
        }
        
        console.log('👂 Event listeners de mouse configurados');
    }
    
    /**
     * Maneja eventos de mousedown
     * @param {MouseEvent} event - Evento de mouse
     */
    handleMouseDown(event) {
        if (!this.isEnabled || !this.isInitialized) return;
        
        const button = event.button;
        const action = this.buttonMap[button];
        
        // Actualizar estado del botón
        this.buttonState[button] = true;
        
        // Actualizar posición del mouse
        this.updateMousePosition(event);
        
        // Emitir evento si hay una acción mapeada
        if (action) {
            this.emitInputEvent(action, true, button, event);
            
            // Prevenir comportamiento por defecto para botones mapeados
            event.preventDefault();
        }
        
        // Notificar que se usó el mouse
        this.eventBus.emit('input:mouse-used', {
            button,
            action,
            position: { x: this.mouseState.x, y: this.mouseState.y }
        });
        
        // Emitir evento raw de mouse
        this.eventBus.emit('input:raw-mouse-button', {
            button,
            action,
            pressed: true,
            position: { x: this.mouseState.x, y: this.mouseState.y },
            event: {
                button: event.button,
                buttons: event.buttons,
                altKey: event.altKey,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
                metaKey: event.metaKey
            }
        });
    }
    
    /**
     * Maneja eventos de mouseup
     * @param {MouseEvent} event - Evento de mouse
     */
    handleMouseUp(event) {
        if (!this.isEnabled || !this.isInitialized) return;
        
        const button = event.button;
        const action = this.buttonMap[button];
        
        // Actualizar estado del botón
        this.buttonState[button] = false;
        
        // Actualizar posición del mouse
        this.updateMousePosition(event);
        
        // Emitir evento si hay una acción mapeada
        if (action) {
            this.emitInputEvent(action, false, button, event);
        }
        
        // Emitir evento raw de mouse
        this.eventBus.emit('input:raw-mouse-button', {
            button,
            action,
            pressed: false,
            position: { x: this.mouseState.x, y: this.mouseState.y },
            event: {
                button: event.button,
                buttons: event.buttons,
                altKey: event.altKey,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
                metaKey: event.metaKey
            }
        });
    }
    
    /**
     * Maneja eventos de mousemove
     * @param {MouseEvent} event - Evento de mouse
     */
    handleMouseMove(event) {
        if (!this.isEnabled || !this.isInitialized) return;
        
        // Actualizar posición del mouse
        this.updateMousePosition(event);
        
        // Emitir evento de movimiento de mouse
        this.eventBus.emit('input:mouse-move', {
            position: { x: this.mouseState.x, y: this.mouseState.y },
            delta: { x: this.mouseState.deltaX, y: this.mouseState.deltaY },
            isOverCanvas: this.mouseState.isOverCanvas
        });
        
        // Notificar que se usó el mouse (solo si se movió significativamente)
        if (Math.abs(this.mouseState.deltaX) > 2 || Math.abs(this.mouseState.deltaY) > 2) {
            this.eventBus.emit('input:mouse-used', {
                type: 'move',
                position: { x: this.mouseState.x, y: this.mouseState.y }
            });
        }
    }
    
    /**
     * Maneja eventos de wheel
     * @param {WheelEvent} event - Evento de wheel
     */
    handleMouseWheel(event) {
        if (!this.isEnabled || !this.isInitialized) return;
        
        // Actualizar estado de wheel
        this.mouseState.wheel = event.deltaY * this.sensitivity.wheel;
        
        // Determinar dirección del scroll
        const direction = event.deltaY > 0 ? 'down' : 'up';
        
        // Emitir evento de wheel
        this.eventBus.emit('input:mouse-wheel', {
            delta: this.mouseState.wheel,
            direction,
            position: { x: this.mouseState.x, y: this.mouseState.y }
        });
        
        // Notificar que se usó el mouse
        this.eventBus.emit('input:mouse-used', {
            type: 'wheel',
            direction,
            delta: this.mouseState.wheel
        });
        
        // Prevenir scroll de página si está sobre el canvas
        if (this.mouseState.isOverCanvas) {
            event.preventDefault();
        }
    }
    
    /**
     * Maneja eventos de contextmenu
     * @param {Event} event - Evento de menú contextual
     */
    handleContextMenu(event) {
        if (!this.isEnabled || !this.isInitialized) return;
        
        // Prevenir menú contextual si está configurado
        if (this.preventContextMenu) {
            event.preventDefault();
        }
    }
    
    /**
     * Maneja cuando el mouse entra al canvas
     * @param {MouseEvent} event - Evento de mouse
     */
    handleMouseEnter(event) {
        this.mouseState.isOverCanvas = true;
        
        this.eventBus.emit('input:mouse-canvas-enter', {
            position: { x: this.mouseState.x, y: this.mouseState.y }
        });
    }
    
    /**
     * Maneja cuando el mouse sale del canvas
     * @param {MouseEvent} event - Evento de mouse
     */
    handleMouseLeave(event) {
        this.mouseState.isOverCanvas = false;
        
        this.eventBus.emit('input:mouse-canvas-leave', {
            position: { x: this.mouseState.x, y: this.mouseState.y }
        });
    }
    
    /**
     * Actualiza la posición del mouse
     * @param {MouseEvent} event - Evento de mouse
     */
    updateMousePosition(event) {
        const previousX = this.mouseState.x;
        const previousY = this.mouseState.y;
        
        this.mouseState.x = event.clientX;
        this.mouseState.y = event.clientY;
        
        // Calcular delta con sensibilidad
        this.mouseState.deltaX = (this.mouseState.x - previousX) * this.sensitivity.movement;
        this.mouseState.deltaY = (this.mouseState.y - previousY) * this.sensitivity.movement;
        
        // Verificar si está sobre el canvas
        if (this.canvas) {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseState.isOverCanvas = 
                this.mouseState.x >= rect.left &&
                this.mouseState.x <= rect.right &&
                this.mouseState.y >= rect.top &&
                this.mouseState.y <= rect.bottom;
        }
    }
    
    /**
     * Emite un evento de input
     * @param {string} action - Acción del input
     * @param {boolean} pressed - Si está presionado
     * @param {number} button - Botón del mouse
     * @param {MouseEvent} event - Evento original
     */
    emitInputEvent(action, pressed, button, event) {
        this.eventBus.emit('input:raw-mouse', {
            action,
            pressed,
            device: 'mouse',
            button,
            position: { x: this.mouseState.x, y: this.mouseState.y },
            timestamp: Date.now()
        });
    }
    
    /**
     * Actualiza el manejador de mouse
     * @param {number} deltaTime - Delta time
     */
    update(deltaTime) {
        if (!this.isInitialized || !this.isEnabled) return;
        
        // Actualizar estado anterior
        this.previousButtonState = { ...this.buttonState };
        
        // Resetear wheel delta
        this.mouseState.wheel = 0;
        
        // Resetear deltas de movimiento
        this.mouseState.deltaX = 0;
        this.mouseState.deltaY = 0;
    }
    
    /**
     * Verifica si un botón está presionado
     * @param {number} button - Número del botón
     * @returns {boolean} True si está presionado
     */
    isButtonPressed(button) {
        return this.buttonState[button] || false;
    }
    
    /**
     * Verifica si una acción está presionada
     * @param {string} action - Acción a verificar
     * @returns {boolean} True si está presionada
     */
    isActionPressed(action) {
        for (const button in this.buttonMap) {
            if (this.buttonMap[button] === action && this.buttonState[button]) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Verifica si un botón fue presionado este frame
     * @param {number} button - Número del botón
     * @returns {boolean} True si fue presionado este frame
     */
    wasButtonPressed(button) {
        return this.buttonState[button] && !this.previousButtonState[button];
    }
    
    /**
     * Verifica si un botón fue liberado este frame
     * @param {number} button - Número del botón
     * @returns {boolean} True si fue liberado este frame
     */
    wasButtonReleased(button) {
        return !this.buttonState[button] && this.previousButtonState[button];
    }
    
    /**
     * Obtiene la posición actual del mouse
     * @returns {Object} Posición del mouse
     */
    getMousePosition() {
        return { x: this.mouseState.x, y: this.mouseState.y };
    }
    
    /**
     * Obtiene la posición del mouse relativa al canvas
     * @returns {Object|null} Posición relativa o null si no hay canvas
     */
    getCanvasRelativePosition() {
        if (!this.canvas) return null;
        
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: this.mouseState.x - rect.left,
            y: this.mouseState.y - rect.top
        };
    }
    
    /**
     * Obtiene todos los botones presionados actualmente
     * @returns {Array<number>} Array de números de botones presionados
     */
    getPressedButtons() {
        return Object.keys(this.buttonState)
            .filter(button => this.buttonState[button])
            .map(button => parseInt(button));
    }
    
    /**
     * Obtiene todas las acciones presionadas actualmente
     * @returns {Array<string>} Array de acciones presionadas
     */
    getPressedActions() {
        const actions = new Set();
        for (const button in this.buttonState) {
            if (this.buttonState[button] && this.buttonMap[button]) {
                actions.add(this.buttonMap[button]);
            }
        }
        return Array.from(actions);
    }
    
    /**
     * Actualiza el mapeo de botones
     * @param {Object} newButtonMap - Nuevo mapeo de botones
     */
    updateButtonMap(newButtonMap) {
        this.buttonMap = { ...this.buttonMap, ...newButtonMap };
        console.log('🖱️ Mapeo de botones de mouse actualizado');
        
        // Emitir evento de cambio
        this.eventBus.emit('input:mouse-buttonmap-changed', {
            device: 'mouse',
            buttonMap: this.buttonMap
        });
    }
    
    /**
     * Actualiza la sensibilidad del mouse
     * @param {Object} newSensitivity - Nueva sensibilidad
     */
    updateSensitivity(newSensitivity) {
        this.sensitivity = { ...this.sensitivity, ...newSensitivity };
        console.log('🖱️ Sensibilidad de mouse actualizada');
        
        // Emitir evento de cambio
        this.eventBus.emit('input:mouse-sensitivity-changed', {
            sensitivity: this.sensitivity
        });
    }
    
    /**
     * Habilita el manejador de mouse
     */
    enable() {
        this.isEnabled = true;
        console.log('✅ MouseHandler habilitado');
    }
    
    /**
     * Deshabilita el manejador de mouse
     */
    disable() {
        this.isEnabled = false;
        
        // Liberar todos los botones
        for (const button in this.buttonState) {
            if (this.buttonState[button]) {
                this.buttonState[button] = false;
                
                const action = this.buttonMap[button];
                if (action) {
                    this.emitInputEvent(action, false, parseInt(button), null);
                }
            }
        }
        
        console.log('🚫 MouseHandler deshabilitado');
    }
    
    /**
     * Obtiene información de debug
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            isEnabled: this.isEnabled,
            isInitialized: this.isInitialized,
            buttonState: { ...this.buttonState },
            buttonMap: { ...this.buttonMap },
            mouseState: { ...this.mouseState },
            sensitivity: { ...this.sensitivity },
            pressedButtons: this.getPressedButtons(),
            pressedActions: this.getPressedActions(),
            canvasRelativePosition: this.getCanvasRelativePosition()
        };
    }
    
    /**
     * Obtiene el estado actual del mouse
     * @returns {Object} Estado del mouse
     */
    getState() {
        return {
            isEnabled: this.isEnabled,
            position: this.getMousePosition(),
            isOverCanvas: this.mouseState.isOverCanvas,
            pressedButtons: this.getPressedButtons(),
            pressedActions: this.getPressedActions()
        };
    }
    
    /**
     * Limpia recursos del manejador de mouse
     */
    destroy() {
        console.log('🧹 Destruyendo MouseHandler...');
        
        // Remover event listeners
        document.removeEventListener('mousedown', this.boundHandlers.mouseDown);
        document.removeEventListener('mouseup', this.boundHandlers.mouseUp);
        document.removeEventListener('mousemove', this.boundHandlers.mouseMove);
        document.removeEventListener('wheel', this.boundHandlers.mouseWheel);
        document.removeEventListener('contextmenu', this.boundHandlers.contextMenu);
        
        if (this.canvas) {
            this.canvas.removeEventListener('mouseenter', this.boundHandlers.mouseEnter);
            this.canvas.removeEventListener('mouseleave', this.boundHandlers.mouseLeave);
        }
        
        // Liberar todos los botones
        this.disable();
        
        // Limpiar estado
        this.buttonState = {};
        this.previousButtonState = {};
        
        this.isInitialized = false;
        
        console.log('✅ MouseHandler destruido');
    }
}