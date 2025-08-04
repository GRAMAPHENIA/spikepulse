# Tests Unitarios

Esta carpeta contiene los tests unitarios para los módulos individuales de Spikepulse.

## Estructura

- `core/` - Tests para módulos del núcleo (GameEngine, StateManager, EventBus)
- `modules/` - Tests para módulos de funcionalidad (Player, World, Renderer, etc.)
- `utils/` - Tests para utilidades (MathUtils, DebugUtils, etc.)
- `config/` - Tests para archivos de configuración

## Ejecutar Tests

```bash
npm run test:unit
```

## Convenciones

- Cada archivo de test debe terminar en `.test.js`
- Los tests deben ser independientes y no depender del orden de ejecución
- Usar mocks para dependencias externas
- Seguir el patrón AAA (Arrange, Act, Assert)