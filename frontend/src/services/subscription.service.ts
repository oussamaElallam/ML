import { apiClient } from './api';
import type { Subscription, SubscriptionPlan, UsageTracking } from '../types';

export class SubscriptionService {
  async getCurrentSubscription(): Promise<Subscription | null> {
    const response = await apiClient.get<Subscription>('/subscription');
    return response.data || null;
  }

  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await apiClient.get<SubscriptionPlan[]>('/subscription/plans');
    return response.data!;
  }

  async createCheckoutSession(planId: string): Promise<{ sessionId: string; url: string }> {
    const response = await apiClient.post<{ sessionId: string; url: string }>(
      '/subscription/create-checkout',
      { planId }
    );
    return response.data!;
  }

  async createPortalSession(): Promise<{ url: string }> {
    const response = await apiClient.post<{ url: string }>('/subscription/create-portal-session');
    return response.data!;
  }

  async cancelSubscription(): Promise<Subscription> {
    const response = await apiClient.post<Subscription>('/subscription/cancel');
    return response.data!;
  }

  async getCurrentUsage(): Promise<UsageTracking> {
    const response = await apiClient.get<UsageTracking>('/subscription/usage');
    return response.data!;
  }

  async getPaymentHistory(): Promise<any[]> {
    const response = await apiClient.get<any[]>('/subscription/payment-history');
    return response.data!;
  }
}

export const subscriptionService = new SubscriptionService();
