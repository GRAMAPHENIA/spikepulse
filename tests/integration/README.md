# Tests de Integración

Esta carpeta contiene los tests de integración que verifican la interacción entre múltiples módulos de Spikepulse.

## Estructura

- `gameflow/` - Tests del flujo completo del juego
- `modules/` - Tests de integración entre módulos específicos
- `ui/` - Tests de integración de la interfaz de usuario

## Ejecutar Tests

```bash
npm run test:integration
```

## Convenciones

- Los tests de integración deben verificar la comunicación entre módulos
- Usar el EventBus real para verificar la comunicación
- Simular escenarios de juego completos
- Verificar que los estados se mantengan consistentes