export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'lider' | 'salon';
    leader_id?: number | null;
    leader?: { id: number; name: string; email: string } | null;
    email_verified_at?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
};
