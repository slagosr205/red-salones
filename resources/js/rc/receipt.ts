import { safeGetItem, safeSetItem } from './storage';

export type ReceiptConfig = {
    companyName: string;
    phone: string;
    address: string;
    email: string;
};

const CONFIG_KEY = 'rc_receipt_config';

const defaults: ReceiptConfig = {
    companyName: 'Red Comercial de Salones',
    phone: '+504 9999-9999',
    address: 'Tegucigalpa, Honduras',
    email: 'info@redcomercial.hn',
};

export function getReceiptConfig(): ReceiptConfig {
    const raw = safeGetItem(CONFIG_KEY);
    if (!raw) return { ...defaults };
    try {
        return { ...defaults, ...JSON.parse(raw) };
    } catch {
        return { ...defaults };
    }
}

export function saveReceiptConfig(cfg: ReceiptConfig) {
    safeSetItem(CONFIG_KEY, JSON.stringify(cfg));
}

export function resetReceiptConfig() {
    safeSetItem(CONFIG_KEY, JSON.stringify(defaults));
}
