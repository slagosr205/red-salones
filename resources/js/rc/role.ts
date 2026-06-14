import { useEffect, useState } from 'react';

import { safeGetItem, safeSetItem } from './storage';

export type RcRole = 'admin' | 'lider' | 'salon';

const ROLE_KEY = 'rc_role';

export function getRole(): RcRole {
    const raw = safeGetItem(ROLE_KEY);
    if (raw === 'admin' || raw === 'lider' || raw === 'salon') return raw;
    return 'salon';
}

export function setRole(role: RcRole) {
    safeSetItem(ROLE_KEY, role);
    window.dispatchEvent(new Event('rc_role_changed'));
}

export function useDemoRole(defaultRole?: RcRole): [RcRole, (role: RcRole) => void] {
    const [role, setRoleState] = useState<RcRole>(() => {
        if (typeof window === 'undefined') return defaultRole ?? 'salon';
        return getRole();
    });

    useEffect(() => {
        const onChange = () => setRoleState(getRole());
        window.addEventListener('storage', onChange);
        window.addEventListener('rc_role_changed', onChange);
        return () => {
            window.removeEventListener('storage', onChange);
            window.removeEventListener('rc_role_changed', onChange);
        };
    }, []);

    return [role, (next) => setRole(next)];
}
