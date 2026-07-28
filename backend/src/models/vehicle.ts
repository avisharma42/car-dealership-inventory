import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';

export const VEHICLE_CATEGORIES = ['sedan', 'suv', 'truck', 'coupe', 'hatchback', 'van'] as const;
export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

export class Vehicle extends Model<InferAttributes<Vehicle>, InferCreationAttributes<Vehicle>> {
  declare id: CreationOptional<string>;
  declare make: string;
  declare model: string;
  declare category: VehicleCategory;
  declare price: number;
  declare quantity: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  toJSON() {
    const raw = super.toJSON() as Record<string, unknown>;
    // DECIMAL comes back from pg as a string; expose it as a number for API consumers.
    return { ...raw, price: Number(raw.price) };
  }
}

Vehicle.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    make: { type: DataTypes.STRING, allowNull: false },
    model: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.ENUM(...VEHICLE_CATEGORIES), allowNull: false },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0 } },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'vehicles', modelName: 'Vehicle' },
);
