import { api } from './client';
import type { SearchFilters, Vehicle, VehicleInput } from '../types';

export const listVehicles = async (): Promise<Vehicle[]> => (await api.get<Vehicle[]>('/vehicles')).data;

export const searchVehicles = async (filters: SearchFilters): Promise<Vehicle[]> => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''),
  );
  return (await api.get<Vehicle[]>('/vehicles/search', { params })).data;
};

export const createVehicle = async (input: VehicleInput): Promise<Vehicle> =>
  (await api.post<Vehicle>('/vehicles', input)).data;

export const updateVehicle = async (id: string, input: Partial<VehicleInput>): Promise<Vehicle> =>
  (await api.put<Vehicle>(`/vehicles/${id}`, input)).data;

export const deleteVehicle = async (id: string): Promise<void> => {
  await api.delete(`/vehicles/${id}`);
};

export const purchaseVehicle = async (id: string, qty = 1): Promise<Vehicle> =>
  (await api.post<Vehicle>(`/vehicles/${id}/purchase`, { qty })).data;

export const restockVehicle = async (id: string, qty = 1): Promise<Vehicle> =>
  (await api.post<Vehicle>(`/vehicles/${id}/restock`, { qty })).data;
