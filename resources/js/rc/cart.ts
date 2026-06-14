import { safeGetItem, safeSetItem } from './storage';
import type { Product } from './mock';

export type CartItem = {
    productId: string;
    qty: number;
};

const CART_KEY = 'rc_cart';

function parseCart(raw: string | null): CartItem[] {
    if (!raw) return [];
    try {
        const data = JSON.parse(raw);
        if (!Array.isArray(data)) return [];
        return data
            .filter(
                (x): x is CartItem =>
                    !!x &&
                    typeof x === 'object' &&
                    typeof (x as any).productId === 'string' &&
                    typeof (x as any).qty === 'number',
            )
            .map((x) => ({ productId: x.productId, qty: Math.max(1, x.qty) }));
    } catch {
        return [];
    }
}

export function getCart(): CartItem[] {
    return parseCart(safeGetItem(CART_KEY));
}

export function setCart(items: CartItem[]) {
    safeSetItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('rc_cart_changed'));
}

export function addToCart(product: Product, qty = 1) {
    const cart = getCart();
    const idx = cart.findIndex((x) => x.productId === product.id);
    if (idx >= 0) cart[idx] = { ...cart[idx], qty: cart[idx].qty + qty };
    else cart.push({ productId: product.id, qty });
    setCart(cart);
}

export function removeFromCart(productId: string) {
    setCart(getCart().filter((x) => x.productId !== productId));
}

export function updateQty(productId: string, qty: number) {
    const next = getCart().map((x) =>
        x.productId === productId ? { ...x, qty: Math.max(1, qty) } : x,
    );
    setCart(next);
}

export function clearCart() {
    setCart([]);
}

export function cartCount(): number {
    return getCart().reduce((acc, x) => acc + x.qty, 0);
}
