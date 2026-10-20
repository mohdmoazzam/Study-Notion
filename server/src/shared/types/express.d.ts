import type { AuthUser } from "./auth";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
      // The unparsed JSON body, kept for verifying webhook signatures.
      rawBody?: Buffer;
    }
  }
}

export {};
