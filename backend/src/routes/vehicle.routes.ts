import { Router } from 'express';
import { z } from 'zod';
import * as vehicleController from '../controllers/vehicle.controller';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { VEHICLE_CATEGORIES } from '../models';

const createVehicleSchema = z.object({
  make: z.string().trim().min(1, 'is required'),
  model: z.string().trim().min(1, 'is required'),
  category: z.enum(VEHICLE_CATEGORIES, {
    errorMap: () => ({ message: `must be one of ${VEHICLE_CATEGORIES.join(', ')}` }),
  }),
  price: z.number().nonnegative('must be zero or greater'),
  quantity: z.number().int('must be an integer').nonnegative('must be zero or greater').default(0),
});

const updateVehicleSchema = createVehicleSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field must be provided' },
);

const priceFilter = z
  .string()
  .refine((value) => value.trim() !== '' && !Number.isNaN(Number(value)), 'must be a number')
  .transform(Number)
  .refine((value) => value >= 0, 'must be zero or greater')
  .optional();

const searchVehicleSchema = z.object({
  make: z.string().trim().min(1).optional(),
  model: z.string().trim().min(1).optional(),
  category: z
    .enum(VEHICLE_CATEGORIES, {
      errorMap: () => ({ message: `must be one of ${VEHICLE_CATEGORIES.join(', ')}` }),
    })
    .optional(),
  minPrice: priceFilter,
  maxPrice: priceFilter,
});

export const vehicleRouter = Router();

vehicleRouter.use(requireAuth);

vehicleRouter.post('/', validate(createVehicleSchema), vehicleController.create);
vehicleRouter.get('/', vehicleController.list);
vehicleRouter.get('/search', validate(searchVehicleSchema, 'query'), vehicleController.search);
vehicleRouter.put('/:id', validate(updateVehicleSchema), vehicleController.update);
vehicleRouter.delete('/:id', requireAdmin, vehicleController.remove);
