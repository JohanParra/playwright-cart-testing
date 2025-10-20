import Database from 'better-sqlite3';
import { CartItem } from '../support/world';
import { dbLogger } from './logger';

// Simple wrapper para SQLite
// TODO: considerar agregar índices si la tabla crece
export class CartDatabase {
    private db: Database.Database;

    constructor(dbPath: string) {
        dbLogger.info(`🗄️ Inicializando base de datos SQLite: ${dbPath}`);
        this.db = new Database(dbPath);
        this.init();
        dbLogger.info('✅ Base de datos SQLite inicializada exitosamente');
    }

    private init() {
        // Schema básico, suficiente por ahora
        const createTableSQL = `
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
        dbLogger.debug(`SQL: ${createTableSQL.trim()}`);
        this.db.exec(createTableSQL);
        dbLogger.debug('Tabla cart_items creada/verificada exitosamente');
    }

    addItem(productName: string, price: number, quantity: number): CartItem {
        // Validaciones básicas
        if (quantity <= 0) {
            throw new Error('Quantity must be greater than zero');
        }
        if (price < 0) {
            throw new Error('Price cannot be negative');
        }

        dbLogger.info(`📝 INSERT: Agregando item a DB: "${productName}", precio: $${price}, cantidad: ${quantity}`);
        const sql = `INSERT INTO cart_items (product_name, price, quantity) VALUES (?, ?, ?)`;
        dbLogger.debug(`SQL: ${sql} | Params: ["${productName}", ${price}, ${quantity}]`);

        const stmt = this.db.prepare(sql);
        const result = stmt.run(productName, price, quantity);

        dbLogger.debug(`Query ejecutada - Filas afectadas: ${result.changes}, ID insertado: ${result.lastInsertRowid}`);
        const item = this.getItemById(result.lastInsertRowid as number)!;
        dbLogger.info(`✅ Item agregado exitosamente con ID: ${item.id}`);
        return item;
    }

    getItemById(id: number): CartItem | undefined {
        const sql = 'SELECT * FROM cart_items WHERE id = ?';
        dbLogger.debug(`SQL: ${sql} | Params: [${id}]`);
        const stmt = this.db.prepare(sql);
        const result = stmt.get(id) as CartItem | undefined;
        dbLogger.debug(`Query ejecutada - Resultado: ${result ? `Item encontrado: "${result.product_name}"` : 'No encontrado'}`);
        return result;
    }

    getItemByName(productName: string): CartItem | undefined {
        const sql = 'SELECT * FROM cart_items WHERE product_name = ?';
        dbLogger.debug(`SQL: ${sql} | Params: ["${productName}"]`);
        const stmt = this.db.prepare(sql);
        const result = stmt.get(productName) as CartItem | undefined;
        dbLogger.debug(`Query ejecutada - Resultado: ${result ? `Item encontrado: "${result.product_name}" (ID: ${result.id})` : 'No encontrado'}`);
        return result;
    }

    getAllItems(): CartItem[] {
        const sql = 'SELECT * FROM cart_items ORDER BY created_at';
        dbLogger.debug(`SQL: ${sql}`);
        const stmt = this.db.prepare(sql);
        const result = stmt.all() as CartItem[];
        dbLogger.debug(`Query ejecutada - ${result.length} items encontrados`);
        return result;
    }

    updateQuantity(productName: string, quantity: number): void {
        if (quantity <= 0) {
            throw new Error('Quantity must be greater than zero');
        }

        dbLogger.info(`📝 UPDATE: Actualizando cantidad en DB: "${productName}" a ${quantity}`);
        const sql = `UPDATE cart_items SET quantity = ? WHERE product_name = ?`;
        dbLogger.debug(`SQL: ${sql} | Params: [${quantity}, "${productName}"]`);

        const stmt = this.db.prepare(sql);
        const result = stmt.run(quantity, productName);

        dbLogger.debug(`Query ejecutada - Filas afectadas: ${result.changes}`);
        if (result.changes === 0) {
            dbLogger.warn(`⚠️ No se encontró producto "${productName}" para actualizar`);
        } else {
            dbLogger.info(`✅ Cantidad actualizada exitosamente para "${productName}"`);
        }
    }

    removeItem(productName: string): void {
        dbLogger.info(`📝 DELETE: Eliminando item de DB: "${productName}"`);
        const sql = 'DELETE FROM cart_items WHERE product_name = ?';
        dbLogger.debug(`SQL: ${sql} | Params: ["${productName}"]`);

        const stmt = this.db.prepare(sql);
        const result = stmt.run(productName);

        dbLogger.debug(`Query ejecutada - Filas eliminadas: ${result.changes}`);
        if (result.changes === 0) {
            dbLogger.warn(`⚠️ No se encontró producto "${productName}" para eliminar`);
        } else {
            dbLogger.info(`✅ Producto "${productName}" eliminado exitosamente`);
        }
    }

    clearCart(): void {
        dbLogger.info('📝 DELETE: Limpiando carrito completo en DB');
        const sql = 'DELETE FROM cart_items';
        dbLogger.debug(`SQL: ${sql}`);

        const result = this.db.exec(sql);
        dbLogger.info('✅ Carrito limpiado exitosamente en DB');
    }

    getCartTotal(): number {
        dbLogger.debug('📊 SELECT: Calculando total del carrito desde DB');
        const items = this.getAllItems();
        const total = items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
        dbLogger.info(`📊 Total calculado desde DB: $${total} (${items.length} items)`);
        return total;
    }

    getItemCount(): number {
        const sql = 'SELECT COUNT(*) as count FROM cart_items';
        dbLogger.debug(`SQL: ${sql}`);
        const stmt = this.db.prepare(sql);
        const result = stmt.get() as { count: number };
        dbLogger.debug(`Query ejecutada - Items en DB: ${result.count}`);
        return result.count;
    }

    close(): void {
        dbLogger.debug('Cerrando conexión a la base de datos');
        this.db.close();
    }
}
