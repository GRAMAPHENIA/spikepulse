/**
 * SettingsManager - Sistema de gestión de configuración de usuario
 * @module SettingsManager
 */

import { StorageManager } from './StorageManager.js';
import { SPANISH_TEXT } from '../config/SpanishText.js';

export class SettingsManager {
    /**
     * Crea una nueva instancia del SettingsManager
     * @param {StorageManager} storageManager - Instancia del StorageManager
     * @param {EventBus} eventBus - Instancia del EventBus para notificar cambios
     */
    constructor(storageManager, eventBus = null) {
        this.storage = storageManager || new StorageManager();
        this.eventBus = eventBus;
        
        // Configuración por defecto
        this.defaultSettings = {
            // Audio
            soundEnabled: true,
            musicEnabled: true,
            soundVolume: 0.7,
            musicVolume: 0.5,
            
            // Gráficos
            showFPS: false,
            showDebugInfo: false,
            enableParticles: true,
            enableScreenShake: true,
            graphicsQuality: 'high', // 'low', 'medium', 'high'
            
            // Controles
            controlScheme: 'default', // 'default', 'custom'
            keyBindings: {
                jump: ['Space', 'ArrowUp', 'KeyW'],
                dash: ['ShiftLeft', 'ShiftRight'],
                gravity: ['ControlLeft', 'ControlRight'],
                moveLeft: ['ArrowLeft', 'KeyA'],
                moveRight: ['ArrowRight', 'KeyD'],
                pause: ['Escape', 'KeyP']
            },
            touchSensitivity: 1.0,
            
            // Accesibilidad
            highContrast: false,
            reducedMotion: false,
            screenReaderSupport: false,
            colorBlindSupport: 'none', // 'none', 'protanopia', 'deuteranopia', 'tritanopia'
            fontSize: 'normal', // 'small', 'normal', 'large'
            
            // Juego
            difficulty: 'normal', // 'easy', 'normal', 'hard'
            autoSave: true,
            vibrationEnabled: true,
            showTutorial: true,
            
            // Interfaz
            language: 'es',
            theme: 'dark', // 'dark', 'light', 'auto'
            showHints: true,
            animationSpeed: 1.0,
            
            // Privacidad
            analytics: false,
            crashReporting: true,
            
            // Avanzado
            maxFPS: 60,
            vsync: true,
            hardwareAcceleration: true
        };
        
        this.currentSettings = {};
        this.settingsValidators = {};
        this.settingsWatchers = new Map();
        
        this.init();
    }

    /**
     * Inicializar el sistema de configuración
     * @private
     */
    init() {
        // Cargar configuración guardada o usar valores por defecto
        this.loadSettings();
        
        // Configurar validadores
        this.setupValidators();
        
        // Aplicar configuración inicial
        this.applySettings();
        
        console.log('[SettingsManager] Sistema de configuración inicializado');
    }

    /**
     * Cargar configuración desde el almacenamiento
     * @private
     */
    loadSettings() {
        const savedSettings = this.storage.get('settings', {});
        
        // Combinar configuración por defecto con la guardada
        this.currentSettings = { ...this.defaultSettings, ...savedSettings };
        
        // Asegurar que todas las claves por defecto existen
        Object.keys(this.defaultSettings).forEach(key => {
            if (!(key in this.currentSettings)) {
                this.currentSettings[key] = this.defaultSettings[key];
            }
        });
        
        console.log('[SettingsManager] Configuración cargada');
    }

