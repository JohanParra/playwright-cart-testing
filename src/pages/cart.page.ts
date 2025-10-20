import { Page } from '@playwright/test';
import { CartItem } from '../support/world';

// TODO: refactorizar esto para usar mejor el patrón page object
// TODO: agregar mejor manejo de timeouts, a veces falla en CI
export class CartPage {
    private readonly BASE_URL = 'https://automationexercise.com';

    constructor(private page: Page) { }

    async goto() {
        await this.page.goto(`${this.BASE_URL}/view_cart`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        // Esperar un poco más para que cargue completamente
        await this.page.waitForTimeout(2000);
    }

    async gotoProductCategory(category: string) {
        // FIXME: el parámetro category no se usa, siempre va a /products
        await this.page.goto(`${this.BASE_URL}/products`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        // Esperar un poco más para que cargue completamente
        await this.page.waitForTimeout(2000);

        // En modo visual, esperar a que los productos sean visibles
        try {
            await this.page.waitForSelector('.productinfo', { timeout: 15000 });
        } catch (error) {
            console.log('Products not visible, continuing anyway...');
        }
    }

    async addToCart(productName: string, price: number, quantity: number, autoContinue: boolean = true) {
        await this.gotoProductCategory('products');

        // Esperar a que la página cargue completamente
        await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 });

        const productCard = this.page.locator(`.productinfo:has-text("${productName}")`);

        // Esperar a que el producto sea visible
        await productCard.waitFor({ state: 'visible', timeout: 15000 });

        const addToCartButton = productCard.locator('a:has-text("Add to cart")');
        await addToCartButton.click();

        // console.log(`Added ${productName} to cart`); // debug

        // A veces el modal tarda más, aumenté los timeouts
        await this.page.waitForSelector('text=Added!', { timeout: 20000 });

        // Solo cerrar automáticamente si autoContinue es true
        if (autoContinue) {
            await this.page.click('button:has-text("Continue Shopping")');
            await this.page.waitForSelector('.modal-content', { state: 'hidden', timeout: 15000 });
        }
    }

    async getCartItems(): Promise<CartItem[]> {
        await this.goto();

        // TODO: esto es muy frágil, los selectores cambian mucho
        // considerar usar data-testid o algo más estable
        return await this.page.evaluate(() => {
            const items: Array<{ product_name: string; price: number; quantity: number }> = [];
            const rows = document.querySelectorAll('#cart_info_table tbody tr');

            rows.forEach((row: Element) => {
                // Pruebo varios selectores porque el HTML del sitio no es consistente
                let nameElement = row.querySelector('td:nth-child(2) h4 a');
                if (!nameElement) {
                    nameElement = row.querySelector('td:nth-child(2) a');
                }
                if (!nameElement) {
                    nameElement = row.querySelector('td:nth-child(2)');
                }

                let priceElement = row.querySelector('td:nth-child(3) p');
                if (!priceElement) {
                    priceElement = row.querySelector('td:nth-child(3)');
                }

                let quantityElement = row.querySelector('td:nth-child(4) button');
                if (!quantityElement) {
                    quantityElement = row.querySelector('td:nth-child(4)');
                }

                if (nameElement && priceElement) {
                    const name = nameElement.textContent?.trim() || '';
                    const priceText = priceElement.textContent?.trim() || '';

                    let price = 0;
                    if (priceText.includes('$')) {
                        const match = priceText.match(/\$(\d+(?:\.\d{2})?)/);
                        if (match) {
                            price = parseFloat(match[1]);
                        }
                    } else {
                        const match = priceText.match(/(\d+(?:\.\d{2})?)/);
                        if (match) {
                            price = parseFloat(match[1]);
                        }
                    }

                    // Intentar obtener la cantidad real del carrito
                    let quantity = 1;
                    const quantityElement = row.querySelector('td:nth-child(4) button');
                    if (quantityElement) {
                        const quantityText = quantityElement.textContent?.trim() || '1';
                        const parsedQuantity = parseInt(quantityText);
                        if (!isNaN(parsedQuantity)) {
                            quantity = parsedQuantity;
                        }
                    }

                    console.log(`Found product: "${name}", price: ${price}, quantity: ${quantity}`);

                    if (name && price > 0) {
                        items.push({ product_name: name, price, quantity });
                    }
                }
            });

            return items;
        });
    }

