import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../utils/errors';

export function errorHandler(
  err: Error & { code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err);

  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }

  if (err.code === '23505') {
    res.status(409).json({ error: 'A record with that value already exists.' });
    return;
  }

  res.status(500).json({ error: err.message });
}
