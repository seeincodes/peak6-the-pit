import { useState, useEffect } from 'react';
import type { LearningProgressData, ActivityData, ContentPerformanceData } from '../types/admin';

// Helper to get auth token - adjust based on your auth system
function getAuthToken(): string | null {
  // Get from localStorage, context, or however your app stores it
  return localStorage.getItem('auth_token');
}

export function useAdminLearningProgress(orgId: string, startDate?: string, endDate?: string) {
  const [data, setData] = useState<LearningProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = getAuthToken();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/admin/org/${orgId}/learning?${params}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch learning progress');
        setData(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (token && orgId) fetchData();
  }, [orgId, startDate, endDate, token]);

  return { data, loading, error };
}

export function useAdminActivity(orgId: string, startDate?: string, endDate?: string) {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = getAuthToken();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/admin/org/${orgId}/activity?${params}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch activity');
        setData(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (token && orgId) fetchData();
  }, [orgId, startDate, endDate, token]);

  return { data, loading, error };
}

export function useAdminContentPerformance(
  orgId: string,
  startDate?: string,
  endDate?: string,
  difficulty?: string,
  category?: string
) {
  const [data, setData] = useState<ContentPerformanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = getAuthToken();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (difficulty) params.append('difficulty', difficulty);
        if (category) params.append('category', category);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/admin/org/${orgId}/scenarios?${params}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch content performance');
        setData(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (token && orgId) fetchData();
  }, [orgId, startDate, endDate, difficulty, category, token]);

  return { data, loading, error };
}
