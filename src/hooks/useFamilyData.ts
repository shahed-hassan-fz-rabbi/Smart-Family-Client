'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { FamilySummary, FamilyMember } from '@/lib/types';

/**
 * Loads the user's first family + its members. All app pages share this.
 */
export function useFamilyData() {
  const [family, setFamily] = useState<FamilySummary | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [role, setRole] = useState<string>('member');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { families } = await api.get<{ families: FamilySummary[] }>('/families');
      const fam = families[0] ?? null;
      setFamily(fam);
      setRole(fam?.role ?? 'member');
      if (fam) {
        const detail = await api.get<{ members: FamilyMember[] }>(`/families/${fam.id}`);
        setMembers(detail.members);
      } else {
        setMembers([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load family data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { family, members, role, loading, error, reload: load };
}
