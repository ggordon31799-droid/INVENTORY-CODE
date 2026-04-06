import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboardService';

export async function getSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await dashboardService.getSummary();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAlerts(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await dashboardService.getAlerts();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const { limit } = req.query;
    const result = await dashboardService.getActivity({
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getTodaysWork(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await dashboardService.getTodaysWork();
    res.json(result);
  } catch (err) {
    next(err);
  }
}
