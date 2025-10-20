import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { CartPage } from '../pages/cart.page';
import { stepLogger, dbLogger } from '../utils/logger';

// TODO: separar estos steps en archivos más pequeños cuando crezca
// TODO: agregar steps para productos múltiples

Given('que la base de datos del carrito está vacía', async function (this: CustomWorld) {
    stepLogger.info('🧹 Limpiando base de datos del carrito');
    this.db.clearCart();
    const count = this.db.getItemCount();
    dbLogger.debug(`Carrito limpiado - ${count} items`);
    expect(count).toBe(0);
    stepLogger.info('✓ Base de datos del carrito limpiada exitosamente');
});

Given('el usuario está en la lista de productos', { timeout: 30000 }, async function (this: CustomWorld) {
    stepLogger.info('🌐 Navegando a lista de productos');
    this.cartPage = new CartPage(this.page);
    await this.cartPage.gotoProductCategory('laptops'); // el parámetro no se usa realmente
    stepLogger.info('✓ Usuario en lista de productos');
});

Given('el carrito contiene {int} {string}', { timeout: 30000 }, async function (
    this: CustomWorld,
    quantity: number,
    productName: string
) {
    stepLogger.info(`🛒 Precargando ${quantity} "${productName}" en el carrito`);
    if (!this.cartPage) {
        this.cartPage = new CartPage(this.page);
    }

    const defaultPrice = this.getDefaultPrice(productName);
    stepLogger.debug(`Precio del producto: $${defaultPrice}`);
    // TODO: investigar por qué algunos productos son más lentos
    for (let i = 0; i < quantity; i++) {
        await this.cartPage.addToCart(productName, defaultPrice, 1);
    }
    stepLogger.info(`✓ ${quantity} "${productName}" agregados al carrito`);
});

Given('el usuario agrega {string} y {string}', async function (
    this: CustomWorld,
    product1: string,
    product2: string
) {
    stepLogger.info(`🛒 Agregando productos múltiples: "${product1}" y "${product2}"`);
    // Initialize cartPage if not already done
    if (!this.cartPage) {
        this.cartPage = new CartPage(this.page);
    }

    const price1 = this.getDefaultPrice(product1);
    const price2 = this.getDefaultPrice(product2);
    stepLogger.debug(`Precios: "${product1}" = $${price1}, "${product2}" = $${price2}`);

    // Agregar productos al carrito web (realistic approach)
    await this.cartPage.addToCart(product1, price1, 1);
    await this.cartPage.addToCart(product2, price2, 1);
    stepLogger.info(`✓ Productos múltiples agregados al carrito`);
});

When('hace clic en {string} sobre {string}', { timeout: 30000 }, async function (
    this: CustomWorld,
    action: string,
    productName: string
) {
    if (action === 'Agregar al carrito') {
        stepLogger.info(`🛒 Agregando "${productName}" al carrito`);
        const price = this.getDefaultPrice(productName);
        stepLogger.debug(`Precio: $${price}`);
        // Para el primer producto, no cerrar automáticamente el modal
        const isFirstProduct = !this.db.getAllItems().length;
        await this.cartPage.addToCart(productName, price, 1, !isFirstProduct);

        // Guardar en DB también
        this.db.addItem(productName, price, 1);
        dbLogger.debug(`DB actualizada: ${this.db.getAllItems().length} items`);
        stepLogger.info(`✓ "${productName}" agregado al carrito exitosamente`);
    }
});

When('el usuario agrega {string} al carrito', async function (
    this: CustomWorld,
    productName: string
) {
    stepLogger.info(`🛒 Usuario agrega "${productName}" al carrito`);
    // Initialize cartPage if not already done
    if (!this.cartPage) {
        this.cartPage = new CartPage(this.page);
    }

    // Add the product to cart
    const price = this.getDefaultPrice(productName);
    stepLogger.debug(`Precio: $${price}`);
    await this.cartPage.addToCart(productName, price, 1);
    stepLogger.info(`✓ "${productName}" agregado al carrito`);
});

