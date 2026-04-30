import { Request, Response } from "express";

export function healthController(_req: Request, res: Response): void {
  res.json({ ok: true });
}
