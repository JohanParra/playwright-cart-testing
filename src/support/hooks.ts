import { Before, After, BeforeAll, AfterAll, Status } from '@cucumber/cucumber';
import { CustomWorld } from './world';

BeforeAll(async function () {
    console.log('Starting tests...');
});

Before(async function (this: CustomWorld) {
    await this.init();
});

After(async function (this: CustomWorld, { result, pickle }) {
    try {
        if (result?.status === Status.FAILED) {
            // Screenshot y HTML para debugging con timeouts más cortos
            try {
                const screenshot = await this.page.screenshot({
                    fullPage: true,
                    timeout: 10000 // 10 segundos en lugar de 30
                });
                this.attach(screenshot, 'image/png');
            } catch (screenshotError) {
                console.log('Screenshot failed:', screenshotError instanceof Error ? screenshotError.message : String(screenshotError));
            }

            try {
                const html = await this.page.content();
                this.attach(html, 'text/html');
            } catch (htmlError) {
                console.log('HTML capture failed:', htmlError instanceof Error ? htmlError.message : String(htmlError));
            }
        }
    } catch (error) {
        console.log('Error capturing debug info:', error instanceof Error ? error.message : String(error));
    } finally {
        await this.cleanup();
    }
});

AfterAll(async function () {
    console.log('Tests completed');
});
