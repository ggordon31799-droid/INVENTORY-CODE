import { Request, Response, NextFunction } from 'express';
import * as orderService from '../services/orderService';

export async function listOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, status, source, page, limit } = req.query;
    const result = await orderService.listOrders({
      search: search as string | undefined,
      status: status as string | undefined,
      source: source as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await orderService.getOrder(Number(req.params.id));
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await orderService.createOrder(req.body);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

export async function cancelOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await orderService.cancelOrder(Number(req.params.id));
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function syncOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await orderService.syncOrders();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function resolveLineItem(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderId, lineId } = req.params;
    const { product_id } = req.body;
    const order = await orderService.resolveLineItem(
      Number(orderId),
      Number(lineId),
      Number(product_id)
    );
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function getTodaysOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await orderService.getTodaysOrders();
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

export async function scanLookup(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await orderService.scanLookup(req.query.code as string);
    if (!result) {
      res.status(404).json({ error: 'No matching order found for the given code' });
      return;
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function confirmShipment(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await orderService.confirmShipment(Number(req.params.id), req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function batchShip(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await orderService.batchShip(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getShipmentsForOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const shipments = await orderService.getShipmentsForOrder(Number(req.params.id));
    res.json(shipments);
  } catch (err) {
    next(err);
  }
}
