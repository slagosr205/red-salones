import axios from 'axios';

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
  createdAt?: string;
};

let activePromotionsCache: Promotion[] = [];

export interface PromotionProduct {
  id: string;
  name: string;
  brand: string | null;
  price: number;
  image: string | null;
}

export interface PromotionWithProducts extends Promotion {
  products: PromotionProduct[];
}

export async function fetchActivePromotionsWithProducts(): Promise<PromotionWithProducts[]> {
  try {
    const res = await axios.get('/api/promociones-activas-con-productos');
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

export async function refreshActivePromotions(): Promise<Promotion[]> {
  try {
    const res = await fetch('/api/promociones-activas');
    const data = await res.json();
    activePromotionsCache = Array.isArray(data) ? data : [];
  } catch {
    activePromotionsCache = [];
  }
  window.dispatchEvent(new Event('rc_promotions_changed'));
  return activePromotionsCache;
}

export function getActivePromotions(): Promotion[] {
  return activePromotionsCache;
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

export async function fetchPromotions(): Promise<Promotion[]> {
  const res = await axios.get('/api/promociones');
  return (res.data as any[]).map((p: any) => ({
    id: String(p.id),
    name: p.name,
    type: p.type,
    value: Number(p.value),
    startDate: p.start_date,
    endDate: p.end_date,
    active: p.active,
    productIds: (p.articles ?? []).map((a: any) => 'art-' + a.id),
    createdAt: p.created_at,
  }));
}

export async function createPromotion(data: {
  name: string;
  type: PromoType;
  value: number;
  startDate: string;
  endDate: string;
  active: boolean;
  target_role?: string;
  article_ids: number[];
}): Promise<Promotion> {
  const res = await axios.post('/api/promociones', {
    name: data.name,
    type: data.type,
    value: data.value,
    start_date: data.startDate,
    end_date: data.endDate,
    active: data.active,
    target_role: data.target_role || null,
    article_ids: data.article_ids,
  });
  return res.data;
}

export async function updatePromotion(
  id: string | number,
  data: {
    name: string;
    type: PromoType;
    value: number;
    startDate: string;
    endDate: string;
    active: boolean;
    target_role?: string;
    article_ids: number[];
  },
): Promise<Promotion> {
  const res = await axios.put(`/api/promociones/${id}`, {
    name: data.name,
    type: data.type,
    value: data.value,
    start_date: data.startDate,
    end_date: data.endDate,
    active: data.active,
    target_role: data.target_role || null,
    article_ids: data.article_ids,
  });
  return res.data;
}

export async function deletePromotion(id: string | number): Promise<void> {
  await axios.delete(`/api/promociones/${id}`);
}

export async function togglePromotion(id: string | number): Promise<void> {
  await axios.post(`/api/promociones/${id}/toggle`);
}
