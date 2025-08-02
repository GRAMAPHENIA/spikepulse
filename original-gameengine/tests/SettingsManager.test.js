/**
 * Tests para SettingsManager
 * @module SettingsManagerTests
 */

import { testFramework, expect, createMock } from './TestFramework.js';
import { SettingsManager } from '../src/utils/SettingsManager.js';

// Mock de StorageManager para testing
class MockStorageManager {
    constructor() {
        this.data = {};
    }

    get(key, defaultValue = null) {
        return this.data[key] !== undefined ? this.data[key] : defaultValue;
    }

    set(key, value) {
        this.data[key] = value;
        return true;
    }

    remove(key) {
        delete this.data[key];
        return true;
    }
}

// Mock de EventBus para testing
class MockEventBus {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
}

testFramework.describe('SettingsManager', () => {
    let settingsManager;
    let mockStorage;
    let mockEventBus;

    function beforeEach() {
        mockStorage = new MockStorageManager();
        mockEventBus = new MockEventBus();
        settingsManager = new SettingsManager(mockStorage, mockEventBus);
    }

    function afterEach() {
        settingsManager = null;
        mockStorage = null;
        mockEventBus = null;
    }

    testFramework.test('debe inicializarse con configuración por defecto', () => {
        beforeEach();
        
        expect(settingsManager).toBeDefined();
        expect(settingsManager.storage).toBe(mockStorage);
        expect(settingsManager.eventBus).toBe(mockEventBus);
        
        // Verificar algunos valores por defecto
        expect(settingsManager.get('soundEnabled')).toBeTruthy();
        expect(settingsManager.get('musicEnabled')).toBeTruthy();
        expect(settingsManager.get('soundVolume')).toBe(0.7);
        expect(settingsManager.get('graphicsQuality')).toBe('high');
        expect(settingsManager.get('difficulty')).toBe('normal');
        
        afterEach();
    });

    testFramework.test('debe obtener y establecer configuraciones simples', () => {
        beforeEach();
        
        // Establecer configuración
        const success = settingsManager.set('soundEnabled', false);
        expect(success).toBeTruthy();
        
        // Obtener configuración
        const value = settingsManager.get('soundEnabled');
        expect(value).toBeFalsy();
        
        afterEach();
    });

    testFramework.test('debe manejar configuraciones anidadas', () => {
        beforeEach();
        
        // Establecer configuración anidada
        const success = settingsManager.set('keyBindings.jump', ['Space', 'KeyW']);
        expect(success).toBeTruthy();
        
        // Obtener configuración anidada
        const value = settingsManager.get('keyBindings.jump');
        expect(value).toEqual(['Space', 'KeyW']);
        
        afterEach();
    });

    testFramework.test('debe validar configuraciones con validadores', () => {
        beforeEach();
        
        // Configuración válida
        let success = settingsManager.set('soundVolume', 0.5);
        expect(success).toBeTruthy();
        expect(settingsManager.get('soundVolume')).toBe(0.5);
        
        // Configuración inválida (fuera de rango)
        success = settingsManager.set('soundVolume', 1.5);
        expect(success).toBeFalsy();
        expect(settingsManager.get('soundVolume')).toBe(0.5); // No debe cambiar
        
        // Configuración inválida (tipo incorrecto)
        success = settingsManager.set('soundVolume', 'invalid');
        expect(success).toBeFalsy();
        
        afterEach();
    });

    testFramework.test('debe validar calidad gráfica', () => {
        beforeEach();
        
        // Valores válidos
        expect(settingsManager.set('graphicsQuality', 'low')).toBeTruthy();
        expect(settingsManager.set('graphicsQuality', 'medium')).toBeTruthy();
        expect(settingsManager.set('graphicsQuality', 'high')).toBeTruthy();
        
        // Valor inválido
        expect(settingsManager.set('graphicsQuality', 'ultra')).toBeFalsy();
        
        afterEach();
    });

    testFramework.test('debe validar dificultad', () => {
        beforeEach();
        
        // Valores válidos
        expect(settingsManager.set('difficulty', 'easy')).toBeTruthy();
        expect(settingsManager.set('difficulty', 'normal')).toBeTruthy();
        expect(settingsManager.set('difficulty', 'hard')).toBeTruthy();
        
        // Valor inválido
        expect(settingsManager.set('difficulty', 'impossible')).toBeFalsy();
        
        afterEach();
    });

    testFramework.test('debe restablecer configuración específica', () => {
        beforeEach();
        
        // Cambiar configuración
        settingsManager.set('soundVolume', 0.3);
        expect(settingsManager.get('soundVolume')).toBe(0.3);
        
        // Restablecer configuración específica
        const success = settingsManager.reset('soundVolume');
        expect(success).toBeTruthy();
        expect(settingsManager.get('soundVolume')).toBe(0.7); // Valor por defecto
        
        afterEach();
    });

    testFramework.test('debe restablecer toda la configuración', () => {
        beforeEach();
        
        // Cambiar varias configuraciones
        settingsManager.set('soundEnabled', false);
        settingsManager.set('musicVolume', 0.2);
        settingsManager.set('graphicsQuality', 'low');
        
        // Verificar cambios
        expect(settingsManager.get('soundEnabled')).toBeFalsy();
        expect(settingsManager.get('musicVolume')).toBe(0.2);
        expect(settingsManager.get('graphicsQuality')).toBe('low');
        
        // Restablecer todo
        const success = settingsManager.reset();
        expect(success).toBeTruthy();
        
        // Verificar valores por defecto
        expect(settingsManager.get('soundEnabled')).toBeTruthy();
        expect(settingsManager.get('musicVolume')).toBe(0.5);
        expect(settingsManager.get('graphicsQuality')).toBe('high');
        
        afterEach();
    });

    testFramework.test('debe obtener toda la configuración', () => {
        beforeEach();
        
        const allSettings = settingsManager.getAll();
        
        expect(allSettings).toBeDefined();
        expect(typeof allSettings).toBe('object');
        expect(allSettings.soundEnabled).toBeTruthy();
        expect(allSettings.musicEnabled).toBeTruthy();
        expect(allSettings.graphicsQuality).toBe('high');
        
        afterEach();
    });

    testFramework.test('debe establecer múltiples configuraciones', () => {
        beforeEach();
        
        const newSettings = {
            soundEnabled: false,
            musicVolume: 0.3,
            graphicsQuality: 'medium'
        };
        
        const success = settingsManager.setMultiple(newSettings);
        expect(success).toBeTruthy();
        
        expect(settingsManager.get('soundEnabled')).toBeFalsy();
        expect(settingsManager.get('musicVolume')).toBe(0.3);
        expect(settingsManager.get('graphicsQuality')).toBe('medium');
        
        afterEach();
    });

    testFramework.test('debe exportar configuración', () => {
        beforeEach();
        
        // Cambiar algunas configuraciones
        settingsManager.set('soundVolume', 0.8);
        settingsManager.set('graphicsQuality', 'low');
        
        const exportData = settingsManager.export();
        
        expect(exportData).toBeDefined();
        expect(exportData.version).toBe('1.0');
        expect(exportData.exportDate).toBeDefined();
        expect(exportData.settings).toBeDefined();
        expect(exportData.settings.soundVolume).toBe(0.8);
        expect(exportData.settings.graphicsQuality).toBe('low');
        
        afterEach();
    });

    testFramework.test('debe importar configuración', () => {
        beforeEach();
        
        const importData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            settings: {
                soundEnabled: false,
                musicVolume: 0.2,
                graphicsQuality: 'medium'
            }
        };
        
        const success = settingsManager.import(importData);
        expect(success).toBeTruthy();
        
        expect(settingsManager.get('soundEnabled')).toBeFalsy();
        expect(settingsManager.get('musicVolume')).toBe(0.2);
        expect(settingsManager.get('graphicsQuality')).toBe('medium');
        
        afterEach();
    });

    testFramework.test('debe detectar configuraciones modificadas', () => {
        beforeEach();
        
        // Inicialmente no hay configuraciones modificadas
        expect(settingsManager.hasModifiedSettings()).toBeFalsy();
        
        // Cambiar una configuración
        settingsManager.set('soundVolume', 0.9);
        expect(settingsManager.hasModifiedSettings()).toBeTruthy();
        
        const modifiedSettings = settingsManager.getModifiedSettings();
        expect(modifiedSettings.soundVolume).toBe(0.9);
        expect(modifiedSettings.soundEnabled).toBeUndefined(); // No modificado
        
        afterEach();
    });

    testFramework.test('debe notificar cambios a través del EventBus', () => {
        beforeEach();
        
        let notificationReceived = false;
        let notificationData = null;
        
        // Escuchar eventos de cambio
        mockEventBus.on('settings:changed', (data) => {
            notificationReceived = true;
            notificationData = data;
        });
        
        // Cambiar configuración
        settingsManager.set('soundVolume', 0.4);
        
        expect(notificationReceived).toBeTruthy();
        expect(notificationData).toBeDefined();
        expect(notificationData.key).toBe('soundVolume');
        expect(notificationData.newValue).toBe(0.4);
        expect(notificationData.oldValue).toBe(0.7);
        
        afterEach();
    });

    testFramework.test('debe manejar watchers de configuración', () => {
        beforeEach();
        
        let watcherCalled = false;
        let watcherData = null;
        
        // Configurar watcher
        settingsManager.watch('soundVolume', (newValue, oldValue, key) => {
            watcherCalled = true;
            watcherData = { newValue, oldValue, key };
        });
        
        // Cambiar configuración
        settingsManager.set('soundVolume', 0.6);
        
        expect(watcherCalled).toBeTruthy();
        expect(watcherData.newValue).toBe(0.6);
        expect(watcherData.oldValue).toBe(0.7);
        expect(watcherData.key).toBe('soundVolume');
        
        afterEach();
    });

    testFramework.test('debe remover watchers correctamente', () => {
        beforeEach();
        
        let watcherCalled = false;
        
        const watcherCallback = () => {
            watcherCalled = true;
        };
        
        // Configurar y remover watcher
        settingsManager.watch('soundVolume', watcherCallback);
        settingsManager.unwatch('soundVolume', watcherCallback);
        
        // Cambiar configuración
        settingsManager.set('soundVolume', 0.6);
        
        expect(watcherCalled).toBeFalsy(); // No debe ser llamado
        
        afterEach();
    });

    testFramework.test('debe obtener valor por defecto para configuración inexistente', () => {
        beforeEach();
        
        const value = settingsManager.get('nonExistentSetting', 'default');
        expect(value).toBe('default');
        
        afterEach();
    });

    testFramework.test('debe manejar configuraciones con valores falsy', () => {
        beforeEach();
        
        // Establecer valores falsy válidos
        settingsManager.set('soundEnabled', false);
        settingsManager.set('soundVolume', 0);
        
        expect(settingsManager.get('soundEnabled')).toBeFalsy();
        expect(settingsManager.get('soundVolume')).toBe(0);
        
        afterEach();
    });

    testFramework.test('debe validar sensibilidad táctil', () => {
        beforeEach();
        
        // Valores válidos
        expect(settingsManager.set('touchSensitivity', 0.5)).toBeTruthy();
        expect(settingsManager.set('touchSensitivity', 1.0)).toBeTruthy();
        expect(settingsManager.set('touchSensitivity', 2.0)).toBeTruthy();
        
        // Valores inválidos
        expect(settingsManager.set('touchSensitivity', 0.05)).toBeFalsy(); // Muy bajo
        expect(settingsManager.set('touchSensitivity', 5.0)).toBeFalsy(); // Muy alto
        expect(settingsManager.set('touchSensitivity', 'invalid')).toBeFalsy(); // Tipo incorrecto
        
        afterEach();
    });

    testFramework.test('debe validar velocidad de animación', () => {
        beforeEach();
        
        // Valores válidos
        expect(settingsManager.set('animationSpeed', 0.5)).toBeTruthy();
        expect(settingsManager.set('animationSpeed', 1.0)).toBeTruthy();
        expect(settingsManager.set('animationSpeed', 2.0)).toBeTruthy();
        
        // Valores inválidos
        expect(settingsManager.set('animationSpeed', 0.05)).toBeFalsy(); // Muy bajo
        expect(settingsManager.set('animationSpeed', 5.0)).toBeFalsy(); // Muy alto
        
        afterEach();
    });

    testFramework.test('debe validar FPS máximo', () => {
        beforeEach();
        
        // Valores válidos
        expect(settingsManager.set('maxFPS', 30)).toBeTruthy();
        expect(settingsManager.set('maxFPS', 60)).toBeTruthy();
        expect(settingsManager.set('maxFPS', 144)).toBeTruthy();
        
        // Valores inválidos
        expect(settingsManager.set('maxFPS', 20)).toBeFalsy(); // Muy bajo
        expect(settingsManager.set('maxFPS', 200)).toBeFalsy(); // Muy alto
        
        afterEach();
    });
});