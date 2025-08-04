/**
 * Manejador de entrada de teclado para Spikepulse
 * @module KeyboardHandler
 */

export class KeyboardHandler {
    /**
     * Crea una nueva instancia del manejador de teclado
     * @param {Object} config - Configuración de teclado
     * @param {EventBus} eventBus - Bus de eventos
     * @param {Object} deviceConfig - Configuración del dispositivo
     */
    constructor(config, eventBus, deviceConfig = {}) {
        this.config = config;
        this.eventBus = eventBus;
        this.deviceConfig = deviceConfig;
        this.isEnabled = true;
        this.isInitialized = false;
        
        // Mapeo de teclas a acciones
        this.keyMap = {
            // Salto
            Space: 'jump',
            ArrowUp: 'jump',
            KeyW: 'jump',
            
            // Dash
            ShiftLeft: 'dash',
            ShiftRight: 'dash',
            
            // Cambio de gravedad
            ControlLeft: 'gravityToggle',
            ControlRight: 'gravityToggle',
            
            // Movimiento
            ArrowLeft: 'moveLeft',
            KeyA: 'moveLeft',
            ArrowRight: 'moveRight',
            KeyD: 'moveRight',
            
            // Pausa
            Escape: 'pause',
            KeyP: 'pause'
        };
        
        // Aplicar configuración personalizada
        if (config.jump) {
            config.jump.forEach(key => this.keyMap[key] = 'jump');
        }
        if (config.dash) {
            config.dash.forEach(key => this.keyMap[key] = 'dash');
        }
        if (config.gravityToggle) {
            config.gravityToggle.forEach(key => this.keyMap[key] = 'gravityToggle');
        }
        if (config.moveLeft) {
            config.moveLeft.forEach(key => this.keyMap[key] = 'moveLeft');
        }
        if (config.moveRight) {
            config.moveRight.forEach(key => this.keyMap[key] = 'moveRight');
        }
        if (config.pause) {
            config.pause.forEach(key => this.keyMap[key] = 'pause');
        }
        
        // Estado de las teclas
        this.keyState = {};
        this.previousKeyState = {};
        
        // Teclas que requieren preventDefault
        this.preventDefaultKeys = new Set(deviceConfig.preventDefaults || []);
        
        // Handlers de eventos (bound para poder removerlos)
        this.boundHandlers = {
            keyDown: this.handleKeyDown.bind(this),
            keyUp: this.handleKeyUp.bind(this),
            blur: this.handleBlur.bind(this),
            focus: this.handleFocus.bind(this)
        };
        
        // Estado de focus
        this.hasFocus = true;
        
        console.log('⌨️ KeyboardHandler creado');
    }
    
    /**
     * Inicializa el manejador de teclado
     */
    async init() {
        try {
            console.log('🔧 Inicializando KeyboardHandler...');
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Configurar detección de focus
            this.setupFocusDetection();
            
            this.isInitialized = true;
            console.log('✅ KeyboardHandler inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando KeyboardHandler:', error);
            throw error;
        }
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        document.addEventListener('keydown', this.boundHandlers.keyDown, { passive: false });
        document.addEventListener('keyup', this.boundHandlers.keyUp, { passive: false });
        
        console.log('👂 Event listeners de teclado configurados');
    }
    
