import { safeGetItem, safeSetItem } from './storage';

export type Notification = {
    id: string;
    message: string;
    time: string;
    timestamp: number;
};

const NOTIF_PREFIX = 'rc_notifications_';

function notifKey(userId: number | string): string {
    return `${NOTIF_PREFIX}${userId}`;
}

export function getNotifications(userId: number | string): Notification[] {
    const raw = safeGetItem(notifKey(userId));
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

export function addNotification(userId: number | string, message: string) {
    const list = getNotifications(userId);
    const notif: Notification = {
        id: `n-${Math.random().toString(16).slice(2, 10)}`,
        message,
        time: 'Ahora',
        timestamp: Date.now(),
    };
    const next = [notif, ...list].slice(0, 50);
    safeSetItem(notifKey(userId), JSON.stringify(next));
    window.dispatchEvent(new Event('rc_notifications_changed'));
}
