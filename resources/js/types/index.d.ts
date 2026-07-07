export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'lider' | 'salon';
    client_type?: 'salon' | 'consumidor_final' | null;
    leader_id?: number | null;
    leader?: { id: number; name: string; email: string } | null;
    email_verified_at?: string;
    points_balance?: number;
}

export interface Zone {
    id: number;
    name: string;
    description: string | null;
    created_by: number;
    leaders?: { id: number; name: string; email: string }[];
    leaders_count?: number;
    created_at: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
};
