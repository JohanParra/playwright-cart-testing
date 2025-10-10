import { Before, After, BeforeAll, AfterAll, Status } from '@cucumber/cucumber';
import { CustomWorld } from './world';

BeforeAll(async function () {
    console.log('Starting tests...');
});

Before(async function (this: CustomWorld) {
    await this.init();
});

After(async function (this: CustomWorld, { result, pickle }) {
    if (result?.status === Status.FAILED) {
        // Screenshot y HTML para debugging
        const screenshot = await this.page.screenshot({ fullPage: true });
        this.attach(screenshot, 'image/png');

        const html = await this.page.content();
        this.attach(html, 'text/html');
    }

    await this.cleanup();
});

AfterAll(async function () {
    console.log('Tests completed');
});
