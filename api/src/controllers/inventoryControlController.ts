import { Request, Response, NextFunction } from 'express';
import * as adjustmentService from '../services/adjustmentService';
import * as cycleCountService from '../services/cycleCountService';
import * as transferService from '../services/transferService';

// --- Adjustments ---

export async function confirmAdjustment(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await adjustmentService.confirmAdjustment(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listAdjustments(req: Request, res: Response, next: NextFunction) {
  try {
    const { product_id, reason, page, limit } = req.query;
    const result = await adjustmentService.listAdjustments({
      product_id: product_id ? Number(product_id) : undefined,
      reason: reason as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAdjustment(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await adjustmentService.getAdjustment(Number(req.params.id));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// --- Cycle Counts ---

export async function createCycleCount(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await cycleCountService.createCycleCount(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listCycleCounts(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, page, limit } = req.query;
    const result = await cycleCountService.listCycleCounts({
      status: status as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getCycleCount(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await cycleCountService.getCycleCount(Number(req.params.id));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateCountLine(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await cycleCountService.updateCountLine(
      Number(req.params.id),
      Number(req.params.lineId),
      req.body
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function reviewCount(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await cycleCountService.reviewCount(Number(req.params.id));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function finalizeCount(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await cycleCountService.finalizeCount(Number(req.params.id), req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// --- Transfers ---

export async function confirmTransfer(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await transferService.confirmTransfer(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listTransfers(req: Request, res: Response, next: NextFunction) {
  try {
    const { product_id, page, limit } = req.query;
    const result = await transferService.listTransfers({
      product_id: product_id ? Number(product_id) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}
