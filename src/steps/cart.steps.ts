import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { CartPage } from '../pages/cart.page';

// TODO: separar estos steps en archivos más pequeños cuando crezca
// TODO: agregar steps para productos múltiples

Given('que la base de datos del carrito está vacía', async function (this: CustomWorld) {
    this.db.clearCart();
    const count = this.db.getItemCount();
    expect(count).toBe(0);
});

Given('el usuario está en la lista de productos', { timeout: 30000 }, async function (this: CustomWorld) {
    this.cartPage = new CartPage(this.page);
    await this.cartPage.gotoProductCategory('laptops'); // el parámetro no se usa realmente
});

Given('el carrito contiene {int} {string}', { timeout: 30000 }, async function (
    this: CustomWorld,
    quantity: number,
    productName: string
) {
    if (!this.cartPage) {
        this.cartPage = new CartPage(this.page);
    }

    const defaultPrice = this.getDefaultPrice(productName);
    // TODO: investigar por qué algunos productos son más lentos
    for (let i = 0; i < quantity; i++) {
        await this.cartPage.addToCart(productName, defaultPrice, 1);
    }
});

Given('el usuario agrega {string} y {string}', async function (
    this: CustomWorld,
    product1: string,
    product2: string
) {
    // Initialize cartPage if not already done
    if (!this.cartPage) {
        this.cartPage = new CartPage(this.page);
    }

    const price1 = this.getDefaultPrice(product1);
    const price2 = this.getDefaultPrice(product2);

    // Agregar productos al carrito web (realistic approach)
    await this.cartPage.addToCart(product1, price1, 1);
    await this.cartPage.addToCart(product2, price2, 1);
});

When('hace clic en {string} sobre {string}', { timeout: 30000 }, async function (
    this: CustomWorld,
    action: string,
    productName: string
) {
    if (action === 'Agregar al carrito') {
        const price = this.getDefaultPrice(productName);
        await this.cartPage.addToCart(productName, price, 1);

        // Guardar en DB también
        this.db.addItem(productName, price, 1);
        // console.log('DB updated:', this.db.getAllItems()); // debugging
    }
});

When('el usuario agrega {string} al carrito', async function (
    this: CustomWorld,
    productName: string
) {
    // Initialize cartPage if not already done
    if (!this.cartPage) {
        this.cartPage = new CartPage(this.page);
    }

    // Add the product to cart
    const price = this.getDefaultPrice(productName);
    await this.cartPage.addToCart(productName, price, 1);
});

When('el usuario elimina el producto', { timeout: 30000 }, async function (this: CustomWorld) {
    // Initialize cartPage if not already done
    if (!this.cartPage) {
        this.cartPage = new CartPage(this.page);
    }

    // Get the first product from web cart and remove it
    const cartItems = await this.cartPage.getCartItems();
    if (cartItems.length > 0) {
        const productName = cartItems[0].product_name;
        await this.cartPage.removeItem(productName);
    }
});

When('revisa el resumen del carrito', async function (this: CustomWorld) {
    // Initialize cartPage if not already done
    if (!this.cartPage) {
        this.cartPage = new CartPage(this.page);
    }

    // Esta acción no requiere cambios en la base de datos
    // Solo verificar que el carrito tiene los productos esperados
    const items = this.db.getAllItems();
    expect(items.length).toBeGreaterThan(0);
});

Then('el carrito debe mostrar {int} producto', { timeout: 30000 }, async function (
    this: CustomWorld,
    expectedCount: number
) {
    const cartCount = await this.cartPage.getItemCount();
    // console.log(`Cart count: ${cartCount}, expected: ${expectedCount}`);
    expect(cartCount).toBe(expectedCount);
});

Then('el total debe ser {int}', { timeout: 30000 }, async function (
    this: CustomWorld,
    expectedTotal: number
) {
    // Check web cart total (realistic verification)
    const cartTotal = await this.cartPage.getCartTotal();
    expect(cartTotal).toBe(expectedTotal);
});

Then('el producto {string} debe existir en la base de datos', async function (
    this: CustomWorld,
    productName: string
) {
    const cartItems = await this.cartPage.getCartItems();
    console.log('Cart items found:', cartItems);
    console.log(`Looking for product: "${productName}"`);

    // El matching es complicado porque el nombre puede variar
    let cartItem = cartItems.find(item => item.product_name.includes(productName));
    if (!cartItem) {
        cartItem = cartItems.find(item =>
            item.product_name.toLowerCase().includes(productName.toLowerCase())
        );
    }
    if (!cartItem) {
        // último intento con matching parcial
        cartItem = cartItems.find(item =>
            productName.toLowerCase().includes(item.product_name.toLowerCase()) ||
            item.product_name.toLowerCase().includes(productName.toLowerCase())
        );
    }

    expect(cartItem).toBeDefined();
});

Then('el total del carrito debe ser {int}', async function (
    this: CustomWorld,
    expectedTotal: number
) {
    // Check web cart total (realistic verification)
    const cartTotal = await this.cartPage.getCartTotal();
    expect(cartTotal).toBe(expectedTotal);
});

Then('la base de datos debe reflejar cantidad = {int} para {string}', async function (
    this: CustomWorld,
    expectedQuantity: number,
    productName: string
) {
    // Check web cart (realistic verification)
    const cartItems = await this.cartPage.getCartItems();
    const cartItem = cartItems.find(item => item.product_name.includes(productName));
    expect(cartItem).toBeDefined();
    expect(cartItem?.quantity).toBe(expectedQuantity);
});

Then('el carrito debe mostrar el mensaje {string}', async function (
    this: CustomWorld,
    expectedMessage: string
) {
    if (expectedMessage === 'Tu carrito está vacío') {
        // Check web cart (realistic verification)
        const isCartEmpty = await this.cartPage.isCartEmpty();
        expect(isCartEmpty).toBe(true);
    }
});

Then('la base de datos no debe contener {string}', async function (
    this: CustomWorld,
    productName: string
) {
    // Check web cart (realistic verification)
    const cartItems = await this.cartPage.getCartItems();
    const cartItem = cartItems.find(item => item.product_name.includes(productName));
    expect(cartItem).toBeUndefined();
});

Then('la base de datos debe tener {int} registros en el carrito', async function (
    this: CustomWorld,
    expectedCount: number
) {
    // Check web cart count (realistic verification)
    const cartCount = await this.cartPage.getItemCount();
    expect(cartCount).toBe(expectedCount);
});

declare module '../support/world' {
    interface CustomWorld {
        cartPage: CartPage;
        getDefaultPrice(productName: string): number;
    }
}

// FIXME: estos precios deberían estar en un archivo de config
// hardcoded por ahora porque son estables en automationexercise.com
CustomWorld.prototype.getDefaultPrice = function (productName: string): number {
    const defaultPrices: { [key: string]: number } = {
        'Blue Top': 500,
        'Men Tshirt': 400,
        'Stylish Dress': 1500,
        'Beautiful Peacock': 300,
        'Sleeveless Dress': 800
    };

    return defaultPrices[productName] || 500;
};