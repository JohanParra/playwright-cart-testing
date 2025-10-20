import { Page } from '@playwright/test';
import { CartItem } from '../support/world';
import { pageLogger } from '../utils/logger';

// TODO: refactorizar esto para usar mejor el patrón page object
// TODO: agregar mejor manejo de timeouts, a veces falla en CI
export class CartPage {
    private readonly BASE_URL = 'https://automationexercise.com';

    constructor(private page: Page) { }

    async goto() {
        const url = `${this.BASE_URL}/view_cart`;
        pageLogger.debug(`Navegando a carrito: ${url}`);
        await this.page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        // Esperar un poco más para que cargue completamente
        await this.page.waitForTimeout(2000);
        pageLogger.debug('Página del carrito cargada');
    }

    async gotoProductCategory(category: string) {
        const url = `${this.BASE_URL}/products`;
        pageLogger.debug(`Navegando a productos: ${url}`);
        // FIXME: el parámetro category no se usa, siempre va a /products
        await this.page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        // Esperar un poco más para que cargue completamente
        await this.page.waitForTimeout(2000);

        // En modo visual, esperar a que los productos sean visibles
        try {
            await this.page.waitForSelector('.productinfo', { timeout: 15000 });
            pageLogger.debug('Productos visibles en la página');
        } catch (error) {
            pageLogger.warn('Productos no visibles, continuando de todas formas...');
        }
    }

