# Quick Start

## Setup

```bash
cd playwright-cart-testing-suite
npm install
npx playwright install
```

## Run tests

```bash
# Basic run
npm test

# With HTML report
npm run test:report

# View report
open cucumber-report.html
```

## Structure

```
features/     → scenarios en Gherkin
src/steps/    → implementación
src/pages/    → page objects
src/utils/    → DB y helpers
```

## Comandos útiles

```bash
npm test                      # Run tests
npm run test:report           # Con reporte HTML
npm run clean                 # Limpiar artifacts
HEADLESS=false npm test       # Ver navegador
SLOW_MO=100 npm test          # Slow motion
```

## Troubleshooting

Dependencias: `npm install`
DB locked: `npm run clean`
Browser issues: `npx playwright install`

## Más info

Ver `README.md` para detalles completos.
