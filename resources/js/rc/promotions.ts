import { safeGetItem, safeSetItem } from './storage';
import { products } from './mock';

const PROMO_KEY = 'rc_promotions';

export type PromoType = '2x1' | 'descuento' | 'combo';

export type Promotion = {
  id: string;
  name: string;
  type: PromoType;
  value: number;
  startDate: string;
  endDate: string;
  active: boolean;
  productIds: string[];
  createdAt: string;
};

const defaultPromotions: Promotion[] = [
  {
    id: 'promo-default-1',
    name: '2x1 en Tinte Profesional',
    type: '2x1',
    value: 0,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    active: true,
    productIds: ['p-005'],
    createdAt: '2026-01-01',
  },
  {
    id: 'promo-default-2',
    name: '15% descuento en Shampoo Repair',
    type: 'descuento',
    value: 15,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    active: true,
    productIds: ['p-001'],
    createdAt: '2026-01-01',
  },
  {
    id: 'promo-default-3',
    name: '10% combo en Mascarilla Nutritiva',
    type: 'combo',
    value: 10,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    active: true,
    productIds: ['p-003'],
    createdAt: '2026-01-01',
  },
  {
    id: 'promo-default-4',
    name: '15% descuento en Guantes Nitrilo',
    type: 'descuento',
    value: 15,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    active: true,
    productIds: ['p-008'],
    createdAt: '2026-01-01',
  },
];

function parse(raw: string | null): Promotion[] {
  if (!raw) return defaultPromotions;
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : defaultPromotions;
  } catch {
    return defaultPromotions;
  }
}

export function getPromotions(): Promotion[] {
  return parse(safeGetItem(PROMO_KEY));
}

export function setPromotions(list: Promotion[]) {
  safeSetItem(PROMO_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('rc_promotions_changed'));
}

export function createPromotion(p: Omit<Promotion, 'id' | 'createdAt'>): Promotion {
  const all = getPromotions();
  const promo: Promotion = {
    ...p,
    id: `promo-${Math.random().toString(16).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
  };
  all.push(promo);
  setPromotions(all);
  return promo;
}

export function updatePromotion(id: string, data: Partial<Promotion>) {
  const all = getPromotions();
  const idx = all.findIndex((p) => p.id === id);
  if (idx < 0) return;
  all[idx] = { ...all[idx], ...data };
  setPromotions(all);
}

export function deletePromotion(id: string) {
  setPromotions(getPromotions().filter((p) => p.id !== id));
}

export function togglePromotion(id: string) {
  const all = getPromotions();
  const idx = all.findIndex((p) => p.id === id);
  if (idx < 0) return;
  all[idx] = { ...all[idx], active: !all[idx].active };
  setPromotions(all);
}

export function getActivePromotions(): Promotion[] {
  const now = new Date();
  return getPromotions().filter((p) => {
    if (!p.active) return false;
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    end.setHours(23, 59, 59, 999);
    return now >= start && now <= end;
  });
}

export function getPromotionsForProduct(productId: string): Promotion[] {
  return getActivePromotions().filter(
    (p) => p.productIds.length === 0 || p.productIds.includes(productId),
  );
}

export function getDiscountForProduct(productId: string, price: number, qty: number): number {
  const promos = getPromotionsForProduct(productId);
  let totalDiscount = 0;

  for (const p of promos) {
    if (p.type === '2x1') {
      totalDiscount += Math.floor(qty / 2) * price;
    } else if (p.type === 'descuento' || p.type === 'combo') {
      const rate = p.value > 0 ? p.value / 100 : 0;
      totalDiscount += price * qty * rate;
    }
  }

  return totalDiscount;
}

export function resetPromotions() {
  safeSetItem(PROMO_KEY, JSON.stringify(defaultPromotions));
  window.dispatchEvent(new Event('rc_promotions_changed'));
}
