# Playwright Cart Testing Suite

Suite de pruebas automatizadas para carrito de compras usando Playwright y Cucumber.js.

## Qué es esto

Tests E2E del carrito de compras con BDD. Usa Playwright para automatizar el navegador y Cucumber para escribir tests legibles. También incluye una base de datos SQLite para verificar persistencia.

### Stack
- Playwright para automatización del navegador
- Cucumber.js con Gherkin 
- TypeScript
- SQLite para verificación de datos
- Page Object Model

### Componentes

**Page Objects** (`src/pages/`): Encapsulan interacciones con la UI
**Step Definitions** (`src/steps/`): Conectan Gherkin con código
**Database** (`src/utils/database.ts`): Manejo de SQLite para verificaciones

## Instalación

```bash
npm install
npx playwright install
```

## Ejecutar tests

```bash
# Con reporte HTML
npm run test:report

# Headless (default)
npm run test

# Con navegador visible
HEADLESS=false npm run test

# Slow motion para debug
SLOW_MO=1000 npm run test

# Con logging detallado
LOG_LEVEL=debug npm run test

# Guardar logs en archivo
LOG_FILE=test-logs.json npm run test
```

La DB se crea automáticamente en `cart-test.db`. Para limpiar: `rm -f cart-test.db`

## Base de datos

SQLite en `cart-test.db`. Schema básico:

```sql
CREATE TABLE cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Comandos útiles:
```bash
sqlite3 cart-test.db "SELECT * FROM cart_items;"
```

## Escenarios

Ver `features/cart.feature` para los escenarios completos en Gherkin. Básicamente:
- Agregar productos al carrito
- Eliminar productos
- Validar totales
- Verificar persistencia en DB

## Estructura

```
src/
├── pages/       # Page objects
├── steps/       # Step definitions  
├── support/     # Hooks y config
├── types/       # Types
└── utils/       # DB y helpers
```

## Reportes

- `cucumber-report.html` - reporte principal
- `test-results/` - screenshots cuando fallan

## Troubleshooting

**Browser no instalado**: `npx playwright install`

**Tests timeout**: Ejecuta con `HEADLESS=false npm run test` para ver qué pasa

**DB corrupta**: `rm -f cart-test.db`

## Sistema de Logging

El proyecto incluye un sistema de logging estructurado con Winston que proporciona seguimiento detallado de la ejecución de tests:

### Niveles de Log
- **INFO**: Acciones principales y resultados de validaciones
- **DEBUG**: Detalles técnicos (navegación, clicks, datos)
- **WARN**: Advertencias y situaciones inesperadas
- **ERROR**: Errores y fallos

### Contextos
- **[STEP]**: Logs de step definitions (nivel de negocio)
- **[PAGE]**: Logs de page objects (nivel técnico)
- **[HOOK]**: Logs de hooks (inicio/fin de escenarios)
- **[DB]**: Logs de operaciones de base de datos

### Ejemplo de Output
```
[INFO] [HOOK] 🚀 Iniciando suite de tests - 2025-10-20 20:00:00
[INFO] [STEP] 📋 Escenario: Usuario agrega un producto al carrito
[INFO] [STEP] 🧹 Limpiando base de datos del carrito
[DEBUG] [DB] Carrito limpiado - 0 items
[INFO] [STEP] ✓ Base de datos del carrito limpiada exitosamente
[INFO] [STEP] 🌐 Navegando a lista de productos
[DEBUG] [PAGE] Navegando a productos: https://automationexercise.com/products
[INFO] [STEP] 🛒 Agregando "Blue Top" al carrito
[DEBUG] [PAGE] Producto encontrado: Blue Top
[DEBUG] [PAGE] Click en "Add to cart"
[INFO] [STEP] ✓ "Blue Top" agregado al carrito exitosamente
[INFO] [STEP] 🔍 Validando carrito contiene 1 producto
[DEBUG] [PAGE] Items en carrito: 1, esperado: 1
[INFO] [STEP] ✓ Validación exitosa: carrito = 1 (esperado: 1)
[INFO] [HOOK] ✅ Escenario completado exitosamente: Usuario agrega un producto al carrito (duración: 12.5s)
```

## Notas

- Usa automationexercise.com como sitio de prueba
- Los productos tienen precios hardcodeados en `cart.steps.ts` (Blue Top: 500, Men Tshirt: 400, etc)
- El sistema de logging mejora significativamente la trazabilidad y debugging de los tests

