import { Router } from 'express';
import { authRouter } from './auth.routes';
import { vehicleRouter } from './vehicle.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/vehicles', vehicleRouter);
