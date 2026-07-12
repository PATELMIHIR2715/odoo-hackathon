import type { Role } from '@prisma/client';
import type { AppModule } from '../constants/modules.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        moduleAccess: AppModule[];
      };
    }
  }
}
export {};