    async updateQuantity(productName: string, quantity: number) {
        await this.goto();

        // Verificar si el producto ya existe en el carrito
        const currentItems = await this.getCartItems();
        const existingItem = currentItems.find(item => item.product_name.includes(productName));

        if (existingItem) {
            // Si ya existe, removerlo primero
            await this.removeItem(productName);
        }

        // Método optimizado: agregar todos los productos de una vez
        await this.gotoProductCategory('products');
        await this.page.waitForLoadState('domcontentloaded', { timeout: 20000 });
        await this.page.waitForTimeout(1000);

        const productCard = this.page.locator(`.productinfo:has-text("${productName}")`);
        await productCard.waitFor({ state: 'visible', timeout: 10000 });

        // Agregar productos en lotes para ser más eficiente
        const batchSize = Math.min(quantity, 3); // Procesar máximo 3 a la vez

        for (let batch = 0; batch < Math.ceil(quantity / batchSize); batch++) {
            const currentBatch = Math.min(batchSize, quantity - (batch * batchSize));

            for (let i = 0; i < currentBatch; i++) {
                const addToCartButton = productCard.locator('a:has-text("Add to cart")');
                await addToCartButton.click();

                // Esperar confirmación con timeout más corto
                await this.page.waitForSelector('text=Added!', { timeout: 8000 });

                // Cerrar modal rápidamente
                await this.page.click('button:has-text("Continue Shopping")');
                await this.page.waitForTimeout(300); // Espera muy corta
            }

            // Esperar un poco entre lotes
            if (batch < Math.ceil(quantity / batchSize) - 1) {
                await this.page.waitForTimeout(500);
            }
        }
    }

    async removeItem(productName: string) {
        await this.goto();

        // Find the product row in the cart table
        const productRow = this.page.locator(`#cart_info_table tbody tr:has-text("${productName}")`);

        // Click the remove button (cart_quantity_delete)
        const removeButton = productRow.locator('a.cart_quantity_delete');
        if (await removeButton.count() > 0) {
            await removeButton.click();
            // Wait for the page to update
            await this.page.waitForTimeout(1000);
        }
    }

    async clearCart() {
        await this.goto();
        // automationexercise.com doesn't have a single "clear cart" button, so we remove items one by one
        const removeButtons = this.page.locator('a.cart_quantity_delete');
        const count = await removeButtons.count();
        for (let i = 0; i < count; i++) {
            await removeButtons.first().click();
            await this.page.waitForTimeout(1000); // Wait for removal
        }
    }

    async getCartTotal(): Promise<number> {
        await this.goto();

        // Calculate total from individual items (most reliable method)
        const items = await this.getCartItems();
        const calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // If we have items, return the calculated total
        if (calculatedTotal > 0) {
            return calculatedTotal;
        }

        // Fallback: Try to find total in the page
        let total = 0;

        // Method 1: Look for total in the cart table
        const totalElement = this.page.locator('#cart_info_table tbody tr:last-child td:last-child');
        if (await totalElement.count() > 0) {
            const totalText = await totalElement.textContent();
            total = parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0');
        }

        // Method 2: Look for total in a different location
        if (total === 0) {
            const altTotalElement = this.page.locator('text=/Total.*\\$[0-9]+/');
            if (await altTotalElement.count() > 0) {
                const totalText = await altTotalElement.textContent();
                total = parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0');
            }
        }

        return total;
    }

    async getItemCount(): Promise<number> {
        await this.goto();
        // Check if cart is empty first
        const isEmpty = await this.page.locator('text=Cart is empty!').isVisible();
        if (isEmpty) return 0;

        // Count items in cart table
        const items = await this.page.locator('#cart_info_table tbody tr').count();
        return items;
    }

    async isCartEmpty(): Promise<boolean> {
        await this.goto();
        const emptyMessage = await this.page.locator('text=Cart is empty!').isVisible();
        return emptyMessage;
    }
}
