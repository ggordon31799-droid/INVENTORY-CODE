import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/productService';

export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, status, category, location, page, limit } = req.query;
    const result = await productService.listProducts({
      search: search as string | undefined,
      status: status as string | undefined,
      category: category as string | undefined,
      location: location as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.getProduct(Number(req.params.id));
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.updateProduct(Number(req.params.id), req.body);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function lookupByBarcode(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.lookupByBarcode(req.query.barcode as string);
    if (!product) {
      res.status(404).json({ error: 'Product not found for the given barcode' });
      return;
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function getCostHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query;
    const result = await productService.getCostHistory(Number(req.params.id), {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getLedger(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, event_type } = req.query;
    const result = await productService.getLedger(Number(req.params.id), {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      event_type: event_type as string | undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function addMapping(req: Request, res: Response, next: NextFunction) {
  try {
    const mapping = await productService.addMapping(Number(req.params.id), req.body);
    res.status(201).json(mapping);
  } catch (err) {
    next(err);
  }
}

export async function getMappings(req: Request, res: Response, next: NextFunction) {
  try {
    const mappings = await productService.getMappings(Number(req.params.id));
    res.json(mappings);
  } catch (err) {
    next(err);
  }
}

export async function deleteMapping(req: Request, res: Response, next: NextFunction) {
  try {
    await productService.deleteMapping(Number(req.params.id), Number(req.params.mappingId));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
