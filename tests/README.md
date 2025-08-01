# 🎮 Spikepulse - Suite de Tests Unitarios

Este directorio contiene la suite completa de tests unitarios para el proyecto Spikepulse, incluyendo un framework de testing personalizado y tests para todos los módulos principales.

## 📋 Estructura de Archivos

```
tests/
├── TestFramework.js          # Framework de testing personalizado
├── StorageManager.test.js    # Tests para sistema de almacenamiento
├── HighScoreManager.test.js  # Tests para puntuaciones altas
├── SettingsManager.test.js   # Tests para configuración
├── runTests.js              # Ejecutor principal de tests
├── index.html               # Interfaz web para ejecutar tests
├── run.sh                   # Script de línea de comandos
└── README.md                # Esta documentación
```

## 🚀 Cómo Ejecutar los Tests

### Opción 1: Interfaz Web (Recomendado)

1. Abre `tests/index.html` en tu navegador
2. Haz clic en "🚀 Ejecutar Todos los Tests" o selecciona una suite específica
3. Observa los resultados en tiempo real con estadísticas visuales

### Opción 2: Línea de Comandos (Node.js)

```bash
# Ejecutar todos los tests
node tests/runTests.js

# Ejecutar tests de una suite específica
node tests/runTests.js StorageManager
node tests/runTests.js HighScoreManager
node tests/runTests.js SettingsManager

# Mostrar ayuda
node tests/runTests.js --help
```

### Opción 3: Script Bash (Linux/Mac)

```bash
# Hacer ejecutable (solo la primera vez)
chmod +x tests/run.sh

# Ejecutar todos los tests
./tests/run.sh

# Ejecutar suite específica
./tests/run.sh StorageManager
```

## 📊 Módulos Testeados

### 💾 StorageManager
- ✅ Inicialización y configuración
- ✅ Operaciones CRUD (Create, Read, Update, Delete)
- ✅ Manejo de objetos JSON y arrays
- ✅ Validación de datos y manejo de errores
- ✅ Exportación e importación de datos
- ✅ Sistema de backup y restauración
- ✅ Estadísticas de almacenamiento
- ✅ Modo fallback sin localStorage

**Total: 15 tests**

### 🏆 HighScoreManager
- ✅ Gestión de puntuaciones altas (top 10)
- ✅ Ordenamiento por distancia descendente
- ✅ Detección de nuevos récords
- ✅ Validación de datos de puntuación
- ✅ Actualización de estadísticas del jugador
- ✅ Formateo de puntuaciones para mostrar
- ✅ Exportación e importación de récords
- ✅ Operaciones de limpieza y eliminación

**Total: 14 tests**

### ⚙️ SettingsManager
- ✅ Configuración por defecto y personalizada
- ✅ Validación de configuraciones con reglas
- ✅ Configuraciones anidadas (keyBindings.jump)
- ✅ Sistema de watchers para cambios
- ✅ Restablecimiento de configuración
- ✅ Exportación e importación de configuración
- ✅ Detección de configuraciones modificadas
- ✅ Notificaciones a través de EventBus

**Total: 16 tests**

## 🧪 Framework de Testing Personalizado

### Características

- **Sin dependencias externas**: Framework completamente nativo
- **Sintaxis familiar**: Similar a Jest/Mocha (`describe`, `test`, `expect`)
- **Aserciones completas**: `toBe`, `toEqual`, `toBeTruthy`, `toContain`, etc.
- **Sistema de mocks**: Funciones mock con seguimiento de llamadas
- **Estadísticas detalladas**: Resultados por suite y globales
- **Manejo de errores**: Captura y reporte de errores detallados

### Ejemplo de Uso

```javascript
import { testFramework, expect } from './TestFramework.js';

testFramework.describe('Mi Módulo', () => {
    testFramework.test('debe funcionar correctamente', () => {
        const resultado = miModulo.hacerAlgo();
        expect(resultado).toBe('esperado');
        expect(resultado).toBeTruthy();
    });
});
```

