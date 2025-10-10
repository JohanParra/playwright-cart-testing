# Notas de desarrollo

## Problemas conocidos

- Los selectores de automationexercise.com son inconsistentes, a veces cambian
- El modal de "Added!" a veces tarda más de lo esperado - aumenté timeouts a 15s/10s
- "Stylish Dress" específicamente es lento, no sé por qué (tarda ~8-10 segundos)
- updateQuantity() es ineficiente, hace N llamadas pero no hay otra forma con este sitio

## TODOs pendientes

- [ ] Mover los precios hardcodeados a un archivo de config
- [ ] Agregar retry logic para clicks que fallan ocasionalmente
- [ ] Considerar usar data-testid en lugar de selectores frágiles (si tenemos control del HTML)
- [ ] Separar step definitions en múltiples archivos cuando crezca
- [ ] Agregar más escenarios de prueba (carrito vacío, productos agotados, etc)

## Decisiones de diseño

**Por qué SQLite?** 
Simple, no requiere setup adicional, suficiente para este proyecto

**Por qué Page Object Model?**
Separa la lógica de UI de los tests, más mantenible a largo plazo

**Por qué no usar mocks?**
Prefiero probar contra el sitio real para encontrar bugs reales. Mocks podrían ocultar problemas de integración.

## Comandos útiles que uso

```bash
# Ver logs de DB durante tests
HEADLESS=false npm test

# Limpiar todo
npm run clean && rm -f cart-test.db

# Ver schema de la DB
sqlite3 cart-test.db ".schema"

# Run en slow motion para debug
SLOW_MO=500 HEADLESS=false npm test
```

## Referencias

- Playwright docs: https://playwright.dev/
- Cucumber.js: https://github.com/cucumber/cucumber-js
- Site de prueba: https://automationexercise.com (tiene API también pero no la estoy usando)

