import { HttpError } from '../middleware/errors';
import { Vehicle, VehicleCategory } from '../models';

export interface CreateVehicleInput {
  make: string;
  model: string;
  category: VehicleCategory;
  price: number;
  quantity?: number;
}

export type UpdateVehicleInput = Partial<CreateVehicleInput>;

const findOrFail = async (id: string): Promise<Vehicle> => {
  const vehicle = await Vehicle.findByPk(id);
  if (!vehicle) {
    throw new HttpError(404, 'Vehicle not found');
  }
  return vehicle;
};

export const create = (input: CreateVehicleInput): Promise<Vehicle> => Vehicle.create(input);

export const list = (): Promise<Vehicle[]> => Vehicle.findAll({ order: [['createdAt', 'DESC']] });

export const update = async (id: string, input: UpdateVehicleInput): Promise<Vehicle> => {
  const vehicle = await findOrFail(id);
  return vehicle.update(input);
};

export const remove = async (id: string): Promise<void> => {
  const vehicle = await findOrFail(id);
  await vehicle.destroy();
};
