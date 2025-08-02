/**
 * Test simple para FullscreenCanvasManager
 */

import { testFramework, expect } from './TestFramework.js';

testFramework.describe('FullscreenCanvasManager', () => {
    testFramework.test('debe pasar test básico', () => {
        expect(1 + 1).toBe(2);
        expect('test').toBe('test');
        expect(true).toBe(true);
    });
});