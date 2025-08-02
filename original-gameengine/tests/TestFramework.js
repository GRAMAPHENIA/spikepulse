/**
 * Framework de Testing Simple para Spikepulse
 * @module TestFramework
 */

export class TestFramework {
    constructor() {
        this.tests = [];
        this.suites = new Map();
        this.results = {
            passed: 0,
            failed: 0,
            total: 0,
            errors: []
        };
        this.currentSuite = null;
    }

    /**
     * Crear una suite de tests
     * @param {string} name - Nombre de la suite
     * @param {Function} callback - Función que contiene los tests
     */
    describe(name, callback) {
        this.currentSuite = name;
        this.suites.set(name, []);
        
        console.log(`\n📋 Suite: ${name}`);
        
        try {
            callback();
        } catch (error) {
            console.error(`❌ Error en suite "${name}":`, error);
            this.results.errors.push({
                suite: name,
                test: 'Suite Setup',
                error: error.message
            });
        }
        
        this.currentSuite = null;
    }

    /**
     * Definir un test individual
     * @param {string} description - Descripción del test
     * @param {Function} testFunction - Función del test
     */
    test(description, testFunction) {
        const testCase = {
            suite: this.currentSuite,
            description,
            testFunction,
            passed: false,
            error: null
        };

        if (this.currentSuite && this.suites.has(this.currentSuite)) {
            this.suites.get(this.currentSuite).push(testCase);
        }

        this.tests.push(testCase);
    }

    /**
     * Alias para test()
     */
    it(description, testFunction) {
        this.test(description, testFunction);
    }

    /**
     * Ejecutar todos los tests
     * @returns {Object} Resultados de los tests
     */
    async run() {
        console.log('🚀 Iniciando ejecución de tests...\n');
        
        this.results = {
            passed: 0,
            failed: 0,
            total: this.tests.length,
            errors: [],
            startTime: Date.now()
        };

        for (const testCase of this.tests) {
            await this.runSingleTest(testCase);
        }

        this.results.endTime = Date.now();
        this.results.duration = this.results.endTime - this.results.startTime;

        this.printResults();
        return this.results;
    }

    /**
     * Ejecutar un test individual
     * @param {Object} testCase - Caso de test
     * @private
     */
    async runSingleTest(testCase) {
        try {
            // Ejecutar el test
            await testCase.testFunction();
            
            // Si llegamos aquí, el test pasó
            testCase.passed = true;
            this.results.passed++;
            
            console.log(`  ✅ ${testCase.description}`);
            
        } catch (error) {
            // El test falló
            testCase.passed = false;
            testCase.error = error;
            this.results.failed++;
            
            console.log(`  ❌ ${testCase.description}`);
            console.log(`     Error: ${error.message}`);
            
            this.results.errors.push({
                suite: testCase.suite,
                test: testCase.description,
                error: error.message,
                stack: error.stack
            });
        }
    }

    /**
     * Imprimir resultados finales
     * @private
     */
    printResults() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 RESULTADOS DE TESTS');
        console.log('='.repeat(50));
        
        console.log(`Total: ${this.results.total}`);
        console.log(`✅ Pasaron: ${this.results.passed}`);
        console.log(`❌ Fallaron: ${this.results.failed}`);
        console.log(`⏱️ Duración: ${this.results.duration}ms`);
        
        const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
        console.log(`📈 Tasa de éxito: ${successRate}%`);
        
        if (this.results.failed > 0) {
            console.log('\n❌ ERRORES DETALLADOS:');
            this.results.errors.forEach((error, index) => {
                console.log(`\n${index + 1}. ${error.suite} > ${error.test}`);
                console.log(`   ${error.error}`);
            });
        }
        