    /**
     * Configura la detección de focus
     */
    setupFocusDetection() {
        window.addEventListener('blur', this.boundHandlers.blur);
        window.addEventListener('focus', this.boundHandlers.focus);
        
        // Detectar cuando la ventana pierde focus
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handleBlur();
            } else {
                this.handleFocus();
            }
        });
    }
    
    /**
     * Maneja eventos de keydown
     * @param {KeyboardEvent} event - Evento de teclado
     */
    handleKeyDown(event) {
        if (!this.isEnabled || !this.isInitialized) return;
        
        const key = event.code;
        const action = this.keyMap[key];
        
        // Prevenir comportamiento por defecto si es necesario
        if (this.preventDefaultKeys.has(key) || action) {
            event.preventDefault();
        }
        
        // Ignorar repeticiones de tecla
        if (event.repeat) return;
        
        // Actualizar estado de la tecla
        this.keyState[key] = true;
        
        // Emitir evento si hay una acción mapeada
        if (action) {
            this.emitInputEvent(action, true, key);
            
            // Notificar que se usó el teclado
            this.eventBus.emit('input:keyboard-used', { key, action });
        }
        
        // Emitir evento raw de teclado
        this.eventBus.emit('input:raw-keyboard-key', {
            key,
            action,
            pressed: true,
            event: {
                code: event.code,
                key: event.key,
                altKey: event.altKey,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
                metaKey: event.metaKey
            }
        });
    }
    
    /**
     * Maneja eventos de keyup
     * @param {KeyboardEvent} event - Evento de teclado
     */
    handleKeyUp(event) {
        if (!this.isEnabled || !this.isInitialized) return;
        
        const key = event.code;
        const action = this.keyMap[key];
        
        // Prevenir comportamiento por defecto si es necesario
        if (this.preventDefaultKeys.has(key) || action) {
            event.preventDefault();
        }
        
        // Actualizar estado de la tecla
        this.keyState[key] = false;
        
        // Emitir evento si hay una acción mapeada
        if (action) {
            this.emitInputEvent(action, false, key);
        }
        
        // Emitir evento raw de teclado
        this.eventBus.emit('input:raw-keyboard-key', {
            key,
            action,
            pressed: false,
            event: {
                code: event.code,
                key: event.key,
                altKey: event.altKey,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
                metaKey: event.metaKey
            }
        });
    }
    
    /**
     * Maneja pérdida de focus
     */
    handleBlur() {
        this.hasFocus = false;
        
        // Liberar todas las teclas cuando se pierde el focus
        this.releaseAllKeys();
        
        console.log('⌨️ Teclado perdió focus - liberando todas las teclas');
    }
    
    /**
     * Maneja recuperación de focus
     */
    handleFocus() {
        this.hasFocus = true;
        console.log('⌨️ Teclado recuperó focus');
    }
    
    /**
     * Libera todas las teclas presionadas
     */
    releaseAllKeys() {
        for (const key in this.keyState) {
            if (this.keyState[key]) {
                this.keyState[key] = false;
                
                const action = this.keyMap[key];
                if (action) {
                    this.emitInputEvent(action, false, key);
                }
            }
        }
    }
    
    /**
     * Emite un evento de input
     * @param {string} action - Acción del input
     * @param {boolean} pressed - Si está presionado
     * @param {string} key - Tecla presionada
     */
    emitInputEvent(action, pressed, key) {
        this.eventBus.emit('input:raw-keyboard', {
            action,
            pressed,
            device: 'keyboard',
            key,
            timestamp: Date.now()
        });
    }
    
    /**
     * Actualiza el manejador de teclado
     * @param {number} deltaTime - Delta time
     */
    update(deltaTime) {
        if (!this.isInitialized || !this.isEnabled) return;
        
        // Actualizar estado anterior
        this.previousKeyState = { ...this.keyState };
        
        // Verificar si perdimos focus sin detectarlo
        if (!this.hasFocus && document.hasFocus()) {
            this.handleFocus();
        } else if (this.hasFocus && !document.hasFocus()) {
            this.handleBlur();
        }
    }
    
    /**
     * Verifica si una tecla está presionada
     * @param {string} key - Código de la tecla
     * @returns {boolean} True si está presionada
     */
    isKeyPressed(key) {
        return this.keyState[key] || false;
    }
    
    /**
     * Verifica si una acción está presionada
     * @param {string} action - Acción a verificar
     * @returns {boolean} True si está presionada
     */
    isActionPressed(action) {
        for (const key in this.keyMap) {
            if (this.keyMap[key] === action && this.keyState[key]) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Verifica si una tecla fue presionada este frame
     * @param {string} key - Código de la tecla
     * @returns {boolean} True si fue presionada este frame
     */
    wasKeyPressed(key) {
        return this.keyState[key] && !this.previousKeyState[key];
    }
    
    /**
     * Verifica si una tecla fue liberada este frame
     * @param {string} key - Código de la tecla
     * @returns {boolean} True si fue liberada este frame
     */
    wasKeyReleased(key) {
        return !this.keyState[key] && this.previousKeyState[key];
    }
    
    /**
     * Obtiene todas las teclas presionadas actualmente
     * @returns {Array<string>} Array de códigos de teclas presionadas
     */
    getPressedKeys() {
        return Object.keys(this.keyState).filter(key => this.keyState[key]);
    }
    
    /**
     * Obtiene todas las acciones presionadas actualmente
     * @returns {Array<string>} Array de acciones presionadas
     */
    getPressedActions() {
        const actions = new Set();
        for (const key in this.keyState) {
            if (this.keyState[key] && this.keyMap[key]) {
                actions.add(this.keyMap[key]);
            }
        }
        return Array.from(actions);
    }
    
    /**
     * Actualiza el mapeo de teclas
     * @param {Object} newKeyMap - Nuevo mapeo de teclas
     */
    updateKeyMap(newKeyMap) {
        this.keyMap = { ...this.keyMap, ...newKeyMap };
        console.log('⌨️ Mapeo de teclas actualizado');
        
        // Emitir evento de cambio
        this.eventBus.emit('input:keymap-changed', {
            device: 'keyboard',
            keyMap: this.keyMap
        });
    }
    
    /**
     * Habilita el manejador de teclado
     */
    enable() {
        this.isEnabled = true;
        console.log('✅ KeyboardHandler habilitado');
    }
    
    /**
     * Deshabilita el manejador de teclado
     */
    disable() {
        this.isEnabled = false;
        this.releaseAllKeys();
        console.log('🚫 KeyboardHandler deshabilitado');
    }
    
    /**
     * Obtiene información de debug
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            isEnabled: this.isEnabled,
            isInitialized: this.isInitialized,
            hasFocus: this.hasFocus,
            keyState: { ...this.keyState },
            keyMap: { ...this.keyMap },
            pressedKeys: this.getPressedKeys(),
            pressedActions: this.getPressedActions(),
            preventDefaultKeys: Array.from(this.preventDefaultKeys)
        };
    }
    
    /**
     * Obtiene el estado actual del teclado
     * @returns {Object} Estado del teclado
     */
    getState() {
        return {
            isEnabled: this.isEnabled,
            hasFocus: this.hasFocus,
            pressedKeys: this.getPressedKeys(),
            pressedActions: this.getPressedActions()
        };
    }
    
    /**
     * Limpia recursos del manejador de teclado
     */
    destroy() {
        console.log('🧹 Destruyendo KeyboardHandler...');
        
        // Remover event listeners
        document.removeEventListener('keydown', this.boundHandlers.keyDown);
        document.removeEventListener('keyup', this.boundHandlers.keyUp);
        window.removeEventListener('blur', this.boundHandlers.blur);
        window.removeEventListener('focus', this.boundHandlers.focus);
        
        // Liberar todas las teclas
        this.releaseAllKeys();
        
        // Limpiar estado
        this.keyState = {};
        this.previousKeyState = {};
        
        this.isInitialized = false;
        
        console.log('✅ KeyboardHandler destruido');
    }
}