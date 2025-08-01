/**
 * Test básico para verificar que el sistema funciona
 */

import { testFramework, expect } from './TestFramework.js';
import { DOMSetup } from './DOMSetup.js';

testFramework.describe('Test Básico', () => {
    testFramework.test('debería funcionar correctamente', () => {
        expect(true).toBe(true);
    });
    
    testFramework.test('debería tener DOM setup', () => {
        expect(global.document).toBeDefined();
        expect(global.window).toBeDefined();
    });
});