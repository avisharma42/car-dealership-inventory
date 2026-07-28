import { NextFunction, Request, Response } from 'express';
import * as vehicleService from '../services/vehicle.service';
import type { SearchVehicleFilters } from '../services/vehicle.service';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(201).json(await vehicleService.create(req.body));
  } catch (err) {
    next(err);
  }
};

export const list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json(await vehicleService.list());
  } catch (err) {
    next(err);
  }
};

export const search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json(await vehicleService.search(req.query as unknown as SearchVehicleFilters));
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json(await vehicleService.update(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
};

export const purchase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json(await vehicleService.purchase(req.params.id, req.body.qty));
  } catch (err) {
    next(err);
  }
};

export const restock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json(await vehicleService.restock(req.params.id, req.body.qty));
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await vehicleService.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