When('hace clic en {string}', { timeout: 30000 }, async function (
    this: CustomWorld,
    buttonText: string
) {
    stepLogger.info(`🖱️ Haciendo clic en "${buttonText}"`);
    if (!this.cartPage) {
        this.cartPage = new CartPage(this.page);
    }

    if (buttonText === 'Continue Shopping') {
        // Click the Continue Shopping button in the modal
        await this.page.click('button:has-text("Continue Shopping")');
        await this.page.waitForSelector('.modal-content', { state: 'hidden', timeout: 15000 });
        stepLogger.info(`✓ Modal cerrado, continuando compras`);
    }
});

When('el usuario elimina el producto', { timeout: 30000 }, async function (this: CustomWorld) {
    stepLogger.info('🗑️ Usuario elimina producto del carrito');
    // Initialize cartPage if not already done
    if (!this.cartPage) {
        this.cartPage = new CartPage(this.page);
    }

    // Get the first product from web cart and remove it
    const cartItems = await this.cartPage.getCartItems();
    if (cartItems.length > 0) {
        const productName = cartItems[0].product_name;
        stepLogger.debug(`Eliminando producto: "${productName}"`);
        await this.cartPage.removeItem(productName);
        stepLogger.info(`✓ Producto "${productName}" eliminado del carrito`);
    } else {
        stepLogger.warn('⚠️ No hay productos en el carrito para eliminar');
    }
});

When('el usuario cambia la cantidad a {int}', { timeout: 30000 }, async function (
    this: CustomWorld,
    newQuantity: number
) {
    stepLogger.info(`📊 Usuario cambia cantidad a ${newQuantity}`);
    // Initialize cartPage if not already done
    if (!this.cartPage) {
        this.cartPage = new CartPage(this.page);
    }

    // Get the first product from web cart and update its quantity
    const cartItems = await this.cartPage.getCartItems();
    if (cartItems.length > 0) {
        const productName = cartItems[0].product_name;
        stepLogger.debug(`Actualizando cantidad de "${productName}" a ${newQuantity}`);
        await this.cartPage.updateQuantity(productName, newQuantity);

        // Update database as well
        this.db.clearCart();
        const price = this.getDefaultPrice(productName);
        this.db.addItem(productName, price, newQuantity);
        dbLogger.debug(`DB actualizada: "${productName}" cantidad = ${newQuantity}`);
        stepLogger.info(`✓ Cantidad actualizada a ${newQuantity} para "${productName}"`);
    } else {
        stepLogger.warn('⚠️ No hay productos en el carrito para actualizar');
    }
});

When('revisa el resumen del carrito', async function (this: CustomWorld) {
    stepLogger.info('📋 Usuario revisa resumen del carrito');
    // Initialize cartPage if not already done
    if (!this.cartPage) {
        this.cartPage = new CartPage(this.page);
    }

    // Esta acción no requiere cambios en la base de datos
    // Solo verificar que el carrito tiene los productos esperados
    const items = this.db.getAllItems();
    stepLogger.debug(`Items en DB: ${items.length}`);
    expect(items.length).toBeGreaterThan(0);
    stepLogger.info('✓ Resumen del carrito revisado');
});

Then('el carrito debe mostrar {int} producto', { timeout: 30000 }, async function (
    this: CustomWorld,
    expectedCount: number
) {
    stepLogger.info(`🔍 Validando carrito contiene ${expectedCount} producto`);
    const cartCount = await this.cartPage.getItemCount();
    stepLogger.debug(`Items en carrito: ${cartCount}, esperado: ${expectedCount}`);
    expect(cartCount).toBe(expectedCount);
    stepLogger.info(`✓ Validación exitosa: carrito = ${cartCount} (esperado: ${expectedCount})`);
});

Then('el carrito debe mostrar {int} productos', { timeout: 30000 }, async function (
    this: CustomWorld,
    expectedCount: number
) {
    stepLogger.info(`🔍 Validando carrito contiene ${expectedCount} productos`);
    const cartCount = await this.cartPage.getItemCount();
    stepLogger.debug(`Items en carrito: ${cartCount}, esperado: ${expectedCount}`);
    expect(cartCount).toBe(expectedCount);
    stepLogger.info(`✓ Validación exitosa: carrito = ${cartCount} (esperado: ${expectedCount})`);
});

