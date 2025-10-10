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

## Notas

- Usa automationexercise.com como sitio de prueba
- Los productos tienen precios hardcodeados en `cart.steps.ts` (Blue Top: 500, Men Tshirt: 400, etc)

