import { AuthSession } from "../modules/auth/auth.interface.js";

declare global {
  namespace Express {
    interface Request {
      authSession?: AuthSession;
    }
  }
}

export {};
