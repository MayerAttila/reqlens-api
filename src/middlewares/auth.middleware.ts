import { NextFunction, Request, Response } from "express";
import { getSession } from "../modules/auth/auth.service.js";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const session = await getSession(req.headers);

  if (!session) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  req.authSession = session;
  next();
}
