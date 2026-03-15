import { useState, useEffect } from 'react';
import type {
  LearningProgressData,
  ActivityData,
  ContentPerformanceData,
  OrgUsersPerformanceData,
} from '../types/admin';
import api from '../api/client';

export function useAdminLearningProgress(orgId: string, startDate?: string, endDate?: string) {
  const [data, setData] = useState<LearningProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const response = await api.get(`/admin/org/${orgId}/learning?${params.toString()}`);
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (orgId) fetchData();
  }, [orgId, startDate, endDate]);

  return { data, loading, error };
}

export function useAdminActivity(orgId: string, startDate?: string, endDate?: string) {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const response = await api.get(`/admin/org/${orgId}/activity?${params.toString()}`);
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (orgId) fetchData();
  }, [orgId, startDate, endDate]);

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (difficulty) params.append('difficulty', difficulty);
        if (category) params.append('category', category);

        const response = await api.get(`/admin/org/${orgId}/scenarios?${params.toString()}`);
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (orgId) fetchData();
  }, [orgId, startDate, endDate, difficulty, category]);

  return { data, loading, error };
}

export function useOrgUsersPerformance(orgId: string, startDate?: string, endDate?: string) {
  const [data, setData] = useState<OrgUsersPerformanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const response = await api.get(`/admin/org/${orgId}/users?${params.toString()}`);
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (orgId) fetchData();
  }, [orgId, startDate, endDate]);

  return { data, loading, error };
}
