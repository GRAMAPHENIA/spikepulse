/**
 * Ejecutor principal de tests para Spikepulse
 * @module TestRunner
 */

import { testFramework } from './TestFramework.js';

// Importar todos los archivos de test
import './BasicTest.js';
import './StorageManager.test.js';
import './HighScoreManager.test.js';
import './SettingsManager.test.js';
import './NoirPalette.test.js';
import './FullscreenCanvasManager.simple.test.js';
import './ViewportManager.test.js';
import './ResponsiveHandler.test.js';
import './PerformanceOptimizer.test.js';
import './ScalableMemoryManager.test.js';
import './FullscreenIntegrator.test.js';
// import './NoirThemeManager.test.js';

/**
 * Ejecutar todos los tests
 */
async function runAllTests() {
    console.log('🎮 SPIKEPULSE - SUITE DE TESTS');
    console.log('================================');
    console.log('Ejecutando tests para módulos principales...\n');

    try {
        // Ejecutar todos los tests
        const results = await testFramework.run();
        
        // Mostrar estadísticas por suite
        console.log('\n📊 ESTADÍSTICAS POR SUITE:');
        console.log('-'.repeat(30));
        
        const suiteStats = testFramework.getSuiteStats();
        Object.entries(suiteStats).forEach(([suiteName, stats]) => {
            const status = stats.failed === 0 ? '✅' : '❌';
            console.log(`${status} ${suiteName}: ${stats.passed}/${stats.total} (${stats.successRate}%)`);
        });
        
        // Determinar resultado general
        const overallSuccess = results.failed === 0;
        const statusIcon = overallSuccess ? '🎉' : '💥';
        const statusText = overallSuccess ? 'TODOS LOS TESTS PASARON' : 'ALGUNOS TESTS FALLARON';
        
        console.log(`\n${statusIcon} ${statusText}`);
        
        // Mostrar recomendaciones si hay fallos
        if (!overallSuccess) {
            console.log('\n💡 RECOMENDACIONES:');
            console.log('- Revisa los errores detallados arriba');
            console.log('- Verifica que los módulos estén implementados correctamente');
            console.log('- Asegúrate de que las dependencias estén disponibles');
        }
        
        return results;
        
    } catch (error) {
        console.error('💥 Error ejecutando tests:', error);
        return {
            passed: 0,
            failed: 1,
            total: 1,
            errors: [{ error: error.message }]
        };
    }
}

/**
 * Función para ejecutar tests específicos de una suite
 * @param {string} suiteName - Nombre de la suite a ejecutar
 */
async function runSuiteTests(suiteName) {
    console.log(`🎯 Ejecutando tests para: ${suiteName}\n`);
    
    // Filtrar tests de la suite específica
    const suiteTests = testFramework.tests.filter(test => test.suite === suiteName);
    
    if (suiteTests.length === 0) {
        console.log(`❌ No se encontraron tests para la suite: ${suiteName}`);
        return;
    }
    
    console.log(`📋 Encontrados ${suiteTests.length} tests en la suite "${suiteName}"`);
    
    let passed = 0;
    let failed = 0;
    
    for (const test of suiteTests) {
        try {
            await test.testFunction();
            console.log(`  ✅ ${test.description}`);
            passed++;
        } catch (error) {
            console.log(`  ❌ ${test.description}`);
            console.log(`     Error: ${error.message}`);
            failed++;
        }
    }
    
    console.log(`\n📊 Resultados de "${suiteName}": ${passed}/${suiteTests.length} tests pasaron`);
    
    return { passed, failed, total: suiteTests.length };
}

/**
 * Función para mostrar ayuda
 */
function showHelp() {
    console.log('🎮 SPIKEPULSE TEST RUNNER');
    console.log('========================');
    console.log('');
    console.log('Uso:');
    console.log('  node tests/runTests.js [suite]');
    console.log('');
    console.log('Opciones:');
    console.log('  (sin argumentos)  - Ejecutar todos los tests');
    console.log('  StorageManager    - Ejecutar solo tests de StorageManager');
    console.log('  HighScoreManager  - Ejecutar solo tests de HighScoreManager');
    console.log('  SettingsManager   - Ejecutar solo tests de SettingsManager');
    console.log('  --help, -h        - Mostrar esta ayuda');
    console.log('');
    console.log('Ejemplos:');
    console.log('  node tests/runTests.js');
    console.log('  node tests/runTests.js StorageManager');
}

// Ejecutar tests según argumentos de línea de comandos
if (typeof window === 'undefined') {
    // Entorno Node.js
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
    } else if (args.length === 0) {
        runAllTests();
    } else {
        const suiteName = args[0];
        runSuiteTests(suiteName);
    }
} else {
    // Entorno navegador - ejecutar todos los tests automáticamente
    document.addEventListener('DOMContentLoaded', () => {
        runAllTests();
    });
}

// Exportar funciones para uso externo
export { runAllTests, runSuiteTests, showHelp };