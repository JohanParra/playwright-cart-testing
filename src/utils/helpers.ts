/**
 * Format currency value to 2 decimal places
 */
export function formatCurrency(value: number): string {
    return value.toFixed(2);
}

/**
 * Calculate total price for a cart item
 */
export function calculateItemTotal(price: number, quantity: number): number {
    return parseFloat((price * quantity).toFixed(2));
}

/**
 * Validate product name
 */
export function isValidProductName(name: string): boolean {
    return name.trim().length > 0;
}

/**
 * Validate price
 */
export function isValidPrice(price: number): boolean {
    return price >= 0 && isFinite(price);
}

/**
 * Validate quantity
 */
export function isValidQuantity(quantity: number): boolean {
    return quantity > 0 && Number.isInteger(quantity);
}

/**
 * Generate timestamp string
 */
export function getTimestamp(): string {
    return new Date().toISOString();
}

/**
 * Wait for a specific duration
 */
export async function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
