/**
 * Gestor de pantallas para Spikepulse
 * @module ScreenManager
 */

export class ScreenManager {
    /**
     * Crea una nueva instancia del gestor de pantallas
     * @param {Object} config - Configuración del gestor
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isInitialized = false;
        
        // Configuración del gestor
        this.screenConfig = {
            enableTransitions: config.enableTransitions !== false,
            transitionDuration: config.transitionDuration || 300,
            defaultScreen: config.defaultScreen || 'menu',
            enableHistory: config.enableHistory !== false,
            maxHistorySize: config.maxHistorySize || 10
        };
        
        // Estado del gestor
        this.screens = new Map();
        this.currentScreen = null;
        this.previousScreen = null;
        this.isTransitioning = false;
        this.screenHistory = [];
        
        // Contenedor de pantallas
        this.container = null;
        
        // Estadísticas
        this.stats = {
            screensRegistered: 0,
            transitionsCompleted: 0,
            totalShowTime: 0,
            averageTransitionTime: 0
        };
        
        console.log('📺 ScreenManager creado');
    }
    
    /**
     * Inicializa el gestor de pantallas
     */
    async init() {
        try {
            console.log('🔧 Inicializando ScreenManager...');
            
            // Configurar event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ ScreenManager inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando ScreenManager:', error);
            throw error;
        }
    }
    
    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Eventos de pantallas
        this.eventBus.on('screen:show', this.showScreen.bind(this));
        this.eventBus.on('screen:hide', this.hideScreen.bind(this));
        this.eventBus.on('screen:toggle', this.toggleScreen.bind(this));
        this.eventBus.on('screen:back', this.goBack.bind(this));
        this.eventBus.on('screen:register', this.registerScreen.bind(this));
        this.eventBus.on('screen:unregister', this.unregisterScreen.bind(this));
        
        // Eventos del juego
        this.eventBus.on('game:state-changed', this.handleGameStateChange.bind(this));
        