    async addToCart(productName: string, price: number, quantity: number, autoContinue: boolean = true) {
        pageLogger.info(`Agregando "${productName}" al carrito (precio: $${price}, cantidad: ${quantity})`);
        await this.gotoProductCategory('products');

        // Esperar a que la página cargue completamente
        await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 });

        const productCard = this.page.locator(`.productinfo:has-text("${productName}")`);

        // Esperar a que el producto sea visible
        await productCard.waitFor({ state: 'visible', timeout: 15000 });
        pageLogger.debug(`Producto encontrado: ${productName}`);

        const addToCartButton = productCard.locator('a:has-text("Add to cart")');
        await addToCartButton.click();
        pageLogger.debug('Click en "Add to cart"');

        // A veces el modal tarda más, aumenté los timeouts
        await this.page.waitForSelector('text=Added!', { timeout: 20000 });
        pageLogger.debug('Modal confirmación detectado');

        // Solo cerrar automáticamente si autoContinue es true
        if (autoContinue) {
            await this.page.click('button:has-text("Continue Shopping")');
            await this.page.waitForSelector('.modal-content', { state: 'hidden', timeout: 15000 });
            pageLogger.debug('Modal cerrado automáticamente');
        }
        pageLogger.info(`✓ "${productName}" agregado al carrito exitosamente`);
    }

    async getCartItems(): Promise<CartItem[]> {
        pageLogger.debug('Obteniendo items del carrito');
        await this.goto();

        // TODO: esto es muy frágil, los selectores cambian mucho
        // considerar usar data-testid o algo más estable
        const items = await this.page.evaluate(() => {
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

        pageLogger.debug(`Items encontrados en carrito: ${items.length}`);
        return items;
    }

    async updateQuantity(productName: string, quantity: number) {
        pageLogger.info(`Actualizando cantidad de "${productName}" a ${quantity}`);
        await this.goto();

        // Verificar si el producto ya existe en el carrito
        const currentItems = await this.getCartItems();
        const existingItem = currentItems.find(item => item.product_name.includes(productName));

        if (existingItem) {
            // Si ya existe, removerlo primero
            pageLogger.debug(`Producto existente encontrado, removiendo primero`);
            await this.removeItem(productName);
        }

        // Método optimizado: agregar todos los productos de una vez
        await this.gotoProductCategory('products');
        await this.page.waitForLoadState('domcontentloaded', { timeout: 20000 });
        await this.page.waitForTimeout(1000);

        const productCard = this.page.locator(`.productinfo:has-text("${productName}")`);
        await productCard.waitFor({ state: 'visible', timeout: 10000 });
        pageLogger.debug(`Producto encontrado para actualizar cantidad: ${productName}`);

        // Agregar productos en lotes para ser más eficiente
        const batchSize = Math.min(quantity, 3); // Procesar máximo 3 a la vez
        pageLogger.debug(`Procesando en lotes de ${batchSize}, total: ${quantity}`);

        for (let batch = 0; batch < Math.ceil(quantity / batchSize); batch++) {
            const currentBatch = Math.min(batchSize, quantity - (batch * batchSize));
            pageLogger.debug(`Procesando lote ${batch + 1}, cantidad: ${currentBatch}`);

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
        pageLogger.info(`✓ Cantidad actualizada a ${quantity} para "${productName}"`);
    }

    async removeItem(productName: string) {
        pageLogger.info(`Eliminando producto: "${productName}"`);
        await this.goto();

        // Find the product row in the cart table
        const productRow = this.page.locator(`#cart_info_table tbody tr:has-text("${productName}")`);

        // Click the remove button (cart_quantity_delete)
        const removeButton = productRow.locator('a.cart_quantity_delete');
        if (await removeButton.count() > 0) {
            pageLogger.debug(`Botón de eliminar encontrado para "${productName}"`);
            await removeButton.click();
            // Wait for the page to update
            await this.page.waitForTimeout(1000);
            pageLogger.info(`✓ Producto "${productName}" eliminado del carrito`);
        } else {
            pageLogger.warn(`No se encontró botón de eliminar para "${productName}"`);
        }
    }

    async clearCart() {
        pageLogger.info('Limpiando carrito completo');
        await this.goto();
        // automationexercise.com doesn't have a single "clear cart" button, so we remove items one by one
        const removeButtons = this.page.locator('a.cart_quantity_delete');
        const count = await removeButtons.count();
        pageLogger.debug(`Productos a eliminar: ${count}`);

        for (let i = 0; i < count; i++) {
            await removeButtons.first().click();
            await this.page.waitForTimeout(1000); // Wait for removal
        }
        pageLogger.info(`✓ Carrito limpiado, ${count} productos eliminados`);
    }

    async getCartTotal(): Promise<number> {
        pageLogger.debug('Calculando total del carrito');
        await this.goto();

        // Calculate total from individual items (most reliable method)
        const items = await this.getCartItems();
        const calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        pageLogger.debug(`Total calculado desde items: $${calculatedTotal}`);

        // If we have items, return the calculated total
        if (calculatedTotal > 0) {
            pageLogger.debug(`Total final: $${calculatedTotal}`);
            return calculatedTotal;
        }

        // Fallback: Try to find total in the page
        let total = 0;
        pageLogger.debug('Usando método fallback para calcular total');

        // Method 1: Look for total in the cart table
        const totalElement = this.page.locator('#cart_info_table tbody tr:last-child td:last-child');
        if (await totalElement.count() > 0) {
            const totalText = await totalElement.textContent();
            total = parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0');
            pageLogger.debug(`Total encontrado en tabla: $${total}`);
        }

        // Method 2: Look for total in a different location
        if (total === 0) {
            const altTotalElement = this.page.locator('text=/Total.*\\$[0-9]+/');
            if (await altTotalElement.count() > 0) {
                const totalText = await altTotalElement.textContent();
                total = parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0');
                pageLogger.debug(`Total encontrado en ubicación alternativa: $${total}`);
            }
        }

        pageLogger.debug(`Total final calculado: $${total}`);
        return total;
    }

    async getItemCount(): Promise<number> {
        pageLogger.debug('Contando items en el carrito');
        await this.goto();
        // Check if cart is empty first
        const isEmpty = await this.page.locator('text=Cart is empty!').isVisible();
        if (isEmpty) {
            pageLogger.debug('Carrito está vacío');
            return 0;
        }

        // Count items in cart table
        const items = await this.page.locator('#cart_info_table tbody tr').count();
        pageLogger.debug(`Items en carrito: ${items}`);
        return items;
    }

    async isCartEmpty(): Promise<boolean> {
        pageLogger.debug('Verificando si el carrito está vacío');
        await this.goto();
        const emptyMessage = await this.page.locator('text=Cart is empty!').isVisible();
        pageLogger.debug(`Carrito vacío: ${emptyMessage}`);
        return emptyMessage;
    }
}
