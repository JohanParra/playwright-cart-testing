// Configuración básica del proyecto
// TODO: mover esto a .env cuando tengamos más configs

export const config = {
    baseUrl: process.env.BASE_URL || 'https://automationexercise.com',
    headless: process.env.HEADLESS !== 'false',
    slowMo: parseInt(process.env.SLOW_MO || '0'),

    // Timeouts en ms
    timeouts: {
        default: 30000,
        navigation: 60000,
    },

    // DB config
    dbPath: process.env.DB_PATH || './cart-test.db',

    // Precios hardcoded (deberían venir de una API pero esto funciona)
    productPrices: {
        'Blue Top': 500,
        'Men Tshirt': 400,
        'Stylish Dress': 600,
        'Beautiful Peacock': 300,
        'Sleeveless Dress': 800
    }
};