        console.log('\n' + '='.repeat(50));
    }

    /**
     * Obtener estadísticas por suite
     * @returns {Object} Estadísticas por suite
     */
    getSuiteStats() {
        const stats = {};
        
        this.suites.forEach((tests, suiteName) => {
            const passed = tests.filter(t => t.passed).length;
            const failed = tests.filter(t => !t.passed).length;
            const total = tests.length;
            
            stats[suiteName] = {
                passed,
                failed,
                total,
                successRate: total > 0 ? ((passed / total) * 100).toFixed(1) : 0
            };
        });
        
        return stats;
    }
}

/**
 * Funciones de aserción
 */
export class Expect {
    constructor(actual) {
        this.actual = actual;
    }

    /**
     * Verificar igualdad estricta
     * @param {*} expected - Valor esperado
     */
    toBe(expected) {
        if (this.actual !== expected) {
            throw new Error(`Esperado: ${expected}, Recibido: ${this.actual}`);
        }
        return this;
    }

    /**
     * Verificar igualdad profunda
     * @param {*} expected - Valor esperado
     */
    toEqual(expected) {
        if (!this.deepEqual(this.actual, expected)) {
            throw new Error(`Esperado: ${JSON.stringify(expected)}, Recibido: ${JSON.stringify(this.actual)}`);
        }
        return this;
    }

    /**
     * Verificar que sea verdadero
     */
    toBeTruthy() {
        if (!this.actual) {
            throw new Error(`Esperado valor truthy, recibido: ${this.actual}`);
        }
        return this;
    }

    /**
     * Verificar que sea falso
     */
    toBeFalsy() {
        if (this.actual) {
            throw new Error(`Esperado valor falsy, recibido: ${this.actual}`);
        }
        return this;
    }

    /**
     * Verificar que sea null
     */
    toBeNull() {
        if (this.actual !== null) {
            throw new Error(`Esperado null, recibido: ${this.actual}`);
        }
        return this;
    }

    /**
     * Verificar que sea undefined
     */
    toBeUndefined() {
        if (this.actual !== undefined) {
            throw new Error(`Esperado undefined, recibido: ${this.actual}`);
        }
        return this;
    }

    /**
     * Verificar que sea definido
     */
    toBeDefined() {
        if (this.actual === undefined) {
            throw new Error(`Esperado valor definido, recibido undefined`);
        }
        return this;
    }

    /**
     * Verificar tipo
     * @param {string} type - Tipo esperado
     */
    toBeInstanceOf(constructor) {
        if (!(this.actual instanceof constructor)) {
            throw new Error(`Esperado instancia de ${constructor.name}, recibido: ${typeof this.actual}`);
        }
        return this;
    }

    /**
     * Verificar que contenga un valor
     * @param {*} expected - Valor que debe contener
     */
    toContain(expected) {
        if (Array.isArray(this.actual)) {
            if (!this.actual.includes(expected)) {
                throw new Error(`Esperado que el array contenga: ${expected}`);
            }
        } else if (typeof this.actual === 'string') {
            if (!this.actual.includes(expected)) {
                throw new Error(`Esperado que la cadena contenga: ${expected}`);
            }
        } else {
            throw new Error(`toContain() solo funciona con arrays y strings`);
        }
        return this;
    }

    /**
     * Verificar longitud
     * @param {number} expected - Longitud esperada
     */
    toHaveLength(expected) {
        if (!this.actual || typeof this.actual.length !== 'number') {
            throw new Error(`El valor no tiene propiedad length`);
        }
        if (this.actual.length !== expected) {
            throw new Error(`Esperado longitud: ${expected}, recibido: ${this.actual.length}`);
        }
        return this;
    }

    /**
     * Verificar que sea mayor que
     * @param {number} expected - Valor de comparación
     */
    toBeGreaterThan(expected) {
        if (this.actual <= expected) {
            throw new Error(`Esperado ${this.actual} > ${expected}`);
        }
        return this;
    }

    /**
     * Verificar que sea menor que
     * @param {number} expected - Valor de comparación
     */
    toBeLessThan(expected) {
        if (this.actual >= expected) {
            throw new Error(`Esperado ${this.actual} < ${expected}`);
        }
        return this;
    }