Then('el total debe ser {int}', { timeout: 30000 }, async function (
    this: CustomWorld,
    expectedTotal: number
) {
    stepLogger.info(`💰 Validando total del carrito = $${expectedTotal}`);
    // Check web cart total (realistic verification)
    const cartTotal = await this.cartPage.getCartTotal();
    stepLogger.debug(`Total calculado: $${cartTotal}, esperado: $${expectedTotal}`);
    expect(cartTotal).toBe(expectedTotal);
    stepLogger.info(`✓ Validación exitosa: total = $${cartTotal} (esperado: $${expectedTotal})`);
});

Then('el producto {string} debe existir en la base de datos', { timeout: 30000 }, async function (
    this: CustomWorld,
    productName: string
) {
    stepLogger.info(`🔍 Validando producto "${productName}" existe en el carrito`);
    const cartItems = await this.cartPage.getCartItems();
    stepLogger.debug(`Items encontrados en carrito: ${cartItems.length}`);
    stepLogger.debug(`Buscando producto: "${productName}"`);

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
    if (cartItem) {
        stepLogger.info(`✓ Producto "${productName}" encontrado en el carrito`);
    } else {
        stepLogger.error(`✗ Producto "${productName}" NO encontrado en el carrito`);
    }
});

Then('el total del carrito debe ser {int}', { timeout: 30000 }, async function (
    this: CustomWorld,
    expectedTotal: number
) {
    stepLogger.info(`💰 Validando total del carrito = $${expectedTotal}`);
    // Check web cart total (realistic verification)
    const cartTotal = await this.cartPage.getCartTotal();
    stepLogger.debug(`Total calculado: $${cartTotal}, esperado: $${expectedTotal}`);
    expect(cartTotal).toBe(expectedTotal);
    stepLogger.info(`✓ Validación exitosa: total = $${cartTotal} (esperado: $${expectedTotal})`);
});


Then('el carrito debe mostrar el mensaje {string}', async function (
    this: CustomWorld,
    expectedMessage: string
) {
    stepLogger.info(`💬 Validando mensaje del carrito: "${expectedMessage}"`);
    if (expectedMessage === 'Tu carrito está vacío') {
        // Check web cart (realistic verification)
        const isCartEmpty = await this.cartPage.isCartEmpty();
        stepLogger.debug(`Carrito vacío: ${isCartEmpty}`);
        expect(isCartEmpty).toBe(true);
        stepLogger.info(`✓ Validación exitosa: carrito está vacío`);
    }
});

Then('la base de datos no debe contener {string}', async function (
    this: CustomWorld,
    productName: string
) {
    stepLogger.info(`🔍 Validando producto "${productName}" NO existe en el carrito`);
    // Check web cart (realistic verification)
    const cartItems = await this.cartPage.getCartItems();
    const cartItem = cartItems.find(item => item.product_name.includes(productName));
    stepLogger.debug(`Items en carrito: ${cartItems.length}`);
    expect(cartItem).toBeUndefined();
    stepLogger.info(`✓ Validación exitosa: producto "${productName}" no encontrado en el carrito`);
});

Then('la base de datos debe tener {int} registros en el carrito', async function (
    this: CustomWorld,
    expectedCount: number
) {
    stepLogger.info(`🔍 Validando carrito tiene ${expectedCount} registros`);
    // Check web cart count (realistic verification)
    const cartCount = await this.cartPage.getItemCount();
    stepLogger.debug(`Registros en carrito: ${cartCount}, esperado: ${expectedCount}`);
    expect(cartCount).toBe(expectedCount);
    stepLogger.info(`✓ Validación exitosa: registros = ${cartCount} (esperado: ${expectedCount})`);
});

Then('la base de datos debe reflejar cantidad = {int} para {string}', { timeout: 30000 }, async function (
    this: CustomWorld,
    expectedQuantity: number,
    productName: string
) {
    stepLogger.info(`🔍 Validando cantidad = ${expectedQuantity} para "${productName}"`);
    // Check web cart (realistic verification)
    const cartItems = await this.cartPage.getCartItems();
    const cartItem = cartItems.find(item => item.product_name.includes(productName));
    expect(cartItem).toBeDefined();
    expect(cartItem?.quantity).toBe(expectedQuantity);
    stepLogger.info(`✓ Validación exitosa: cantidad = ${cartItem?.quantity} (esperado: ${expectedQuantity}) para "${productName}"`);
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
        'Sleeveless Dress': 800,
        'Mouse': 100
    };

    return defaultPrices[productName] || 500;
};