    /**
     * Configurar validadores para las configuraciones
     * @private
     */
    setupValidators() {
        // Validadores de audio
        this.settingsValidators.soundVolume = (value) => {
            return typeof value === 'number' && value >= 0 && value <= 1;
        };
        
        this.settingsValidators.musicVolume = (value) => {
            return typeof value === 'number' && value >= 0 && value <= 1;
        };
        
        // Validadores de gráficos
        this.settingsValidators.graphicsQuality = (value) => {
            return ['low', 'medium', 'high'].includes(value);
        };
        
        // Validadores de controles
        this.settingsValidators.touchSensitivity = (value) => {
            return typeof value === 'number' && value >= 0.1 && value <= 3.0;
        };
        
        // Validadores de accesibilidad
        this.settingsValidators.colorBlindSupport = (value) => {
            return ['none', 'protanopia', 'deuteranopia', 'tritanopia'].includes(value);
        };
        
        this.settingsValidators.fontSize = (value) => {
            return ['small', 'normal', 'large'].includes(value);
        };
        
        // Validadores de juego
        this.settingsValidators.difficulty = (value) => {
            return ['easy', 'normal', 'hard'].includes(value);
        };
        
        // Validadores de interfaz
        this.settingsValidators.theme = (value) => {
            return ['dark', 'light', 'auto'].includes(value);
        };
        
        this.settingsValidators.animationSpeed = (value) => {
            return typeof value === 'number' && value >= 0.1 && value <= 3.0;
        };
        
        // Validadores avanzados
        this.settingsValidators.maxFPS = (value) => {
            return typeof value === 'number' && value >= 30 && value <= 144;
        };
    }