    /**
     * Verificar que lance un error
     */
    toThrow(expectedError) {
        if (typeof this.actual !== 'function') {
            throw new Error(`toThrow() requiere una función`);
        }
        
        let threwError = false;
        let actualError = null;
        
        try {
            this.actual();
        } catch (error) {
            threwError = true;
            actualError = error;
        }
        
        if (!threwError) {
            throw new Error(`Esperado que la función lance un error`);
        }
        
        if (expectedError && actualError.message !== expectedError) {
            throw new Error(`Esperado error: "${expectedError}", recibido: "${actualError.message}"`);
        }
        
        return this;
    }

    /**
     * Comparación profunda de objetos
     * @param {*} a - Primer valor
     * @param {*} b - Segundo valor
     * @returns {boolean} True si son iguales
     * @private
     */
    deepEqual(a, b) {
        if (a === b) return true;
        
        if (a == null || b == null) return a === b;
        
        if (typeof a !== typeof b) return false;
        
        if (typeof a !== 'object') return a === b;
        
        if (Array.isArray(a) !== Array.isArray(b)) return false;
        
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        
        if (keysA.length !== keysB.length) return false;
        
        for (const key of keysA) {
            if (!keysB.includes(key)) return false;
            if (!this.deepEqual(a[key], b[key])) return false;
        }
        
        return true;
    }
}

/**
 * Función helper para crear expectativas
 * @param {*} actual - Valor actual
 * @returns {Expect} Instancia de Expect
 */
export function expect(actual) {
    return new Expect(actual);
}

/**
 * Mock simple para funciones
 */
export class MockFunction {
    constructor() {
        this.calls = [];
        this.returnValue = undefined;
        this.implementation = null;
    }

    /**
     * Establecer valor de retorno
     * @param {*} value - Valor a retornar
     */
    mockReturnValue(value) {
        this.returnValue = value;
        return this;
    }

    /**
     * Establecer implementación personalizada
     * @param {Function} fn - Función de implementación
     */
    mockImplementation(fn) {
        this.implementation = fn;
        return this;
    }

    /**
     * Función mock que se puede llamar
     */
    fn(...args) {
        this.calls.push(args);
        
        if (this.implementation) {
            return this.implementation(...args);
        }
        
        return this.returnValue;
    }

    /**
     * Verificar si fue llamada
     */
    toHaveBeenCalled() {
        if (this.calls.length === 0) {
            throw new Error('Esperado que la función fuera llamada');
        }
    }

    /**
     * Verificar número de llamadas
     * @param {number} times - Número esperado de llamadas
     */
    toHaveBeenCalledTimes(times) {
        if (this.calls.length !== times) {
            throw new Error(`Esperado ${times} llamadas, recibido ${this.calls.length}`);
        }
    }

    /**
     * Verificar argumentos de la última llamada
     * @param {...*} args - Argumentos esperados
     */
    toHaveBeenCalledWith(...args) {
        if (this.calls.length === 0) {
            throw new Error('La función no fue llamada');
        }
        
        const lastCall = this.calls[this.calls.length - 1];
        if (!new Expect(lastCall).deepEqual(lastCall, args)) {
            throw new Error(`Esperado llamada con: ${JSON.stringify(args)}, recibido: ${JSON.stringify(lastCall)}`);
        }
    }

    /**
     * Limpiar historial de llamadas
     */
    mockClear() {
        this.calls = [];
        return this;
    }
}

/**
 * Crear función mock
 * @returns {MockFunction} Nueva función mock
 */
export function createMock() {
    const mock = new MockFunction();
    const fn = (...args) => mock.fn(...args);
    
    // Agregar métodos de mock a la función
    Object.assign(fn, mock);
    
    return fn;
}

// Instancia global del framework
export const testFramework = new TestFramework();