## 📈 Interpretación de Resultados

### Símbolos de Estado
- ✅ Test pasó correctamente
- ❌ Test falló
- 🎉 Todos los tests pasaron
- 💥 Algunos tests fallaron
- ⏱️ Tiempo de ejecución
- 📊 Estadísticas generales

### Métricas Importantes
- **Tasa de éxito**: Porcentaje de tests que pasaron
- **Cobertura**: Funcionalidades testeadas vs. total
- **Tiempo de ejecución**: Rendimiento de los tests
- **Errores detallados**: Información específica de fallos

## 🔧 Configuración y Personalización

### Agregar Nuevos Tests

1. Crea un archivo `MiModulo.test.js`
2. Importa el framework: `import { testFramework, expect } from './TestFramework.js'`
3. Escribe tus tests usando `testFramework.describe()` y `testFramework.test()`
4. Importa tu archivo en `runTests.js`

### Ejemplo de Test Personalizado

```javascript
import { testFramework, expect, createMock } from './TestFramework.js';
import { MiModulo } from '../src/MiModulo.js';

testFramework.describe('MiModulo', () => {
    let miModulo;
    
    // Setup antes de cada test
    function beforeEach() {
        miModulo = new MiModulo();
    }
    
    testFramework.test('debe inicializarse correctamente', () => {
        beforeEach();
        
        expect(miModulo).toBeDefined();
        expect(miModulo.estado).toBe('inicial');
    });
    
    testFramework.test('debe manejar errores', () => {
        beforeEach();
        
        expect(() => {
            miModulo.operacionInvalida();
        }).toThrow('Error esperado');
    });
});
```

## 🐛 Solución de Problemas

### Tests Fallan en el Navegador
- Verifica que todos los módulos estén correctamente importados
- Asegúrate de que las rutas de importación sean correctas
- Revisa la consola del navegador para errores de JavaScript

### Tests Fallan en Node.js
- Verifica que Node.js esté instalado (versión 14+)
- Asegúrate de que los módulos ES6 estén soportados
- Revisa que las dependencias estén disponibles

### Errores de Importación
- Verifica las rutas relativas en los imports
- Asegúrate de usar extensiones `.js` en las importaciones
- Revisa que los archivos existan en las rutas especificadas

## 📝 Mejores Prácticas

### Escribir Buenos Tests
1. **Un test, una funcionalidad**: Cada test debe verificar una sola cosa
2. **Nombres descriptivos**: Usa nombres que expliquen qué se está probando
3. **Setup y cleanup**: Usa `beforeEach()` y `afterEach()` para preparar tests
4. **Tests independientes**: Cada test debe poder ejecutarse por separado
5. **Casos edge**: Incluye tests para casos límite y errores

### Organización de Tests
1. **Agrupa por módulo**: Una suite por cada módulo principal
2. **Estructura lógica**: Organiza tests por funcionalidad
3. **Documentación**: Incluye comentarios para tests complejos
4. **Mocks apropiados**: Usa mocks para dependencias externas

## 🎯 Objetivos de Cobertura

- **Módulos principales**: 100% de funciones públicas testeadas
- **Casos de error**: Todos los paths de error cubiertos
- **Integración**: Tests de interacción entre módulos
- **Regresión**: Tests para prevenir bugs conocidos

## 🔄 Integración Continua

Este sistema de tests está diseñado para integrarse fácilmente con:
- **GitHub Actions**: Ejecutar tests en cada commit
- **Hooks de Git**: Ejecutar tests antes de commits
- **Desarrollo local**: Ejecutar tests durante desarrollo
- **Debugging**: Identificar problemas rápidamente

---

## 📞 Soporte

Si encuentras problemas con los tests o necesitas agregar nuevas funcionalidades:

1. Revisa esta documentación
2. Verifica los ejemplos existentes
3. Consulta los logs de error detallados
4. Asegúrate de que los módulos estén implementados correctamente

¡Happy Testing! 🎮✨