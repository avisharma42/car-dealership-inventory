export const VEHICLE_CATEGORIES = ['sedan', 'suv', 'truck', 'coupe', 'hatchback', 'van'] as const;

export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  category: VehicleCategory;
  price: number;
  quantity: number;
}

export interface VehicleInput {
  make: string;
  model: string;
  category: VehicleCategory;
  price: number;
  quantity: number;
}

export interface SearchFilters {
  make?: string;
  model?: string;
  category?: VehicleCategory | '';
  minPrice?: string;
  maxPrice?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
