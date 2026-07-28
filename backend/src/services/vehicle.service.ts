import { Op, WhereOptions } from 'sequelize';
import { HttpError } from '../middleware/errors';
import { Vehicle, VehicleCategory } from '../models';
import type { InferAttributes } from 'sequelize';

export interface CreateVehicleInput {
  make: string;
  model: string;
  category: VehicleCategory;
  price: number;
  quantity?: number;
}

export type UpdateVehicleInput = Partial<CreateVehicleInput>;

export interface SearchVehicleFilters {
  make?: string;
  model?: string;
  category?: VehicleCategory;
  minPrice?: number;
  maxPrice?: number;
}

const findOrFail = async (id: string): Promise<Vehicle> => {
  const vehicle = await Vehicle.findByPk(id);
  if (!vehicle) {
    throw new HttpError(404, 'Vehicle not found');
  }
  return vehicle;
};

export const create = (input: CreateVehicleInput): Promise<Vehicle> => Vehicle.create(input);

export const list = (): Promise<Vehicle[]> => Vehicle.findAll({ order: [['createdAt', 'DESC']] });

export const search = (filters: SearchVehicleFilters): Promise<Vehicle[]> => {
  const where: WhereOptions<InferAttributes<Vehicle>> = {};

  if (filters.make) where.make = { [Op.iLike]: `%${filters.make}%` };
  if (filters.model) where.model = { [Op.iLike]: `%${filters.model}%` };
  if (filters.category) where.category = filters.category;

  const price = {
    ...(filters.minPrice !== undefined && { [Op.gte]: filters.minPrice }),
    ...(filters.maxPrice !== undefined && { [Op.lte]: filters.maxPrice }),
  };
  if (Object.getOwnPropertySymbols(price).length > 0) where.price = price;

  return Vehicle.findAll({ where, order: [['createdAt', 'DESC']] });
};

export const update = async (id: string, input: UpdateVehicleInput): Promise<Vehicle> => {
  const vehicle = await findOrFail(id);
  return vehicle.update(input);
};

export const remove = async (id: string): Promise<void> => {
  const vehicle = await findOrFail(id);
  await vehicle.destroy();
};
