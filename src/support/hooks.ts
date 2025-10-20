import { Before, After, BeforeAll, AfterAll, Status } from '@cucumber/cucumber';
import { CustomWorld } from './world';
import { hookLogger } from '../utils/logger';

BeforeAll(async function () {
    const timestamp = new Date().toISOString();
    hookLogger.info(`🚀 Iniciando suite de tests - ${timestamp}`);
});

Before(async function (this: CustomWorld, { pickle }) {
    const scenarioName = pickle?.name || 'Escenario sin nombre';
    hookLogger.info(`📋 Iniciando escenario: ${scenarioName}`);
    await this.init();
    hookLogger.debug('Browser y contexto inicializados');
});

After(async function (this: CustomWorld, { result, pickle }) {
    const scenarioName = pickle?.name || 'Escenario sin nombre';
    const duration = result?.duration ? `${(Number(result.duration) / 1000).toFixed(1)}s` : 'N/A';

    try {
        if (result?.status === Status.FAILED) {
            hookLogger.error(`❌ Escenario falló: ${scenarioName} (duración: ${duration})`);
            // Screenshot y HTML para debugging con timeouts más cortos
            try {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const screenshotPath = `test-results/screenshots/failure-${timestamp}.png`;

                const screenshot = await this.page.screenshot({
                    fullPage: true,
                    path: screenshotPath,
                    timeout: 10000 // 10 segundos en lugar de 30
                });
                this.attach(screenshot, 'image/png');
                hookLogger.info(`📸 Screenshot guardado: ${screenshotPath}`);
            } catch (screenshotError) {
                hookLogger.error(`Screenshot falló: ${screenshotError instanceof Error ? screenshotError.message : String(screenshotError)}`);
            }

            try {
                const html = await this.page.content();
                this.attach(html, 'text/html');
                hookLogger.debug('HTML de la página capturado para debugging');
            } catch (htmlError) {
                hookLogger.error(`HTML capture falló: ${htmlError instanceof Error ? htmlError.message : String(htmlError)}`);
            }
        } else if (result?.status === Status.PASSED) {
            hookLogger.info(`✅ Escenario completado exitosamente: ${scenarioName} (duración: ${duration})`);
        } else {
            hookLogger.warn(`⚠️ Escenario completado con estado: ${result?.status} - ${scenarioName} (duración: ${duration})`);
        }
    } catch (error) {
        hookLogger.error(`Error capturando información de debug: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        await this.cleanup();
        hookLogger.debug('Cleanup completado');
    }
});

AfterAll(async function () {
    const timestamp = new Date().toISOString();
    hookLogger.info(`🏁 Suite de tests completada - ${timestamp}`);
});
