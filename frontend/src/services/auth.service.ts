import { apiClient } from './api';
import type { LoginCredentials, SignupCredentials, AuthResponse, User } from '../types';

export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    if (response.data?.token) {
      apiClient.setAuthToken(response.data.token);
    }
    return response.data!;
  }

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/signup', credentials);
    if (response.data?.token) {
      apiClient.setAuthToken(response.data.token);
    }
    return response.data!;
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
    apiClient.clearAuthToken();
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data!;
  }

  async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/auth/verify-email', { token });
  }

  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/auth/request-password-reset', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, password: newPassword });
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>('/auth/profile', data);
    return response.data!;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }
}

export const authService = new AuthService();
