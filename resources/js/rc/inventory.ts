import { products, type Product } from './mock';
import { safeGetItem, safeSetItem } from './storage';

const INV_KEY = 'rc_inventory';
const MOV_KEY = 'rc_inventory_movements';

export type InventoryItem = {
  productId: string;
  name: string;
  category: string;
  brand: string;
  stock: number;
  minStock: number;
  price: number;
};

export type MovementType = 'entry' | 'sale' | 'adjustment';

export type StockMovement = {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  qty: number;
  stockBefore: number;
  stockAfter: number;
  date: string;
  note?: string;
};

function defaultInventory(): InventoryItem[] {
  return products.map((p) => ({
    productId: p.id,
    name: p.name,
    category: p.category,
    brand: p.brand,
    stock: 0,
    minStock: 10,
    price: p.price,
  }));
}

function parseInventory(raw: string | null): InventoryItem[] {
  if (!raw) return defaultInventory();
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return defaultInventory();
    return data.filter(
      (x: any) => x && typeof x.productId === 'string' && typeof x.stock === 'number',
    );
  } catch {
    return defaultInventory();
  }
}

function parseMovements(raw: string | null): StockMovement[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function getInventory(): InventoryItem[] {
  return parseInventory(safeGetItem(INV_KEY));
}

export function setInventory(items: InventoryItem[]) {
  safeSetItem(INV_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('rc_inventory_changed'));
}

export function getMovements(): StockMovement[] {
  return parseMovements(safeGetItem(MOV_KEY));
}

function setMovements(movements: StockMovement[]) {
  safeSetItem(MOV_KEY, JSON.stringify(movements));
}

function addMovement(m: Omit<StockMovement, 'id'>) {
  const all = getMovements();
  const id = `mov-${Math.random().toString(16).slice(2, 10)}`;
  all.unshift({ ...m, id });
  setMovements(all.slice(0, 500));
}

export function findInventoryItem(productId: string): InventoryItem | undefined {
  return getInventory().find((i) => i.productId === productId);
}

export function addEntry(productId: string, qty: number, note?: string) {
  const items = getInventory();
  const idx = items.findIndex((i) => i.productId === productId);
  if (idx < 0) return;

  const before = items[idx].stock;
  items[idx] = { ...items[idx], stock: before + qty };
  setInventory(items);

  addMovement({
    productId,
    productName: items[idx].name,
    type: 'entry',
    qty,
    stockBefore: before,
    stockAfter: items[idx].stock,
    date: new Date().toISOString(),
    note,
  });
}

export function deductStock(productId: string, qty: number, note?: string): boolean {
  const items = getInventory();
  const idx = items.findIndex((i) => i.productId === productId);
  if (idx < 0) return false;

  const before = items[idx].stock;
  if (before < qty) return false;

  items[idx] = { ...items[idx], stock: before - qty };
  setInventory(items);

  addMovement({
    productId,
    productName: items[idx].name,
    type: 'sale',
    qty: -qty,
    stockBefore: before,
    stockAfter: items[idx].stock,
    date: new Date().toISOString(),
    note,
  });

  return true;
}

export function setMinStock(productId: string, min: number) {
  const items = getInventory();
  const idx = items.findIndex((i) => i.productId === productId);
  if (idx < 0) return;
  items[idx] = { ...items[idx], minStock: Math.max(0, min) };
  setInventory(items);
}

export function getCategories(): string[] {
  return Array.from(new Set(getInventory().map((i) => i.category))).sort();
}

export function getCriticalItems(): InventoryItem[] {
  return getInventory().filter((i) => i.stock <= i.minStock && i.stock > 0);
}

export function getOutOfStockItems(): InventoryItem[] {
  return getInventory().filter((i) => i.stock === 0);
}

export function getRecentMovements(n: number = 10): StockMovement[] {
  return getMovements().slice(0, n);
}

export function resetInventory() {
  safeSetItem(INV_KEY, JSON.stringify(defaultInventory()));
  safeSetItem(MOV_KEY, JSON.stringify([]));
  window.dispatchEvent(new Event('rc_inventory_changed'));
}

export function initializeInventory() {
  const existing = safeGetItem(INV_KEY);
  if (!existing) {
    const items = defaultInventory().map((i) => ({
      ...i,
      stock: Math.floor(Math.random() * 30) + 5,
      minStock: 10,
    }));
    safeSetItem(INV_KEY, JSON.stringify(items));
  }
}
