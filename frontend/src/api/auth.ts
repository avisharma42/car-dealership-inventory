import { api } from './client';
import type { AuthResponse } from '../types';

export const registerRequest = async (payload: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> => (await api.post<AuthResponse>('/auth/register', payload)).data;

export const loginRequest = async (payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> => (await api.post<AuthResponse>('/auth/login', payload)).data;
