import type { User } from '@/types';

export const salonLeaderMap: Record<string, string> = {
    'salon@salon.test': 'lider@salon.test',
};

export function getLeaderEmail(user: { email: string; role?: string; leader?: { email: string } | null }): string {
    if (user.leader?.email) return user.leader.email;
    return salonLeaderMap[user.email] ?? user.email;
}