    /**
     * Obtener valor de configuración
     * @param {string} key - Clave de la configuración
     * @param {*} defaultValue - Valor por defecto si no existe
     * @returns {*} Valor de la configuración
     */
    get(key, defaultValue = null) {
        // Soporte para claves anidadas (ej: 'keyBindings.jump')
        const keys = key.split('.');
        let value = this.currentSettings;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return defaultValue !== null ? defaultValue : this.getDefaultValue(key);
            }
        }
        
        return value;
    }

    /**
     * Establecer valor de configuración
     * @param {string} key - Clave de la configuración
     * @param {*} value - Nuevo valor
     * @returns {boolean} True si se estableció correctamente
     */
    set(key, value) {
        try {
            // Validar el valor si existe un validador
            if (this.settingsValidators[key] && !this.settingsValidators[key](value)) {
                console.warn(`[SettingsManager] Valor inválido para "${key}":`, value);
                return false;
            }

            const oldValue = this.get(key);
            
            // Establecer el valor (soporte para claves anidadas)
            const keys = key.split('.');
            let target = this.currentSettings;
            
            for (let i = 0; i < keys.length - 1; i++) {
                const k = keys[i];
                if (!(k in target) || typeof target[k] !== 'object') {
                    target[k] = {};
                }
                target = target[k];
            }
            
            target[keys[keys.length - 1]] = value;
            
            // Guardar en almacenamiento
            const saveSuccess = this.storage.set('settings', this.currentSettings);
            
            if (saveSuccess) {
                // Notificar cambio
                this.notifySettingChanged(key, value, oldValue);
                
                // Aplicar el cambio inmediatamente
                this.applySingleSetting(key, value);
                
                console.log(`[SettingsManager] Configuración "${key}" actualizada:`, value);
                return true;
            } else {
                // Revertir cambio si no se pudo guardar
                target[keys[keys.length - 1]] = oldValue;
                return false;
            }
        } catch (error) {
            console.error(`[SettingsManager] Error estableciendo "${key}":`, error);
            return false;
        }
    }

    /**
     * Obtener valor por defecto para una clave
     * @param {string} key - Clave de la configuración
     * @returns {*} Valor por defecto
     * @private
     */
    getDefaultValue(key) {
        const keys = key.split('.');
        let value = this.defaultSettings;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }
        
        return value;
    }

    /**
     * Restablecer configuración a valores por defecto
     * @param {string|null} key - Clave específica o null para todas
     * @returns {boolean} True si se restableció correctamente
     */
    reset(key = null) {
        try {
            if (key) {
                // Restablecer configuración específica
                const defaultValue = this.getDefaultValue(key);
                if (defaultValue !== null) {
                    return this.set(key, defaultValue);
                }
                return false;
            } else {
                // Restablecer toda la configuración
                this.currentSettings = { ...this.defaultSettings };
                const saveSuccess = this.storage.set('settings', this.currentSettings);
                
                if (saveSuccess) {
                    this.applySettings();
                    this.notifyAllSettingsChanged();
                    console.log('[SettingsManager] Configuración restablecida a valores por defecto');
                }
                
                return saveSuccess;
            }
        } catch (error) {
            console.error('[SettingsManager] Error restableciendo configuración:', error);
            return false;
        }
    }

    /**
     * Aplicar toda la configuración
     * @private
     */
    applySettings() {
        Object.keys(this.currentSettings).forEach(key => {
            this.applySingleSetting(key, this.currentSettings[key]);
        });
    }

    /**
     * Aplicar una configuración específica
     * @param {string} key - Clave de la configuración
     * @param {*} value - Valor de la configuración
     * @private
     */
    applySingleSetting(key, value) {
        try {
            switch (key) {
                case 'theme':
                    this.applyTheme(value);
                    break;
                case 'fontSize':
                    this.applyFontSize(value);
                    break;
                case 'highContrast':
                    this.applyHighContrast(value);
                    break;
                case 'reducedMotion':
                    this.applyReducedMotion(value);
                    break;
                case 'colorBlindSupport':
                    this.applyColorBlindSupport(value);
                    break;
                case 'animationSpeed':
                    this.applyAnimationSpeed(value);
                    break;
                case 'language':
                    this.applyLanguage(value);
                    break;
                // Agregar más casos según sea necesario
            }
        } catch (error) {
            console.error(`[SettingsManager] Error aplicando configuración "${key}":`, error);
        }
    }

    /**
     * Aplicar tema
     * @param {string} theme - Tema a aplicar
     * @private
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        if (theme === 'auto') {
            // Detectar preferencia del sistema
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    }

    /**
     * Aplicar tamaño de fuente
     * @param {string} fontSize - Tamaño de fuente
     * @private
     */
    applyFontSize(fontSize) {
        const fontSizeMap = {
            small: '14px',
            normal: '16px',
            large: '18px'
        };
        
        document.documentElement.style.fontSize = fontSizeMap[fontSize] || fontSizeMap.normal;
    }

    /**
     * Aplicar alto contraste
     * @param {boolean} enabled - Si está habilitado
     * @private
     */
    applyHighContrast(enabled) {
        document.documentElement.classList.toggle('high-contrast', enabled);
    }

    /**
     * Aplicar movimiento reducido
     * @param {boolean} enabled - Si está habilitado
     * @private
     */
    applyReducedMotion(enabled) {
        document.documentElement.classList.toggle('reduced-motion', enabled);
    }

    /**
     * Aplicar soporte para daltonismo
     * @param {string} type - Tipo de daltonismo
     * @private
     */
    applyColorBlindSupport(type) {
        // Remover clases anteriores
        document.documentElement.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
        
        if (type !== 'none') {
            document.documentElement.classList.add(type);
        }
    }

    /**
     * Aplicar velocidad de animación
     * @param {number} speed - Velocidad de animación
     * @private
     */
    applyAnimationSpeed(speed) {
        document.documentElement.style.setProperty('--animation-speed', speed.toString());
    }

    /**
     * Aplicar idioma
     * @param {string} language - Código de idioma
     * @private
     */
    applyLanguage(language) {
        document.documentElement.setAttribute('lang', language);
    }

    /**
     * Observar cambios en una configuración
     * @param {string} key - Clave a observar
     * @param {Function} callback - Función a llamar cuando cambie
     */
    watch(key, callback) {
        if (!this.settingsWatchers.has(key)) {
            this.settingsWatchers.set(key, []);
        }
        
        this.settingsWatchers.get(key).push(callback);
    }

    /**
     * Dejar de observar cambios en una configuración
     * @param {string} key - Clave a dejar de observar
     * @param {Function} callback - Función específica a remover (opcional)
     */
    unwatch(key, callback = null) {
        if (!this.settingsWatchers.has(key)) return;
        
        if (callback) {
            const watchers = this.settingsWatchers.get(key);
            const index = watchers.indexOf(callback);
            if (index > -1) {
                watchers.splice(index, 1);
            }
        } else {
            this.settingsWatchers.delete(key);
        }
    }

    /**
     * Notificar cambio en configuración
     * @param {string} key - Clave que cambió
     * @param {*} newValue - Nuevo valor
     * @param {*} oldValue - Valor anterior
     * @private
     */
    notifySettingChanged(key, newValue, oldValue) {
        // Notificar a watchers específicos
        if (this.settingsWatchers.has(key)) {
            this.settingsWatchers.get(key).forEach(callback => {
                try {
                    callback(newValue, oldValue, key);
                } catch (error) {
                    console.error(`[SettingsManager] Error en watcher para "${key}":`, error);
                }
            });
        }
        
        // Notificar a través del EventBus si está disponible
        if (this.eventBus) {
            this.eventBus.emit('settings:changed', {
                key,
                newValue,
                oldValue
            });
        }
    }

    /**
     * Notificar que todas las configuraciones cambiaron
     * @private
     */
    notifyAllSettingsChanged() {
        if (this.eventBus) {
            this.eventBus.emit('settings:reset', {
                settings: this.currentSettings
            });
        }
    }

    /**
     * Obtener toda la configuración
     * @returns {Object} Configuración completa
     */
    getAll() {
        return { ...this.currentSettings };
    }

    /**
     * Establecer múltiples configuraciones
     * @param {Object} settings - Objeto con configuraciones
     * @returns {boolean} True si se establecieron correctamente
     */
    setMultiple(settings) {
        try {
            let allSuccess = true;
            const changes = [];
            
            Object.keys(settings).forEach(key => {
                const success = this.set(key, settings[key]);
                if (success) {
                    changes.push(key);
                } else {
                    allSuccess = false;
                }
            });
            
            if (changes.length > 0) {
                console.log(`[SettingsManager] ${changes.length} configuraciones actualizadas:`, changes);
            }
            
            return allSuccess;
        } catch (error) {
            console.error('[SettingsManager] Error estableciendo múltiples configuraciones:', error);
            return false;
        }
    }

    /**
     * Exportar configuración
     * @returns {Object} Configuración exportada
     */
    export() {
        return {
            version: '1.0',
            exportDate: new Date().toISOString(),
            settings: this.getAll()
        };
    }

    /**
     * Importar configuración
     * @param {Object} importData - Datos a importar
     * @returns {boolean} True si se importó correctamente
     */
    import(importData) {
        try {
            if (!importData || !importData.settings) {
                throw new Error('Formato de datos inválido');
            }
            
            return this.setMultiple(importData.settings);
        } catch (error) {
            console.error('[SettingsManager] Error importando configuración:', error);
            return false;
        }
    }

    /**
     * Obtener configuraciones que difieren de los valores por defecto
     * @returns {Object} Configuraciones modificadas
     */
    getModifiedSettings() {
        const modified = {};
        
        Object.keys(this.currentSettings).forEach(key => {
            const currentValue = this.currentSettings[key];
            const defaultValue = this.defaultSettings[key];
            
            if (JSON.stringify(currentValue) !== JSON.stringify(defaultValue)) {
                modified[key] = currentValue;
            }
        });
        
        return modified;
    }

    /**
     * Verificar si hay configuraciones modificadas
     * @returns {boolean} True si hay configuraciones modificadas
     */
    hasModifiedSettings() {
        return Object.keys(this.getModifiedSettings()).length > 0;
    }
}