/**
 * Type definitions for the shopping cart testing suite
 */

export interface CartItem {
    id?: number;
    product_name: string;
    price: number;
    quantity: number;
    created_at?: string;
}

export interface CartSummary {
    itemCount: number;
    subtotal: number;
    tax?: number;
    shipping?: number;
    total: number;
}

export interface DatabaseConfig {
    path: string;
    timeout?: number;
    verbose?: boolean;
}

export interface TestConfig {
    headless: boolean;
    slowMo: number;
    video: boolean;
    screenshot: boolean;
    baseURL: string;
}

export type CartOperation = 'add' | 'update' | 'remove' | 'clear';

export interface CartOperationResult {
    success: boolean;
    message: string;
    item?: CartItem;
    error?: Error;
}