        console.log('👂 Event listeners del ScreenManager configurados');
    }
    
    /**
     * Establece el contenedor de pantallas
     * @param {HTMLElement} container - Contenedor
     */
    setContainer(container) {
        this.container = container;
        console.log('📦 Contenedor de pantallas establecido');
    }
    
    /**
     * Registra una nueva pantalla
     * @param {Object} data - Datos de la pantalla
     */
    registerScreen(data) {
        const { name, element, config = {} } = data;
        
        if (this.screens.has(name)) {
            console.warn(`⚠️ Pantalla ya registrada: ${name}`);
            return;
        }
        
        const screenData = {
            name,
            element,
            config: {
                persistent: config.persistent || false,
                modal: config.modal || false,
                closable: config.closable !== false,
                showInHistory: config.showInHistory !== false,
                transitionType: config.transitionType || 'fade',
                ...config
            },
            isVisible: false,
            showTime: 0,
            lastShown: null
        };
        
        // Configurar elemento
        if (element) {
            element.style.display = 'none';
            element.classList.add('screen', `screen-${name}`);
            
            if (screenData.config.modal) {
                element.classList.add('screen-modal');
            }
            
            // Añadir al contenedor si existe
            if (this.container && !this.container.contains(element)) {
                this.container.appendChild(element);
            }
        }
        
        this.screens.set(name, screenData);
        this.stats.screensRegistered++;
        
        console.log(`📄 Pantalla registrada: ${name}`);
        
        // Emitir evento
        this.eventBus.emit('screen:registered', { name, config: screenData.config });
    }
    
    /**
     * Desregistra una pantalla
     * @param {Object} data - Datos de la pantalla
     */
    unregisterScreen(data) {
        const name = typeof data === 'string' ? data : data.name;
        
        if (!this.screens.has(name)) {
            console.warn(`⚠️ Pantalla no encontrada: ${name}`);
            return;
        }
        
        const screenData = this.screens.get(name);
        
        // Ocultar si está visible
        if (screenData.isVisible) {
            this.hideScreen({ name, immediate: true });
        }
        
        // Remover del DOM si no es persistente
        if (!screenData.config.persistent && screenData.element && screenData.element.parentNode) {
            screenData.element.parentNode.removeChild(screenData.element);
        }
        
        // Remover del historial
        this.screenHistory = this.screenHistory.filter(entry => entry.name !== name);
        
        this.screens.delete(name);
        
        console.log(`🗑️ Pantalla desregistrada: ${name}`);
        
        // Emitir evento
        this.eventBus.emit('screen:unregistered', { name });
    }
    
    /**
     * Muestra una pantalla
     * @param {Object} data - Datos de la pantalla
     */
    async showScreen(data) {
        const name = typeof data === 'string' ? data : data.name;
        const options = typeof data === 'object' ? data : {};
        
        if (!this.screens.has(name)) {
            console.warn(`⚠️ Pantalla no encontrada: ${name}`);
            return false;
        }
        
        if (this.isTransitioning && !options.force) {
            console.warn('⚠️ Transición en progreso, ignorando cambio de pantalla');
            return false;
        }
        
        const screenData = this.screens.get(name);
        
        // Si ya está visible, no hacer nada
        if (screenData.isVisible && this.currentScreen === name) {
            return true;
        }
        
        this.isTransitioning = true;
        const transitionStart = performance.now();
        
        try {
            // Ocultar pantalla actual si existe
            if (this.currentScreen && this.currentScreen !== name) {
                const currentScreenData = this.screens.get(this.currentScreen);
                if (currentScreenData && !currentScreenData.config.modal) {
                    await this.hideScreenElement(currentScreenData, options);
                }
                this.previousScreen = this.currentScreen;
            }
            
            // Mostrar nueva pantalla
            await this.showScreenElement(screenData, options);
            
            // Actualizar estado
            this.currentScreen = name;
            screenData.isVisible = true;
            screenData.lastShown = Date.now();
            
            // Añadir al historial
            if (screenData.config.showInHistory && this.screenConfig.enableHistory) {
                this.addToHistory(name);
            }
            
            // Actualizar estadísticas
            const transitionTime = performance.now() - transitionStart;
            this.stats.transitionsCompleted++;
            this.stats.averageTransitionTime = 
                (this.stats.averageTransitionTime * (this.stats.transitionsCompleted - 1) + transitionTime) / 
                this.stats.transitionsCompleted;
            
            console.log(`📺 Pantalla mostrada: ${name} (${transitionTime.toFixed(2)}ms)`);
            
            // Emitir evento
            this.eventBus.emit('screen:shown', {
                name,
                previous: this.previousScreen,
                transitionTime
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Error mostrando pantalla:', error);
            return false;
        } finally {
            this.isTransitioning = false;
        }
    }
    
    /**
     * Oculta una pantalla
     * @param {Object} data - Datos de la pantalla
     */
    async hideScreen(data) {
        const name = typeof data === 'string' ? data : data.name || this.currentScreen;
        const options = typeof data === 'object' ? data : {};
        
        if (!name || !this.screens.has(name)) {
            console.warn(`⚠️ Pantalla no encontrada: ${name}`);
            return false;
        }
        
        const screenData = this.screens.get(name);
        
        if (!screenData.isVisible) {
            return true;
        }
        
        try {
            await this.hideScreenElement(screenData, options);
            
            // Actualizar estado
            screenData.isVisible = false;
            
            if (this.currentScreen === name) {
                this.currentScreen = null;
            }
            
            // Actualizar tiempo de visualización
            if (screenData.lastShown) {
                const showTime = Date.now() - screenData.lastShown;
                screenData.showTime += showTime;
                this.stats.totalShowTime += showTime;
            }
            
            console.log(`📺 Pantalla ocultada: ${name}`);
            
            // Emitir evento
            this.eventBus.emit('screen:hidden', { name });
            
            return true;
            
        } catch (error) {
            console.error('❌ Error ocultando pantalla:', error);
            return false;
        }
    }
    
    /**
     * Muestra un elemento de pantalla
     * @param {Object} screenData - Datos de la pantalla
     * @param {Object} options - Opciones
     */
    async showScreenElement(screenData, options) {
        const element = screenData.element;
        if (!element) return;
        
        // Mostrar elemento
        element.style.display = 'flex';
        
        // Aplicar transición si está habilitada
        if (this.screenConfig.enableTransitions && !options.immediate) {
            const transitionClass = `screen-enter-${screenData.config.transitionType}`;
            element.classList.add('screen-enter', transitionClass);
            
            await this.waitForTransition(element);
            
            element.classList.remove('screen-enter', transitionClass);
        }
        
        // Focus management para accesibilidad
        const focusableElement = element.querySelector('[autofocus], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElement) {
            focusableElement.focus();
        }
    }
    
    /**
     * Oculta un elemento de pantalla
     * @param {Object} screenData - Datos de la pantalla
     * @param {Object} options - Opciones
     */
    async hideScreenElement(screenData, options) {
        const element = screenData.element;
        if (!element) return;
        
        // Aplicar transición si está habilitada
        if (this.screenConfig.enableTransitions && !options.immediate) {
            const transitionClass = `screen-exit-${screenData.config.transitionType}`;
            element.classList.add('screen-exit', transitionClass);
            
            await this.waitForTransition(element);
            
            element.classList.remove('screen-exit', transitionClass);
        }
        
        // Ocultar elemento
        element.style.display = 'none';
    }
    
    /**
     * Alterna la visibilidad de una pantalla
     * @param {Object} data - Datos de la pantalla
     */
    async toggleScreen(data) {
        const name = typeof data === 'string' ? data : data.name;
        
        if (!this.screens.has(name)) {
            console.warn(`⚠️ Pantalla no encontrada: ${name}`);
            return;
        }
        
        const screenData = this.screens.get(name);
        
        if (screenData.isVisible) {
            await this.hideScreen(data);
        } else {
            await this.showScreen(data);
        }
    }
    
    /**
     * Vuelve a la pantalla anterior
     * @param {Object} data - Datos opcionales
     */
    async goBack(data) {
        if (this.screenHistory.length === 0) {
            console.warn('⚠️ No hay historial de pantallas');
            return;
        }
        
        // Remover entrada actual del historial
        if (this.currentScreen) {
            const currentIndex = this.screenHistory.findIndex(entry => entry.name === this.currentScreen);
            if (currentIndex !== -1) {
                this.screenHistory.splice(currentIndex, 1);
            }
        }
        
        // Obtener pantalla anterior
        const previousEntry = this.screenHistory.pop();
        if (previousEntry) {
            await this.showScreen({
                name: previousEntry.name,
                ...data
            });
        }
    }
    
    /**
     * Añade una pantalla al historial
     * @param {string} name - Nombre de la pantalla
     */
    addToHistory(name) {
        // Remover entradas duplicadas
        this.screenHistory = this.screenHistory.filter(entry => entry.name !== name);
        
        // Añadir nueva entrada
        this.screenHistory.push({
            name,
            timestamp: Date.now()
        });
        
        // Limitar tamaño del historial
        if (this.screenHistory.length > this.screenConfig.maxHistorySize) {
            this.screenHistory.shift();
        }
    }
    
    /**
     * Espera a que termine una transición
     * @param {HTMLElement} element - Elemento con transición
     * @returns {Promise} Promesa que se resuelve cuando termina
     */
    waitForTransition(element) {
        return new Promise(resolve => {
            const handleTransitionEnd = () => {
                element.removeEventListener('transitionend', handleTransitionEnd);
                element.removeEventListener('animationend', handleTransitionEnd);
                resolve();
            };
            
            element.addEventListener('transitionend', handleTransitionEnd);
            element.addEventListener('animationend', handleTransitionEnd);
            
            // Timeout de seguridad
            setTimeout(resolve, this.screenConfig.transitionDuration + 100);
        });
    }
    
    // ===== MANEJO DE EVENTOS =====
    
    /**
     * Maneja cambios de estado del juego
     * @param {Object} data - Datos del estado
     */
    handleGameStateChange(data) {
        const state = data.state || data;
        
        // Mapeo de estados a pantallas
        const stateScreenMap = {
            'menu': 'menu',
            'playing': null, // Ocultar todas las pantallas
            'paused': 'pause',
            'game-over': 'game-over',
            'loading': 'loading'
        };
        
        const targetScreen = stateScreenMap[state];
        
        if (targetScreen) {
            this.showScreen(targetScreen);
        } else if (targetScreen === null) {
            // Ocultar pantalla actual
            if (this.currentScreen) {
                this.hideScreen(this.currentScreen);
            }
        }
    }
    
    // ===== MÉTODOS PÚBLICOS =====
    
    /**
     * Obtiene información de una pantalla
     * @param {string} name - Nombre de la pantalla
     * @returns {Object|null} Información de la pantalla
     */
    getScreenInfo(name) {
        const screenData = this.screens.get(name);
        if (!screenData) return null;
        
        return {
            name: screenData.name,
            isVisible: screenData.isVisible,
            config: { ...screenData.config },
            showTime: screenData.showTime,
            lastShown: screenData.lastShown
        };
    }
    
    /**
     * Obtiene la pantalla actual
     * @returns {string|null} Nombre de la pantalla actual
     */
    getCurrentScreen() {
        return this.currentScreen;
    }
    
    /**
     * Obtiene la pantalla anterior
     * @returns {string|null} Nombre de la pantalla anterior
     */
    getPreviousScreen() {
        return this.previousScreen;
    }
    
    /**
     * Obtiene el historial de pantallas
     * @returns {Array} Historial de pantallas
     */
    getScreenHistory() {
        return [...this.screenHistory];
    }
    
    /**
     * Verifica si una pantalla está visible
     * @param {string} name - Nombre de la pantalla
     * @returns {boolean} True si está visible
     */
    isScreenVisible(name) {
        const screenData = this.screens.get(name);
        return screenData ? screenData.isVisible : false;
    }
    
    /**
     * Obtiene todas las pantallas registradas
     * @returns {Array} Lista de pantallas
     */
    getRegisteredScreens() {
        return Array.from(this.screens.keys());
    }
    
    /**
     * Obtiene estadísticas del gestor
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            ...this.stats,
            currentScreen: this.currentScreen,
            previousScreen: this.previousScreen,
            isTransitioning: this.isTransitioning,
            historySize: this.screenHistory.length,
            registeredScreens: this.screens.size
        };
    }
    
    /**
     * Obtiene información de debug
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            config: { ...this.screenConfig },
            currentScreen: this.currentScreen,
            previousScreen: this.previousScreen,
            isTransitioning: this.isTransitioning,
            screenHistory: this.getScreenHistory(),
            stats: this.getStats(),
            screens: Object.fromEntries(
                Array.from(this.screens.entries()).map(([name, data]) => [
                    name,
                    {
                        isVisible: data.isVisible,
                        config: data.config,
                        showTime: data.showTime,
                        lastShown: data.lastShown
                    }
                ])
            )
        };
    }
    
    /**
     * Resetea el gestor de pantallas
     */
    reset() {
        console.log('🔄 Reseteando ScreenManager...');
        
        // Ocultar pantalla actual
        if (this.currentScreen) {
            this.hideScreen({ name: this.currentScreen, immediate: true });
        }
        
        // Limpiar historial
        this.screenHistory.length = 0;
        
        // Resetear estado
        this.currentScreen = null;
        this.previousScreen = null;
        this.isTransitioning = false;
        
        console.log('✅ ScreenManager reseteado');
    }
    
    /**
     * Limpia recursos del gestor de pantallas
     */
    destroy() {
        console.log('🧹 Destruyendo ScreenManager...');
        
        // Remover event listeners
        this.eventBus.off('*', this);
        
        // Ocultar y limpiar todas las pantallas
        for (const [name, screenData] of this.screens.entries()) {
            if (screenData.isVisible) {
                this.hideScreen({ name, immediate: true });
            }
            
            if (!screenData.config.persistent && screenData.element && screenData.element.parentNode) {
                screenData.element.parentNode.removeChild(screenData.element);
            }
        }
        
        // Limpiar mapas
        this.screens.clear();
        this.screenHistory.length = 0;
        
        // Limpiar referencias
        this.container = null;
        
        this.isInitialized = false;
        
        console.log('✅ ScreenManager destruido');
    }
}