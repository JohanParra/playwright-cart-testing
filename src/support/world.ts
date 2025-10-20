import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium } from '@playwright/test';
import { Database } from 'better-sqlite3';
import { CartDatabase } from '../utils/database';
import { CartPage } from '../pages/cart.page';

export interface CartItem {
    id?: number;
    product_name: string;
    price: number;
    quantity: number;
    created_at?: string;
}

export class CustomWorld extends World {
    browser!: Browser;
    context!: BrowserContext;
    page!: Page;
    db!: CartDatabase;
    cartPage!: CartPage;
    lastError: Error | null = null;
    cartItems: CartItem[] = [];

    constructor(options: IWorldOptions) {
        super(options);
    }

    async init() {
        this.browser = await chromium.launch({
            headless: process.env.HEADLESS !== 'false',
            slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
        });
        this.context = await this.browser.newContext({
            viewport: { width: 1280, height: 720 },
            recordVideo: process.env.RECORD_VIDEO === 'true' ? { dir: './videos' } : undefined,
            // Add user agent to appear more like a real browser
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            // Add extra headers
            extraHTTPHeaders: {
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            }
        });
        this.page = await this.context.newPage();
        this.db = new CartDatabase('./cart-test.db');
    }

    async cleanup() {
        try {
            if (this.page && !this.page.isClosed()) {
                await this.page.close();
            }
        } catch (error) {
            console.log('Error closing page:', error instanceof Error ? error.message : String(error));
        }

        try {
            if (this.context) {
                await this.context.close();
            }
        } catch (error) {
            console.log('Error closing context:', error instanceof Error ? error.message : String(error));
        }

        try {
            if (this.browser) {
                await this.browser.close();
            }
        } catch (error) {
            console.log('Error closing browser:', error instanceof Error ? error.message : String(error));
        }

        try {
            if (this.db) {
                this.db.close();
            }
        } catch (error) {
            console.log('Error closing database:', error instanceof Error ? error.message : String(error));
        }
    }
}

setWorldConstructor(CustomWorld);
