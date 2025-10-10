import { Page } from '@playwright/test';
import { CartItem } from '../support/world';

// TODO: refactorizar esto para usar mejor el patrón page object
// TODO: agregar mejor manejo de timeouts, a veces falla en CI
export class CartPage {
    private readonly BASE_URL = 'https://automationexercise.com';

    constructor(private page: Page) { }

    async goto() {
        await this.page.goto(`${this.BASE_URL}/view_cart`);
    }

    async gotoProductCategory(category: string) {
        // FIXME: el parámetro category no se usa, siempre va a /products
        await this.page.goto(`${this.BASE_URL}/products`);
    }

    async addToCart(productName: string, price: number, quantity: number) {
        await this.gotoProductCategory('products');

        const productCard = this.page.locator(`.productinfo:has-text("${productName}")`);
        const addToCartButton = productCard.locator('a:has-text("Add to cart")');

        await addToCartButton.click();

        // console.log(`Added ${productName} to cart`); // debug

        // A veces el modal tarda más, aumenté los timeouts
        await this.page.waitForSelector('text=Added!', { timeout: 15000 });
        await this.page.click('button:has-text("Continue Shopping")');
        await this.page.waitForSelector('.modal-content', { state: 'hidden', timeout: 10000 });
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

                    const quantity = 1;
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

        // HACK: el sitio no permite cambiar cantidad directamente
        // tengo que borrar y agregar N veces. No es ideal pero funciona
        const productRow = this.page.locator(`#cart_info_table tbody tr:has-text("${productName}")`);
        const productId = await productRow.locator('a.cart_quantity_delete').getAttribute('data-product-id');

        if (productId) {
            await this.removeItem(productName);

            for (let i = 0; i < quantity; i++) {
                await this.gotoProductCategory('products');
                const productCard = this.page.locator(`.productinfo:has-text("${productName}")`);
                const addToCartButton = productCard.locator('a:has-text("Add to cart")');
                await addToCartButton.click();

                await this.page.waitForSelector('text=Added!', { timeout: 5000 });
                await this.page.click('button:has-text("Continue Shopping")');
                await this.page.waitForSelector('.modal-content', { state: 'hidden', timeout: 3000 });
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
