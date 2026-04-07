import type { UserDoc } from '../models/User.js';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends UserDoc {}
  }
}

export {};
