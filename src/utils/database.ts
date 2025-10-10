import Database from 'better-sqlite3';
import { CartItem } from '../support/world';

// Simple wrapper para SQLite
// TODO: considerar agregar índices si la tabla crece
export class CartDatabase {
    private db: Database.Database;

    constructor(dbPath: string) {
        this.db = new Database(dbPath);
        this.init();
    }

    private init() {
        // Schema básico, suficiente por ahora
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    }

    addItem(productName: string, price: number, quantity: number): CartItem {
        // Validaciones básicas
        if (quantity <= 0) {
            throw new Error('Quantity must be greater than zero');
        }
        if (price < 0) {
            throw new Error('Price cannot be negative');
        }

        const stmt = this.db.prepare(`
      INSERT INTO cart_items (product_name, price, quantity)
      VALUES (?, ?, ?)
    `);

        const result = stmt.run(productName, price, quantity);
        return this.getItemById(result.lastInsertRowid as number)!;
    }

    getItemById(id: number): CartItem | undefined {
        const stmt = this.db.prepare('SELECT * FROM cart_items WHERE id = ?');
        return stmt.get(id) as CartItem | undefined;
    }

    getItemByName(productName: string): CartItem | undefined {
        const stmt = this.db.prepare('SELECT * FROM cart_items WHERE product_name = ?');
        return stmt.get(productName) as CartItem | undefined;
    }

    getAllItems(): CartItem[] {
        const stmt = this.db.prepare('SELECT * FROM cart_items ORDER BY created_at');
        return stmt.all() as CartItem[];
    }

    updateQuantity(productName: string, quantity: number): void {
        if (quantity <= 0) {
            throw new Error('Quantity must be greater than zero');
        }

        const stmt = this.db.prepare(`
      UPDATE cart_items 
      SET quantity = ? 
      WHERE product_name = ?
    `);

        stmt.run(quantity, productName);
    }

    removeItem(productName: string): void {
        const stmt = this.db.prepare('DELETE FROM cart_items WHERE product_name = ?');
        stmt.run(productName);
    }

    clearCart(): void {
        this.db.exec('DELETE FROM cart_items');
    }

    getCartTotal(): number {
        const items = this.getAllItems();
        return items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    getItemCount(): number {
        const stmt = this.db.prepare('SELECT COUNT(*) as count FROM cart_items');
        const result = stmt.get() as { count: number };
        return result.count;
    }

    close(): void {
        this.db.close();
    }
}
