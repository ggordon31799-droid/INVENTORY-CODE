import { Request, Response, NextFunction } from 'express';
import * as poService from '../services/purchaseOrderService';

export async function listPurchaseOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, status, page, limit } = req.query;
    const result = await poService.listPurchaseOrders({
      search: search as string | undefined,
      status: status as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getPurchaseOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const po = await poService.getPurchaseOrder(Number(req.params.id));
    res.json(po);
  } catch (err) {
    next(err);
  }
}

export async function createPurchaseOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const po = await poService.createPurchaseOrder(req.body);
    res.status(201).json(po);
  } catch (err) {
    next(err);
  }
}

export async function updatePurchaseOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const po = await poService.updatePurchaseOrder(Number(req.params.id), req.body);
    res.json(po);
  } catch (err) {
    next(err);
  }
}

export async function closePurchaseOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const po = await poService.closePurchaseOrder(Number(req.params.id));
    res.json(po);
  } catch (err) {
    next(err);
  }
}

export async function confirmReceipt(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await poService.confirmReceipt(Number(req.params.id), req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getReceiptsForPO(req: Request, res: Response, next: NextFunction) {
  try {
    const receipts = await poService.getReceiptsForPO(Number(req.params.id));
    res.json(receipts);
  } catch (err) {
    next(err);
  }
}

export async function getReceipt(req: Request, res: Response, next: NextFunction) {
  try {
    const receipt = await poService.getReceipt(Number(req.params.id));
    res.json(receipt);
  } catch (err) {
    next(err);
  }
}
