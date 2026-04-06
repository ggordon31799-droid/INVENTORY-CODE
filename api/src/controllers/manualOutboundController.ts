import { Request, Response, NextFunction } from 'express';
import * as outboundService from '../services/manualOutboundService';

export async function confirmOutbound(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await outboundService.confirmOutbound(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listOutbound(req: Request, res: Response, next: NextFunction) {
  try {
    const { outbound_type, page, limit } = req.query;
    const result = await outboundService.listOutbound({
      outbound_type: outbound_type as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getOutbound(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await outboundService.getOutbound(Number(req.params.id));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateClaimStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await outboundService.updateClaimStatus(Number(req.params.id), req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function applyCredit(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await outboundService.applyCredit(Number(req.params.id), req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getDamagedReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query;
    const result = await outboundService.getDamagedReport({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}
