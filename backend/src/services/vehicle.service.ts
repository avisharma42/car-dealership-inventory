import { literal, Op, WhereOptions } from 'sequelize';
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

/**
 * Purchase is a single conditional UPDATE (`SET quantity = quantity - :qty WHERE quantity >= :qty`)
 * rather than a read-modify-write inside a transaction. Postgres takes a row lock for the duration
 * of the UPDATE and re-evaluates the predicate against the latest committed row, so concurrent
 * purchases serialize on that row and stock can never be oversold. This is chosen over
 * SELECT ... FOR UPDATE because it needs one round trip and no explicit transaction, while the
 * `vehicles_quantity_non_negative` check constraint backstops the invariant at the schema level.
 * Zero rows updated means the row either does not exist or lacks stock, distinguished by a lookup.
 */
export const purchase = async (id: string, qty: number): Promise<Vehicle> => {
  const [rows] = await Vehicle.update(
    { quantity: literal(`quantity - ${qty}`) as unknown as number },
    { where: { id, quantity: { [Op.gte]: qty } } },
  );

  if (rows === 0) {
    await findOrFail(id);
    throw new HttpError(409, 'Insufficient stock');
  }

  return findOrFail(id);
};

export const restock = async (id: string, qty: number): Promise<Vehicle> => {
  const [rows] = await Vehicle.update(
    { quantity: literal(`quantity + ${qty}`) as unknown as number },
    { where: { id } },
  );

  if (rows === 0) {
    throw new HttpError(404, 'Vehicle not found');
  }

  return findOrFail(id);
};

export const remove = async (id: string): Promise<void> => {
  const vehicle = await findOrFail(id);
  await vehicle.destroy();
};
