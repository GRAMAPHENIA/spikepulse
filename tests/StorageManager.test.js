/**
 * Tests para StorageManager
 * @module StorageManagerTests
 */

import { testFramework, expect, createMock } from './TestFramework.js';
import { StorageManager } from '../src/utils/StorageManager.js';

// Mock de localStorage para testing
class MockLocalStorage {
    constructor() {
        this.store = {};
    }

    getItem(key) {
        return this.store[key] || null;
    }

    setItem(key, value) {
        this.store[key] = value.toString();
    }

    removeItem(key) {
        delete this.store[key];
    }

    clear() {
        this.store = {};
    }

    get length() {
        return Object.keys(this.store).length;
    }

    key(index) {
        const keys = Object.keys(this.store);
        return keys[index] || null;
    }
}

testFramework.describe('StorageManager', () => {
    let storageManager;
    let mockLocalStorage;
    let originalLocalStorage;

    // Setup antes de cada test
    function beforeEach() {
        // Guardar localStorage original
        originalLocalStorage = window.localStorage;
        
        // Crear mock de localStorage
        mockLocalStorage = new MockLocalStorage();
        
        // Sobrescribir localStorage usando Object.defineProperty
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true,
            configurable: true
        });
        
        // Crear nueva instancia de StorageManager
        storageManager = new StorageManager('test');
    }

    // Cleanup después de cada test
    function afterEach() {
        // Restaurar localStorage original
        Object.defineProperty(window, 'localStorage', {
            value: originalLocalStorage,
            writable: true,
            configurable: true
        });
        storageManager = null;
        mockLocalStorage = null;
    }

    testFramework.test('debe inicializarse correctamente', () => {
        beforeEach();
        
        expect(storageManager).toBeDefined();
        expect(storageManager.prefix).toBe('test');
        expect(storageManager.isAvailable).toBeTruthy();
        
        afterEach();
    });

    testFramework.test('debe generar claves con prefijo correctamente', () => {
        beforeEach();
        
        const fullKey = storageManager.getFullKey('testKey');
        expect(fullKey).toBe('test_testKey');
        
        afterEach();
    });

    testFramework.test('debe guardar y recuperar valores simples', () => {
        beforeEach();
        
        const testValue = 'valor de prueba';
        const success = storageManager.set('testKey', testValue);
        
        expect(success).toBeTruthy();
        
        const retrievedValue = storageManager.get('testKey');
        expect(retrievedValue).toBe(testValue);
        
        afterEach();
    });

    testFramework.test('debe guardar y recuperar objetos JSON', () => {
        beforeEach();
        
        const testObject = {
            name: 'Test',
            value: 123,
            nested: {
                prop: 'nested value'
            }
        };
        
        const success = storageManager.set('testObject', testObject);
        expect(success).toBeTruthy();
        
        const retrievedObject = storageManager.get('testObject');
        expect(retrievedObject).toEqual(testObject);
        
        afterEach();
    });

    testFramework.test('debe guardar y recuperar arrays', () => {
        beforeEach();
        
        const testArray = [1, 2, 3, 'test', { nested: true }];
        
        storageManager.set('testArray', testArray);
        const retrievedArray = storageManager.get('testArray');
        
        expect(retrievedArray).toEqual(testArray);
        expect(retrievedArray).toHaveLength(5);
        
        afterEach();
    });

    testFramework.test('debe retornar valor por defecto para claves inexistentes', () => {
        beforeEach();
        
        const defaultValue = 'default';
        const value = storageManager.get('nonExistentKey', defaultValue);
        
        expect(value).toBe(defaultValue);
        
        afterEach();
    });

    testFramework.test('debe verificar existencia de claves correctamente', () => {
        beforeEach();
        
        expect(storageManager.hasKey('nonExistent')).toBeFalsy();
        
        storageManager.set('existingKey', 'value');
        expect(storageManager.hasKey('existingKey')).toBeTruthy();
        
        afterEach();
    });

    testFramework.test('debe eliminar claves correctamente', () => {
        beforeEach();
        
        storageManager.set('keyToDelete', 'value');
        expect(storageManager.hasKey('keyToDelete')).toBeTruthy();
        
        const success = storageManager.remove('keyToDelete');
        expect(success).toBeTruthy();
        expect(storageManager.hasKey('keyToDelete')).toBeFalsy();
        
        afterEach();
    });

    testFramework.test('debe limpiar todo el almacenamiento del juego', () => {
        beforeEach();
        
        // Agregar algunas claves del juego
        storageManager.set('key1', 'value1');
        storageManager.set('key2', 'value2');
        
        // Agregar una clave que no es del juego
        mockLocalStorage.setItem('other_key', 'other_value');
        
        expect(storageManager.hasKey('key1')).toBeTruthy();
        expect(storageManager.hasKey('key2')).toBeTruthy();
        
        const success = storageManager.clear();
        expect(success).toBeTruthy();
        
        expect(storageManager.hasKey('key1')).toBeFalsy();
        expect(storageManager.hasKey('key2')).toBeFalsy();
        
        // La clave externa no debe ser afectada
        expect(mockLocalStorage.getItem('other_key')).toBe('other_value');
        
        afterEach();
    });

    testFramework.test('debe obtener todas las claves del juego', () => {
        beforeEach();
        
        // Limpiar datos iniciales que se crean automáticamente
        storageManager.clear();
        
        storageManager.set('key1', 'value1');
        storageManager.set('key2', 'value2');
        storageManager.set('key3', 'value3');
        
        // Agregar clave externa
        mockLocalStorage.setItem('external_key', 'external_value');
        
        const gameKeys = storageManager.getAllKeys();
        
        expect(gameKeys).toHaveLength(3);
        expect(gameKeys).toContain('key1');
        expect(gameKeys).toContain('key2');
        expect(gameKeys).toContain('key3');
        
        afterEach();
    });

    testFramework.test('debe exportar datos correctamente', () => {
        beforeEach();
        
        storageManager.set('key1', 'value1');
        storageManager.set('key2', { nested: 'object' });
        storageManager.set('key3', [1, 2, 3]);
        
        const exportedData = storageManager.exportData();
        
        expect(exportedData).toBeDefined();
        expect(exportedData.version).toBe('1.0');
        expect(exportedData.exportDate).toBeDefined();
        expect(exportedData.data).toBeDefined();
        
        expect(exportedData.data.key1).toBe('value1');
        expect(exportedData.data.key2).toEqual({ nested: 'object' });
        expect(exportedData.data.key3).toEqual([1, 2, 3]);
        
        afterEach();
    });

    testFramework.test('debe importar datos correctamente', () => {
        beforeEach();
        
        const importData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            data: {
                importedKey1: 'imported value 1',
                importedKey2: { imported: 'object' },
                importedKey3: [4, 5, 6]
            }
        };
        
        const success = storageManager.importData(importData);
        expect(success).toBeTruthy();
        
        expect(storageManager.get('importedKey1')).toBe('imported value 1');
        expect(storageManager.get('importedKey2')).toEqual({ imported: 'object' });
        expect(storageManager.get('importedKey3')).toEqual([4, 5, 6]);
        
        afterEach();
    });

    testFramework.test('debe crear y restaurar backup correctamente', () => {
        beforeEach();
        
        storageManager.set('backupKey1', 'backup value 1');
        storageManager.set('backupKey2', { backup: 'object' });
        
        const backupString = storageManager.createBackup();
        expect(backupString).toBeDefined();
        expect(typeof backupString).toBe('string');
        
        // Limpiar datos
        storageManager.clear();
        expect(storageManager.hasKey('backupKey1')).toBeFalsy();
        
        // Restaurar desde backup
        const success = storageManager.restoreFromBackup(backupString);
        expect(success).toBeTruthy();
        
        expect(storageManager.get('backupKey1')).toBe('backup value 1');
        expect(storageManager.get('backupKey2')).toEqual({ backup: 'object' });
        
        afterEach();
    });

    testFramework.test('debe obtener estadísticas de almacenamiento', () => {
        beforeEach();
        
        // Limpiar datos iniciales que se crean automáticamente
        storageManager.clear();
        
        storageManager.set('statsKey1', 'value1');
        storageManager.set('statsKey2', 'value2');
        
        const stats = storageManager.getStorageStats();
        
        expect(stats).toBeDefined();
        expect(stats.isAvailable).toBeTruthy();
        expect(stats.totalKeys).toBe(2);
        expect(stats.totalSize).toBeGreaterThan(0);
        expect(stats.keys).toHaveLength(2);
        expect(stats.keys).toContain('statsKey1');
        expect(stats.keys).toContain('statsKey2');
        
        afterEach();
    });

    testFramework.test('debe manejar errores de JSON inválido', () => {
        beforeEach();
        
        // Simular datos corruptos en localStorage
        mockLocalStorage.setItem('test_corruptKey', 'invalid json {');
        
        const value = storageManager.get('corruptKey', 'default');
        expect(value).toBe('invalid json {'); // Debe retornar como string
        
        afterEach();
    });

    testFramework.test('debe funcionar sin localStorage (modo fallback)', () => {
        // Simular localStorage no disponible
        const originalLocalStorage = window.localStorage;
        
        // Sobrescribir localStorage con undefined
        Object.defineProperty(window, 'localStorage', {
            value: undefined,
            writable: true,
            configurable: true
        });
        
        const fallbackStorage = new StorageManager('fallback');
        
        expect(fallbackStorage.isAvailable).toBeFalsy();
        
        // Debe funcionar con almacenamiento temporal
        const success = fallbackStorage.set('fallbackKey', 'fallback value');
        expect(success).toBeTruthy();
        
        const value = fallbackStorage.get('fallbackKey');
        expect(value).toBe('fallback value');
        
        // Restaurar localStorage
        Object.defineProperty(window, 'localStorage', {
            value: originalLocalStorage,
            writable: true,
            configurable: true
        });
    });
});