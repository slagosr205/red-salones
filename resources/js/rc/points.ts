import { safeGetItem, safeSetItem } from './storage';

export type PointsEvent = {
    id: string;
    date: string;
    type: 'Compra' | 'Canje' | 'Ajuste';
    points: number;
    description: string;
};

export type PointsState = {
    balance: number;
    history: PointsEvent[];
};

function pointsKey(ownerEmail: string): string {
    return `rc_points_lider_${ownerEmail}`;
}

function defaultState(): PointsState {
    return { balance: 0, history: [] };
}

function parse(raw: string | null): PointsState {
    if (!raw) return defaultState();
    try {
        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object') return defaultState();
        const balance = typeof (data as any).balance === 'number' ? (data as any).balance : 0;
        const history = Array.isArray((data as any).history) ? (data as any).history : [];
        return {
            balance,
            history: history
                .filter(
                    (x: any) =>
                        x &&
                        typeof x.id === 'string' &&
                        typeof x.date === 'string' &&
                        typeof x.type === 'string' &&
                        typeof x.points === 'number' &&
                        typeof x.description === 'string',
                )
                .slice(0, 200),
        };
    } catch {
        return defaultState();
    }
}

export function getPointsState(ownerEmail: string): PointsState {
    return parse(safeGetItem(pointsKey(ownerEmail)));
}

export function setPointsState(ownerEmail: string, state: PointsState) {
    safeSetItem(pointsKey(ownerEmail), JSON.stringify(state));
    window.dispatchEvent(new Event('rc_points_changed'));
}

export function addPointsEvent(ownerEmail: string, evt: Omit<PointsEvent, 'id'>) {
    const state = getPointsState(ownerEmail);
    const id = `pe-${Math.random().toString(16).slice(2, 10)}`;
    const next = {
        balance: state.balance + evt.points,
        history: [{ ...evt, id }, ...state.history].slice(0, 200),
    };
    setPointsState(ownerEmail, next);
}
